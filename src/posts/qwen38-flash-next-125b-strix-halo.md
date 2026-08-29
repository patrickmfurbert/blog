---
title: 'Qwen3.8-Flash-Next on the EVO-X2: 125B Parameters in 96GB of Unified Memory'
description: 'What it took to run a 125B MoE model at 17-25 tok/s on a $3K mini PC — the BIOS carve-out, ROCm 7.2.4 on gfx1151, a llama.cpp grammar bug, and MTP.'
date: '2026-08-28'
tags: ['llm', 'amd', 'rocm', 'llama-cpp', 'ai']
readingTime: '16 min read'
---

In [my last post](/blog/evo-x2-local-llm-rocm) I benchmarked the GMKtec EVO-X2 with two models that fit comfortably in its memory pool: a 27B dense and a 35B MoE. That was the warm-up round — proving the toolchain, the build flags, and the speculative decoding sweep. The real reason I bought the machine was the round after that one.

[Qwen3.8-Flash-Next](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) is a 125-billion-parameter Mixture-of-Experts model with roughly 6 billion parameters active per forward pass. At UD-Q4_K_XL quantization it's about 70GB of weights — more VRAM than exists on any consumer GPU AMD has ever shipped, and more than two and a half 4090s would hold. On the EVO-X2 it loads, it fits, and with a multi-token-prediction sidecar it generates at 17-25 tok/s.

Getting there took a BIOS change, a fork, and a llama.cpp grammar bug that was quietly murdering every tool call I made. Here's the whole thing.

## The Hardware, and Why Size Is the Whole Point

Ryzen AI MAX+ 395 — Strix Halo. 16 Zen 5 cores, 40 RDNA 3.5 compute units, 128GB of LPDDR5X on a 256-bit bus, 120W TDP, no discrete GPU anywhere in the box. The GPU and the CPU address the same physical memory at the same speed.

The interesting property isn't the bandwidth. 256 GB/s is respectable but nowhere near a datacenter HBM part, and for LLM inference memory bandwidth is the speed limit — I did that math in the previous post and it held up. What's unusual is the size of the pool.

Put a 70GB model on a 24GB card and one of two things happens. Either you shard it across three or four GPUs and pay the interconnect tax on every layer boundary, or you spill layers to system RAM across a PCIe link that gives you 64 GB/s of your 256 and throughput falls off a cliff. Every large-model deployment on consumer hardware is an exercise in avoiding that cliff.

Strix Halo doesn't have the cliff. The GPU sees 96GB of memory as VRAM, at full bandwidth, addressed directly. The question stops being "can this model fit" and becomes "which model do I want in here today." That's a genuinely different machine to work with.

The tradeoff is that MoE isn't a workaround on this hardware — it's the requirement. A 256 GB/s bus moves 70GB of weights in about 270ms, which caps dense-model generation near 4 tok/s. You could run a 70B dense model here and it would be unusable. A 125B MoE with 6B active is a different story, because per token you're touching the shared attention weights plus whichever experts the router selected, not the whole 70GB pile. Big pool, modest bandwidth: MoE is the shape of model this hardware was built for.

## BIOS: The 96GB Carve-Out

Out of the box the EVO-X2 gives the GPU a much smaller slice than you want. You have to tell it explicitly.

Reboot, hit `F2` (or `F7` for the boot menu) during POST, then:

```
Advanced → AMD CBS → NBIO Common Options → GFX Configuration
  → UMA Frame Buffer Size   → 96GB
  → IOMMU → Enabled
```

IOMMU on matters if you want unified-memory page fault handling to work — that's what makes `HSA_XNACK=1` below do anything useful.

Why 96 and not the maximum? Because the other 32GB is load-bearing. The OS needs working memory, the file cache wants room, and llama.cpp needs GTT — graphics translation table space, the GPU's window into memory outside its own carve-out — to stage anything at all. At max carve-out you get OOM kills during long-prompt prefill with no useful error message, because the GPU runs out of addressable space before the system runs out of RAM. 96GB carve-out plus ~15.5GB of GTT has been stable for weeks.

One warning: carve-out changes need a cold boot, not a warm restart. Full power cycle or the setting silently doesn't apply. Verify after:

```bash
rocm-smi --showmeminfo vram
```

Kernel args: none — stock defaults, BIOS UMA carve-out does the work.

With the model loaded, here's where the 96GB actually goes:

| Allocation | Size |
|---|---|
| Model weights (UD-Q4_K_XL) | ~70 GB |
| KV cache at 32K context, flash-attn on | ~6 GB |
| MTP draft module | ~2 GB |
| Compute buffers and slack | ~5 GB |
| **Total of 96GB carve-out** | **~83 GB** |

That's the whole model, its cache, and its draft head, with about 13GB of headroom. On a machine that costs less than a single good GPU.

One caveat on the carve-out itself: this static 96GB split works, but it may not be the only way. AMD's own docs suggest GTT-backed shared memory can be more flexible than a fixed UMA carve-out — the pool isn't locked in at boot and can flex with what the workload needs. I'm still investigating whether a GTT-backed setup matches this one for stability and throughput; if it does, expect a follow-up post.

## ROCm 7.2.4 on gfx1151

Nothing to report here, which is the good news. ROCm 7.2.4 on Ubuntu 24.04 detects `gfx1151` natively — no `HSA_OVERRIDE_GFX_VERSION`, no spoofing a gfx1100, no patched runtime. If you're following an older guide that sets an override, the guide predates this hardware.

```bash
rocminfo | grep gfx
```

Build llama.cpp with the same flags I landed on last time:

```bash
cmake -S . -B build \
  -DGGML_HIP=ON \
  -DGPU_TARGETS=gfx1151 \
  -DGGML_HIP_NO_VMM=ON \
  -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -j$(nproc)
```

### The environment variables that matter

Three, and only three:

```bash
export HSA_ENABLE_SDMA=0
export HSA_XNACK=1
export ROCBLAS_USE_HIPBLASLT=1
```

`HSA_ENABLE_SDMA=0` disables the system DMA engine for host-to-device transfers, which hangs on some unified memory configurations. `HSA_XNACK=1` turns on the GPU's page-fault handling mode, required for the GPU to touch memory that hasn't been explicitly copied into its view. Both are stability flags — they don't make things faster, they make them not crash.

`ROCBLAS_USE_HIPBLASLT=1` is the one that reversed itself, and I want to be explicit about it because I said the opposite last time. On the dense 27B, hipBLASLt was a net loss — acceptance rate went up, net throughput went down. On this MoE model it's worth roughly 2-3 tok/s, and the reason is GEMM shape. A dense 27B runs one big wide matrix multiply per layer; hipBLASLt's kernel selection on that shape isn't better than what ROCm already does. A 125B MoE with 6B active runs a swarm of skinny, scattered, expert-selected multiplies — many small GEMVs per layer with gathered weights. That's a shape hipBLASLt has tuned async-Routed kernels for and the default path handles badly.

The lesson generalizes: BLAS backend preference is a per-model decision, not a machine-wide setting. Measure it on the model you're actually running. Don't copy an env block from a blog post — including this one.

## qwen4exp: Why Mainline llama.cpp Couldn't Load the Model

First attempt at loading the GGUF:

```
llama_model_load: error loading model: unknown model architecture: 'qwen4exp'
```

The architecture string in the GGUF metadata is `qwen4exp`, and at time of writing no released llama.cpp build knows what that means. The weights are laid out differently enough from `qwen3moe` — expert routing, the shared-expert split, and the multi-token-prediction heads — that you can't just rename the metadata and get correct output. You get wrong numbers, which is worse.

[EngramHalo.cpp](https://github.com/Aristo94/EngramHalo.cpp) is Aristo94's llama.cpp fork that added `qwen4exp` support ahead of upstream, specifically targeting Strix Halo, plus a [matched MTP sidecar GGUF](https://huggingface.co/EasiiX/Qwen3.8-Flash-Next-MTP-Strix-Halo-GGUF) for the speculative decoding path — the draft heads ship as a separate file rather than baked into the main GGUF, which is why you need `--model-draft` pointing at a second file. I ran the fork for days while waiting on upstream.

That wait is over. [PR #27742](https://github.com/ggml-org/llama.cpp/pull/27742) landed `qwen4exp` in mainline llama.cpp, so the architecture is now supported in the upstream build. I'd still point anyone at the fork if you're on this exact hardware, because the Halo-specific tuning and the matching MTP sidecar workflow are the parts you want. But the fact that a brand-new architecture went from "no released build can load this" to merged upstream in the time it took me to write the last section is worth sitting with. That's the pace of this ecosystem.

One tip from EasiiX, who publishes the MTP sidecar: pull the latest version of the fork. It ships a drop-behind loader that fixes the RAM squeeze during model load — the page-cache pile-up while reading a 70GB GGUF through is exactly the kind of thing a fixed carve-out makes painful.

## The GBNF Bug, or: Why Every Tool Call Took Nine Seconds

This one cost me a full day and I only found it because I was dumb enough to measure.

Symptom: with the model loaded and text generation behaving normally, any turn that involved tool calling paused for several seconds before the first token, and a meaningful fraction of tool calls came back malformed or truncated. Chat was fine. Agentic use was broken.

The cause was in llama.cpp's automatic grammar generation. When you hand `llama-server` a set of tool definitions, it compiles your JSON Schemas into a GBNF grammar and uses that grammar to constrain sampling token by token, so the model physically cannot emit invalid tool JSON. Clever feature. The compiler had two bugs that my tool set happened to trigger.

### Bug 1: zoom_image and the permutation explosion

One of my tools is `zoom_image` — it takes an image path plus several optional parameters with enums and defaults. To encode "each parameter is optional" in GBNF, the converter generated an alternation over parameter *presence and ordering* rather than a flat set of optional keys. JSON objects are unordered, so ordering shouldn't matter — but the grammar enumerated them anyway. With five or six optional parameters that alternation blows up combinatorially. The generated grammar for my tool set came out around 400KB, and applying a 400KB grammar as a per-token mask costs real time on every single token generated. Nine seconds to first token, every tool turn, CPU pegged before the GPU did anything.

Dumping the grammar and looking at it made the problem obvious in about ten seconds, which is ten minutes less than it took me to think to look:

```bash
# write the generated grammar to disk instead of sampling against it
grep -c '^altr' /tmp/grammar.gbnf   # thousands of alternation rules
```

The fix is to deduplicate the alternation — emit each parameter once as an optional key and let the grammar accept any ordering, which is what JSON means anyway.

### Bug 2: maxLength and dangling rule references

The second bug was sneakier. String parameters with a `maxLength` constraint compile into a bounded-length string rule, and the converter emitted a *reference* to that helper rule from inside nested contexts — a property inside an array item, for instance — without emitting the rule itself. Dangling reference, grammar fails to load, tool calls against that schema either error out or fall back to unconstrained sampling and produce JSON the parser can't read. No exception at startup, just broken behavior at the exact moment you need the tool.

Fix: hoist the length-constrained rules to top level so every reference resolves, and emit each unique length bound once.

With both patched, the grammar went from ~400KB to ~14KB, first-token latency on tool-call turns dropped from around nine seconds to about a second, and malformed tool calls went to zero.

The general lesson is one I didn't expect to learn: **your tool schemas are part of your inference configuration.** A bloated schema doesn't just confuse the model, it costs measurable latency through the grammar path. Trim your tool list to what the task needs. Flatten nested objects where you can. If a local model is mysteriously slow or unreliable at tool calling, dump the grammar before you blame the model — it might be the compiler.

## MTP, and the Numbers

Multi-token prediction is worth more on this hardware than on any machine I've tuned before, because the constraint is bandwidth rather than compute: one verification pass costs the same whether you accept one token or three. The main GGUF doesn't carry the draft heads, so point `--model-draft` at the sidecar.

```bash
export HSA_ENABLE_SDMA=0
export HSA_XNACK=1
export ROCBLAS_USE_HIPBLASLT=1

~/EngramHalo.cpp/build/bin/llama-server \
  -m ~/models/qwen38-flash-next/Qwen3.8-Flash-Next-UD-Q4_K_XL.gguf \
  --model-draft ~/models/qwen38-flash-next/Qwen3.8-Flash-Next-MTP.gguf \
  -ngl 99 -c 32768 --flash-attn on --jinja \
  --parallel 1 --threads 16 --reasoning off -fit off --no-ui \
  --spec-type draft-mtp --spec-draft-n-max 3 \
  --host 0.0.0.0 --port 8080
```

Draft depth sweep, 1000-token generation:

| --spec-draft-n-max | tok/s | Acceptance |
|---|---|---|
| none | 13.6 | — |
| 1 | 17.9 | 91.4% |
| 2 | 21.3 | 84.1% |
| 3 | 23.4 | 81.7% |
| **4** | **24.9** | **74.3%** |
| 5 | 24.1 | 68.9% |
| 8 | 21.4 | 55.8% |

This breaks the pattern from my previous post, where depth 1 won on both models. Here depth 3-4 is the sweet spot, and the reason is that the draft is *cheap* on this model and verification is *expensive*. The MTP module is a couple ofGB of draft weights; the thing it's drafting against is 70GB of model. Drafting three extra tokens barely registers on the memory bus, while a verification pass is the dominant cost — so you want to give each verification pass more chances to pay for itself. Acceptance falls from 91% to 74% across the range, but it falls slower than the depth rises, which is the opposite of the dense model I swept before. Same technique, opposite conclusion, because the cost structure flipped.

I run depth 3 rather than the peak 4. Depth 4 is marginally faster on a benchmark and more likely to stall on a rejected batch mid-sentence. Pick the slightly-below-peak setting for anything you actually use.

Prefill, which is what agentic workloads live and die on:

| Context | pp tok/s |
|---|---|
| 512 | 721 |
| 2048 | 604 |
| 8192 | 468 |
| 16384 | 391 |
| 32768 | 327 |

Real-world conversational numbers: 17-25 tok/s generation depending on context length and how lucky the draft acceptance is, and 327-720 tok/s prefill. Sustained under an agent loop that keeps the KV cache warm, it settles around 19-21.

## So What Does It Mean

Qwen3.8-Flash-Next [scores above Claude Opus 4.6 on SWE-bench Verified](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) — that's the published comparison, and it's the one line in this whole post that should matter to anyone watching where this is going. Frontier-class software engineering capability, in a file you can download, on a $3K machine that sits under a desk and draws 120W.

The honest version of what that means is narrower than the tweet version. Per-token, this machine is not competitive with a hosted API — 20 tok/s against 100+ tok/s from a provider is five times slower, and if you're sitting there watching the screen, you will feel it on every single response. Wall-clock per task is worse. Interactive work is worse. My hosted subscriptions aren't going away.

What it's genuinely good at is work you aren't watching. Bulk runs, background jobs, batch refactors across a repo, evaluation sweeps, experiments you'd otherwise ration because they cost money per call. The unit economics change completely when the marginal token costs nothing: run the 125B over an entire codebase overnight and throw away 90% of what it produces, because throwing away tokens is free. No rate limits. No per-token meter. Proprietary code that never leaves the building, which for the systems I work on is not a preference but a requirement.

And the thing I keep coming back to: the capability ceiling and the hardware floor fell at the same time. Two years ago frontier-class coding required a datacenter account. Now it requires a download and a BIOS setting. Whatever the per-token economics say, the fact that the weights exist at all changes who gets to try things.

Set the carve-out to 96GB. Dump your grammar before you blame the model. Measure the BLAS backend on the model you're actually running.

---

*llama.cpp mainline (post-#27742) / EngramHalo.cpp · ROCm 7.2.4 runtime 1.18 · Ubuntu 24.04 · Qwen3.8-Flash-Next UD-Q4_K_XL + MTP sidecar · 2026-08-28*

*Found the grammar bug at 1am by accident. The best bugs are the ones that turn out to be someone else's bug. 🚀*

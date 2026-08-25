---
title: 'Local LLM Inference on the GMKtec EVO-X2: ROCm, llama.cpp, and Real Numbers'
description: 'How I got ROCm 7.2.4 working on gfx1151, built llama.cpp correctly for AMD Strix Halo, and what 67 tok/s on a mini PC actually means.'
date: '2026-08-24'
tags: ['llm', 'amd', 'rocm', 'linux', 'ai']
readingTime: '12 min read'
---

The GMKtec EVO-X2 is a mini PC built around AMD's Ryzen AI Max+ 395 — Strix Halo architecture, 16 Zen 5 cores, 40 RDNA 3.5 compute units, and up to 128GB of unified LPDDR5X that the GPU sees as VRAM. That last part is what makes it interesting for local LLM work: not a discrete GPU with its own VRAM pool, not a laptop throttled to 35W, but a 120W TDP system where both CPU and GPU share the full memory pool at up to 256 GB/s bandwidth.

I bought one. I benchmarked it. Here's what I found.

## The Hardware

My config: Ryzen AI Max+ 395, 128GB LPDDR5X, VRAM carve-out set to 96GB in the BIOS, leaving the remaining ~32GB for the OS with ~15.5GB available as GTT (graphics translation table memory — basically the GPU's window into system RAM).

The GPU reports as `gfx1151` under ROCm. That's important — a lot of existing community benchmarks were run before ROCm had native gfx1151 support and required `HSA_OVERRIDE_GFX_VERSION` hacks to spoof gfx1100. ROCm 7.2.4 detects gfx1151 natively. No spoofing needed.

Why does this matter for LLMs? Model weights have to move from memory to GPU compute units. The speed limit is memory bandwidth. At 256 GB/s shared across everything, this system is fast but fundamentally memory-bound — same as every other LLM inference platform. The difference is the pool is large enough to hold multiple big models simultaneously.

## Getting ROCm Working on Ubuntu 24.04

ROCm has historically been painful on non-standard hardware. Strix Halo is new enough that gfx1151 support landed only recently. The good news: on Ubuntu 24.04 with ROCm 7.2.4, it just works.

Install ROCm following AMD's official repo setup for Ubuntu 24.04, then verify:

```bash
rocminfo | grep gfx
```

You should see `gfx1151` in the output. If you're still seeing a blank or needing `HSA_OVERRIDE_GFX_VERSION`, your ROCm version is too old. Upgrade to 7.2.4.

Two environment variables worth setting for stability (not performance — I'll explain the distinction later):

```bash
export HSA_ENABLE_SDMA=0
export HSA_XNACK=1
```

`HSA_ENABLE_SDMA=0` disables the system DMA engine for host-to-device transfers, which has caused hangs on some unified memory setups. `HSA_XNACK=1` enables the GPU's exception-not-a-kind-of-crash mode for page faults — relevant for unified memory architectures where the GPU may access memory that hasn't been explicitly copied over. Both are stability flags on this hardware, not performance knobs.

## Building llama.cpp

This is where I lost the most time. The build flags matter a lot on gfx1151, and the obvious ones can hurt you.

**What works:**

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -S . -B build \
  -DGGML_HIP=ON \
  -DGPU_TARGETS=gfx1151 \
  -DGGML_HIP_NO_VMM=ON \
  -DGGML_HIP_MMQ_MFMA=ON \
  -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -j$(nproc)
```

**Flag breakdown:**

- `DGGML_HIP=ON` — enables the ROCm/HIP backend. Without this you're running on CPU.
- `DGPU_TARGETS=gfx1151` — compiles kernels specifically for Strix Halo. Don't leave this as the default; you want targeted kernels.
- `DGGML_HIP_NO_VMM=ON` — disables virtual memory management. On unified memory architectures the VMM layer causes problems. This flag bypasses it.
- `DGGML_HIP_MMQ_MFMA=ON` — enables MFMA (Matrix Fused Multiply-Add) instructions for the matrix-multiply quantized kernels. This is a meaningful compute throughput improvement on RDNA 3.5.

**What to avoid:**

`DGGML_HIP_ROCWMMA_FATTN=ON` — I tested this. It cuts prefill performance by 41% on gfx1151. ROCWMMA (the warp-level matrix API) is not the right path for this hardware at this point. Drop it entirely.

`--cache-type-k q8_0` or `--cache-type-v q8_0` with `--flash-attn on` — KV cache quantization and flash attention together cause load failures on ROCm on this hardware. Pick one or leave both at default.

`HSA_OVERRIDE_GFX_VERSION` — not needed on ROCm 7.2.4. If you find a guide telling you to set this, the guide is for an older ROCm version.

Neural draft models (DSpark, DFlash2, etc.) — these look attractive on paper for speculative decoding but share the same memory bus as your main model. The contention costs more than the acceleration gains. Don't bother.

## The Models

I ran two models:

**Qwen3.8-27B UD-Q4_K_XL** — 16.3GB on disk. Qwen's 27B dense model, Q4_K_XL quantization from Unsloth. Slower prefill, slower generation, but this is the model you run when reasoning quality is the priority. Think orchestration, hard coding problems, architectural decisions.

**Qwen3.6-35B-A3B UD-Q4_K_XL** — 21.3GB on disk. The 35B Mixture-of-Experts model with only 3.5B parameters active per forward pass. "A3B" means active-3B — despite the 35B total size, it behaves computationally closer to a 3-4B dense model at inference time. Native MTP (Multi-Token Prediction) heads baked into the GGUF. Fast.

Combined they take 38.9GB of the 96GB VRAM pool. You can run both simultaneously with room for 2-3 more worker instances.

## Baseline Numbers

Before any optimization, raw llama-bench results:

| Model | Size | pp512 (tok/s) | tg128 (tok/s) |
|---|---|---|---|
| Qwen3.8-27B UD-Q4_K_XL | 16.3GB | 364 | 11.94 |
| Qwen3.6-35B-A3B UD-Q4_K_XL | 21.3GB | 1112 | 53.31 |

Prefill on the MoE model is three times faster. Generation is four and a half times faster. That's what active parameter count does — same memory bandwidth, fewer operations per token.

11.94 tok/s for a 27B dense model is slow for comfortable use. We're going to fix that.

## Speculative Decoding: The Sweep

Speculative decoding works by generating multiple draft tokens cheaply, then verifying them with the main model in one forward pass. If the main model accepts the drafts, you get multiple output tokens for roughly the cost of one verification pass. Acceptance rate and draft depth are the variables that determine whether you come out ahead.

On this hardware, the key insight is that memory bandwidth is the constraint, not compute. The main model weights are ~17GB. At 256 GB/s, the theoretical minimum time to load them once for a token generation pass is 17GB / 256 GB/s ≈ 66ms per token. My measured baseline was 60ms — running at about 90% of the memory bandwidth ceiling. There is no meaningful headroom to go faster without changing how many tokens you generate per pass.

Speculative decoding changes the math. If you generate N draft tokens and the model accepts them, you've paid one verification pass for N tokens instead of N passes for N tokens. The question is what depth (N) actually helps.

### Qwen3.8-27B Sweep

Server config:

```bash
--spec-type draft-mtp,ngram-mod --spec-ngram-mod-n-min 24
```

This combines the model's native MTP heads for single-token prediction with an n-gram cache for pattern-based speculation. Test: 1000-token essay generation, context 32768 tokens.

| --spec-draft-n-max | tok/s | Acceptance |
|---|---|---|
| none | 11.84 | — |
| 12 | 12.31 | 13.0% |
| 6 | 13.32 | 29.7% |
| 5 | 14.07 | 32.3% |
| 4 | 15.00 | 36.8% |
| 3 | 16.44 | 44.7% |
| 2 | ~17.5 | ~52% |
| **1** | **17.74** | **58.6%** |

The pattern is clear: acceptance rate drops faster than depth increases as you go deeper. At n=12, 87% of your draft work is thrown away. At n=1, more than half of your single-token drafts are accepted — which on a memory-bandwidth-bound system is near-optimal. You're spending minimal extra bandwidth on the draft (one token instead of zero) and recovering it in the verification step when accepted.

**n=1 wins: 11.84 → 17.74 tok/s, +50%.**

Real-world sustained speed in conversation: 16.5-17 tok/s. Early burst when context is short: 18+ tok/s.

A few things I checked that didn't matter:

**Thread count** — 8, 16, and 24 threads all produced identical results (16.49, 16.69, 16.49 tok/s). Completely GPU-bound. The CPU isn't the bottleneck. Pick whatever and move on.

**Context size** — 8192 gave 16.62, 32768 gave 16.69, 98304 gave 16.50. Essentially flat across the range. Set it to what your use case needs.

**Extra environment variables** — `HSA_ENABLE_SDMA=0 + GGML_HIP_ENABLE_UNIFIED_MEMORY=1 + ROCBLAS_USE_HIPBLASLT=1` bumped acceptance rate from 58.6% to 73%, which sounds great. Net throughput dropped to ~16.4 tok/s. Higher acceptance rate, more overhead per verification, net loss. Use only `HSA_ENABLE_SDMA=0` and `HSA_XNACK=1` for stability. Leave the rest off.

### Qwen3.6-35B-A3B Sweep

This model has native MTP heads in the GGUF — no n-gram combination needed.

```bash
--spec-type draft-mtp
```

| --spec-draft-n-max | tok/s | Acceptance |
|---|---|---|
| none (bench) | 53.31 | — |
| 3 | 59.91 | 48.6% |
| 2 | 65.51 | 61.9% |
| **1** | **66.78** | **75.7%** |

Same pattern. n=1 wins again. Warm run (after KV cache is populated): 67.42 tok/s. Prefill at 1112 tok/s.

**53.31 → 66.78 tok/s, +25%.**

The gain is smaller in percentage terms because the baseline is already strong. The acceptance rate is higher (75.7% vs 58.6%) because MoE models tend to be more predictable token-by-token than dense models.

## Optimal Server Configs

These are the configs I actually run:

### Qwen3.8-27B — port 8080 (orchestrator)

```bash
export HSA_ENABLE_SDMA=0
export HSA_XNACK=1

~/llama.cpp/build/bin/llama-server \
  -m ~/models/qwen38-27b/Qwen3.8-27B-UD-Q4_K_XL.gguf \
  -ngl 99 -c 32768 --flash-attn on --jinja \
  --parallel 1 --threads 16 --reasoning off -fit off --no-ui \
  --spec-type draft-mtp,ngram-mod \
  --spec-draft-n-max 1 --spec-ngram-mod-n-min 24 \
  --host 0.0.0.0 --port 8080
```

### Qwen3.6-35B-A3B MTP — port 8081 (worker)

```bash
export HSA_ENABLE_SDMA=0
export HSA_XNACK=1

~/llama.cpp/build/bin/llama-server \
  -m ~/models/qwen36-35b-a3b-mtp/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf \
  -ngl 99 -c 32768 --flash-attn on --jinja \
  --parallel 1 --threads 16 --reasoning off -fit off --no-ui \
  --spec-type draft-mtp --spec-draft-n-max 1 \
  --host 0.0.0.0 --port 8081
```

`-ngl 99` offloads all layers to GPU. `-fit off` disables the built-in chat UI (use Open WebUI or your own frontend). `--reasoning off` disables the thinking token budget system — turn it on if you're doing math or complex multi-step reasoning and don't mind the latency.

## Honest Comparison to Community Numbers

You'll find other benchmarks for Strix Halo hardware online. Two worth addressing directly.

**KyaniteLabs** posted 59.7 tok/s on the same hardware class. That number is cold start with 30 concurrent sessions — not single stream. Their real conversational traffic measured 11-24 tok/s. My 16-17 tok/s single stream is inside that range. We're not contradicting each other.

**TheRock 7.14 nightly** achieves 26.6 tok/s raw tg on the 27B model — versus my 11.94 tok/s baseline. Better gfx1151 kernels from ongoing development. That's a real gap. The nightly builds are ahead of the stable ROCm 7.2.4 release. Something to track.

There's also a Vulkan + DFlash2 stack showing 52 tok/s on code generation tasks. I didn't test that path — different runtime, different tradeoffs. It's a separate rabbit hole.

The takeaway: community numbers often aren't measuring what you think they are. Concurrent load, context length, and benchmark methodology all affect the output. Measure your actual workload.

## A Two-Model Architecture

With both models loaded simultaneously and 57GB of VRAM headroom remaining, this points toward something more interesting than a single inference server.

The 27B model at 16-17 tok/s is your thinker — appropriate for orchestration, planning, deciding how to decompose a task, evaluating output quality. It's slow enough that you don't want to burn it on every subtask. The 35B MoE at 67 tok/s is your worker — fast enough for iterative subtasks, code execution, drafting, classification. Four times faster, same hardware, same power envelope.

Route tasks by complexity. Hard decisions, architectural questions, and final review go to port 8080. Subtasks, drafts, tool calls, and anything that benefits from speed over depth go to port 8081. You've effectively got two models for the price of one machine, coordinated by whatever orchestration layer you're building on top.

38.9GB loaded, 57GB free. The pool is large enough to add a third model if the use case calls for it.

---

*llama.cpp b10615 (f280b2698) · ROCm 7.2.4 runtime 1.18 · Ubuntu 24.04 · 2026-08-24*

*Still benchmarking at midnight. No regrets. 🚀*

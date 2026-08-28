---
title: 'Claude Code on a Pixel 9 XL: Termux, a 125B Model, and a Mesh Network'
description: 'Claude Code on a Pixel 9 XL through Termux, pointed at a 125B MoE on a GMKtec EVO-X2 over Headscale — the wrapper, the router, and the rough edges.'
date: '2026-08-28'
tags: ['claude-code', 'termux', 'android', 'llm', 'ai']
readingTime: '14 min read'
---

The commit at the bottom of this post was pushed by the setup it describes. Claude Code running in Termux on a Pixel 9 XL, in my pocket, talking to a 125-billion-parameter model sitting under a desk in another room. Not a remote session into a desktop. Not a cloud VM with a terminal app on the phone. The agent loop runs on the phone; the model runs somewhere else.

I want to be precise about what this is, because the pitch version sounds dumber than the reality: it is a pocket-sized coding agent with a serious local model behind it. No cloud inference, no API meter, no subscription meter running while I poke at things on a bus. The phone is the executor. The EVO-X2 is the brain. Headscale connects them.

Here's everything that had to happen to make that work, including the parts that fought me.

## The Shape of It

```
Pixel 9 XL                        GMKtec EVO-X2
Termux                            Ryzen AI Max+ 395 (Strix Halo)
  claude (native, via grun)         llama-server :8080
        |                                Qwen3.8-Flash-Next 125B
        v                                ~6B active, ~70GB weights
  router :8090  ---------mesh-------->
  (localhost, python)
```

Three pieces, each with its own failure mode:

- **Termux on Android** — the terminal, the shell, the tools. Getting a working `claude` binary in here is the first battle.
- **A router on the phone** — Claude Code and `llama-server` do not speak the same wire protocol, and the phone is where I bridge that.
- **Headscale** — self-hosted Tailscale control plane — so `evo-x2` resolves to a `100.64.0.0/10` address from anywhere the phone has signal, with no ports opened and no VPN appliance in the middle I don't control.

Why not just SSH into the EVO-X2 and run the agent there? Because then the agent is on the desktop machine, and the thing in my pocket is a viewport. I wanted the session to live on the phone — same session, same working tree, my own checkout, when I'm not at the desk.

## Step 1: Termux From F-Droid, Not the Play Store

This is the first thing that will bite you and the only step with no workaround.

Install Termux from [F-Droid](https://f-droid.org). Not from the Google Play Store. The Play listing has been frozen since Termux was pulled from Google Play years ago; it ships an old build pointing at package mirrors that no longer exist, so `pkg install` fails with a wall of 404s and no amount of `apt update` fixes it. Community fixes land on the F-Droid build only. If you install F-Droid Termux alongside Play Termux you'll hit a signature conflict — uninstall the Play one first, or restore a backup.

Then:

```bash
pkg update && pkg upgrade -y
pkg install git curl tmux termux-api -y
termux-wake-lock
```

That last one matters more than it looks. Android is designed to freeze processes it thinks you've abandoned. Termux gets there eventually anyway, and a frozen Termux mid-response means a dead stream and a half-written file. `termux-wake-lock` holds a wake lock; also turn off battery optimization for Termux in system settings. I do this on battery and I've stopped thinking about it.

One quality-of-life thing while you're in there — `~/.termux/termux.properties`:

```properties
extra-keys = [['ESC','/','-','HOME','UP','END','PGUP'],['CTRL','CTRL','ALT','HOME','DOWN','END','PGDN']]
```

Coding with Gboard's stock keyboard is not a real option. You need Esc and Ctrl physically reachable.

## Node: v24 Is the Sweet Spot, and Install the LTS Package

```bash
pkg install nodejs-lts -y
node --version    # v24.18.0
```

Two things to get right here.

**`nodejs-lts`, not `nodejs`.** `pkg install nodejs` gives you whatever is newest — currently Node 25 on the Termux repos — and Claude Code does not work against it. The LTS package lands on v24, which is what everything in this stack actually runs on. My box reports `v24.18.0`.

It isn't a hard requirement in the packaging sense — the wrapper declares `node >= 18` — it's a "this is what's been exercised" thing. v25 broke compatibility in ways I'd rather not re-litigate. Install LTS, move on.

## Step 2: The Wrapper, or Why `npm install` Gives You an Empty Package

The obvious command:

```bash
npm install -g @anthropic-ai/claude-code
```

This installs successfully. That's the problem. It finishes without error and gives you a `claude` command that does nothing useful, because of how the official packages are gated. Claude Code ships as a small JS launcher plus a platform-specific optional dependency — `@anthropic-ai/claude-code-linux-arm64`, `claude-code-darwin-arm64`, and so on. npm filters optional dependencies against the running platform, and here's the metadata on the Linux ARM64 package:

```json
{
  "name": "@anthropic-ai/claude-code-linux-arm64",
  "os": ["linux"],
  "cpu": ["arm64"]
}
```

Termux reports `os=android`. The dependency gets skipped, the launcher finds no binary, and you get a silently empty install. No error during install, just a broken command afterward.

And forcing it wouldn't save you, because there's a second wall underneath that one. The native binary is ~214MB of dynamically-linked glibc. Termux is **Bionic** — Android's C library, not glibc, not musl, a third thing. The binary wants `/lib/ld-linux-aarch64.so.1`, which doesn't exist on Android and can't be made to exist at that path. Even with the file in place, exec fails on the missing interpreter.

`@xurxuo/claude-code-termux` handles both problems:

```bash
npm install -g @xurxuo/claude-code-termux
claude --version    # 2.1.251 (Claude Code)
```

What it does, reading the wrapper source:

1. **Platform patch.** `process.platform === 'android'` gets rewritten to `linux` before platform detection, so the resolver picks `linux-arm64`.
2. **Forced install.** It installs the native package with `npm --force`, because npm would otherwise refuse a package tagged `os=linux` on a host that reports `android`.
3. **`grun`.** Instead of exec'ing the glibc binary directly, it launches it through `grun` from Termux's `glibc-runner` package, which carries a glibc sysroot and the right ELF loader. Two walls, one bridge. The postinstall handles this; if it ever doesn't, the fix is `pkg install glibc-repo && pkg update && pkg install glibc-runner`.

### The DNS forwarder warning, and why to ignore it

First launch prints something like this before Claude Code starts:

```
[@xurxuo/claude-code-termux] ⚠ local DNS forwarder previously failed: ERROR: bind EACCES 127.0.0.1:53
[@xurxuo/claude-code-termux] ✓ local DNS forwarder launching on 127.0.0.1:53 (pid 31374)
```

That looks alarming and is nothing. Here's what it's for. The glibc-linked binary calls `getaddrinfo()`, which reads `/etc/resolv.conf` — a file that does not exist on Android at all. Its fallback is `127.0.0.1:53`. So the wrapper spawns a ~15-line Node UDP forwarder on `127.0.0.1:53` (upstreams 8.8.8.8 and 1.1.1.1) so the fallback path resolves instead of refusing or hanging to timeout. It also starts a small HTTP CONNECT proxy on `127.0.0.1:41080` and sets `HTTPS_PROXY` to it, which means hostname resolution happens on the *Bionic* side where it works, and the native binary never has to resolve anything itself.

The `EACCES` line is a stale error file from a previous attempt — binding a port below 1024 isn't always permitted. Both lines are informational; the process IDs live in `~/.cache/claude-code-termux/` and you can kill them freely. Opt out entirely with `CLAUDE_CODE_TERMUX_NO_DNS_HELPER=1` and `CLAUDE_CODE_TERMUX_NO_PROXY_HELPER=1`.

**One caveat that isn't cosmetic**, and it bit me: the wrapper sets `HTTPS_PROXY` and `NO_PROXY=localhost,127.0.0.1`. That default is exactly right when you're pointing at `api.anthropic.com` through a proxy and at a local router over loopback. But if you export your *own* `HTTPS_PROXY`, the wrapper steps aside and respects yours — and then your local router gets routed through the proxy too, which fails in a way that looks like the router being down. If you set a proxy yourself, put `localhost` in `NO_PROXY` yourself.

## The Routing Problem

Claude Code speaks the Anthropic Messages API: `POST /v1/messages`, tool schemas under `input_schema`, SSE events shaped as `content_block_start`. `llama-server`'s native shape is OpenAI's `/v1/chat/completions`. These are not the same protocol. Not a naming difference, not a header difference — different request bodies, different streaming event types, different tool-call encoding.

What I run is the router from my [ai-tools](https://github.com/patrickmfurbert/ai-tools) repo — the same one behind the GBNF grammar work in [the 125B post](/blog/qwen38-flash-next-125b-strix-halo). Single file, no package, listens on `:8090`, picks a backend from the `model` field, forwards the whole request including headers and SSE, and strips `maxLength` from tool schemas on the way through (that's the grammar-bug workaround from the last post — worth knowing it happens here, at the proxy, and *not* in the model).

Be clear about one thing, because it will save you an hour: **the router does not translate.** It appends the request path verbatim to the backend base URL and hands it over. If your backend only speaks OpenAI format, you will receive a faithful, correctly-proxied 404. Something on the other end has to answer `/v1/messages` in Anthropic shape. In my case the `llama.cpp` build on the EVO-X2 answers `/v1/messages` directly, which is why the whole thing works — and it's the piece people skip when they try to copy this.

I run the router *on the phone* rather than on the EVO-X2. Reasons: fewer moving parts on the box that matters, the config is mine to edit from wherever I am, and if the router dies I can restart it without SSHing anywhere. It costs one hop of loopback latency, which is nothing.

```bash
git clone https://github.com/patrickmfurbert/ai-tools ~/ai-tools
pkg install python -y
python3 --version     # 3.13.13
pip install pyyaml
```

Python 3.10+ is the floor and PyYAML is the entire external dependency list — the router's own upstream calls are stdlib `urllib`. That's a deliberately small footprint and I'm glad about it now.

`~/ai-tools/router/config.local.yaml`:

```yaml
host: 127.0.0.1
port: 8090
request_timeout_s: 300
read_chunk_size: 4096
models:
  qwen: "http://evo-x2:8080"
default_model: qwen
```

Two deviations from the upstream default worth calling out. I bind `127.0.0.1` instead of `0.0.0.0` — a phone on hotel Wi-Fi has no business exposing an unauthenticated model endpoint on every interface. And `request_timeout_s: 300`, because a cold first token against a full tool schema is a slow event (more below); the default of 120 cuts streams off mid-thought. The timeout only bounds connect plus first byte, so a long stream isn't at risk once it's flowing.

Start it:

```bash
tmux new-session -d -s ai-router \
  'python3 ~/ai-tools/router/router.py --config ~/ai-tools/router/config.local.yaml -v'
```

tmux rather than `&` because I want to attach and read the log when something misbehaves, and because tmux survives the shell closing.

## Confirming It Works, In Order

Do these in sequence. Each one isolates a different layer, and doing them out of order just means guessing.

```bash
# 1. Is the mesh up at all?
ping -c 3 evo-x2
```

```
64 bytes from evo-x2 (100.64.0.6): icmp_seq=1 ttl=64 time=13.2 ms
64 bytes from evo-x2 (100.64.0.6): icmp_seq=2 ttl=64 time=10.1 ms
--- 2 packets transmitted, 2 received, 0% packet loss ---
rtt min/avg/max/mdev = 10.114/11.662/13.210/1.548 ms
```

11ms average from a phone to a box in another room over a self-hosted control plane. Mesh overhead is not the problem you think it is. If this fails, nothing below it can work — check the Tailscale app is connected to your Headscale server, and that the phone hasn't been put into a data-saver state that quietly kills it.

```bash
# 2. Is the backend actually serving?
curl -s -m 10 http://evo-x2:8080/health        # → ok

# 3. Is the router up?
curl -s http://localhost:8090/health           # → ok

# 4. Does a real inference request come back?
curl -s http://localhost:8090/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"qwen","max_tokens":16,"messages":[{"role":"user","content":"Reply with exactly: ok"}]}'

# 5. Does the Anthropic-shaped path work? This is what Claude Code actually sends.
curl -s http://localhost:8090/v1/messages \
  -H 'content-type: application/json' \
  -H 'x-api-key: local' \
  -d '{"model":"qwen","max_tokens":16,"messages":[{"role":"user","content":"Reply with exactly: pong"}]}'
```

Note step 3 is not proof the backend is healthy — `/health` is the router answering about itself. That's why the order matters. And step 5 is the one that actually matters, because it's the only request in this list shaped like what Claude Code sends.

## The settings.json

`~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8090",
    "ANTHROPIC_API_KEY": "local"
  },
  "permissions": {
    "allow": [
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git pull *)",
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git checkout *)"
    ]
  }
}
```

`ANTHROPIC_BASE_URL` at `localhost:8090` is the whole trick — Claude Code is a client, and this says where the server is. `ANTHROPIC_API_KEY: "local"` is a placeholder; the router doesn't check auth, and it can afford not to, because it binds loopback and the only path to it runs over the mesh. Nothing secret is stored on the phone, which I like.

The permissions block is a deliberate middle position. On a phone you do not want to approve every command through a permission dialog with on-screen keys — you'll give up in ten minutes. But you also don't want `Bash(*)` in front of a model that is, whatever it scores on benchmarks, not Opus, driving a shell with your git credentials in it. So: git is allow-listed, everything else prompts. That split has been right every time.

One quirk worth knowing, straight off the router log. Claude Code sends its *own* model names — every one of the 229 requests in my log asked for `claude-opus-5` or `claude-sonnet-5`. None of those match a key in your `models` map, so every single request falls through to `default_model`. Which is fine, but it means your carefully named router aliases do nothing unless you also set `ANTHROPIC_MODEL` to an alias. I found that out by reading the log rather than by reading the docs.

## What It's Actually Like To Use

The honest version, with numbers.

**Cold start is slow and it's not one thing.** First response on a fresh session with Claude Code's ~30-tool schema attached runs about two minutes. I didn't instrument the phases, so treat this as wall clock rather than a breakdown: the model has to be resident before anything answers, then Claude Code prefills a system prompt plus tool schemas plus repo context — the largest single request in my log is 33,347 input tokens, and at the 330-400 tok/s prefill I measured on this hardware that alone is over a minute. Generation on top of that runs about 20 tok/s sustained, per [the earlier benchmark](/blog/qwen38-flash-next-125b-strix-halo). The grammar compile on a 30-tool schema adds a real but smaller chunk — it's the thing that cost ~400KB of grammar before I fixed the schema path, and it's why trimming your tool list is not cosmetic.

**Turn two is a different experience.** Prompt context is cached and warm, so turn two and everything after prefill only the delta. After the first response it's ordinary — maybe uncomfortably ordinary, typing a question, watching tokens arrive at reading speed, waiting a beat on anything that touches a lot of files.

**What it's good at:** reading code, explaining a diff, drafting a post from notes, single-file edits, questions about a repo you have checked out. Work where you weren't going to be watching the screen closely anyway.

**What it's bad at:** fast iteration. Rapid-fire "no, do it again" loops. Anything where you want three attempts in a minute. Multi-file refactors where the model needs to re-read half the tree — that's a multi-minute prefill per turn, and you feel every one. And it is a 6B-active model. It is not Opus. The interesting claim in this project is not that a phone has become a workstation; it's that the *harness* is the same harness, and the brain behind it is whatever you point at.

Battery: noticeable, obviously, but the phone is doing almost no inference. Heat comes from the screen and the radio, not the SoC. Sessions are limited by my patience and the keyboard far more than by the hardware.

## Rough Edges, Unsorted

- **Android kills Termux.** Wake lock plus disabling battery optimization is mandatory, not optional.
- **The Play Store build is a trap.** F-Droid only.
- **`pkg install nodejs` is the wrong package.** LTS, v24.
- **The DNS warning is noise.** Read it once, ignore it forever.
- **Set your own `HTTPS_PROXY` and you must set `NO_PROXY` yourself**, or local routing breaks confusingly.
- **The router is a proxy, not a translator.** Your backend still has to speak the client's format.
- **The model name you send is the model name Claude Code chose,** not one of your aliases. `default_model` is doing the real work.
- **Auto-update still hits npm** once a day. `CLAUDE_CODE_TERMUX_NO_AUTO_UPDATE=1` if you want the phone to stop asking; note it also stops the wrapper self-heal that unbricks a truncated launcher.
- **Nothing here is authenticated.** Loopback plus mesh is the entire security model. Fine for my tailnet. Not fine for yours, necessarily.

## Is It Worth It

Depends entirely on what you think you're buying.

If you want "Claude Code but free," no — you're not getting Claude's models, you're getting a client pointed at a Qwen checkpoint, and the quality-per-minute is worse than any subscription.

If you want a session that lives on your phone, with your repos, behind your own control plane, where the marginal token costs nothing and no request leaves your building — yes. That's a genuinely different thing and it's real. "No cloud" turned out not to be a purity point but a practical one: the code I work with day to day isn't stuff I want shipping to a third party, and a setup that *can't* leak it beats a setup that promises not to.

The engineering interest for me was never the phone. It's that the executor and the brain are now independently replaceable — a phone, a laptop, a laptop in a hotel, a box in another room, any model on that box — connected by ~60 lines of Python and a mesh network that gives you a hostname instead of a port-forward. That shape is worth more than the specific Pixel-and-mini-PC instance of it I happen to have running.

Set the wake lock. Install the LTS package. Curl `/v1/messages` before you curl anything else. And read the wrapper's source the first time it prints something scary — it's a short file, and it's much better than guessing.

---

*Claude Code 2.1.251 via @xurxuo/claude-code-termux 2.1.217 · Termux (F-Droid) on a Pixel 9 XL · Qwen3.8-Flash-Next 125B on a GMKtec EVO-X2 · Headscale tailnet · 2026-08-28*

*Written on the phone it describes, which is the entire point. 🚀*

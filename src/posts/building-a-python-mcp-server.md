---
title: 'Building a Python MCP Server from Scratch'
description: 'How I built and connected a working MCP server in Python — understanding the protocol, the tooling, and how it wires up to Copilot CLI over stdio.'
date: '2026-03-19'
tags: ['python', 'mcp', 'ai', 'linux', 'terminal']
readingTime: '8 min read'
---

One of the things I appreciate most about learning something new is taking the time to actually understand what's happening under the hood before writing a single line of code. When I decided to build an MCP server, I didn't want to just follow a tutorial and end up with something I couldn't explain. I wanted to know what MCP actually is, how the communication works, and why the tooling is set up the way it is.

This post walks through how I built a simple calculator MCP server in Python and connected it to Copilot CLI on my Linux machine — step by step, with the reasoning behind each decision.

## What is MCP?

MCP stands for Model Context Protocol. It's an open protocol that allows AI assistants to interact with external tools and data sources in a standardized way. Think of it like a REST API, but designed specifically for LLMs.

The analogy maps cleanly:

| REST / Spring Boot | MCP / Python SDK |
|---|---|
| `@RestController` | `mcp = FastMCP("my-server")` |
| `@GetMapping("/add")` | `@mcp.tool()` |
| Method parameters | Function parameters + type hints |
| Returns `ResponseEntity` | Just return a value |
| Tomcat handling HTTP | SDK handling JSON-RPC over stdio |

The key difference from REST is that you don't define routes or URLs. You define Python functions. The AI decides which function to call based on the tool descriptions and what the user asked for — Copilot figures out on its own that your `add` tool is what it needs without you specifying anything.

## How stdio Transport Works

For local development I used stdio transport, which means there's no port, no socket, and no HTTP server. Instead, the MCP host (Copilot CLI in my case) spawns your Python script as a child process and communicates with it via stdin/stdout using JSON-RPC 2.0 messages.

The flow looks like this:

1. Copilot reads your `mcp-config.json` and spawns your Python script as a child process
2. The host sends an `initialize` request and your server responds with its capabilities — the list of tools it exposes
3. When you ask Copilot something that requires a tool, it sends a `tools/call` message with the arguments over stdin
4. Your function runs and writes the result back to stdout
5. Steps 3 and 4 repeat for every tool invocation

Your script does have a server loop — the SDK gives you a `run()` call that blocks and handles the message loop — but it's reading from stdin and writing to stdout, not listening on a port. No sockets. No ports. Just a process.

## Dependencies

- **Python 3.10+** — tested on 3.12.3
- **uv** — modern Python project and package manager
- **mcp[cli] 1.26.0+** — the official Anthropic MCP Python SDK, which includes FastMCP

### Why uv over pip + venv?

`pip + venv` is the classic approach — you manually create a virtualenv, activate it, install packages, and maintain a `requirements.txt` by hand. It works, but the dependency resolver is weak and there's a lot of manual ceremony.

`uv` replaces `pip`, `venv`, and `pip-tools` all in one tool. It's written in Rust, installs are dramatically faster, and the resolver is far better. Instead of `requirements.txt` you get a `pyproject.toml` plus a `uv.lock` lockfile — equivalent to `package.json` and `package-lock.json` if you've touched Node. The MCP official docs use `uv` in their Python quickstart, so you're following the grain of the ecosystem.

### A note on FastMCP

FastMCP started as a third-party project that Anthropic liked enough to acquire and merge directly into the official `mcp` SDK. As of SDK version 1.0+, `FastMCP` lives at `mcp.server.fastmcp` and is the officially recommended way to build Python MCP servers. It's not a third-party wrapper — it's the real thing.

## Installation

### 1. Install Python

On Ubuntu:

```bash
sudo apt install python3
```

Verify:

```bash
python3 --version
```

### 2. Install uv

Do not use the snap package. Use the official installer:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then reload your shell:

```bash
source ~/.bashrc
```

Verify:

```bash
uv --version
```

### 3. Set up the project

```bash
mkdir -p ~/projects/mcps/python/calculator
cd ~/projects/mcps/python/calculator
uv init
uv add mcp[cli]
```

`uv init` creates the `pyproject.toml` project manifest and scaffolds the directory. `uv add mcp[cli]` installs the MCP SDK into a `.venv` scoped to this project and writes the dependency into `pyproject.toml`. The `[cli]` extra pulls in the `mcp` command, which gives you access to the inspector for testing.

## Writing the Server

Replace the contents of `main.py` with:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("calculator")

@mcp.tool()
def add(a: float, b: float) -> float:
    """Add two numbers together."""
    return a + b

@mcp.tool()
def subtract(a: float, b: float) -> float:
    """Subtract b from a."""
    return a - b

if __name__ == "__main__":
    mcp.run()
```

A few things worth understanding here:

- The type hints on the parameters are not optional — the SDK uses them to generate the tool's argument schema that the AI reads
- The docstrings are not optional either — that's what the AI reads to understand what the tool does and when to call it
- `mcp.run()` starts the stdio loop — the equivalent of `SpringApplication.run()` in Spring Boot

That's the entire server. The SDK handles all the JSON-RPC plumbing.

## Testing with the MCP Inspector

Before wiring up Copilot, test the server locally with the MCP Inspector — a browser-based UI that lets you invoke tools manually without needing an AI client.

```bash
uv run mcp dev main.py
```

Open the URL printed in the terminal, click **Connect**, navigate to the **Tools** tab, and invoke `add` or `subtract` with your chosen arguments. You should see a JSON response back immediately.

Stop the inspector with `Ctrl+C` before connecting via Copilot CLI — both need to spawn your server process and they'll conflict.

Note: the long traceback printed when you `Ctrl+C` the server is expected. It's the async event loop unwinding on interrupt, not an error.

## Connecting to Copilot CLI

Copilot CLI reads MCP server config from `~/.copilot/mcp-config.json`. Create the file if it doesn't exist and add:

```json
{
  "mcpServers": {
    "calculator": {
      "type": "stdio",
      "command": "/home/your-username/.local/bin/uv",
      "args": [
        "run",
        "--project", "/home/your-username/projects/mcps/python/calculator",
        "python", "/home/your-username/projects/mcps/python/calculator/main.py"
      ]
    }
  }
}
```

Replace `your-username` with your actual username. There are two gotchas worth understanding:

**Use the full path to uv.** Copilot CLI spawns child processes without your full user PATH, so `uv` won't be found by name even if it works fine in your terminal. Find your path with `which uv` — on my machine it's `/home/pastrycak3s/.local/bin/uv`.

**Use the `--project` flag.** Without it, `uv` doesn't know where your `.venv` lives when spawned from an arbitrary working directory. The `--project` flag tells `uv` explicitly where the project root is so it can find the correct virtual environment regardless of where Copilot launched the process from.

After saving the config, restart Copilot with `/restart` and verify the server connected:

```
/mcp
```

You should see your `calculator` server listed with a green checkmark.

## Using It

Once connected, just ask naturally:

```
use the calculator tool to add 10 and 25
```

Copilot will recognize the available tools and invoke them automatically. Under the hood it's sending a JSON-RPC `tools/call` message over stdin with `{"a": 10, "b": 25}`, your `add` function runs, and the result comes back over stdout.

## The Result

```
● add
  └ {"result":35}
● 10 + 25 = 35
```

A working MCP server, connected to an AI assistant, running entirely on my local Linux machine with no cloud infrastructure, no Docker, and nothing I can't explain.

That's the goal.

---

*Built this at the kitchen table on a Tuesday. Copilot diagnosed its own connection failure and fixed the config. We live in a strange and interesting time. 🚀*

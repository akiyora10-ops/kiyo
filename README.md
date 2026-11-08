# Kiyo

The AI coding agent that runs on free models. Fast, hackable, yours.

[![CI](https://github.com/akiyora10-ops/kiyo/actions/workflows/ci.yml/badge.svg)](https://github.com/akiyora10-ops/kiyo/actions)
[![npm](https://img.shields.io/npm/v/kiyo-ai)](https://www.npmjs.com/package/kiyo-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Install

```sh
npm install -g kiyo-ai
```

Or run without installing:

```sh
npx kiyo-ai
```

## Quickstart

```sh
export OPENROUTER_API_KEY=...
kiyo run "add input validation to signup"
```

## Why Kiyo

Most coding agents ask for a subscription before you write a line. Kiyo asks for a terminal: free models, a router that never stalls, and a plugin system small enough to read in one sitting.

## Features

- Free-model-first routing across 13+ providers with automatic fallback on 429/5xx.
- Edit engine with search/replace, fuzzy matching, atomic writes, checkpoints, undo/redo.
- Permission system: plan (read-only), default (ask), auto-edit, yolo (dangerous).
- Built-in tools: read, write, edit, multi-edit, list, glob, grep, bash, git, web-fetch, todo, ask-user.
- Plugin system: single-file plugins for providers, tools, agents, skills, themes, commands, hooks.
- Sessions in ~/.kiyo/sessions, resumable with --continue/--resume.
- Project memory via KIYO.md and AGENTS.md.

## Providers

OpenRouter, Google AI Studio, Groq, Cerebras, Mistral, GitHub Models, NVIDIA NIM, Cloudflare Workers AI, SambaNova, Hugging Face, Together, Ollama, and any OpenAI-compatible endpoint.

## Plugins

Everything you can extend is one file. See plugins/ for examples and `kiyo plugin new`.

## Contributing

See CONTRIBUTING.md. Your first PR in 5 minutes.

## Status and limitations

v0.1.0. TUI is readline-based (Ink not yet wired). Some provider model IDs are marked TODO(verify). No published benchmark numbers yet.

## License

MIT

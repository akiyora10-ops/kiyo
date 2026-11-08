# Kiyo — v0.1 Plan

Approved scope: core-first checkpoint (tasks 1–19 + minimal slash commands), then TUI/docs/launch (20–30). Ink TUI as planned. Providers: mock-verified + TODO(verify) until keys supplied.

## Phase 0 — stop the bleeding

1. Repo hygiene
   - Delete package-lock.json; .gitignore `.Kiyo/` -> `.kiyo/`; move ink/react to devDeps; pin pnpm in CI.
   - Files: package-lock.json, .gitignore, package.json, .github/workflows/ci.yml
   - Verify: pnpm install && pnpm lint
2. Fix config/session dirs
   - `.Kiyo` -> `.kiyo` in packages/cli/src/config.ts and packages/core/src/session.ts.
   - Verify: grep -R ".Kiyo" empty; node cli doctor prints ~/.kiyo
3. Typecheck plugins
   - Add tsconfig.plugins.json + check:plugins script in pnpm typecheck.
   - Verify: pnpm typecheck flags _openai-compat bugs
4. Fix _openai-compat.ts
   - Correct Authorization header, tool_call id, accumulate streamed tool args, auth none option, health check honors auth.
   - Files: plugins/providers/_openai-compat.ts, ollama.ts, openai-compatible.ts
   - Verify: tests/provider-compat.test.ts with mocked fetch
5. kiyo --version / --help
   - packages/cli/src/index.ts, cli/package.json
   - Verify: node packages/cli/dist/index.js --version

## Phase 2 — router

6. Router returns provider+model
   - select() -> {provider,model} by capability
   - Verify: tests/router.test.ts
7. Full rate-limit parsing
   - x-ratelimit-remaining-*, *-reset (sec/epoch/date), Retry-After
   - Verify: header table test
8. chatWithFallback()
   - async generator: try providers in order, on 429/5xx/timeout mark + next, emit provider_switch, keep messages
   - Verify: unit test with fakes
9. Mock provider HTTP server
   - tests/mocks/provider-server.ts (200 stream, 429+headers, 500, delay)
   - Verify: server test
10. Fallback mid-stream test
    - first provider 429s after text, second completes; same context + switch event
    - Verify: tests/router-fallback.test.ts
11. Free-first ordering + configured-only filter
    - skip providers without env key (except none-auth)
    - Verify: test with fake env
12. Agent loop uses fallback
    - packages/core/src/agent.ts + CLI
    - Verify: tests/agent.test.ts with mock providers

## Phase 3 — core safety/edits

13. Tool-call message shape
    - add assistant toolCalls + tool name to ProviderRequest; update agent + compat
    - Verify: agent test asserts request body
14. Fuzzy edit + diff
    - improve matcher, return unified diff; tests for whitespace/CRLF/multi-match
    - File: edit-engine.ts
15. Persistent checkpoints + undo/redo
    - ~/.kiyo/checkpoints/<id>.json; restore/list
    - Verify: test on temp dir
16. Session resume
    - CLI --continue/--resume <id>, save after each turn
    - Verify: manual two-run test
17. Permissions
    - real readline approve (y/n/a), path sandbox outside root asks, rules tests
    - Files: permissions.ts, tools.ts, cli
    - Verify: tests + manual bash
18. Secret write guard
    - warn/deny writing detected secrets; extend redaction tests
19. Context/repo map in system prompt
    - use context.ts + KIYO.md/AGENTS.md
    - Verify: test prompt contains memory + map

## Phase 4 — CLI/onboarding

20. kiyo doctor v2
    - node, config paths, key presence, provider health, git
    - File: cli/src/commands/doctor.ts
21. Onboarding
    - first run: list 4 free providers + links, paste key (hidden), health check, save ~/.kiyo/config.json, demo task
    - Verify: delete config, run
22. Slash commands
    - dispatch /help /model /mode /usage /plugins /doctor /export /clear /theme /undo /redo /diff /commit /exit via command plugins
    - Verify: REPL manual
23. run JSON + non-TTY
    - --json, no prompts when piped
    - Verify: echo ... | kiyo run --json
24. Ink TUI
    - status bar (provider/model/tokens/cost/mode), streamed messages, collapse tool blocks; readline fallback
    - Files: cli/src/tui/*
    - Verify: manual + NO_COLOR

## Phase 5 — contribution engine

25. SDK validators per kind + test harness
    - fakeProvider, temp-fs
    - Verify: tests
26. kiyo plugin new|validate
    - scaffold file+test+doc stub per type
    - Verify: generate provider, validate, delete
27. Provider set
    - mark 4 verified (OpenRouter, Google, Groq, generic), rest TODO(verify); add auth/limits metadata
    - Verify: doctor
28. CONTRIBUTING + 15 seed issues + gh script
    - .github/seed-issues/*.md, scripts/seed-issues.sh
    - Verify: bash -n

## Phase 6 — launch/final

29. README + VHS tape + docs skeleton
    - hero/install/quickstart/status/providers table; docs/demo.tape; docs/{getting-started,providers,plugins,troubleshooting}.md
    - Verify: links resolve
30. Clean-clone verification
    - fresh clone -> pnpm i && pnpm build && pnpm test && node packages/cli/dist/index.js doctor; fix breakage; final report (works/stubbed/manual)

## Execution notes

- One commit per task (conventional). After each: pnpm lint && pnpm typecheck && pnpm test.
- Files kept <300 lines.
- Verification is actually run, not asserted.
- Landing page docs/landing/index.html stays untouched.
- No destructive commands without explicit approval.

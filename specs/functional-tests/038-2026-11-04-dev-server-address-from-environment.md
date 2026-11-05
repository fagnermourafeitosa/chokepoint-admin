---
spec: 038-2026-11-04-dev-server-address-from-environment
title: Dev Server Address From the Environment
stack:
  - dev-infra/up.sh
  - backend/dev.sh on 127.0.0.1:8081
  - The Admin dev server, started differently in each scenario
data: Put back .env.local and stop the extra dev servers after the run.
scenarios:
  - id: S1
    title: Address from .env.local
    criteria: [1]
    steps:
      - Start npm run dev with .env.local from .env.example.
      - Sign in as admin-a in the built-in browser.
    expected:
      - The server listens on 127.0.0.1:5173 and the sign-in goes through the API on 127.0.0.1:8081.
    last_run:
      date: 2026-11-04
      result: passed
      notes: Unnumbered criteria; 1 is the first bullet.
  - id: S2
    title: Missing variable
    criteria: [2]
    steps:
      - Start npm run dev without ADMIN_DEV_PORT.
    expected:
      - The server stops with an error that names ADMIN_DEV_PORT.
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
  - id: S3
    title: Process environment wins
    criteria: [3]
    steps:
      - Start npm run dev with ADMIN_DEV_HOST, ADMIN_DEV_PORT and ADMIN_API_TARGET set to other values in the process environment.
    expected:
      - The server starts on that host and port and proxies to that target.
    last_run:
      date: 2026-11-04
      result: passed
      notes: null
---

# Functional test: Dev Server Address From the Environment

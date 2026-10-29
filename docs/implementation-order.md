# Coordinated implementation order

## User direction (2026-10-29)

Implement the approved investigation and Overview specifications as a coordinated set with a backend subagent and an Admin subagent. Do not treat every specification as an independent release. Keep the following dependency order in future sessions.

1. Backend 022: decision trace evidence.
2. Backend 023: decision trace read API.
3. Backend 024: signal review and resolution.
4. Admin 019: contextual Access navigation.
5. Admin 020: Investigate problems and decisions.
6. Backend 025: Overview aggregation API.
7. Admin 021: Overview dashboard.

The order records dependencies, not a requirement to leave one agent idle. Define real API contracts first, then develop independent backend/Admin work in parallel. Use the existing mock and temporary screenshots for layout and interaction; use actual backend entities for IDs and contracts. Do not create an application-to-Agent configuration to reproduce invented mock data.

Delivery group 1: Backend 022–024 and Admin 019–020 together.
Delivery group 2: Backend 025 and Admin 021 together after group 1, or release all seven together.

The user authorized implementation. Keep changes on task branches until the formal review and the user's approval of the result. Implementation authorization does not approve a merge or push. Preserve the existing unrelated deletion of backend .claude/napkin.md.

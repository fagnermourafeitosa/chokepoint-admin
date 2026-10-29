# Temporary implementation references: Overview and Investigate

Captured from the running workbench mock at `http://127.0.0.1:5180/` on 2026-10-29. These are temporary visual references for implementation, not API examples, fixtures or authorization contracts. All identities and counts are invented sample data.

## Screens

| Image | Use |
| :--- | :--- |
| [Overview](01-overview.png) | Status line, metrics, hourly traffic, most-denied rows, unused-tool indicator and Inbox. |
| [Investigate: By problem](02-investigate-problems.png) | Toolbar, grouped rows, principal summary and pagination. |
| [Investigate: All decisions](03-investigate-all-decisions.png) | Result filter and individual decision rows. |
| [Inspector: condition](04-decision-inspector-condition.png) | Recorded reason, authorization path, policy reference, repetition and decision breakdown. |
| [Inspector: no grant](05-decision-inspector-no-grant.png) | Missing-grant explanation and contextual action. |
| [Access target](06-access-permission-target.png) | Selected existing Agent, permissions section and highlighted tool after Adjust permissions. |

## Mandatory differences from these images

The specification text takes precedence over these captures. Do not copy sample IDs, client-to-Agent relationships, invented group IDs, claims, arguments or hardcoded counts.

- Omit priority columns, badges, filters, sorting and the High priority metric. Intelligence will calculate priority in future work. No risk classification or replacement priority algorithm is added now.
- Context shows the recorded policy condition. It never shows actual tool arguments, token claims or values obtained from a source. An expression can contain constants that are part of the configured rule.
- Store and display the path actually executed. Do not re-evaluate a historical call or copy the mock's simulated checks or assumed execution order.
- Omit Watching this problem. There is no automatic post-adjustment monitoring.
- Keep recording permits. The warning that nothing uses permits is obsolete: the dashboard and unused-tool indicator use them. Show the actual trace completeness limitation instead.
- Opening an Inbox item's detail marks it Reviewed. Before leaving that detail, show a modal with Keep reviewed and Mark resolved. Resolution is the administrator's assertion, not automatic proof that calls now succeed. The modal is a newly specified behavior and is not present in these screenshots.
- Use UTC for timestamps, periods, today and yesterday comparisons.
- A problem and its requests-denied signal include the reason label in their grouping key. Descriptions are fixed English text.
- Count tools without recorded allowed calls by distinct server/tool in the current environment. Do not add attribution to an individual grant.
- Use real scoped backend entities and existing permission-group references for navigation. A token application identifier does not equal an Agent UUID. Do not introduce a new client-to-Agent configuration to imitate sample data.
- Planned and Differs tags belong only to the reference mock. They do not appear in the implemented Admin.

## Specification and delivery map

| Delivery group | Backend | Admin | Rule |
| :--- | :--- | :--- | :--- |
| Investigation | 022 evidence, 023 read API, 024 signal lifecycle | 019 contextual navigation, 020 Investigate | Integrate and release together after approval of each spec. |
| Overview | 025 aggregates; depends on Investigation foundations | 021 Overview; depends on 019 and 020 | Integrate and release together after the Investigation group, or release all seven specs together. |

Each specification contains links to its dependencies. Writing these specifications does not authorize implementation, commits, merges or publication.

## Mock tag checklist

| Mock feature | Owning specifications / disposition |
| :--- | :--- |
| Overall status, calls, UTC comparisons, traffic, top denied and unused tools | Backend 025, Admin 021 |
| Reviewed tool coverage and destination | Backend 025, Admin 019 and 021 |
| Inbox status filter, retained reviewed rows, notes and specific targets | Backend 024, Admin 019–021 |
| Tool discovery details, disabled principal's associated groups | Backend 024 read enrichment, Admin 019 and 021 |
| Investigation filters, row filtering, pagination and repeated-window summary | Backend 023, Admin 020 |
| Additional deny reasons, path, condition and rules supporting permits | Backend 022 and 023, Admin 020 |
| Exact permission/tool/person targets | Backend 023, Admin 019 |
| Priority and High priority | Future Intelligence work; excluded from this delivery. |
| Watching this problem | Excluded by the user. |

## Lifetime

Keep these files while the corresponding Admin specifications are pending or in progress. After implementation is approved, remove the temporary images and update the affected documentation references in that same approved scope. Never leave broken image links. The running mock remains the visual source; these captures are supporting examples.

---
name: grilling
description: Grill the user about a plan, decision, or idea, after researching how the market solves each decision. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet.

## Research the market first

Before you ask any question of the frontier, research how the market solves that problem, in every dimension it has: engineering (standards, protocols, reference architectures, how mature tools implement it), product (how comparable products and their users handle it, the usual UX and copy), legal and compliance (laws, regulators, their guides) and operations (cost, scale, support). Use the web, official documentation and standards. Cite the sources in the question and in the specification.

The research sorts each decision into one of two kinds:

- **Clear market practice.** One answer is the established standard, and nothing in the project or in the user's words points elsewhere. Do not ask it. Decide it, write it in the specification marked `(market practice)` with its source, and list it in the round so the user can overrule it.
- **Real choice.** The market has more than one established answer, or the decision changes the product, the business or the cost. Ask it.

## Ask the real choices

Ask every real choice of the frontier in one round: number each question, give **at least two and at most three** options taken from the research (one option only when the market has a single answer, and then say why), the consequences of each, and your recommendation. The user can propose another option. Do not invent options that the market does not use. Then wait for the user's answers before the next round.

Format a round like so:

```
✅ **Decided by market practice**: <decision> — <practice and source>; <decision> — <practice and source>

---

❓ **Q1** - **<question title>**: <what the market does, with sources>

1. <option> — <consequences>
2. <option> — <consequences>
3. <option, if the market has a third> — <consequences>

➡️ <your recommended answer>

---

❓ **Q2** - ...
```

## Next rounds

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's: facts from the environment (filesystem, tools, etc.) and how the market solves the problem. When a frontier question needs one, dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The real choices are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed: each decision is either answered by the user or recorded as market practice with its source. Do not act on it until the user confirms you have reached a shared understanding.

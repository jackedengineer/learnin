# Hands-on benchmark: Gemini Notebook (formerly NotebookLM) vs. Learnin

Purpose: measure the product we're competing with **on the same material and the same questions** that we'll later run through Learnin. The numbers become the baseline in `evals/` (§7 of ARCHITECTURE.md).

Who runs it: you, signed in to your own Google account, or a Claude session running on your Mac (desktop app / Claude in Chrome) where you sign in yourself. Never share the password itself.

Time needed: ~60–90 minutes.

---

## 1. Build the test notebook (same sources in both products)

Pick one subject you're actually studying. Use **6 sources** that stress different modalities:

| # | Source | Why it's in the set |
|---|---|---|
| S1 | A text-based research paper PDF (10–20 pages, with equations and at least one table) | Math, tables, citation precision |
| S2 | A **scanned** PDF or a photographed book chapter (no text layer) | OCR / vision handling |
| S3 | A long PDF (200+ pages, e.g. a textbook) | "Lost in the middle", long-source recall |
| S4 | A YouTube lecture **with** captions (30–60 min) | Transcript grounding, timestamp citations |
| S5 | A blog post / docs page with code blocks and diagrams | Web extraction, figures |
| S6 | A photo of handwritten notes or a whiteboard diagram | Image understanding |

Record for each source: **time from "add" to ready** (stopwatch), success or failure, and the error message if it failed.

## 2. Question set (24 questions)

Write the questions **before** you look at any answers. For each one, note the expected source + page/timestamp yourself (this is your ground truth).

| Type | Count | Example shape | What it tests |
|---|---|---|---|
| Lookup | 4 | "What learning rate does S1 use for the base model?" | Precise retrieval |
| Explain | 4 | "Explain in simple terms why S1 scales by 1/√d_k." | Answer quality at the right level |
| Table / number | 3 | "According to Table 2 in S1, which model has the lowest BLEU?" | Tables, numerical reasoning |
| Math | 2 | "Derive equation 3 in S1 step by step." | LaTeX / math handling |
| Scanned / image | 3 | "What does the diagram on page 4 of S2 show?" / "What did I write about X in S6?" | OCR, vision |
| Long-source | 2 | A fact from the middle of S3 (e.g. page ~120) | Long-document recall |
| Video | 2 | "At what point in S4 does the lecturer introduce X, and what example does he use?" | Transcript, timestamps |
| Multi-hop | 2 | "How does S1's definition of X differ from the lecture's (S4)?" | Cross-source synthesis |
| Unanswerable | 2 | Something plausible but **not** in any source | Abstention / honesty |

## 3. What to record per question

| Field | How |
|---|---|
| TTFT (s) | Stopwatch from Enter to first visible word |
| Total time (s) | To the last word |
| Length | Rough word count |
| Correct? | 0 = wrong, 1 = partially right, 2 = fully right (against your ground truth) |
| Unsupported claims | Count sentences that cite nothing or cite something that doesn't support them |
| Citation precision | Of the citations shown, how many point at the right passage? Click each one |
| Citation granularity | Exact sentence / right paragraph / right page only / top of source |
| Abstained correctly? | For the unanswerable questions only |
| Notes | Tone, level-appropriateness, formatting (math rendering, tables) |

Use the sheet template at the bottom. Run each question **in a fresh chat** so history doesn't help.

## 4. Power-user tasks (record time + quality, 1–5)

1. Restrict sources to S1 + S4 only, then ask a multi-hop question. Does the scoping work?
2. Configure chat: set the goal to "explain like I'm a beginner" / Learning Guide mode. Ask an Explain question again and compare.
3. Generate: Audio Overview (time it), Mind Map, Study Guide/Report, Flashcards, Quiz. Spot-check 5 flashcards and 5 quiz questions for factual errors.
4. Discover sources: Fast Research vs. Deep Research on your topic. Count suggested sources, how many are relevant, and the time taken.
5. Save an answer to a note. Do its citations survive?
6. Mobile: share a YouTube link from the YouTube app into a notebook. Count the taps and time to ready.
7. Ask a follow-up 10 turns deep. Does it still remember turn 1?

## 5. Score sheet template

```
| Q# | Type | Expected (source+loc) | TTFT s | Total s | Words | Correct 0-2 | Unsupported # | Cites ok/total | Granularity | Abstain ok | Notes |
|----|------|-----------------------|--------|---------|-------|-------------|---------------|----------------|-------------|------------|-------|
| 1  | lookup | S1 p.6 §5.3         |        |         |       |             |               |                |             |  n/a       |       |
```

## 6. How we'll use it

- These 24 questions plus the 6 sources become **golden set v0** for Learnin's eval harness, so the same questions get scored automatically on every change.
- Targets for Learnin v1: correctness ≥ the baseline; **unsupported claims ≤ the baseline**; citation granularity at the **exact passage** with page/timestamp; correct abstention on 2/2; TTFT ≤ the baseline.

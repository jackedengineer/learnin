# Learnin in plain language

This is the non-technical companion to [ARCHITECTURE.md](./ARCHITECTURE.md). It explains what each piece does and what happens, step by step, when you use the app.

---

## The one-paragraph version

You create a **notebook** for something you're learning. You drop in your material: PDFs, slides, photos of notes, lecture recordings, transcripts, links. The app quietly **reads everything** and breaks it into small passages, remembering exactly where each passage came from (page 12, minute 14:32, the third paragraph of a blog post). When you ask a question, it **finds the handful of passages that matter**, gives them to an AI tutor and tells it "answer only from these, and show your sources". You get an explanation pitched at your level, with numbered citations. Tap one and you're taken to that exact page or moment in the video.

---

## The building blocks, as a library

Think of the system as a small, very fast library with a tutor on staff.

| Library role | What it is in Learnin | What it actually does |
|---|---|---|
| **Front desk** | Web app (React) and mobile app (Expo) | Where you add material, ask questions and read answers |
| **Librarian at the desk** | **API** (Hono, on Cloudflare Workers) | Takes every request, checks who you are, and coordinates everything else. Runs worldwide, close to you |
| **Storage room** | **R2** (Cloudflare file storage) | Keeps the original files exactly as you uploaded them, plus the intermediate work (transcripts, page images) |
| **Back-office team** | **Workflows** (Cloudflare) | Processes each new source through a checklist: download → read → split → label → index. If a step fails, it retries *that step*, not the whole thing |
| **AV room with heavy equipment** | **Media container** (ffmpeg, yt-dlp, PDF renderer) | The heavy lifting the lightweight back office can't do: pulling audio out of video, grabbing key frames, turning PDF pages into images |
| **Card catalogue / ledger** | **Neon Postgres** (Singapore) | The official record: your notebooks, every source, every passage's text and *exact location*, your conversations, what each answer cost |
| **The "find by meaning" index** | **Qdrant** (vector database, Singapore) | Like a librarian who remembers every passage by *what it's about*. Ask "why do we scale attention?" and it finds the passage that explains it, even if the wording is different. It also does keyword matching for exact terms |
| **Meaning translator** | **Voyage** embeddings | Turns each passage (and each image) into "meaning coordinates" so Qdrant can compare them |
| **Second-opinion judge** | **Voyage reranker** | Takes the ~50 candidate passages and reorders them by how well they *actually* answer your question, keeping the best ~10 |
| **Three tutors** | **Claude**: Haiku, Sonnet, Opus | A quick junior tutor for simple lookups, a solid everyday tutor for most questions, and a senior professor for hard, multi-source or "derive this" questions |
| **The dispatcher** | **Model router** | Glances at your question and the passages found, then decides which tutor takes it. You can override with Quick / Auto / Deep |
| **The meter on the tutors** | **AI Gateway** (Cloudflare) | Logs every call to Claude, how long it took and what it cost, and enforces rate limits |
| **Notice board** | **Durable Object per notebook** | Posts live progress ("Transcribing… 60 %") to your screen |
| **Cashier** | **Durable Object per user** | Keeps a running total of today's AI spend and stops before you blow your budget |
| **Quality inspector** | **Eval harness** | A fixed set of test questions with known answers, re-run on every change to prove answers got better and not worse |

**Why two databases?** Postgres is the **source of truth**: if it isn't in Postgres, it doesn't exist. Qdrant is a **search index built from Postgres**, like the index at the back of a book. If the index ever gets out of sync, we rebuild it from the book. When Qdrant finds passages, the app always double-checks them against Postgres before showing them, so a stale index entry can never leak into an answer.

**Why Singapore?** Neon is in Singapore, and the vector database must sit in the same place. Every question needs a Postgres lookup and a Qdrant lookup, and keeping them next to each other (and running the API near them) keeps answers fast.

---

## User journeys

### Journey 1: "I want to learn transformers"

1. You tap **New notebook**, name it *Transformers from scratch*, and answer two quick prompts: *What's your goal?* ("understand the paper well enough to implement it") and *Your level?* ("comfortable with Python and basic linear algebra").
2. The app saves this to Postgres. These answers shape **every** explanation in this notebook. The tutor is told your goal and level each time.

### Journey 2: Adding a PDF (the paper)

1. You pick `attention-is-all-you-need.pdf`. The file goes **straight from your device to R2** (the API only hands out a one-time upload link), so large files don't clog anything.
2. R2 rings a bell ("new file!"), which starts a **Workflow** for that source. You see a progress card:
   - **Read** (~10–30 s): pull out the text page by page. Pages that are scanned, or full of tables, equations or figures, are turned into images and **read by Haiku's vision** into clean text, with math as LaTeX and tables as tables.
   - **Split** (~1 s): cut the paper along its own sections into ~500-word passages. Each passage remembers its page and on-page position, and which section it sits in.
   - **Label** (~10–30 s): for each passage, Haiku writes a one-line "you are here" note ("From §3.2, explaining why dot products are scaled…"). This makes search far more accurate.
   - **Index** (~5–10 s): each passage gets its meaning coordinates (Voyage). It's saved to Postgres, then added to Qdrant.
   - **Ready.** A short **source guide** appears: a summary plus key-topic chips you can tap to start asking.
3. Total for a 15-page paper: **about 1 minute**. If anything fails (say, the AI provider is briefly overloaded), only that step is retried.

### Journey 3: Adding a lecture from your phone

1. You're on YouTube, or you've got your own screen recording of a course, or just its transcript file (`.vtt`, `.srt`, timestamped `.txt`). You tap **Share → Learnin → pick the notebook**.
2. The back office sends it to the **AV room**:
   - YouTube with captions → use the captions. No captions, or your own recording → extract the audio and **transcribe it** (Whisper), with a timestamp on every sentence.
   - Transcript file only → no transcription needed. It's ready in seconds. Link it to the video if you have it, so citations can jump to the right moment.
   - The video is scanned for **scene changes**. Each new slide or whiteboard state becomes a key frame that the tutor describes ("slide: Multi-Head Attention diagram, 8 heads…").
3. The transcript is split into ~1–2 minute passages, each tied to its **start and end time** and the slides shown during it.
4. A 1-hour lecture takes roughly **5–10 minutes**. You get a push notification when it's ready.

### Journey 4: Asking a doubt while studying (the core loop)

You're at **14:32** of the lecture and confused. You type: *"Why does he say we need positional encoding? Isn't order obvious?"* with **Focus: Lecture 3 @ 14:32** attached.

| Step | What happens | Time |
|---|---|---|
| 1. Understand | Haiku rewrites the question into a standalone search query and tags it: *explain-type, medium difficulty, not visual* | ~0.3 s |
| 2. Search | Qdrant runs a **meaning search** and a **keyword search** together and merges them into ~50 candidates. Passages around 14:32 in the lecture are always included | ~0.1 s |
| 3. Double-check | Candidates are fetched from Postgres (the source of truth); anything stale is dropped | ~0.01 s |
| 4. Rerank | The judge keeps the best ~10 passages | ~0.3 s |
| 4b. (Only if needed) | If the passages look thin, search once more with reworded queries (status: "searching again…") | +~0.5 s |
| 5. Show sources | Your screen immediately shows **"Using: Lecture 3 (14:05–15:40), Paper §3.5, Blog post 'Positional encoding explained'"** | at ~0.8 s |
| 6. Pick a tutor | Conceptual question, several sources → **Sonnet** (everyday tutor) | instant |
| 7. Answer | Sonnet streams an explanation at your level: intuition first, then the formula, then an example. Every claim carries a **numbered citation** | first words at ~1.5–2.5 s |
| 8. Save | The answer, its citations, which tutor answered, the time taken and the cost (~$0.03) are recorded | — |

**Shortcut: "read the whole thing" mode.** If you've narrowed the question to one paper or one lecture (and it's not huge), the app skips the search entirely and hands the tutor **the whole source**. The answer header tells you which happened: *"Read all of Lecture 3"* or *"Searched 6 sources, used 9 passages"*. The first question on that source costs a bit more. Follow-ups are cheap because the source stays "in the tutor's short-term memory" (prompt caching).

**Answer modes** (per notebook): **Default** gives a direct cited answer. **Tutor** checks your understanding and gives hints before full answers. **Custom** follows your own instructions. You also pick shorter / default / longer.

### Journey 5: Tapping a citation

- **[1] → Lecture 3, 14:47**: the video player opens and **jumps to 14:47**.
- **[2] → Paper, page 6**: the PDF opens on page 6 with **the exact sentence highlighted**, not a whole paragraph.
- **[3] → Blog post**: the page opens scrolled to the quoted paragraph.

This is the trust loop. You can always check the tutor against the original.

### Journey 6: Asking something your sources don't cover

You ask *"How does FlashAttention speed this up?"*, but nothing in the notebook mentions it.

1. The judge's scores come back low → the system flags **low coverage**.
2. The tutor says plainly: *"Your sources don't cover FlashAttention."* It then offers to **search the web** or to **find a good source to add**.
3. If you allow the web search, web-based claims are clearly labelled **[web]**, separate from your own material.

### Journey 7: "Find me good material"

1. You tap **Discover**. The tutor plans a few searches based on your goal and level (a beginner-friendly explainer, the canonical paper, a well-known lecture).
2. It returns ~10 suggestions with a one-line "why this" each, and flags ones that duplicate what you already have.
3. **You approve** the ones you want. Nothing enters your notebook without your OK, because the quality of your sources *is* the quality of your answers.

### Journey 8: A hard question ("Deep")

*"Derive why softmax(QKᵀ/√d)V has variance ~1 when entries are unit-variance, and compare with how the lecture motivates it."*

The dispatcher sees a **derive + compare across sources** question and hands it to **Opus**, the senior tutor. It takes a few seconds longer and costs ~2× more. If an everyday-tutor answer ever doesn't land, tapping **"Explain again"** sends the next attempt one tutor higher.

### Journey 9: Revising (later phase)

From any notebook: **flashcards** and **quizzes** generated from your sources (each card links back to its citation), scheduled with spaced repetition so you see each card just before you'd forget it.

---

## How this compares to Gemini Notebook (formerly NotebookLM)

Measured hands-on on 2026-11-06, with 24 questions on the same 6 sources ([full results](./research/notebooklm-hands-on-results.md)):

| | Gemini Notebook (measured) | Learnin (target) |
|---|---|---|
| **Time to first word** | **~20 s on average** (12–53 s). It searches and "thinks" in several rounds | **Under 2.5 s.** One search pass, plus one extra round only when coverage looks thin |
| Accuracy | Very good: 23 of 24 correct or nearly so; 3 of 24 answers added a claim the sources don't support | At least as good. This is the bar we must not trade away for speed |
| Saying "not in your sources" | Correct 2/2, no false refusals | Same, plus a clear "Background knowledge" label for anything outside your sources |
| Scanned PDFs, tables, figures | **Handled well** (better than the online reviews said) | Also handled (vision at ingestion), so not a differentiator |
| Where a citation lands | ~600-char passage in text PDFs; **top of the source** for scans; **the whole transcript** for YouTube | **The exact sentence**, on the original page, or **the exact moment** in the video |
| Video | Audio only, **no timestamps**; `.vtt` and `.srt` files rejected | Timestamps on everything, slides from keyframes, transcript files accepted |
| Web pages | A big page was **cut off silently** | "Imported 40 % of this page" warning and a retry |
| Data per question | ~13 MB (resends everything on every update) | Under 50 KB |
| Cost visibility | Usage bar, no numbers | Real dollar estimate before generating, plus "Generate later" at half price |
| Study tools | Flashcards and quizzes, editable, no per-card source | Editable, **each card linked to its source**, spaced-repetition scheduling |
| Conversations | One thread per notebook | Many conversations per notebook |
| Podcast-style audio overviews | Signature feature (~3 min to make 1.5 min of audio) | Maybe later (open question) |

## What runs where

```
Your phone / browser
        │
        ▼
Cloudflare (runs close to Singapore)
  ├─ API                 – the librarian
  ├─ Workflows           – the back office
  ├─ Media container     – the AV room
  ├─ R2                  – the storage room
  ├─ Durable Objects     – notice board + cashier
  └─ AI Gateway          – the meter on Claude
        │
        ├──▶ Neon Postgres (Singapore)   – the ledger (truth)
        ├──▶ Qdrant (Singapore)          – the meaning index
        ├──▶ Voyage                      – meaning coordinates + judge
        ├──▶ Anthropic Claude            – the three tutors
        └──▶ Workers AI (Whisper)        – transcription
```

## What it costs to run (rough, at personal scale)

| Item | Approx. |
|---|---|
| Each question | ~$0.03 on average (simple ones ~$0.002, deep ones ~$0.06) |
| 50 questions/day | ~$45/month |
| Adding a 100-page PDF | a few cents |
| Adding a 1-hour lecture | a few cents |
| Hosting (Cloudflare + Neon + Qdrant + R2) | ~$10–40/month to start |

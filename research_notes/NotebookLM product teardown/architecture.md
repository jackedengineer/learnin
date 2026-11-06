# NotebookLM (now "Gemini Notebook") — Engineering Architecture Teardown (as of 2026-11-06)

**Confidence labels used throughout**
- **[Confirmed]**: official Google statement or a Google staff member speaking on the record.
- **[Reported]**: a credible third party, such as tech press, Wikipedia, or a well-known independent engineer.
- **[Inferred]**: my own reasoning from observable behaviour, limits, or adjacent facts.
- **[Recollection, unverified this session]**: something I remember from material published before mid-2026 that I could not re-fetch here. Treat it as a lead to verify, not as evidence.

**How this research was done.** Most primary hosts could not be reached from this environment, so I could not fetch them directly. The blocked hosts were blog.google, deepmind.google, latent.space, docs.cloud.google.com, workspaceupdates.googleblog.com, en.wikipedia.org and 9to5google.com. Many findings therefore rest on search-engine summaries of those pages, not on full-text reads. The report writer should give exact figures and quotes a bit less weight than a direct read would earn.

**Naming note.** NotebookLM was renamed **Gemini Notebook** on **July 16, 2026**. Google described it as the same standalone product, now "updated with a secure cloud computer", meaning per-notebook code execution — [blog.google](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/); [aiweekly.co](https://aiweekly.co/alerts/google-renames-notebooklm-to-gemini-notebook-adds-code-execution); [chromestory](https://chromestory.com/2026/07/notebooklm-now-gemini-notebook-explained/). The Google Cloud docs now also say "Gemini Notebook Enterprise" — [Google Cloud docs](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs).

---

## 1. Retrieval vs long context, and which models power it over time

### Takeaway
The design is almost certainly a **hybrid**. It started as plain RAG when context windows were small (PaLM 2 era, 2023). It moved toward "stuff as much as fits into Gemini's long context" with Gemini 1.5 (2024), but it had to keep retrieval because the maximum corpus far exceeds any context window. A notebook can hold 50 to 500 sources of up to 500k words each, which is tens of millions of tokens. In Oct 2025 Google said chat now uses the "full" Gemini context window, about 1M tokens and 8x the previous budget. The most likely current behaviour is: put whole sources in context when the notebook fits, and use retrieval with query expansion when it doesn't. **Confidence: medium-high** for the hybrid conclusion. **Low** for the exact switching logic, which Google has never documented.

### Cited Findings
- **[Confirmed]** The first version was RAG on a small context. On Latent Space ("How NotebookLM Was Made", Oct 25, 2024), swyx suggested the early window was "probably, like, 2K, 4K", and PM lead Raiza Martin said the approach was "basically RAG" — [Latent Space episode via search summary](https://www.latent.space/p/notebooklm); [mirror](https://latentspace.podhood.com/8a75c365-f94f-4291-a49a-02686fb2593a).
- **[Confirmed]** In the same episode, Raiza Martin said "Gemini 1.5 is really, really good at absorbing long context". She also said NotebookLM can handle "up to 50 sources, 500,000 words each. Like, you're not going to be able to jam all of that into, like, the context window." That is a direct staff statement that retrieval remains necessary at the upper end — [Latent Space](https://www.latent.space/p/notebooklm).
- **[Confirmed]** Co-founder Steven Johnson describes the core design as "source grounding": the model's working memory, the "context window", is filled with the user's own documents — [Introducing NotebookLM, Steven Johnson](https://adjacentpossible.substack.com/p/introducing-notebooklm). He has also said Audio Overviews "would have been impossible without long-context AI models" (Nov 2024) — [Steven Johnson on X](https://x.com/stevenbjohnson/status/1859417166694764826).
- **[Confirmed]** The source limits grew over time:
  - At the 2023 launch: 10 sources of up to 50,000 words each — [Introducing NotebookLM](https://adjacentpossible.substack.com/p/introducing-notebooklm).
  - By 2024: 50 sources of up to 500,000 words each — [Steven Johnson on X](https://x.com/stevenbjohnson/status/1840844268065456456).
- **[Confirmed]** On **Oct 29, 2025**, Google upgraded chat with an "8x larger context window", "6x longer conversation memory" and a "50% improvement in user satisfaction with responses that use larger amounts of sources". It also added persistent chat history and user-set goals or roles — [blog.google](https://blog.google/technology/google-labs/notebooklm-custom-personas-engine-upgrade/); [TechRadar](https://www.techradar.com/ai-platforms-assistants/gemini/notebooklm-just-got-a-major-chat-upgrade-with-8x-more-context-better-memory-and-smarter-responses); [InfoDocket](https://www.infodocket.com/2025/10/30/google-updates-notebooklm-with-8x-larger-context-window-6xlonger-conversation-memory-more/).
- **[Reported]** Coverage says the full Gemini context window became available in chat on all plans. Since Gemini 2.5's window is 1M tokens, 8x implies the earlier chat budget was about 128k tokens — [TechRadar](https://www.techradar.com/ai-platforms-assistants/gemini/notebooklm-just-got-a-major-chat-upgrade-with-8x-more-context-better-memory-and-smarter-responses).
- **[Recollection, unverified this session]** I recall the same Oct 2025 post saying NotebookLM now "explores your sources from multiple angles" before answering, which suggests multi-query retrieval or decomposition. Check this against the [blog post](https://blog.google/technology/google-labs/notebooklm-custom-personas-engine-upgrade/).
- **[Reported]** The model timeline:
  - The Project Tailwind prototype (Google I/O, May 2023) ran on PaLM 2 — [9to5Google, Jul 2023](https://9to5google.com/2023/07/12/google-notebooklm/); [NotebookLM history (low reliability)](https://notebooklm.gr.com/notebooklm-history.html).
  - Gemini 1.5 Pro was added in spring 2024 — [CMSWire](https://www.cmswire.com/digital-marketing/what-makes-notebooklm-appealing-for-marketers/).
  - Simon Willison identified Gemini 1.5 Pro as the LLM behind the Sept 2024 audio scripts — [Simon Willison](https://simonwillison.net/2024/Sep/29/notebooklm-audio-overview/).
  - Gemini 3 powers the Nov 2025 slide deck and infographic features — [Geeky Gadgets](https://www.geeky-gadgets.com/gemini3-notebooklm-update/).
  - Wikipedia (as summarized by the search engine) says NotebookLM ran on **Gemini 3.5** models as of June 2026 — [Wikipedia: NotebookLM](https://en.wikipedia.org/wiki/NotebookLM). I could not fetch it to verify.
- **[Recollection, unverified this session]** Around March 2025, alongside the Mind Maps launch, Google said NotebookLM had moved to a Gemini 2.0 "thinking" (Flash Thinking) model. Verify this on blog.google before citing.
- **[Reported]** An academic case study describes NotebookLM as RAG-based: it "indexes these documents to generate answers with explicit citations" — [arXiv 2504.09720](https://arxiv.org/html/2504.09720v2).

### Inferences
- **[Inferred]** The arithmetic forces a hybrid.
  - Free tier: 50 sources × 500k words ≈ 25M words ≈ 33M tokens.
  - Top tier: 500 sources ≈ 330M tokens.
  - Both are 30x to 300x larger than a 1M-token window, so retrieval or pre-selection must exist for large notebooks.
  - For typical notebooks (a handful of PDFs, well under 1M tokens), it is likely and cost-feasible with context caching to send everything. The "50% better on responses that use larger amounts of sources" claim fits a policy of putting more raw source text into context.
- **[Inferred]** The likely runtime policy:
  1. Pin the sources the user selected (the per-source checkboxes act as an explicit scope filter).
  2. If the token count of the selected sources is below a budget, send them whole, probably with Gemini context caching.
  3. Otherwise, run multi-query retrieval over passage chunks plus per-source summaries, then rerank, then fill the budget.
- **[Inferred]** "6x longer conversation memory" suggests the chat history budget is a separate allocation from the source budget.
- **For the Claude + Qdrant + Cloudflare builder [Inferred]:**
  - **Copy the hybrid.** Claude's 200k-token window (1M on some models) makes "full-context under a threshold, RAG above it" practical. Prompt caching makes repeated questions against the same notebook cheap.
  - Store chunk offsets in Qdrant payloads so the same chunk IDs serve both retrieval and citations.
  - Use source-selection checkboxes as a hard Qdrant payload filter.
  - **Do differently:** make the switching threshold explicit and observable. NotebookLM users routinely cannot tell when answers come from partial retrieval.

### Gaps
- Google has never published whether or how chat switches between full-context and retrieval, or what embedding or retrieval stack it uses.
- I could not fetch the full Latent Space transcript, so the full RAG-vs-long-context discussion is not captured here.
- Model-version claims after 2025 (Gemini 3, 3.5) come from secondary sources. The search turned up no official model-timeline page.

---

## 2. Source processing (PDF, YouTube, audio, images, Docs/Slides, Sheets) and source guides

### Takeaway
Every source type is normalized into **text with positional anchors**:
- PDF: text and page positions.
- YouTube: the transcript, with timestamps.
- Audio: a transcript.
- Google Docs and Slides: imported snapshots.
- Sheets: up to about 150k active cells.

Each source then gets a summary, the "source guide". Real visual understanding of figures inside PDFs is **not clearly confirmed**. The 2025–2026 Gemini 3 era features (slides, infographics) suggest multimodal parsing grew, but I found no official statement that charts inside PDFs are interpreted. **Confidence: medium.**

### Cited Findings
- **[Confirmed]** The Enterprise docs set a per-source cap of "less than 200 MB or 500,000 words". They also say "NotebookLM Enterprise can process about 150,000 active cells in a single sheet". Supported types include Google Docs, Google Slides, copied text, public URLs, YouTube video, PDFs, Markdown and audio files — [Google Cloud docs, What is NotebookLM Enterprise](https://cloud.google.com/agentspace/notebooklm-enterprise/docs/overview); [Gemini Notebook Enterprise docs](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs).
- **[Confirmed]** Google added Word (.docx) files, broader PDF handling and a Sheets preview together with Deep Research (Nov 2025) — [blog.google: Deep Research and file types](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/); [etcentric](https://www.etcentric.org/tag/notebooklm).
- **[Confirmed]** Citations can point to exact passages, including timestamps for audio and video sources — [Steven Johnson on X](https://x.com/stevenbjohnson/status/1740041487579271492). The timestamp detail is [Reported] by [Simplilearn](https://www.simplilearn.com/what-is-notebooklm-article).
- **[Reported]** Coverage of Gemini 3 describes "seamless processing of text, images, and structured data". That is a claim about the model, not a documented NotebookLM PDF-figure feature — [Geeky Gadgets](https://www.geeky-gadgets.com/notebooklm-gemini-integration/).
- **[Recollection, unverified this session]**
  - YouTube ingestion relies on captions or transcripts, and videos without captions have historically failed to import.
  - Google Docs and Slides sources are snapshots that must be re-synced manually.
  - Image files became a source type in 2025.
  - Verify all three against the NotebookLM Help Center.

### Inferences
- **[Inferred]** Ingestion is an asynchronous job pipeline that runs per source:
  1. Fetch or upload.
  2. Extract to text: PDF text layer plus OCR, a YouTube caption fetch, Speech-to-Text (Chirp or Gemini) for audio, and Docs/Slides export.
  3. Chunk while keeping offsets, page numbers or timestamps.
  4. Embed and index.
  5. Generate a source guide (a summary plus suggested topics or questions) with a Gemini call.

  This explains the observed "processing…" delay of seconds to minutes per source, which scales with size and is longest for audio.
- **[Inferred]** The 500k-word limit is a text-normalization budget, not a byte budget. It strongly suggests everything becomes text before indexing, so images are captioned or OCR'd rather than kept as pixels for retrieval.
- **For the builder [Inferred]:**
  - **Copy:** async per-source ingestion jobs (Cloudflare Queues + Workflows), offset-preserving chunking, and a summary per source used both for UI and as a retrieval routing layer.
  - **Do differently:** run Claude's vision on PDF pages that contain figures and store figure captions as their own chunks with page anchors. This beats NotebookLM's documented behaviour.
  - Keep source snapshots immutable in R2 and version them, so citations never drift.

### Gaps
- I found no official description of how PDFs are parsed (layout model? Gemini native PDF input?) or whether figures and tables are interpreted.
- I found no official description of how the source guide is generated or which model generates it.
- I found no official statement on the speech-recognition model used for audio sources.

---

## 3. Citation mechanism

### Takeaway
Inline numbered citations link to **specific passages**, which open highlighted in place within the source, or at a timestamp for audio and video. This behaviour implies **passage-level chunks with stored character, page or time offsets**. The model is either told to emit chunk IDs, or answer sentences are aligned to passages after generation. Google has not published the mechanism. **Confidence: medium** on "passage-ID citations emitted by the model", **low** on the exact granularity.

### Cited Findings
- **[Confirmed]** "Nearly every response" includes citations that link back to the exact passages used, and clicking opens the passage in its place in the original source (Steven Johnson, Dec 2023) — [Steven Johnson on X](https://x.com/stevenbjohnson/status/1740041487579271492); [Introducing NotebookLM](https://adjacentpossible.substack.com/p/introducing-notebooklm).
- **[Reported]** Sources disagree on granularity. One blog calls the citations paragraph-level, while Simplilearn says they point to the "exact passage or timestamp" — [Simplilearn](https://www.simplilearn.com/what-is-notebooklm-article); [Teacher and Task (illustrative pipeline, not verified)](https://www.teacherandtask.com/blog/notebooklm-explained-google-research-tool).
- **[Reported]** The academic case study says each answer is traceable to its source, "though this mechanism is not perfect" — [arXiv 2504.09720](https://arxiv.org/html/2504.09720v2).
- **[Reported]** I found no credible reverse-engineering write-up of the citation internals. The available "how it works" posts are generic RAG diagrams or clones, for example a [Medium clone write-up](https://nayakpplaban.medium.com/mimicking-notebookllm-building-a-grounded-research-assistant-with-citations-memory-and-audio-ac5c2b570804).

### Inferences
- **[Inferred]** In full-context mode, the source text is likely wrapped in passage-delimited segments with IDs, such as `[S3:P41]`. Gemini is instructed to cite segment IDs, and the UI maps each ID to stored offsets for highlighting. In retrieval mode the chunk IDs are the same IDs. One ID scheme for both modes would explain why citations look identical regardless of notebook size.
- **[Inferred]** Clicking a citation opens a highlighted span in a parsed-text view rather than in the original PDF render. That suggests offsets are kept against the extracted text, not against PDF coordinates.
- **For the builder [Inferred]:**
  - Claude's native **Citations API** returns cited spans with character or page indices into supplied documents. It covers this directly, including in full-context mode, so no custom ID protocol is needed.
  - In RAG mode, pass retrieved chunks as `search_result` or document blocks so citations come back pre-anchored.
  - Store `source_id`, `char_start`, `char_end`, `page` and `timestamp` in the Qdrant payload.

### Gaps
- I found no Google statement on whether citations are model-emitted or post-hoc aligned, or on what chunk size is used.

---

## 4. Audio Overviews (including Interactive mode)

### Takeaway
This is a **multi-stage pipeline**. A Gemini long-context model reads the sources and writes a structured two-host script, likely through outline, draft and critique/refine passes, with injected disfluencies and speaker tags. A DeepMind dialogue speech model then renders it: in 2024 a SoundStorm/AudioLM-lineage hierarchical-codec model, and later Gemini native-audio TTS. The several minutes it takes come mostly from the sequential LLM passes over long input, not from TTS, which runs much faster than real time. Interactive mode, which lets the user "join" mid-episode, is a later layer that interrupts playback, answers grounded in the sources, and resumes. **Confidence: high** on "LLM script → dialogue TTS", **medium** on the exact multi-pass structure, **low** on interactive-mode internals.

### Cited Findings
- **[Confirmed]** The DeepMind post "Pushing the frontiers of audio generation" (Oct 30, 2024) describes the speech research behind NotebookLM's Audio Overviews and Illuminate. Its key points:
  - It uses a new speech codec that compresses audio to "as low as 600 bits per second" into hierarchical tokens.
  - A 2-minute dialogue still needs more than 5,000 tokens.
  - The model generates multi-speaker dialogue from a script with speaker-turn markers.

  Source: [DeepMind blog](https://deepmind.google/discover/blog/pushing-the-frontiers-of-audio-generation/), accessed via search summary only.
- **[Reported]** Secondary summaries of that DeepMind post report:
  - It generates a 2-minute dialogue in under 3 seconds on a single TPU v5e in one inference pass, which is more than 40x faster than real time.
  - The model was pretrained on hundreds of thousands of hours of speech and fine-tuned on dialogue data with precise speaker annotations and realistic disfluencies.

  Sources: [AI Singapore mirror](https://learn.aisingapore.org/2024/10/pushing-the-frontiers-of-audio-generation/); [StartupHub](https://www.startuphub.ai/news/deepminds-demonstrable-gains-ai-audio-generation-and-notebooklm-integration).
- **[Reported]** Before the DeepMind post, analysts linked the feature to **SoundStorm**, a Google Research model that turns a script plus short voice prompts into a consistent two-speaker conversation. SoundStorm generates 30 s of audio in 0.5 s on TPU-v4 using parallel decoding of RVQ tokens. Simon Willison described the script as Gemini 1.5 Pro output with alternating speaker tags (Sept 29, 2024) — [Simon Willison](https://simonwillison.net/2024/Sep/29/notebooklm-audio-overview/); [Arize](https://arize.com/blog/exploring-google-notebook-lm) (which calls SoundStorm "speculated").
- **[Reported]** A personal notes site describes the pipeline as outline generation, then script drafting, then a critique phase, then audio synthesis. Low reliability; it is consistent with the Latent Space discussion but unverified — [notes site](https://prg-sh.pages.dev/notes/SoundStorm-and-AI-Audio-Generation).
- **[Recollection, unverified this session]** On Latent Space (Oct 2024), Usama Bin Shafqat and Raiza Martin said the audio pipeline is not a single prompt. It has multiple stages, including planning and critique, and disfluencies ("um", interruptions, "right?") were deliberately designed in. They declined to name the TTS model — [Latent Space](https://www.latent.space/p/notebooklm).
- **[Confirmed]** Google's Gemini 2.5 native-audio post (2025) names NotebookLM Audio Overviews as an example of the capability. It also exposes "NotebookLM-style" two-speaker generation and controllable TTS to developers — [blog.google: Gemini 2.5 native audio](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-2-5-native-audio/).
- **[Confirmed]** Interactive mode lets users press "Join" while listening and ask a question when called on; the hosts answer and then resume. It is English-only, and the help page warns of glitches such as speaker switches — [Gemini Notebook Help](https://support.google.com/gemininotebook/answer/16212820?hl=en). It launched in Dec 2024 — [Wikipedia: NotebookLM](https://en.wikipedia.org/wiki/NotebookLM).
- **[Confirmed]** Audio Overviews expanded to more than 50 languages in April 2025 — [Workspace Updates](https://workspaceupdates.googleblog.com/2025/04/language-expansion-audio-overviews-notebooklm.html). Formats such as Brief, Critique and Debate were added later in 2025 — [Neowin](https://www.neowin.net/amp/latest-notebooklm-update-brings-new-formats-for-audio-overviews/).
- **[Reported, low reliability]** A third-party site claims interactive mode runs on the Gemini Live WebSocket API with barge-in. This is not official — [GeminiDesktop](https://geminidesktop.app/en/blog/notebooklm-audio-overview).

### Inferences
- **[Inferred]** The latency budget breaks down like this:
  - A typical 10–20 minute episode at more than 40x real time takes under a minute of TTS compute.
  - The observed 3–10+ minute wait is therefore mostly queueing plus several long-context LLM calls: reading up to 1M tokens, planning, drafting about 2–4k words of script, and critiquing or revising.
  - It may also include chunked TTS rendering with voice-consistency stitching.
- **[Inferred]** Interactive mode most plausibly works like this:
  1. Pause playback at a turn boundary.
  2. Capture the user's speech, using streaming ASR or Gemini Live native audio.
  3. Generate a short grounded answer in host voices, by RAG over the notebook and the current script position.
  4. Generate a bridging line, then resume the pre-rendered audio.

  This explains the "speaker switch" glitches.
- **For the builder [Inferred]:**
  - **Copy** the staged pipeline: outline → script with speaker tags, deliberate disfluencies and sources referenced by ID → critique pass → TTS.
  - Claude does not do TTS, so pair it with a third-party multi-speaker TTS. Use ElevenLabs or similar, or call Gemini's TTS API, which openly offers "NotebookLM-style" two-speaker output.
  - Run it as a durable background job (Cloudflare Workflows), with progress events to the UI through Durable Objects or WebSockets. Store audio in R2.
  - **Do differently:** stream the first segment while later segments render, to cut perceived latency.

### Gaps
- The exact production TTS model per period is not named publicly for the NotebookLM product itself. There are three candidates: a SoundStorm derivative, the Oct 2024 DeepMind dialogue model, and Gemini 2.5+ native audio.
- I could not retrieve the full Latent Space transcript to quote the multi-pass script details.
- I found no official architecture for interactive mode.

---

## 5. Video Overviews, Slide Decks, Infographics (visual outputs)

### Takeaway
These are **LLM-planned storyboards rendered by image and video models**:
- Video Overviews (mid-2025) began as narrated slides.
- They were upgraded in Oct 2025 with **Nano Banana** (Gemini 2.5 Flash Image) illustrations in six styles.
- 2026 "Cinematic" Video Overviews reportedly chain Gemini 3 (narrative), Nano Banana Pro (images) and Veo 3 (animation).
- Slide decks and infographics (Nov 2025) use Nano Banana Pro. Exported slides are images.

**Confidence: high** on the model names, **medium** on pipeline ordering.

### Cited Findings
- **[Confirmed]** Oct 13, 2025: Video Overviews gained Nano Banana-generated illustrations "drawn from your sources". It added six styles (Watercolor, Papercraft, Anime, Whiteboard, Retro Print, Heritage) and two formats, "Explainer" (structured, comprehensive) and "Brief" (bite-sized) — [blog.google](https://blog.google/technology/google-labs/video-overviews-nano-banana/).
- **[Reported]** Cinematic Video Overviews (2026) use Gemini 3 to understand the sources and structure the narrative, Nano Banana Pro for images, and Veo 3 for the animated video. They rolled out first to Google AI Ultra subscribers — [Tom's Guide](https://www.tomsguide.com/ai/ai-image-video/google-notebooklm-can-now-turn-your-notes-into-ai-videos-visual-learners-will-love-this); [9to5Google guide](https://9to5google.com/guides/notebooklm).
- **[Reported]** Infographics and Slide Deck launched in Nov 2025 — [Wikipedia](https://en.wikipedia.org/wiki/NotebookLM). Images are generated by Nano Banana Pro (the Gemini 3 image model) — [Geeky Gadgets](https://www.geeky-gadgets.com/gemini3-notebooklm-update/); [AIbase](https://news.aibase.com/news/22984).
- **[Reported]** Slide decks export as PDF or PPTX "(slides are images)". Infographics export as PNG, SVG, JPG or GIF — [Explore AI Together](https://exploreaitogether.com/export-download-notebooklm-guide/).
- **[Reported]** NotebookLM's slides stick closer to the sources than the Gemini app's presentations — [AIbase](https://news.aibase.com/news/22984).
- **[Reported]** After the July 2026 rename, Gemini Notebook gained a per-notebook "secure cloud computer" for code execution and producing usable files — [aiweekly.co](https://aiweekly.co/alerts/google-renames-notebooklm-to-gemini-notebook-adds-code-execution); [Medium](https://medium.com/@mubashirburfat4/gemini-notebook-just-got-a-huge-upgrade-it-can-now-create-files-you-can-actually-use-5ce0aa5a38f6).

### Inferences
- **[Inferred]** The pipeline is:
  1. A long-context Gemini pass produces structured JSON: a scene or slide list with titles, bullets, a narration script, image prompts and source citations.
  2. TTS renders the narration.
  3. An image model renders each slide or scene, with text baked into the image. That is why exported PPTX slides are images, not editable text.
  4. Server-side compositing (ffmpeg-style) produces the video.

  Each stage is parallelizable per scene, which explains the multi-minute generation time.
- **For the builder [Inferred]:**
  - **Copy** the "JSON storyboard → render" split.
  - **Do differently:** render slides as HTML/SVG or real PPTX text, using Claude to generate the layout and only images from an image model. Users get editable decks, which is a known NotebookLM pain point given the image-only slides.
  - Video compositing likely needs a container outside Workers (Cloudflare Containers or Sandbox).

### Gaps
- I found no official pipeline description for Video Overviews, and no official source for the Veo 3 claim beyond press.

---

## 6. Mind maps, reports (briefing docs, study guides), flashcards and quizzes

### Takeaway
These are best explained as **structured-output generations over the selected sources**: JSON trees for mind maps, JSON Q/A lists for flashcards and quizzes, and Markdown documents for reports. They are produced by one or a few long-context calls, then rendered client-side. Clicking a mind-map node triggers a normal grounded chat query about that node. **Confidence: medium** (from behaviour; little official detail found).

### Cited Findings
- **[Reported]** Mind Maps launched in March 2025. Briefing docs, FAQs, study guides and timelines have existed since 2023–24. Flashcards and quizzes launched in 2025 — [Wikipedia: NotebookLM](https://en.wikipedia.org/wiki/NotebookLM) (search summary only).
- **[Reported]** Discover-imported sources "work with other features like Briefing Docs and Audio Overviews", meaning all generated artifacts operate over the same normalized source set — [blog.google: Discover sources](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-discover-sources/).

### Inferences
- **[Inferred]** Mind maps:
  1. Hierarchical topic extraction (topic → subtopic → leaf) into JSON.
  2. Rendering in a client-side graph component.
  3. A node click sends a templated chat prompt ("Discuss what these sources say about X in the context of Y"), which yields cited answers. This matches observable behaviour: clicking a node posts a question into chat.
- **[Inferred]** Flashcards and quizzes are JSON arrays of `{question, answer/options, correct, explanation, citation}`. Difficulty and count are user parameters, so they are likely prompt variables.
- **For the builder [Inferred]:**
  - **Copy** this directly with Claude structured outputs or tool-use JSON schemas.
  - Include citation IDs in each item so cards can link back to source passages.
  - For large notebooks, use map-reduce: summarize per source, then combine.

### Gaps
- I found no official engineering detail on these features or on how they handle notebooks too large for context.

---

## 7. Discover sources, Fast Research and Deep Research

### Takeaway
**Discover sources** (Apr 2025) is a fast web-search agent: describe a topic, it searches and ranks pages, and returns about 10 importable sources with short annotations. **Deep Research** (Nov 2025) brings the Gemini Deep Research agent into the notebook. It plans a search, browses hundreds of pages in the background, writes a cited report, and lets the user import both the report and its sources. Imported web pages become ordinary sources, snapshotted and processed like any URL. **Confidence: medium-high.**

### Cited Findings
- **[Confirmed]** Discover sources: "describe a topic" and NotebookLM "gathers hundreds of potential web sources in seconds", then presents a curated set to import — [blog.google: Discover sources](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-discover-sources/).
- **[Reported]** Discover returns up to 10 recommended sources, each with an explanation, and the user checks which to import — [XDA](https://www.xda-developers.com/notebooklm-search-web-research-made-easy/); [Tom D'Accord](https://tomdaccordai.substack.com/p/exploring-notebooklms-new-discover).
- **[Confirmed]** Deep Research arrived in NotebookLM together with new file types (Nov 2025) — [blog.google](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/).
- **[Reported]** Deep Research makes a research plan, browses the web and refines the search as it learns, runs in the background, and produces a source-grounded report that can be added to the notebook "within minutes" along with its sources — [Tom's Guide](https://www.tomsguide.com/ai/notebooklm-can-now-browse-the-web-with-deep-research-i-put-the-new-feature-to-the-test); [etcentric](https://www.etcentric.org/tag/notebooklm).
- **[Reported, low reliability]** The Sources panel offers two modes, "Fast Research" (a quick scan suggesting sources) and "Deep Research" (planned, background, hundreds of pages, plus a report). Normal chat answers stay limited to notebook sources — [gemini-notebook-hub guide](https://gemini-notebook-hub.online/hi/guides/notebooklm-deep-research).
- **[Reported]** Background on Gemini Deep Research's architecture (a planning agent, async long-running tasks, iterative search and read) is in the Latent Space interview with its inventors — [Latent Space: The Inventors of Deep Research](https://latent.space/p/gdr). I could not fetch it.

### Inferences
- **[Inferred]** Discover is likely:
  1. An LLM rewrites the topic into several queries.
  2. Google Search is called internally with grounding.
  3. Results are deduplicated and ranked by relevance and quality.
  4. An LLM writes one-line justifications.
  5. On import, the standard URL ingestion job runs.

  "Hundreds in seconds" is consistent with search-index retrieval, not page crawling.
- **[Inferred]** Deep Research is an async agent loop. The plan is shown to the user, then the agent iterates search → fetch → read → reflect, and the run is stored server-side so it survives the user leaving.
- **For the builder [Inferred]:**
  - Claude's **web search and web fetch server tools** plus a Cloudflare Workflow or Durable Object agent loop replicate both modes.
  - **Do differently:** keep web content clearly segregated (provenance badge), and re-verify imported pages for prompt injection. Imported web text becomes trusted grounding context.

### Gaps
- I found no official detail on ranking signals or whether Discover uses the same infrastructure as Gemini Deep Research.

---

## 8. Infrastructure hints: limits, processing delays, privacy, enterprise

### Takeaway
The limits are generous on raw storage (up to 500k words per source, 50–500 sources per notebook) but metered on *generations* per day. That pattern says storage and indexing are cheap and LLM and TTS generation are the scarce resource. Privacy statements say data is not used for training. The enterprise edition runs inside the customer's Google Cloud project with US/EU/global residency, as part of the Agentspace / Gemini Enterprise stack. **Confidence: high** on the limits and enterprise facts, **medium** on what they imply.

### Cited Findings
- **[Confirmed]** NotebookLM Enterprise: "Data stays in your Google Cloud project". It is available in the US and EU multi-regions and globally, and a separate locations page covers at-rest and ML-processing residency — [Google Cloud docs](https://docs.cloud.google.com/agentspace/notebooklm-enterprise/docs); [Data residency page](https://docs.cloud.google.com/agentspace/docs/locations).
- **[Confirmed]** The per-source cap is under 200 MB or 500,000 words. Sheets handles about 150k active cells — [Google Cloud docs](https://cloud.google.com/agentspace/notebooklm-enterprise/docs/overview).
- **[Confirmed]** Google's upgrade help page says paid and Enterprise plans get "5x or more" the limits of standard NotebookLM. It lists up to 500 sources per notebook at top tiers ("subject to change"). Sharing a notebook does not change any collaborator's limits — [NotebookLM Help: Upgrade](https://support.google.com/notebooklm/answer/16213268).
- **[Reported]** Third-party pages cite 300 sources per notebook for Enterprise Standard and Plus. This conflicts with the 500 figure on Google's page, so prefer Google — [aguidetocloud](https://claw.aguidetocloud.com/google/notebooklm/enterprise/); [aicraft-guide](https://aicraft-guide.blogspot.com/2026/04/notebooklm-data-limits-accuracy-guide.html).
- **[Reported]** The July 2026 rename reportedly moved about 30M users to the "Gemini Notebook" brand and folded the product further into the Gemini app and Search. Notebooks had appeared inside the Gemini app in April 2026 — [PPC Land](https://ppc.land/google-kills-notebooklm-name-moving-30-million-users-to-gemini-notebook/); [nlmtools](https://www.nlmtools.com/zh-TW/blog/notebooklm-is-now-gemini-notebook).
- **[Reported]** Privacy coverage says NotebookLM does not train models on user uploads, chats or responses. Enterprise and Workspace data is covered by Cloud and Workspace data-processing terms — [waimakers](https://www.waimakers.com/en/resources/ai-data-security/google-notebooklm); [nordflux](https://nordflux.de/en/insights/notebooklm-unternehmen). I could not fetch Google's own privacy help page to quote it.
- **[Confirmed]** Google has published how it developed and tested NotebookLM, including grounding and evaluation — [blog.google: How Google developed and tested NotebookLM](https://blog.google/technology/ai/developing-notebooklm/). Not fetched, so details not captured.
- **[Reported]** The Google Cloud docs name the enterprise product "NotebookLM Enterprise" under Agentspace and later "Gemini Notebook Enterprise" under Gemini Enterprise — [docs](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs).
- **[Recollection, unverified this session]** NotebookLM Enterprise was documented with IAM roles, CMEK and VPC Service Controls support, and a REST API for creating notebooks, adding sources and generating audio overviews (around 2025). Verify on docs.cloud.google.com.

### Inferences
- **[Inferred]** The per-source 500k-word / 200 MB limit is an indexing cap. The per-day generation caps (chats, audio, video) are the real cost controls. This implies source text is indexed once and amortized, while each audio or video generation costs several full-context LLM calls plus TTS or image rendering.
- **[Inferred]** Enterprise "data stays in your GCP project" implies per-tenant storage and index resources provisioned in the customer project, likely built on the Agentspace / Vertex AI Search data-store stack, with Gemini served regionally. That is consistent with the residency docs.
- **For the builder [Inferred]:**
  - **Copy** the cost model: unlimited-ish storage, metered generations.
  - Use Qdrant multitenancy with a `tenant_id` and `notebook_id` payload index, rather than a collection per notebook.
  - Store raw sources and generated media in R2, put ingestion and generation in Queues and Workflows, and handle per-notebook realtime state and progress in Durable Objects.
  - State a clear no-training policy. Anthropic's commercial API terms already exclude training on API data by default, so this is easy to promise.
  - **Do differently:** expose job status and partial results, since NotebookLM's opaque "generating…" waits are a common complaint.

### Gaps
- I found no public detail on Google's internal serving infrastructure for NotebookLM: indexing stack, embedding model, caching, or TPU allocation.
- I could not fetch the consumer privacy help-center page to quote the exact no-training wording.
- I could not verify the post-2025 enterprise API surface.

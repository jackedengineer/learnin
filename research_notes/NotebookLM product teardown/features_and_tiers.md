# Google NotebookLM / Gemini Notebook: feature set and plan limits (as of 2026-11-06)

> **How this was researched:** WebFetch could not reach any host from this environment (DNS failures for support.google.com, blog.google, workspaceupdates.googleblog.com, techcrunch.com, en.wikipedia.org and glasp.co). Every finding below therefore comes from **WebSearch result summaries and snippets**, not full-page reads. Treat each figure as "reported in search snippets of the cited page". Official Google URLs are labeled [OFFICIAL]. Everything else is press or third-party blogs. Many third-party pages are SEO or affiliate sites ([3P-blog]) and are weaker evidence.

---

## 0. Product status: was it renamed?

### Takeaway
Yes. **NotebookLM was renamed "Gemini Notebook" on 2026-07-16.** Google says it is still a standalone product, not folded into the Gemini app, but notebooks now also show up inside the Gemini app and AI Mode in Search. Each notebook also gained a "secure cloud computer" that runs code.

### Cited Findings
- Google Workspace Updates post titled "NotebookLM is now Gemini Notebook" (July 2026) [OFFICIAL]. — [Workspace Updates](https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html)
- Google blog post "NotebookLM is now Gemini Notebook" [OFFICIAL]. It describes the same standalone product, now working across more of the Google ecosystem and updated with a secure cloud computer. The new name and logo roll out across interfaces "over the next several weeks". — [blog.google](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)
- TechCrunch, 2026-07-16: "Google continues its renaming streak by turning NotebookLM to Gemini Notebook". — [TechCrunch](https://techcrunch.com/2026/07/16/google-continues-its-renaming-streak-by-turning-notebooklm-to-gemini-notebook/)
- The help center now carries the "Gemini Notebook Help" branding, and some pages sit under support.google.com/gemininotebook. — [Gemini Notebook Help: add/discover sources](https://support.google.com/gemininotebook/answer/16215270?hl=en&co=GENIE.Platform%3DDesktop); [Gemini Notebook Help FAQ](https://support.google.com/notebooklm/answer/16269187?hl=en)
- A Wikipedia article now exists under the title "Gemini Notebook". — [Wikipedia: Gemini Notebook](https://en.wikipedia.org/wiki/Gemini_Notebook)
- Reported, not official: old notebooklm.google.com links redirect to notebook.google.com. — [Glasp 2026 guide](https://glasp.co/articles/notebooklm-2026) [3P-blog]
- Reported, not official: the Gemini app can create and edit notebooks as of **2026-10-23**, and notebooks appear as a "Connected App" in Gemini. — [Glasp](https://glasp.co/articles/notebooklm-2026); [theaicareerlab](https://theaicareerlab.com/blog/notebooklm-is-now-gemini-notebook-2026) [3P-blog]
- Lineage: "Project Tailwind" (2023) → NotebookLM → Gemini Notebook (2026). — [atlasworkspace](https://www.atlasworkspace.ai/blog/notebooklm-vs-gemini); [nlmtools](https://www.nlmtools.com/blog/notebooklm-is-now-gemini-notebook) [3P-blog]

### Inferences
- In documentation, "NotebookLM" and "Gemini Notebook" refer to the same product. Third-party pages use both names.
- Rename and Gemini app integration point toward the notebook becoming a "grounded context container" that Google's other AI surfaces can consume. A competing app should expect users to want notebooks reachable from their general chat assistant.

### Gaps
- Could not read the official rename post in full, so the exact URL change, the Workspace edition matrix and the Gemini-app integration details are unconfirmed.

---

## 1. Sources: input types and limits

### Takeaway
- **Per source:** 500,000 words or 200 MB per local upload, on every plan.
- **Sources per notebook:** Free 50, Plus 100, Pro 300, Ultra 500–600 (the Ultra figure varies by guide).
- **Input types:** PDF, text/Markdown, copy-paste, web URLs, YouTube (captions required), audio (transcribed), Google Docs/Slides/Sheets, Word (.docx), images and (since early 2026) EPUB.
- **YouTube is transcript-only:** videos without captions are rejected.

### Cited Findings
**Per-source caps**
- The official FAQ sets the per-source cap at **500,000 words or up to 200 MB for local uploads** [OFFICIAL]. — [Gemini Notebook Help FAQ](https://support.google.com/notebooklm/answer/16269187?hl=en)
- The caps are reported as the same on every plan. Paid tiers raise only the number of sources per notebook. — [sourclip](https://www.sourclip.com/blog/notebooklm-source-limits); [elephas](https://elephas.app/blog/notebooklm-source-limits) [3P-blog]
- Conflict: one third-party page claims PDFs allow "500 MB per file, up to 200,000 words". This contradicts the official 200 MB / 500k-word figure and is likely wrong. — [fast.io](https://fast.io/resources/notebooklm-supported-file-types/) [3P-blog]

**Sources per notebook**
- Free **50**, Plus **100**, Pro **300**, Ultra **600** (some guides say 500). Several results attribute these figures to Google's help page. — [elephas](https://elephas.app/blog/notebooklm-source-limits); [notebooklm-guide](https://notebooklm-guide.com/notebooklm-system-limits-benchmarks/); [freeacademy](https://freeacademy.ai/blog/notebooklm-free-vs-plus-2026) [3P-blog]
- Max notebooks: one source says Google AI Pro raises it to **500 notebooks**. The older, commonly cited free figure is 100 notebooks (background knowledge, not re-verified here). — [geminiomniprompts](https://geminiomniprompts.org/blog/notebooklm-limits/) [3P-blog]
- Source and notebook caps are structural and do not reset. They are separate from the compute usage budget (see section 7). — [geminiomniprompts](https://geminiomniprompts.org/blog/notebooklm-limits/) [3P-blog]

**Per-type handling**
- **Audio files** are transcribed on import. All AI queries run against the transcript text, and the 200 MB cap applies. — [fast.io supported types](https://fast.io/resources/notebooklm-supported-file-types/) [3P-blog]
- **YouTube** videos must have captions. Not supported:
  - audio-only videos
  - videos with no captions or transcript
  - private or unlisted videos without accessible captions

  The model sees the transcript, not the frames. — [fast.io](https://fast.io/resources/notebooklm-supported-file-types/) [3P-blog]
- **Images** (JPG, PNG and other common formats) are accepted as sources under the 200 MB ceiling. — [fast.io](https://fast.io/resources/notebooklm-supported-file-types/) [3P-blog]
- **Websites:** paywalled content is not supported. — [fast.io](https://fast.io/resources/notebooklm-supported-file-types/) [3P-blog]
- **Google Slides:** capped at **100 slides** per presentation. — [fast.io](https://fast.io/resources/notebooklm-supported-file-types/) [3P-blog]
- **EPUB:** added as a source type in the March 2026 Workspace update, for all users [OFFICIAL]. — [Workspace Updates, Mar 2026](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html)
- **Deep Research launch, Nov 2025:** Google added "support for more source types" in the same announcement as Deep Research [OFFICIAL]. Background knowledge, not re-verified here: Google Sheets, Drive files as URLs, images, PDFs from Drive, and .docx. — [blog.google: Deep Research + file types](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/); [Android Police](https://www.androidpolice.com/notebooklm-deep-research-support-for-more-source-types/)
- **Building sources from chat, June 2026:** chat can suggest and add sources using research skills and Google Search. — [TechCrunch 2026-06-08](https://techcrunch.com/2026/06/08/notebooklms-new-update-will-help-you-build-source-repository-from-chat/)

### Inferences
- The bar for a competitor:
  - roughly 50–300+ sources per notebook
  - about 500k words per source
  - about 200 MB uploads
  - transcription for audio
  - caption-based ingest for YouTube
  - some image ingestion
  - EPUB and DOCX support
  - Google Drive live-linking
- YouTube handling is transcript-only, so a competitor that also indexes video frames would beat NotebookLM on video content.

### Gaps
- No reliable source on how **figures and images inside PDFs** are handled: whether they are OCR'd, captioned by a multimodal model, or ignored. Not answered.
- Could not confirm native **video file upload** (as opposed to YouTube) or the exact image MIME types.
- Could not confirm the exact Ultra source cap (500 vs 600) or the current max-notebooks figure per tier.
- Background knowledge only: Google Drive Docs/Slides sources are snapshots that need a manual "sync". Not re-verified for 2026.

---

## 2. Chat

### Takeaway
Chat is grounded Q&A over the selected sources, with inline numbered citations. It can be configured with a goal, voice or role:
- **Default**
- **Learning Guide** (a tutor mode)
- **Custom** (up to about 10,000 characters of instructions)

A late-2025 engine upgrade brought an 8x context window, 6x longer conversation memory and saved chat history. The June 2026 update moved the default model to Gemini 3.5.

### Cited Findings
- Google announced that anyone can "set a goal, voice, or role" for chat, for example "a PhD student analyzing sources" or "a creative storyteller". The same post reports an **8x larger context window**, **6x longer conversation memory** and a "**50%**" boost in response quality [OFFICIAL]. — [blog.google: custom goals + engine upgrade](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-custom-personas-engine-upgrade/)
- The help page "Use chat in Gemini Notebook" lists the chat styles, including **Learning Guide**, described as "Best for educational content, helping you grasp new concepts and skills efficiently". It also lists a Custom mode, for example "Respond like a PhD student" [OFFICIAL]. — [Gemini Notebook Help: chat](https://support.google.com/notebooklm/answer/16179559?hl=en)
- Custom mode reportedly accepts up to **10,000 characters** of instructions. — [gemini-notebook-hub](https://gemini-notebook-hub.online/de/guides/notebooklm-chat-settings) [3P-blog]
- The context window is reported as about **1 million tokens** (8x the previous figure). Only third-party sources give this number. — [felloai](https://felloai.com/notebooklm-update-1m-token-chat-goals-saved-history/) [3P-blog]
- Saved or persistent chat history is reported as part of the same update cycle (the felloai article title mentions "saved history"). — [felloai](https://felloai.com/notebooklm-update-1m-token-chat-goals-saved-history/) [3P-blog]
- Response length is configurable: settings cover personas, instructions and length. — [gemini-notebook-hub chat settings](https://gemini-notebook-hub.online/de/guides/notebooklm-chat-settings) [3P-blog]
- **Default model:** Gemini 3.5 as of June 2026. — [TechCrunch 2026-06-08](https://techcrunch.com/2026/06/08/notebooklms-new-update-will-help-you-build-source-repository-from-chat/); [Wikipedia (via search snippet)](https://en.wikipedia.org/wiki/NotebookLM)
- **Code execution in chat:** each notebook gets a secure cloud computer that writes and runs code against uploaded data. It is reported as live for Google AI Ultra and Workspace accounts with AI Ultra or Expanded Access, with "AI Pro web access expected later". — [search summary of Geeky Gadgets / Glasp](https://www.geeky-gadgets.com/notebooklm-2026-new-features/) [3P-blog]; the cloud computer itself is confirmed in the rename post [OFFICIAL] — [blog.google](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)
- **Exports, reported June 2026:**
  - data visualizations and charts
  - PDF
  - Word
  - Markdown
  - CSV
  - JSON
  - Excel
  - PowerPoint

  A later search found no confirmation of Excel export, and an Oct 2026 export guide lists only PDF/PPTX for slides and CSV for flashcards. — [search summary](https://www.geeky-gadgets.com/notebooklm-2026-new-features/); [exploreaitogether](https://exploreaitogether.com/export-download-notebooklm-guide/) [3P-blog; conflicting]

### Inferences
- The table-stakes chat feature set:
  - citations that jump to the source passage
  - per-source include/exclude
  - save-to-note
  - persistent history
  - configurable persona and length
  - a pedagogical "Learning Guide" mode that asks questions back instead of just answering
- The 2026 bar now also includes running code over data sources (tabular analysis and charts).

### Gaps
- Not covered by any fetched or snippet source:
  - the exact behavior of the source-selection checkboxes
  - save-to-note
  - follow-up question suggestions

  These are long-standing features (background knowledge) but are not cited here.
- Whether chat history is per-user in shared notebooks is unconfirmed.

---

## 3. Studio outputs

### Takeaway
The Studio panel generates:
- **Audio Overviews**
- **Video Overviews**
- **Mind Maps**
- **Reports**
- **Flashcards**
- **Quizzes**
- **Infographics**
- **Slide decks**

Studio supports multiple outputs of each type per notebook.

### Cited Findings
**Audio Overviews**
- Four formats, rolled out **2025-09-02**:
  - **Deep Dive** (the default; "a thorough examination of your sources")
  - **Brief** ("1-2 minute, bite-sized overviews")
  - **Critique** ("an expert review, offering constructive feedback on your material")
  - **Debate** ("a thoughtful debate between two hosts")

  Sources: official X account [OFFICIAL] — [@NotebookLM on X](https://x.com/NotebookLM/status/1962949985546187120); [9to5Google 2025-09-02](https://9to5google.com/2025/09/02/notebooklm-audio-overview-debate/)
- Length options are shorter, default and longer. The length control reportedly works only in English. — [notebooklm-guide audio](https://notebooklm-guide.com/notebooklm-audio-complete-guide/); [bibigpt](https://bibigpt.co/en/features/notebooklm-audio-overview-formats-explained) [3P-blog]
- A "Lecture" format, with a single speaker, was reported by press. — [PhoneArena](https://www.phonearena.com/news/notebooklm-audio-overview-feature-new-lecture-format_id176847) (date not captured)
- Interactive mode ("Join", which lets the user interrupt the hosts by voice) and customization prompts are long-standing features (Dec 2024, background knowledge). They were not re-verified in this session.

**Video Overviews**
- Introduced together with the Studio redesign, which added four tiles at the top of the Studio panel: Audio Overviews, Video Overviews, Mind Maps and Reports [OFFICIAL]. — [blog.google: Video Overviews + Studio upgrade](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/)
- Three formats:
  - **Explainer:** narrated, structured slides.
  - **Cinematic:** "immersive, deep-dive videos with fluid animations and rich, detailed visuals". English only, Google AI **Ultra** subscribers aged **18+** only.
  - **Short:** about 60 s vertical **9:16** video.

  Sources: [ChromeUnboxed](https://chromeunboxed.com/notebooklm-gets-a-massive-upgrade-with-cinematic-video-overviews-infographics-and-more/); [XDA](https://www.xda-developers.com/notebooklm-launches-cinematic-video-overviews/); [eesel: short Video Overviews](https://www.eesel.ai/blog/notebooklm-short-video-overviews)
- Explainer visual styles:
  - Classic
  - Whiteboard
  - Watercolor
  - Retro Print
  - Heritage
  - Paper-craft
  - Kawaii
  - Anime
  - Custom

  — [gemini-notebook-hub video](https://gemini-notebook-hub.online/guides/notebooklm-video-overviews) [3P-blog]
- Language coverage is reported as "50+" by one source and "80+" by another. — [gemini-notebook-hub](https://gemini-notebook-hub.online/guides/notebooklm-video-overviews) [3P-blog; conflicting]

**Slide decks and infographics**
- Added in **late 2025**.
- **March 2026:**
  - per-slide **revisions**, regenerated as a new deck
  - **PPTX export**
  - **ten new infographic styles**, for example Sketch Note, Kawaii and Bento Grid
  - slide revisions, infographic styles and Cinematic Video are limited to users **18+**

  Sources: [OFFICIAL] [Workspace Updates, Mar 2026](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html); [ChromeUnboxed](https://chromeunboxed.com/notebooklm-gets-a-massive-upgrade-with-cinematic-video-overviews-infographics-and-more/)
- Date conflict: third-party sources date slide revisions and PPTX export to **2026-02-18**, ahead of the March Workspace post. — [notebooklm-guide changelog](https://notebooklm-guide.com/notebooklm-updates/) [3P-blog]

**Reports, Mind Maps, Flashcards, Quizzes**
- Web Studio offers pre-structured report prompts such as Timeline, Briefing Doc and FAQ, plus Mind Maps. — [makeuseof / search summary](https://www.makeuseof.com/google-notebooklm-mobile-release/)
- "Interactive Mind Maps" are listed under March 2025. — [Medium complete guide](https://medium.com/@shivashanker7337/notebooklm-the-complete-guide-updated-october-2025-1c9ebf5c14f6) [3P-blog]
- Flashcards export to **CSV**. Quizzes reportedly still cannot be downloaded (Oct 2026). — [exploreaitogether](https://exploreaitogether.com/export-download-notebooklm-guide/) [3P-blog]
- New quiz formats:
  - short answer
  - multi-select
  - fill-in-the-blank

  Reported dates conflict: **2026-10-16** vs **2026-09-15**. — [Glasp](https://glasp.co/articles/notebooklm-2026); [notebooklm-guide changelog](https://notebooklm-guide.com/notebooklm-updates/) [3P-blog; conflicting dates]

### Inferences
- **Engineering bar:** about 8 generated-artifact types from one grounded corpus. Each needs format and length knobs, a free-text "focus/customize" prompt, multilingual output, and export (PPTX, PDF, CSV).
- Audio with two TTS hosts plus a voice-interruptible mode is the signature feature.
- Video is now tiered: Explainer and Short for everyone, Cinematic for the premium tier.

### Gaps
- Not verified this session:
  - the exact current report template list (Briefing doc, Study guide, FAQ, Timeline, Blog post, custom, plus auto-suggested formats)
  - Audio Overview language count (50–80+ per background knowledge)
  - generation times
  - per-type daily caps after Sept 2026
- Flashcards and quizzes launched around Sept 2025 (background knowledge). The exact date is unverified.

---

## 4. Discovery: Fast Research and Deep Research

### Takeaway
To find web sources, open the source panel, choose **Web**, then pick a mode:
- **Fast Research** returns a handful of annotated sources in seconds. It is the renamed "Discover sources".
- **Deep Research** browses "up to hundreds of websites" over several minutes and writes a multi-page report.

In both modes the user picks which sources to import (cited and uncited) or imports them all.

### Cited Findings
- Deep Research "can automatically browse up to hundreds of websites on your behalf, think through its findings, and create insightful multi-page reports in minutes". You can keep using the notebook while it runs. You see the report plus a list of all relevant sources, cited and not cited, and you can select or deselect each one or import all [OFFICIAL]. — [Gemini Notebook Help: add/discover sources](https://support.google.com/gemininotebook/answer/16215270?hl=en&co=GENIE.Platform%3DDesktop)
- Deep Research launched together with support for more source types (Nov 2025) [OFFICIAL]. — [blog.google](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/); [unite.ai](https://www.unite.ai/google-notebooklm-introduces-deep-research-feature/)
- Fast Research takes seconds and suggests a handful of web sources with short annotations. It is the same as the old "Discover sources" under a new name. To use either mode: source panel → "Web" dropdown → Deep or Fast → enter a query. — [gemini-notebook-hub deep research](https://gemini-notebook-hub.online/hi/guides/notebooklm-deep-research) [3P-blog]
- June 2026: chat can suggest sources using research skills and Google Search, so users build the source set conversationally. — [TechCrunch 2026-06-08](https://techcrunch.com/2026/06/08/notebooklms-new-update-will-help-you-build-source-repository-from-chat/)

### Inferences
- **Bar:** web discovery with a human-approval step before ingest, an "async agent" mode that runs for minutes, and a report that itself becomes a source.

### Gaps
- No reliable per-run source count for Deep Research (the 2025 launch press reportedly said "up to ~40+"; not verified).
- No per-tier run quota found.
- "Discover sources" launched in April 2025 (background knowledge); the date was not verified.

---

## 5. Sharing, collaboration, public notebooks, mobile

### Takeaway
Notebooks can be shared with specific people or **publicly via a single link**. Native **Android and iOS apps** launched around May 2025. Mobile reportedly lags the web on some features. Detailed 2026 mobile parity was not verified.

### Cited Findings
- Public sharing lets users share notebooks publicly via a single link (no date given). — [search summary, NotebookLM timeline query](https://www.digitalocean.com/resources/articles/what-is-notebooklm)
- The mobile app reached Android and iOS around **2025-05-20**, arriving slightly early. — [MakeUseOf](https://www.makeuseof.com/google-notebooklm-mobile-release/)
- One guide lists what works on mobile and what is "still missing". — [gemini-notebook-hub mobile](https://gemini-notebook-hub.online/guides/notebooklm-mobile-app) [3P-blog; content not retrieved]

### Inferences
- **Bar:** link-based public sharing (view and chat, without editing sources), per-user sharing roles, and a mobile app with background or offline audio playback.

### Gaps
- Not verified this session:
  - offline Audio Overview download on mobile
  - viewer vs editor roles
  - analytics for shared notebooks
  - "featured notebooks" (Google-curated public notebooks from partners such as The Economist/The Atlantic, July 2025 per background knowledge)
  - mobile vs web feature parity in late 2026
- Background knowledge only: public notebooks are not available to Workspace and Enterprise accounts. Not verified.

---

## 6. Tiers and limits

### Takeaway
**As of 2026-09-02, fixed daily caps were replaced by a compute-based usage budget that refreshes every 5 hours, with a weekly ceiling.** It is shared across chat and Studio features. Multipliers relative to Free:

| Plan | Usage budget |
|---|---|
| Free | standard |
| Google AI Plus | 2x |
| Google AI Pro | 4x |
| Ultra | 5x or 20x of Pro, depending on the Ultra plan |

Google has not published absolute numbers. Structural caps (sources per notebook, number of notebooks, words per source) remain fixed per tier.

### Cited Findings
**Compute budget**
- Google's own post, "We're introducing flexible usage limits for Gemini Notebook", says limits refresh every five hours instead of daily [OFFICIAL]. — [blog.google: flexible usage limits](https://blog.google/innovation-and-ai/products/gemini-notebook/new-flexible-usage-limits/)
- 9to5Google, **2026-08-28**: Gemini Notebook is switching to compute-based usage limits, like the Gemini app. — [9to5Google](https://9to5google.com/2026/08/28/gemini-notebook-usage-limits/)
- The change took effect **2026-09-02**. The quota refreshes every 5 hours up to a weekly limit. — [jetstream.blog](https://jetstream.blog/en/gemini-notebook-usage-limit-revision-september-2-2026/); [explainx](https://explainx.ai/blog/gemini-notebook-flexible-usage-limits-5-hour-reset-2026) [3P-blog]
- Google quote: "your overall usage limit will factor in prompt complexity, chat length, number of sources, and the features you use". — [search summary citing Google post](https://blog.google/innovation-and-ai/products/gemini-notebook/new-flexible-usage-limits/)
- Multipliers: AI Plus 2x, Pro 4x, Ultra 5x or 20x the Pro amount. Exact numbers per 5-hour window were not disclosed. — [pasqualepillitteri](https://pasqualepillitteri.it/en/news/14117/gemini-notebook-compute-limits-5-hour-reset); [geminiomniprompts](https://geminiomniprompts.org/blog/notebooklm-limits/); [elephas daily limit](https://elephas.app/blog/notebooklm-daily-limit) [3P-blog]
- Code execution draws heavily on the compute budget. — [geminiomniprompts](https://geminiomniprompts.org/blog/notebooklm-limits/) [3P-blog]

**Superseded fixed daily caps (pre-2026-09-02)**

| Plan | Chats/day | Audio Overviews/day | Sources/notebook |
|---|---|---|---|
| Free | 50 | 3 | 50 |
| Plus | 200 | 6 | 100 |
| Pro | 500 | 20 | 300 |
| Ultra | 2,500–5,000 | 100–200 | 500–600 |

— [freeacademy](https://freeacademy.ai/blog/notebooklm-free-vs-plus-2026); [notebooklm-guide](https://notebooklm-guide.com/notebooklm-system-limits-benchmarks/); [nlmtools](https://www.nlmtools.com/blog/is-notebooklm-free) [3P-blog]

**Structural limits after Sept 2026**
- Sources per notebook: 50 / 100 / 300 / 600. Pro allows up to 500 notebooks. Per source: 500k words or 200 MB on all tiers. — [elephas source limits](https://elephas.app/blog/notebooklm-source-limits); [geminiomniprompts](https://geminiomniprompts.org/blog/notebooklm-limits/) [3P-blog]

**Pricing and gating**
- Pricing context: Google AI Pro about **$19.99/mo**, top Ultra about **$199.99/mo** (some sources say $249.99 for Ultra). NotebookLM Plus is bundled into these plans. — [sourclip pricing](https://www.sourclip.com/blog/notebooklm-pricing) [3P-blog]
- Feature gating:
  - Cinematic Video Overviews: Ultra, 18+, English only.
  - Code execution / cloud computer: Ultra and Workspace AI Ultra/Expanded Access first, with Pro web "later".

  Sources: [XDA](https://www.xda-developers.com/notebooklm-launches-cinematic-video-overviews/); [Geeky Gadgets](https://www.geeky-gadgets.com/notebooklm-2026-new-features/)

### Inferences
- Google moved from countable quotas to a pooled compute budget, mirroring the Gemini app (and Anthropic and OpenAI usage windows). Heavy features (Cinematic video, code execution, Deep Research) are now priced implicitly by compute.
- For a personal app, the free-tier bar of about 50 sources × 500k words, roughly 50 chats and 3 audio overviews a day under the old caps, is generous. A personal app with a BYO API key can match it on structure but not on cost.

### Gaps
- Not verified:
  - Workspace / Enterprise (Google Cloud "NotebookLM Enterprise") specifics: VPC-SC, data residency, per-seat pricing
  - Education (Workspace for Education, under-18 access) limits
  - whether Enterprise still uses fixed caps
- No official absolute 5-hour or weekly numbers exist publicly, per the sources.
- The current Ultra price is unconfirmed: $249.99 is the commonly cited US list price, and $199.99 appears in one snippet.

---

## 7. Release timeline (dated)

### Takeaway
NotebookLM evolved in five phases:
1. Experimental Labs app (2023)
2. Audio Overviews breakout (Sept 2024)
3. Studio expansion: mind maps, mobile, video, flashcards/quizzes, Deep Research, slides/infographics (2025)
4. Rename to Gemini Notebook with Gemini 3.5 and a cloud computer (mid-2026)
5. Compute-based limits (Sept 2026)

Only entries with a citation are listed as confirmed. The rest are background knowledge, flagged "(unverified this session)".

### Cited Findings
- **May 2023:** "Project Tailwind" announced (Google I/O). — [atlasworkspace](https://www.atlasworkspace.ai/blog/notebooklm-vs-gemini) [3P-blog]
- **March 2025:** Interactive Mind Maps. — [Medium guide](https://medium.com/@shivashanker7337/notebooklm-the-complete-guide-updated-october-2025-1c9ebf5c14f6) [3P-blog]
- **About 2025-05-19/20:** Android and iOS apps. — [MakeUseOf](https://www.makeuseof.com/google-notebooklm-mobile-release/)
- **Mid-2025 (July per background knowledge):** Video Overviews and the Studio redesign (4 tiles). — [blog.google](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/) [OFFICIAL]
- **2025-09-02:** Audio formats Brief, Critique and Debate. — [9to5Google](https://9to5google.com/2025/09/02/notebooklm-audio-overview-debate/); [X](https://x.com/NotebookLM/status/1962949985546187120)
- **Late 2025:** Custom chat goals/personas; 8x context; 6x memory. — [blog.google](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-custom-personas-engine-upgrade/) [OFFICIAL]; reported as Nov 2025 by [onecooltip](https://www.onecooltip.com/2025/11/personalize-your-chat-in-notebooklm.html)
- **Late 2025 (Nov):** Deep Research and more source types. — [blog.google](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/) [OFFICIAL]
- **Late 2025:** Slide decks and infographics. — [ChromeUnboxed](https://chromeunboxed.com/notebooklm-gets-a-massive-upgrade-with-cinematic-video-overviews-infographics-and-more/)
- **Feb–Mar 2026:** slide revisions, PPTX export, 10 infographic styles, EPUB, Cinematic Video Overviews (Ultra). — [Workspace Updates Mar 2026](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html) [OFFICIAL]; [XDA](https://www.xda-developers.com/notebooklm-launches-cinematic-video-overviews/); Feb 18 date per [notebooklm-guide](https://notebooklm-guide.com/notebooklm-updates/)
- **April 2026:** Educator-focused updates. — [TeacherCast](https://teachercast.net/edtech/google-notebook-lm-updates-april-2026/) (content not retrieved)
- **2026-06-08:** Gemini 3.5 default; chat-driven source building via Google Search. — [TechCrunch](https://techcrunch.com/2026/06/08/notebooklms-new-update-will-help-you-build-source-repository-from-chat/)
- **2026-07-16:** Renamed **Gemini Notebook**; secure cloud computer (code execution); Gemini app / AI Mode integration. — [TechCrunch](https://techcrunch.com/2026/07/16/google-continues-its-renaming-streak-by-turning-notebooklm-to-gemini-notebook/); [blog.google](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/) [OFFICIAL]
- **2026-08-28 / 2026-09-02:** Compute-based 5-hour usage limits announced and effective. — [9to5Google](https://9to5google.com/2026/08/28/gemini-notebook-usage-limits/); [jetstream](https://jetstream.blog/en/gemini-notebook-usage-limit-revision-september-2-2026/)
- **Sept–Oct 2026:** Short-answer, multi-select and fill-in-the-blank quiz formats (Sept 15 or Oct 16; dates conflict). — [notebooklm-guide](https://notebooklm-guide.com/notebooklm-updates/); [Glasp](https://glasp.co/articles/notebooklm-2026)
- **2026-10-23 (reported):** Gemini app can create and edit notebooks. — [Glasp](https://glasp.co/articles/notebooklm-2026) [3P-blog]
- **Short (9:16, about 60 s) Video Overviews:** date not captured. — [eesel](https://www.eesel.ai/blog/notebooklm-short-video-overviews)

### Inferences
- Cadence is roughly one major Studio output type per quarter, plus model upgrades. For a competitor, "multimodal outputs from a grounded corpus" is the moving target, more than ingest.

### Gaps
- Background knowledge only, not verified this session:
  - **Dec 2023:** US launch on Gemini Pro
  - **June 2024:** Gemini 1.5 Pro and expansion to 200+ countries
  - **2024-09-11:** Audio Overviews launch
  - **Sept 2024:** YouTube and audio sources
  - **2024-12-13:** Interactive "Join" Audio Overviews, NotebookLM Plus and a new UI
  - **Feb 2025:** Plus included in Google One AI Premium
  - **2025-04-02:** Discover sources
  - **Apr 2025:** Audio Overviews in 50+ languages
  - **July 2025:** public notebook sharing and featured notebooks
  - **Sept 2025:** Flashcards and Quizzes
- **Missing between 2026-07-16 and 2026-11-06:** no source found for anything newer than the Oct 2026 quiz formats and the Gemini-app integration.

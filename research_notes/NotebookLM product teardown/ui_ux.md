# NotebookLM (now "Gemini Notebook") UI/UX Teardown, Web + Mobile, as of Nov 2026

> **Method note:** All page fetches (support.google.com, blog.google, androidcentral.com, university guides, capturewhitespace.com) failed with DNS/allowlist errors in this environment. Everything below comes from **web search result snippets/summaries only**, not full-page reads. Treat fine details accordingly. Hosts that would need allowlisting for deeper verification: support.google.com, blog.google, androidcentral.com, learning.uic.edu, capturewhitespace.com.
>
> **Critical context for the writer:** Google **renamed NotebookLM to "Gemini Notebook" on July 16, 2026**. Per coverage, it is the same standalone product, team and notebooks; old notebooklm.google.com links redirect (one source says to notebook.google.com) — [Google blog (via search)](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/); [NC State OIT, 2026-07-17](https://oit.ncsu.edu/2026/07/17/notebooklm-changes-name-to-gemini-notebook/); [ChromeStory, 2026-07](https://chromestory.com/2026/07/notebooklm-now-gemini-notebook-explained/); [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/1697/notebooklm-april-2026-mobile-cinematic-video-gemini-sync). The rename also came with a per-notebook "cloud computer" that writes and runs code on sources, plus sync with Notebooks in the Gemini app (names, sources, custom instructions) — [pasqualepillitteri.it rebrand/code](https://pasqualepillitteri.it/en/news/8195/gemini-notebook-notebooklm-rebrand-code); [Northeast Times, 2026-07-17](https://northeasttimes.com/2026/07/17/google-renames-notebooklm-to-gemini-notebook-adds-code-tools/). The help center now lives at support.google.com/gemininotebook ([Create a notebook – Gemini Notebook Help](https://support.google.com/gemininotebook/answer/16206563?hl=en)).
>
> **UI timeline (for dating claims):** 2023 Project Tailwind → NotebookLM; Dec 2024 redesign to three panels (Sources | Chat | Studio) + Interactive Audio + Plus tier; Mar 2025 citations preserved in saved notes; May 2025 mobile apps; Jul 2025 featured notebooks; Oct 2025 saved chat history + goal-based chat config; Nov 2025 Deep Research; Dec 2025 chat history on all users; Apr 2026 notebooks in Gemini app on mobile, Cinematic Video; Jul 2026 rename. Sources cited in sections below.

## Layout: three panels, collapse/expand, mobile adaptation, home screen, featured notebooks

### Takeaway
Since the Dec 2024 redesign the notebook view has been a three-column workspace (Sources left, Chat center, Studio right), and that structure survives the 2026 rename unchanged per 2026 university guides. The home screen is a flat notebook grid/list with sort, a Featured notebooks tab for consumer accounts, and (reportedly) Collections; true folders were still promised but unshipped as of the latest sources.

### Cited Findings
- Dec 2024: Google redesigned NotebookLM into three panels: Sources, Chat, and Studio, replacing a two-panel design, to make it simpler to move between activities in one interface — [9to5Google](https://9to5google.com/?p=653973); [Google blog, Dec 2024](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-new-features-december-2024/); [Maginative](https://www.maginative.com/article/google-updates-notebooklm-with-new-interface-interactive-audio-features-and-premium-tier/)
- Studio panel framing (Dec 2024): "create new things from their sources with a single click, like Study Guides, Briefing Docs and Audio Overviews" — [Google blog Dec 2024 (via search)](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-new-features-december-2024/)
- 2026 (post-rename) guides still describe three columns: Sources panel on the left (add/manage materials), Chat center, Studio right; one tutorial notes notes "connect to Studio and sometimes the Sources panel, depending on the interface version" — [UIC Navigating Gemini Notebook](https://learning.uic.edu/resources/google-ai-for-education-accelerator-program/ai-tools-and-resources-gemini-notebook/navigating-gemini-notebook/); [capturewhitespace tutorial pt 2](https://capturewhitespace.com/journal/gemini-notebook-setup-and-interface); [U Guelph Studio panel guide](https://guides.lib.uoguelph.ca/c.php?g=748893&p=5430928)
- When a notebook opens, the Chat panel shows a generated summary of all sources (the notebook overview) — [UIC guide (search summary)](https://learning.uic.edu/resources/google-ai-for-education-accelerator-program/ai-tools-and-resources-gemini-notebook/navigating-gemini-notebook/)
- Studio output tile list (2026 screenshot description): Audio, Video, Reports, Quiz, Data Table, Slide Deck, Mind Map, Flashcards, Infographic — [search summary of 2026 university/tutorial guides](https://guides.lib.uoguelph.ca/c.php?g=748893&p=5430928); mid-2026 Studio menu also listed as including Cinematic Video Overviews, Infographics, Slide Decks, Data Tables — [glasp.ai 2026](https://glasp.ai/articles/notebooklm-2026)
- Home screen: notebooks can be shown in list or grid and sorted by title or most recent; list view adds a "Created" column — [superpowerforai guide 2026](https://superpowerforai.com/Guides/organize-notebooklm-notebooks/); [XDA](https://www.xda-developers.com/stopped-manually-organizing-notebooklm-notebooks-found-these-underrated-tools/)
- "Collections" reportedly group notebooks (a notebook can belong to several), shown as chips on the home page — from a Chrome-extension vendor guide, unverified — [superpowerforai](https://superpowerforai.com/Guides/organize-notebooklm-notebooks/)
- Folders: Feb 2026 Google said it was working on folders with no timeline — [Android Authority](https://www.androidauthority.com/notebooklm-folder-organization-3641948/); a July 2026 review still describes flat notebooks with no sub-folders/tags — [thebusinessdive review 2026](https://thebusinessdive.com/notebooklm-review); organization called "a critical flaw" (Nov 2025) — [BigGo News](https://biggo.com/news/202511210750_notebooklm-research-update-organization-flaw)
- Featured notebooks launched July 2025 with curated notebooks from The Economist, The Atlantic, and others — [TechCrunch 2025-07-14](https://techcrunch.com/2025/07/14/notebooklm-adds-featured-notebooks-from-the-economist-the-atlantic-and-others/); [XDA](https://www.xda-developers.com/notebooklms-new-curated-featured-notebooks/)
- Featured notebooks tab only for consumer accounts; Workspace Enterprise/Education reach them only via URL; viewers can read sources, chat, and view pre-made artifacts but cannot generate their own artifacts — [Gemini Notebook Help: public & featured notebooks](https://support.google.com/notebooklm/answer/16322204?hl=en)

### Inferences
- The three-panel model maps cleanly to "inputs → conversation → outputs," which is the core mental model to copy; it has been stable ~2 years despite heavy feature growth, so Studio absorbed new output types as tiles rather than new panels.
- Read-only "featured/public notebook" mode (chat allowed, generation disabled) is a useful permission tier for a learning app's shared course content.
- Organization (folders/tags) is the most persistent home-screen gap; a competitor can differentiate cheaply here.

### Gaps
- No source found (in fetchable snippets) describing the exact collapse/expand controls for the Sources and Studio panels, or a full-screen/expanded Studio view. From prior knowledge (unverified, not sourced here): each side panel has a collapse icon in its header that shrinks it to an icon rail, and opening a Studio artifact or note expands it within the Studio column. Writer should treat as unconfirmed.
- No source on responsive web behavior at narrow widths (tabs vs. columns).
- Whether Collections are an official Google feature vs. an extension-provided feature is unclear.

## Adding sources: dialog, upload flows, pickers, progress, timing, errors

### Takeaway
Sources come in via an "Add sources" dialog (upload files, Google Drive, website URL, YouTube URL, pasted text) plus a "Discover sources"/Fast Research/Deep Research path that proposes web sources to import. Imports are text-extraction based, so failures cluster around captions-less YouTube, paywalled/JS-heavy sites, Drive permissions and size caps, and error messages are often described as vague.

### Cited Findings
- Discover sources button next to Add sources suggests up to 10 sources with explanations of relevance; user picks which to import — [Google blog: Deep Research & file types (Nov 2025)](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types); [MakeTechEasier](https://maketecheasier.com/you-can-now-use-notebooklm-to-discover-data-sources)
- Fast Research "rapidly scans" for sources for immediate review/import; Deep Research does in-depth analysis, runs in the background so you can keep working; you can import any or all results — [Google blog (Nov 2025)](https://blog.google/technology/google-labs/notebooklm-deep-research-file-types/)
- A walkthrough reports Deep Research can surface ~50 sources, some fail to import when paywalled; the source list has per-source checkboxes and a "remove all failed sources" button — [lilys.ai video notes](https://lilys.ai/notes/zh/grok-ai-20251230/use-notebooklm-better) (third-party)
- Limits: 50 sources per notebook (free), per-source max 500,000 words or 200MB; paid tiers (Google AI Plus/Pro/Ultra) raise source count but not per-source limits — [fast.io](https://fast.io/resources/notebooklm-upload-failed/)
- Drive failures often from revoked access or being signed into a different Google account — [fast.io](https://fast.io/resources/notebooklm-upload-failed/)
- Website import grabs visible text only; no images, embedded videos, nested/linked pages; paywalled content unsupported — [fast.io](https://fast.io/resources/notebooklm-upload-failed/); workaround: save page as PDF and upload — [sourclip troubleshooting 2026](https://www.sourclip.com/blog/notebooklm-troubleshooting)
- YouTube: only public videos with captions (user-uploaded or auto-generated); only the transcript is imported — [Gemini Notebook Help: Add or discover sources](https://webproxy.poorya-velaei-d67.workers.dev/https://support.google.com/notebooklm/answer/16215270) (mirror of official page)
- Captionless videos fail "usually with a vague error"; brand-new videos may fail until auto-captions generate (~1–4 h); workaround is copying YouTube transcript into a pasted-text source — [vidnotes](https://vidnotes.app/blog/207-How-to-Fix-NotebookLM-Cant-Import-YouTube-Video-Comments-Disabled); [ytsummarizer](https://blog.ytsummarizer.app/blog/notebooklm-youtube-not-working)
- Drive sources are snapshots; source view offers "Click to sync with Google Drive" to refresh — [sourclip troubleshooting](https://www.sourclip.com/blog/notebooklm-troubleshooting); I/O 2026 reportedly announced automatic Drive sync — [glasp.ai](https://glasp.ai/articles/notebooklm-2026)
- Mobile: share sheet adds websites, PDFs, YouTube videos as new sources — [Google blog: NotebookLM app (May 2025)](https://blog.google/innovation-and-ai/products/notebooklm-app/); [MacRumors 2025-05-20](https://www.macrumors.com/2025/05/20/google-releases-notebooklm-app-for-ios-and-android/)
- Nov 2025 added more source types (per Google blog title "support for more source types") — [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types)

### Inferences
- Pattern worth copying: discovery (Fast/Deep Research) lives *inside* the add-source flow, with a review-then-import checklist, so web research results become first-class grounded sources rather than chat answers.
- Bulk "remove failed sources" implies failed sources remain in the list in an error state rather than being silently dropped — good for transparency, but vague error copy is a known frustration; specific, actionable error messages (e.g., "This video has no captions; paste a transcript instead") are a cheap win.

### Gaps
- No fetched source gave exact processing durations for document ingestion or a description of the per-source progress indicator (spinner vs. progress bar). From prior knowledge (unverified): sources show a loading spinner in the list and are unselectable until processed; most docs process in seconds to under a minute.
- Exact current list of accepted file types (Nov 2025 expansion added e.g. Sheets/images/Word per some reports) not confirmed from fetchable text.

## Source viewing: source guide, key topics, extracted text vs original render

### Takeaway
Clicking a source opens it within the Sources column with a "Source guide" (AI summary + clickable key-topic chips) above the source content; the content shown and exported is the extracted/parsed text, not a faithful original-file render, and visuals in PDFs are not interpreted per guides.

### Cited Findings
- Clicking a source opens a "Source guide" card at the top of the column with a Gemini-generated summary and a list of key topics; clicking a key topic prompts the AI to write a cited explainer in chat — [Computerworld cheat sheet](https://www.computerworld.com/article/1611774/google-notebooklm-generative-ai-notes-app.html); [dazzaji NotebookLM documentation gist](https://gist.github.com/dazzaji/5abdc3e7befabdee508ed0b298bfe3d3)
- An open-source clone tracks "show a source guide — summary and key topics — for each source" as a feature to replicate — [OpenNotebookLM issue #129](https://github.com/tom1030507/OpenNotebookLM/issues/129)
- For uploaded PDFs, only extracted text comes back; bulk export gives parsed text of everything, never the original files; layout/images stay only in the original — [sourclip export guide 2026](https://www.sourclip.com/guides/notebooklm-export-guide); [nlmtools bulk export](https://www.nlmtools.com/blog/notebooklm-export-sources). Conflicting/softer framing: a guide says upload makes a copy of the original and doesn't change it — [nanobits guide](https://nanobits.beehiiv.com/p/notebook-lm-the-ultimate-user-guide-with-real-life-examples)
- AI reads text content only; visuals in PDFs not interpreted (per a third-party guide; may be outdated given later multimodal updates) — [sourclip complete guide 2026](https://www.sourclip.com/guides/notebooklm-complete-guide)

### Inferences
- Showing extracted text (rather than PDF render) makes citation highlighting trivially precise (character-offset spans) — this is likely the main engineering reason for the design. Trade-off: users lose page layout, figures, and page numbers as anchors.

### Gaps
- Whether a 2026 version added an "original view" PDF render toggle could not be confirmed. Some 2026 coverage implies citation "pins" show page numbers (see Citations), which would suggest at least page awareness.

## Citations: inline markers, hover previews, click-to-jump, AV sources, notes

### Takeaway
Answers carry small numbered inline citation chips; hover shows the quoted passage, click opens the source viewer scrolled to the passage with highlighting. YouTube/audio sources cite against the transcript; timestamp-level citations are unconfirmed and reported as unreliable. Since Mar 2025 saving a response to a note keeps its citations.

### Cited Findings
- Official: citations are direct quotes; hovering shows the full quoted text; clicking auto-scrolls the source viewer to where the text appears — [Gemini Notebook Help (via search summary)](https://support.google.com/notebooklm/answer/14276569?hl=en)
- Numbered markers jump to and highlight the corresponding passage — [besthub.dev](https://besthub.dev/articles/how-google-notebooklm-boosts-research-efficiency-with-precise-source-tracing-307c9f61f57c); [freeacademy lesson](https://freeacademy.ai/lessons/notebooklm-grounded-qa-citations)
- Hover preview is a quick check, not full verification (and note rename) — [horadecodar (pt-BR)](https://horadecodar.com.br/?p=45216)
- A scraping tool extracts citations by clicking each citation button to open the source panel, confirming click opens the source panel — [notebooklm-mcp citation-extractor](https://glama.ai/mcp/servers/@roomi-fields/notebooklm-mcp/blob/aa763f58d7fd6ef5a09c78e366468dd000c3c8c6/src/utils/citation-extractor.ts)
- YouTube: Google said inline citations link directly to the video's transcript — [Google blog: audio & YouTube support (Sep 2024)](https://blog.google/technology/ai/notebooklm-audio-video-sources/)
- Timestamps: one third-party guide claims citation pins show page/timestamp; a blog found a cited timestamp didn't match content and no timestamp in the transcript — treat timestamp citations as unconfirmed — [codingstairs notes](https://codingstairs.duckdns.org/en/notes/ai/09-notebooklm); [penchan.co](https://penchan.co/ai/notebooklm/)
- Mar 2025: previously citations appeared only in chat; now pinning a response to Notes keeps sources attached — [AlternativeTo news 2025-03](https://alternativeto.net/news/2025/3/notebooklm-introduces-new-citation-feature)
- Flashcard answers can be explained in chat with citations to the source passages (user report) — [XDA](https://www.xda-developers.com/cant-use-notebooklm-without-these-features/)

### Inferences
- The trust loop (claim → number → hover quote → click → highlighted passage) is the product's signature pattern; it depends on the extracted-text viewer above.
- For a learning app with lecture video/audio, transcript-level citations that jump the player to a timestamp would be a clear improvement over NotebookLM's transcript-text-only approach.

### Gaps
- Visual styling of citation chips (shape/colour) not described in fetchable sources. From prior knowledge (unverified): small grey rounded-number chips; multiple adjacent citations may collapse into "…" expandable.
- Whether citations in notes remain clickable after the note is converted to a source is not confirmed.

## Source selection: checkboxes to scope chat/Studio

### Takeaway
Each source row has a checkbox; only checked ("active") sources feed chat answers (and outputs). Guides recommend deselecting irrelevant sources because the model tries to synthesize across everything selected.

### Cited Findings
- Chat combs exclusively through the "active sources" checked on the left — [UIC guide / capturewhitespace (search summary)](https://capturewhitespace.com/journal/gemini-notebook-setup-and-interface)
- Per-source checkboxes in the list; advice not to leave everything checked because it tries to synthesize from every selected document — [lilys.ai walkthrough notes](https://lilys.ai/notes/zh/grok-ai-20251230/use-notebooklm-better)

### Inferences
- Selection is a lightweight, persistent scoping control — a good alternative to "@-mentioning" documents. Risk: invisible state (users forget sources are unchecked), so a learning app should surface the active count near the chat input.

### Gaps
- Whether a "Select all" toggle exists in the 2026 UI wasn't confirmed (from prior knowledge, unverified: there is one at the top of the Sources list). Whether Studio outputs strictly honor selection was not confirmed by a fetched source.

## Chat UX: suggestions, configuration, notes, history, Learning Guide

### Takeaway
Chat is grounded Q&A with suggested questions, per-response save-to-note, and a notebook-level "Configure" dialog (Goal: Default / Learning Guide / Custom up to 10k chars; Length: Default / Longer / Shorter). Persistent chat history arrived Oct–Dec 2025, private per user in shared notebooks, synced across devices.

### Cited Findings
- Configure Notebook/Chat control sits in the chat panel; setting applies to every conversation and all Studio outputs including Audio Overview — [MakeUseOf](https://www.makeuseof.com/notebooklm-settings-configure-notebook/); [XDA](https://www.xda-developers.com/please-stop-ignoring-notebooklms-customization-features/)
- Goals: Default, Learning Guide, Custom; Learning Guide is more pedagogical, acting like a tutor that prompts with follow-up questions rather than just giving answers; Custom accepts up to 10,000 characters — [UChicago Academic Tech 2026-04-06](https://academictech.uchicago.edu/2026/04/06/google-notebooklm-an-ai-tool-for-research-and-studying/); [Shareuhack 2026 guide](https://www.shareuhack.com/en/posts/notebooklm-advanced-guide-2026)
- Length options: Default, Longer, Shorter (Shorter = tight scannable answers, Longer = more detail) — [futurepedia lesson](https://www.futurepedia.io/courses/google-notebooklm-complete-course/lessons/customize-the-style-and-length-of-your-notebook-responses); unofficial API enumerates goal default/custom/learning_guide and length default/longer/shorter — [notebooklm-mcp-cli API ref](https://github.com/jacob-bd/notebooklm-mcp-cli/blob/main/docs/API_REFERENCE.md)
- Oct 2025: 1M-token context, saved history, goal-based customization announced; history rolled out gradually — [fonearena](https://www.fonearena.com/blog/?p=467636); [mobigyaan](https://www.mobigyaan.com/google-notebooklm-update-2025)
- Dec 17 2025: chat history reached all users on web and mobile; syncs across devices — [Android Authority](https://www.androidauthority.com/notebooklm-chat-history-rollout-3625900)
- In shared notebooks, each user's chat is visible only to them; users can delete history — [fonearena](https://www.fonearena.com/blog/?p=467636)
- Conflict: a University of Michigan article says there's no chat history and recommends saving replies as notes (likely written before Dec 2025) — [UMich Online Teaching](https://onlineteaching.umich.edu/articles/take-control-of-your-content-with-gemini-notebook/)
- July 2026 rename-era: agentic chat that cross-references documents on its own, rolling out to AI Ultra — [nokiapoweruser](https://nokiapoweruser.com/google-notebooklm-upgrade-agentic-features-ai-ultra/)
- Key-topic chips in Source guide and mind-map node clicks both inject prompts into chat (see Source viewing / Studio) — [Computerworld](https://www.computerworld.com/article/1611774/google-notebooklm-generative-ai-notes-app.html)

### Inferences
- Chat history appears as a single continuing thread per notebook (coverage describes "resuming" sessions, not a thread list) — a learning app may want multiple named threads per subject.
- Making the configuration notebook-level (applies to chat + Studio) keeps a single source of truth for "who am I / how should you teach me."

### Gaps
- Exact appearance of suggested-question chips, copy/thumbs/save-to-note button placement not described in fetchable sources (prior knowledge, unverified: suggestion chips under the input and after answers; per-response row with "Save to note", copy, thumbs up/down).
- Whether multiple chat threads per notebook exist in late 2026 is unconfirmed.

## Studio UX: generation, customization, audio player, mind map, flashcards/quiz

### Takeaway
Studio is a grid of one-click output tiles, each with an optional customize (pencil) step; generation runs in the background with an in-panel progress indicator and the result appears in the Studio list. Interactive Audio adds a "Join" button that lets the learner interrupt hosts by voice. Mind map nodes, flashcards and quiz items route back into chat for cited explanations.

### Cited Findings
- Generation runs in the background; you can generate other artifacts or navigate elsewhere — [Audio Overview complete guide 2026](https://gemini-notebook-hub.online/guides/notebooklm-audio-overview-guide); Primebook (Jul 2026): audio created in background, typically a few minutes depending on doc length and chosen output length — [Primebook](https://www.primebook.in/blog/how-to-use-notebooklm-to-convert-lecture-pdf-into-audio)
- A progress indicator shows while processing; finished audio is listed in the panel. No push/email completion notification found — [supademo guide](https://supademo.com/blog/how-to-generate-an-audio-overview-in-notebooklm)
- Interactive mode: began as beta Dec 2024; while listening, tap "Join"; hosts call on you, answer from your sources, then resume — [Wikipedia](https://en.wikipedia.org/wiki/NotebookLM); [Google help: Generate Audio Overview](https://support.google.com/notebooklm/answer/16212820?hl=en); playback must start before Join activates — [Medium how-to](https://muttadrij.medium.com/how-to-interact-with-an-audio-overview-on-notebooklm-b03e53656e94); English-only, only for newly generated overviews, occasional voice glitches — [XDA](https://www.xda-developers.com/i-regret-ignoring-notebooklm-interactive-audio-overview/)
- Mind map: zoom, expand/collapse branches, select any node to ask a question about that topic in chat — [notebooklm-guide.com 2026](https://notebooklm-guide.com/notebooklm-interactive-studio-tools/); [lilachbullock](https://www.lilachbullock.com/notebooklm-studio/)
- Flashcards: user asks chat to explain a card even when right because it cites sources — [XDA](https://www.xda-developers.com/cant-use-notebooklm-without-these-features/)
- Every quiz question/flashcard/mind-map node traces back to uploaded docs (third-party claim) — [notebooklm-guide.com](https://notebooklm-guide.com/notebooklm-interactive-studio-tools/)
- Featured/public notebook viewers can see pre-made artifacts but can't generate — [Gemini Notebook Help](https://support.google.com/notebooklm/answer/16322204?hl=en)

### Inferences
- "Studio artifact → chat" handoff (mind-map node, flashcard explain) is the key loop that turns passive outputs into tutoring — directly applicable to a learning app.
- Background generation without explicit completion notification likely means users must return to the panel; a learning app on mobile should send a push notification on completion.

### Gaps
- No fetched source detailed the customization prompt dialogs per output (prior knowledge, unverified: pencil icon opens dialog with format (e.g., Deep Dive/Brief/Critique/Debate for audio), length, language, and free-text focus; flashcards/quiz allow card count and difficulty).
- Quiz answer-explanation UI and flashcard flip/navigation specifics not confirmed.

## Mobile app UX: share sheet, background audio, offline, differences from web

### Takeaway
Native apps (May 2025; iOS 17+, Android 10+) emphasize consuming Audio Overviews (background play, offline download) and quick capture via share sheet; reviewers found them weaker than web, with gaps around mind maps, notes editing, video downloads, and playback position. In Apr 2026 notebooks also arrived inside the Gemini mobile app.

### Cited Findings
- Launch May 2025; iOS 17+ (iPhone/iPad), Android 10+ (phones/tablets) — [MacRumors](https://www.macrumors.com/2025/05/20/google-releases-notebooklm-app-for-ios-and-android/); [9to5Google](https://9to5google.com/2025/05/19/notebooklm-app-launch/)
- Download Audio Overviews for offline playback; background playback while multitasking; share sheet adds website/PDF/YouTube as source — [Google blog: NotebookLM app](https://blog.google/innovation-and-ai/products/notebooklm-app/)
- Android Central: app feels mainly like a player for Audio Overviews; besides chat not much else; share-sheet shortcut handy but workflow involves window-switching/copying unsuited to small screen — [Android Central](https://www.androidcentral.com/apps-software/ai/the-notebooklm-app-for-android-kept-making-me-want-to-go-back-to-the-website) (2025)
- Performance boost update — [Android Police](https://www.androidpolice.com/notebooklm-mobile-app-just-got-a-big-performance-boost/)
- Apr 30 2026: notebooks in Gemini app on iOS/Android for free and paid users; sharing initially web-only — [pasqualepillitteri.it Apr 2026](https://pasqualepillitteri.it/en/news/1697/notebooklm-april-2026-mobile-cinematic-video-gemini-sync)
- Gaps listed by an unofficial guide: Mind Maps desktop-only, limited notes editing on mobile, no Video Overview downloads, possible sync delays; flashcards claimed at parity — [gemini-notebook-hub mobile guide](https://gemini-notebook-hub.online/guides/notebooklm-mobile-app); [thebusinessdive 2026](https://thebusinessdive.com/notebooklm-review)
- July 2026 review: app doesn't remember position when closed mid-episode; App Store reviewer: iPhone app not as smooth as desktop — [thebusinessdive](https://thebusinessdive.com/notebooklm-review); [App Store reviews](https://apps.apple.com/us/app/google-notebooklm/id6737527615?see-all=reviews)
- Gemini-app notebooks do not generate Studio artifacts directly (per one comparison) — [aiagentslibrary](https://www.aiagentslibrary.com/blog/notebooklm-is-now-gemini-notebook/)
- Latest builds reportedly Android 1.60.8 (2026-10-01), iOS 1.60.7 (2026-10-02) — low-reliability source — [blog.mean.ceo](https://blog.mean.ceo/notebooklm-news-november-2026/)

### Inferences
- Mobile's job is "listen and capture"; desktop's is "build and study." A React Native learning app should make audio resumption (persisted position), offline, and share-to-capture flawless before chasing feature parity.

### Gaps
- Exact mobile navigation (prior knowledge, unverified: notebook view uses bottom tabs Sources / Chat / Studio) not confirmed by fetched source.
- Whether mind maps or video downloads reached mobile by Nov 2026 unknown.

## Common complaints and praised UX details

### Takeaway
Praise centers on trustworthy citations, Audio Overviews/Interactive mode, and one-click study artifacts; complaints center on organization (no folders/tags), weak note-taking, vague import errors, source caps, mobile thinness, and resumption/sync issues.

### Cited Findings
- Praise: flashcard → chat explanations with citations; customization underused but powerful — [XDA](https://www.xda-developers.com/cant-use-notebooklm-without-these-features/); [XDA customization](https://www.xda-developers.com/please-stop-ignoring-notebooklms-customization-features/)
- Praise: interactive audio "regret ignoring" — [XDA](https://www.xda-developers.com/i-regret-ignoring-notebooklm-interactive-audio-overview/)
- Complaint: no folders/subfolders/tags/linking; reader not writing tool; Notes limited vs Notion — [thebusinessdive](https://thebusinessdive.com/notebooklm-review); [XDA: stop using as note-taking app](https://www.xda-developers.com/please-stop-using-notebooklm-as-a-note-taking-app/); [saaszap review 2026](https://saaszap.com/notebooklm-review/)
- Complaint: organization a critical flaw even after Deep Research update — [BigGo News Nov 2025](https://biggo.com/news/202511210750_notebooklm-research-update-organization-flaw)
- Complaint: vague YouTube import errors; 50-source cap — [vidnotes](https://vidnotes.app/blog/207-How-to-Fix-NotebookLM-Cant-Import-YouTube-Video-Comments-Disabled); [fast.io](https://fast.io/resources/notebooklm-upload-failed/)
- Complaint: interactive audio glitches (speaker switches) — [XDA](https://www.xda-developers.com/i-regret-ignoring-notebooklm-interactive-audio-overview/)
- Complaint: mobile app thin, workflow window-switching — [Android Central](https://www.androidcentral.com/apps-software/ai/the-notebooklm-app-for-android-kept-making-me-want-to-go-back-to-the-website)
- Third-party Chrome extensions exist largely to fill UX gaps (bulk export, organization: "35+ features") — [nlmtools features](https://www.nlmtools.com/features)

### Inferences
- The size of the third-party extension ecosystem is itself evidence of unmet UX needs (organization, export, bulk operations).

### Gaps
- Direct Reddit r/notebooklm threads were not surfaced by searches and could not be fetched; complaint list relies on press/reviews. No quantitative data (ratings breakdowns, NPS) found.

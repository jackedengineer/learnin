# NotebookLM (now "Gemini Notebook") grounded Q&A: observed answer quality and performance (as of 2026-11-06)

Method note: WebSearch worked. WebFetch could not reach any host tried (arxiv.org, emergentmind.com, unite.ai, xda-developers.com all failed DNS resolution in this sandbox). So the detail below comes from search-result summaries of the cited pages, not full-text reads. Figures attributed to papers should be checked against the PDFs before they are quoted in a final report. Reddit and Google Support Community threads did not come up in search, so user-reported failure modes rely on blogs and secondary reviews.

Product context: Google renamed NotebookLM to **Gemini Notebook** on 2026-07-16. Google describes it as the same standalone product at the same URL, now also reachable from the Gemini app — [Google blog](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/); [Neowin](https://www.neowin.net/news/googles-notebooklm-isnt-called-notebooklm-anymore/); [NC State OIT, 2026-07-17](https://oit.ncsu.edu/2026/07/17/notebooklm-changes-name-to-gemini-notebook/). The underlying model has changed several times: Gemini 1.5-era in 2024, Gemini 2.0 Flash noted in early 2025, Gemini 2.5 in 2025, and Gemini 3.5 reported by June 2026 — [AndroGuider, 2026-06](https://www.androguider.com/2026/06/notebooklm-update-transforming-chat.html); [arXiv 2503.15664](https://arxiv.org/pdf/2503.15664). Older evaluations therefore tested materially different models.

## Accuracy and grounding: published evaluations, benchmarks and comparisons

### Takeaway
Every published study I found reports that NotebookLM is clearly more grounded than general chatbots on document tasks, but all of them are small. The best measured figures are about a 13% response-level hallucination rate in newsroom document Q&A (versus about 40% for ChatGPT and Gemini), 86% task accuracy plus 95% correct reference location in radiology staging, and about a 75% win rate against law professors in legal tutoring. It is not reliable for judgement-heavy structured appraisal such as risk-of-bias assessment. No large-scale, independent, cross-vendor grounded-QA benchmark that includes NotebookLM turned up. Its main residual errors are "interpretive overconfidence" (unsupported characterisations) and numerical comparison, not invented entities.

### Cited Findings
**Measured studies (with methodology):**
- **Hagar, Agustianto & Diakopoulos, "Not Wrong, But Untrue: LLM Overconfidence in Document-Based Queries" (arXiv 2509.25498, Sept 2025, Computation + Journalism Symposium).**
  - Setup: ChatGPT, Gemini and NotebookLM were tested on journalism-style queries over a document set.
  - Result: 30% of all outputs had at least one hallucination. The rate was about 40% for ChatGPT (6/15) and Gemini (4/10) versus 13% for NotebookLM (2/15).
  - The authors credit NotebookLM's citation-focused retrieval design for the gap. The sample is very small (n=40 responses), so the result is directional only.
  - Sources: [arXiv abstract](https://arxiv.org/abs/2509.25498v1); [arXiv HTML](https://arxiv.org/html/2509.25498v1); [Moonlight review](https://www.themoonlight.io/en/review/not-wrong-but-untrue-llm-overconfidence-in-document-based-queries)
- **Same paper, error types.**
  - Most errors were not invented names or numbers. They were "interpretive overconfidence": unsupported analytical claims or characterisations added on top of the sources.
  - Other journalism-specific categories: "unsupported audience/source characterization" and "attribution loss", where an attributed opinion is restated as a general fact.
  - The reported rates do not separate errors by severity.
  - Sources: [arXiv](https://arxiv.org/abs/2509.25498v1); [unite.ai coverage](https://www.unite.ai/chatgpt-5-and-gemini-2-5-hallucinate-in-40-of-tested-newsroom-queries/) (headline names "ChatGPT-5 and Gemini 2.5")
- **Lung cancer staging (Japanese Journal of Radiology; arXiv 2410.10869, Oct 2024, older model).**
  - Setup: NotebookLM was given Japanese lung-cancer staging guidance as its reference material and staged 100 fictional CT cases.
  - Result: 86% staging accuracy, versus 39% for GPT-4o given the same material and 25% for GPT-4o without it. NotebookLM found the supporting passage in the reference material 95% of the time.
  - Failure mode: it still made errors in numerical comparisons (e.g. tumour-size thresholds), as GPT-4o did.
  - Sources: [Springer](https://link.springer.com/article/10.1007/s11604-024-01705-1); [arXiv HTML](https://arxiv.org/html/2410.10869v1)
- **Pancreatic cancer staging (arXiv 2503.15664, Mar 2025).**
  - NotebookLM, which ran on Gemini 2.0 Flash at the time, outperformed Gemini 2.0 Flash used directly. The authors take this as evidence that retrieval improves staging accuracy.
  - They also raise information-security concerns about using internet-based tools like NotebookLM clinically.
  - Source: [arXiv](https://arxiv.org/pdf/2503.15664)
- **Risk-of-bias assessment in pediatric orthopaedics (J Pediatr Soc North Am, 2025; PubMed 41503344), titled "Not Ready for Prime Time".**
  - Repeated NotebookLM runs agreed with each other only moderately to poorly, and the authors judged its reliability and accuracy for this appraisal task to be low.
  - This is the clearest negative result: grounding did not make NotebookLM consistent on a judgement-heavy rubric.
  - Source: [PubMed](https://pubmed.ncbi.nlm.nih.gov/41503344/)
- **High-Tc superconductivity expert evaluation (Guo, Kim et al.; arXiv 2511.03782; Google Research; older model generation).**
  - Setup: 12 experts graded 6 systems on 67 expert-written questions, on a 0–2 scale. The systems were GPT-4o, Perplexity, Claude 3.5, Gemini Advanced Pro 1.5, NotebookLM loaded with 1,726 curated papers, and a custom RAG system.
  - Result: NotebookLM scored highest for evidence support and significantly beat the closed models on balanced perspectives, factual comprehensiveness and evidentiary support. It was also the least succinct.
  - Experts noted the presentation of competing viewpoints was sometimes excessive, and the authors conclude that AI is still short of expert-level help.
  - Venue is unclear: the arXiv listing says ICML 2025 workshop on Assessing World Models, while Google's blog cites PNAS.
  - Sources: [arXiv](https://arxiv.org/pdf/2511.03782); [Google Research blog](https://research.google/blog/testing-llms-on-superconductivity-research-questions/); [Moonlight review](https://www.themoonlight.io/review/expert-evaluation-of-llm-world-models-a-high-tc-superconductivity-case-study)
- **Legal education: Salinas, Nyarko et al., "Law Professors Prefer AI Over Peer Answers" (SSRN / Stanford Law, posted 2026-05-27; working paper, not yet peer-reviewed).**
  - Setup: 16 contracts professors from 14 US law schools, all teaching from the same casebook, wrote 40 questions and their own answers, then judged 2,918 anonymised human-vs-LLM comparisons.
  - Result: NotebookLM grounded in the casebook won 74.75% of its matchups against professors. Plain Gemini 2.5 Pro won slightly more often, at 75.92%.
  - AI answers were flagged as pedagogically harmful 3.53% of the time, versus 12.06% for professor answers.
  - Sources: [Stanford PDF](https://law.stanford.edu/wp-content/uploads/2026/06/salinas_et_al.pdf); [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6849678); [TaxProf Blog](https://taxprofblog.aals.org/2026/06/06/salinas-et-al-law-professors-prefer-ai-over-peer-answers/); [ABA Journal](https://www.abajournal.com/news/article/law-profs-find-ai-is-a-better-tutor-than-they-are)
- **Critique of the law study:** answer quality is not the same as learning impact, and the study does not test downstream learning — [David Kemp](https://davidkemp.ai/blog/answer-quality-is-not-learning-impact); [legaled.ai](https://legaled.ai/the-machine-beat-the-professors-or-did-it/)
- **Education trial:** a registered trial of NotebookLM for nursing vital-signs education has no results yet — [ClinicalTrials.gov NCT07743203](https://clinicaltrials.gov/study/NCT07743203)

**Anecdotal or unverified comparisons:**
- A hands-on stress test with a 90-page dissertation found NotebookLM stayed grounded under adversarial prompts. The same test notes that bad OCR or scanned PDFs undermine grounding and that vague questions can lead it to omit relevant details — [daily.dev](https://daily.dev/posts/i-spent-an-afternoon-trying-to-make-notebooklm-hallucinate-and-i-was-genuinely-impressed-dyegkf0zy)
- Vendor or SEO blogs claim "98% citation accuracy" for NotebookLM versus about 67% for ChatGPT. The figure has no source, and the 67% looks borrowed from a web-search citation audit (Columbia Journalism Review), so it is not a like-for-like comparison. Treat it as unreliable — [elephas.app](https://elephas.app/blog/notebooklm-vs-chatgpt); [Suprmind](https://suprmind.ai/hub/perplexity/vs-other-ai/)
- Study-guide reviews note that summaries can blur details, merge similar concepts, omit an exception, flatten disagreement or misstate a detail — [myclaw.ai](https://myclaw.ai/blog/notebooklm-ai-review); [aicentralresources](https://www.aicentralresources.com/blog/google-notebooklm-review-2026-pricing-features-and-honest-verdict)

### Inferences
- A competitor's minimum bar for grounded QA: a low single-digit to low-teens percentage of responses containing any unsupported claim on realistic document questions, about 95% correct passage location, and answers that domain experts rate at or above a good human instructor.
- The NotebookLM vs. Gemini 2.5 Pro result in the law study (74.75% vs. 75.92%) suggests grounding mainly buys trust and verifiability rather than raw answer quality, at least when the base model already knows the domain well.
- The documented weak spots are numerical comparisons and subjective, rubric-based judgement such as risk-of-bias appraisal. Both are relevant to a learning app (quantitative subjects, self-assessment), and both are where a competitor could beat NotebookLM measurably, for example with tool-assisted arithmetic and a tighter "claim must be entailed" check.
- The "interpretive overconfidence" error class is the one to evaluate against. Benchmarks that only check entity or number fabrication will overstate grounding quality.

### Gaps
- No independent, large-n benchmark of NotebookLM against ChatGPT Projects, Claude Projects or Perplexity Spaces on the same corpus was found. No study evaluates the current Gemini 3.x-based NotebookLM.
- Full-text methodology of the Hagar et al. and Salinas et al. papers could not be read (fetch blocked).
- No peer-reviewed measurement of overall citation precision (share of citations that actually support the claim) for NotebookLM at scale.

## Citation behaviour (precision; tables, figures, scans, math, handwriting, images, long documents, many sources)

### Takeaway
Inline citations link to source passages, and in one measured study the cited location was right 95% of the time. Reliability drops with non-text content: scanned PDFs without a text layer, complex tables, charts and images inside PDFs, and LaTeX or complex math are widely reported to be lost, flattened or misread. Users report that some citations point to the wrong spot or the top of a source rather than the exact sentence. Hard numbers on citation precision for long documents or 50+ sources were not found.

### Cited Findings
- **Measured:** 95% accuracy in locating the relevant reference passage (lung-cancer staging study, older model) — [Springer](https://link.springer.com/article/10.1007/s11604-024-01705-1)
- **Citation granularity (anecdotal):**
  - One review found that hovering a citation showed the top of the source rather than the exact line, so the user had to find the sentence manually. Another guide says clicking jumps to the exact passage.
  - NotebookLM produces no formatted bibliographies (APA, MLA, BibTeX) and has no Zotero or Mendeley integration.
  - Sources: [Citenook](https://citenook.com/blog/notebooklm-limitations/); [notebooktoolkit](https://notebooktoolkit.com/blog/notebooklm-for-pdfs)
- **Scanned PDFs:**
  - Image-only scans reportedly need OCR before upload; NotebookLM can only use whatever text layer exists.
  - Google says only that certain images "may not work as well" and does not document how it handles scans or charts.
  - Sources: [Citenook](https://citenook.com/blog/notebooklm-limitations/); [sourclip](https://www.sourclip.com/blog/notebooklm-large-pdfs); [markdownconverters](https://markdownconverters.com/guides/upload-pdf-to-notebooklm)
- **Tables:** simple tables reportedly work, but complex or merged-cell tables get mangled. One source says tables in PDFs are flattened into prose, which makes numeric analysis unreliable — [Citenook](https://citenook.com/blog/notebooklm-limitations/); [techjournalai](https://techjournalai.com/how-to-use-notebooklm-with-pdfs/)
- **Charts, diagrams, images and handwritten notes inside PDFs:** reportedly not analysed (blog claims, no controlled tests found) — [Citenook](https://citenook.com/blog/notebooklm-limitations/); [xda-developers](https://www.xda-developers.com/notebooklm-limitations/)
- **Equations:** read as text, but complex math may be misread, and LaTeX-rendered math often fails to extract — [notebooktoolkit](https://notebooktoolkit.com/blog/notebooklm-for-pdfs); [Citenook](https://citenook.com/blog/notebooklm-limitations/)
- **Recommended workaround:** convert PDFs to clean text or Markdown with headings and tables intact before uploading — [markdownconverters](https://markdownconverters.com/guides/upload-pdf-to-notebooklm); [sourclip](https://www.sourclip.com/blog/notebooklm-large-pdfs)
- **Citations do not guarantee accuracy:** summaries, audio and video can still contain mistakes, so important claims should be checked against the original — [notebooktoolkit](https://notebooktoolkit.com/blog/notebooklm-for-pdfs)
- **Many sources:**
  - Source caps are reported inconsistently: 50 per notebook on the free tier, 300 on Pro, 500 on enterprise, and a separate claim of 100. The numbers have changed over time.
  - Google's Oct 2025 chat upgrade claimed a 50% improvement in user satisfaction for answers that draw on large numbers of sources (self-reported).
  - Sources: [Yahoo Tech](https://tech.yahoo.com/apps/articles/notebooklm-source-limit-tricks-helped-111313111.html); [aigoestocollege](https://aigoestocollege.substack.com/p/more-new-features-for-notebooklm); [fast.io limits](https://fast.io/resources/notebooklm-limits/); [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-custom-personas-engine-upgrade/)

### Inferences
- The most beatable area is multimodal and structured content: page-image-aware ingestion, table-to-structured parsing, LaTeX-preserving math extraction, and handwriting OCR, plus citations that highlight exact spans or bounding boxes on the page image. These are the gaps users repeatedly report.
- For a learning app, sentence- or span-level citation anchoring (rather than chunk-level) is a visible quality edge, given reports that NotebookLM sometimes lands at the top of a source.

### Gaps
- No measured citation-precision numbers for long documents (hundreds of pages) or for notebooks with 50+ sources.
- No current (2026) controlled test of table, figure or handwriting handling; available claims are blog-level and may predate Gemini 3.x multimodal ingestion.
- Reddit and Google Support threads documenting specific wrong-citation bugs did not surface in search.

## Refusal/abstention and use of outside knowledge

### Takeaway
By design, NotebookLM answers only from uploaded sources and is meant to say when something is not in them. The measured evidence shows it still adds unsupported interpretive claims at about one-third the rate of general chatbots (13% vs. about 40% of responses), but it is not zero. I could not confirm whether a user-facing setting now allows outside knowledge. One guide quotes Google as saying chat does not bring in outside knowledge "by default", which hints that it is configurable.

### Cited Findings
- **Designed to abstain:** when an answer isn't in the sources, the tool is meant to say so rather than draw on outside knowledge; it "declines to answer something not in your sources" — [Coursiv guide](https://coursiv.io/blog/how-to-use-notebooklm); [Coursiv limits](https://coursiv.io/blog/notebooklm-limits)
- **Google FAQ, as quoted:** it answers questions based on the information in your uploaded sources and will not bring in outside knowledge in chat "by default" — [prompt-architects](https://prompt-architects.com/blog/182-notebooklm-prompt-templates-for-source-based-research)
- **Closed system:** described as not performing web searches or using information outside the sources. This predates the "Discover sources" and web-source features, which add web content as sources rather than mixing it into answers — [dev.to](https://dev.to/hannes_lehmann/why-notebooklm-is-revolutionizing-academic-research-while-chatgpt-falls-short-35mi); [Notebookcheck](https://www.notebookcheck.net/Google-s-note-taking-AI-app-can-now-read-from-the-web.843165.0.html)
- **Unsupported content still leaks in:** NotebookLM still produced "interpretive overconfidence" and attribution loss in 13% of responses — [arXiv 2509.25498](https://arxiv.org/abs/2509.25498v1)
- **Vague questions:** these can lead to omitted details rather than refusals — [daily.dev](https://daily.dev/posts/i-spent-an-afternoon-trying-to-make-notebooklm-hallucinate-and-i-was-genuinely-impressed-dyegkf0zy)
- **Gemini 3.5 upgrade:** reportedly adds help finding sources and a "cloud computer" — [Wikipedia](https://en.wikipedia.org/wiki/NotebookLM); [AndroGuider](https://www.androguider.com/2026/06/notebooklm-update-transforming-chat.html)

### Inferences
- For a learning app, strict source-only grounding is a feature for trust but a limitation for teaching. Students often need background the sources lack. A competitor could offer an explicit, visibly labelled "outside knowledge" mode, which NotebookLM does not clearly expose.
- Abstention quality, meaning correct "not in sources" answers and no false refusals, has no published measurement. A competitor can define and publish this metric.

### Gaps
- No measured false-refusal rate or correct-abstention rate.
- Not confirmed whether a toggle for allowing general knowledge exists in the 2026 Gemini Notebook UI. Official help pages were not reachable.

## Latency (chat, source processing, Audio/Video Overviews and Studio)

### Takeaway
Published latency data is thin and mostly anecdotal. No sourced time-to-first-token or full-answer chat latency figures were found. Google's help page says Audio Overviews "may take a couple of minutes". Users report about 4 minutes for a 16-minute episode from 5 sources, and sometimes over 10 minutes for large notebooks. Source processing scales with size and type (long video or audio and large scans are slower or fail).

### Cited Findings
- **Google's own wording:** Audio Overview generates in the background and "may take a couple of minutes" — [Google support](https://support.google.com/notebooklm/answer/16212820?hl=en)
- **Measured anecdotes for Audio Overview:**
  - About 4 minutes for a roughly 16-minute episode from 5 sources (review published around late 2024, older model) — [How-To Geek](https://www.howtogeek.com/notebooklms-audio-overview-is-good-but-it-could-be-great/)
  - Another user says it often takes more than 10 minutes, depending on length and number of sources — [Superlore](https://superlore.ai/blog/notebooklm-audio-overview-generation-time-2026)
  - A guide claims 15 seconds to 7 minutes (unverified). The Brief format is faster; Deep Dive and Debate formats take longer — [Superlore](https://superlore.ai/blog/notebooklm-audio-overview-generation-time-2026); [notebooktoolkit](https://notebooktoolkit.com/blog/notebooklm-audio-overview-complete-guide)
  - A claim that generation is queued to off-peak windows and completes "within a couple of hours" is unsourced and conflicts with the reports above — [notebooklm-guide](https://notebooklm-guide.com/notebooklm-limit-problems/)
- **Slides:** a third-party "slide generation speed benchmarks (2026)" page exists, but its figures were not retrieved — [notebooklm-guide](https://notebooklm-guide.com/notebooklm-slide-generation-speed/)
- **Source processing:**
  - Time scales with complexity; a 90-minute YouTube lecture takes longer than a two-page article.
  - Very large PDFs, high-resolution scanned books and long audio may fail to upload or take much longer.
  - Sources: [fast.io](https://fast.io/resources/notebooklm-limits/); [notebooklm-guide](https://notebooklm-guide.com/notebooklm-limit-problems/)

### Inferences
- Chat latency evidently isn't a common complaint, since it rarely appears in reviews. Because Gemini Flash-class models serve it, a competitor should assume users expect first tokens within a couple of seconds.
- Studio outputs in the minutes range set a low bar. A learning app that streams partial audio or video (or produces flashcards and quizzes in seconds) could stand out.

### Gaps
- No sourced time-to-first-token or full-answer latency for NotebookLM chat.
- No measured Video Overview generation times found.
- No measured source-ingestion times by file size.

## Answer detail and style (length, structure, configurability, shallow answers, long-chat context loss, lost-in-the-middle)

### Takeaway
Answers tend to be comprehensive, evidence-heavy and verbose rather than succinct: the expert study ranked NotebookLM least succinct and occasionally excessive in presenting viewpoints. Since Oct 2025, chat uses Gemini's full 1M-token context, has about 6x longer conversation memory, saves history, and offers configurable goals and personas. Reports of shallow or detail-omitting answers centre on vague prompts, tables, numbers and summary blurring. No measured "lost-in-the-middle" study was found.

### Cited Findings
- **Least succinct:** NotebookLM was the least succinct of six systems while scoring highest on evidence, and experts found its presentation of competing viewpoints "occasionally excessive" — [arXiv 2511.03782](https://arxiv.org/pdf/2511.03782)
- **Oct 2025 chat upgrade (Google):**
  - Full 1M-token Gemini context window on all plans, about 8x the previous size.
  - Conversation memory more than 6x larger, plus saved chat history.
  - Customisable goals and personas for chat style, length and role.
  - Self-reported 50% increase in satisfaction for answers drawing on many sources.
  - Sources: [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-custom-personas-engine-upgrade/); [9to5Google](https://9to5google.com/2025/10/29/notebooklm-chat-upgrade/); [TechRadar](https://www.techradar.com/ai-platforms-assistants/gemini/notebooklm-just-got-a-major-chat-upgrade-with-8x-more-context-better-memory-and-smarter-responses)
- **Gemini 3.5 (June 2026):** the upgrade is intended to improve response quality in longer, source-heavy interactions. No benchmark was published — [AndroGuider](https://www.androguider.com/2026/06/notebooklm-update-transforming-chat.html)
- **Context and source limits:** the 1M-token figure applies to notebook chat, not necessarily the Gemini app, whose window varies by plan (32K / 128K / 1M) — [Glasp 2026 guide](https://glasp.co/articles/notebooklm-2026); [iceberglakehouse](https://iceberglakehouse.com/posts/2026-03-context-gemini-web-notebooklm/)
- **Quality in the law study:** NotebookLM's answers were preferred over professors' about 75% of the time. A blog summary says a model of seven surface features (length, clarity, tone, structure, etc.) did not explain the preference; this is unverified against the paper — [TaxProf](https://taxprofblog.aals.org/2026/06/06/salinas-et-al-law-professors-prefer-ai-over-peer-answers/); [legaled.ai](https://legaled.ai/the-machine-beat-the-professors-or-did-it/)
- **Weaknesses reported:**
  - Summaries blur details or merge similar concepts — [myclaw.ai](https://myclaw.ai/blog/notebooklm-ai-review)
  - Vague questions lead to omitted details — [daily.dev](https://daily.dev/posts/i-spent-an-afternoon-trying-to-make-notebooklm-hallucinate-and-i-was-genuinely-impressed-dyegkf0zy)
  - Tables flattened, making numeric analysis unreliable — [Citenook](https://citenook.com/blog/notebooklm-limitations/)

### Inferences
- If all sources fit in a 1M-token window, the product can put whole documents in context rather than relying only on top-k retrieval. That reduces "ignoring parts of large sources" but makes lost-in-the-middle effects inside long context a plausible remaining risk. This is not measured.
- To compete on style, a learning app needs adjustable depth (brief, standard, deep), structured outputs, and pedagogy-aware formatting. NotebookLM's default tends toward long, balanced and comprehensive.

### Gaps
- No measured average answer length or structure statistics.
- No published test of lost-in-the-middle or long-chat context degradation specific to NotebookLM.

## Known failure modes and user-reported bugs (large or many sources, non-English, multimodal)

### Takeaway
The documented failure modes, all of which point to where a competitor can differentiate:
- extraction failures on scanned, image-heavy, table-heavy and math-heavy PDFs
- interpretive overconfidence and attribution loss
- errors in numerical comparisons
- low run-to-run consistency on judgement tasks
- verbosity
- slow or failing ingestion for very large files and long media
- source and quota caps
- privacy and security concerns in clinical settings

Specific Reddit and Google-forum bug threads, and evidence on non-English quality, could not be retrieved.

### Cited Findings
- **Numerical-comparison errors** despite correct retrieval — [Springer lung-staging study](https://link.springer.com/article/10.1007/s11604-024-01705-1)
- **Low reliability and consistency across repeated runs** on risk-of-bias rubrics — [PubMed 41503344](https://pubmed.ncbi.nlm.nih.gov/41503344/)
- **Interpretive overconfidence, attribution loss, and unsupported audience/source characterisation** — [arXiv 2509.25498](https://arxiv.org/abs/2509.25498v1)
- **Ingestion failures:** OCR-less scans, complex tables, charts, images, handwriting and LaTeX math — [Citenook](https://citenook.com/blog/notebooklm-limitations/); [markdownconverters](https://markdownconverters.com/guides/upload-pdf-to-notebooklm)
- **Large files:** very large PDFs, high-resolution scanned books and long audio may fail to upload or process slowly — [notebooklm-guide](https://notebooklm-guide.com/notebooklm-limit-problems/); [fast.io](https://fast.io/resources/notebooklm-limits/)
- **Caps and quotas:** the free tier's 50-source cap and daily query limit can be hit quickly — [Yahoo Tech](https://tech.yahoo.com/apps/articles/notebooklm-source-limit-tricks-helped-111313111.html); [fast.io audio limits](https://fast.io/resources/notebooklm-audio-overview-limit/)
- **Information-security concerns** about using an internet-based tool for clinical data — [arXiv 2503.15664](https://arxiv.org/pdf/2503.15664); see also [chanio](https://chanio.com/blog/notebooklm-reads-only-your-sources/)
- **Non-English:** the strongest data point is positive. The lung-staging study used Japanese staging guidance and still got 86% accuracy (2024 model) — [Springer](https://link.springer.com/article/10.1007/s11604-024-01705-1)

### Inferences
- For a competing learning app, the priority quality investments are:
  1. multimodal and structured ingestion (OCR, tables, math, figures)
  2. span-precise citations
  3. an entailment or faithfulness check targeting interpretive overconfidence
  4. deterministic numeric handling
  5. a small published eval: hallucination rate, citation precision, abstention correctness and latency on a fixed corpus, where NotebookLM's measured bar is about 13% of responses containing an unsupported claim and 95% passage-location accuracy

### Gaps
- r/notebooklm and Google Support Community threads (e.g. wrong citations, sources ignored in big notebooks, Audio Overview failures) did not surface in search and could not be fetched. A follow-up with direct Reddit access is recommended.
- No systematic evaluation of non-English or multilingual grounded QA, or of audio and video source QA accuracy.
- No reports specific to the post-July-2026 Gemini Notebook era on regressions or improvements.

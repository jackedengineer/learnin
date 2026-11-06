# Changelog

All notable user-visible changes. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), grouped by Added / Changed / Fixed / Security.

## [Unreleased]
### Added
- Sign in with Google.
- Notebooks: create, rename, delete, list.
- Add sources to a notebook by uploading a file or pasting a URL (processing arrives in Phase 1).
### Security
- Deploys run only for green `push` CI runs of this repository's `main`; GitHub Actions pinned to commit SHAs.
- Uploads are bound to the exact verified file version (ETag), and presigned URLs sign the content type and expire sooner. Unfinished uploads are capped per user.
- The URL safety check normalises trailing-dot hostnames (`localhost.` and similar).
- Error logs no longer include SQL parameters. Mutating requests from foreign origins are refused.
- Dev login can only run against a localhost URL, and the local Worker config can no longer overwrite production.
### Fixed
- List pagination no longer skips items created within the same millisecond.
- Several inputs that caused 500s now return proper 4xx errors.

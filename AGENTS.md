# My Blog

This repository maintains blog.alterxyz.com through GitHub Pages.

- Keep existing articles and the GitHub Issues publishing flow intact.
- Change site navigation in `config.toml`; extra standalone pages belong in `static/`.
- `static/artifacts/index.html` redirects to the independent My Artifact site.
- The main deployment workflow is `.github/workflows/generate_site.yml`.
- `README.md` and `BACKUP/` are generated from Issues, not the authoritative place to edit article text.
- Prefer small maintenance changes. Preserve existing licensing and attribution.
- Do not commit local credentials, private operational records, or Regent runtime metadata.
- In a new clone, install the local pre-push guard with `git config core.hooksPath .githooks`.
  The guard checks every unpublished commit for private folder paths and blocks
  local-only history branches. Do not bypass it; CI repeats the index check.

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
- `upstream` (yihong0618/gitblog) mixes template code with another author's posts.
  Do not merge it or use Sync fork; port code changes by hand as `MAINTENANCE.md` describes.
- With two remotes, `gh` acts on `upstream` unless a default is set. In a new clone,
  run `gh repo set-default alterxyz/gitblog` once, or pass `--repo alterxyz/gitblog`.
  Otherwise `gh run list`, `gh issue`, and `gh pr create` reach the template author's repository.
- After changing `scripts/check-public-files.mjs`, run `node --test scripts/check-public-files.test.mjs`.

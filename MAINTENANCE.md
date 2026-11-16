# My Blog

Live site: <https://blog.alterxyz.com/>  
Source repository: <https://github.com/alterxyz/gitblog>

Articles remain in the repository's GitHub Issues. The existing GitHub Actions workflow generates the site with isite and Zola, then publishes it to GitHub Pages. The README and `BACKUP/` files are generated separately; avoid editing those files as the source of an article.

The navigation menu lives in `config.toml`. Its Artifacts entry points to <https://artifact.alterxyz.com/>. The stable shortcut <https://blog.alterxyz.com/artifacts/> is a static HTML redirect to the same site, with a clickable fallback link.

Extra static pages live in `static/`; the Pages workflow copies them into the generated site's static directory before building. Pushes to `master` that change `config.toml`, `static/`, or the Pages workflow automatically deploy. Issue edits keep using the existing publishing flow. A manual run of **Deploy static content to Pages** is available for other rebuilds.

The blog and My Artifact are independent projects. Adding an artifact does not require rebuilding or changing the blog.

Local folder-management data is excluded by `.gitignore`. Install the local
pre-push guard once per clone with `git config core.hooksPath .githooks`.
It checks Git path metadata in every unpublished commit, including paths added
and then removed before a push, and rejects local-only history branches.
The **Check private paths** workflow also checks each pushed or proposed tree.
Neither check opens private records or key files.
For a new branch or tag, CI checks the commits that the default branch does
not contain yet. After changing the check, run
`node --test scripts/check-public-files.test.mjs`; CI runs the same tests.

## Upstream

This repository is a GitHub fork of <https://github.com/yihong0618/gitblog>.
Upstream `master` mixes the template code with another author's posts
(`BACKUP/`, `README.md`, `feed.xml`). Do not merge it, rebase onto it, or use
**Sync fork** on GitHub. Port useful code changes by hand.

To see upstream code changes since the last review:

```sh
git remote add upstream https://github.com/yihong0618/gitblog.git  # once per clone
git fetch upstream
git diff cc28e4c..upstream/master -- . ':!BACKUP' ':!README.md' ':!feed.xml'
```

Last review: upstream `cc28e4c` (2026-10-26). After a review, replace that
commit in the command above.

- Ported: isite v0.2.4 (renamed release files), code highlighting and emoji
  shortcodes in `config.toml`, and explicit read permissions for the Pages job.
- Not ported: the July 2026 move from Zola to Astro (AstroPaper theme, a fork
  of isite, CJK preview images, an RSS check). It changes the site design and
  moves posts from `/issue-N/` to `/posts/issue-N/`, so old links would break.
  That is the owner's decision.

isite v0.2.4 with Zola v0.20.0 is the pair that upstream ran from 2025-11 to
2026-07. Newer releases exist; upgrade the two together and check the
deployed pages afterwards.

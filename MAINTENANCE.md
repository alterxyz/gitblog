# My Blog

Live site: <https://blog.alterxyz.com/>  
Source repository: <https://github.com/alterxyz/gitblog>

Articles remain in the repository's GitHub Issues. The existing GitHub Actions workflow generates the site with isite and Zola, then publishes it to GitHub Pages. The README and `BACKUP/` files are generated separately; avoid editing those files as the source of an article.

The navigation menu lives in `config.toml`. Its Artifacts entry points to <https://artifact.alterxyz.com/>. The stable shortcut <https://blog.alterxyz.com/artifacts/> is a static HTML redirect to the same site, with a clickable fallback link.

Extra static pages live in `static/`; the Pages workflow copies them into the generated site's static directory before building. Pushes to `master` that change `config.toml`, `static/`, or the Pages workflow automatically deploy. Issue edits keep using the existing publishing flow. A manual run of **Deploy static content to Pages** is available for other rebuilds.

The blog and My Artifact are independent projects. Adding an artifact does not require rebuilding or changing the blog.

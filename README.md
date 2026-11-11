# Zoolens site

Static site, no build step, no trackers, no external requests.

```
index.html          English landing page        /zoolens/
es/index.html       Spanish landing page        /zoolens/es/
privacy/index.html  Privacy policy (EN + ES)    /zoolens/privacy/
img/                three app screenshots
```

## Publish with GitHub Pages

The site folder becomes the root of a GitHub repo called `zoolens` under the account `xaviheras`.

1. Create an empty public repo `zoolens` on GitHub (no README, so the first push is clean).
2. From the project root, publish the folder contents:
   ```bash
   cd store/site
   git init -b main
   git add .
   git commit -m "Zoolens site"
   git remote add origin git@github.com:xaviheras/zoolens.git
   git push -u origin main
   ```
   (Alternative that keeps the history of this repo: `git subtree push --prefix store/site origin-zoolens main`, after adding that remote.)
3. On GitHub: Settings > Pages > Build and deployment > Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`. Save.
4. Wait a minute or two. The site appears at the URLs below.

## URLs

- Landing (EN): https://xaviheras.github.io/zoolens/
- Landing (ES): https://xaviheras.github.io/zoolens/es/
- Privacy policy: https://xaviheras.github.io/zoolens/privacy/ (this is the URL in the App Store listing and in App Store Connect)

## Before going live

- Contact email in `privacy/index.html`: xaviherasguerrero@gmail.com (done).
- When the app has an App Store ID, replace the "Coming soon to the App Store" line in `index.html` and `es/index.html` with the badge and link.
- Updates: edit, commit and push to `main`; Pages redeploys.

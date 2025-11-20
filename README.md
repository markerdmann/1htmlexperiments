## 1 HTML Experiments

Quick home for one-file app experiments. Each experiment is a standalone HTML file under `experiments/` and is exposed through the gallery on `index.html`, which is published via GitHub Pages.

### How to add a new experiment
- Drop a single-file HTML into `experiments/your-experiment.html`.
- (Optional) Add a meta block near the top to enrich the gallery card:
  ```html
  <!-- meta {
    "title": "Wandering Particles",
    "description": "Canvas particles with flow fields",
    "tags": ["canvas", "particles"],
    "thumbnail": "https://example.com/thumb.png",
    "accent": "#c2ff72",
    "date": "2024-06-05"
  } -->
  ```
- Run `npm run refresh` to regenerate `manifest.json`.
- Run `npm run thumbs` to capture 1200x630 thumbnails (needs Playwright’s bundled Chromium; installs via `npm install`).
- Commit and push; Pages will serve `index.html` and every file under `experiments/`.

### Local preview
- `npm install` is not needed; the only script is `npm run refresh`.
- Open `index.html` in a browser or run a simple server like `python -m http.server`.

### GitHub Pages
Configure Pages to build from the `main` branch and the root (`/`). With that enabled, pushing to `main` will refresh your live gallery.

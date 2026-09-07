# Diffusion Compass

An interactive tool that helps researchers figure out which **dMRI (diffusion MRI) preprocessing pipeline** best fits their data — by answering a short quiz about their study.

No installation needed to use it — it's a website.

---

## What it does

1. Pick your study population on the home page: **Adult human**, **Pediatric human**, **Mouse**, or **Monkey**.
2. Answer a handful of questions about your data, your compute setup, and what you need the analysis to do.
3. Get a ranked list of the pipelines that fit best, with a link to each one's page so you can dig further.

Each category also has three reference pages you can browse anytime:

- **Pipelines** — every pipeline being compared, with a short description and a link.
- **Criteria** — the full comparison table behind the quiz.
- **Questions** — every quiz question, and how each answer affects the ranking.

The site works in both light and dark mode (toggle in the header).

---

## Contributing

Know a pipeline that's missing, or think a comparison criterion should be added? Use the **"Suggest a pipeline"** or **"Suggest a criterion / question"** tabs — they open a pre-filled GitHub Issue so the team can review it.

---

## Running locally

If you'd like to preview the site on your own computer:

1. Download or clone this repository.
2. Opening `index.html` by double-clicking it **won't work** — browsers block it from loading the comparison data that way.
3. Instead, serve the folder with a simple local server. From a terminal, inside the project folder:
   ```bash
   python3 -m http.server
   ```
4. Open `http://localhost:8000` in your browser.

(This limitation goes away once the site is published on GitHub Pages — it's only a local-preview quirk.)

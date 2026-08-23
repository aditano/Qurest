# Qurest

Qurest is a browser-based symptom checker prototype with a dark, chip-driven intake UI. It uses a deterministic question tree so the app stays fast, predictable, and easy to run as a static page.

## What The Software Does

- Starts with multi-select symptom areas, so mixed presentations such as cough plus stomach symptoms can be checked together.
- Asks follow-up questions across multiple symptom areas, including head and neurological symptoms, respiratory issues, digestive complaints, urinary problems, skin concerns, musculoskeletal pain, mental health concerns, and general/systemic symptoms.
- Scores answers against a library of 40+ common conditions.
- Shows the top 3 likely matches with symptom summaries, care guidance, and urgency notes.
- Highlights potentially higher-risk results and reminds users that urgent medical care may be needed in emergency scenarios.

## How It Works

- The app is currently a single-page front-end prototype in `index.html`, with `symptom-checker.html` kept as a compatibility redirect.
- It uses plain HTML, CSS, and JavaScript, with no backend or database.
- The first question can queue multiple symptom areas before moving into shared fever, duration, and severity questions.
- Each answer contributes weighted points to one or more possible conditions.
- At the end of the flow, the app ranks the strongest matches and displays educational information for each one.

## Current Scope

The current prototype includes:

- 44 condition profiles
- 35 question nodes in the decision tree (including emergency red-flag screening)
- Multi-select first step with deterministic chip navigation
- Interactive body-region map that highlights affected areas during intake
- Live match preview with relative likelihood scoring
- Results cards with common symptoms, care options, and urgency messaging
- Educational-only medical disclaimers throughout the experience

## Important Disclaimer

Qurest is for educational and informational use only. It does not provide a medical diagnosis and is not a substitute for professional medical advice, diagnosis, or treatment. If someone may be experiencing a medical emergency, they should call 911 or seek immediate medical care.

## Running The App

There is no build step right now. The app can be served locally or opened directly in a browser.

1. Clone this repository.
2. Start a local static server:

```bash
python3 -m http.server
```

3. Open the local address shown in the terminal.

You can also open `index.html` directly.

## GitHub Pages

This repo is ready to publish from the root of the `main` branch. Once GitHub Pages is enabled, the app will be available at:

```text
https://aditano.github.io/Qurest/
```

## Project Structure

- `index.html` - the full prototype UI, question tree, condition data, scoring logic, and results rendering
- `symptom-checker.html` - compatibility redirect to the Pages-friendly root path
- `README.md` - project overview and usage notes

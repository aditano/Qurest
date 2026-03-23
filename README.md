# Qurest

Qurest is a browser-based symptom checker prototype. It walks a user through a guided set of multiple-choice questions and returns the most likely conditions based on a rules-based scoring system.

## What The Software Does

- Asks follow-up questions across multiple symptom areas, including head and neurological symptoms, respiratory issues, digestive complaints, urinary problems, skin concerns, musculoskeletal pain, mental health concerns, and general/systemic symptoms.
- Scores answers against a library of 40+ common conditions.
- Shows the top 3 likely matches with symptom summaries, treatment guidance, and urgency notes.
- Highlights potentially higher-risk results and reminds users that urgent medical care may be needed in emergency scenarios.

## How It Works

- The app is currently a single-page front-end prototype in `symptom-checker.html`.
- It uses plain HTML, CSS, and JavaScript, with no backend, database, or external API.
- Each answer contributes weighted points to one or more possible conditions.
- At the end of the flow, the app ranks the strongest matches and displays educational information for each one.

## Current Scope

The current prototype includes:

- 44 condition profiles
- 34 question nodes in the decision tree
- Results cards with common symptoms, treatment options, and urgency messaging
- Educational-only medical disclaimers throughout the experience

## Important Disclaimer

Qurest is for educational and informational use only. It does not provide a medical diagnosis and is not a substitute for professional medical advice, diagnosis, or treatment. If someone may be experiencing a medical emergency, they should call 911 or seek immediate medical care.

## Running The App

There is no build step right now.

1. Clone this repository.
2. Open `symptom-checker.html` in a web browser.

If you prefer to serve it locally through a simple web server, you can also run:

```bash
python3 -m http.server
```

Then open the local address shown in the terminal.

## Project Structure

- `symptom-checker.html` - the full prototype UI, question tree, condition data, scoring logic, and results rendering
- `README.md` - project overview and usage notes

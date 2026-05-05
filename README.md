# Qurest

Qurest is a browser-based symptom checker prototype with a dark, conversation-first intake UI. It can run a small local LLM in the browser with WebGPU, but every step also has an instant question-tree fallback so the app never waits forever on model output.

## What The Software Does

- Uses WebLLM and a small Llama 3.2 1B model to map plain-language symptom descriptions to the next question-tree choice when the browser model is ready.
- Falls back to a local deterministic router if WebGPU is unavailable, the model is still loading, or generation is too slow.
- Asks follow-up questions across multiple symptom areas, including head and neurological symptoms, respiratory issues, digestive complaints, urinary problems, skin concerns, musculoskeletal pain, mental health concerns, and general/systemic symptoms.
- Scores answers against a library of 40+ common conditions.
- Shows the top 3 likely matches with symptom summaries, care guidance, and urgency notes.
- Highlights potentially higher-risk results and reminds users that urgent medical care may be needed in emergency scenarios.

## How It Works

- The app is currently a single-page front-end prototype in `index.html`, with `symptom-checker.html` kept as a compatibility redirect.
- It uses plain HTML, CSS, and JavaScript, with no backend or database.
- The intake console imports WebLLM from a CDN and runs inference in the browser with WebGPU when supported. The first model load downloads model assets; subsequent loads can use the browser cache.
- The UI treats the LLM as a routing helper, not as the medical authority. The weighted question tree remains the source for scoring and results.
- Each answer contributes weighted points to one or more possible conditions.
- At the end of the flow, the app ranks the strongest matches and displays educational information for each one.

## Current Scope

The current prototype includes:

- 44 condition profiles
- 34 question nodes in the decision tree
- Native text-to-route intake with local LLM support and deterministic timeout fallback
- Results cards with common symptoms, care options, and urgency messaging
- Educational-only medical disclaimers throughout the experience

## Important Disclaimer

Qurest is for educational and informational use only. It does not provide a medical diagnosis and is not a substitute for professional medical advice, diagnosis, or treatment. If someone may be experiencing a medical emergency, they should call 911 or seek immediate medical care.

## Running The App

There is no build step right now. For the local AI guide, serve the app from localhost or HTTPS in a WebGPU-capable browser such as current Chrome or Edge.

1. Clone this repository.
2. Start a local static server:

```bash
python3 -m http.server
```

3. Open the local address shown in the terminal, then choose **Begin Guided Intake**.

The answer-chip flow still works if WebGPU is unavailable or the model cannot load.

You can also open `index.html` directly for the non-AI path.

## GitHub Pages

This repo is ready to publish from the root of the `main` branch. Once GitHub Pages is enabled, the app will be available at:

```text
https://aditano.github.io/Qurest/
```

## Project Structure

- `index.html` - the full prototype UI, question tree, condition data, scoring logic, and results rendering
- `symptom-checker.html` - compatibility redirect to the Pages-friendly root path
- `README.md` - project overview and usage notes

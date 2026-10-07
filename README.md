# Qurest

Qurest is a symptom interview you run in the browser. The page is laid out like a printed clinic form. A fixed question tree scores your answers against a library of common conditions and shows the closer matches.

Answers stay in this browser. The page does not save them and does not send them anywhere.

Use it for learning. It does not diagnose you, and it does not replace a clinician. If this might be an emergency, call 911.

**Live site:** [https://aditano.github.io/Qurest/](https://aditano.github.io/Qurest/)

GitHub Pages publishes that site from the root of the `main` branch.

## Features

- The interview opens by asking about emergency warning signs: chest pain with shortness of breath or sweating; sudden weakness, numbness, slurred speech, or facial drooping; and severe trouble breathing, choking, or bluish lips. Any of those stops the interview and offers a call to 911.
- The next step lets you select every symptom area that applies. Mixed problems, such as a cough plus stomach symptoms, are asked one area after another.
- Follow-up questions cover head, ear, and eye symptoms; chest and breathing, including a sore spot on the chest wall; digestion; urinary problems; skin; muscle and joint pain; mental health and sleep; and general symptoms such as fever, fatigue, thirst, and weight change.
- After the selected areas, three shared questions ask about fever, how long the symptoms have lasted, and how severe they feel. Those shared questions only add points to conditions the interview has already picked up.
- The library has 47 condition profiles and 37 question nodes.
- While you answer, a side panel shows progress, the answers so far, and up to three closer fits. Each fit is shown as a percentage of the strongest current score.
- At the end, the page lists up to three matches. Each card has a category, a short description, expandable lists of common symptoms and care options, and an urgency note: usually not urgent, see a doctor, or get care soon. If a high-urgency condition is in that list, a banner says so.
- Back removes the last answer and the points it added. Start over clears the interview.
- On a keyboard, keys 1 through 9 choose an answer and Enter continues.
- On a narrow screen, Back, Start over, and Continue stay in a fixed footer. A skip link jumps to the current question.

## Run it locally

There is no install and no build.

1. Clone this repository.
2. From the project folder, start a static file server:

```bash
python3 -m http.server
```

3. Open the address printed in the terminal. The usual address is [http://localhost:8000/](http://localhost:8000/).

Opening `index.html` directly in a browser also works.

To check that ordinary descriptions of common problems still land in the expected top matches:

```bash
node scripts/check-common-cases.mjs
```

The page itself does not need Node.js. The script does.

## Tech stack

- `index.html` contains the markup, the styles, the question tree, the condition notes, and the scoring.
- The page is plain HTML, CSS, and JavaScript, and it runs entirely in the browser.
- Besley and Karla are loaded from Google Fonts. The font files are not stored in this repository.
- `symptom-checker.html` redirects to the site root, so an older address still opens the interview.
- `scripts/check-common-cases.mjs` loads the interview logic from `index.html` and replays a set of common cases with Node.js built-in modules.

## Project files

- `index.html`: the interview
- `symptom-checker.html`: redirect to `./`
- `scripts/check-common-cases.mjs`: common-case check
- `LICENSE`: GNU General Public License, version 3

## Disclaimer

Qurest is for educational and informational use only. It does not provide a medical diagnosis, and it is not a substitute for professional medical advice, diagnosis, or treatment. If someone may be having a medical emergency, call 911 or go to the nearest emergency department.

## License

Copyright (C) 2026 Anthony DiTano.

Qurest is free software. You can redistribute it and modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

Qurest is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

The full license text is in [LICENSE](LICENSE).

### Third-party exceptions

The items below keep their own licenses. They are not covered by the GPL grant for Qurest.

- **Besley**, copyright 2020 The Besley Project Authors. Loaded from Google Fonts. Licensed under the [SIL Open Font License, Version 1.1](https://scripts.sil.org/OFL).
- **Karla**, copyright 2019 The Karla Project Authors. Loaded from Google Fonts. Licensed under the [SIL Open Font License, Version 1.1](https://scripts.sil.org/OFL).

The font files are not included in this repository.

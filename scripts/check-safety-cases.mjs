import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/\nrender\(\);\nwindow\.addEventListener\('resize', pinMobileFooter\);\s*$/, '\n');

const context = {
  console,
  window: {
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    removeEventListener() {},
    open() {}
  },
  document: {
    getElementById(id) {
      if (id === 'app') return { innerHTML: '', className: '' };
      return null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    body: { dataset: {}, appendChild() {} }
  },
  requestAnimationFrame(fn) { fn(); },
  setTimeout(fn) { fn(); },
  clearTimeout() {}
};
vm.createContext(context);
vm.runInContext(script + `
  function choose(indexes) {
    const q = QUESTIONS[getCurrentQuestionId()];
    if (q.multi) {
      pendingOpts = indexes.slice().sort((a, b) => a - b);
      pendingOpt = null;
    } else {
      pendingOpt = indexes[0];
      pendingOpts = [];
    }
    advance();
  }
  this.choose = choose;
  this.goBack = goBack;
  this.resetState = resetState;
  this.continueAnyway = continueAnyway;
  this.state = state;
  this.QUESTIONS = QUESTIONS;
  this.CONDITIONS = CONDITIONS;
  this.getCurrentQuestionId = getCurrentQuestionId;
  this.getRankedMatches = getRankedMatches;
  this.displayUrgencyFor = displayUrgencyFor;
  this.hasHighUrgencySignal = hasHighUrgencySignal;
`, context);

const {
  choose,
  resetState,
  continueAnyway,
  state,
  QUESTIONS,
  CONDITIONS,
  getCurrentQuestionId,
  getRankedMatches,
  displayUrgencyFor,
  hasHighUrgencySignal
} = context;

function idx(qid, snippet) {
  const options = QUESTIONS[qid]?.opts || [];
  const found = options.findIndex(opt => opt.t.includes(snippet));
  if (found < 0) throw new Error(`${qid} has no option containing "${snippet}"`);
  return found;
}

function ranked(scores = state.scores) {
  return Object.entries(scores)
    .filter(([id, value]) => CONDITIONS[id] && value > 0)
    .sort((a, b) => b[1] - a[1]);
}

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

// ─── Red flag must stay sticky (cannot be rewritten to "not urgent") ───
resetState();
choose([idx('redflag', 'Chest pain with shortness')]);
expect(state.screen === 'emergency', 'Chest-pain red flag did not open the emergency screen');
const redIdx = idx('redflag', 'Chest pain with shortness');
continueAnyway();
expect(state.screen === 'quiz', 'Continue anyway did not return to the interview');
expect(
  state.history[0]?.optIdx === redIdx,
  `Continue anyway overwrote the red-flag answer (optIdx=${state.history[0]?.optIdx}, expected ${redIdx})`
);
expect(
  !QUESTIONS.redflag.opts[state.history[0]?.optIdx]?.t.includes('None of these'),
  'Continue anyway rewrote the red-flag answer to "None of these"'
);
expect(
  state.peakUrgency === 'emergency',
  `peakUrgency after continueAnyway was ${state.peakUrgency}, expected emergency`
);

choose([idx('start', 'Chest or respiratory')]);
choose([idx('resp1', 'Runny nose')]);
choose([idx('resp2', 'No fever, but feeling achy')]);
choose([idx('resp3', 'Gradual onset')]);
choose([idx('resp4', 'Mostly congestion')]);
choose([idx('fever', 'No fever')]);
choose([idx('dur', '1–3 days')]);
choose([idx('sev', 'Mild')]);

expect(state.screen === 'results', 'Mild cold path after a red flag did not reach results');
expect(
  state.peakUrgency === 'emergency',
  `Red-flag peak urgency was lost by results (peakUrgency=${state.peakUrgency})`
);
expect(
  hasHighUrgencySignal(),
  'Results after a red flag had no high/emergency urgency signal'
);
const coldUrgency = displayUrgencyFor(CONDITIONS.common_cold.urgency);
expect(
  coldUrgency === 'high',
  `After a red flag, common_cold display urgency was ${coldUrgency}, expected high (sticky escalate)`
);

// ─── Dangerous eye symptom must not rate as low urgency ───
resetState();
choose([idx('redflag', 'None of these')]);
choose([idx('start', 'Head, ear')]);
choose([idx('head1', 'Red, crusty')]);
choose([idx('eye1', 'painful, vision is worse')]);
choose([idx('fever', 'No fever')]);
choose([idx('dur', '1–3 days')]);
choose([idx('sev', 'Severe —')]);
const eyeMatches = getRankedMatches(3);
const eyeTop = eyeMatches[0];
expect(Boolean(eyeTop), 'Dangerous eye path produced no matches');
if (eyeTop) {
  expect(
    eyeTop.condition.urgency === 'high' || displayUrgencyFor(eyeTop.condition.urgency) === 'high',
    `Dangerous eye top match ${eyeTop.id} had urgency ${eyeTop.condition.urgency} / display ${displayUrgencyFor(eyeTop.condition.urgency)}`
  );
  expect(
    eyeTop.condition.urgency !== 'low' || state.peakUrgency === 'high' || state.peakUrgency === 'emergency',
    'Dangerous eye symptom was still rated low urgency with no elevated peak'
  );
}
expect(
  hasHighUrgencySignal(),
  'Dangerous eye path did not raise a high-urgency signal'
);

// ─── Appendicitis must not leave the top differentials without warning ───
resetState();
choose([idx('redflag', 'None of these')]);
choose([idx('start', 'Stomach or digestive')]);
choose([idx('dig1', 'lower right')]);
choose([idx('dig2', 'triggered or worsened by stress')]);
choose([idx('dig3', 'Years')]);
choose([idx('dig4', 'Hard stools')]);
choose([idx('fever', 'No fever')]);
choose([idx('dur', 'Months to years')]);
choose([idx('sev', 'Moderate')]);

const allRanked = ranked();
const appPlace = allRanked.findIndex(([id]) => id === 'appendicitis');
expect(appPlace >= 0, 'Lower-right pain path never scored appendicitis');
expect(state.scores.appendicitis > 0, 'Appendicitis score was not positive');

const shown = getRankedMatches(3).map(m => m.id);
const appendicitisShown = shown.includes('appendicitis');
expect(
  appendicitisShown || hasHighUrgencySignal(),
  `Appendicitis dropped out of the top 3 (${shown.join(', ')}) with no high-urgency warning`
);
expect(
  appendicitisShown,
  `Appendicitis scored ${state.scores.appendicitis} but was missing from displayed differentials: ${shown.join(', ')}`
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Safety regressions passed: sticky red flag, dangerous eye urgency, appendicitis differential warning.');

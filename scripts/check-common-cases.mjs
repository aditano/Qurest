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
  this.state = state;
  this.QUESTIONS = QUESTIONS;
  this.CONDITIONS = CONDITIONS;
`, context);

const { choose, goBack, resetState, state, QUESTIONS, CONDITIONS } = context;

function idx(qid, snippet) {
  const options = QUESTIONS[qid]?.opts || [];
  const found = options.findIndex(opt => opt.t.includes(snippet));
  if (found < 0) throw new Error(`${qid} has no option containing "${snippet}"`);
  return found;
}

function ranked(scores) {
  return Object.entries(scores)
    .filter(([id, value]) => CONDITIONS[id] && value > 0)
    .sort((a, b) => b[1] - a[1]);
}

function interview(areas, answers) {
  resetState();
  choose([idx('redflag', 'None of these')]);
  choose(areas.map(snippet => idx('start', snippet)));
  for (const [qid, snippet] of answers) {
    if (getQid() !== qid) {
      throw new Error(`Expected ${qid} but the interview is on ${getQid()} after ${areas.join(' + ')}`);
    }
    choose([idx(qid, snippet)]);
  }
  return ranked(state.scores);
}

function getQid() {
  const entry = state.history[state.history.length - 1];
  return entry ? entry.next : 'redflag';
}

const cases = [
  ['a stuffed-up cold', 'common_cold', 1, ['Chest or respiratory'], [
    ['resp1', 'Runny nose'], ['resp2', 'No fever, but feeling achy'], ['resp3', 'Gradual onset'], ['resp4', 'Mostly congestion'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Mild']
  ]],
  ['a cold with a low fever', 'common_cold', 1, ['Chest or respiratory'], [
    ['resp1', 'Runny nose'], ['resp2', 'Mild or low-grade fever'], ['resp3', 'Gradual onset'], ['resp4', 'scratchy throat'],
    ['fever', 'mild or low-grade'], ['dur', '4–14 days'], ['sev', 'Mild']
  ]],
  ['a mild sore throat with a cold', 'common_cold', 1, ['Chest or respiratory'], [
    ['resp1', 'mild sore throat'], ['resp2', 'No fever and no body aches'], ['resp3', 'Gradual onset'], ['resp4', 'scratchy throat'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Mild']
  ]],
  ['sudden flu', 'influenza', 1, ['Chest or respiratory'], [
    ['resp1', 'Cough'], ['resp2', 'High fever'], ['resp3', 'Sudden onset'], ['resp4', 'scratchy throat'],
    ['fever', 'high fever'], ['dur', '1–3 days'], ['sev', 'Severe —']
  ]],
  ['covid with fever and cough', 'covid19', 1, ['Chest or respiratory'], [
    ['resp1', 'Cough'], ['resp2', 'Mild or low-grade fever'], ['resp3', 'Gradual onset'], ['resp4', 'breathing is okay'],
    ['fever', 'mild or low-grade'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['covid after losing smell', 'covid19', 1, ['Chest or respiratory'], [
    ['resp1', 'Cough'], ['resp2', 'Mild or low-grade fever'], ['resp3', 'Gradual onset'], ['resp4', 'taste or smell'],
    ['fever', 'mild or low-grade'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['strep throat without a cough', 'strep', 1, ['Chest or respiratory'], [
    ['resp1', 'Severe sore throat'], ['resp2', 'High fever'], ['resp3', 'Sudden onset'], ['resp4', 'not really coughing'],
    ['fever', 'high fever'], ['dur', '1–3 days'], ['sev', 'Severe —']
  ]],
  ['hay fever', 'allergic_rhinitis', 1, ['Chest or respiratory'], [
    ['resp1', 'Itchy, watery eyes'], ['resp2', 'No fever and no body aches'], ['resp3', 'seasonal pattern'], ['resp4', 'scratchy throat'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Mild']
  ]],
  ['asthma', 'asthma', 1, ['Chest or respiratory'], [
    ['resp1', 'Shortness of breath'], ['resp2', 'No fever and no body aches'], ['resp3', 'Chronic or on-and-off'], ['resp4', 'wheezing'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['bronchitis', 'bronchitis', 1, ['Chest or respiratory'], [
    ['resp1', 'Cough'], ['resp2', 'Mild or low-grade fever'], ['resp3', 'Gradual onset'], ['resp4', 'lingering cough with mucus'],
    ['fever', 'mild or low-grade'], ['dur', '4–14 days'], ['sev', 'Moderate']
  ]],
  ['pneumonia', 'pneumonia', 1, ['Chest or respiratory'], [
    ['resp1', 'Shortness of breath'], ['resp2', 'High fever'], ['resp3', 'Gradual onset'], ['resp4', 'Deep cough'],
    ['fever', 'high fever'], ['dur', '1–3 days'], ['sev', 'Severe —']
  ]],
  ['sinus infection', 'sinusitis', 1, ['Chest or respiratory'], [
    ['resp1', 'Runny nose'], ['resp2', 'Mild or low-grade fever'], ['resp3', 'Gradual onset'], ['resp4', 'Facial pressure'],
    ['fever', 'mild or low-grade'], ['dur', '4–14 days'], ['sev', 'Moderate']
  ]],
  ['sinus headache', 'sinusitis', 1, ['Head, ear'], [
    ['head1', 'Dull, pressure'], ['head2', 'None of the above'], ['head3', 'No clear trigger'], ['head4', 'Facial pressure'],
    ['fever', 'No fever'], ['dur', '4–14 days'], ['sev', 'Moderate']
  ]],
  ['migraine', 'migraine', 1, ['Head, ear'], [
    ['head1', 'Severe, throbbing'], ['head2', 'Nausea, vomiting'], ['head3', 'Stress, poor sleep'], ['head4', 'None of these details'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Severe —']
  ]],
  ['migraine with zigzag vision', 'migraine', 1, ['Head, ear'], [
    ['head1', 'Severe, throbbing'], ['head2', 'Visual disturbances'], ['head3', 'Physical exertion'], ['head4', 'None of these details'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Very severe']
  ]],
  ['tension headache', 'tension_ha', 1, ['Head, ear'], [
    ['head1', 'Dull, pressure'], ['head2', 'None of the above'], ['head3', 'Stress, poor sleep'], ['head4', 'None of these details'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Mild']
  ]],
  ['spinning vertigo', 'vertigo', 1, ['Head, ear'], [
    ['head1', 'room is spinning'], ['head2', 'Loss of balance'], ['head3', 'Changing head'], ['head4', 'brief spinning'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['concussion the day after a fall', 'concussion', 1, ['Head, ear'], [
    ['head1', 'Severe, throbbing'], ['head2', 'Nausea, vomiting'], ['head3', 'No clear trigger'], ['head4', 'Recent head injury'],
    ['fever', 'No fever'], ['dur', 'Less than 24 hours'], ['sev', 'Severe —']
  ]],
  ['headache with known high blood pressure', 'hypertension', 1, ['Head, ear'], [
    ['head1', 'high blood pressure'], ['head2', 'None of the above'], ['head3', 'Physical exertion'], ['head4', 'None of these details'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['heartburn', 'gerd', 1, ['Stomach or digestive'], [
    ['dig1', 'Heartburn'], ['dig2', 'lying down'], ['dig3', 'Years'], ['dig4', 'Burning, reflux'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['ulcer pain between meals', 'peptic_ulcer', 1, ['Stomach or digestive'], [
    ['dig1', 'wakes me at night'], ['dig2', 'relieved by eating'], ['dig3', 'Weeks to months'], ['dig4', 'Burning, reflux'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['stress-related bowel cramps', 'ibs', 1, ['Stomach or digestive'], [
    ['dig1', 'cramping and bloating'], ['dig2', 'triggered or worsened by stress'], ['dig3', 'Years'], ['dig4', 'Hard stools'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['stomach bug in the house', 'gastroenteritis', 1, ['Stomach or digestive'], [
    ['dig1', 'Nausea, vomiting'], ['dig2', 'multiple people'], ['dig3', '24–48 hours'], ['dig4', 'Loose stools'],
    ['fever', 'mild or low-grade'], ['dur', 'Less than 24 hours'], ['sev', 'Moderate']
  ]],
  ['pain moving to the lower right', 'appendicitis', 1, ['Stomach or digestive'], [
    ['dig1', 'lower right'], ['dig2', 'shifted to lower right'], ['dig3', '24–48 hours'], ['dig4', 'Loose stools'],
    ['fever', 'mild or low-grade'], ['dur', 'Less than 24 hours'], ['sev', 'Very severe']
  ]],
  ['pain after a fatty meal', 'gallstones', 1, ['Stomach or digestive'], [
    ['dig1', 'Upper-right'], ['dig2', 'right shoulder'], ['dig3', 'A few days'], ['dig4', 'fatty meals'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Severe —']
  ]],
  ['constipation as the main problem', 'constipation', 1, ['Stomach or digestive'], [
    ['dig1', 'Constipation'], ['dig2', 'hard stools is the main'], ['dig3', 'Weeks to months'], ['dig4', 'Hard stools'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['cramps plus hard stools', 'constipation', 3, ['Stomach or digestive'], [
    ['dig1', 'cramping and bloating'], ['dig2', 'triggered or worsened by stress'], ['dig3', 'Weeks to months'], ['dig4', 'Hard stools'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['burning urine', 'uti', 1, ['Urinary'], [
    ['uri1', 'Burning or pain'], ['uri2', 'foul-smelling'], ['uri3', 'pelvic pressure'],
    ['fever', 'mild or low-grade'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['kidney stone', 'kidney_stones', 1, ['Urinary'], [
    ['uri1', 'flank or back pain'], ['uri2', 'wave-like pain'], ['uri3', 'visible blood'],
    ['fever', 'No fever'], ['dur', 'Less than 24 hours'], ['sev', 'Very severe']
  ]],
  ['sudden urges without burning', 'overactive_bladder', 1, ['Urinary'], [
    ['uri1', 'Frequent urge'], ['uri2', 'sudden urges'], ['uri3', 'without burning'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['thirst and constant urination', 'diabetes', 1, ['Urinary'], [
    ['uri1', 'Excessive thirst'], ['uri2', 'slow-healing'], ['uri3', 'without burning'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['thirst from the general list', 'diabetes', 1, ['General or systemic'], [
    ['gen1', 'Excessive thirst'], ['gen2', 'Tingling'], ['gen3', 'Dry mouth'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['eczema in the creases', 'eczema', 1, ['Skin'], [
    ['skin1', 'Dry, itchy'], ['skin2', 'Elbow creases'], ['skin3', 'cold/dry weather'], ['skin4', 'Flaky inflamed'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['a rash in the shape of a leaf', 'contact_dermatitis', 1, ['Skin'], [
    ['skin1', 'where a substance touched'], ['skin2', 'where I touched'], ['skin3', 'specific substance'], ['skin4', 'Exact outline'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['hives after dinner', 'hives', 1, ['Skin'], [
    ['skin1', 'itchy welts'], ['skin2', 'anywhere on the body'], ['skin3', 'trigger is unknown'], ['skin4', 'fade within hours'],
    ['fever', 'No fever'], ['dur', 'Less than 24 hours'], ['sev', 'Moderate']
  ]],
  ['silvery skin plaques', 'psoriasis', 1, ['Skin'], [
    ['skin1', 'silvery patches'], ['skin2', 'Scalp, elbows'], ['skin3', 'cold/dry weather'], ['skin4', 'Flaky inflamed'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['a ring-shaped rash', 'fungal_infection', 1, ['Skin'], [
    ['skin1', 'Dry, itchy'], ['skin2', 'ring-shaped'], ['skin3', 'locker-room'], ['skin4', 'clearer center'],
    ['fever', 'No fever'], ['dur', '4–14 days'], ['sev', 'Mild']
  ]],
  ['a pulled shoulder', 'muscle_strain', 1, ['Muscle or joint'], [
    ['msk1', 'Pain after exercise'], ['msk2', 'Shoulder, neck'], ['msk3', 'worsens with activity'], ['msk4', 'pull, strain'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['a twisted ankle', 'muscle_strain', 1, ['Muscle or joint'], [
    ['msk1', 'Pain after exercise'], ['msk2', 'Ankle, calf'], ['msk3', 'worsens with activity'], ['msk4', 'pull, strain'],
    ['fever', 'No fever'], ['dur', 'Less than 24 hours'], ['sev', 'Moderate']
  ]],
  ['stiff knees', 'arthritis', 1, ['Muscle or joint'], [
    ['msk1', 'morning'], ['msk2', 'Knee'], ['msk3', 'improves with movement'], ['msk4', 'crunchy'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['gout in the big toe', 'gout', 1, ['Muscle or joint'], [
    ['msk1', 'big toe'], ['msk2', 'Big toe'], ['msk3', 'extremely severe'], ['msk4', 'light touch'],
    ['fever', 'No fever'], ['dur', 'Less than 24 hours'], ['sev', 'Very severe']
  ]],
  ['back pain down the leg', 'lower_back', 1, ['Muscle or joint'], [
    ['msk1', 'Lower back pain'], ['msk2', 'Lower back'], ['msk3', 'worsens with activity'], ['msk4', 'buttock or leg'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['achy back without leg pain', 'lower_back', 3, ['Muscle or joint'], [
    ['msk1', 'Lower back pain'], ['msk2', 'Lower back'], ['msk3', 'fairly constant'], ['msk4', 'crunchy'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['tennis elbow', 'tendonitis', 1, ['Muscle or joint'], [
    ['msk1', 'Pain after exercise'], ['msk2', 'Hands, wrists'], ['msk3', 'worsens with activity'], ['msk4', 'specific motion'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['worry that will not switch off', 'anxiety', 1, ['Mental health'], [
    ['mh1', 'uncontrollable worry'], ['mh2', 'Muscle tension'], ['mh3', 'Several months'], ['mh4', 'mind stays busy'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['months of low mood', 'depression', 1, ['Mental health'], [
    ['mh1', 'Persistent sadness'], ['mh2', 'changes in appetite'], ['mh3', 'Several months'], ['mh4', 'major stressor'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['panic attacks', 'panic_disorder', 1, ['Mental health'], [
    ['mh1', 'Sudden episodes'], ['mh2', 'Racing heart'], ['mh3', '2 weeks to a few months'], ['mh4', 'surges in waves'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Severe —']
  ]],
  ['a busy mind at bedtime', 'insomnia', 1, ['Mental health'], [
    ['mh1', 'Difficulty sleeping'], ['mh2', 'not many physical'], ['mh3', 'Several months'], ['mh4', 'mind stays busy'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['gasping during sleep', 'sleep_apnea', 1, ['Mental health'], [
    ['mh1', 'Difficulty sleeping'], ['mh2', 'changes in appetite'], ['mh3', 'Several months'], ['mh4', 'waking up gasping'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Moderate']
  ]],
  ['pale and breathless', 'anemia', 1, ['General or systemic'], [
    ['gen1', 'Pale skin'], ['gen2', 'None of the above'], ['gen3', 'feeling run down'],
    ['fever', 'No fever'], ['dur', 'More than 2 weeks'], ['sev', 'Moderate']
  ]],
  ['always cold, gaining weight', 'hypothyroidism', 1, ['General or systemic'], [
    ['gen1', 'weight change'], ['gen2', 'None of the above'], ['gen3', 'cold intolerance'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Mild']
  ]],
  ['dried out after being sick', 'dehydration', 1, ['General or systemic'], [
    ['gen1', 'Excessive thirst'], ['gen2', 'Chills, body aches'], ['gen3', 'Dry mouth'],
    ['fever', 'mild or low-grade'], ['dur', 'Less than 24 hours'], ['sev', 'Moderate']
  ]],
  ['fever without a local source', 'fever_general', 1, ['General or systemic'], [
    ['gen1', 'Fever with general'], ['gen2', 'Chills, body aches'], ['gen3', 'Infectious symptoms'],
    ['fever', 'high fever'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['ear pain after a cold', 'ear_infection', 1, ['Head, ear'], [
    ['head1', 'Ear pain'], ['ear1', 'after a cold'],
    ['fever', 'mild or low-grade'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ["swimmer's ear", 'ear_infection', 1, ['Head, ear'], [
    ['head1', 'Ear pain'], ['ear1', 'tug it'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['crusty pink eye', 'conjunctivitis', 1, ['Head, ear'], [
    ['head1', 'Red, crusty'], ['eye1', 'crusty discharge'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Mild']
  ]],
  ['itchy eyes with sneezing', 'allergic_rhinitis', 1, ['Head, ear'], [
    ['head1', 'Red, crusty'], ['eye1', 'sneezing'],
    ['fever', 'No fever'], ['dur', 'Months to years'], ['sev', 'Mild']
  ]],
  ['a tender spot on the chest', 'chest_wall', 1, ['Chest or respiratory'], [
    ['resp1', 'sore spot on the chest'], ['resp2', 'No fever and no body aches'], ['resp3', 'do not feel sick'], ['resp4', 'not coughing or wheezing'],
    ['fever', 'No fever'], ['dur', '1–3 days'], ['sev', 'Moderate']
  ]],
  ['cough plus a stomach bug', 'gastroenteritis', 3, ['Chest or respiratory', 'Stomach or digestive'], [
    ['resp1', 'Runny nose'], ['resp2', 'Mild or low-grade fever'], ['resp3', 'Gradual onset'], ['resp4', 'scratchy throat'],
    ['dig1', 'Nausea, vomiting'], ['dig2', 'multiple people'], ['dig3', '24–48 hours'], ['dig4', 'Loose stools'],
    ['fever', 'mild or low-grade'], ['dur', 'Less than 24 hours'], ['sev', 'Moderate']
  ]]
];

const failures = [];
const seen = new Set();
let firsts = 0;

for (const [name, expect, needRank, areas, answers] of cases) {
  seen.add(expect);
  let result;
  try {
    result = interview(areas, answers);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    continue;
  }
  const place = result.findIndex(([id]) => id === expect);
  if (place === 0) firsts++;
  if (place < 0 || place >= needRank) {
    failures.push(`${name}: wanted ${expect} in the top ${needRank}, got ${result.slice(0, 3).map(([id, score]) => `${id}:${score}`).join(', ') || 'nothing'}`);
  }
  if (name.startsWith('concussion') && result.some(([id]) => id === 'gout')) {
    failures.push('concussion pulled in gout from the shared timing question');
  }
}

const uncovered = Object.keys(CONDITIONS).filter(id => !seen.has(id));
if (uncovered.length) failures.push(`No common-case story for: ${uncovered.join(', ')}`);

resetState();
choose([idx('redflag', 'Chest pain with shortness')]);
if (state.screen !== 'emergency') failures.push('Chest pain with shortness of breath did not stop the interview');
resetState();
choose([idx('redflag', 'facial drooping')]);
if (state.screen !== 'emergency') failures.push('Stroke signs did not stop the interview');
resetState();
choose([idx('redflag', 'bluish lips')]);
if (state.screen !== 'emergency') failures.push('Severe breathing trouble did not stop the interview');

resetState();
choose([idx('redflag', 'None of these')]);
choose([idx('start', 'Head, ear')]);
choose([idx('head1', 'Severe, throbbing')]);
const beforeBack = state.scores.migraine;
goBack();
if (state.scores.migraine) failures.push(`Back did not remove the migraine score (left ${state.scores.migraine})`);
if (getQid() !== 'head1') failures.push(`Back returned to ${getQid()} instead of head1`);
choose([idx('head1', 'Severe, throbbing')]);
if (state.scores.migraine !== beforeBack) failures.push('Repeating an answer after Back did not restore the score');

const storyMisses = failures.filter(item => !item.startsWith('No common-case') && !item.includes('did not stop') && !item.startsWith('Back ') && !item.startsWith('Repeating') && !item.startsWith('concussion pulled')).length;
const caught = cases.length - storyMisses;
const rate = caught / cases.length;
console.log(`${cases.length} common stories, ${firsts} ranked first, catch rate ${(rate * 100).toFixed(1)}% in the requested top slots`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
if (rate < 0.99) {
  console.error(`Catch rate ${rate} is under 99%`);
  process.exit(1);
}
console.log(`All ${Object.keys(CONDITIONS).length} conditions have a story, and emergency stops still fire.`);

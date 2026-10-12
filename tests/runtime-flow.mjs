import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const appCode = fs.readFileSync('app.js', 'utf8');
const dataCode = fs.readFileSync('data/day50.js', 'utf8');
const learningCode = fs.readFileSync('data/learning-day50.js', 'utf8');

function browser(storage = new Map(), confirmAnswer = true) {
  let html = '';
  let lastBlob = null;
  let downloadName = '';
  let alertCount = 0;
  const nodes = new Map();
  const cards = new Map();
  const classList = () => ({add() {}, remove() {}, toggle() {}});
  const element = () => ({classList: classList(), style: {setProperty() {}},
    textContent: '', value: '', disabled: false, files: [],
    focus() {}, click() {this.onclick?.()}, remove() {},
    scrollIntoView() {}, appendChild() {}, addEventListener() {}});
  function fakeCanvas() {
    const cv = element();
    const context = {scale() {}, save() {}, restore() {}, setTransform() {},
      clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, drawImage() {}};
    cv.width = 0; cv.height = 0;
    cv.getContext = () => context;
    cv.getBoundingClientRect = () => ({width: 200, height: 92, left: 0, top: 0});
    cv.setPointerCapture = () => {};
    return cv;
  }
  const app = {
    get innerHTML() {return html;},
    set innerHTML(value) {
      html = value;
      nodes.clear();
      cards.clear();
      const pattern = /<article\b[^>]*data-k="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g;
      let m;
      while ((m = pattern.exec(value))) {
        const contents = m[2];
        const parts = new Map();
        cards.set(m[1], {
          querySelector(selector) {
            if (selector === '[data-trace]' && !contents.includes('data-trace')) return null;
            if (!parts.has(selector)) parts.set(selector, selector === '[data-trace]' ? fakeCanvas() : element());
            return parts.get(selector);
          }
        });
      }
    }
  };
  const navTest = element(), navAdmin = element();
  const document = {
    documentElement: element(),
    body: {...element(), appendChild() {}},
    addEventListener() {},
    querySelector(selector) {
      const k = selector.match(/^\[data-k="([^"]+)"\]$/)?.[1];
      return cards.get(k) || null;
    },
    getElementById(id) {
      if (id === 'app') return app;
      if (id === 'navTest') return navTest;
      if (id === 'navAdmin') return navAdmin;
      if (!html.includes("id=\"" + id + "\"")) return null;
      if (!nodes.has(id)) {
        const n = element();
        if (id === 'daySel') {
          const selected = html.match(/<option value="(\d+)" selected>/);
          n.value = selected?.[1] || '50';
        }
        nodes.set(id, n);
      }
      return nodes.get(id);
    },
    createElement(tag) {
      const el = tag === 'canvas' ? fakeCanvas() : element();
      if (tag === 'a') el.click = () => {downloadName = el.download;};
      return el;
    }
  };
  const localStorage = {
    getItem(key) {return storage.has(key) ? storage.get(key) : null;},
    setItem(key, value) {storage.set(key, value);}
  };
  const window = {visualViewport: null, WORD_DATA: null};
  const context = vm.createContext({window, document, localStorage, Blob,
    URL: {createObjectURL(blob) {lastBlob = blob; return 'blob:backup';}, revokeObjectURL() {}},
    navigator: {userAgent: 'iPad', maxTouchPoints: 5},
    matchMedia: () => ({matches: true}),
    CSS: {escape: s => s}, innerWidth: 1024, innerHeight: 768,
    devicePixelRatio: 1, setTimeout() {}, addEventListener() {},
    alert() {alertCount++;}, confirm() {return confirmAnswer;}, console});
  vm.runInContext(dataCode, context, {filename: 'data/day50.js'});
  vm.runInContext(learningCode, context, {filename: 'data/learning-day50.js'});
  vm.runInContext(appCode, context, {filename: 'app.js'});
  const state = () => JSON.parse(localStorage.getItem('wm2000pilot_v1'));
  const card = k => {const c = cards.get(k); assert.ok(c, "card missing: " + k); return c;};
  const get = id => {const el = document.getElementById(id); assert.ok(el, "element missing: " + id); return el;};
  const submit = (num, value) => {
    const c = card("50:" + num);
    c.querySelector('[data-in]').value = value;
    c.querySelector('[data-in]').oninput?.();
    c.querySelector('[data-sub]').onclick();
  };
  const begin = () => {get('start').onclick();get('skipStudy').onclick();};
  const next = () => {assert.equal(get('next').disabled, false, 'STEP is blocked'); get('next').onclick();};
  const resetDay = () => {navAdmin.onclick();get('manualDay').value = '50';get('applyManualDay').onclick();navTest.onclick();};
  const correct = (n) => window.WORD_DATA.days[0].words[n - 1].answer;
  return {app, window, document, navTest, navAdmin, storage, state,
    card, get, submit, begin, next, resetDay, correct,
    get backupBlob() {return lastBlob;}, get downloadName() {return downloadName;},
    get alerts() {return alertCount;}};
}

function completeNew(b, {wrongAt = 0, whitespaceAt = 0} = {}) {
  b.begin();
  assert.equal(b.state().current.wordKeys.length, 40);
  for (let n = 1; n <= 40; n++) {
    const answer = b.correct(n);
    if (n === wrongAt) {
      b.submit(n, answer + '!');
      assert.equal(b.state().current.answers["50:" + n].status, 'relearn');
      const c = b.card("50:" + n);
      const canvas = c.querySelector('[data-trace]');
      assert.ok(canvas);
      const event = {pointerType: 'pen', isPrimary: true, pointerId: 1,
        clientX: 20, clientY: 22, pressure: .5, preventDefault() {}};
      canvas.onpointerdown(event);
      canvas.onpointermove({...event, clientX: 70, clientY: 36});
      canvas.onpointerup(event);
      c.querySelector('[data-tdone]').onclick();
      const input = c.querySelector('[data-re]');
      input.value = answer;
      input.oninput();
      assert.equal(c.querySelector('[data-rsub]').disabled, false);
      c.querySelector('[data-rsub]').onclick();
      assert.equal(b.state().current.answers["50:" + n].relearnDone, true);
    } else {
      b.submit(n, n === whitespaceAt ? " " + answer + " " : answer);
      assert.equal(b.state().current.answers["50:" + n].result, 'correct');
    }
    if (n % 8 === 0) b.next();
  }
  if (wrongAt) {
    assert.equal(b.state().current.phase, 'retry');
    b.submit(wrongAt, b.correct(wrongAt));
    b.next();
  }
  assert.equal(b.state().current.done, true);
  b.get('home').onclick();
}

const b = browser();
completeNew(b, {wrongAt: 1, whitespaceAt: 2});
assert.equal(b.state().history.length, 1);
assert.equal(b.state().history[0].wrongCount, 1);
assert.equal(b.state().stats['50:1'].lastWrong, b.correct(1) + '!');
assert.equal(b.state().sessionNo, 2);
assert.equal(b.state().nextDay, 49);
assert.match(b.app.innerHTML, /id="start" disabled/, 'DAY 49 must not silently use DAY 50 data');

b.resetDay();
completeNew(b);
b.resetDay();
completeNew(b);
assert.equal(b.state().sessionNo, 4);
b.begin();
assert.equal(b.state().current.type, 'review');
assert.deepEqual(Array.from(b.state().current.wordKeys), ['50:1']);
b.submit(1, b.correct(1));
b.next();
assert.equal(b.state().history[3].type, 'review');
assert.equal(b.state().history[3].total, 1);
assert.equal(b.state().sessionNo, 5);

const stored = new Map();
const interrupted = browser(stored);
interrupted.begin();
interrupted.submit(1, interrupted.correct(1).normalize('NFD'));
assert.equal(interrupted.state().current.answers['50:1'].result, 'correct', 'NFC equivalence');
const resumed = browser(stored);
assert.equal(resumed.state().current.step, 0);
assert.equal(resumed.state().current.answers['50:1'].status, 'done');
resumed.submit(2, resumed.correct(2));
assert.equal(resumed.state().current.answers['50:2'].status, 'done');

// Writing in a different card must survive another answer's rerender and reload.
const draftsBefore = resumed.card('50:3').querySelector('[data-in]');
draftsBefore.value = '미제출 필기';
draftsBefore.oninput();
assert.equal(resumed.state().current.drafts['50:3'], '미제출 필기');
resumed.submit(4, resumed.correct(4));
assert.equal(resumed.state().current.drafts['50:3'], '미제출 필기');
const draftReload = browser(stored);
assert.equal(draftReload.state().current.drafts['50:3'], '미제출 필기');
draftReload.submit(3, draftReload.correct(3));
assert.equal(Object.hasOwn(draftReload.state().current.drafts,'50:3'), false);

resumed.navAdmin.onclick();
resumed.get('exportBackup').onclick();
assert.match(resumed.downloadName, /wm2000-backup-.*\.json/);
assert.ok(resumed.backupBlob);
const saved = JSON.parse(await resumed.backupBlob.text());
assert.equal(saved.format, 'wm2000-local-backup');
assert.equal(saved.schema, 1);
const other = browser();
other.navAdmin.onclick();
const uploader = other.get('restoreBackup');
uploader.files = [{size: resumed.backupBlob.size, text: () => Promise.resolve(JSON.stringify(saved))}];
await uploader.onchange({target: uploader});
assert.equal(other.state().current.answers['50:2'].status, 'done');
assert.equal(other.state().current.step, 0);
other.navAdmin.onclick();
const bad = other.get('restoreBackup');
bad.files = [{size: 100, text: () => Promise.resolve('{not valid')}];
const before = JSON.stringify(other.state());
await bad.onchange({target: bad});
assert.equal(JSON.stringify(other.state()), before, 'invalid restore must preserve existing state');
assert.match(other.get('backupMsg').textContent, /실패/);

console.log('PASS runtime: strict grading, Pencil tracing, 8x5 steps, retry, 3+1 review, reload, backup/restore');
export {browser, completeNew};

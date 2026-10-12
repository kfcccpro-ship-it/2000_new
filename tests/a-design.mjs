import fs from "node:fs";
import assert from "node:assert/strict";
const html=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("app.js","utf8");
const css=fs.readFileSync("styles.css","utf8");
assert.match(html,/v0\.2\.0<\/title>/);
assert.match(html,/id="navAdmin"/);
assert.equal(fs.readFileSync("VERSION","utf8").trim(),"0.2.0");
for(const s of ["const VER=\"0.2.0\",KEY=\"wm2000pilot_v1\",STEP=8","function home(){","function session(){","function focusCard(","function relearn(","function checkRestoreData(","function backupRecords()","function restoreRecords(","function admin(){","NFC","localStorage","c.drafts||(c.drafts={})","if(c.drafts)delete c.drafts[k]"]) {
  if(!app.includes(s)&&s!=="NFC")throw Error("preserved learning flow or draft handling missing: "+s);
}
assert.match(app,/normalize\("NFC"\)\.trim\(\)/);
for(const s of [".appBrand",".brandTag",".kioskRule",".kioskStart",".progressSegments",".focusReview",".focusCard",".relearnCell",".completeSymbol",".completeButton",".wordGrid"])assert.ok(css.includes(s),"A layout missing: "+s);
assert.ok(css.includes("grid-template-columns:repeat(4,minmax(0,1fr))"),"large iPad 4x2");
assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),"small iPad 2 columns");
assert.ok(css.includes("safe-area-inset-bottom"),"safe area");
console.log("PASS v0.2.0 A design + preserved grading/storage + iPad layout contracts");

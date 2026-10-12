import assert from "node:assert/strict";
import fs from "node:fs";
import {browser} from "./runtime-flow.mjs";
const data=fs.readFileSync("data/learning-day50.js","utf8");
const vm=await import("node:vm");
const context=vm.createContext({window:{}});
vm.runInContext(data,context);
const items=context.window.WORD_LEARNING.day50;
assert.equal(items.length,40);
assert.equal(new Set(items.map(x=>x.no)).size,40);
assert.equal(items.filter(x=>x.middle).map(x=>x.english).join(","),"wound");
for(let i=0;i<40;i++){const w=items[i];assert.equal(w.no,i+1);assert.ok(w.emoji&&w.cue&&w.sentence[0]&&w.sentence[1]);}
const a=browser();
assert.match(a.app.innerHTML,/오늘 학습 시작/);
a.begin();
assert.equal(a.state().current.type,"new");
assert.equal(a.state().current.wordKeys.length,40);
assert.match(a.app.innerHTML,/id="wordTimer">15/);
a.navAdmin.onclick();
assert.match(a.app.innerHTML,/id="manualDay"/);
const original=JSON.stringify(a.state());
a.get("manualDay").value="49";
a.get("applyManualDay").onclick();
assert.equal(JSON.stringify(a.state()),original,"changing DAY during test must be rejected");
const blank=browser();
blank.navAdmin.onclick();
blank.get("manualDay").value="49";
blank.get("applyManualDay").onclick();
assert.equal(blank.state().nextDay,50,"unregistered DAY must not change state");
blank.get("manualDay").value="50";
blank.get("applyManualDay").onclick();
assert.equal(blank.state().nextDay,50);
const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
const stamp=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const store=new Map([["wm2000pilot_v1",JSON.stringify({
 nextDay:50,sessionNo:2,history:[{id:123,date:stamp(yesterday),type:"new",bookDay:50,total:40,
 everWrong:["50:1"],wrongCount:1}],stats:{"50:1":{wrong:1,correct:0,lastWrong:"가짜",attempts:[]}},
 current:null,reviewPlan:{},study:null
})]]);
const b=browser(store);
assert.match(b.app.innerHTML,/지난 학습/);
b.begin();
assert.equal(b.state().current.type,"new");
assert.ok(b.state().current.dueKeys.includes("50:1"));
assert.match(b.app.innerHTML,/어제 오답 · DAY 50/);
assert.match(b.app.innerHTML,/틀린 횟수 1/);
const c=browser();
c.get("start").onclick();
assert.match(c.app.innerHTML,/교재 첫 번째 뜻/);
assert.match(c.app.innerHTML,/한글 예시 문장/);
assert.match(c.app.innerHTML,/id="nextStudy" disabled/);
assert.match(c.app.innerHTML,/id="skipStudy"/);
assert.equal(c.state().current,null);
assert.equal(c.state().study.index,0);
console.log("PASS daily learning: 40 sentence hints, middle-school evidence, admin DAY, previous-day due tag, learning stage, 15-second display");
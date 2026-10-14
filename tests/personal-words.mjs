import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {buildPack,extractWords} from '../tools/build-word-pack.mjs';

const code=fs.readFileSync('data/personal-words.js','utf8'),storage=new Map();
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const window={};
vm.runInNewContext(fs.readFileSync('data/day50.js','utf8'),{window});
vm.runInNewContext(fs.readFileSync('data/day49.js','utf8'),{window});
const original=JSON.stringify(window.WORD_DATA),daysIdentity=window.WORD_DATA.days;
const record='{"nextDay":49,"current":{"drafts":{"49:1":"이어쓰기"}},"history":[{"id":10}]}';
storage.set('wm2000pilot_v1',record);
vm.runInNewContext(code,{window,localStorage});
const pack={format:'wm2000-personal-words',schema:1,days:[{day:48,words:[]}],learning:{day48:[]}};
for(let n=1;n<=40;n++){
  const english='qa-'+n,source=n===1?'(설명) 첫 뜻':n===2?'안(의미)':'연습 '+n;
  pack.days[0].words.push({day:48,no:n,english,sourceFirstMeaning:source,sourceFullMeaning:source+', 다음 뜻',answer:n===1?'첫 뜻':source,sourceOrdinal:1880+n});
  pack.learning.day48.push({no:n,english,cue:'자체 작성',emoji:'📖',sentence:['앞 문장',' 뒤 문장'],middle:false});
}
window.PERSONAL_WORDS.importPack(pack);
assert.equal(window.WORD_DATA.days,daysIdentity);
assert.equal(JSON.stringify(window.WORD_DATA.days.filter(d=>d.day>48)),JSON.stringify(JSON.parse(original).days));
assert.equal(storage.get('wm2000pilot_v1'),record);
const imported=storage.get('wm2000personal_words_v1');
const reject=change=>{const bad=structuredClone(pack);change(bad);assert.throws(()=>window.PERSONAL_WORDS.importPack(bad));assert.equal(storage.get('wm2000personal_words_v1'),imported);assert.equal(storage.get('wm2000pilot_v1'),record)};
reject(p=>p.days[0].words.pop());
reject(p=>p.days[0].words[0].answer='다음 뜻');
reject(p=>p.days[0].words[1].no=1);
reject(p=>p.days[0].words[1].english=p.days[0].words[0].english);
reject(p=>p.days[0].words[0].sourceOrdinal=1);
reject(p=>p.days.push(p.days[0]));
reject(p=>p.days[0].day=49);
reject(p=>p.learning.day48[0].middle=true);
reject(p=>p.learning.day48[0].english='different');
// A consistent but changed already-installed answer must also be rejected.
reject(p=>Object.assign(p.days[0].words[0],{answer:'교체',sourceFirstMeaning:'교체',sourceFullMeaning:'교체'}));
const failedStorage={getItem:localStorage.getItem,setItem:()=>{throw Error('QuotaExceededError')}};
const fresh={WORD_DATA:{days:structuredClone(JSON.parse(original).days)}};
vm.runInNewContext(code,{window:fresh,localStorage:failedStorage});
assert.throws(()=>fresh.PERSONAL_WORDS.importPack(pack));
assert.equal(storage.get('wm2000personal_words_v1'),imported);
const reboot={WORD_DATA:{days:structuredClone(JSON.parse(original).days)}};
vm.runInNewContext(code,{window:reboot,localStorage});
assert.equal(reboot.WORD_DATA.days.find(d=>d.day===48).words.length,40);
assert.equal(reboot.WORD_DATA.days.find(d=>d.day===48).words[1].answer,'안(의미)');
const invalidBoot={WORD_DATA:{days:structuredClone(JSON.parse(original).days)}};
vm.runInNewContext(code,{window:invalidBoot,localStorage:{getItem:()=>'{invalid'}});
assert.equal(invalidBoot.WORD_DATA.days.length,2);
assert.match(invalidBoot.PERSONAL_WORDS.error,/불러오지/);

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const rows=Array.from({length:2000},(_,i)=>[i+1,99,99,'qa-'+(i+1),'첫 뜻, 다음 뜻']);
const htmlBytes=Buffer.from('const WORDS = '+JSON.stringify(rows)+'; maliciousCode();');
const pdfBytes=Buffer.from('synthetic PDF bytes for hash check');
const review={format:'wm2000-source-review',schema:1,day:48,pdfPage:48,visuallyReviewed:true,reviewer:'Synthetic test',reviewedAt:'2026-10-14',htmlSha256:hash(htmlBytes),pdfSha256:hash(pdfBytes),entries:Array.from({length:40},(_,i)=>({no:i+1,english:'qa-'+(1881+i),pdfFirstMeaning:'첫 뜻',checked:true}))};
const learning=review.entries.map(e=>({no:e.no,english:e.english,emoji:'📖',cue:'테스트',sentence:['앞 문장',' 뒤 문장']}));
const built=buildPack({htmlBytes,pdfBytes,review,learning});
assert.equal(built.pack.days[0].words[0].sourceOrdinal,1881);
assert.equal(built.audit.entries.length,40);
for(const change of [r=>r.entries.reverse(),r=>r.entries[0].english='wrong',r=>r.entries[0].pdfFirstMeaning='다른 뜻',r=>r.entries[0].checked=false,r=>r.visuallyReviewed=false,r=>r.pdfSha256='bad']){
  const bad=structuredClone(review);change(bad);assert.throws(()=>buildPack({htmlBytes,pdfBytes,review:bad,learning}));
}
assert.throws(()=>extractWords('const WORDS = runAnything();'));
const duplicate=structuredClone(rows);duplicate[100][0]=1;
assert.throws(()=>extractWords('const WORDS = '+JSON.stringify(duplicate)+';'));
console.log('PASS personal import: 40/day, stable record IDs, existing DAY49/50, first-meaning policy, atomic rejection, reload, quota errors');
console.log('PASS source audit builder: 2000 sequential IDs, independent PDF review, source hashes, order/meaning discrepancies block build');

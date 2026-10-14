// Personal word files remain on this device. Imported JSON is never executed.
(()=>{
"use strict";
const KEY="wm2000personal_words_v1",FORMAT="wm2000-personal-words";
const object=x=>x&&typeof x==="object"&&!Array.isArray(x);
const string=x=>typeof x==="string"&&x.trim()&&x.length<=250;
function firstMeaning(text){
  let depth=0;
  for(let i=0;i<text.length;i++){
    if(text[i]==="(")depth++;
    if(text[i]===")")depth--;
    if(depth<0)throw Error("뜻의 괄호가 맞지 않습니다.");
    if(text[i]===","&&depth===0)return text.slice(0,i).trim();
  }
  if(depth)throw Error("뜻의 괄호가 맞지 않습니다.");
  return text.trim();
}
// Only a leading explanation is omitted. Internal parentheses are significant.
const gradingAnswer=s=>s.replace(/^\([^()]*\)\s*/,"").trim();
function validate(pack){
  if(!object(pack)||pack.format!==FORMAT||pack.schema!==1||!Array.isArray(pack.days)||!pack.days.length||pack.days.length>48)throw Error("개인 단어 파일 형식이 올바르지 않습니다.");
  const used=new Set(),days=[],learning={};
  for(const d of pack.days){
    if(!object(d)||!Number.isInteger(d.day)||d.day<1||d.day>48||used.has(d.day)||!Array.isArray(d.words)||d.words.length!==40)throw Error("DAY 1~48별로 중복 없이 40단어가 필요합니다. 기존 DAY49·50은 교체하지 않습니다.");
    used.add(d.day);const spelling=new Set();
    const words=d.words.map((w,i)=>{
      if(!object(w)||w.day!==d.day||w.no!==i+1||w.sourceOrdinal!==(d.day-1)*40+i+1||!string(w.english)||!string(w.answer)||!string(w.sourceFirstMeaning)||!string(w.sourceFullMeaning)||spelling.has(w.english))throw Error("DAY "+d.day+"의 번호·철자·뜻을 확인하세요.");
      if(w.sourceFirstMeaning!==firstMeaning(w.sourceFullMeaning)||w.answer!==gradingAnswer(w.sourceFirstMeaning))throw Error("DAY "+d.day+"의 첫 번째 뜻과 채점답이 일치하지 않습니다.");
      if(w.english!==w.english.trim()||w.answer!==w.answer.normalize("NFC").trim())throw Error("철자 또는 채점답에 불필요한 공백이 있습니다.");
      spelling.add(w.english);
      return {day:w.day,no:w.no,english:w.english,answer:w.answer,sourceOrdinal:w.sourceOrdinal,sourceFirstMeaning:w.sourceFirstMeaning,sourceFullMeaning:w.sourceFullMeaning};
    });
    const cards=pack.learning?.["day"+d.day];
    if(!Array.isArray(cards)||cards.length!==40)throw Error("DAY "+d.day+"의 학습 카드 40개가 필요합니다.");
    learning["day"+d.day]=cards.map((c,i)=>{
      if(!object(c)||c.no!==i+1||c.english!==words[i].english||!string(c.cue)||!string(c.emoji)||!Array.isArray(c.sentence)||c.sentence.length!==2||!c.sentence.every(string)||c.middle===true)throw Error("DAY "+d.day+"의 학습 카드 순서·문장을 확인하세요.");
      return {no:c.no,english:c.english,cue:c.cue,emoji:c.emoji,sentence:[...c.sentence],middle:false};
    });
    days.push({day:d.day,words});
  }
  return {format:FORMAT,schema:1,days:days.sort((a,b)=>b.day-a.day),learning};
}
let current=null,error="";
function apply(pack){
  const existing=window.WORD_DATA.days;
  const others=existing.filter(d=>d.day>48);
  // Keep the days array identity used by app.js.
  existing.splice(0,existing.length,...others,...pack.days);
  window.WORD_LEARNING=Object.assign(window.WORD_LEARNING||{},pack.learning);
  current=pack;error="";
}
function importPack(input){
  const checked=validate(input),byDay=new Map((current?.days||[]).map(d=>[d.day,d]));
  const mergedLearning={...(current?.learning||{})};
  for(const d of checked.days){
    const old=byDay.get(d.day);
    if(old&&JSON.stringify(old.words)!==JSON.stringify(d.words))throw Error("DAY "+d.day+"가 이미 등록되어 있고 내용이 다릅니다. 학습기록 보호를 위해 교체하지 않습니다.");
    byDay.set(d.day,d);mergedLearning["day"+d.day]=checked.learning["day"+d.day];
  }
  const merged=validate({format:FORMAT,schema:1,days:[...byDay.values()],learning:mergedLearning});
  // Storage failures leave both the running dataset and the previous file intact.
  localStorage.setItem(KEY,JSON.stringify(merged));apply(merged);return merged.days.map(d=>d.day);
}
try{const raw=localStorage.getItem(KEY);if(raw)apply(validate(JSON.parse(raw)))}catch(e){error="개인 단어 파일을 불러오지 못했습니다: "+e.message}
window.PERSONAL_WORDS={validate,importPack,exportPack:()=>current,firstMeaning,gradingAnswer,get error(){return error}};
})();

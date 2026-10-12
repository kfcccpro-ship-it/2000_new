(()=>{"use strict";
const VER="0.1.3",KEY="wm2000pilot_v1",STEP=8,app=document.getElementById("app"),navTest=document.getElementById("navTest"),navAdmin=document.getElementById("navAdmin");
const DATA=window.WORD_DATA;let route="test";let st=load();
function base(){return{nextDay:50,sessionNo:1,history:[],stats:{},current:null}}
function load(){try{return Object.assign(base(),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){return base()}}
function save(){localStorage.setItem(KEY,JSON.stringify(st))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function norm(s){return String(s??"").normalize("NFC").trim()}
function day(d){return DATA.days.find(x=>x.day===+d)}
function key(w){return w.day+":"+w.no}
function byKey(k){let[d,n]=k.split(":").map(Number),dd=day(d);return dd?dd.words[n-1]:null}
function isReview(){return st.sessionNo%4===0}
function reviewPool(){let a=st.history.filter(x=>x.type==="new").slice(-3),o=[];a.forEach(h=>(h.everWrong||[]).forEach(k=>{if(!o.includes(k))o.push(k)}));return o}
function deviceProfile(){
  const ua=navigator.userAgent||"",ipad=/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  const landscape=matchMedia("(orientation:landscape)").matches,w=innerWidth,h=innerHeight,large=ipad&&Math.max(w,h)>=1180;
  return{ipad,landscape,large,label:ipad?(large?"대화면 iPad · Apple Pencil 최적화":"iPad · Apple Pencil 최적화"):"터치·키보드 호환 모드"};
}
function setupDeviceCompat(){
  const root=document.documentElement;
  const refresh=()=>{const d=deviceProfile();root.classList.toggle("isIPad",d.ipad);root.classList.toggle("isLargeIPad",d.large);root.classList.toggle("isLandscape",d.landscape);root.style.setProperty("--app-vh",(window.visualViewport?.height||innerHeight)+"px")};
  refresh();addEventListener("resize",refresh,{passive:true});addEventListener("orientationchange",()=>setTimeout(refresh,120),{passive:true});
  if(window.visualViewport){
    const vv=()=>{root.style.setProperty("--app-vh",window.visualViewport.height+"px");document.body.classList.toggle("keyboardActive",window.visualViewport.height<innerHeight*.78)};
    visualViewport.addEventListener("resize",vv,{passive:true});visualViewport.addEventListener("scroll",vv,{passive:true});
  }
  document.addEventListener("focusin",e=>{if(!e.target.matches?.(".scribble"))return;setTimeout(()=>e.target.closest(".card")?.scrollIntoView({block:"center",behavior:"smooth"}),140)});
}
setupDeviceCompat();
function setRoute(r){route=r;navTest.classList.toggle("active",r==="test");navAdmin.classList.toggle("active",r==="admin");render()}
navTest.onclick=()=>setRoute("test");navAdmin.onclick=()=>setRoute("admin");
function render(){route==="admin"?admin():test()}
function test(){if(st.current&&!st.current.done)return session();home()}
function home(){
  let rv=isReview(),pool=reviewPool(),d=day(st.nextDay),canStart=rv||!!d;
  app.innerHTML=`<section class="kioskHome">
    <div class="kioskEyebrow">${rv?"REVIEW DAY":"TODAY"}</div>
    <div class="kioskDay">${rv?"오답 점검":"DAY "+st.nextDay}</div>
    <div class="kioskMeta">${rv?(pool.length?pool.length+"단어":"복습할 오답이 없습니다"):"40단어 · 8단어 × 5 STEP"}</div>
    <button class="primary kioskStart" id="start" ${canStart?"":"disabled"}>${rv?"오답 점검 시작":"테스트 시작"}</button>
    <div class="kioskHint">Apple Pencil로 한글 뜻 쓰기 → 인식 확인 → 제출</div>
    <details class="kioskAdjust">
      <summary>DAY 변경</summary>
      <div class="kioskAdjustBody">
        <select id="daySel">${Array.from({length:50},(_,i)=>50-i).map(n=>`<option value="${n}" ${n===st.nextDay?"selected":""}>DAY ${n}</option>`).join("")}</select>
        <button class="secondary" id="saveDay">적용</button>
      </div>
      ${!rv&&!d?'<p class="kioskWarn">현재 파일럿은 DAY 50만 사용할 수 있습니다.</p>':""}
    </details>
    <div class="kioskCycle">신규 3일 · 4일차 복습</div>
  </section>`;
  document.getElementById("saveDay").onclick=()=>{st.nextDay=+document.getElementById("daySel").value;save();home()};
  document.getElementById("start").onclick=()=>start();
}
function start(){if(isReview()){st.current={id:Date.now(),type:"review",wordKeys:reviewPool(),phase:"main",step:0,round:1,answers:{},everWrong:[],roundWrong:[],done:false}}else{let d=day(st.nextDay);if(!d)return alert("DAY "+st.nextDay+" 단어가 아직 등록되지 않았습니다. 교재 데이터 등록 후 이용해 주세요.");st.current={id:Date.now(),type:"new",bookDay:d.day,wordKeys:d.words.map(key),phase:"main",step:0,round:1,answers:{},everWrong:[],roundWrong:[],done:false}}save();session()}
function phaseKeys(c){return c.phase==="main"?c.wordKeys:(c.retryKeys||[])}
function slice(c){let a=phaseKeys(c),s=c.step*STEP;return a.slice(s,s+STEP)}
function totalSteps(c){return Math.max(1,Math.ceil(phaseKeys(c).length/STEP))}
function session(){let c=st.current,ks=slice(c);if(!ks.length){if(c.type==="review"&&c.wordKeys.length===0)return finish();return endPhase()}
let token=c.phase+":"+c.round+":"+c.step,title=c.phase==="main"?(c.type==="review"?"오답 점검":"1차 평가"):"오답 재시험 "+c.round+"회차",done=ks.filter(k=>c.answers[k]?.status==="done"&&c.answers[k]?.token===token).length;
app.innerHTML=`<div class="stepHead"><span class="chip">${c.type==="review"?"복습":"DAY "+c.bookDay}</span><div><div class="stepTitle">${title} · STEP ${c.step+1}/${totalSteps(c)}</div><div class="small">8단어씩 · 단어별 즉시 제출</div></div><strong>${done}/${ks.length}</strong></div>
<div class="notice"><b>Apple Pencil로 입력칸에 직접 쓰세요.</b><br>iPad가 손글씨를 텍스트로 바꾸면 인식 결과를 확인한 뒤 제출합니다. 잘못 인식되면 지우고 바로 다시 쓰세요.</div>
<div class="progress"><i style="width:${Math.round(c.step/totalSteps(c)*100)}%"></i></div><section class="wordGrid">${ks.map((k,i)=>card(k,i,c)).join("")}</section>
<div class="footer"><p id="msg">오답은 정답 확인 → 따라쓰기 → 다시쓰기까지 끝내야 다음 STEP으로 갑니다.</p><button class="primary" id="next" disabled>${c.step+1<totalSteps(c)?"다음 8단어":"이 단계 마무리"}</button></div>`;
ks.forEach(k=>bind(k,c));updateNext(c,ks)}
function card(k,i,c){let w=byKey(k),a=c.answers[k]||{},token=c.phase+":"+c.round+":"+c.step,done=a.status==="done"&&a.token===token,bad=a.result==="wrong"&&a.token===token;
return `<article class="card ${done?(bad?"bad":"ok"):""}" data-k="${k}"><div><span class="small">${i+1}. ${w.day}-${w.no}</span><div class="english">${esc(w.english)}</div></div><label class="small"><b>백강 고시체를 떠올리며 한글로 쓰세요</b></label><input class="scribble" data-in lang="ko" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Apple Pencil로 여기에 쓰세요" ${done?"disabled":""} value="${done?esc(a.input||""):""}"><div class="recognized" data-rec>인식: <b>${done?esc(a.input||""):"-"}</b></div><div class="actions"><button class="secondary" data-clear ${done?"disabled":""}>지우기</button><button class="primary" data-sub ${done?"disabled":""}>제출</button></div><div data-fb>${bad?relearn(w,a):""}</div></article>`}
function relearn(w,a){if(a.relearnDone)return `<div class="answer"><span>정답</span><b>${esc(w.answer)}</b></div><p class="small">재학습 완료 · 당일 오답 재시험에 다시 나옵니다.</p>`;
return `<div class="answer"><span>정답</span><b>${esc(w.answer)}</b></div><div style="margin-top:8px"><b>바로 재학습</b><p class="small">① 희미한 정답을 한 번 따라 쓰고 ② 오른쪽에 다시 직접 써서 정확히 인식시키세요.</p><div class="traceWrap"><div><div class="traceBox"><div class="traceText">${esc(w.answer)}</div><canvas class="trace" data-trace></canvas></div><div class="actions"><button class="secondary" data-tclear>지우기</button><button class="secondary" data-tdone>따라쓰기 완료</button></div></div><div><input class="scribble" data-re lang="ko" inputmode="text" enterkeyhint="done" placeholder="정답을 다시 손으로 쓰세요" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><div class="recognized" data-rerec>재인식: <b>-</b></div><div class="actions"><button class="secondary" data-rclear>지우기</button><button class="good" data-rsub disabled>재확인</button></div></div></div></div>`}
function bind(k,c){let el=document.querySelector('[data-k="'+CSS.escape(k)+'"]'),inp=el.querySelector("[data-in]"),rec=el.querySelector("[data-rec] b");if(inp){inp.oninput=()=>rec.textContent=inp.value||"-";el.querySelector("[data-clear]").onclick=()=>{inp.value="";rec.textContent="-";inp.focus()};el.querySelector("[data-sub]").onclick=()=>submit(k,inp.value,c)}if(el.querySelector("[data-trace]"))bindRelearn(k,c,el)}
function attempt(w,input,result,ctx){let s=st.stats[key(w)]||(st.stats[key(w)]={wrong:0,correct:0,lastWrong:"",attempts:[]});s.attempts.push({at:Date.now(),input,result,ctx});if(result==="wrong"){s.wrong++;s.lastWrong=input}else s.correct++}
function submit(k,input,c){let w=byKey(k),v=norm(input);if(!v)return;let ok=v===norm(w.answer),token=c.phase+":"+c.round+":"+c.step;c.answers[k]={input:v,result:ok?"correct":"wrong",status:ok?"done":"relearn",relearnDone:ok,token};attempt(w,v,ok?"correct":"wrong",c.phase);if(!ok){if(!c.everWrong.includes(k))c.everWrong.push(k);if(!c.roundWrong.includes(k))c.roundWrong.push(k)}save();session()}
function bindRelearn(k,c,el){let w=byKey(k),a=c.answers[k],cv=el.querySelector("[data-trace]"),ink=false;canvas(cv,()=>ink=true);el.querySelector("[data-tclear]").onclick=()=>{clear(cv);ink=false};let td=el.querySelector("[data-tdone]"),re=el.querySelector("[data-re]"),rr=el.querySelector("[data-rerec] b"),rs=el.querySelector("[data-rsub]");td.onclick=()=>{if(!ink)return alert("희미한 정답 위에 한 번 따라 써 주세요.");a.traceDone=true;save();rs.disabled=!norm(re.value);re.focus()};re.oninput=()=>{rr.textContent=re.value||"-";rs.disabled=!(a.traceDone&&norm(re.value))};el.querySelector("[data-rclear]").onclick=()=>{re.value="";rr.textContent="-";rs.disabled=true;re.focus()};rs.onclick=()=>{let v=norm(re.value);if(v!==norm(w.answer)){attempt(w,v,"wrong","relearn");re.value="";rr.textContent="다시 써 주세요";save();return}attempt(w,v,"correct","relearn");a.relearnDone=true;a.status="done";a.input=v;save();session()}}
function canvas(cv,onInk){
  let d=Math.min(2,devicePixelRatio||1),x=null,draw=false,last=null;
  const setup=(preserve=false)=>{
    const r=cv.getBoundingClientRect();if(!r.width||!r.height)return;
    let old=null;if(preserve&&cv.width&&cv.height){old=document.createElement("canvas");old.width=cv.width;old.height=cv.height;old.getContext("2d").drawImage(cv,0,0)}
    cv.width=Math.max(1,Math.round(r.width*d));cv.height=Math.max(1,Math.round(r.height*d));x=cv.getContext("2d");x.scale(d,d);x.lineCap="round";x.lineJoin="round";x.strokeStyle="#20304f";
    if(old)x.drawImage(old,0,0,old.width,old.height,0,0,r.width,r.height);
  };
  setup(false);
  const p=e=>{let q=cv.getBoundingClientRect();return{x:e.clientX-q.left,y:e.clientY-q.top,pressure:e.pressure>0?e.pressure:.5}};
  const seg=(a,b)=>{x.lineWidth=2.4+b.pressure*3.2;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()};
  cv.addEventListener("pointerenter",e=>{if(e.pointerType==="pen")cv.classList.add("penHover")});
  cv.addEventListener("pointerleave",e=>{if(e.pointerType==="pen"&&!draw)cv.classList.remove("penHover")});
  cv.onpointerdown=e=>{if(e.pointerType==="touch"||e.isPrimary===false)return;draw=true;last=p(e);cv.classList.remove("penHover");cv.setPointerCapture?.(e.pointerId);e.preventDefault()};
  cv.onpointermove=e=>{if(!draw)return;const es=e.getCoalescedEvents?.()||[e];for(const ev of es){const n=p(ev);seg(last,n);last=n}onInk();e.preventDefault()};
  const end=e=>{if(!draw)return;draw=false;last=null;if(e?.pointerType==="pen")cv.classList.add("penHover");e?.preventDefault?.()};
  cv.onpointerup=end;cv.onpointercancel=end;cv.onlostpointercapture=end;
  if(window.ResizeObserver){let t;new ResizeObserver(()=>{clearTimeout(t);t=setTimeout(()=>setup(true),90)}).observe(cv)}
}
function clear(cv){let x=cv.getContext("2d");x.save();x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,cv.width,cv.height);x.restore()}
function updateNext(c,ks){let token=c.phase+":"+c.round+":"+c.step,ok=ks.every(k=>c.answers[k]?.status==="done"&&c.answers[k]?.token===token),b=document.getElementById("next");b.disabled=!ok;if(ok)document.getElementById("msg").textContent="이 STEP을 모두 끝냈습니다.";b.onclick=()=>{c.step++;save();c.step>=totalSteps(c)?endPhase():session()}}
function endPhase(){let c=st.current;if(c.phase==="main"){if(c.everWrong.length){c.phase="retry";c.retryKeys=[...c.everWrong];c.step=0;c.round=1;c.roundWrong=[];c.answers={};save();return session()}return finish()}if(c.roundWrong.length){c.retryKeys=[...new Set(c.roundWrong)];c.roundWrong=[];c.step=0;c.round++;c.answers={};save();return session()}finish()}
function finish(){let c=st.current,wrong=[...new Set(c.everWrong)],h={id:c.id,date:new Date().toISOString().slice(0,10),type:c.type,bookDay:c.bookDay||null,total:c.wordKeys.length,everWrong:wrong,wrongCount:wrong.length,retryRounds:c.round};st.history.push(h);if(c.type==="new")st.nextDay=Math.max(1,c.bookDay-1);st.sessionNo++;c.done=true;save();app.innerHTML=`<section class="panel complete"><h1>${c.type==="review"?"오답 점검 완료":"오늘 평가 완료"}</h1><div class="score">${c.type==="review"&&!c.wordKeys.length?"오답 없음":(c.wordKeys.length-wrong.length)+"/"+c.wordKeys.length}</div><p>${c.type==="review"&&!c.wordKeys.length?"지난 3회 신규 학습에서 틀린 단어가 없습니다.":"첫 평가 기준입니다. 오답은 모두 재학습과 재시험을 통과했습니다."}</p><button class="primary" id="home">오늘 화면으로</button></section>`;document.getElementById("home").onclick=()=>{st.current=null;save();home()}}
function checkRestoreData(payload){
  if(!payload||payload.format!=="wm2000-local-backup"||payload.schema!==1)throw Error("이 웹앱의 백업 파일이 아닙니다.");
  const s=payload.state,object=v=>v&&typeof v==="object"&&!Array.isArray(v);
  const keyOK=k=>typeof k==="string"&&/^([1-9]|[1-4]\d|50):([1-9]|[1-3]\d|40)$/.test(k);
  if(!object(s)||!Number.isInteger(s.nextDay)||s.nextDay<1||s.nextDay>50||!Number.isInteger(s.sessionNo)||s.sessionNo<1||
     !Array.isArray(s.history)||s.history.length>10000||!object(s.stats)||Object.keys(s.stats).length>2000)throw Error("학습기록 구조가 올바르지 않습니다.");
  for(const h of s.history){if(!object(h)||!["new","review"].includes(h.type)||!Array.isArray(h.everWrong)||!h.everWrong.every(keyOK)||!Number.isInteger(h.total)||h.total<0)throw Error("세션 기록이 손상되었습니다.");}
  for(const [k,v] of Object.entries(s.stats)){if(!keyOK(k)||!object(v)||!Number.isInteger(v.wrong)||v.wrong<0||!Number.isInteger(v.correct)||v.correct<0||!Array.isArray(v.attempts))throw Error("오답 통계가 손상되었습니다.");}
  const c=s.current;
  if(c!==null){if(!object(c)||!["new","review"].includes(c.type)||!["main","retry"].includes(c.phase)||!Array.isArray(c.wordKeys)||
    !c.wordKeys.every(keyOK)||!Array.isArray(c.everWrong)||!c.everWrong.every(keyOK)||!Array.isArray(c.roundWrong)||!c.roundWrong.every(keyOK)||
    !object(c.answers)||!Number.isInteger(c.step)||c.step<0||!Number.isInteger(c.round)||c.round<1||
    (c.phase==="retry"&&(!Array.isArray(c.retryKeys)||!c.retryKeys.every(keyOK))))throw Error("진행 중 평가 기록이 손상되었습니다.");
    if(!c.done&&c.wordKeys.some(k=>!byKey(k)))throw Error("진행 중인 DAY의 단어 데이터가 현재 앱에 없습니다.");
  }
  return s;
}
function backupRecords(){
  const msg=document.getElementById("backupMsg");
  try{
    const payload={format:"wm2000-local-backup",schema:1,appVersion:VER,exportedAt:new Date().toISOString(),state:st};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
    const uri=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=uri;a.download="wm2000-backup-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),3000);
    msg.textContent="백업 파일을 저장했습니다. 별도 장소에 보관하세요.";
  }catch(e){msg.textContent="백업 실패: "+e.message;}
}
async function restoreRecords(input){
  const file=input.files?.[0];if(!file)return;
  try{
    if(file.size>8*1024*1024)throw Error("백업 파일이 너무 큽니다(8MB 초과).");
    const restored=checkRestoreData(JSON.parse(await file.text()));
    if(!confirm("현재 학습기록을 백업 파일의 "+restored.history.length+"회 세션 기록으로 교체할까요? 이 기기의 현재 기록은 덮어써집니다."))return;
    const previous=st;st=restored;
    try{save()}catch(e){st=previous;throw e}
    admin();document.getElementById("backupMsg").textContent="백업 복원 완료 · "+restored.history.length+"회 세션";
  }catch(e){document.getElementById("backupMsg").textContent="복원 실패: "+e.message;}
  finally{input.value="";}
}
function admin(){let hist=[...st.history].reverse(),stats=Object.entries(st.stats).map(([k,v])=>({k,...v,w:byKey(k)})).filter(x=>x.w).sort((a,b)=>b.wrong-a.wrong),tw=stats.reduce((a,x)=>a+x.wrong,0);app.innerHTML=`<section class="panel"><h1>관리자 대시보드</h1><p class="muted">이 기기의 localStorage에만 저장됩니다.</p></section><div class="metrics" style="margin-top:13px"><div class="metric"><small>완료 세션</small><b>${hist.length}</b></div><div class="metric"><small>누적 오답</small><b>${tw}</b></div><div class="metric"><small>오답 단어</small><b>${stats.filter(x=>x.wrong).length}</b></div><div class="metric"><small>다음 신규 DAY</small><b>${st.nextDay}</b></div></div><section class="panel" style="margin-top:13px"><h2>자주 틀린 단어</h2><div class="tableWrap">${stats.filter(x=>x.wrong).length?`<table class="table"><thead><tr><th>영어</th><th>정답</th><th>오답 횟수</th><th>최근 잘못 입력</th></tr></thead><tbody>${stats.filter(x=>x.wrong).slice(0,30).map(x=>`<tr><td><b>${esc(x.w.english)}</b></td><td>${esc(x.w.answer)}</td><td>${x.wrong}</td><td>${esc(x.lastWrong||"-")}</td></tr>`).join("")}</tbody></table>`:"아직 오답이 없습니다."}</div></section><section class="panel" style="margin-top:13px"><h2>세션 기록</h2><div class="tableWrap">${hist.length?`<table class="table"><thead><tr><th>날짜</th><th>구분</th><th>범위</th><th>첫 평가</th><th>오답</th></tr></thead><tbody>${hist.map(h=>`<tr><td>${h.date}</td><td>${h.type==="review"?"복습":"신규"}</td><td>${h.type==="review"?"오답만":"DAY "+h.bookDay}</td><td>${h.total-h.wrongCount}/${h.total}</td><td>${h.wrongCount}</td></tr>`).join("")}</tbody></table>`:"완료 기록이 없습니다."}</div></section><section class="panel" style="margin-top:13px"><h2>학습기록 백업 · 복원</h2><p class="muted">기록은 이 기기의 브라우저에만 저장됩니다. 기기 변경이나 데이터 삭제 전에 백업 파일을 보관하세요.</p><div class="row"><button class="secondary" id="exportBackup">백업 파일 저장 (.json)</button><button class="secondary" id="importBackup">백업 파일 복원</button><input id="restoreBackup" type="file" accept=".json,application/json" hidden></div><p id="backupMsg" role="status" class="small" aria-live="polite"></p></section><section class="panel" style="margin-top:13px"><button class="danger" id="reset">전체 기록 초기화</button></section>`;document.getElementById("exportBackup").onclick=backupRecords;document.getElementById("importBackup").onclick=()=>document.getElementById("restoreBackup").click();document.getElementById("restoreBackup").onchange=e=>restoreRecords(e.target);document.getElementById("reset").onclick=()=>{if(confirm("전체 기록을 삭제할까요?")){st=base();save();admin()}}}
render();})();
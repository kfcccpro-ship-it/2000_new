(()=>{"use strict";
const VER="0.2.5",KEY="wm2000pilot_v1",STEP=8,app=document.getElementById("app"),navTest=document.getElementById("navTest"),navAdmin=document.getElementById("navAdmin"),navHome=document.getElementById("navHome");
const DATA=window.WORD_DATA;let route="test";let st=load();let activeInterval=null;let revealTimers=[];
function base(){return{nextDay:50,sessionNo:1,history:[],stats:{},current:null,study:null,reviewPlan:{},activeMode:null}}
function load(){try{const s=Object.assign(base(),JSON.parse(localStorage.getItem(KEY)||"{}"));if(!s.reviewPlan||typeof s.reviewPlan!=="object"||Array.isArray(s.reviewPlan))s.reviewPlan={};return s}catch(e){return base()}}
function save(){localStorage.setItem(KEY,JSON.stringify(st))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function norm(s){return String(s??"").normalize("NFC").trim()}
function day(d){return DATA.days.find(x=>x.day===+d)}
function registeredDays(){return DATA.days.map(d=>d.day).sort((a,b)=>a-b).join("·")}
function key(w){return w.day+":"+w.no}
function byKey(k){let[d,n]=k.split(":").map(Number),dd=day(d);return dd?dd.words[n-1]:null}
function isReview(){return st.sessionNo%4===0}
function localDate(d=new Date()){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function plusDays(stamp,days){const d=new Date(stamp+"T12:00:00");d.setDate(d.getDate()+days);return localDate(d)}
function pauseActiveTimers(){
  if(activeInterval!==null&&typeof clearInterval==="function")clearInterval(activeInterval);
  activeInterval=null;
  for(const timer of revealTimers)if(typeof clearTimeout==="function")clearTimeout(timer);
  revealTimers=[];
}
function uniqueKeys(ks){return [...new Set(ks)].filter(k=>byKey(k))}
function priorReviewKeys(){
  const today=localDate(),due=[];
  const plan=st.reviewPlan||{};
  for(const [k,p] of Object.entries(plan)){
    if(p&&p.due&&p.due<=today&&p.last&&p.last<today)due.push(k);
  }
  // Backward compatibility: v0.1.x histories have no spaced-review plan.
  const older=st.history.filter(h=>h.date&&h.date<today);
  if(older.length){
    const latest=older.reduce((a,h)=>h.date>a?h.date:a,"");
    for(const h of older.filter(x=>x.date===latest)){
      for(const k of h.everWrong||[])due.push(k);
    }
  }
  const seenToday=new Set(st.history.filter(h=>h.date===today).flatMap(h=>h.wordKeys||[]));
  return uniqueKeys(due).filter(k=>!seenToday.has(k));
}
function priorBadge(k,c){
  const last=st.history.filter(h=>h.everWrong?.includes(k)&&h.date<localDate()).at(-1);
  if(!c.dueKeys?.includes(k))return "";
  const yesterday=plusDays(localDate(),-1);
  const label=last?.date===yesterday?"어제 오답":"복습 예정";
  return '<span class="originBadge">'+label+' · DAY '+esc(k.split(":")[0])+'</span>';
}
function studyInfo(w){
  const cards=window.WORD_LEARNING?.["day"+w.day];
  return Array.isArray(cards)?cards.find(x=>x.no===w.no&&x.english===w.english)||null:null;
}
function wordTags(k,c){
  const w=byKey(k),meta=studyInfo(w),wrong=st.stats[k]?.wrong||0;
  return (meta?.middle?'<span class="middleBadge" title="2022 영어과 기본 어휘 목록: 중학·고교 공통 권장">중학 · 필수</span>':"")+
    priorBadge(k,c)+(wrong?'<span class="wrongBadge">오답 '+wrong+'회 · '+(wrong>=3?'최우선':'집중')+'</span>':"");
}
function learnKeys(){
  const due=priorReviewKeys();
  return isReview()?uniqueKeys([...due,...reviewPool()]):uniqueKeys([...due,...(day(st.nextDay)?.words||[]).map(key)]);
}
function startLearning(){
  const d=day(st.nextDay);
  if(!isReview()&&!d)return alert("DAY "+st.nextDay+" 데이터가 아직 등록되지 않았습니다.");
  if(!st.study||!Array.isArray(st.study.keys)||st.study.done)st.study={day:st.nextDay,keys:learnKeys(),index:0,created:Date.now(),done:false,review:isReview()};
  st.activeMode="study";save();studyScreen();
}
function studyScreen(){
  pauseActiveTimers();setStudentInside(true);
  const s=st.study;if(!s)return home();
  if(s.done)return studyComplete();
  if(s.index>=s.keys.length){s.done=true;s.completedAt=localDate();st.activeMode="studyDone";save();return studyComplete()}
  st.activeMode="study";save();
  const k=s.keys[s.index],w=byKey(k),meta=studyInfo(w),wrong=st.stats[k]?.wrong||0;
  if(!w){s.index++;save();return studyScreen()}
  const first=meta?.sentence?.[0]||"",last=meta?.sentence?.[1]||"";
  app.innerHTML=`<section class="learning" aria-label="한 단어씩 익히기">
    <div class="learningHeader"><span class="chip">${s.review?"복습 학습":"DAY "+s.day}</span><span>학습 ${s.index+1} / ${s.keys.length}</span></div>
    <div class="learningLine" role="progressbar" aria-label="학습 단어 진행률" aria-valuemin="0" aria-valuemax="${s.keys.length}" aria-valuenow="${s.index+1}"><i style="width:${(s.index+1)/s.keys.length*100}%"></i></div>
    <div class="learningCue">${esc(meta?.cue||"뜻을 떠올려 보세요")}</div>
    <div class="learningEmoji" role="img" aria-label="${esc(meta?.cue||"단어 이미지 단서")}">${esc(meta?.emoji||"📖")}</div>
    <h1 class="learningWord">${esc(w.english)}</h1>
    <div class="learningTags">${wordTags(k,{dueKeys:priorReviewKeys()})}${wrong>1?'<span class="wrongBadge">먼저 익힐 단어</span>':""}</div>
    <div class="learningMeaning" id="learnMeaning" hidden><small>교재 첫 번째 뜻</small><strong>${esc(w.answer)}</strong></div>
    <div class="sentenceBox" aria-label="상황을 보여주는 한글 문장">
      <small>한글 예시 문장 · 조금씩 나타납니다</small>
      <p><span id="sentenceFirst" hidden>${esc(first)}</span><span id="sentenceLast" hidden>${esc(last)}</span></p>
    </div>
    <button class="primary learningNext" id="nextStudy" disabled>다음 단어 →</button>
    <p class="learningMemory">간격을 두고 다시 떠올리면 기억에 더 오래 남아요.</p>
  </section>`;
  const later=(id,ms)=>revealTimers.push(setTimeout(()=>{const el=document.getElementById(id);if(el)el.hidden=false},ms));
  later("learnMeaning",1000);
  later("sentenceFirst",2500);
  later("sentenceLast",4400);
  revealTimers.push(setTimeout(()=>{const b=document.getElementById("nextStudy");if(b)b.disabled=false},4600));
  document.getElementById("nextStudy").onclick=()=>{if(document.getElementById("nextStudy").disabled)return;s.index++;save();studyScreen()};
}
function studyComplete(){
  pauseActiveTimers();setStudentInside(true);
  const s=st.study;if(!s||!s.done)return home();
  st.activeMode="studyDone";save();
  app.innerHTML=`<section class="complete studyComplete" aria-label="학습 완료">
    <div class="completeSymbol" aria-hidden="true">✓</div>
    <h1>학습 완료!</h1>
    <p>DAY ${s.day} · ${s.keys.length}단어를 익혔습니다.</p>
    <p class="modeCompleteNote">평가는 별도입니다. 평가를 시작하기 전까지 채점 기록이나 오답 횟수는 바뀌지 않습니다.</p>
    <button id="learningGoHome" class="primary completeButton" type="button">처음 화면으로 <span aria-hidden="true">→</span></button>
    <button id="learningGoEval" class="secondary modeAfterButton" type="button">이제 평가하기</button>
  </section>`;
  document.getElementById("learningGoHome").onclick=goHome;
  document.getElementById("learningGoEval").onclick=enterEvaluation;
}
function enterEvaluation(){
  st.activeMode="evaluation";save();
  if(st.current&&!st.current.done)return session();
  return start();
}
function runWordClock(k,c,token){
  if(typeof setInterval!=="function")return;
  const timer=document.getElementById("wordTimer"),track=document.getElementById("timerTrack");
  if(!timer)return;
  // Keep the original absolute deadline across same-word re-renders, navigation and reloads.
  const clockId=token+":"+k;
  if(!c.clock||c.clock.id!==clockId){c.clock={id:clockId,deadline:Date.now()+15000};save()}
  const deadline=c.clock.deadline;
  const update=()=>{
    if(st.current!==c||route!=="test"||c.phase+":"+c.round+":"+c.step!==token){pauseActiveTimers();return}
    if(c.answers[k]?.token===token){pauseActiveTimers();return}
    const remain=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    timer.textContent=String(remain);
    if(track)track.style.width=(remain/15*100)+"%";
    if(!remain){pauseActiveTimers();submit(k,"시간 초과",c)}
  };
  update();activeInterval=setInterval(update,160);
}

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
function setStudentInside(inside){document.body.classList.toggle("isStudentInside",!!inside)}
function goHome(){
  pauseActiveTimers();route="test";
  navTest.classList.add("active");navAdmin.classList.remove("active");
  document.body.classList.remove("isAdminRoute");
  home();
}
function setRoute(r){
  pauseActiveTimers();route=r;
  navTest.classList.toggle("active",r==="test");
  navAdmin.classList.toggle("active",r==="admin");
  document.body.classList.toggle("isAdminRoute",r==="admin");
  if(r==="admin")setStudentInside(false);
  render();
}
navTest.onclick=goHome;navHome.onclick=goHome;navAdmin.onclick=()=>setRoute("admin");
function render(){route==="admin"?admin():test()}
function test(){
  if(st.activeMode==="home")return home();
  if(st.activeMode==="studyDone"&&st.study?.done)return studyComplete();
  if(st.activeMode==="study"&&st.study&&!st.study.done)return studyScreen();
  if(st.activeMode==="evaluation"&&st.current&&!st.current.done)return session();
  // v0.2.1 legacy backups may not contain activeMode.
  if(!st.activeMode&&st.current&&!st.current.done)return session();
  if(!st.activeMode&&st.study&&!st.study.done)return studyScreen();
  home();
}

function home(){
  pauseActiveTimers();setStudentInside(false);
  st.activeMode="home";save();
  const rv=isReview(),d=day(st.nextDay),due=priorReviewKeys(),
    pool=uniqueKeys([...due,...(rv?reviewPool():[])]),
    activeStudy=!!(st.study&&!st.study.done),
    activeEval=!!(st.current&&!st.current.done),
    canLearn=rv||!!d||activeStudy,canEval=rv||!!d||activeEval,
    count=rv?pool.length:d?.words.length||0;
  const learnSub=activeStudy?`DAY ${st.study.day} · ${st.study.index} / ${st.study.keys.length}단어 이어하기`:
    (st.study?.done&&st.study.day===st.nextDay?"이 DAY 학습 완료 · 다시 학습 가능":"그림 · 첫 번째 뜻 · 한글 예문");
  const evalSub=activeEval?`평가 이어하기 · STEP ${st.current.step+1} / ${totalSteps(st.current)}`:
    "한글 뜻 필기 · 15초 · 오답 복습";
  app.innerHTML=`<section class="kioskHome modeHero">
    <div class="kioskEyebrow">${rv?"오늘은 복습하는 날":"오늘의 영어단어"}</div>
    <h1 class="kioskDay">${rv?"오답 복습":"DAY "+st.nextDay}</h1>
    <div class="kioskRule" aria-hidden="true"></div>
    <p class="kioskMeta">${rv?(count?count+"단어 복습":"복습할 오답이 없습니다"):count+"단어 · 8단어 × 5 STEP"}</p>
    ${due.length?`<p class="dueNotice">이전에 틀린 단어 ${due.length}개도 포함됩니다. <b>원래 DAY를 표시합니다.</b></p>`:""}
    <div class="heroModeGrid" aria-label="학습 또는 평가 선택">
      <button id="startLearning" type="button" class="modeChoice choiceLearn" ${canLearn?"":"disabled"}>
        <span class="choiceNumber">01 · 익히기</span>
        <strong class="choiceTitle">학습</strong>
        <span class="choiceDescription">${esc(learnSub)}</span>
        <span class="choiceArrow" aria-hidden="true">→</span>
      </button>
      <button id="startEvaluation" type="button" class="modeChoice choiceEval" ${canEval?"":"disabled"}>
        <span class="choiceNumber">02 · 기억 확인</span>
        <strong class="choiceTitle">평가</strong>
        <span class="choiceDescription">${esc(evalSub)}</span>
        <span class="choiceArrow" aria-hidden="true">→</span>
      </button>
    </div>
    ${!rv&&!d&&!activeStudy&&!activeEval?'<p class="kioskWarn" role="status">이 DAY의 단어는 아직 등록되지 않았습니다. 보호자 설정에서 개인 단어 파일을 불러오거나 등록된 DAY를 지정하세요.</p>':""}
    <p class="modeHeroNote">학습과 평가는 따로 진행할 수 있어요.</p>
  </section>`;
  document.getElementById("startLearning").onclick=startLearning;
  document.getElementById("startEvaluation").onclick=enterEvaluation;
}

function start(){
  pauseActiveTimers();setStudentInside(true);st.activeMode="evaluation";
  const due=priorReviewKeys(),rv=isReview();
  let keys,bookDay;
  if(rv){keys=uniqueKeys([...due,...reviewPool()])}
  else {
    const d=day(st.nextDay);
    if(!d)return alert("DAY "+st.nextDay+"의 단어가 아직 등록되지 않았습니다.");
    bookDay=d.day;keys=uniqueKeys([...due,...d.words.map(key)]);
  }
  st.current={id:Date.now(),type:rv?"review":"new",bookDay:bookDay||null,dueKeys:due,
    wordKeys:keys,phase:"main",step:0,round:1,answers:{},everWrong:[],roundWrong:[],done:false};
  save();session();
}

function phaseKeys(c){return c.phase==="main"?c.wordKeys:(c.retryKeys||[])}
function slice(c){let a=phaseKeys(c),s=c.step*STEP;return a.slice(s,s+STEP)}
function totalSteps(c){return Math.max(1,Math.ceil(phaseKeys(c).length/STEP))}
function session(){
  pauseActiveTimers();setStudentInside(true);st.activeMode="evaluation";
  let c=st.current,ks=slice(c);
  if(!ks.length){if(c.type==="review"&&c.wordKeys.length===0)return finish();return endPhase()}
  let token=c.phase+":"+c.round+":"+c.step;
  let title=c.phase==="main"?(c.type==="review"?"복습 필기평가":"오늘 필기평가"):"오답 재시험 "+c.round+"회차";
  let done=ks.filter(k=>c.answers[k]?.status==="done"&&c.answers[k]?.token===token).length;
  let focus=ks.find(k=>c.answers[k]?.status==="relearn"&&c.answers[k]?.token===token);
  let active=ks.find(k=>!(c.answers[k]?.status==="done"&&c.answers[k]?.token===token)&&k!==focus);
  const segmented=ks.map(k=>`<i class="${c.answers[k]?.status==="done"&&c.answers[k]?.token===token?"filled":""}"></i>`).join("");
  app.innerHTML=`<div class="stepHead"><span class="chip">${c.type==="review"?"복습":"DAY "+c.bookDay}</span>
    <div><div class="stepTitle">${focus?"오답 재학습":title}</div><div class="stepSub">STEP ${c.step+1} / ${totalSteps(c)} · ${c.dueKeys?.length?("지난 오답·예정 "+c.dueKeys.length+"개 포함"): "현재 DAY"}</div></div>
    <strong class="stepCount">${done} <span>/ ${ks.length}</span></strong></div>
  <div class="progressSegments" role="progressbar" aria-valuemin="0" aria-valuemax="${ks.length}" aria-valuenow="${done}" aria-label="이 STEP의 완료 단어">${segmented}</div>
  ${focus?`<section class="focusReview">${focusCard(focus,c)}</section>`:`<div class="timedQuestion">
    <div class="questionTop"><span>한 단어씩 집중하기</span><div class="countdown" aria-live="off"><strong id="wordTimer">15</strong><small>초</small></div></div>
    <div class="timerRail"><span id="timerTrack"></span></div>
    <p class="stepTip">15초가 지나면 복습 대상으로 이동해요. 필기 인식 결과를 확인한 뒤 제출하세요.</p>
    <section class="wordGrid focusOne">${ks.map((k,i)=>card(k,i,c,active)).join("")}</section></div>`}
  <div class="footer"><p id="msg">${focus?"따라쓰기 → 다시쓰기 후 남은 단어를 계속합니다.":"한 단어에 집중하고 제출하면 다음 단어로 넘어갑니다."}</p>
    <button type="button" class="primary" id="next" disabled>${c.step+1<totalSteps(c)?"다음 8단어":"이 단계 마무리"} <span aria-hidden="true">→</span></button></div>`;
  if(focus)bind(focus,c);else ks.forEach(k=>bind(k,c));
  updateNext(c,ks);
  if(!focus&&active)runWordClock(active,c,token);
}

function focusCard(k,c){
  const w=byKey(k),a=c.answers[k];
  return `<article class="focusCard" data-k="${k}">
    <div class="focusIntro">다시 익혀볼 단어 · DAY ${w.day}</div><div class="wordBadges">${wordTags(k,c)}</div><h2 class="focusEnglish">${esc(w.english)}</h2>
    ${relearn(w,a)}
  </article>`;
}

function card(k,i,c,active){
  const w=byKey(k),a=c.answers[k]||{},token=c.phase+":"+c.round+":"+c.step;
  const done=a.status==="done"&&a.token===token;
  const bad=a.result==="wrong"&&a.token===token;
  const inRelearn=bad&&!a.relearnDone;
  const inputValue=done||inRelearn?a.input||"":c.drafts?.[k]||"";
  const state=done?(bad?"재학습 완료":"완료"):(inRelearn?"오답 확인 중":"미완료");
  return `<article class="card ${done?(bad?"bad":"ok"):""} ${k===active?"activeQuestion":""}" data-k="${k}">
    <div class="cardNum">DAY ${w.day} · ${w.no}번 · ${state}</div><div class="wordBadges">${wordTags(k,c)}</div>
    <div class="english">${esc(w.english)}</div>
    <label class="srOnly" for="answer-${w.day}-${w.no}">단어 ${esc(w.english)}의 한글 뜻을 백강 고시체로 쓰세요</label>
    <input id="answer-${w.day}-${w.no}" class="scribble" data-in lang="ko" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      placeholder="여기에 한글로 쓰기" ${done||inRelearn?"disabled":""} value="${esc(inputValue)}">
    <div class="recognized" data-rec>인식: <b>${esc(inputValue)||"-"}</b></div>
    <div class="actions"><button class="secondary" type="button" data-clear ${done||inRelearn?"disabled":""}>지우기</button><button type="button" class="primary" data-sub ${done||inRelearn?"disabled":""}>제출</button></div>
    <div data-fb>${bad?relearn(w,a):""}</div>
  </article>`;
}

function relearn(w,a){
  if(a.relearnDone)return `<div class="answer answerMini"><span>정답</span><b>${esc(w.answer)}</b><p>재학습 완료 · 당일 오답 재시험에 다시 나옵니다.</p></div>`;
  return `<div class="relearnPanel">
    <div class="answer"><span>정답 확인</span><b>${esc(w.answer)}</b><p>연한 글자를 따라 쓰고, 오른쪽에 한글 뜻을 직접 다시 쓰세요.</p></div>
    <div class="traceWrap">
      <div class="relearnCell">
        <div class="relearnCellTitle">① 따라쓰기</div>
        <div class="traceBox"><div class="traceText">${esc(w.answer)}</div><canvas class="trace" data-trace aria-label="정답 따라쓰기"></canvas></div>
        <div class="actions"><button type="button" class="secondary" data-tclear>지우기</button><button type="button" class="secondary" data-tdone>따라쓰기 완료</button></div>
      </div>
      <div class="relearnCell">
        <div class="relearnCellTitle">② 직접 다시쓰기</div>
        <label class="srOnly" for="retry-${w.day}-${w.no}">정답을 다시 쓰세요</label>
        <input id="retry-${w.day}-${w.no}" class="scribble" data-re lang="ko" inputmode="text" enterkeyhint="done" placeholder="정답을 다시 쓰세요" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <div class="recognized" data-rerec>재인식: <b>-</b></div>
        <div class="actions"><button type="button" class="secondary" data-rclear>지우기</button><button type="button" class="good" data-rsub disabled>재확인</button></div>
      </div>
    </div>
  </div>`;
}

function bind(k,c){
  let el=document.querySelector('[data-k="'+CSS.escape(k)+'"]'),inp=el.querySelector("[data-in]"),rec=el.querySelector("[data-rec] b");
  if(inp){
    const drafts=c.drafts||(c.drafts={});
    inp.oninput=()=>{rec.textContent=inp.value||"-";drafts[k]=inp.value;save()};
    el.querySelector("[data-clear]").onclick=()=>{inp.value="";rec.textContent="-";delete drafts[k];save();inp.focus()};
    el.querySelector("[data-sub]").onclick=()=>submit(k,inp.value,c);
  }
  if(el.querySelector("[data-trace]"))bindRelearn(k,c,el);
}

function attempt(w,input,result,ctx){let s=st.stats[key(w)]||(st.stats[key(w)]={wrong:0,correct:0,lastWrong:"",attempts:[]});s.attempts.push({at:Date.now(),input,result,ctx});if(result==="wrong"){s.wrong++;s.lastWrong=input}else s.correct++}
function submit(k,input,c){let w=byKey(k),v=norm(input),token=c.phase+":"+c.round+":"+c.step;if(!w||st.current!==c||c.answers[k]?.token===token||!v)return;if(c.drafts)delete c.drafts[k];let ok=v===norm(w.answer);c.answers[k]={input:v,result:ok?"correct":"wrong",status:ok?"done":"relearn",relearnDone:ok,token};attempt(w,v,ok?"correct":"wrong",c.phase);if(!ok){if(!c.everWrong.includes(k))c.everWrong.push(k);if(!c.roundWrong.includes(k))c.roundWrong.push(k)}save();session()}
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
function finish(){
  pauseActiveTimers();setStudentInside(true);st.activeMode="evaluation";
  const c=st.current,wrong=[...new Set(c.everWrong)],today=localDate(),plan=st.reviewPlan||(st.reviewPlan={});
  for(const k of c.wordKeys){
    const previous=plan[k]||{stage:0};
    const wasWrong=wrong.includes(k),nextStage=wasWrong?0:Math.min(3,(previous.stage||0)+1);
    const interval=wasWrong?1:([0,3,7,14][nextStage]||14);
    plan[k]={due:plusDays(today,interval),last:today,stage:nextStage};
  }
  const h={id:c.id,date:today,type:c.type,bookDay:c.bookDay||null,
    total:c.wordKeys.length,wordKeys:[...c.wordKeys],reviewedPriorKeys:c.dueKeys||[],
    everWrong:wrong,wrongCount:wrong.length,retryRounds:c.round};
  st.history.push(h);
  if(c.type==="new")st.nextDay=Math.max(1,c.bookDay-1);
  st.sessionNo++;c.done=true;save();
  const emptyReview=c.type==="review"&&!c.wordKeys.length;
  const score=emptyReview?"오답 없음":(c.wordKeys.length-wrong.length)+"/"+c.wordKeys.length;
  const desc=emptyReview?"오늘 다시 볼 오답이 없습니다.":"정답을 다시 떠올렸습니다. 틀렸던 단어는 다음 학습일에 다시 확인합니다.";
  app.innerHTML=`<section class="complete" aria-label="평가 완료">
    <div class="completeSymbol" aria-hidden="true">✓</div>
    <h1>${c.type==="review"?"오늘 복습 평가 완료!":"오늘 평가 완료!"}</h1>
    <p>${desc}</p><div class="score">${score}</div>
    <div class="scoreCaption">첫 평가 기준 · 다시 볼 단어 ${wrong.length}개</div>
    <p class="finishSchedule">틀린 단어는 다음 학습일, 맞힌 단어는 3일·7일 간격으로 확인합니다.</p>
    <button type="button" class="primary completeButton" id="home">오늘 화면으로 <span aria-hidden="true">→</span></button>
  </section>`;
  document.getElementById("home").onclick=()=>{st.current=null;save();home()};
}

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
  // Schema 1 remains backward-compatible; optional v0.2.0 fields must also be checked.
  if(s.activeMode!==undefined&&s.activeMode!==null&&!["home","study","evaluation","studyDone"].includes(s.activeMode))throw Error("학습 또는 평가 화면 기록이 잘못되었습니다.");
  if(s.study!==null&&s.study!==undefined){
    const z=s.study;
    if(!object(z)||!Array.isArray(z.keys)||z.keys.length>2100||!z.keys.every(keyOK)||
       !Number.isInteger(z.index)||z.index<0||z.index>z.keys.length||
       !Number.isInteger(z.day)||z.day<1||z.day>50)throw Error("학습 이어하기 기록이 올바르지 않습니다.");
  }
  if(s.reviewPlan!==undefined){
    if(!object(s.reviewPlan)||Object.keys(s.reviewPlan).length>2000)throw Error("복습 일정 구조가 올바르지 않습니다.");
    for(const [k,p] of Object.entries(s.reviewPlan)){
      if(!keyOK(k)||!object(p)||typeof p.due!=="string"||!/^20\d\d-\d\d-\d\d$/.test(p.due)||
         typeof p.last!=="string"||!/^20\d\d-\d\d-\d\d$/.test(p.last)||
         !Number.isInteger(p.stage)||p.stage<0||p.stage>3)throw Error("단어별 복습 일정이 올바르지 않습니다.");
    }
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
async function importPersonalWords(input){
  const file=input.files?.[0];if(!file)return;
  try{
    if(file.size>2*1024*1024)throw Error("단어 파일이 너무 큽니다(2MB 초과).");
    const added=window.PERSONAL_WORDS.importPack(JSON.parse(await file.text()));
    admin();document.getElementById("wordFileMsg").textContent="개인 단어 등록 완료 · DAY "+added.sort((a,b)=>a-b).join("·");
  }catch(e){document.getElementById("wordFileMsg").textContent="등록 실패: "+e.message}
  finally{input.value=""}
}
function exportPersonalWords(){
  const msg=document.getElementById("wordFileMsg");
  try{
    const pack=window.PERSONAL_WORDS?.exportPack();if(!pack)throw Error("추가한 개인 단어 파일이 없습니다.");
    const blob=new Blob([JSON.stringify(pack,null,2)],{type:"application/json;charset=utf-8"});
    const uri=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=uri;a.download="wm2000-personal-words.json";document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(uri),3000);msg.textContent="개인 단어 파일을 저장했습니다.";
  }catch(e){msg.textContent="저장 실패: "+e.message}
}
function admin(){let hist=[...st.history].reverse(),stats=Object.entries(st.stats).map(([k,v])=>({k,...v,w:byKey(k)})).filter(x=>x.w).sort((a,b)=>b.wrong-a.wrong),tw=stats.reduce((a,x)=>a+x.wrong,0);app.innerHTML=`<section class="panel dayAdmin"><h1>학습 DAY 직접 설정</h1>
 <p class="muted">보호자가 DAY 번호를 직접 입력합니다. 기존 기록은 지우지 않습니다.</p>
 <div class="row"><label for="manualDay">DAY 번호</label><input id="manualDay" type="number" min="1" max="50" step="1" value="${st.nextDay}" inputmode="numeric"><button class="primary" id="applyManualDay" type="button">DAY 적용</button></div>
 <p class="small" id="dayMessage" role="status">등록된 교재 데이터: DAY ${registeredDays()} / 전체 50 DAY 중 ${DATA.days.length}개</p>
 </section><section class="panel"><h2>개인 단어 파일</h2><p class="muted">검증한 DAY 1~48 파일을 이 기기에 추가합니다. 학습기록과 기존 단어는 유지됩니다.</p><div class="row"><button class="secondary" id="importWords">단어 파일 불러오기 (.json)</button><button class="secondary" id="exportWords">개인 단어 파일 저장</button><input id="wordFile" type="file" accept=".json,application/json" hidden></div><p class="small" id="wordFileMsg" role="status" aria-live="polite">${esc(window.PERSONAL_WORDS?.error||"파일은 이 브라우저에만 저장됩니다. 기기를 바꿀 때 단어 파일도 함께 가져오세요.")}</p></section><section class="panel"><h1>관리자 대시보드</h1><p class="muted">이 기기의 localStorage에만 저장됩니다.</p></section><div class="metrics" style="margin-top:13px"><div class="metric"><small>완료 세션</small><b>${hist.length}</b></div><div class="metric"><small>누적 오답</small><b>${tw}</b></div><div class="metric"><small>오답 단어</small><b>${stats.filter(x=>x.wrong).length}</b></div><div class="metric"><small>다음 신규 DAY</small><b>${st.nextDay}</b></div></div><section class="panel" style="margin-top:13px"><h2>자주 틀린 단어</h2><div class="tableWrap">${stats.filter(x=>x.wrong).length?`<table class="table"><thead><tr><th>영어</th><th>정답</th><th>오답 횟수</th><th>최근 잘못 입력</th><th>다음 복습 예정</th></tr></thead><tbody>${stats.filter(x=>x.wrong).slice(0,30).map(x=>`<tr><td><b>${esc(x.w.english)}</b></td><td>${esc(x.w.answer)}</td><td>${x.wrong}</td><td>${esc(x.lastWrong||"-")}</td><td>${esc(st.reviewPlan?.[x.k]?.due||"미예약")}</td></tr>`).join("")}</tbody></table>`:"아직 오답이 없습니다."}</div></section><section class="panel" style="margin-top:13px"><h2>세션 기록</h2><div class="tableWrap">${hist.length?`<table class="table"><thead><tr><th>날짜</th><th>구분</th><th>범위</th><th>첫 평가</th><th>오답</th></tr></thead><tbody>${hist.map(h=>`<tr><td>${h.date}</td><td>${h.type==="review"?"복습":"신규"}</td><td>${h.type==="review"?"오답만":"DAY "+h.bookDay}</td><td>${h.total-h.wrongCount}/${h.total}</td><td>${h.wrongCount}</td></tr>`).join("")}</tbody></table>`:"완료 기록이 없습니다."}</div></section><section class="panel" style="margin-top:13px"><h2>학습기록 백업 · 복원</h2><p class="muted">기록은 이 기기의 브라우저에만 저장됩니다. 기기 변경이나 데이터 삭제 전에 백업 파일을 보관하세요. 개인 단어 파일은 별도로 저장하고, 새 기기에서 단어 파일을 먼저 불러온 후 학습기록을 복원하세요.</p><div class="row"><button class="secondary" id="exportBackup">백업 파일 저장 (.json)</button><button class="secondary" id="importBackup">백업 파일 복원</button><input id="restoreBackup" type="file" accept=".json,application/json" hidden></div><p id="backupMsg" role="status" class="small" aria-live="polite"></p></section><section class="panel" style="margin-top:13px"><button class="danger" id="reset">전체 기록 초기화</button></section>`;document.getElementById("applyManualDay").onclick=()=>{const n=Number(document.getElementById("manualDay").value),msg=document.getElementById("dayMessage");if(!Number.isInteger(n)||n<1||n>50){msg.textContent="DAY 1~50의 정수를 입력하세요.";return}if(!day(n)){msg.textContent="DAY "+n+" 데이터는 아직 없습니다. 등록된 DAY "+registeredDays()+" 중에서 선택하거나 개인 단어 파일을 불러오세요.";return}if((st.current&&!st.current.done)||(st.study&&!st.study.done)){msg.textContent="진행 중인 학습을 먼저 완료한 뒤 DAY를 바꾸세요.";return}st.nextDay=n;save();admin()};document.getElementById("importWords").onclick=()=>document.getElementById("wordFile").click();document.getElementById("wordFile").onchange=e=>importPersonalWords(e.target);document.getElementById("exportWords").onclick=exportPersonalWords;document.getElementById("exportBackup").onclick=backupRecords;document.getElementById("importBackup").onclick=()=>document.getElementById("restoreBackup").click();document.getElementById("restoreBackup").onchange=e=>restoreRecords(e.target);document.getElementById("reset").onclick=()=>{if(confirm("전체 기록을 삭제할까요?")){st=base();save();admin()}}}
// The first screen after every browser navigation/reload is ALWAYS the two-choice hero.
// Never discard st.study, st.current, history, stats, or the absolute assessment clock.
// User explicitly selects learning or evaluation to resume their saved activity.
home();})();

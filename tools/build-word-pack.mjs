import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const runtimePath=fileURLToPath(new URL('../data/personal-words.js',import.meta.url));
function rules(){
  const window={WORD_DATA:{days:[]},WORD_LEARNING:{}};
  vm.runInNewContext(fs.readFileSync(runtimePath,'utf8'),{window,localStorage:{getItem:()=>null}});
  return window.PERSONAL_WORDS;
}
export function extractWords(html){
  const declaration=/\bconst\s+WORDS\s*=\s*/g.exec(html);
  if(!declaration)throw Error('const WORDS JSON array not found');
  const start=declaration.index+declaration[0].length;
  if(html[start]!=='[')throw Error('WORDS must be a JSON array, not executable JavaScript');
  let depth=0,inString=false,escaped=false,end=-1;
  for(let i=start;i<html.length;i++){
    const c=html[i];
    if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue}
    if(c==='"'){inString=true;continue}
    if(c==='[')depth++;
    if(c===']'&&--depth===0){end=i+1;break}
  }
  if(end<0)throw Error('Unterminated WORDS array');
  const rows=JSON.parse(html.slice(start,end));
  if(rows.length!==2000)throw Error('Expected exactly 2000 original rows');
  rows.forEach((r,i)=>{
    if(!Array.isArray(r)||r.length!==5||r[0]!==i+1||typeof r[3]!=='string'||!r[3].trim()||typeof r[4]!=='string'||!r[4].trim())throw Error('Invalid original row / sequential ID '+(i+1));
  });
  return rows;
}
export function buildPack({htmlBytes,pdfBytes,review,learning}){
  if(!review||review.format!=='wm2000-source-review'||review.schema!==1||!Number.isInteger(review.day)||review.day<1||review.day>48||review.pdfPage!==review.day||!review.reviewer||!review.reviewedAt||review.visuallyReviewed!==true||review.htmlSha256!==sha(htmlBytes)||review.pdfSha256!==sha(pdfBytes))throw Error('Missing visual review, source hashes, reviewer, or DAY/page confirmation');
  if(!Array.isArray(review.entries)||review.entries.length!==40)throw Error('Visual review must contain 40 numbered entries');
  const rows=extractWords(htmlBytes.toString('utf8')),day=review.day,policy=rules();
  const words=rows.slice((day-1)*40,day*40).map((r,i)=>{
    const e=review.entries[i],first=policy.firstMeaning(r[4]);
    if(e.no!==i+1||e.english!==r[3]||e.pdfFirstMeaning!==first||e.checked!==true)throw Error('PDF/HTML mismatch or unreviewed entry at DAY '+day+' / '+(i+1));
    return {day,no:i+1,english:r[3],answer:policy.gradingAnswer(first),sourceFirstMeaning:first,sourceFullMeaning:r[4],sourceOrdinal:r[0]};
  });
  const pack=JSON.parse(JSON.stringify(policy.validate({format:'wm2000-personal-words',schema:1,days:[{day,words}],learning:{['day'+day]:learning}})));
  pack.validation={status:'html-pdf-visual-reviewed',day,count:40,htmlSha256:sha(htmlBytes),pdfSha256:sha(pdfBytes),reviewSha256:sha(JSON.stringify(review)),reviewer:review.reviewer,reviewedAt:review.reviewedAt,pdfPage:review.pdfPage};
  pack.publication={status:'permission-unconfirmed',scope:'personal-device'};
  const audit={...pack.validation,publication:pack.publication,sourceOrdinalRange:[words[0].sourceOrdinal,words.at(-1).sourceOrdinal],entries:words.map(w=>({...w,pdfFirstMeaning:review.entries[w.no-1].pdfFirstMeaning,status:'PASS'}))};
  return {pack,audit};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2),options={};
    for(let i=0;i<args.length;i+=2){if(!args[i]?.startsWith('--')||!args[i+1])throw Error('Use --html FILE --pdf FILE --review FILE --learning FILE --output DIR');options[args[i].slice(2)]=args[i+1]}
    for(const n of ['html','pdf','review','learning'])if(!options[n])throw Error('Missing --'+n);
    const review=JSON.parse(fs.readFileSync(options.review,'utf8'));
    const {pack,audit}=buildPack({htmlBytes:fs.readFileSync(options.html),pdfBytes:fs.readFileSync(options.pdf),review,learning:JSON.parse(fs.readFileSync(options.learning,'utf8'))});
    const output=options.output||'.private';fs.mkdirSync(output,{recursive:true});
    fs.writeFileSync(path.join(output,'DAY'+review.day+'_personal.json'),JSON.stringify(pack,null,2)+'\n');
    fs.writeFileSync(path.join(output,'DAY'+review.day+'_audit.json'),JSON.stringify(audit,null,2)+'\n');
    console.log('PASS: DAY '+review.day+' / 40 ordered spellings and first meanings / personal files written to '+output);
  }catch(e){console.error(e.message);process.exitCode=1}
}

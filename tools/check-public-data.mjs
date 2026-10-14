// No new textbook word DAY may enter public Git or Pages without a permission review.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const tracked=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n');
for(const file of tracked){
  if(/^data\/(?:learning-)?day(\d+)\./.test(file)&&Number(file.match(/day(\d+)/)[1])<49)throw Error('Unapproved public textbook DAY: '+file);
  if(/(?:^|\/)(?:\.private|sources)\//.test(file)||/DAY\d+_(?:personal|audit|review|page)\.(?:json|png)$/.test(file)||/\.(?:pdf|zip)$/i.test(file))throw Error('Private source/artifact must not enter public Git: '+file);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())continue;
  const body=fs.readFileSync(file,'utf8');
  if(file!=='data/personal-words.js'&&file!=='tools/build-word-pack.mjs'&&file!=='tests/personal-words.mjs'&&/"format"\s*:\s*"wm2000-personal-words"/.test(body))throw Error('Serialized private word pack in public source: '+file);
  if(/\bconst\s+WORDS\s*=\s*\[/.test(body))throw Error('Original textbook HTML must not enter public Git: '+file);
}
console.log('PASS public package: no new textbook DAY files, source PDFs, or private JSON packs');

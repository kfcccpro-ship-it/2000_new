import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {spawn,spawnSync} from "node:child_process";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const screenshotDir=path.join(root,"tests","screenshots");
fs.mkdirSync(screenshotDir,{recursive:true});
const bin=["google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .find(n=>spawnSync("which",[n],{encoding:"utf8"}).status===0);
if(!bin)throw new Error("Chromium/Chrome not found on GitHub runner. Browser QA is required, not silently skipped.");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"};
const server=http.createServer((req,res)=>{
  let uri=decodeURIComponent(new URL(req.url||"/","http://localhost").pathname);
  let file=path.resolve(root,"."+uri);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end("Forbidden");return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end("Not found");return}
    res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(data);
  });
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const launch=(size,uri,extra=[])=>new Promise((resolve,reject)=>{
  const args=["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
    "--disable-extensions","--disable-background-networking","--hide-scrollbars",
    "--no-first-run","--no-default-browser-check","--window-size="+size,
    "--user-data-dir=/tmp/wm2000-chromium-"+process.pid+"-"+size.replaceAll(",","-"),...extra,base+uri];
  const child=spawn(bin,args,{stdio:["ignore","pipe","pipe"]});
  let stdout="",stderr="";
  const safety=setTimeout(()=>{child.kill("SIGKILL");reject(new Error("Chrome browser QA exceeded 70s"))},70000);
  child.stdout.on("data",v=>stdout+=v.toString());
  child.stderr.on("data",v=>stderr+=v.toString().slice(0,1500));
  child.on("error",e=>{clearTimeout(safety);reject(e)});
  child.on("close",code=>{
    clearTimeout(safety);
    if(code!==0)reject(Error("Chromium exit "+code+" "+stderr.slice(-900)));
    else resolve(stdout);
  });
});
try{
  for(const [name,size] of [["ipad-pro-10-landscape","1112,834"],["ipad-air-13-landscape","1366,1024"]]){
    const output=await launch(size,"/tests/browser-ipad-qa.html",["--virtual-time-budget=23000","--dump-dom"]);
    if(!/<body[^>]*data-e2e-status="passed"/i.test(output)){
      const reason=output.match(/<div id="report">([^<]{0,450})/i)?.[1]||"missing passed status";
      throw Error(name+" browser interaction FAILED: "+reason);
    }
    console.log("PASS actual Chromium DOM / "+name+" / "+size);
    const png=path.join(screenshotDir,name+".png");
    await launch(size,"/index.html",["--virtual-time-budget=1300","--screenshot="+png]);
    if(!fs.existsSync(png)||fs.statSync(png).size<1000)throw Error("screenshot missing for "+name);
    console.log("PASS screenshot "+path.relative(root,png)+" ("+fs.statSync(png).size+" bytes)");
  }
}finally{
  await new Promise(resolve=>server.close(resolve));
}
console.log("PASS browser e2e: DAY49, progressive lesson, 40 exact answers, drafts, due origin, 15s clock persistence, iPad viewports");

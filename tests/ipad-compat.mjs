import fs from "node:fs";
const css=fs.readFileSync("styles.css","utf8");
const app=fs.readFileSync("app.js","utf8");
const html=fs.readFileSync("index.html","utf8");

for(const s of ["v0.2.1</title>","viewport-fit=cover"]) if(!html.includes(s)) throw new Error("html compatibility missing: "+s);
for(const s of ["safe-area-inset-top","safe-area-inset-bottom","min-width:1180px","repeat(4,minmax(0,1fr))",".scribble{width:100%;min-height:72px"]) if(!css.includes(s)) throw new Error("css compatibility missing: "+s);
for(const s of ["function deviceProfile","function setupDeviceCompat","visualViewport","orientationchange","getCoalescedEvents","ResizeObserver","pointerType===\"touch\"","lang=\"ko\" inputmode=\"text\" enterkeyhint=\"done\""]) if(!app.includes(s)) throw new Error("app compatibility missing: "+s);
console.log("PASS iPad Pro 10.5 + iPad Air 13 M4 responsive/Pencil compatibility");

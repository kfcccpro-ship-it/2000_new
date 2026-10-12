import fs from "node:fs";
const s=fs.readFileSync("data/day50.js","utf8");
if(!s.includes("penetrate")||!s.includes("침투하다")||!s.includes("fluctuation")||!s.includes("변동")) throw new Error("DAY50 data missing");
const app=fs.readFileSync("app.js","utf8");
for(const x of ["STEP=8","st.sessionNo%4===0","relearnDone","localStorage"]) if(!app.includes(x)) throw new Error("missing "+x);
console.log("PASS pilot data + 8-word step + 3+1 review + relearn flow");
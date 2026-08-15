const secret=process.env.IMPULSIONANDO_WEBHOOK_SECRET||"";
const enabled=process.env.COLORS_AUTOMATION_ENABLED!=="false";
const intervalMs=Math.max(30000,Number(process.env.COLORS_AUTOMATION_INTERVAL_MS||60000));
const endpoint=process.env.COLORS_AUTOMATION_TICK_URL||"http://127.0.0.1:3000/api/internal/colors/automation-tick";
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

async function tick(){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{
    const response=await fetch(endpoint,{method:"POST",headers:{"x-core-secret":secret,"content-type":"application/json"},body:"{}",signal:controller.signal});
    const text=await response.text().catch(()=>"");
    if(!response.ok)throw new Error(`HTTP ${response.status}: ${text.slice(0,400)}`);
    let result=null;try{result=JSON.parse(text);}catch{result={raw:text.slice(0,400)}};
    console.log("[Colors Automation] tick",JSON.stringify(result));
  }finally{clearTimeout(timer);}
}

async function main(){
  if(!enabled){console.log("[Colors Automation] disabled");return;}
  if(!secret){console.error("[Colors Automation] disabled: IMPULSIONANDO_WEBHOOK_SECRET missing");return;}
  console.log(`[Colors Automation] started interval=${intervalMs}ms`);
  await sleep(15000);
  while(true){try{await tick();}catch(error){console.error("[Colors Automation] tick failed:",error?.message||error);}await sleep(intervalMs);}
}

main().catch(error=>{console.error("[Colors Automation] fatal:",error);process.exitCode=1;});

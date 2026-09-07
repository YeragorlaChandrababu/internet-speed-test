const $=id=>document.getElementById(id);
const start=$('start'),speed=$('speed'),status=$('status'),progress=$('progress'),ping=$('ping'),download=$('download'),upload=$('upload'),network=$('network'),connection=$('connection'),gauge=document.querySelector('.gauge');
const DOWN='https://speed.cloudflare.com/__down?bytes=';
const UP='https://speed.cloudflare.com/__up?cache=';

function setSpeed(v){const n=Math.max(0,Number(v)||0);speed.textContent=n.toFixed(n<10?1:0);gauge.style.setProperty('--deg',`${Math.min(360,n/1000*360)}deg`)}
function rand(){return Math.random().toString(36).slice(2)}

async function latency(){const samples=[];for(let i=0;i<5;i++){const t=performance.now();try{const r=await fetch(DOWN+'1&cache='+rand(),{cache:'no-store'});if(r.ok)samples.push(performance.now()-t)}catch{}}if(!samples.length)return null;samples.sort((a,b)=>a-b);return Math.round(samples[Math.floor(samples.length/2)])}

async function downloadTest(){
  const size=10000000, workers=3, end=performance.now()+6500;let total=0;
  const run=async()=>{while(performance.now()<end){const t=performance.now();try{const r=await fetch(DOWN+size+'&cache='+rand(),{cache:'no-store'});const b=await r.arrayBuffer();const sec=(performance.now()-t)/1000;total+=b.byteLength;const instant=b.byteLength*8/sec/1e6;if(instant>0)setSpeed(instant)}catch{break}}};
  await Promise.all(Array.from({length:workers},run));
  return total?total*8/((6500)/1000)/1e6:null;
}

async function uploadTest(){
  const size=2000000, payload=new Uint8Array(size), workers=2, duration=5500, started=performance.now();let total=0;
  const run=async()=>{while(performance.now()-started<duration){try{const t=performance.now();const r=await fetch(UP+rand(),{method:'POST',body:payload,cache:'no-store',keepalive:false});if(r.ok){const sec=(performance.now()-t)/1000;total+=size;const instant=size*8/sec/1e6;if(instant>0)setSpeed(instant)}}catch{break}}};
  await Promise.all(Array.from({length:workers},run));
  return total?total*8/((performance.now()-started)/1000)/1e6:null;
}

function detectNetwork(){
  const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  network.textContent=c?.type?({wifi:'Wi‑Fi',cellular:'Mobile data',ethernet:'Ethernet',bluetooth:'Bluetooth',none:'Offline'}[c.type]||c.type):'Not exposed by browser';
  const parts=[];if(c?.effectiveType)parts.push(c.effectiveType.toUpperCase());if(typeof c?.downlink==='number'&&c.downlink>0)parts.push(`~${c.downlink} Mbps`);connection.textContent=parts.length?parts.join(' · '):'Browser API unavailable';
}

start.onclick=async()=>{if(!navigator.onLine){status.textContent='No internet connection';return}start.disabled=true;ping.textContent='…';download.textContent='…';upload.textContent='…';progress.style.width='3%';setSpeed(0);status.textContent='Finding latency…';const p=await latency();ping.textContent=p??'—';progress.style.width='18%';status.textContent='Measuring download…';const d=await downloadTest();download.textContent=d?d.toFixed(1):'—';progress.style.width='62%';status.textContent='Measuring upload…';const u=await uploadTest();upload.textContent=u?u.toFixed(1):'—';progress.style.width='100%';setSpeed(d||u||0);status.textContent='Test complete';detectNetwork();start.disabled=false};
$('theme').onclick=()=>document.documentElement.classList.toggle('light');
detectNetwork();

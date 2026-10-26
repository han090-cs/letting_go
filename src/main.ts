
import './styles.css';

import {ABOUT,LANGS,text,type Lang,type Extra} from './i18n';
import {chunkText,fontFor,hasMyanmar,isCrisis,looksZawgyi,wrapWish} from './lib/text';

type ReleaseMode = 'fire'|'water'|'wind';



const $ = <T extends HTMLElement = HTMLElement>(id:string) => document.getElementById(id) as T;
const app=$('app'), choose=$('choose'), care=$('care'), about=$('about'), wishPanel=$('wish');
const canvas=$<HTMLCanvasElement>('world');
const ctx=canvas.getContext('2d',{alpha:true})!;
const input=$<HTMLTextAreaElement>('thoughtInput');
const form=$<HTMLFormElement>('releaseForm');
const wipeBtn=$<HTMLButtonElement>('wipeBtn');
const language=$<HTMLSelectElement>('language');
const fontsReady=(async()=>{try{await Promise.all([document.fonts.load('500 16px "Noto Sans Myanmar"','က'),document.fonts.load('600 16px "Noto Sans Myanmar"','က')])}catch{/* system font will do */}})();
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=matchMedia('(pointer: fine)').matches;
const hintEl=document.getElementById('hint') as HTMLElement;
const set=(id:string,s:string)=>{$(id).textContent=s};

type Stage='start'|'writing'|'choose'|'release'|'rest'|'wish';
let stage:Stage='start';
let lang:Lang='en';
let dpr=Math.min(devicePixelRatio||1,2);
let width=innerWidth,height=innerHeight;
const store={
  get(k:string){try{return localStorage.getItem('lg.'+k)}catch{return null}},
  set(k:string,v:string){try{localStorage.setItem('lg.'+k,v)}catch{/* private mode: fine */}}
};
// Only one harmless preference is remembered: the language. Never what you write.
try{localStorage.removeItem('lg.muted')}catch{/* ignore */}
const t=()=>text(lang);
const live=$('live');
const say=(m:string)=>{live.textContent='';setTimeout(()=>{live.textContent=m},30)};
let gravityX=0,gravityY=.72;
let releaseStarted=false;
let floorPad=48;

interface Body{
  text:string;font:string;x:number;y:number;vx:number;vy:number;angle:number;va:number;w:number;h:number;
  fx:boolean;seed:number;born:number;alpha:number;state:'live'|'released';mode:ReleaseMode|null;t0:number;dur:number;dir:number;dead:boolean;
}
interface Particle{x:number;y:number;vx:number;vy:number;life:number;size:number;delay:number;type:ReleaseMode;kind:'spark'|'smoke'|'bubble'|'ripple'|'dust'}
const bodies:Body[]=[];
const particles:Particle[]=[];

/* ---------- stages ---------- */
function setStage(s:Stage){
  stage=s;app.dataset.stage=s;
  input.placeholder=s==='start'?t().placeholder:t().more;
  document.querySelectorAll<HTMLElement>('[data-show]').forEach(el=>{
    const on=el.dataset.show!.split(' ').includes(s);
    el.classList.toggle('on',on);el.toggleAttribute('inert',!on);
  });
  updateFloor();
}
// Keeps the pile of words above whatever controls are on screen.
function updateFloor(){
  floorPad=stage==='choose'?choose.offsetHeight+36:stage==='writing'?form.offsetHeight+hintEl.offsetHeight+54:48;
}

function resize(){
  const vv=window.visualViewport;
  if(vv){app.style.top=`${vv.offsetTop}px`;app.style.height=`${vv.height}px`}
  width=app.clientWidth||innerWidth;height=app.clientHeight||innerHeight;
  app.classList.toggle('short',height<640);   // keyboard open or small screen: slim down the wish panel so the lantern stays big
  dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);
  canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);updateFloor();
}
addEventListener('resize',resize);
window.visualViewport?.addEventListener('resize',resize);
window.visualViewport?.addEventListener('scroll',resize);
resize();

/* text segmentation, crisis and Zawgyi checks live in ./lib/text.ts (unit-tested) */

let tiltAsked=false;
function onTilt(e:DeviceOrientationEvent){
  if(e.gamma==null||e.beta==null||innerWidth>innerHeight)return;
  gravityX+=(Math.max(-.75,Math.min(.75,e.gamma/45))-gravityX)*.1;
  gravityY+=(Math.max(.15,Math.min(1.15,e.beta/75))-gravityY)*.1;
}
const listenTilt=()=>addEventListener('deviceorientation',onTilt,{passive:true});
function askTilt(){
  if(tiltAsked||finePointer)return;tiltAsked=true;   // desktop never listens: no sensor, no browser warning
  try{   // iOS asks for motion permission; other browsers (or none at all) simply skip this
    if(typeof DeviceOrientationEvent==='undefined')return;
    const D=DeviceOrientationEvent as unknown as {requestPermission?:()=>Promise<string>};
    if(typeof D.requestPermission==='function')D.requestPermission().then(r=>{if(r==='granted')listenTilt()}).catch(()=>{});
    else listenTilt();
  }catch{/* tilt is optional */}
}

async function spawn(raw:string){
  const text=raw.trim();if(!text)return;
  input.value='';autosize();            // clear first so a double Enter can't add it twice
  askTilt();
  if(hasMyanmar(text))await fontsReady;  // measure Burmese with the real font
  const pieces=chunkText(text);if(!pieces.length)return;
  if(isCrisis(text))showCare();else maybeZawgyi(text);
  if(stage==='start'){setStage('writing');say(t().announceAdded)}
  startNudge();
  const now=performance.now(),gap=Math.max(60,Math.min(300,2600/pieces.length));
  pieces.forEach((p,i)=>{
    let size=16;
    const fam=fontFor(p);
    ctx.font=`500 ${size}px ${fam}`;
    let w=ctx.measureText(p).width+22;
    const max=width-32;
    if(w>max){size=Math.max(11,size*max/w);ctx.font=`500 ${size}px ${fam}`;w=Math.min(max,ctx.measureText(p).width+22)}
    const tall=fam.includes('Myanmar')?2.3:1.85;
    bodies.push({
      text:p,font:`500 ${size}px ${fam}`,x:width/2+(Math.random()-.5)*Math.min(160,width*.4),y:Math.max(96,height*.16),
      vx:(Math.random()-.5)*1.2,vy:Math.random()*1.2,angle:(Math.random()-.5)*.16,va:(Math.random()-.5)*.02,
      w,h:size*tall,fx:false,seed:Math.random()*6,born:now+i*gap,alpha:0,state:'live',mode:null,t0:0,dur:0,dir:1,dead:false
    });
  });
  updateFloor();
}

function autosize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,200)+'px';updateFloor()}

/* ---------- language ---------- */
function applyLanguage(){
  const c=t();
  set('headline',c.headline);set('subhead',c.sub);set('dropLabel',c.drop);$('dropBtn').setAttribute('aria-label',c.drop);
  set('letgoBtn',c.letgo);set('hint',c.tap);set('startQ',c.start);
  document.querySelectorAll<HTMLElement>('.start-chip').forEach(b=>{b.textContent=c[b.dataset.k as keyof Extra]});set('feelQ',c.feel);
  document.querySelectorAll<HTMLElement>('.chip').forEach(ch=>{ch.textContent=c[ch.dataset.k as keyof Extra]});set('chooseQ',c.choose);set('weightQ',c.weight);set('afterQ',c.after);set('breatheBtn',c.breathe);
  $('careClose').setAttribute('aria-label',c.close);$('aboutClose').setAttribute('aria-label',c.close);
  renderScales();
  
  
  set('fireTitle',c.fire);set('fireDesc',c.fireDesc);set('waterTitle',c.water);set('waterDesc',c.waterDesc);
  set('windTitle',c.wind);set('windDesc',c.windDesc);set('grounding',c.done);set('freshBtn',c.again);
  set('careText',careMsg());set('careLink',c.support);
  set('wishNudge',c.wishNudge);document.querySelectorAll<HTMLElement>('.wish-chip').forEach(b=>{b.textContent=c[b.dataset.k as keyof Extra]});set('wishStartLbl',c.wishBtn);set('wishBtnLbl',c.wishBtn);set('wishQ',c.wishQ);set('wishGoLbl',c.wishGo);set('wishDone',c.wishDone);
  $('wishGo').setAttribute('aria-label',c.wishGo);$('wishBack').setAttribute('aria-label',c.close);$('wishInput').setAttribute('placeholder',c.wishPh);$('wishInput').setAttribute('aria-label',c.wishQ);
  input.placeholder=stage==='start'?c.placeholder:c.more;input.setAttribute('aria-label',c.placeholder);
  $('backBtn').setAttribute('aria-label',c.more);
  wipeBtn.title=c.wipe;wipeBtn.setAttribute('aria-label',c.wipe);set('privacyLine',c.privacy);
  renderAbout();
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  updateFloor();
}
language.addEventListener('change',()=>{lang=language.value as Lang;store.set('lang',lang);applyLanguage()});

/* ---------- sentence starters: lower the blank-page barrier ---------- */
const startsBox=$('starts');
for(const k of ['s1','s2','s3'] as const){
  const b=document.createElement('button');
  b.type='button';b.className='start-chip';b.dataset.k=k;
  b.addEventListener('click',()=>{
    input.value=t()[k]+' ';autosize();input.focus();
    input.setSelectionRange(input.value.length,input.value.length);
    startsBox.classList.add('dim');
  });
  startsBox.appendChild(b);
}

/* ---------- name the feeling (affect labeling) — optional; gently suggests a ritual ---------- */
const FEELS:[keyof Extra,ReleaseMode][]=[['angry','fire'],['sad','water'],['anxious','wind'],['tired','wind'],['lonely','water'],['guilty','fire'],['hurt','water'],['overwhelmed','wind']];
const chipsBox=$('chips');
function suggest(m:ReleaseMode|null){document.querySelectorAll<HTMLElement>('.ritual').forEach(r=>r.classList.toggle('suggest',r.dataset.release===m))}
function resetFeeling(){chipsBox.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed','false'));suggest(null)}
for(const [k,m] of FEELS){
  const b=document.createElement('button');
  b.type='button';b.className='chip';b.dataset.k=k;b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>{
    const was=b.getAttribute('aria-pressed')==='true';
    resetFeeling();startsBox.classList.remove('dim');
    if(!was){b.setAttribute('aria-pressed','true');suggest(m)}
  });
  chipsBox.appendChild(b);
}

/* ---------- about: purpose, privacy, how it helps ---------- */
const GITHUB='https://github.com/han090-cs';
// Assembled at runtime so the address is not sitting in the page source as plain text.
const feedbackAddr=()=>['hansis0080','gmail.com'].join('@');
function mailBody(){
  const c=t();
  return `${c.mailHello}\n\n${c.mailPrompt}\n\n\n\n---\n${c.mailInfo}\nVersion: ${__APP_VERSION__}\nLanguage: ${lang}\nScreen: ${innerWidth}x${innerHeight}\nBrowser: ${navigator.userAgent}`;
}
const mailtoHref=()=>`mailto:${feedbackAddr()}?subject=${encodeURIComponent(t().mailSubject)}&body=${encodeURIComponent(mailBody())}`;
const gmailHref=()=>`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(feedbackAddr())}&su=${encodeURIComponent(t().mailSubject)}&body=${encodeURIComponent(mailBody())}`;
async function copyText(v:string){
  try{await navigator.clipboard.writeText(v);return true}catch{
    const ta=document.createElement('textarea');ta.value=v;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
    let ok=false;try{ok=document.execCommand('copy')}catch{/* ignore */}ta.remove();return ok;
  }
}
interface InstallEvent extends Event{prompt:()=>Promise<void>}
let installEvt:InstallEvent|null=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e as InstallEvent;renderAbout()});
addEventListener('appinstalled',()=>{installEvt=null;renderAbout()});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||(navigator as unknown as {standalone?:boolean}).standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

function renderAbout(){
  const a=ABOUT[lang]||ABOUT.en,c=t(),box=$('aboutBody');box.textContent='';
  const add=(tag:string,txt:string,cls=''):HTMLElement=>{const e=document.createElement(tag);e.textContent=txt;if(cls)e.className=cls;box.appendChild(e);return e};
  const link=(txt:string,href:string,cls='btn',ext=true)=>{const l=document.createElement('a');l.textContent=txt;l.href=href;l.className=cls;if(ext){l.target='_blank';l.rel='noopener noreferrer'}return l};
  const btn=(txt:string,fn:()=>void,cls='btn')=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.className=cls;b.addEventListener('click',fn);return b};
  const group=(cls='actions',...kids:HTMLElement[])=>{const d=document.createElement('div');d.className=cls;kids.forEach(k=>d.appendChild(k));box.appendChild(d)};

  add('h2',a.title).id='aboutTitle';
  add('h3',a.purposeT);add('p',a.purpose);add('h3',a.privT);add('p',a.priv);add('h3',a.howT);
  const ol=document.createElement('ol');
  a.how.forEach(x=>{const li=document.createElement('li');li.textContent=x;ol.appendChild(li)});box.appendChild(ol);
  if(lang==='my'){
    add('h3',c.helpT).id='helpHead';add('p',c.helpP);
    const ul=document.createElement('ul');
    for(const [n,u] of MM_HELP){const li=document.createElement('li');li.appendChild(link(n,u,'',true));ul.appendChild(li)}
    box.appendChild(ul);
  }
  add('p',a.note,'note');
  group('actions',link(c.support,'https://findahelpline.com'));

  add('h3',c.feedbackT);add('p',c.feedbackP);
  const copyBtn=btn(c.mailCopy,async()=>{if(await copyText(feedbackAddr())){copyBtn.textContent=c.copied;setTimeout(()=>{copyBtn.textContent=c.mailCopy},1800)}});
  group('actions row',link(c.mailApp,mailtoHref(),'btn primary',false),link(c.mailWeb,gmailHref()),copyBtn);

  if(!isStandalone()&&(installEvt||isIOS())){
    add('h3',c.installT);add('p',installEvt?c.installP:c.installIos);
    if(installEvt)group('actions',btn(c.installBtn,()=>{void installEvt?.prompt()},'btn primary'));
  }

  add('h3',c.creatorT);add('p',c.creatorP);
  group('actions',link('github.com/han090-cs',GITHUB));
  add('p',`${c.version} ${__APP_VERSION__}`,'meta');
  $('aboutBtn').setAttribute('aria-label',a.title);
}
let aboutOpener:HTMLElement|null=null;
function openAbout(){aboutOpener=document.activeElement as HTMLElement|null;about.classList.add('on');about.removeAttribute('inert');$('aboutClose').focus()}
function closeAbout(){about.classList.remove('on');about.setAttribute('inert','');aboutOpener?.focus()}
$('aboutBtn').addEventListener('click',openAbout);
$('aboutClose').addEventListener('click',closeAbout);
about.addEventListener('click',e=>{if(e.target===about)closeAbout()});
addEventListener('keydown',e=>{
  const open=about.classList.contains('on');
  if(e.key==='Escape'){
    if(open)closeAbout();else if(stage==='choose')$('backBtn').click();else if(stage==='wish')leaveWish();
    return;
  }
  if(e.key==='Tab'&&open){   // keep keyboard focus inside the dialog
    const f=[...about.querySelectorAll<HTMLElement>('button,a[href]')].filter(x=>x.offsetParent!==null);
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

/* ---------- care card (local keyword check, nothing leaves the device) ---------- */
const MM_HELP:[string,string][]=[
  ['Counselling Corner','https://www.facebook.com/counsellingcornermyanmar/'],
  ['Serenity Counseling & Mental Health Services','https://www.facebook.com/serenitymentalhealthservice/'],
  ['Citta Consultancy','https://www.facebook.com/Cittaconsultancy/'],
  ['TK Counselling Service','https://www.facebook.com/p/TK-Counselling-Service-100070865586315/'],
  ["Jue Jue's Safe Space",'https://www.facebook.com/JueJuesSafeSpace/'],
  ['Call Me Today','https://www.facebook.com/CallMeToday.Service/'],
  ['Talk With Me','https://www.facebook.com/talkwithmemyanmar/']
];
const ZAW_MSG='ရေးထားတဲ့ စာက Zawgyi စာလုံးပုံစံ ဖြစ်နေပုံရပါတယ်။ ဖုန်းရဲ့ စာလုံးပုံစံ (font) နဲ့ ကီးဘုတ်ကို Unicode သို့ ပြောင်းလိုက်ရင် စာတွေ မှန်မှန်ကန်ကန် ပေါ်လာပါလိမ့်မယ်။';
let careKind:'crisis'|'zawgyi'|'nudge'='crisis',zawShown=false;
const careMsg=(k=careKind)=>k==='crisis'?t().crisis:k==='nudge'?t().nudge:ZAW_MSG;
function maybeZawgyi(v:string){if(!zawShown&&looksZawgyi(v)){zawShown=true;showCare('zawgyi')}}
function showCare(kind:'crisis'|'zawgyi'|'nudge'='crisis'){
  careKind=kind;set('careText',careMsg(kind));
  $('careLink').style.display=kind==='crisis'?'':'none';
  care.classList.add('on');care.removeAttribute('inert');
}
function hideCare(){care.classList.remove('on');care.setAttribute('inert','')}
$('careClose').addEventListener('click',hideCare);
// Burmese UI: open the local support list instead of the global helpline page.
$('careLink').addEventListener('click',e=>{
  if(lang!=='my')return;
  e.preventDefault();hideCare();openAbout();
  document.getElementById('helpHead')?.scrollIntoView({block:'start'});
});

/* ---------- gentle nudge: this is an outlet, not a place to stay ---------- */
let nudgeTimer=0,nudged=false;
function startNudge(){
  if(nudgeTimer||nudged)return;
  const fire=()=>{
    if(care.classList.contains('on')){nudgeTimer=window.setTimeout(fire,60000);return}   // never cover a support message
    nudged=true;nudgeTimer=0;showCare('nudge');
  };
  nudgeTimer=window.setTimeout(fire,12*60*1000);
}

/* ---------- physics ---------- */
function collide(a:Body,b:Body){
  const dx=b.x-a.x,dy=b.y-a.y;
  const minX=(a.w+b.w)*.45,minY=(a.h+b.h)*.48;
  if(Math.abs(dx)<minX&&Math.abs(dy)<minY){
    const ox=minX-Math.abs(dx),oy=minY-Math.abs(dy);
    if(ox<oy){
      const dir=dx<0?-1:1;a.x-=dir*ox*.5;b.x+=dir*ox*.5;
      const imp=(b.vx-a.vx)*.28;a.vx+=imp*dir;b.vx-=imp*dir;
    }else{
      const dir=dy<0?-1:1;a.y-=dir*oy*.5;b.y+=dir*oy*.5;
      const imp=(b.vy-a.vy)*.2;a.vy+=imp*dir;b.vy-=imp*dir;
      a.va+=(Math.random()-.5)*.006;b.va-=(Math.random()-.5)*.006;
    }
  }
}
function physics(dt:number,now:number){
  const k=Math.min(1.8,dt/16.67);
  const live:Body[]=[];
  for(const b of bodies){
    if(b.state!=='live'||now<b.born)continue;
    live.push(b);
    b.alpha=Math.min(1,b.alpha+.035*k);
    if(b===dragging)continue;
    b.vx+=gravityX*.08*k;b.vy+=gravityY*.07*k;
    b.vx*=Math.pow(.994,k);b.vy*=Math.pow(.996,k);
    b.x+=b.vx*k;b.y+=b.vy*k;b.angle+=b.va*k;b.va*=Math.pow(.996,k);
    if(b.x-b.w/2<8){b.x=8+b.w/2;b.vx=Math.abs(b.vx)*.38}
    if(b.x+b.w/2>width-8){b.x=width-8-b.w/2;b.vx=-Math.abs(b.vx)*.38}
    const fy=height-floorPad-b.h/2;
    if(b.y>fy){
      if(b.y-fy>8){b.y-=8*k;b.vy=0}  // floor moved up: glide, don't pop
      else{b.y=fy;b.vy*=-.22;b.vx*=.91;b.va*=.86}
    }
  }
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)collide(live[i],live[j]);
}

/* ---------- drawing ---------- */
let BASE=[63,78,72];const EMBER=[214,130,62],ASH=[176,170,160],COOL=[96,150,172];
const mix=(a:number[],b:number[],k:number)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*k)).join(',')})`;
function paint(b:Body,x:number,y:number,a:number,alpha:number,color:string,scale=1,glow=''){
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(scale,scale);
  ctx.globalAlpha=Math.max(0,Math.min(1,alpha));ctx.font=b.font;ctx.fillStyle=color;
  if(glow){ctx.shadowColor=glow;ctx.shadowBlur=12}
  ctx.fillText(b.text,0,0);ctx.restore();
}
const BURN_H=.62;
function paintBurn(b:Body,x:number,y:number,a:number,q:number,color:string,glow:string){
  const top=-b.h/2,vis=(b.h-b.h*BURN_H)/2+b.h*BURN_H*(1-q);
  ctx.save();ctx.translate(x,y);ctx.rotate(a);
  ctx.beginPath();ctx.rect(-b.w/2-4,top,b.w+8,vis);ctx.clip();
  ctx.font=b.font;ctx.fillStyle=color;ctx.shadowColor=glow;ctx.shadowBlur=10;
  ctx.fillText(b.text,0,0);ctx.restore();
  if(q>0&&q<1){
    ctx.save();ctx.translate(x,y);ctx.rotate(a);
    ctx.fillStyle='rgba(255,176,92,.95)';ctx.shadowColor='rgba(255,140,50,.9)';ctx.shadowBlur=10;
    ctx.fillRect(-b.w/2+2,top+vis-1,b.w-4,2.5);ctx.restore();
  }
}
function emit(p:Pick<Particle,'x'|'y'|'type'|'kind'>&Partial<Particle>){
  if(reduceMotion||particles.length>260)return;
  particles.push({vx:0,vy:0,life:1,size:2,delay:0,...p});
}
function drawReleased(b:Body,now:number,k:number){
  const p=(now-b.t0)/b.dur,sd=b.seed;
  if(p<0){paint(b,b.x,b.y,b.angle,1,mix(BASE,BASE,0));return}
  if(p>=1){b.dead=true;return}
  const e=p*p*(3-2*p);
  if(b.mode==='fire'){
    // heat up -> burn from the bottom edge upward -> embers and smoke
    const heat=Math.min(1,p/.25),q=Math.max(0,Math.min(1,(p-.25)/.55));
    if(q>=1)return;
    const col=q<=0?mix(BASE,EMBER,heat):mix(EMBER,ASH,q);
    const x=b.x+Math.sin(p*40+sd)*(1+heat*1.5),y=b.y-e*14;
    paintBurn(b,x,y,b.angle,q,col,`rgba(214,130,62,${.15+.45*heat*(1-q)})`);
    if(q>0){
      const ex=x+(Math.random()-.5)*b.w,ey=y-b.h/2+(b.h-b.h*BURN_H)/2+b.h*BURN_H*(1-q);
      if(Math.random()<.55*k)emit({x:ex,y:ey,vx:(Math.random()-.5)*.7,vy:-(.5+Math.random()*1.3),life:.8+Math.random()*.5,size:1+Math.random()*1.6,type:'fire',kind:'spark'});
      if(Math.random()<.18*k)emit({x:ex,y:ey-4,vx:(Math.random()-.5)*.3,vy:-(.25+Math.random()*.4),life:1.1,size:4+Math.random()*4,type:'fire',kind:'smoke'});
    }
  }else if(b.mode==='water'){
    // sinks into the water, drifts with the current, ripples and bubbles
    if(!b.fx){
      b.fx=true;emit({x:b.x,y:b.y+b.h*.4,size:4,life:1,type:'water',kind:'ripple'});
      for(let i=0;i<2;i++)emit({x:b.x+(Math.random()-.5)*b.w*.6,y:b.y,vy:-(.3+Math.random()*.5),life:.9,size:2+Math.random()*2.5,type:'water',kind:'bubble'});
    }
    if(Math.random()<.04*k)emit({x:b.x+(Math.random()-.5)*b.w,y:b.y,vx:(Math.random()-.5)*.2,vy:-(.3+Math.random()*.5),life:.9,size:2+Math.random()*2.5,type:'water',kind:'bubble'});
    paint(b,b.x+e*58*b.dir+Math.sin(p*6+sd)*9,b.y+e*30+Math.sin(p*5+sd)*4,b.angle+Math.sin(p*3+sd)*.1,1-Math.pow(p,1.3),mix(BASE,COOL,Math.min(1,p*1.6)));
  }else{
    // lifted by a gust: tumbles away with turbulence, trailing dust streaks
    const x=b.x+e*e*340*b.dir+Math.sin(p*9+sd)*8*e,y=b.y-e*70+Math.sin(p*7+sd)*10*e;
    paint(b,x,y,b.angle+e*(1.2+sd*.15)*b.dir,1-Math.pow(p,1.4),mix(BASE,[140,162,156],p),1-.2*p);
    if(Math.random()<.22*k)emit({x,y,vx:(2.5+Math.random()*2.5)*b.dir,vy:-Math.random()*.4,life:.7,size:1,type:'wind',kind:'dust'});
  }
}
// Whole-screen atmosphere for each ritual: warm glow / rising water / wind streaks.
let fx:{mode:ReleaseMode;t0:number;dur:number}|null=null;
function drawFx(now:number){
  if(!fx)return;
  const p=(now-fx.t0)/fx.dur;
  if(p>=1.15){fx=null;return}
  const bell=Math.sin(Math.PI*Math.max(0,Math.min(1,p)));
  ctx.save();
  if(fx.mode==='fire'){
    const g=ctx.createRadialGradient(width/2,height*.72,0,width/2,height*.72,Math.max(width,height)*.6);
    g.addColorStop(0,`rgba(255,172,96,${.26*bell})`);g.addColorStop(1,'rgba(255,172,96,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  }else if(fx.mode==='water'){
    const t=now*.0015,base=height*.9-bell*70;
    for(let l=0;l<2;l++){
      ctx.beginPath();ctx.moveTo(0,height);
      for(let x=0;x<=width+10;x+=10)ctx.lineTo(x,base+l*14+Math.sin(x*.018+t*(l?-1:1)+l)*(8-l*2));
      ctx.lineTo(width,height);ctx.closePath();
      ctx.fillStyle=`rgba(${l?'150,196,214':'110,166,194'},${(.2-l*.07)*bell})`;ctx.fill();
    }
  }else{
    ctx.strokeStyle='rgb(120,140,134)';ctx.lineWidth=1;ctx.lineCap='round';ctx.globalAlpha=.22*bell;
    for(let i=0;i<12;i++){
      const sp=.35+((i*37)%10)/16,x=((now*sp+i*131)%(width+240))-120,y=height*(((i*53)%100)/100)*.9+30,len=40+(i*29)%60;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y-len*.06);ctx.stroke();
    }
  }
  ctx.restore();
}
function render(now:number,dt:number){
  const k=dt/16.67;
  ctx.clearRect(0,0,width,height);
  ctx.textAlign='center';ctx.textBaseline='middle';
  drawFx(now);drawSky(now);
  for(const b of bodies){
    if(now<b.born)continue;
    if(b.state==='live')paint(b,b.x,b.y,b.angle,b.alpha,mix(BASE,BASE,0));else drawReleased(b,now,k);
  }
  drawLanterns(now);
  for(let i=particles.length-1;i>=0;i--){
    const q=particles[i];
    if(q.delay>0){q.delay-=dt;continue}
    q.x+=q.vx*k;q.y+=q.vy*k;
    q.life-=(q.kind==='smoke'?.006:q.kind==='ripple'?.014:.012)*k;
    if(q.kind==='spark'){q.vy-=.012*k;q.vx+=(Math.random()-.5)*.08}
    else if(q.kind==='smoke')q.size+=.12*k;
    else if(q.kind==='ripple')q.size+=1.1*k;
    if(q.life<=0){particles.splice(i,1);continue}
    const a=Math.min(1,q.life);
    ctx.save();
    if(q.kind==='spark'){
      ctx.fillStyle='#e8934d';ctx.globalAlpha=a*.25;ctx.beginPath();ctx.arc(q.x,q.y,q.size*3,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=a;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();
    }else if(q.kind==='smoke'){
      ctx.fillStyle='rgb(110,106,100)';ctx.globalAlpha=a*.14;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();
    }else if(q.kind==='bubble'){
      ctx.strokeStyle='#7fb0c2';ctx.globalAlpha=a*.7;ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.stroke();
    }else if(q.kind==='ripple'){
      ctx.strokeStyle='#7fb0c2';ctx.globalAlpha=a*.5;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(q.x,q.y,q.size,q.size*.32,0,0,Math.PI*2);ctx.stroke();
    }else{
      ctx.strokeStyle='rgb(120,140,134)';ctx.globalAlpha=a*.5;ctx.lineWidth=1;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x-q.vx*5,q.y-q.vy*5);ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---------- pointer / tilt ---------- */
let dragging:Body|null=null,dragOX=0,dragOY=0,lastPointer={x:0,y:0},downPos={x:0,y:0},downAt=0,moved=false;
function pointerPos(e:PointerEvent){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function pick(x:number,y:number){
  return bodies.slice().reverse().find(b=>b.state==='live'&&Math.abs(x-b.x)<b.w/2+12&&Math.abs(y-b.y)<b.h/2+12)||null;
}
canvas.addEventListener('pointerdown',e=>{
  const p=pointerPos(e);lastPointer=p;downPos=p;downAt=performance.now();moved=false;dragging=pick(p.x,p.y);
  if(dragging){dragOX=p.x-dragging.x;dragOY=p.y-dragging.y;canvas.setPointerCapture(e.pointerId);dragging.vx=0;dragging.vy=0}
});
canvas.addEventListener('pointermove',e=>{
  if(!dragging)return;const p=pointerPos(e);
  if(Math.hypot(p.x-downPos.x,p.y-downPos.y)>8)moved=true;
  dragging.x=p.x-dragOX;dragging.y=p.y-dragOY;
  dragging.vx=(p.x-lastPointer.x)*.7;dragging.vy=(p.y-lastPointer.y)*.7;dragging.va=(p.x-lastPointer.x)*.003;lastPointer=p;
});
canvas.addEventListener('pointerup',()=>{
  const b=dragging;dragging=null;
  if(b&&!moved&&stage==='writing'&&performance.now()-downAt<400)dissolve(b);
});
canvas.addEventListener('pointercancel',()=>{dragging=null});

/* ---------- input ---------- */
form.addEventListener('submit',e=>{e.preventDefault();spawn(input.value)});
input.addEventListener('keydown',e=>{
  // Don't drop while an IME (Burmese, Japanese, Chinese, Korean) is still composing.
  if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();spawn(input.value)}
});
let zawTimer=0;
input.addEventListener('input',()=>{
  autosize();startsBox.classList.toggle('dim',input.value.length>0);
  clearTimeout(zawTimer);zawTimer=window.setTimeout(()=>maybeZawgyi(input.value),700);
});
$('letgoBtn').addEventListener('click',()=>{
  if(!bodies.some(b=>b.state==='live'))return;
  setStage('choose');
  choose.querySelector<HTMLElement>('.chip')?.focus({preventScroll:true});
});
$('backBtn').addEventListener('click',()=>{setStage('writing');if(finePointer)input.focus()});

/* ---------- optional 1–5 "how heavy?" check-in before and after (never stored) ---------- */
let pre:number|null=null,post:number|null=null;
function buildScale(box:HTMLElement,get:()=>number|null,set:(v:number|null)=>void,onChange?:()=>void){
  box.textContent='';
  const c=t(),dots:HTMLButtonElement[]=[];
  const end=(txt:string)=>{const e=document.createElement('span');e.className='end';e.textContent=txt;return e};
  const paint=()=>dots.forEach((b,k)=>{
    const on=get()===k+1;b.setAttribute('aria-checked',String(on));
    b.tabIndex=on||(get()==null&&k===0)?0:-1;
  });
  box.appendChild(end(c.light));
  for(let n=1;n<=5;n++){
    const b=document.createElement('button');b.type='button';b.className='dot';
    b.setAttribute('role','radio');b.setAttribute('aria-label',`${n} / 5`);
    const i=document.createElement('i');i.style.width=i.style.height=`${10+n*4}px`;b.appendChild(i);
    b.addEventListener('click',()=>{set(get()===n?null:n);paint();onChange?.()});   // tap again to clear
    dots.push(b);box.appendChild(b);
  }
  box.appendChild(end(c.heavy));
  box.onkeydown=e=>{
    const rtl=document.documentElement.dir==='rtl'?-1:1;
    const d=e.key==='ArrowRight'?rtl:e.key==='ArrowLeft'?-rtl:e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0;
    if(!d)return;e.preventDefault();
    const next=Math.max(1,Math.min(5,(get()??0)+d));set(next);paint();dots[next-1].focus();onChange?.();
  };
  paint();
}
function showVerdict(){
  const c=t();
  $('verdict').textContent=post==null||pre==null?'':post<pre?c.better:c.same;
}
function renderScales(){
  buildScale($('preScale'),()=>pre,v=>{pre=v});
  buildScale($('postScale'),()=>post,v=>{post=v},showVerdict);
  showVerdict();
}

/* ---------- gentle breathing guide: 4 s in, 6 s out (a longer out-breath calms the body) ---------- */
let breathTimers:number[]=[];
function stopBreath(){
  breathTimers.forEach(clearTimeout);breathTimers=[];
  $('breath').hidden=true;$('breathOrb').className='breath-orb';$('breatheBtn').hidden=false;
}
function startBreath(){
  stopBreath();
  const c=t(),orb=$('breathOrb'),label=$('breathLabel');
  $('breath').hidden=false;$('breatheBtn').hidden=true;
  let round=0;
  const later=(fn:()=>void,ms:number)=>{breathTimers.push(window.setTimeout(fn,ms))};
  const step=()=>{
    if(round>=4){label.textContent=c.breathDone;orb.className='breath-orb';later(stopBreath,3500);return}
    label.textContent=c.inhale;orb.className='breath-orb in';
    later(()=>{label.textContent=c.exhale;orb.className='breath-orb out';later(()=>{round++;step()},6000)},4000);
  };
  step();
}
$('breatheBtn').addEventListener('click',startBreath);


/* ---------- wish lanterns: write a wish, float a lantern into the night sky (silent, never stored) ---------- */
interface Layout{lines:string[];fs:number;lh:number;fam:string}
interface Lantern extends Layout{pal:number;w:number;h:number;x0:number;y0:number;s0:number;drift:number;seed:number;t0:number;dur:number}
const lanterns:Lantern[]=[];
const wishInput=$<HTMLTextAreaElement>('wishInput');
let skyA=0,draftA=0,wishFrom:Stage='start';
// Three paper colours so no two lanterns look the same: amber, rose, gold.
const PALS=[{t:[255,206,150],b:[255,150,66]},{t:[255,198,176],b:[246,118,92]},{t:[255,228,152],b:[255,178,60]}];
const randPal=()=>Math.floor(Math.random()*PALS.length);
let nextPal=randPal();
let draft:Layout={lines:[],fs:12,lh:16,fam:fontFor('')};
const HOLD=()=>reduceMotion?600:1400;   // the lantern glows and lifts a little before it climbs
// Fixed star field (relative positions), generated once.
const STARS=Array.from({length:80},(_,i)=>({x:((i*97)%101)/101,y:((i*57)%89)/89*.85,r:.5+((i*13)%7)/7*1.1,ph:i*1.7}));
const lanternW=()=>Math.round(Math.max(150,Math.min(210,width*.5)));

/** Fit the wish onto the lantern body: shrink the type until every line fits, never cut text. */
function layoutWish(wish:string,w:number):Layout{
  const fam=fontFor(wish),k=hasMyanmar(wish)?1.9:1.4;
  let fs=Math.round(w*.12),lines:string[]=[];
  const fits=()=>{ctx.font=`500 ${fs}px ${fam}`;lines=wrapWish(wish,w*.68,s=>ctx.measureText(s).width);return lines.length*fs*k<=w*.78};
  while(!fits()&&fs>8)fs--;
  return{lines,fs,lh:fs*k,fam};
}
// The unlit lantern that sits above the panel and shows the wish while it is being typed.
function draftSpot(){
  const w=lanternW(),h=w*1.2,ar=app.getBoundingClientRect(),pr=wishPanel.getBoundingClientRect();
  const top=pr.top-ar.top,avail=top-44;
  const s=Math.max(.55,Math.min(1,avail/(h*1.25)));
  return{w,h,s,x:width/2,y:top-h*s*.58-10};
}
function relayoutDraft(){draft=layoutWish(wishInput.value.trim(),lanternW())}

function enterWish(){
  if(stage==='release')return;
  wishFrom=stage==='rest'?'rest':'start';
  setStage('wish');say(t().wishQ);relayoutDraft();
  if(finePointer)wishInput.focus({preventScroll:true});
}
function leaveWish(){
  setStage(wishFrom);
  if(wishFrom==='start'&&finePointer)input.focus();
}
// starter wishes: lower the blank-page barrier
for(const k of ['w1','w2','w3','w4'] as const){
  const b=document.createElement('button');b.type='button';b.className='wish-chip';b.dataset.k=k;
  b.addEventListener('click',()=>{wishInput.value=t()[k];relayoutDraft();wishInput.focus({preventScroll:true})});
  $('wishStarts').appendChild(b);
}
$('wishStartBtn').addEventListener('click',enterWish);
$('wishBtn').addEventListener('click',enterWish);
$('wishBack').addEventListener('click',leaveWish);
$('wishDone').addEventListener('click',leaveWish);
wishInput.addEventListener('input',relayoutDraft);
addEventListener('resize',()=>{if(stage==='wish')relayoutDraft()});

async function sendLantern(raw:string){
  const wish=raw.trim();if(!wish)return;
  wishInput.value='';
  if(hasMyanmar(wish))await fontsReady;
  if(isCrisis(wish))showCare();else maybeZawgyi(wish);
  const sp=draftSpot(),lay=layoutWish(wish,sp.w);
  lanterns.push({...lay,pal:nextPal,w:sp.w,h:sp.h,x0:sp.x,y0:sp.y,s0:sp.s,
    drift:(Math.random()-.5)*width*.28,seed:Math.random()*6,t0:performance.now(),dur:reduceMotion?5000:13000});
  if(lanterns.length>8)lanterns.shift();   // keeps older phones smooth
  nextPal=randPal();draftA=0;relayoutDraft();   // a fresh, empty lantern appears for the next wish, once this one has lifted away
  $('wishSent').textContent=t().wishSent;say(t().wishAnnounce);buzz(10);
  if(finePointer)wishInput.focus({preventScroll:true});
}
$('wishForm').addEventListener('submit',e=>{e.preventDefault();void sendLantern(wishInput.value)});
wishInput.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();void sendLantern(wishInput.value)}
});

function drawSky(now:number){
  const target=stage==='wish'?1:0;
  skyA+=(target-skyA)*.06;if(Math.abs(target-skyA)<.005)skyA=target;
  if(skyA<=0)return;
  ctx.save();ctx.fillStyle='#fff';
  for(const s of STARS){
    const tw=reduceMotion?.8:.55+.45*Math.sin(now*.0016+s.ph);
    ctx.globalAlpha=skyA*tw*.85;ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

/** One lantern: warm glow, paper body that is lit from inside, the wish in dark ink, a small flame. */
function paintLantern(o:Layout&{w:number;h:number},pal:number,x:number,y:number,sc:number,tilt:number,lit:number,flick:number,fade:number){
  const w=o.w,h=o.h,tw=w*.5,bw=w*.34,top=-h/2,bot=h/2;
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(sc,sc);ctx.globalAlpha=Math.max(0,Math.min(1,fade));
  const gr=ctx.createRadialGradient(0,h*.1,0,0,h*.1,w*1.7);
  const P=PALS[pal]||PALS[0],gc=P.b.map((v,i)=>Math.min(255,v+[0,40,30][i])).join(',');
  gr.addColorStop(0,`rgba(${gc},${.5*lit*flick})`);gr.addColorStop(1,`rgba(${gc},0)`);
  ctx.fillStyle=gr;ctx.fillRect(-w*1.8,-h*1.3,w*3.6,h*2.9);
  ctx.beginPath();
  ctx.moveTo(-tw,top+h*.06);
  ctx.quadraticCurveTo(0,top-h*.08,tw,top+h*.06);
  ctx.bezierCurveTo(tw*1.04,top+h*.35,bw*1.15,bot-h*.2,bw,bot);
  ctx.lineTo(-bw,bot);
  ctx.bezierCurveTo(-bw*1.15,bot-h*.2,-tw*1.04,top+h*.35,-tw,top+h*.06);
  ctx.closePath();
  const body=ctx.createLinearGradient(0,top,0,bot);
  const m=.62+.38*lit;
  const bm=.73+.27*lit;
  body.addColorStop(0,`rgb(${P.t.map(v=>Math.round(v*m)).join(',')})`);body.addColorStop(1,`rgb(${P.b.map(v=>Math.round(v*bm)).join(',')})`);
  ctx.fillStyle=body;ctx.shadowColor='rgba(255,170,80,.85)';ctx.shadowBlur=22*lit;ctx.fill();ctx.shadowBlur=0;
  ctx.save();ctx.clip();
  const inner=ctx.createRadialGradient(0,bot-h*.12,0,0,bot-h*.12,h*.9);
  inner.addColorStop(0,`rgba(255,246,214,${.9*lit*flick})`);inner.addColorStop(1,'rgba(255,200,120,0)');
  ctx.fillStyle=inner;ctx.fillRect(-w,top,w*2,h*1.2);
  ctx.strokeStyle='rgba(150,70,20,.2)';ctx.lineWidth=1;
  for(const k of [-.5,0,.5]){ctx.beginPath();ctx.moveTo(k*tw*1.7,top+h*.05);ctx.lineTo(k*bw*1.7,bot);ctx.stroke()}
  ctx.fillStyle='rgba(70,28,6,.92)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${o.fs}px ${o.fam}`;
  const y0=-h*.04-(o.lines.length-1)*o.lh/2;
  o.lines.forEach((ln,j)=>ctx.fillText(ln,0,y0+j*o.lh));
  ctx.restore();
  ctx.strokeStyle='rgba(120,50,15,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-bw,bot);ctx.lineTo(bw,bot);ctx.stroke();
  const fh=h*.1*(.8+.4*flick)*(.5+.5*lit);
  ctx.fillStyle=`rgba(255,226,150,${.95*lit})`;ctx.shadowColor='rgba(255,170,60,.9)';ctx.shadowBlur=12;
  ctx.beginPath();ctx.ellipse(0,bot+fh*.1,w*.035,fh,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawLanterns(now:number){
  // draft lantern: shows the wish live while typing
  const wantDraft=stage==='wish'&&!lanterns.some(L=>now-L.t0<L.dur*.88);   // the next empty lantern waits until the last one has climbed away
  draftA+=((wantDraft?1:0)-draftA)*.08;if(Math.abs((wantDraft?1:0)-draftA)<.005)draftA=wantDraft?1:0;
  if(draftA>0){
    const sp=draftSpot(),bob=reduceMotion?0:Math.sin(now*.0022)*3,flick=reduceMotion?1:.92+.08*Math.sin(now*.02);
    paintLantern({...draft,w:sp.w,h:sp.h},nextPal,sp.x,sp.y+bob,sp.s,0,.5,flick,draftA);
  }
  for(let i=lanterns.length-1;i>=0;i--){
    const L=lanterns[i],age=now-L.t0,hold=HOLD();
    if(age>=L.dur){lanterns.splice(i,1);continue}
    const q=Math.max(0,(age-hold)/(L.dur-hold)),e=Math.pow(q,1.1);
    const lit=.5+.5*Math.min(1,age/1800);                         // the flame catches
    const pulse=1+.05*Math.sin(Math.min(1,age/1800)*Math.PI);     // a small swell as it is released
    const sc=L.s0*pulse*(1-.45*e);
    const x=L.x0+L.drift*e+(reduceMotion?0:Math.sin(q*7+L.seed)*16*(.3+e));
    const y=L.y0-e*(L.y0+L.h*1.3)+(reduceMotion||q>0?0:Math.sin(age*.004)*3);
    const tilt=reduceMotion?0:Math.sin(q*5+L.seed)*.07;
    const fade=q>.5?Math.max(0,(1-q)/.5):1,flick=reduceMotion?1:.9+.1*Math.sin(now*.02+L.seed*9)+.04*Math.sin(now*.047+L.seed);
    paintLantern(L,L.pal,x,y,sc,tilt,lit,flick,fade);
    if(!reduceMotion&&Math.random()<.08)emit({x:x+(Math.random()-.5)*L.w*.2*sc,y:y+L.h*.55*sc,vx:(Math.random()-.5)*.3,vy:.35+Math.random()*.4,life:.8,size:.8+Math.random()*1.2,type:'fire',kind:'spark'});
  }
}

/* ---------- release one word at a time (tap) ---------- */
function dissolve(b:Body){
  b.state='released';b.mode='wind';b.t0=performance.now();b.dur=reduceMotion?400:1400;
  b.dir=document.documentElement.dir==='rtl'?-1:1;
  buzz(8);
}

/* ---------- release ---------- */
function release(mode:ReleaseMode){
  const live=bodies.filter(b=>b.state==='live');
  if(!live.length||releaseStarted)return;
  releaseStarted=true;setStage('release');
  const now=performance.now(),stagger=Math.min(60,900/live.length);
  const dur=reduceMotion?600:mode==='water'?3200:mode==='fire'?2800:2600;
  live.sort((a,b)=>mode==='fire'?b.y-a.y:a.y-b.y).forEach((b,i)=>{
    b.state='released';b.mode=mode;b.t0=now+(reduceMotion?0:i*stagger);b.dur=dur;
    b.dir=document.documentElement.dir==='rtl'?-1:1;
    b.fx=false;
  });
  fx=reduceMotion?null:{mode,t0:now,dur:dur+live.length*stagger};
  buzz(mode==='fire'?[16,40,16]:12);
}
function buzz(p:number|number[]){if(!reduceMotion)try{navigator.vibrate?.(p)}catch{/* unsupported */}}
function finishRelease(){
  post=null;renderScales();
  $('after').hidden=pre==null;      // the "and now?" check-in only appears if you rated before
  setStage('rest');
  say(t().announceRest);
  const g=$('grounding');g.tabIndex=-1;g.focus({preventScroll:true});
}
document.querySelectorAll<HTMLButtonElement>('.ritual').forEach(btn=>btn.addEventListener('click',()=>release(btn.dataset.release as ReleaseMode)));
function resetAll(){
  bodies.length=0;particles.length=0;lanterns.length=0;wishInput.value='';$('wishSent').textContent='';fx=null;gravityX=0;gravityY=.72;releaseStarted=false;
  pre=null;post=null;stopBreath();
  clearTimeout(nudgeTimer);nudgeTimer=0;   // the page-time reminder restarts with the next thing you write
  resetFeeling();hideCare();input.value='';autosize();startsBox.classList.remove('dim');
  setStage('start');applyLanguage();
  if(finePointer)input.focus();
}
$('freshBtn').addEventListener('click',resetAll);
// Instant, silent wipe of everything on screen (no animation, nothing left behind).
wipeBtn.addEventListener('click',resetAll);
// When the tab or app is hidden, blur the screen so words are not visible in app switchers.
document.addEventListener('visibilitychange',()=>app.classList.toggle('veil',document.hidden));

let last=performance.now(),wasIdle=false;
function loop(now:number){
  const dt=Math.min(34,now-last);last=now;
  const idle=bodies.length===0&&particles.length===0&&!fx&&lanterns.length===0&&skyA<.01&&draftA<.01&&stage!=='wish';
  if(!(idle&&wasIdle)){physics(dt,now);render(now,dt)}
  wasIdle=idle;
  const has=!!input.value||bodies.length>0||lanterns.length>0||!!wishInput.value;if(wipeBtn.hidden===has)wipeBtn.hidden=!has;
  for(let i=bodies.length-1;i>=0;i--)if(bodies[i].dead)bodies.splice(i,1);
  if(stage==='writing'&&bodies.length===0)setStage('start');
  if(releaseStarted&&bodies.length===0){releaseStarted=false;finishRelease()}
  requestAnimationFrame(loop);
}
function detectLang():Lang{
  const saved=store.get('lang');
  if(saved&&(LANGS as string[]).includes(saved))return saved as Lang;
  for(const tag of navigator.languages?.length?navigator.languages:[navigator.language||'en']){
    const base=tag.toLowerCase().split('-')[0];
    const code=base==='mya'||base==='bur'?'my':base;
    if((LANGS as string[]).includes(code))return code as Lang;
  }
  return 'en';
}
lang=detectLang();
language.value=lang;

// Canvas text follows the system light/dark setting.
const darkMq=matchMedia('(prefers-color-scheme: dark)');
const applyTheme=()=>{BASE=darkMq.matches?[226,234,230]:[63,78,72]};
applyTheme();
try{darkMq.addEventListener('change',applyTheme)}catch{darkMq.addListener?.(applyTheme)}
setStage('start');applyLanguage();
if(finePointer)input.focus();
requestAnimationFrame(loop);
// Link straight to the lantern screen: …/#lantern
if(location.hash==='#lantern')enterWish();

// No persistence by design.
addEventListener('pagehide',()=>{bodies.length=0;particles.length=0;lanterns.length=0;input.value='';wishInput.value=''});

if('serviceWorker' in navigator&&import.meta.env.PROD){
  addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{})});
}

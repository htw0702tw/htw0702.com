(()=>{
'use strict';
window.HTW_CINEMATIC_V4=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const meta={wiki:['01','KNOWLEDGE NODE','PUBLIC WIKI'],blog:['02','FIELD NOTES','COASTAL JOURNAL'],works:['03','BUILD ARCHIVE','PORTFOLIO'],world:['04','WORLD SYSTEM','WORLD BIBLE'],aov:['05','ARENA TELEMETRY','AOV LAB'],store:['06','SUPPORT NODE','LITTLE SHOP'],plans:['07','FUTURE WORKS','LIFETIME PROJECTS'],admin:['08','PRIVATE ACCESS','STUDIO']};
let active=null,last='';
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('is-cine-visible')}),{threshold:.08,rootMargin:'0px 0px -5%'}):null;
function reveal(el){if(!el)return;el.classList.add('cine-reveal');io?io.observe(el):el.classList.add('is-cine-visible')}
function progress(){let p=$('.cine-progress');if(!p){p=document.createElement('div');p.className='cine-progress';p.innerHTML='<i></i>';document.body.appendChild(p)}return p}
function decorate(page){
  $$('.cms-entry',page).forEach((el,i)=>{el.dataset.cineIndex=String(i+1).padStart(2,'0');io?io.observe(el):el.classList.add('is-cine-visible')});
  $$('.wiki-card,.world-points article,.lab-block,.aov-dashboard,.plan-tabs,.privacy-callout,.payment-grid article,.admin-lock',page).forEach(reveal)
}
function stage(page){
  const hero=$('.subhero',page);if(!hero||$('.cine-stage',hero))return;
  const m=meta[page.dataset.view]||['00','HTW0702','PERSONAL WORLD'];
  const el=document.createElement('div');el.className='cine-stage';
  el.innerHTML=`<div class="cine-grid"></div><div class="cine-glow"></div><div class="cine-ring"></div><div class="cine-hud"><span>SECTION</span><b>${m[0]}</b><span>CHANNEL</span><b>${m[1]}</b><span>STATUS</span><b>ONLINE</b></div><div class="cine-scroll"><i></i><span>SCROLL / ${m[2]}</span></div>`;
  hero.prepend(el)
}
function animateHero(page){const h=$('.subhero h1',page),p=$('.subhero p',page);if(h)h.animate([{opacity:0,transform:'translateY(42px)'},{opacity:1,transform:'translateY(0)'}],{duration:780,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});if(p)p.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:780,delay:100,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'})}
function update(){
  const page=$('.view.subpage.active');active=page;
  if(!page){document.body.classList.remove('cinematic-mode','is-scrolled');return}
  document.body.classList.add('cinematic-mode');document.body.dataset.cinePage=page.dataset.view||'';stage(page);decorate(page);progress();
  if(last!==page.dataset.view){last=page.dataset.view;requestAnimationFrame(()=>animateHero(page))}
  onScroll()
}
function onScroll(){const y=scrollY||0,max=Math.max(1,document.documentElement.scrollHeight-innerHeight),pct=Math.min(100,Math.max(0,y/max*100));document.documentElement.style.setProperty('--cine-progress',pct+'%');document.documentElement.style.setProperty('--cine-scroll',String(Math.min(y,1100)));document.body.classList.toggle('is-scrolled',y>42)}
function pointer(e){if(!active)return;document.documentElement.style.setProperty('--cine-x',Math.max(0,Math.min(1,e.clientX/innerWidth)).toFixed(3));document.documentElement.style.setProperty('--cine-y',Math.max(0,Math.min(1,e.clientY/innerHeight)).toFixed(3))}
let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{onScroll();ticking=false})},{passive:true});addEventListener('pointermove',pointer,{passive:true});
const main=$('main');if(main)new MutationObserver(()=>queueMicrotask(update)).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
addEventListener('popstate',()=>setTimeout(update,0));document.addEventListener('click',e=>{if(e.target.closest('.route-link'))setTimeout(update,100)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});else update();
})();
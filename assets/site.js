(()=>{
  const locale=document.body.dataset.locale||'tw';
  const route=document.body.dataset.route||'';
  const lang=document.querySelector('#language');
  if(lang) lang.addEventListener('change',e=>{ location.href='/' + e.target.value + route; });
  const menu=document.querySelector('#menu-toggle');
  const nav=document.querySelector('#nav');
  if(menu&&nav) menu.addEventListener('click',()=>{ const open=nav.classList.toggle('open'); menu.setAttribute('aria-expanded',String(open)); });
  document.querySelectorAll('.feed-state').forEach(el=>el.hidden=true);
  document.querySelectorAll('.feed-empty').forEach(el=>el.hidden=false);
  const auth=document.querySelector('#auth-status');
  if(auth) auth.textContent = locale==='en' ? 'Apple sign-in is not configured yet.' : locale==='jp' ? 'Appleでサインインはまだ設定されていません。' : 'Apple 登入尚未設定。';
  const apple=document.querySelector('#apple-login'); if(apple){ apple.setAttribute('aria-disabled','true'); apple.addEventListener('click',e=>e.preventDefault()); }
  const studioPreview=document.querySelector('#studio-preview');
  if(studioPreview) studioPreview.addEventListener('click',()=>{
    const login=document.querySelector('#login-panel'), studio=document.querySelector('#studio'), notice=document.querySelector('#preview-notice');
    if(login) login.hidden=true; if(studio) studio.hidden=false; if(notice) notice.hidden=false;
    document.querySelectorAll('#studio input,#studio textarea,#studio select,#studio button').forEach(x=>x.disabled=true);
  });
  const filter=document.querySelector('#match-filter');
  if(filter) filter.addEventListener('change',()=>{});
})();

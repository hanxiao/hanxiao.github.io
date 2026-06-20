// minimal interactions: mobile nav toggle + scroll-active sync
(function(){
  var t=document.getElementById('menu-toggle');
  if(t){t.addEventListener('click',function(){document.body.classList.toggle('nav-open');});}
  // close nav on link tap (mobile)
  document.querySelectorAll('#sidebar a').forEach(function(a){
    a.addEventListener('click',function(){document.body.classList.remove('nav-open');});
  });
  // keep active item in view
  var active=document.querySelector('.toc li.active');
  if(active&&active.scrollIntoView){active.scrollIntoView({block:'center'});}
  // keyboard nav: left/right arrows
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(e.key==='ArrowLeft'){var p=document.querySelector('.pn-prev');if(p)location.href=p.href;}
    if(e.key==='ArrowRight'){var n=document.querySelector('.pn-next');if(n)location.href=n.href;}
  });
})();

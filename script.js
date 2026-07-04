// Icon rendering is isolated so a slow/blocked CDN can't break the rest of the page.
try {
  if (window.lucide) { lucide.createIcons(); }
} catch (err) {
  console.warn('Icon library failed to load; falling back to plain layout.', err);
}
document.getElementById('year').textContent = new Date().getFullYear();

// Resume buttons: let the browser handle it natively.
// The <a> tags already point to Muhammad_Awais_Raza_Resume.pdf with a
// download attribute, so no JS is needed — clicking opens/downloads the file
// directly. (Previously this block intercepted the click and showed a
// placeholder alert instead.)

// Navbar scroll state
const nav = document.getElementById('siteNav');
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', ()=>{
  if(window.scrollY > 30){ nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }
  if(window.scrollY > 500){ backToTop.classList.add('show'); } else { backToTop.classList.remove('show'); }
}, {passive:true});
backToTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

// Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', ()=>{
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.mobile-menu a').forEach(a=>{
  a.addEventListener('click', ()=>{
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Scroll-spy active nav link
const sections = ['home','about','skills','projects','experience','contact'].map(id=>document.getElementById(id));
const navAnchors = document.querySelectorAll('[data-nav]');
const spyObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      navAnchors.forEach(a=>{
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, {rootMargin:'-45% 0px -50% 0px'});
sections.forEach(s=> s && spyObserver.observe(s));

// Reveal on scroll — falls back to "just show everything" if IntersectionObserver
// isn't available, so content is never stuck invisible.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=> revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el=> el.classList.add('in'));
}
// Belt-and-suspenders: if anything above ever fails silently, force content visible
// after 2.5s so no section can stay permanently blank.
setTimeout(()=>{
  document.querySelectorAll('.reveal:not(.in)').forEach(el=> el.classList.add('in'));
}, 2500);

// Skill bar fill on scroll
const barObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const fill = entry.target;
      fill.style.width = fill.dataset.pct + '%';
      barObserver.unobserve(fill);
    }
  });
}, {threshold:0.4});
document.querySelectorAll('.bar-fill').forEach(el=> barObserver.observe(el));

// Count-up stats
const countObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      let cur = 0;
      const step = Math.max(1, Math.ceil(target/40));
      const iv = setInterval(()=>{
        cur += step;
        if(cur >= target){ cur = target; clearInterval(iv); }
        el.textContent = cur;
      }, 30);
      countObserver.unobserve(el);
    }
  });
}, {threshold:0.5});
document.querySelectorAll('.count').forEach(el=> countObserver.observe(el));

// Project filter
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
filterBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    projectCards.forEach(card=>{
      const cats = card.dataset.cat.split(' ');
      card.classList.toggle('hidden', f !== 'all' && !cats.includes(f));
    });
  });
});

// Typed code snippet in hero terminal
const codeLines = [
  {t:'kw', v:'int'}, {t:'', v:' '}, {t:'fn', v:'binarySearch'}, {t:'', v:'('},
  {t:'type', v:'vector<int>'}, {t:'', v:'& arr, '}, {t:'type', v:'int'}, {t:'', v:' target) {\n    '},
  {t:'type', v:'int'}, {t:'', v:' lo = 0, hi = arr.size() - 1;\n    '},
  {t:'kw', v:'while'}, {t:'', v:' (lo <= hi) {\n        '},
  {t:'type', v:'int'}, {t:'', v:' mid = lo + (hi - lo) / 2;\n        '},
  {t:'kw', v:'if'}, {t:'', v:' (arr[mid] == target) '}, {t:'kw', v:'return'}, {t:'', v:' mid;\n        '},
  {t:'kw', v:'else if'}, {t:'', v:' (arr[mid] < target) lo = mid + 1;\n        '},
  {t:'kw', v:'else'}, {t:'', v:' hi = mid - 1;\n    }\n    '},
  {t:'kw', v:'return'}, {t:'', v:' -1; '}, {t:'com', v:'// O(log n)'}, {t:'', v:'\n}'}
];
const target = document.getElementById('typedCode');
let li = 0, ci = 0, buffer = '';
function typeStep(){
  if(li >= codeLines.length){ return; }
  const seg = codeLines[li];
  const cls = seg.t === 'kw' ? 'c-kw' : seg.t === 'type' ? 'c-type' : seg.t === 'fn' ? 'c-fn' : seg.t === 'com' ? 'c-com' : '';
  if(ci < seg.v.length){
    buffer += seg.v[ci];
    ci++;
  } else {
    li++; ci = 0;
    typeStep();
    return;
  }
  renderTyped();
  setTimeout(typeStep, 14);
}
function renderTyped(){
  // Rebuild full HTML up to current point for correct coloring
  let html = '', l = 0, c = 0, remaining = buffer.length;
  while(remaining > 0 && l < codeLines.length){
    const seg = codeLines[l];
    const take = Math.min(seg.v.length - c, remaining);
    if(take > 0){
      const cls = seg.t === 'kw' ? 'c-kw' : seg.t === 'type' ? 'c-type' : seg.t === 'fn' ? 'c-fn' : seg.t === 'com' ? 'c-com' : '';
      const chunk = seg.v.substr(c, take);
      html += cls ? '<span class="'+cls+'">'+escapeHtml(chunk)+'</span>' : escapeHtml(chunk);
      remaining -= take;
    }
    c += take;
    if(c >= seg.v.length){ l++; c = 0; }
  }
  target.innerHTML = html;
}
function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
setTimeout(typeStep, 900);

// Cursor parallax on hero visual
const heroVisual = document.getElementById('heroVisual');
document.querySelector('.hero').addEventListener('mousemove', (e)=>{
  const rect = document.querySelector('.hero').getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width/2) / rect.width;
  const y = (e.clientY - rect.top - rect.height/2) / rect.height;
  heroVisual.style.transform = `translate(${x*12}px, ${y*12}px)`;
});

// Contact form validation
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');
function setError(fieldId, msg){
  const field = document.getElementById(fieldId);
  field.classList.toggle('error', !!msg);
  field.querySelector('.err-msg').textContent = msg || '';
}
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  let valid = true;
  const name = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const subject = document.getElementById('subjectInput').value.trim();
  const message = document.getElementById('messageInput').value.trim();

  if(!name){ setError('nameField','Name is required.'); valid = false; } else setError('nameField','');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!email){ setError('emailField','Email is required.'); valid = false; }
  else if(!emailRe.test(email)){ setError('emailField','Enter a valid email address.'); valid = false; }
  else setError('emailField','');
  if(!subject){ setError('subjectField','Subject is required.'); valid = false; } else setError('subjectField','');
  if(!message){ setError('messageField','Message is required.'); valid = false; } else setError('messageField','');

  if(!valid) return;

  submitBtn.classList.add('loading');
  formSuccess.classList.remove('show');
  setTimeout(()=>{
    submitBtn.classList.remove('loading');
    formSuccess.classList.add('show');
    form.reset();
  }, 1400);
});
/* ─── API ─────────────────────────────────────────────────────────────────── */
const API = {
  async request(method, url, body=null, isFormData=false){
    const headers = {};
    const token = Auth.getToken();
    if(token) headers['Authorization'] = `Bearer ${token}`;
    if(!isFormData && body) headers['Content-Type'] = 'application/json';
    const opts = { method, headers };
    if(body) opts.body = isFormData ? body : JSON.stringify(body);
    const res = await fetch(url, opts);
    if(res.status === 401 && !url.includes('/auth/')){ Auth.logout(); return null; }
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get:    (url)        => API.request('GET',    url),
  post:   (url, body)  => API.request('POST',   url, body),
  put:    (url, body)  => API.request('PUT',    url, body),
  delete: (url)        => API.request('DELETE', url),
  upload: (url, fd, method='POST') => API.request(method, url, fd, true)
};

/* ─── AUTH ────────────────────────────────────────────────────────────────── */
const Auth = {
  getToken: ()    => localStorage.getItem('srf_token'),
  setToken: (t)   => localStorage.setItem('srf_token', t),
  getUser:  ()    => { try{ return JSON.parse(localStorage.getItem('srf_user')); }catch{ return null; } },
  setUser:  (u)   => localStorage.setItem('srf_user', JSON.stringify(u)),
  isLoggedIn: ()  => !!localStorage.getItem('srf_token'),
  isAdmin: ()     => { const u=Auth.getUser(); return u && u.role==='admin'; },
  login(token, user){ Auth.setToken(token); Auth.setUser(user); },
  logout(){
    localStorage.removeItem('srf_token');
    localStorage.removeItem('srf_user');
    localStorage.removeItem('srf_favs');
    window.location.href = '/login.html';
  }
};

/* ─── THEME ───────────────────────────────────────────────────────────────── */
const Theme = {
  init(){ this.apply(localStorage.getItem('srf_theme')||'light'); },
  toggle(){ const n = (document.documentElement.getAttribute('data-theme')||'light')==='dark'?'light':'dark'; this.apply(n); localStorage.setItem('srf_theme',n); },
  apply(t){ document.documentElement.setAttribute('data-theme',t); const b=document.getElementById('themeBtn'); if(b) b.innerHTML=t==='dark'?'☀️':'🌙'; }
};
Theme.init();

/* ─── TOAST ───────────────────────────────────────────────────────────────── */
function toast(msg, type='default', duration=3500){
  let c = document.querySelector('.toast-container');
  if(!c){ c=document.createElement('div'); c.className='toast-container'; document.body.appendChild(c); }
  const icons={success:'✅',error:'❌',warning:'⚠️',default:'🍳'};
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${icons[type]||icons.default}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.animation='toastOut .3s ease forwards'; setTimeout(()=>t.remove(),300); }, duration);
}

/* ─── NAVBAR ──────────────────────────────────────────────────────────────── */
function renderNavbar(activePage=''){
  const user=Auth.getUser();
  const loggedIn=Auth.isLoggedIn();
  const admin=Auth.isAdmin();
  document.body.insertAdjacentHTML('afterbegin',`
    <nav class="navbar">
      <a href="/" class="nav-brand"><span class="nb-icon">🍳</span> Smart <em>Recipe Finder</em></a>
      <ul class="nav-links">
        <li><a href="/" class="${activePage==='home'?'active':''}">🍽 Recipes</a></li>
        <li><a href="/meal-planner.html" class="${activePage==='planner'?'active':''}">📅 Meal Planner</a></li>
        ${loggedIn?`<li><a href="/favorites.html" class="${activePage==='favs'?'active':''}">❤️ Favorites</a></li>`:''}
        ${admin?`<li><a href="/admin.html" class="${activePage==='admin'?'active':''}">⚡ Admin</a></li>`:''}
      </ul>
      <div class="nav-actions">
        <button class="theme-btn" id="themeBtn" onclick="Theme.toggle()" title="Toggle theme">🌙</button>
        ${loggedIn?`
          <div class="user-menu">
            <button class="user-avatar" onclick="toggleDropdown()">${user?.username?.[0]?.toUpperCase()||'U'}</button>
            <div class="user-dropdown" id="userDropdown">
              <div style="padding:.55rem .9rem .35rem;font-size:.78rem;color:var(--text-muted)">Signed in as<br><strong style="color:var(--text)">${user?.username}</strong></div>
              <div class="dropdown-divider"></div>
              <a href="/favorites.html">❤️ My Favorites</a>
              <a href="/meal-planner.html">📅 Meal Planner</a>
              ${admin?'<a href="/admin.html">⚡ Admin Panel</a>':''}
              <div class="dropdown-divider"></div>
              <button onclick="Auth.logout()">🚪 Log Out</button>
            </div>
          </div>`:
          `<a href="/login.html" class="btn-nav">Log In</a>
           <a href="/login.html?tab=register" class="btn-nav btn-nav-primary">Sign Up</a>`
        }
      </div>
    </nav>`);
  Theme.init();
}
function toggleDropdown(){ document.getElementById('userDropdown')?.classList.toggle('open'); }
document.addEventListener('click', e=>{ if(!e.target.closest('.user-menu')) document.getElementById('userDropdown')?.classList.remove('open'); });

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
function formatTime(m){ if(!m) return '—'; return m<60?`${m}m`:`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`; }
function formatDate(iso){ return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function getQueryParam(k){ return new URLSearchParams(window.location.search).get(k); }
function getImg(imgs){ try{ const a=typeof imgs==='string'?JSON.parse(imgs):imgs; return (a&&a[0])||'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600'; }catch{ return imgs||'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600'; } }

const MEAL_TYPE_ICONS = { Breakfast:'🌅', Brunch:'☀️', Lunch:'🌞', Dinner:'🌙', Snack:'🍿', Dessert:'🍰', Any:'🍽' };

/* ─── RECIPE CARD ─────────────────────────────────────────────────────────── */
function renderRecipeCard(r, favIds=[]){
  const isFav = favIds.includes(r.id);
  const loggedIn = Auth.isLoggedIn();
  const img = getImg(r.images);
  const total = (r.prep_time||0)+(r.cook_time||0);
  const diff = r.difficulty||'Medium';
  const mt = r.meal_type||'Any';
  return `
    <div class="recipe-card page-fade" data-id="${r.id}">
      <a href="/recipe.html?id=${r.id}" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="${img}" alt="${r.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400'">
          ${r.featured?'<span class="card-badge">✨ Featured</span>':''}
        </div>
      </a>
      ${loggedIn?`<button class="card-fav-btn${isFav?' active':''}" onclick="toggleFavorite('${r.id}',this)">${isFav?'❤️':'🤍'}</button>`:''}
      <a href="/recipe.html?id=${r.id}" style="text-decoration:none;color:inherit;flex:1;display:flex;flex-direction:column">
        <div class="card-body">
          <div class="card-meta-top">
            <div class="card-category">${r.category||''}</div>
            <div style="font-size:.72rem;color:var(--text-muted)">${MEAL_TYPE_ICONS[mt]||'🍽'} ${mt}</div>
          </div>
          <h3 class="card-title">${r.title}</h3>
          <p class="card-desc">${r.description||''}</p>
          <div class="card-foot">
            <span class="meta-item">⏱ ${formatTime(total)}</span>
            <span class="meta-item">👥 ${r.servings||4}</span>
            <span class="meta-item">⭐ ${r.rating||4.5}</span>
            <span class="diff-badge ${diff}">${diff}</span>
          </div>
        </div>
      </a>
    </div>`;
}

/* ─── FAVORITES ───────────────────────────────────────────────────────────── */
let _favIds = [];
async function loadFavIds(){ if(!Auth.isLoggedIn()) return; try{ _favIds = await API.get('/api/favorites/ids')||[]; }catch{} }
async function toggleFavorite(id, btn){
  if(!Auth.isLoggedIn()){ window.location.href='/login.html'; return; }
  const isFav = _favIds.includes(id);
  try{
    if(isFav){ await API.delete(`/api/favorites/${id}`); _favIds=_favIds.filter(x=>x!==id); if(btn){btn.classList.remove('active');btn.innerHTML='🤍';} toast('Removed from favorites'); }
    else      { await API.post(`/api/favorites/${id}`);  _favIds.push(id); if(btn){btn.classList.add('active');btn.innerHTML='❤️';} toast('Added to favorites!','success'); }
  }catch(e){ toast(e.message,'error'); }
}

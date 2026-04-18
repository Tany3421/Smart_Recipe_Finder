/* meal-planner.js  –  depends on app.js being loaded first */
const MEAL_TYPES = ['Breakfast','Brunch','Lunch','Dinner','Snack','Dessert'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

let currentWeek = getMonday(new Date());   // Date object
let planData     = null;                    // { plan_id, week_start, items: [] }
let allRecipes   = [];                      // for recipe picker
let pickSlot     = null;                    // { day, meal_type } pending selection

/* ─── Date helpers ────────────────────────────────────────────────────────── */
function getMonday(d){
  const day = d.getDay();
  const diff = (day===0?-6:1-day);
  const m = new Date(d);
  m.setDate(m.getDate()+diff);
  m.setHours(0,0,0,0);
  return m;
}
function addDays(d, n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function toISO(d){ return d.toISOString().slice(0,10); }
function fmtShort(d){ return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtWeekLabel(mon){
  const sun = addDays(mon,6);
  return `${fmtShort(mon)} — ${fmtShort(sun)}, ${mon.getFullYear()}`;
}
function isToday(d){ const t=new Date(); return d.toDateString()===t.toDateString(); }

/* ─── Navigation ──────────────────────────────────────────────────────────── */
function prevWeek(){ currentWeek=addDays(currentWeek,-7); loadWeek(); }
function nextWeek(){ currentWeek=addDays(currentWeek,7);  loadWeek(); }
function goThisWeek(){ currentWeek=getMonday(new Date()); loadWeek(); }

/* ─── Load week from API ──────────────────────────────────────────────────── */
async function loadWeek(){
  document.getElementById('weekLabel').textContent = fmtWeekLabel(currentWeek);
  const grid = document.getElementById('plannerGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;padding:2rem;text-align:center;color:var(--text-muted)">Loading…</div>';
  try {
    planData = await API.get(`/api/meal-planner?week=${toISO(currentWeek)}`);
    renderGrid();
  } catch(e){ toast(e.message,'error'); }
}

/* ─── Render the 7×6 grid ────────────────────────────────────────────────── */
function renderGrid(){
  const grid = document.getElementById('plannerGrid');
  grid.innerHTML = '';

  // Top-left empty corner
  grid.appendChild(el('div','planner-day-header',`<div class="day-name">Meal</div>`));

  // Day headers
  DAYS.forEach((d,i)=>{
    const date = addDays(currentWeek, i);
    const isT  = isToday(date);
    const div  = el('div',`planner-day-header${isT?' today':''}`,`
      <div class="day-name">${d}</div>
      <div class="day-date">${date.getDate()}</div>`);
    grid.appendChild(div);
  });

  // Meal rows
  MEAL_TYPES.forEach(mealType=>{
    // Row label
    grid.appendChild(el('div','planner-meal-label',`
      <div class="ml-icon">${MEAL_TYPE_ICONS[mealType]||'🍽'}</div>
      <div class="ml-name">${mealType}</div>`));

    // 7 day cells
    DAYS.forEach((_,dayIdx)=>{
      const item = planData?.items?.find(x=>x.day_of_week===dayIdx && x.meal_type===mealType);
      const cell = document.createElement('div');
      cell.className = 'planner-cell' + (item?' has-recipe':'');

      if(item){
        const img = getImg(item.images);
        cell.innerHTML = `
          <div class="planner-recipe-card">
            <img src="${img}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200'">
            <button class="prc-remove" onclick="removeItem('${item.id}')" title="Remove">✕</button>
            <div class="prc-info">
              <div class="prc-title">${item.title}</div>
            </div>
          </div>
          <button class="planner-add-btn" onclick="openPicker(${dayIdx},'${mealType}')">+ Replace</button>`;
      } else {
        cell.innerHTML = `<button class="planner-add-btn" onclick="openPicker(${dayIdx},'${mealType}')">+ Add Recipe</button>`;
      }
      grid.appendChild(cell);
    });
  });
}

function el(tag, cls, html){
  const d = document.createElement(tag);
  d.className = cls;
  d.innerHTML = html;
  return d;
}

/* ─── Recipe Picker modal ─────────────────────────────────────────────────── */
async function openPicker(dayIdx, mealType){
  if(!Auth.isLoggedIn()){ window.location.href='/login.html'; return; }
  pickSlot = { day: dayIdx, meal_type: mealType };
  document.getElementById('pickerTitle').textContent = `Add ${MEAL_TYPE_ICONS[mealType]} ${mealType} — ${DAYS[dayIdx]}`;
  document.getElementById('pickerModal').classList.add('open');
  document.getElementById('pickerSearch').value = '';
  await loadPickerRecipes('', mealType);
}
function closePicker(){ document.getElementById('pickerModal').classList.remove('open'); pickSlot=null; }

async function loadPickerRecipes(search='', mealType=''){
  const grid = document.getElementById('pickerGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1rem;color:var(--text-muted)">Loading…</div>';
  try {
    const params = new URLSearchParams({ limit:30 });
    if(search) params.set('search',search);
    // Optionally pre-filter by meal type
    const data = await API.get(`/api/recipes?${params}`);
    const recipes = data.recipes||[];
    if(!recipes.length){
      grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:var(--text-muted)">No recipes found</div>';
      return;
    }
    grid.innerHTML = recipes.map(r=>{
      const img = getImg(r.images);
      return `<div class="recipe-pick-card" onclick="selectRecipe('${r.id}')">
        <img src="${img}" alt="${r.title}" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200'">
        <div class="rpc-info">
          <div class="rpc-title">${r.title}</div>
          <div class="rpc-sub">${MEAL_TYPE_ICONS[r.meal_type]||''} ${r.meal_type||''} · ${r.cuisine||''}</div>
        </div>
      </div>`;
    }).join('');
  } catch(e){ grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:1rem;color:var(--danger)">${e.message}</div>`; }
}

async function selectRecipe(recipeId){
  if(!pickSlot) return;
  try {
    await API.post('/api/meal-planner/item',{
      week:    toISO(currentWeek),
      day_of_week: pickSlot.day,
      meal_type:   pickSlot.meal_type,
      recipe_id:   recipeId
    });
    closePicker();
    toast('Added to meal plan! 🎉','success');
    await loadWeek();
  } catch(e){ toast(e.message,'error'); }
}

async function removeItem(itemId){
  try {
    await API.delete(`/api/meal-planner/item/${itemId}`);
    toast('Removed from plan','default');
    await loadWeek();
  } catch(e){ toast(e.message,'error'); }
}

/* ─── Shopping List ───────────────────────────────────────────────────────── */
async function openShoppingList(){
  document.getElementById('shoppingModal').classList.add('open');
  const body = document.getElementById('shoppingBody');
  body.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">Loading…</p>';
  try {
    const data = await API.get(`/api/meal-planner/shopping-list?week=${toISO(currentWeek)}`);
    if(!data.ingredients?.length){
      body.innerHTML='<div class="empty-state"><div class="es-icon">🛒</div><h3>No items yet</h3><p>Add recipes to your plan first.</p></div>';
      return;
    }
    // Group by recipe
    const groups = {};
    data.ingredients.forEach(({ingredient, recipe})=>{
      if(!groups[recipe]) groups[recipe]=[];
      groups[recipe].push(ingredient);
    });
    body.innerHTML = Object.entries(groups).map(([recipe,ings])=>`
      <div class="shopping-section">
        <h3>📌 ${recipe}</h3>
        ${ings.map((ing,i)=>`
          <div class="shopping-item" id="si-${btoa(recipe+i).slice(0,8)}">
            <input type="checkbox" id="cb-${btoa(recipe+i).slice(0,8)}"
              onchange="document.getElementById('si-${btoa(recipe+i).slice(0,8)}').classList.toggle('done',this.checked)">
            <label for="cb-${btoa(recipe+i).slice(0,8)}">${ing}</label>
          </div>`).join('')}
      </div>`).join('');
  } catch(e){
    body.innerHTML=`<p style="color:var(--danger)">${e.message}</p>`;
  }
}
function closeShoppingList(){ document.getElementById('shoppingModal').classList.remove('open'); }

function printShoppingList(){
  const body = document.getElementById('shoppingBody').innerText;
  const w = window.open('','_blank');
  w.document.write(`<pre style="font-family:sans-serif;padding:20px">${body}</pre>`);
  w.print();
}

/* ─── Init ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', ()=>{
  if(!Auth.isLoggedIn()){ window.location.href='/login.html'; return; }
  loadWeek();
  // Picker search debounce
  let timer;
  document.getElementById('pickerSearch')?.addEventListener('input', e=>{
    clearTimeout(timer);
    timer = setTimeout(()=> loadPickerRecipes(e.target.value, pickSlot?.meal_type||''), 400);
  });
});

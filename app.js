const STORAGE_KEY = 'gem-search-user-gems-v1';
const STORAGE_TEST_KEY = 'gem-search-storage-test';
const primaryFields = window.FIELD_GROUPS.primary;
const notesFields = window.FIELD_GROUPS.notes;
const allFields = window.FIELD_GROUPS.all;
const baseGems = window.GEM_DATA || [];
const $ = (id) => document.getElementById(id);
const normalize = (v) => String(v ?? '').toLowerCase().replace(/\s+/g,' ').trim();

const COLOR_FIELDS = [
  { field:'Color C', label:'C', value:'clear', css:'clear' },
  { field:'Color P', label:'P', value:'purple', css:'purple' },
  { field:'Color R', label:'R', value:'red', css:'red' },
  { field:'Color O', label:'O', value:'orange', css:'orange' },
  { field:'Color Y', label:'Y', value:'yellow', css:'yellow' },
  { field:'Color G', label:'G', value:'green', css:'green' },
  { field:'Color B', label:'B', value:'blue', css:'blue' },
  { field:'Color V', label:'V', value:'violet', css:'violet' },
  { field:'Color B 2', label:'Br', value:'brown', css:'brown' },
  { field:'Color W', label:'W', value:'white', css:'white' },
  { field:'Color G 2', label:'Gy', value:'gray', css:'gray' },
  { field:'Color B 3', label:'Bk', value:'black', css:'black' }
];
const COLOR_FIELD_SET = new Set(COLOR_FIELDS.map(c => c.field));
const COLOR_BY_FIELD = Object.fromEntries(COLOR_FIELDS.map(c => [c.field, c]));
const COLOR_BY_VALUE = Object.fromEntries(COLOR_FIELDS.map(c => [c.value, c]));
const TRANSPARENCY_OPTIONS = [
  { code:'O', label:'Opaque' },
  { code:'STL', label:'Semi Translucent' },
  { code:'TL', label:'Translucent' },
  { code:'STP', label:'Semi Transparent' },
  { code:'TP', label:'Transparent' }
];
const SUBTITLE_FILE = 'subtitles.txt';
const SUBTITLE_ROTATION_MS = 6500;

function storageAvailable(){
  try{
    localStorage.setItem(STORAGE_TEST_KEY, '1');
    localStorage.removeItem(STORAGE_TEST_KEY);
    return true;
  }catch(err){
    return false;
  }
}
const canStore = storageAvailable();
let memoryGems = [];
function userGems(){
  if(!canStore) return memoryGems;
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  }catch(err){
    console.warn('Saved gem data could not be read. Backing it up and starting fresh.', err);
    const bad = localStorage.getItem(STORAGE_KEY);
    if(bad) localStorage.setItem(`${STORAGE_KEY}-corrupt-${Date.now()}`, bad);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}
function saveUserGems(items){
  const cleanItems = Array.isArray(items) ? items : [];
  if(!canStore){
    memoryGems = cleanItems;
    return false;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanItems));
  return true;
}
const gems = () => [...baseGems, ...userGems().map(g => ({...g, __user:true}))];
function searchable(rec, fields){ return fields.map(f => rec[f] || '').join(' '); }
function parseNum(s){ const m=String(s||'').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : -Infinity; }
function parseNumberList(value){
  return String(value || '').match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
}
function parseSearchNumber(value){
  const text = normalize(value);
  if(!/^\d+(?:\.\d+)?$/.test(text)) return null;
  return Number(text);
}
function refractiveIndexValues(rec){
  return parseNumberList(rec['Refractive Index Normal'] || '');
}
function refractiveIndexMatches(rec, queryNumber){
  if(queryNumber === null) return false;
  const values = refractiveIndexValues(rec);
  if(!values.length) return false;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const tolerance = 0.0005;
  return queryNumber >= low - tolerance && queryNumber <= high + tolerance;
}
function refractiveIndexSortValue(rec){
  const values = parseNumberList(rec['Refractive Index Range'] || rec['Refractive Index Normal']);
  if(!values.length) return { high:-Infinity, low:-Infinity };
  return { high:Math.max(...values), low:Math.min(...values) };
}
function showToast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function fieldHTML(label, value){ if(!value) return ''; return `<div class="field"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`; }

function colorMetaFromName(name){
  const clean = normalize(name);
  if(!clean) return null;
  return COLOR_BY_VALUE[clean] || { field:null, label:name, value:clean, css:clean.replace(/[^a-z0-9]+/g,'-') };
}
function colorMetaFromRecord(rec){
  const fields = COLOR_FIELDS.filter(meta => rec[meta.field]);
  if(fields.length) return fields;
  return (rec.__colors || []).map(colorMetaFromName).filter(Boolean);
}
function swatchHTML(meta, large=false){
  const title = meta.value ? `${meta.label}: ${meta.value}` : meta.label;
  return `<span class="swatch swatch-${esc(meta.css)}${large?' swatch-large':''}" title="${esc(title)}" aria-label="${esc(title)}">${esc(meta.label)}</span>`;
}

function splitValueList(value){
  return String(value || '')
    .split(/[\n,;/]+/)
    .map(v => v.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
function transparencyCodesFromRecord(rec){
  return String(rec['Transp.'] || '')
    .split(/[^A-Za-z]+/)
    .map(v => v.trim().toUpperCase())
    .filter(Boolean);
}
function colorValuesFromRecord(rec){
  return colorMetaFromRecord(rec).map(meta => normalize(meta.value)).filter(Boolean);
}
function crystalSystemsFromRecord(rec){
  return splitValueList(rec['Crystal System']).map(normalize).filter(Boolean);
}
function filterOptionMatches(rec, group, value){
  const clean = normalize(value);
  if(group === 'transparency') return transparencyCodesFromRecord(rec).map(normalize).includes(clean);
  if(group === 'color') return colorValuesFromRecord(rec).includes(clean);
  if(group === 'crystal') return crystalSystemsFromRecord(rec).includes(clean);
  return false;
}
function filterChoiceSelector(group, mode){
  return `.filter-choice[data-group="${group}"][data-state="${mode}"]`;
}
function selectedFilterValues(group, mode){
  return Array.from(document.querySelectorAll(filterChoiceSelector(group, mode))).map(btn => btn.dataset.value);
}
function groupPassesFilters(rec, group){
  const include = selectedFilterValues(group, 'include');
  const exclude = selectedFilterValues(group, 'exclude');
  if(include.length && !include.some(value => filterOptionMatches(rec, group, value))) return false;
  if(exclude.length && exclude.some(value => filterOptionMatches(rec, group, value))) return false;
  return true;
}
function recordPassesMenuFilters(rec){
  return ['transparency', 'color', 'crystal'].every(group => groupPassesFilters(rec, group));
}
function activeFilterCount(){
  return document.querySelectorAll('#filterPanel .filter-choice[data-state="include"], #filterPanel .filter-choice[data-state="exclude"]').length;
}
function updateFilterSummary(){
  const summary = $('filterMenu')?.querySelector('summary');
  if(!summary) return;
  const count = activeFilterCount();
  summary.textContent = count ? `Filter / Exclude (${count})` : 'Filter / Exclude';
}
function setFilterChoiceState(btn, state){
  btn.dataset.state = state;
  btn.setAttribute('aria-pressed', state === 'none' ? 'false' : 'true');
  const status = btn.querySelector('.filter-state');
  if(status){
    status.textContent = state === 'include' ? 'Filter' : state === 'exclude' ? 'Exclude' : '';
  }
}
function clearFilters(){
  document.querySelectorAll('#filterPanel .filter-choice').forEach(btn => setFilterChoiceState(btn, 'none'));
  updateFilterSummary();
  render();
}
function applyFilterChoice(btn, state){
  setFilterChoiceState(btn, state);
  updateFilterSummary();
  render();
}
let filterTapTimer = null;
function handleFilterChoiceClick(ev){
  const btn = ev.currentTarget;
  const now = Date.now();
  const lastTap = Number(btn.dataset.lastTap || 0);
  btn.dataset.lastTap = String(now);
  if(now - lastTap < 320){
    if(filterTapTimer) clearTimeout(filterTapTimer);
    filterTapTimer = null;
    applyFilterChoice(btn, btn.dataset.state === 'exclude' ? 'none' : 'exclude');
    return;
  }
  if(filterTapTimer) clearTimeout(filterTapTimer);
  filterTapTimer = setTimeout(() => {
    filterTapTimer = null;
    applyFilterChoice(btn, btn.dataset.state === 'include' ? 'none' : 'include');
  }, 230);
}
function filterTileHTML(group, value, label, extra=''){
  return `<button class="filter-tile filter-choice ${esc(extra)}" type="button" data-group="${esc(group)}" data-value="${esc(value)}" data-state="none" aria-pressed="false">
    <span class="filter-main"><span>${esc(label)}</span></span><span class="filter-state" aria-hidden="true"></span>
  </button>`;
}
function filterGroupHTML(group, title, options, optionRenderer){
  const choices = options.map(opt => optionRenderer(group, opt)).join('');
  return `<section class="filter-section">
    <h3>${esc(title)}</h3>
    <p class="filter-tip">Tap once to filter. Double-tap to exclude.</p>
    <div class="filter-options single-filter-options">${choices}</div>
  </section>`;
}
function buildFilterMenu(){
  const panel = $('filterPanel');
  if(!panel) return;
  const current = {};
  panel.querySelectorAll('.filter-choice').forEach(btn => {
    if(btn.dataset.state && btn.dataset.state !== 'none') current[`${btn.dataset.group}:${btn.dataset.value}`] = btn.dataset.state;
  });
  const all = gems();
  const crystalOptions = [...new Set(all.flatMap(crystalSystemsFromRecord))]
    .filter(Boolean)
    .sort((a,b)=>a.localeCompare(b))
    .map(value => ({ value, label:value.replace(/\b\w/g, c => c.toUpperCase()) }));
  const transparencyOptions = TRANSPARENCY_OPTIONS.map(opt => ({ value:opt.code, label:`${opt.code} — ${opt.label}` }));
  const colorOptions = COLOR_FIELDS.map(meta => ({ value:meta.value, label:meta.value, meta }));
  panel.innerHTML = `<div class="filter-head"><div><h2>Filter results</h2><p>One set of buttons per category: tap once to filter by a value, double-tap to exclude it.</p></div><button class="btn ghost" type="button" id="clearFilters">Clear</button></div>
    <div class="filter-body">
      ${filterGroupHTML('transparency', 'Transparency', transparencyOptions, (group, opt) => filterTileHTML(group, opt.value, opt.label, 'transp-filter-tile'))}
      ${filterGroupHTML('color', 'Color', colorOptions, (group, opt) => `<button class="filter-tile filter-choice color-filter-tile" type="button" data-group="${esc(group)}" data-value="${esc(opt.value)}" data-state="none" aria-pressed="false"><span class="filter-main">${swatchHTML(opt.meta)}<span>${esc(opt.label)}</span></span><span class="filter-state" aria-hidden="true"></span></button>`)}
      ${filterGroupHTML('crystal', 'Crystal System', crystalOptions, (group, opt) => filterTileHTML(group, opt.value, opt.label, 'crystal-filter-tile'))}
    </div>
    <div class="filter-actions"><button class="btn primary" type="button" id="doneFilters">Done</button></div>`;
  panel.querySelectorAll('.filter-choice').forEach(btn => {
    setFilterChoiceState(btn, current[`${btn.dataset.group}:${btn.dataset.value}`] || 'none');
    btn.addEventListener('click', handleFilterChoiceClick);
  });
  $('clearFilters')?.addEventListener('click', clearFilters);
  $('doneFilters')?.addEventListener('click', () => { $('filterMenu').open = false; });
  updateFilterSummary();
}
function render(){
  const pq=normalize($('primarySearch').value), nq=normalize($('notesSearch').value), sort=$('sortSelect').value;
  const riQuery = parseSearchNumber(pq);
  let list = gems().filter(rec => {
    const pOk = !pq || normalize(searchable(rec, primaryFields)).includes(pq) || refractiveIndexMatches(rec, riQuery);
    const nOk = !nq || normalize(searchable(rec, notesFields)).includes(nq);
    const menuOk = recordPassesMenuFilters(rec);
    return pOk && nOk && menuOk;
  });
  updateFilterSummary();
  list.sort((a,b)=> {
    if(sort==='hardness') return parseNum(b.Hardness)-parseNum(a.Hardness) || String(a.Species).localeCompare(b.Species);
    if(sort==='sg') return parseNum(b['Specific Gravity'])-parseNum(a['Specific Gravity']) || String(a.Species).localeCompare(b.Species);
    if(sort==='riRange'){
      const ar = refractiveIndexSortValue(a), br = refractiveIndexSortValue(b);
      return br.high - ar.high || br.low - ar.low || String(a.Species).localeCompare(b.Species);
    }
    return String(a.Species||'').localeCompare(String(b.Species||''));
  });
  $('countPill').textContent = `${list.length} of ${gems().length} gems shown`;
  const out=$('results');
  if(!list.length){ out.innerHTML='<div class="empty">No gems match those searches.</div>'; return; }
  out.innerHTML=list.map(rec=>{
    const topFields=['Transp.','Refractive Index Normal','Refractive Index Range','Refractive Index Birefri.','Optic Character','Crystal System','Specific Gravity','Hardness','Disp.'];
    const colorSwatches=colorMetaFromRecord(rec).map(c=>swatchHTML(c)).join('');
    const notes=notesFields.map(f=>fieldHTML(f, rec[f])).join('') || '<p class="help">No notes entered.</p>';
    return `<article class="card"><h2>${esc(rec.Species || 'Untitled gem')}${rec.__user?' <span class="pill">added</span>':''}</h2><div class="chem">${esc(rec['Chemical Comp.'] || '')}</div>${colorSwatches?`<div class="colors" aria-label="Gem colors">${colorSwatches}</div>`:''}<div class="fields">${topFields.map(f=>fieldHTML(f, rec[f])).join('')}</div><details class="notes"><summary>Notes fields</summary><div class="fields">${notes}</div></details></article>`;
  }).join('');
}
function colorToggleHTML(meta){
  return `<label class="toggle-tile color-toggle" title="${esc(meta.value)}">
    <input type="checkbox" name="${esc(meta.field)}" value="${esc(meta.value)}">
    ${swatchHTML(meta, true)}
    <span>${esc(meta.value)}</span>
  </label>`;
}
function transparencyToggleHTML(opt, name='Transp.'){
  return `<label class="toggle-tile transp-toggle" title="${esc(opt.label)}">
    <input type="radio" name="${esc(name)}" value="${esc(opt.code)}">
    <span class="transp-code">${esc(opt.display || opt.code || '—')}</span>
    <span>${esc(opt.label)}</span>
  </label>`;
}
function transparencyGroupHTML(title, name, allowNone=false){
  const none = allowNone ? [{ code:'', label:'None' }] : [];
  const options = none.concat(TRANSPARENCY_OPTIONS);
  return `<div class="transp-group"><h3>${esc(title)}</h3><div class="toggle-grid transp-toggle-grid">${options.map(opt => transparencyToggleHTML(opt, name)).join('')}</div></div>`;
}
function buildForm(){
  const holder=$('formFields');
  const preferred=['Species','Chemical Comp.','Color C','Color P','Color R','Color O','Color Y','Color G','Color B','Color V','Color B 2','Color W','Color G 2','Color B 3','Transp.','Refractive Index Normal','Refractive Index Range','Refractive Index Birefri.','Optic Character','Crystal System','Pleochroism 2','Pleochroism 3','Pleochroism S','Pleochroism M','Pleochroism W','Disp.','Specific Gravity','Hardness','Spectra (nm)','UV Fluorescence','Phenomena','Characteristics','Fracture/Cleavage'];
  const fields=[...new Set(preferred.filter(f=>allFields.includes(f)).concat(allFields.filter(f=>!preferred.includes(f))))];
  const used = new Set();
  const parts = ['<p class="help wide">Tip: colors and transparency are toggles. Notes fields are excluded from primary search and only searched by the notes box.</p>'];
  for(const f of fields){
    if(used.has(f)) continue;
    if(COLOR_FIELD_SET.has(f)){
      parts.push(`<fieldset class="wide toggle-field"><legend>Colors</legend><div class="toggle-grid color-toggle-grid">${COLOR_FIELDS.map(colorToggleHTML).join('')}</div><p class="help">C is clear. Br is brown, Gy is gray, and Bk is black.</p></fieldset>`);
      COLOR_FIELDS.forEach(c => used.add(c.field));
      continue;
    }
    if(f === 'Transp.'){
      used.add(f);
      parts.push(`<fieldset class="wide toggle-field transparency-field"><legend>Transparency</legend>${transparencyGroupHTML('Primary', '__TranspPrimary')}${transparencyGroupHTML('Secondary', '__TranspSecondary', true)}</fieldset>`);
      continue;
    }
    used.add(f);
    const wide = notesFields.includes(f) || f==='Chemical Comp.';
    const tag = wide ? 'textarea' : 'input';
    parts.push(`<label class="${wide?'wide':''}"><span>${esc(f)}</span><${tag} name="${esc(f)}" ${tag==='input'?'type="text"':''}></${tag}></label>`);
  }
  holder.innerHTML = parts.join('');
}
function addGemFromForm(ev){
  ev.preventDefault(); const fd=new FormData(ev.target); const rec={};
  const transpPrimary = String(fd.get('__TranspPrimary') || '').trim();
  const transpSecondary = String(fd.get('__TranspSecondary') || '').trim();
  const transpValue = transpPrimary && transpSecondary ? `${transpPrimary}-${transpSecondary}` : transpPrimary;
  if(transpValue) rec['Transp.'] = transpValue;
  for(const f of allFields){
    if(f === 'Transp.') continue;
    const v=String(fd.get(f)||'').trim();
    if(v) rec[f]=v;
  }
  if(!rec.Species){ showToast('Species is required.'); return; }
  rec.__colors = COLOR_FIELDS.filter(meta => rec[meta.field]).map(meta => meta.value);
  const items=userGems(); items.push(rec); const saved=saveUserGems(items); ev.target.reset(); $('gemDialog').close(); buildFilterMenu(); render(); showToast(saved ? 'Gem saved locally.' : 'Gem added for this session only: browser storage is unavailable.');
}
function exportJSON(){
  const blob = new Blob([JSON.stringify(gems(), null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='gem-search-data.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function rotateSubtitles(messages){
  const subtitle = $('subtitle');
  if(!subtitle || !messages.length) return;
  let index = Math.floor(Math.random() * messages.length);
  subtitle.textContent = messages[index];
  if(messages.length < 2) return;
  setInterval(() => {
    let next = Math.floor(Math.random() * messages.length);
    if(next === index) next = (next + 1) % messages.length;
    index = next;
    subtitle.textContent = messages[index];
  }, SUBTITLE_ROTATION_MS);
}
async function loadSubtitles(){
  const fallback = [$('subtitle')?.textContent || 'Local gem reference with separate primary and notes search.'];
  try{
    const response = await fetch(SUBTITLE_FILE, { cache:'no-cache' });
    if(!response.ok) throw new Error(`Subtitle file returned ${response.status}`);
    const text = await response.text();
    const messages = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    rotateSubtitles(messages.length ? messages : fallback);
  }catch(err){
    rotateSubtitles(fallback);
  }
}
['primarySearch','notesSearch','sortSelect'].forEach(id=>$(id).addEventListener('input', render));
$('addBtn').addEventListener('click', ()=>$('gemDialog').showModal()); $('closeDialog').addEventListener('click', ()=>$('gemDialog').close()); $('gemForm').addEventListener('submit', addGemFromForm); $('exportBtn').addEventListener('click', exportJSON);
buildForm(); buildFilterMenu(); render(); loadSubtitles(); if(!canStore){ showToast('Browser storage is unavailable; added gems will not persist after closing this page.'); } if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }

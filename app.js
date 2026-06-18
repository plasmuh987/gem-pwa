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
  { code:'T', label:'Transparent' },
  { code:'TP', label:'Translucent / transparent' },
  { code:'TL', label:'Translucent' },
  { code:'O', label:'Opaque' }
];

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
function render(){
  const pq=normalize($('primarySearch').value), nq=normalize($('notesSearch').value), sort=$('sortSelect').value;
  let list = gems().filter(rec => {
    const pOk = !pq || normalize(searchable(rec, primaryFields)).includes(pq);
    const nOk = !nq || normalize(searchable(rec, notesFields)).includes(nq);
    return pOk && nOk;
  });
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
function transparencyToggleHTML(opt){
  return `<label class="toggle-tile transp-toggle" title="${esc(opt.label)}">
    <input type="radio" name="Transp." value="${esc(opt.code)}">
    <span class="transp-code">${esc(opt.code)}</span>
    <span>${esc(opt.label)}</span>
  </label>`;
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
      parts.push(`<fieldset class="wide toggle-field"><legend>Transparency</legend><div class="toggle-grid transp-toggle-grid">${TRANSPARENCY_OPTIONS.map(transparencyToggleHTML).join('')}</div></fieldset>`);
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
  for(const f of allFields){
    const v=String(fd.get(f)||'').trim();
    if(v) rec[f]=v;
  }
  if(!rec.Species){ showToast('Species is required.'); return; }
  rec.__colors = COLOR_FIELDS.filter(meta => rec[meta.field]).map(meta => meta.value);
  const items=userGems(); items.push(rec); const saved=saveUserGems(items); ev.target.reset(); $('gemDialog').close(); render(); showToast(saved ? 'Gem saved locally.' : 'Gem added for this session only: browser storage is unavailable.');
}
function exportJSON(){
  const blob = new Blob([JSON.stringify(gems(), null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='gem-search-data.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
['primarySearch','notesSearch','sortSelect'].forEach(id=>$(id).addEventListener('input', render));
$('addBtn').addEventListener('click', ()=>$('gemDialog').showModal()); $('closeDialog').addEventListener('click', ()=>$('gemDialog').close()); $('gemForm').addEventListener('submit', addGemFromForm); $('exportBtn').addEventListener('click', exportJSON);
buildForm(); render(); if(!canStore){ showToast('Browser storage is unavailable; added gems will not persist after closing this page.'); } if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }

const MODULE = 'heartpulse_engine';
const PROMPT_ID = 'heartpulse_engine_context';
const META_KEY = 'heartpulse_engine_state_v1';

const REL_FIELDS = [
  ['trust', 'Доверие'], ['affection', 'Привязанность'], ['desire', 'Желание'],
  ['tenderness', 'Нежность'], ['jealousy', 'Ревность'], ['resentment', 'Обида'],
  ['irritation', 'Раздражение'], ['fear', 'Страх'], ['disappointment', 'Разочарование'],
  ['admiration', 'Восхищение'], ['joy', 'Веселье'], ['tension', 'Напряжение'],
  ['antipathy', 'Антипатия'], ['respect', 'Уважение']
];

const KINK_LIBRARY = [
  ['dominance','Доминирование'], ['bondage','Бондаж'], ['praise','Похвала'], ['teasing','Дразнение'],
  ['public','Публичность'], ['voyeurism','Вуайеризм'], ['risk','Риск'], ['spanking','Шлепки'],
  ['biting','Укусы'], ['hair','Волосы'], ['blindfold','Повязка'], ['mirrors','Зеркала'],
  ['toys','Игрушки'], ['roleplay','Ролевые игры'], ['slowburn','Slow burn'], ['aftercare','Aftercare'],
  ['initiative','Импульсивная инициатива'], ['dirtytalk','Грязные мысли/речь']
];

const CARD_KEYWORDS = {
  dominance: ['dominant','domination','доминир','власть','control'],
  bondage: ['bondage','бондаж','связ'], praise: ['praise','похвал'], teasing: ['tease','дразн'],
  public: ['public sex','публич','людном месте'], voyeurism: ['voyeur','вуайер'], risk: ['risk','опасн','на грани'],
  spanking: ['spank','шлеп'], biting: ['bite','укусы','куса'], hair: ['hair pull','волос'],
  blindfold: ['blindfold','повяз'], mirrors: ['mirror','зеркал'], toys: ['toy','игруш'],
  roleplay: ['roleplay','role play','ролевая'], slowburn: ['slow burn','медленн'], aftercare: ['aftercare'],
  initiative: ['initiative','impulsive','инициатив','импульсив'], dirtytalk: ['dirty talk','грязн']
};

const defaults = () => ({
  enabled: true,
  autoTrack: true,
  showToasts: true,
  relation: Object.fromEntries(REL_FIELDS.map(([k]) => [k, 0])),
  relationLabel: 'Не определено',
  lastShift: '',
  kinks: [],
  customKinks: [],
  kinkIntensity: 55,
  kinkChance: 35,
  intentions: [],
  npc: [],
  journal: [],
  manualDirective: '',
  oneShotDirective: '',
  injectRelation: true,
  injectKinks: true,
  injectIntentions: true,
  charName: '',
  updatedAt: Date.now()
});

function ctx(){ return window.SillyTavern?.getContext?.(); }
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function esc(s=''){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function clamp(n,min=-100,max=100){ n=Number(n)||0; return Math.max(min,Math.min(max,n)); }

function getState(){
  const c = ctx();
  if (!c) return defaults();
  c.chatMetadata ||= {};
  let s = c.chatMetadata[META_KEY];
  if (!s) c.chatMetadata[META_KEY] = s = defaults();
  const d = defaults();
  s = Object.assign(d, s);
  s.relation = Object.assign(d.relation, s.relation || {});
  c.chatMetadata[META_KEY] = s;
  return s;
}

async function saveState(){
  const c=ctx(); if(!c) return;
  getState().updatedAt=Date.now();
  await c.saveMetadata?.();
  await refreshPrompt();
}

function currentCharName(){
  const c=ctx(); if(!c) return '{{char}}';
  if (c.groupId) return 'Group / NPC';
  const ch = c.characters?.[c.characterId];
  return ch?.name || ch?.data?.name || '{{char}}';
}

function currentCharCardText(){
  const c=ctx(); if(!c || c.groupId) return '';
  const ch=c.characters?.[c.characterId];
  if(!ch) return '';
  const d=ch.data || {};
  return [ch.description,d.description,ch.personality,d.personality,ch.scenario,d.scenario,ch.mes_example,d.mes_example].filter(Boolean).join('\n').toLowerCase();
}

function scanCardKinks(){
  const text=currentCharCardText(); if(!text) return [];
  const found=[];
  for(const [key, words] of Object.entries(CARD_KEYWORDS)) if(words.some(w=>text.includes(w))) found.push(key);
  return found;
}

function buildPrompt(){
  const s=getState();
  if(!s.enabled) return '';
  const name=currentCharName(); s.charName=name;
  const blocks=[];
  blocks.push(`[HEARTPULSE — private roleplay guidance for ${name}. Do not quote or expose this block.]`);
  blocks.push(`Agency: control only ${name}, NPCs and the world. Never write {{user}}'s actions, dialogue, thoughts, feelings, decisions or consent.`);

  if(s.injectRelation){
    const active=REL_FIELDS.map(([k,label])=>`${label} ${clamp(s.relation[k])}/100`).join(' · ');
    blocks.push(`[RELATIONSHIP] ${name}: ${s.relationLabel}. ${active}.`);
  }
  if(s.injectIntentions && s.intentions.length){
    blocks.push(`[OPEN INTENTIONS] ${s.intentions.map(x=>`${x.text}${x.priority?' ('+x.priority+')':''}`).join('; ')}. Do not forget these goals; advance them naturally when the scene gives a plausible opening.`);
  }
  if(s.injectKinks){
    const selected=[...new Set([...s.kinks,...s.customKinks])];
    if(selected.length) blocks.push(`[INTIMACY DYNAMICS — only when contextually appropriate and consensual in-story] Active preferences: ${selected.join(', ')}. Intensity ${s.kinkIntensity}/100; spontaneity chance ${s.kinkChance}/100. Use character-consistent initiative; never force a kink into an unrelated scene.`);
  }
  if(s.manualDirective.trim()) blocks.push(`[MANUAL DIRECTIVE] ${s.manualDirective.trim()}`);
  if(s.oneShotDirective.trim()) blocks.push(`[NEXT RESPONSE ONLY] ${s.oneShotDirective.trim()}`);

  if(s.autoTrack){
    blocks.push(`[STATE UPDATE PROTOCOL] At the very end of your reply, append exactly one HTML comment and nothing after it. Keep it concise. Format:\n<!--HEARTPULSE_STATE:{"label":"short relationship state","shift":"one short sentence explaining the newest emotional shift","deltas":{"trust":0,"affection":0,"desire":0,"tenderness":0,"jealousy":0,"resentment":0,"irritation":0,"fear":0,"disappointment":0,"admiration":0,"joy":0,"tension":0,"antipathy":0,"respect":0},"intentions_add":[],"intentions_done":[],"npc":[]}-->\nUse only changes justified by the current reply. Deltas should normally be between -8 and +8; 0 if unchanged. Keep npc entries short.`);
  }
  return blocks.join('\n');
}

async function refreshPrompt(){
  const c=ctx(); if(!c?.setExtensionPrompt) return;
  const text=buildPrompt();
  await c.setExtensionPrompt(PROMPT_ID, text, text ? 1 : -1, 0, false, 0);
  renderModelPreview();
}

function toast(msg,type='info'){
  if(!getState().showToasts) return;
  if(window.toastr?.[type]) window.toastr[type](msg, 'HeartPulse ❤️‍🔥✨');
}

function applyStatePacket(packet){
  const s=getState();
  if(packet.label) s.relationLabel=String(packet.label).slice(0,100);
  if(packet.shift) s.lastShift=String(packet.shift).slice(0,300);
  if(packet.deltas && typeof packet.deltas==='object'){
    for(const [k] of REL_FIELDS) if(k in packet.deltas) s.relation[k]=clamp((s.relation[k]||0)+clamp(packet.deltas[k],-15,15));
  }
  for(const text of (packet.intentions_add||[])){
    const t=String(text).trim(); if(t && !s.intentions.some(x=>x.text===t)) s.intentions.push({id:crypto.randomUUID?.()||String(Date.now()+Math.random()),text:t,priority:'обычно'});
  }
  const done=new Set((packet.intentions_done||[]).map(x=>String(x).trim().toLowerCase()));
  if(done.size) s.intentions=s.intentions.filter(x=>!done.has(x.text.toLowerCase()));
  if(Array.isArray(packet.npc)) s.npc=packet.npc.slice(0,12);
  s.journal.unshift({ts:Date.now(),type:'shift',text:s.lastShift||'Эмоциональное состояние обновлено'});
  s.journal=s.journal.slice(0,80);
}

async function parseLatestModelState(){
  const c=ctx(); if(!c) return;
  const last=[...c.chat].reverse().find(m=>m && !m.is_user && typeof m.mes==='string');
  if(!last) return;
  const re=/<!--HEARTPULSE_STATE:(\{[\s\S]*?\})-->/;
  const m=last.mes.match(re); if(!m) return;
  try{
    const packet=JSON.parse(m[1]);
    applyStatePacket(packet);
    last.mes=last.mes.replace(re,'').trimEnd();
    await c.saveChat?.();
    await saveState();
    if(getState().lastShift) toast(getState().lastShift,'success');
    render();
  }catch(e){ console.warn('[HeartPulse] state packet parse failed',e); }
}

function panelHtml(){
  const s=getState(), name=esc(currentCharName());
  return `<div id="hpOverlay" class="hp-overlay hp-hidden"><div class="hp-panel">
    <header class="hp-head"><div><div class="hp-kicker">HEARTPULSE ENGINE · v0.1</div><h2>❤️‍🔥✨ ${name}</h2><p>Связь · искра · намерения · NPC · журнал</p></div><button class="hp-close">×</button></header>
    <nav class="hp-tabs">
      <button data-tab="pulse" class="active">💗 Пульс</button><button data-tab="spark">❤️‍🔥 Искра</button><button data-tab="intent">🎯 Намерения</button><button data-tab="npc">👥 NPC</button><button data-tab="journal">📜 Журнал</button><button data-tab="model">👁 Модель</button>
    </nav>
    <main class="hp-body">
      <section data-page="pulse" class="hp-page active"><div class="hp-soft-card"><h3>💞 Эмоциональная связь</h3><input id="hpRelationLabel" class="hp-input" value="${esc(s.relationLabel)}" placeholder="Например: хрупкая забота"><div class="hp-rel-grid">${REL_FIELDS.map(([k,l])=>`<label>${l}<b data-val="${k}">${clamp(s.relation[k])}</b><input class="hp-range" data-rel="${k}" type="range" min="-100" max="100" value="${clamp(s.relation[k])}"></label>`).join('')}</div>${s.lastShift?`<div class="hp-shift">✨ ${esc(s.lastShift)}</div>`:''}</div></section>
      <section data-page="spark" class="hp-page"><div class="hp-hot-card"><h3>❤️‍🔥 Искра / фетиши / кинки</h3><div class="hp-row"><label>Интенсивность <b>${s.kinkIntensity}</b><input id="hpIntensity" type="range" min="0" max="100" value="${s.kinkIntensity}"></label><label>Спонтанность <b>${s.kinkChance}</b><input id="hpChance" type="range" min="0" max="100" value="${s.kinkChance}"></label></div><div class="hp-chip-grid">${KINK_LIBRARY.map(([k,l])=>`<button class="hp-chip ${s.kinks.includes(k)?'on':''}" data-kink="${k}">${l}</button>`).join('')}</div><div class="hp-actions"><button id="hpScanCard">✨ Считать из карточки</button></div><textarea id="hpCustomKinks" class="hp-text" placeholder="Свои кинки — по одному с новой строки">${esc(s.customKinks.join('\n'))}</textarea></div></section>
      <section data-page="intent" class="hp-page"><div class="hp-gold-card"><h3>🎯 Незавершённые намерения</h3><div id="hpIntentList">${s.intentions.map(x=>`<div class="hp-intent" data-id="${esc(x.id)}"><span>${esc(x.text)}</span><button data-done="${esc(x.id)}">✓</button><button data-del="${esc(x.id)}">🗑</button></div>`).join('')||'<p class="hp-muted">Пока пусто.</p>'}</div><div class="hp-inline"><input id="hpIntentInput" class="hp-input" placeholder="Например: подарить кольцо в подходящий момент"><button id="hpIntentAdd">＋</button></div></div></section>
      <section data-page="npc" class="hp-page"><div class="hp-soft-card"><h3>👥 NPC</h3><p class="hp-muted">NPC из последнего структурного обновления модели.</p><div>${(s.npc||[]).map(n=>`<div class="hp-npc"><b>${esc(n.name||'NPC')}</b><span>${esc(n.state||n.note||'')}</span></div>`).join('')||'<p class="hp-muted">Нет активных NPC.</p>'}</div></div></section>
      <section data-page="journal" class="hp-page"><div class="hp-soft-card"><h3>📜 Журнал сдвигов</h3>${s.journal.map(j=>`<div class="hp-log"><time>${new Date(j.ts).toLocaleString()}</time><span>${esc(j.text)}</span></div>`).join('')||'<p class="hp-muted">Журнал пока пуст.</p>'}</div></section>
      <section data-page="model" class="hp-page"><div class="hp-model-card"><h3>👁 Что увидит модель</h3><div class="hp-switches"><label><input id="hpEnabled" type="checkbox" ${s.enabled?'checked':''}> включить расширение</label><label><input id="hpAutoTrack" type="checkbox" ${s.autoTrack?'checked':''}> авто-обновление одним обычным ответом</label><label><input id="hpInjectRel" type="checkbox" ${s.injectRelation?'checked':''}> отношения</label><label><input id="hpInjectKinks" type="checkbox" ${s.injectKinks?'checked':''}> искра</label><label><input id="hpInjectIntent" type="checkbox" ${s.injectIntentions?'checked':''}> намерения</label></div><textarea id="hpManual" class="hp-text" placeholder="Постоянное ручное указание">${esc(s.manualDirective)}</textarea><textarea id="hpOneShot" class="hp-text" placeholder="Только следующий ответ">${esc(s.oneShotDirective)}</textarea><pre id="hpModelPreview"></pre></div></section>
    </main>
  </div></div>`;
}

function renderModelPreview(){ const el=document.querySelector('#hpModelPreview'); if(el) el.textContent=buildPrompt()||'Ничего не отправляется.'; }
function render(){ const old=document.querySelector('#hpOverlay'); const open=old && !old.classList.contains('hp-hidden'); old?.remove(); document.body.insertAdjacentHTML('beforeend',panelHtml()); bind(); if(open) document.querySelector('#hpOverlay')?.classList.remove('hp-hidden'); renderModelPreview(); }

function bind(){
  const q=(s)=>document.querySelector(s);
  q('.hp-close')?.addEventListener('click',()=>q('#hpOverlay')?.classList.add('hp-hidden'));
  q('#hpOverlay')?.addEventListener('click',e=>{ if(e.target.id==='hpOverlay') q('#hpOverlay').classList.add('hp-hidden'); });
  document.querySelectorAll('.hp-tabs button').forEach(b=>b.addEventListener('click',()=>{ document.querySelectorAll('.hp-tabs button,.hp-page').forEach(x=>x.classList.remove('active')); b.classList.add('active'); q(`[data-page="${b.dataset.tab}"]`)?.classList.add('active'); renderModelPreview(); }));
  document.querySelectorAll('[data-rel]').forEach(r=>r.addEventListener('input',async()=>{ const s=getState(); s.relation[r.dataset.rel]=Number(r.value); document.querySelector(`[data-val="${r.dataset.rel}"]`).textContent=r.value; await saveState(); }));
  q('#hpRelationLabel')?.addEventListener('change',async e=>{getState().relationLabel=e.target.value; await saveState();});
  document.querySelectorAll('[data-kink]').forEach(b=>b.addEventListener('click',async()=>{ const s=getState(),k=b.dataset.kink; s.kinks=s.kinks.includes(k)?s.kinks.filter(x=>x!==k):[...s.kinks,k]; b.classList.toggle('on'); await saveState(); }));
  q('#hpIntensity')?.addEventListener('change',async e=>{getState().kinkIntensity=Number(e.target.value); await saveState(); render();});
  q('#hpChance')?.addEventListener('change',async e=>{getState().kinkChance=Number(e.target.value); await saveState(); render();});
  q('#hpCustomKinks')?.addEventListener('change',async e=>{getState().customKinks=e.target.value.split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,50); await saveState();});
  q('#hpScanCard')?.addEventListener('click',async()=>{ const found=scanCardKinks(); const s=getState(); s.kinks=[...new Set([...s.kinks,...found])]; await saveState(); toast(found.length?`Найдено в карточке: ${found.length}`:'Явных совпадений в карточке не найдено'); render(); });
  q('#hpIntentAdd')?.addEventListener('click',async()=>{ const t=q('#hpIntentInput').value.trim(); if(!t)return; getState().intentions.push({id:crypto.randomUUID?.()||String(Date.now()),text:t,priority:'обычно'}); await saveState(); render(); });
  document.querySelectorAll('[data-done],[data-del]').forEach(b=>b.addEventListener('click',async()=>{ const id=b.dataset.done||b.dataset.del; const s=getState(); const hit=s.intentions.find(x=>x.id===id); s.intentions=s.intentions.filter(x=>x.id!==id); if(b.dataset.done && hit){s.journal.unshift({ts:Date.now(),type:'done',text:`Цель завершена: ${hit.text}`}); toast(`Цель завершена: ${hit.text}`,'success');} await saveState(); render(); }));
  [['#hpEnabled','enabled'],['#hpAutoTrack','autoTrack'],['#hpInjectRel','injectRelation'],['#hpInjectKinks','injectKinks'],['#hpInjectIntent','injectIntentions']].forEach(([id,key])=>q(id)?.addEventListener('change',async e=>{getState()[key]=e.target.checked; await saveState(); renderModelPreview();}));
  q('#hpManual')?.addEventListener('change',async e=>{getState().manualDirective=e.target.value; await saveState();});
  q('#hpOneShot')?.addEventListener('change',async e=>{getState().oneShotDirective=e.target.value; await saveState();});
}

function ensureButton(){
  if(document.querySelector('#hpFab')) return;
  const b=document.createElement('button'); b.id='hpFab'; b.className='hp-fab'; b.innerHTML='<span>❤️‍🔥</span><i>✨</i>'; b.title='HeartPulse Engine';
  b.addEventListener('click',()=>{ const o=document.querySelector('#hpOverlay'); if(!o) render(); document.querySelector('#hpOverlay')?.classList.toggle('hp-hidden'); renderModelPreview(); });
  document.body.appendChild(b);
}

async function init(){
  const c=ctx(); if(!c){ setTimeout(init,800); return; }
  ensureButton(); render(); await refreshPrompt();
  const {eventSource,event_types}=c;
  eventSource?.on(event_types.CHAT_CHANGED, async()=>{ render(); await refreshPrompt(); });
  eventSource?.on(event_types.CHARACTER_EDITED, refreshPrompt);
  eventSource?.on(event_types.MESSAGE_SENT, async()=>{ await refreshPrompt(); });
  eventSource?.on(event_types.MESSAGE_RECEIVED, async()=>{ setTimeout(parseLatestModelState,80); });
  eventSource?.on(event_types.GENERATION_ENDED, async()=>{
    const s=getState();
    if(s.oneShotDirective){ s.oneShotDirective=''; await saveState(); render(); }
  });
  console.log('[HeartPulse] loaded');
}

init();

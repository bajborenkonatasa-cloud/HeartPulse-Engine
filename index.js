import { setExtensionPrompt, extension_prompt_types, eventSource, event_types } from '../../../../script.js';
import { getContext } from '../../../extensions.js';

const MODULE = 'heartpulse_engine';
const PROMPT_ID = 'heartpulse_engine_context';
const META_KEY = 'heartpulse_engine_state_v2';
const BACKUP_PREFIX = 'heartpulse_engine_backup_v2:';
const UI_KEY = 'heartpulse_engine_ui_v3';

const REL_FIELDS = [
  ['trust', 'Доверие'], ['affection', 'Привязанность'], ['desire', 'Желание'],
  ['tenderness', 'Нежность'], ['jealousy', 'Ревность'], ['resentment', 'Обида'],
  ['irritation', 'Раздражение'], ['fear', 'Страх'], ['disappointment', 'Разочарование'],
  ['admiration', 'Восхищение'], ['joy', 'Веселье'], ['tension', 'Напряжение'],
  ['antipathy', 'Антипатия'], ['respect', 'Уважение']
];

const CORE_REL_KEYS = new Set(['trust','affection','desire','tension','jealousy','resentment']);

const KINK_LIBRARY = [
  ['dominance','Доминирование'], ['bondage','Бондаж'], ['praise','Похвала'], ['teasing','Дразнение'],
  ['public','Публичный риск'], ['voyeurism','Вуайеризм'], ['risk','Риск / запретность'], ['spanking','Шлепки'],
  ['biting','Укусы'], ['hair','Волосы'], ['blindfold','Повязка'], ['mirrors','Зеркала'],
  ['toys','Игрушки'], ['roleplay','Ролевые игры'], ['slowburn','Slow burn'], ['aftercare','Aftercare'],
  ['initiative','Импульсивная инициатива'], ['dirtytalk','Грязные мысли / речь']
];
const KINK_LABEL = Object.fromEntries(KINK_LIBRARY);

const CARD_KEYWORDS = {
  dominance: ['dominant','domination','dominance','controlling','take control','power play','доминир','власть','контролир','подчин','ведущая роль'],
  bondage: ['bondage','restrain','restraint','tie up','ropes','bound','бондаж','связ','верев','фиксац'],
  praise: ['praise kink','praise','good girl','good boy','похвал','умница','хорошая девочка','хороший мальчик'],
  teasing: ['tease','teasing','provok','дразн','провоцир','поддразн'],
  public: ['public sex','public place','semi-public','getting caught','caught','public risk','публич','людном месте','в примерочной','риск быть замечен','могут увидеть'],
  voyeurism: ['voyeur','watching','being watched','вуайер','наблюдать за секс','подглядыв'],
  risk: ['risk','forbidden','taboo','danger of being caught','опасн','на грани','запретн','риск быть пойман'],
  spanking: ['spank','spanking','slap ass','шлеп','шлёп','по заднице'],
  biting: ['bite','biting','nibble','укусы','куса','прикус'],
  hair: ['hair pull','pulling hair','grab hair','волос','за волосы'],
  blindfold: ['blindfold','eyes covered','повяз','завязанные глаза'],
  mirrors: ['mirror sex','mirrors','in front of a mirror','зеркал'],
  toys: ['sex toy','toys','vibrator','dildo','игрушк','вибратор'],
  roleplay: ['roleplay','role play','costume play','ролевая игра','ролевые игры'],
  slowburn: ['slow burn','slowburn','gradual intimacy','медленн','постепенное сближение'],
  aftercare: ['aftercare','care after','после близости','забота после'],
  initiative: ['initiative','impulsive','spontaneous touch','takes initiative','инициатив','импульсив','спонтанно','сам начинает'],
  dirtytalk: ['dirty talk','dirty thoughts','explicit talk','грязн','пошлые мысли','пошлая речь']
};

const CONTEXT_HINTS = {
  public: ['примероч','лифт','машин','авто','парк','пляж','улиц','офис','кабинет','ресторан','бар','клуб','балкон','public','fitting room','elevator','car','park','beach','street','office','restaurant'],
  mirrors: ['зеркал','mirror'],
  hair: ['волос','hair'],
  blindfold: ['повяз','blindfold'],
  bondage: ['верев','связ','наруч','rope','bondage','cuffs'],
  roleplay: ['костюм','маскарад','роль','roleplay','costume'],
  teasing: ['дразн','флирт','teas','flirt'],
  praise: ['хвал','умница','горд','praise','good girl','good boy'],
  risk: ['запрет','опасн','могут увидеть','кто-то войдет','caught','forbidden','risk'],
  initiative: ['тишин','пауза','смотрит','близко','рядом','silence','pause','close'],
  biting: ['шея','плеч','neck','shoulder'],
  spanking: ['ягод','задниц','ass','hips'],
  dirtytalk: ['шеп','ухо','whisper','ear']
};

const defaults = () => ({
  enabled: true,
  autoTrack: true,
  showToasts: true,
  relation: Object.fromEntries(REL_FIELDS.map(([k]) => [k, 0])),
  relationLabel: 'Не определено',
  lastShift: '',
  kinks: [],                // постоянные предпочтения персонажа
  activeKinks: [],          // активны именно сейчас
  customKinks: [],
  kinkIntensity: 55,
  kinkChance: 35,
  autoSpark: true,
  sparkCooldown: 4,
  sparkCooldownRemaining: 0,
  lastSpark: '',
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

function ctx(){ try { return getContext?.() || globalThis.SillyTavern?.getContext?.() || {}; } catch(e){ console.warn('[HeartPulse] getContext failed', e); return {}; } }
function esc(s=''){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function clamp(n,min=-100,max=100){ n=Number(n)||0; return Math.max(min,Math.min(max,n)); }
function now(){ return Date.now(); }
function safeParse(s){ try{return JSON.parse(s);}catch{return null;} }
function makeId(){ return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; }
function stateMerge(raw){
  const d=defaults(), s=Object.assign(d, raw||{});
  s.relation=Object.assign({}, d.relation, raw?.relation||{});
  for(const key of ['kinks','activeKinks','customKinks','intentions','npc','journal']) if(!Array.isArray(s[key])) s[key]=[];
  return s;
}

function currentChatKey(){
  const c=ctx(); if(!c) return 'no-chat';
  const char = c.groupId ? `group-${c.groupId}` : `char-${c.characterId ?? 'none'}`;
  const chat = c.chatId || c.chatFile || c.chatMetadata?.chat_id || c.chatMetadata?.chatId || c.chatMetadata?.file_name || c.chatMetadata?.name || 'current';
  return `${char}:${String(chat)}`.replace(/[^a-zA-Z0-9_.:-]/g,'_').slice(0,220);
}
function backupKey(){ return BACKUP_PREFIX + currentChatKey(); }
function readBackup(){ return safeParse(localStorage.getItem(backupKey())||''); }
function writeBackup(state){ try{ localStorage.setItem(backupKey(), JSON.stringify(state)); }catch(e){ console.warn('[HeartPulse] backup failed',e); } }
function readUi(){ return Object.assign({showFab:true,x:null,y:112,extrasOpen:false}, safeParse(localStorage.getItem(UI_KEY)||'')||{}); }
function saveUi(ui){ try{ localStorage.setItem(UI_KEY,JSON.stringify(ui)); }catch{} }

function getState(){
  const c=ctx();
  const backup = readBackup();
  let meta = null;
  try{
    if(c?.chatMetadata && typeof c.chatMetadata === 'object') meta = c.chatMetadata[META_KEY] || null;
  }catch(e){ console.warn('[HeartPulse] chatMetadata read failed; using local backup',e); }
  let chosen = meta;
  if(!chosen && backup) chosen=backup;
  else if(chosen && backup && Number(backup.updatedAt||0) > Number(chosen.updatedAt||0)) chosen=backup;
  const s=stateMerge(chosen);
  try{
    if(c?.chatMetadata && typeof c.chatMetadata === 'object') c.chatMetadata[META_KEY]=s;
  }catch(e){ console.warn('[HeartPulse] chatMetadata write failed; local backup will be used',e); }
  return s;
}

async function saveState(){
  const c=ctx();
  const s=getState(); s.updatedAt=now();
  writeBackup(s);
  if(c){
    try{ await c.saveMetadata?.(); }catch(e){ console.warn('[HeartPulse] metadata save failed; backup kept',e); }
  }
  await refreshPrompt();
}

function currentCharName(){
  const c=ctx(); if(!c) return '{{char}}';
  if(c.groupId) return 'Group / NPC';
  const ch=c.characters?.[c.characterId];
  return ch?.name || ch?.data?.name || '{{char}}';
}
function currentCharCardText(){
  const c=ctx(); if(!c || c.groupId) return '';
  const ch=c.characters?.[c.characterId]; if(!ch) return '';
  const d=ch.data||{};
  return [ch.description,d.description,ch.personality,d.personality,ch.scenario,d.scenario,ch.mes_example,d.mes_example,d.creator_notes].filter(Boolean).join('\n').toLowerCase();
}
function scanCardKinks(){
  const text=currentCharCardText(); if(!text) return [];
  const found=[];
  for(const [key,words] of Object.entries(CARD_KEYWORDS)) if(words.some(w=>text.includes(w))) found.push(key);
  return found;
}
function recentChatText(limit=8){
  const c=ctx(); if(!c?.chat) return '';
  return c.chat.slice(-limit).map(m=>m?.mes||'').join('\n').toLowerCase();
}
function detectContextualKinks(prefKeys){
  const text=recentChatText(8); if(!text) return [];
  return prefKeys.filter(k=>(CONTEXT_HINTS[k]||[]).some(w=>text.includes(w)));
}
function maybePrepareAutoSpark(){
  const s=getState();
  if(!s.autoSpark || !s.injectKinks || !s.enabled) return '';
  if(s.sparkCooldownRemaining>0){ s.sparkCooldownRemaining--; return ''; }
  const prefs=[...new Set(s.kinks)];
  if(!prefs.length) return '';
  const contextual=detectContextualKinks(prefs);
  const pool=contextual.length ? contextual : (Number(s.relation.desire)>35 || Number(s.relation.tension)>45 ? prefs : []);
  if(!pool.length) return '';
  const roll=Math.random()*100;
  if(roll>clamp(s.kinkChance,0,100)) return '';
  const picked=pool[Math.floor(Math.random()*pool.length)];
  s.sparkCooldownRemaining=Math.max(1,Number(s.sparkCooldown)||4);
  s.lastSpark=KINK_LABEL[picked]||picked;
  s.updatedAt=now(); writeBackup(s);
  return `[AUTO SPARK — next reply only] Current context plausibly activates: ${KINK_LABEL[picked]||picked}. Let it influence ${currentCharName()}'s initiative subtly and character-consistently. Do not force escalation; if the moment is not appropriate, keep it as tension, flirtation, a thought, or a small gesture instead.`;
}

function buildPrompt({includeAutoSpark=false}={}){
  const s=getState(); if(!s.enabled) return '';
  const name=currentCharName(); s.charName=name;
  const blocks=[];
  blocks.push(`[HEARTPULSE — private roleplay guidance for ${name}. Do not quote or expose this block.]`);
  blocks.push(`Agency: control only ${name}, NPCs and the world. Never write {{user}}'s actions, dialogue, thoughts, feelings, decisions or consent.`);
  if(s.injectRelation){
    const active=REL_FIELDS.map(([k,label])=>`${label} ${clamp(s.relation[k])}/100`).join(' · ');
    blocks.push(`[RELATIONSHIP STATE] ${name}: ${s.relationLabel}. ${active}. Treat these values as continuity cues, not mandatory behavior. Let the current scene and character remain primary.`);
  }
  if(s.injectIntentions && s.intentions.length){
    blocks.push(`[OPEN INTENTIONS] ${s.intentions.map(x=>`${x.text}${x.priority?' ('+x.priority+')':''}`).join('; ')}. Keep these plans alive across replies and advance them naturally when a plausible opportunity appears.`);
  }
  if(s.injectKinks){
    const prefs=[...new Set([...s.kinks,...s.customKinks])];
    const active=[...new Set(s.activeKinks)];
    if(prefs.length) blocks.push(`[INTIMACY PROFILE — preference, not an order] Preferences: ${prefs.map(k=>KINK_LABEL[k]||k).join(', ')}. Intensity ${s.kinkIntensity}/100. Use only when contextually appropriate and consistent with the established relationship and scene.`);
    if(active.length) blocks.push(`[ACTIVE SPARK — current scene] Prioritize subtly: ${active.map(k=>KINK_LABEL[k]||k).join(', ')}. Do not force unrelated escalation.`);
    if(includeAutoSpark){ const auto=maybePrepareAutoSpark(); if(auto) blocks.push(auto); }
  }
  if(s.manualDirective.trim()) blocks.push(`[MANUAL DIRECTIVE] ${s.manualDirective.trim()}`);
  if(s.oneShotDirective.trim()) blocks.push(`[NEXT RESPONSE ONLY] ${s.oneShotDirective.trim()}`);
  if(s.autoTrack){
    blocks.push(`[HEARTPULSE STATE UPDATE — hidden bookkeeping] At the very end of your reply append exactly one HTML comment and nothing after it. Update only what genuinely changed in THIS reply; omit unchanged emotion keys to keep it short. Format:
<!--HEARTPULSE_STATE:{"label":"short relationship state","shift":"one short sentence","deltas":{"trust":2,"tension":-1},"intentions_add":[],"intentions_done":[],"npc":[]}-->
Allowed delta keys: ${REL_FIELDS.map(([k])=>k).join(', ')}. Typical delta is -5..+5; use larger only for a major event. intentions_add contains durable plans ${name} should remember and pursue later; intentions_done contains exact plan texts completed or abandoned. Keep npc entries short. This comment is metadata, not prose.`);
  }
  return blocks.join('\n');
}

async function refreshPrompt(opts={}){
  const text=buildPrompt(opts);
  try{
    setExtensionPrompt(PROMPT_ID, text || '', extension_prompt_types.IN_CHAT, 0);
  }catch(e){
    console.error('[HeartPulse] setExtensionPrompt failed', e);
  }
  renderModelPreview();
}
function toast(msg,type='info'){ if(getState().showToasts && window.toastr?.[type]) window.toastr[type](msg,'HeartPulse ❤️‍🔥✨'); }

function applyStatePacket(packet){
  const s=getState();
  if(packet.label) s.relationLabel=String(packet.label).slice(0,100);
  if(packet.shift) s.lastShift=String(packet.shift).slice(0,300);
  if(packet.deltas&&typeof packet.deltas==='object') for(const [k] of REL_FIELDS) if(k in packet.deltas) s.relation[k]=clamp((s.relation[k]||0)+clamp(packet.deltas[k],-15,15));
  for(const text of (packet.intentions_add||[])){ const t=String(text).trim(); if(t&&!s.intentions.some(x=>x.text===t)) s.intentions.push({id:makeId(),text:t,priority:'обычно'}); }
  const done=new Set((packet.intentions_done||[]).map(x=>String(x).trim().toLowerCase()));
  if(done.size) s.intentions=s.intentions.filter(x=>!done.has(x.text.toLowerCase()));
  if(Array.isArray(packet.npc)) s.npc=packet.npc.slice(0,12);
  s.journal.unshift({ts:now(),type:'shift',text:s.lastShift||'Эмоциональное состояние обновлено'}); s.journal=s.journal.slice(0,80);
}
async function parseLatestModelState(){
  const c=ctx(); if(!c) return;
  const last=[...c.chat].reverse().find(m=>m&&!m.is_user&&typeof m.mes==='string'); if(!last) return;
  const re=/<!--HEARTPULSE_STATE:(\{[\s\S]*?\})-->/; const m=last.mes.match(re); if(!m) return;
  try{ applyStatePacket(JSON.parse(m[1])); last.mes=last.mes.replace(re,'').trimEnd(); await c.saveChat?.(); await saveState(); if(getState().lastShift) toast(getState().lastShift,'success'); render(); }
  catch(e){ console.warn('[HeartPulse] state packet parse failed',e); }
}

function panelHtml(){
  const s=getState(), name=esc(currentCharName()), ui=readUi();
  const prefSet=new Set(s.kinks), activeSet=new Set(s.activeKinks);
  return `<div id="hpOverlay" class="hp-overlay hp-hidden"><div id="hpPanel" class="hp-panel">
    <header class="hp-head"><div><div class="hp-kicker">HEARTPULSE ENGINE · v0.5.1</div><h2>❤️‍🔥✨ ${name}</h2><p>Связь · искра · намерения · NPC · журнал</p></div><button class="hp-close">×</button></header>
    <nav class="hp-tabs"><button data-tab="pulse" class="active">💗 Пульс</button><button data-tab="spark">❤️‍🔥 Искра</button><button data-tab="intent">🎯 Намерения</button><button data-tab="npc">👥 NPC</button><button data-tab="journal">📜 Журнал</button><button data-tab="model">👁 Модель</button></nav>
    <main class="hp-body">
      <section data-page="pulse" class="hp-page active"><div class="hp-soft-card"><h3>💞 Эмоциональная связь</h3><div class="hp-auto-status ${s.autoTrack?'on':''}">${s.autoTrack?'🤖 Авто-динамика включена: модель предложит только реальные изменения после ответа. Ползунки обновятся сами.':'🖐️ Авто-динамика выключена: значения меняешь ты вручную.'}</div><input id="hpRelationLabel" class="hp-input" value="${esc(s.relationLabel)}" placeholder="Например: хрупкая забота"><div class="hp-rel-grid hp-rel-core">${REL_FIELDS.filter(([k])=>CORE_REL_KEYS.has(k)).map(([k,l])=>`<label>${l}<b data-val="${k}">${clamp(s.relation[k])}</b><input class="hp-range" data-rel="${k}" type="range" min="-100" max="100" value="${clamp(s.relation[k])}"></label>`).join('')}</div><details id="hpExtraFeelings" class="hp-extra-feelings" ${ui.extrasOpen?'open':''}><summary>✨ Дополнительные чувства (${REL_FIELDS.length-CORE_REL_KEYS.size})</summary><div class="hp-rel-grid">${REL_FIELDS.filter(([k])=>!CORE_REL_KEYS.has(k)).map(([k,l])=>`<label>${l}<b data-val="${k}">${clamp(s.relation[k])}</b><input class="hp-range" data-rel="${k}" type="range" min="-100" max="100" value="${clamp(s.relation[k])}"></label>`).join('')}</div></details>${s.lastShift?`<div class="hp-shift">✨ Последний сдвиг: ${esc(s.lastShift)}</div>`:''}<p class="hp-muted hp-tip">Можно ничего не двигать руками. Ползунки — это ещё и ручная коррекция: если модель оценила чувство не так, просто поправь значение.</p></div></section>
      <section data-page="spark" class="hp-page"><div class="hp-hot-card"><h3>❤️‍🔥 Искра / кинки</h3><div class="hp-row"><label>Интенсивность <b>${s.kinkIntensity}</b><input id="hpIntensity" type="range" min="0" max="100" value="${s.kinkIntensity}"></label><label>Шанс авто-искра <b>${s.kinkChance}%</b><input id="hpChance" type="range" min="0" max="100" value="${s.kinkChance}"></label></div>
      <div class="hp-subtitle">Постоянные предпочтения персонажа</div><div class="hp-chip-grid">${KINK_LIBRARY.map(([k,l])=>`<button class="hp-chip ${prefSet.has(k)?'on':''}" data-kink="${k}">${l}</button>`).join('')}</div>
      <div class="hp-actions"><button id="hpScanCard">✨ Проверить карточку бесплатно</button></div><p class="hp-muted">Сканирование локальное: API не вызывается. Найденное сначала покажем тебе, и только потом добавим.</p>
      <div class="hp-subtitle">Активно именно в этой сцене</div><div class="hp-chip-grid hp-active-grid">${KINK_LIBRARY.map(([k,l])=>`<button class="hp-chip scene ${activeSet.has(k)?'on':''}" data-active-kink="${k}">${l}</button>`).join('')}</div>
      <textarea id="hpCustomKinks" class="hp-text" placeholder="Свои предпочтения — по одному с новой строки">${esc(s.customKinks.join('\n'))}</textarea>
      <div class="hp-auto-box"><label><input id="hpAutoSpark" type="checkbox" ${s.autoSpark?'checked':''}> 🎲 Авто-искра без отдельного API-запроса</label><label>Пауза после срабатывания: <input id="hpCooldown" class="hp-mini-input" type="number" min="1" max="12" value="${s.sparkCooldown}"> ответов</label><div class="hp-muted">${s.lastSpark?`Последняя авто-искра: ${esc(s.lastSpark)} · осталось паузы ${s.sparkCooldownRemaining}`:'Авто-искра ещё не срабатывала.'}</div></div></div></section>
      <section data-page="intent" class="hp-page"><div class="hp-gold-card"><h3>🎯 Незавершённые намерения</h3><div id="hpIntentList">${s.intentions.map(x=>`<div class="hp-intent" data-id="${esc(x.id)}"><span>${esc(x.text)}</span><button data-done="${esc(x.id)}">✓</button><button data-del="${esc(x.id)}">🗑</button></div>`).join('')||'<p class="hp-muted">Пока пусто.</p>'}</div><div class="hp-inline"><input id="hpIntentInput" class="hp-input" placeholder="Например: подарить кольцо в подходящий момент"><button id="hpIntentAdd">＋</button></div></div></section>
      <section data-page="npc" class="hp-page"><div class="hp-soft-card"><h3>👥 NPC</h3><p class="hp-muted">NPC из последнего структурного обновления модели.</p><div>${(s.npc||[]).map(n=>`<div class="hp-npc"><b>${esc(n.name||'NPC')}</b><span>${esc(n.state||n.note||'')}</span></div>`).join('')||'<p class="hp-muted">Нет активных NPC.</p>'}</div></div></section>
      <section data-page="journal" class="hp-page"><div class="hp-soft-card"><h3>📜 Журнал сдвигов</h3>${s.journal.map(j=>`<div class="hp-log"><time>${new Date(j.ts).toLocaleString()}</time><span>${esc(j.text)}</span></div>`).join('')||'<p class="hp-muted">Журнал пока пуст.</p>'}</div></section>
      <section data-page="model" class="hp-page"><div class="hp-model-card"><h3>👁 Что увидит модель</h3><div class="hp-switches"><label><input id="hpEnabled" type="checkbox" ${s.enabled?'checked':''}> включить расширение</label><label><input id="hpAutoTrack" type="checkbox" ${s.autoTrack?'checked':''}> авто-обновление</label><label><input id="hpInjectRel" type="checkbox" ${s.injectRelation?'checked':''}> отношения</label><label><input id="hpInjectKinks" type="checkbox" ${s.injectKinks?'checked':''}> искра</label><label><input id="hpInjectIntent" type="checkbox" ${s.injectIntentions?'checked':''}> намерения</label><label><input id="hpShowFab" type="checkbox" ${ui.showFab?'checked':''}> плавающая кнопка</label></div><textarea id="hpManual" class="hp-text" placeholder="Постоянное ручное указание">${esc(s.manualDirective)}</textarea><textarea id="hpOneShot" class="hp-text" placeholder="Только следующий ответ">${esc(s.oneShotDirective)}</textarea><pre id="hpModelPreview"></pre></div></section>
    </main></div></div>`;
}
function renderModelPreview(){ const el=document.querySelector('#hpModelPreview'); if(el) el.textContent=buildPrompt({includeAutoSpark:false})||'Ничего не отправляется.'; }
function emergencyOverlay(error){
  let box=document.querySelector('#hpEmergency');
  if(!box){
    box=document.createElement('div');
    box.id='hpEmergency';
    box.className='hp-emergency';
    box.innerHTML=`<div class="hp-emergency-card"><b>❤️‍🔥 HeartPulse — ошибка панели</b><button type="button" class="hp-emergency-close">×</button><pre id="hpEmergencyText"></pre></div>`;
    document.body.appendChild(box);
    box.querySelector('.hp-emergency-close')?.addEventListener('click',()=>box.remove());
  }
  const text=box.querySelector('#hpEmergencyText');
  if(text) text.textContent=String(error?.stack || error?.message || error || 'Unknown error');
  box.style.display='block';
}
function render(){
  try{
    const old=document.querySelector('#hpOverlay');
    const wasOpen=old && !old.classList.contains('hp-hidden');
    old?.remove();
    document.body.insertAdjacentHTML('beforeend',panelHtml());
    bind();
    const overlay=document.querySelector('#hpOverlay');
    if(wasOpen) overlay?.classList.remove('hp-hidden');
    try{ renderModelPreview(); }catch(e){ console.error('[HeartPulse] preview refresh failed',e); }
    syncFabVisibility();
    return true;
  }catch(e){
    console.error('[HeartPulse] render failed',e);
    emergencyOverlay(e);
    return false;
  }
}
function openPanel(){
  try{
    let overlay=document.querySelector('#hpOverlay');
    if(!overlay){
      if(!ensurePanel()) throw new Error('HeartPulse panel was not created');
      overlay=document.querySelector('#hpOverlay');
    }
    if(!overlay) throw new Error('HeartPulse overlay was not created');
    overlay.classList.remove('hp-hidden');
    overlay.style.setProperty('display','flex','important');
    requestAnimationFrame(()=>{ try{ renderModelPreview(); }catch(e){ console.error('[HeartPulse] preview refresh failed',e); } });
    console.log('[HeartPulse] panel opened');
  }catch(e){
    console.error('[HeartPulse] openPanel failed',e);
    emergencyOverlay(e);
  }
}
function closePanel(){
  const overlay=document.querySelector('#hpOverlay');
  if(!overlay) return;
  overlay.classList.add('hp-hidden');
  overlay.style.removeProperty('display');
}
function installGlobalOpenDelegation(){ return; }

async function confirmScan(found){
  if(!found.length){ toast('Явных совпадений в карточке не найдено'); return false; }
  const labels=found.map(k=>`• ${KINK_LABEL[k]||k}`).join('\n');
  const c=ctx();
  if(c?.Popup?.show?.confirm){
    const res=await c.Popup.show.confirm('HeartPulse: найдено в карточке',`${labels}\n\nДобавить эти предпочтения?`);
    return res===c.POPUP_RESULT?.AFFIRMATIVE || res===1 || res===true;
  }
  return window.confirm(`Найдено в карточке:\n${labels}\n\nДобавить эти предпочтения?`);
}

function bind(){
  const q=(s)=>document.querySelector(s);
  q('.hp-close')?.addEventListener('click',closePanel);
  document.querySelectorAll('.hp-tabs button').forEach(b=>b.addEventListener('click',()=>{ document.querySelectorAll('.hp-tabs button,.hp-page').forEach(x=>x.classList.remove('active')); b.classList.add('active'); q(`[data-page="${b.dataset.tab}"]`)?.classList.add('active'); renderModelPreview(); }));
  q('#hpExtraFeelings')?.addEventListener('toggle',e=>{ const ui=readUi(); ui.extrasOpen=e.target.open; saveUi(ui); });
  document.querySelectorAll('[data-rel]').forEach(r=>r.addEventListener('input',()=>{ const s=getState(); s.relation[r.dataset.rel]=Number(r.value); document.querySelector(`[data-val="${r.dataset.rel}"]`).textContent=r.value; writeBackup(s); }));
  document.querySelectorAll('[data-rel]').forEach(r=>r.addEventListener('change',saveState));
  q('#hpRelationLabel')?.addEventListener('change',async e=>{getState().relationLabel=e.target.value; await saveState();});
  document.querySelectorAll('[data-kink]').forEach(b=>b.addEventListener('click',async()=>{ const s=getState(),k=b.dataset.kink; s.kinks=s.kinks.includes(k)?s.kinks.filter(x=>x!==k):[...s.kinks,k]; b.classList.toggle('on'); await saveState(); }));
  document.querySelectorAll('[data-active-kink]').forEach(b=>b.addEventListener('click',async()=>{ const s=getState(),k=b.dataset.activeKink; s.activeKinks=s.activeKinks.includes(k)?s.activeKinks.filter(x=>x!==k):[...s.activeKinks,k]; b.classList.toggle('on'); await saveState(); }));
  q('#hpIntensity')?.addEventListener('change',async e=>{getState().kinkIntensity=Number(e.target.value); await saveState(); render();});
  q('#hpChance')?.addEventListener('change',async e=>{getState().kinkChance=Number(e.target.value); await saveState(); render();});
  q('#hpCooldown')?.addEventListener('change',async e=>{getState().sparkCooldown=clamp(Number(e.target.value),1,12); await saveState();});
  q('#hpAutoSpark')?.addEventListener('change',async e=>{getState().autoSpark=e.target.checked; await saveState();});
  q('#hpCustomKinks')?.addEventListener('change',async e=>{getState().customKinks=e.target.value.split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,50); await saveState();});
  q('#hpScanCard')?.addEventListener('click',async()=>{ const found=scanCardKinks(); if(!(await confirmScan(found))) return; const s=getState(); s.kinks=[...new Set([...s.kinks,...found])]; await saveState(); toast(`Добавлено из карточки: ${found.length}`,'success'); render(); });
  q('#hpIntentAdd')?.addEventListener('click',async()=>{ const t=q('#hpIntentInput').value.trim(); if(!t)return; getState().intentions.push({id:makeId(),text:t,priority:'обычно'}); await saveState(); render(); });
  document.querySelectorAll('[data-done],[data-del]').forEach(b=>b.addEventListener('click',async()=>{ const id=b.dataset.done||b.dataset.del,s=getState(),hit=s.intentions.find(x=>x.id===id); s.intentions=s.intentions.filter(x=>x.id!==id); if(b.dataset.done&&hit){s.journal.unshift({ts:now(),type:'done',text:`Цель завершена: ${hit.text}`}); toast(`Цель завершена: ${hit.text}`,'success');} await saveState(); render(); }));
  [['#hpEnabled','enabled'],['#hpAutoTrack','autoTrack'],['#hpInjectRel','injectRelation'],['#hpInjectKinks','injectKinks'],['#hpInjectIntent','injectIntentions']].forEach(([id,key])=>q(id)?.addEventListener('change',async e=>{getState()[key]=e.target.checked; await saveState(); renderModelPreview();}));
  q('#hpManual')?.addEventListener('change',async e=>{getState().manualDirective=e.target.value; await saveState();});
  q('#hpOneShot')?.addEventListener('change',async e=>{getState().oneShotDirective=e.target.value; await saveState();});
  q('#hpShowFab')?.addEventListener('change',e=>{ const ui=readUi(); ui.showFab=e.target.checked; saveUi(ui); syncFabVisibility(); syncSettingsEntry(); });
}

function placeFab(){
  const b=document.querySelector('#hpFab'); if(!b) return;
  const ui=readUi(), pad=8, w=42, h=42;
  const maxX=Math.max(pad,window.innerWidth-w-pad), maxY=Math.max(pad,window.innerHeight-h-pad);
  const x=ui.x==null?maxX-8:Math.max(pad,Math.min(maxX,ui.x));
  const y=Math.max(pad,Math.min(maxY,ui.y??112));
  b.style.left=`${x}px`; b.style.top=`${y}px`; b.style.right='auto'; b.style.bottom='auto';
}
function syncFabVisibility(){ const b=document.querySelector('#hpFab'); if(b) b.style.display=readUi().showFab?'grid':'none'; }

function ensurePanel(){
  if(document.querySelector('#hpOverlay') && document.querySelector('#hpPanel')) return true;
  try{
    document.querySelector('#hpOverlay')?.remove();
    document.body.insertAdjacentHTML('beforeend',panelHtml());
    bind();
    try{ renderModelPreview(); }catch(e){ console.error('[HeartPulse] preview refresh failed',e); }
    return !!document.querySelector('#hpOverlay') && !!document.querySelector('#hpPanel');
  }catch(e){
    console.error('[HeartPulse] panel creation failed',e);
    emergencyOverlay(e);
    return false;
  }
}

function ensureButton(){
  let b=document.querySelector('#hpFab');
  if(!b){
    b=document.createElement('button');
    b.type='button';
    b.id='hpFab';
    b.className='hp-fab';
    b.innerHTML='<span>❤️‍🔥</span><i>✨</i>';
    b.title='HeartPulse Engine';
    b.setAttribute('aria-label','HeartPulse Engine');
    document.body.appendChild(b);
  }
  if(b.dataset.hpBound!=='1'){
    b.dataset.hpBound='1';
    let drag=null;
    b.addEventListener('pointerdown',e=>{
      if(e.button!==undefined && e.button!==0) return;
      const r=b.getBoundingClientRect();
      drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,offX:e.clientX-r.left,offY:e.clientY-r.top,moved:false};
      try{ b.setPointerCapture(e.pointerId); }catch{}
      b.classList.add('dragging');
      e.preventDefault();
    });
    b.addEventListener('pointermove',e=>{
      if(!drag || drag.id!==e.pointerId) return;
      const dx=e.clientX-drag.startX, dy=e.clientY-drag.startY;
      if(Math.hypot(dx,dy)>6) drag.moved=true;
      if(!drag.moved) return;
      const pad=8, w=b.offsetWidth||42, h=b.offsetHeight||42;
      const x=Math.max(pad,Math.min(window.innerWidth-w-pad,e.clientX-drag.offX));
      const y=Math.max(pad,Math.min(window.innerHeight-h-pad,e.clientY-drag.offY));
      b.style.left=`${x}px`; b.style.top=`${y}px`; b.style.right='auto'; b.style.bottom='auto';
      e.preventDefault();
    });
    const finish=e=>{
      if(!drag || drag.id!==e.pointerId) return;
      const wasMoved=drag.moved;
      drag=null; b.classList.remove('dragging');
      try{ b.releasePointerCapture(e.pointerId); }catch{}
      if(wasMoved){
        const r=b.getBoundingClientRect(), ui=readUi(); ui.x=Math.round(r.left); ui.y=Math.round(r.top); saveUi(ui);
      }else togglePanel();
      e.preventDefault(); e.stopPropagation();
    };
    b.addEventListener('pointerup',finish);
    b.addEventListener('pointercancel',e=>{ if(drag&&drag.id===e.pointerId){ drag=null; b.classList.remove('dragging'); placeFab(); } });
  }
  placeFab(); syncFabVisibility();
  return true;
}

function togglePanel(){
  let overlay=document.querySelector('#hpOverlay');
  if(!overlay){
    if(!ensurePanel()) return;
    overlay=document.querySelector('#hpOverlay');
  }
  if(!overlay) return;
  if(overlay.classList.contains('hp-hidden')) openPanel();
  else closePanel();
}

function registerWandMenuItem(){
  if(document.querySelector('#hpWandMenuItem')) return true;
  const menu=document.querySelector('#extensionsMenu');
  if(!menu) return false;
  const item=document.createElement('div');
  item.id='hpWandMenuItem';
  item.className='list-group-item flex-container flexGap5 interactable';
  item.tabIndex=0;
  item.innerHTML='<i class="fa-solid fa-heart-pulse"></i><span>HeartPulse Engine</span>';
  item.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); openPanel(); });
  menu.appendChild(item);
  return true;
}

function ensureSettingsEntry(){
  if(document.querySelector('#hpSettingsEntry')) return true;
  const host=document.querySelector('#extensions_settings2') || document.querySelector('#extensions_settings');
  if(!host) return false;
  const wrap=document.createElement('div');
  wrap.id='hpSettingsEntry';
  wrap.className='heartpulse-extension-settings';
  wrap.innerHTML=`
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>❤️‍🔥✨ HeartPulse Engine</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div class="hp-settings-mini">
          <button type="button" id="hpOpenFromSettings" class="menu_button">❤️‍🔥 Открыть HeartPulse</button>
          <label class="hp-settings-check"><input id="hpSettingsShowFab" type="checkbox"> Показывать плавающее сердце</label>
          <div class="hp-settings-note">Если сердце скрыто, HeartPulse всё равно можно открыть этой кнопкой или из меню 🪄.</div>
        </div>
      </div>
    </div>`;
  host.appendChild(wrap);
  const openBtn=wrap.querySelector('#hpOpenFromSettings');
  openBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel();});
  const cb=wrap.querySelector('#hpSettingsShowFab');
  if(cb){
    cb.checked=!!readUi().showFab;
    cb.addEventListener('change',e=>{const ui=readUi();ui.showFab=e.target.checked;saveUi(ui);syncFabVisibility();});
  }
  return true;
}
function syncSettingsEntry(){const cb=document.querySelector('#hpSettingsShowFab');if(cb)cb.checked=!!readUi().showFab;}

function safeOn(type,fn){
  try{ if(type) eventSource?.on?.(type,fn); }catch(e){ console.warn('[HeartPulse] event bind failed',type,e); }
}

let __hpInitialized=false;
function init(){
  // Same stability pattern as the user's working User Persona Studio / Fetish Manager:
  // build visible entry points first, then panel, then secondary logic.
  ensureButton();
  ensureSettingsEntry();
  registerWandMenuItem();
  ensurePanel();
  try{ refreshPrompt(); }catch(e){ console.error('[HeartPulse] initial prompt failed',e); }
  if(__hpInitialized) return true;
  __hpInitialized=true;
  window.addEventListener('resize',placeFab);
  safeOn(event_types.CHAT_CHANGED,()=>setTimeout(()=>{ try{render();}catch{} ensureButton(); ensureSettingsEntry(); registerWandMenuItem(); refreshPrompt(); },200));
  safeOn(event_types.CHARACTER_EDITED,()=>refreshPrompt());
  safeOn(event_types.GENERATION_STARTED,()=>refreshPrompt({includeAutoSpark:true}));
  safeOn(event_types.MESSAGE_RECEIVED,()=>setTimeout(parseLatestModelState,80));
  safeOn(event_types.GENERATION_ENDED,async()=>{const s=getState();if(s.oneShotDirective){s.oneShotDirective='';await saveState();render();}await refreshPrompt({includeAutoSpark:false});});
  setInterval(()=>{ ensureButton(); ensureSettingsEntry(); registerWandMenuItem(); syncSettingsEntry(); },1800);
  console.log('[HeartPulse] v0.5.1 ready');
  return true;
}

jQuery(document).ready(()=>{
  try{ init(); }
  catch(e){ console.error('[HeartPulse] fatal init error',e); emergencyOverlay(e); }
  [350,800,1600,3000,5000].forEach(ms=>setTimeout(()=>{ try{ensureButton();ensureSettingsEntry();registerWandMenuItem();if(!document.querySelector('#hpOverlay'))ensurePanel();}catch(e){console.error('[HeartPulse] retry failed',e);} },ms));
});

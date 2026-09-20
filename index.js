import { setExtensionPrompt, extension_prompt_types, eventSource, event_types } from '../../../../script.js';
import { getContext } from '../../../extensions.js';

const MODULE = 'heartpulse_engine';
const PROMPT_ID = 'heartpulse_engine_context';
const META_KEY = 'heartpulse_engine_state_v2';
const BACKUP_PREFIX = 'heartpulse_engine_backup_v2:';
const UI_KEY = 'heartpulse_engine_ui_v6';
const REL_MAX = 200;
const JOURNAL_KEEP = 60;
const NPC_KEEP = 40;

const REL_FIELDS = [
  ['trust', 'Доверие'], ['affection', 'Привязанность'], ['love', 'Любовь'],
  ['sympathy', 'Симпатия'], ['friendship', 'Дружба'], ['respect', 'Уважение'],
  ['desire', 'Желание'], ['passion', 'Страсть'], ['arousal', 'Озабоченность'],
  ['obsession', 'Одержимость'], ['tenderness', 'Нежность'], ['admiration', 'Восхищение'],
  ['jealousy', 'Ревность'], ['resentment', 'Обида'], ['irritation', 'Раздражение'],
  ['anger', 'Злость'], ['fear', 'Страх'], ['sadness', 'Грусть'],
  ['disappointment', 'Разочарование'], ['joy', 'Веселье'], ['fondness', 'Умиление'],
  ['stress', 'Стресс'], ['tension', 'Напряжение'], ['antipathy', 'Антипатия'],
  ['hate', 'Ненависть']
];

const REL_LABEL = Object.fromEntries(REL_FIELDS);
const REL_KEYS = REL_FIELDS.map(([k]) => k);
const DEFAULT_VISIBLE_REL = ['love','trust','affection','tenderness','respect'];


const KINK_LIBRARY = [
  ['dominance','Доминирование'], ['submission','Подчинение'], ['bondage','Бондаж'], ['praise','Похвала'], ['teasing','Дразнение'],
  ['public','Публичный риск'], ['voyeurism','Вуайеризм'], ['exhibitionism','Эксгибиционизм'], ['risk','Риск / запретность'], ['spanking','Шлепки'],
  ['biting','Укусы'], ['hair','Волосы'], ['blindfold','Повязка'], ['mirrors','Зеркала'], ['toys','Игрушки'], ['roleplay','Ролевые игры'],
  ['phone','Секс по телефону / голос'], ['sexting','Секстинг'], ['somnophilia','Сомнофилия (только согласованный сценарий)'], ['audio','Голос / аудио'], ['slowburn','Slow burn'], ['aftercare','Aftercare'],
  ['initiative','Импульсивная инициатива'], ['dirtytalk','Грязные мысли / речь'], ['sensory','Сенсорная игра'], ['powerplay','Игра власти'],
  ['marking','Метки / укусы / следы'], ['restraint','Фиксация'], ['watching','Наблюдение'], ['costume','Костюмы / образ'], ['romantic','Романтическая близость'],
  ['rough','Грубая динамика'], ['gentle','Нежная динамика'], ['control','Контроль'], ['service','Забота / обслуживание'], ['taboo','Запретная фантазия']
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
  dirtytalk: ['dirty talk','dirty thoughts','explicit talk','грязн','пошлые мысли','пошлая речь'],
  submission: ['submissive','submission','подчинен','подчинён','послушн','сабмиссив'],
  exhibitionism: ['exhibitionism','exhibitionist','эксгибиционизм','эксгибиционист','показывать себя'],
  phone: ['phone sex','sex on the phone','phone call sex','dirty call','voice sex','секс по телефону','интим по телефону','эротический звонок','голосовой секс'],
  somnophilia: ['somnophilia','sleep sex','sleeping partner','сомнофилия','во сне','спящий партнер','спящая партнерша'],
  sexting: ['sexting','sexual texting','dirty texts','секстинг','интимная переписка','эротическая переписка'],
  audio: ['voice kink','voice fetish','audio kink','голос возбуждает','фетиш на голос','аудио'],
  sensory: ['sensory play','temperature play','ice play','wax play','сенсорн','игра температур','лёд','воск'],
  powerplay: ['power play','power exchange','игра власти','властная динамика'],
  marking: ['marking','love bites','hickeys','оставлять следы','метки','засосы'],
  restraint: ['restraint','restraining','cuffs','фиксация','удерживание'],
  watching: ['watching partner','likes to watch','наблюдать','смотреть как'],
  costume: ['costume','uniform kink','dress up','костюм','форма','образ'],
  romantic: ['romantic intimacy','romantic sex','tender intimacy','нежная близость','романтическая близость'],
  rough: ['rough sex','rough intimacy','hard sex','грубая близость','грубый секс'],
  gentle: ['gentle sex','soft sex','tender sex','нежный секс','мягкая близость'],
  control: ['control kink','control fetish','контроль в сексе','контролировать партнёра'],
  service: ['service kink','service submissive','care kink','забота о партнёре','обслуживать партнёра'],
  taboo: ['taboo fantasy','forbidden fantasy','запретная фантазия','табу фантазия']
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
  dirtytalk: ['шеп','ухо','whisper','ear'],
  phone: ['телефон','звонок','созвон','гарнитур','phone','call'],
  sexting: ['сообщен','переписк','чат','text','message'],
  audio: ['голос','аудио','шепчет','voice','audio','whisper'],
  romantic: ['свидан','ужин','завтрак','свеч','date','dinner','breakfast'],
  costume: ['костюм','форма','платье','маска','uniform','costume'],
  sensory: ['лёд','воск','тепло','холод','ice','wax','temperature'],
  marking: ['шея','плеч','кожа','neck','shoulder','skin']
};

const defaults = () => ({
  enabled: true,
  autoTrack: true,
  showToasts: true,
  calibrated: false,
  calibrationAt: 0,
  recalibrationRequested: false,
  relation: Object.fromEntries(REL_FIELDS.map(([k]) => [k, 0])),
  relationLabel: 'Не определено',
  activeFeelings: [],
  feelingNote: '',
  lastShift: '',
  inner: { mood:'', motives:'', hiddenThought:'', currentGoal:'', futureDesire:'' },
  innerLocks: { mood:false, motives:false, hiddenThought:false, currentGoal:false, futureDesire:false },
  lastCardScan: [],
  lastCardScanAt: 0,
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
  journalArchiveCount: 0,
  manualDirective: '',
  oneShotDirective: '',
  injectRelation: true,
  injectKinks: true,
  injectIntentions: true,
  charName: '',
  diagnostics: {lastPromptAt:0,lastParseAt:0,lastParseStatus:'Ещё не проверялось',lastParseError:'',lastPacketSource:'',lastAssistantIndex:-1,lastAppliedAssistantIndex:-1},
  outputLanguage: 'ru',
  updatedAt: Date.now()
});

function ctx(){ try { return getContext?.() || globalThis.SillyTavern?.getContext?.() || {}; } catch(e){ console.warn('[HeartPulse] getContext failed', e); return {}; } }
function esc(s=''){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function clamp(n,min=0,max=REL_MAX){ n=Number(n)||0; return Math.max(min,Math.min(max,n)); }
function now(){ return Date.now(); }
function safeParse(s){ try{return JSON.parse(s);}catch{return null;} }
function makeId(){ return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; }
function stateMerge(raw){
  const d=defaults(), s=Object.assign(d, raw||{});
  s.relation=Object.assign({}, d.relation, raw?.relation||{});
  s.inner=Object.assign({}, d.inner, raw?.inner||{});
  s.innerLocks=Object.assign({}, d.innerLocks, raw?.innerLocks||{});
  for(const key of ['kinks','activeKinks','customKinks','intentions','npc','journal','activeFeelings']) if(!Array.isArray(s[key])) s[key]=[];
  s.customKinks=(s.customKinks||[]).map((x,i)=> typeof x==='string' ? {id:`legacy-${i}-${String(x).slice(0,24)}`,name:String(x),description:'',enabled:true} : {id:x?.id||makeId(),name:String(x?.name||'').trim(),description:String(x?.description||'').trim(),enabled:x?.enabled!==false}).filter(x=>x.name);
  s.diagnostics=Object.assign({}, d.diagnostics, raw?.diagnostics||{});
  if(typeof s.calibrated!=='boolean') s.calibrated=false;
  if(typeof s.recalibrationRequested!=='boolean') s.recalibrationRequested=false;
  s.journalArchiveCount=Number(s.journalArchiveCount)||0;
  return s;
}

function compactHistory(s){
  if(Array.isArray(s.journal) && s.journal.length>JOURNAL_KEEP){
    s.journalArchiveCount += s.journal.length-JOURNAL_KEEP;
    s.journal=s.journal.slice(0,JOURNAL_KEEP);
  }
  if(Array.isArray(s.npc) && s.npc.length>NPC_KEEP){
    s.npc=[...s.npc].sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0)).slice(0,NPC_KEEP);
  }
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
function readUi(){ return Object.assign({showFab:true,x:null,y:112,extrasOpen:false,activeTab:'pulse'}, safeParse(localStorage.getItem(UI_KEY)||'')||{}); }
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
  compactHistory(s);
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
  const chunks=[];
  const seen=new WeakSet();
  const skipKey=/^(avatar|image|thumbnail|chat|date_last_chat|create_date)$/i;
  const walk=(value,key='',depth=0)=>{
    if(depth>5 || value==null || skipKey.test(key)) return;
    if(typeof value==='string'){
      const t=value.trim();
      if(t && t.length<50000) chunks.push(t);
      return;
    }
    if(typeof value!=='object') return;
    if(seen.has(value)) return; seen.add(value);
    if(Array.isArray(value)){ for(const v of value.slice(0,120)) walk(v,key,depth+1); return; }
    for(const [k,v] of Object.entries(value)) walk(v,k,depth+1);
  };
  walk(ch,'character',0);
  return chunks.join('\n').toLowerCase();
}
function customKinkId(x){ return `custom:${x.id}`; }
function customKinkByToken(s,token){
  if(!String(token).startsWith('custom:')) return null;
  const id=String(token).slice(7);
  return (s.customKinks||[]).find(x=>String(x.id)===id) || null;
}
function kinkDisplay(s,token){
  const c=customKinkByToken(s,token);
  return c ? c.name : (KINK_LABEL[token]||token);
}
function kinkPromptText(s,token){
  const c=customKinkByToken(s,token);
  if(c) return c.description ? `${c.name} — ${c.description}` : c.name;
  return KINK_LABEL[token]||token;
}
function enabledCustomTokens(s){ return (s.customKinks||[]).filter(x=>x.enabled!==false).map(customKinkId); }
function enabledStoredKinks(s){ return (s.kinks||[]).filter(k=>!String(k).startsWith('custom:') || customKinkByToken(s,k)?.enabled!==false); }
function scanCustomKinks(text,s){
  const found=[];
  for(const k of (s.customKinks||[])){
    if(k.enabled===false) continue;
    const name=String(k.name||'').trim().toLowerCase();
    if(name && name.length>=3 && text.includes(name)) found.push(customKinkId(k));
  }
  return found;
}
function scanCardKinks(){
  const text=currentCharCardText(); if(!text) return [];
  const found=[];
  for(const [key,words] of Object.entries(CARD_KEYWORDS)) if(words.some(w=>text.includes(w))) found.push(key);
  found.push(...scanCustomKinks(text,getState()));
  return [...new Set(found)];
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
  if(s.sparkCooldownRemaining>0){ s.sparkCooldownRemaining--; writeBackup(s); return ''; }
  const prefs=[...new Set([...enabledStoredKinks(s),...enabledCustomTokens(s)])];
  if(!prefs.length) return '';
  const contextual=detectContextualKinks(prefs);
  const emotionalReady=Number(s.relation.desire)>55 || Number(s.relation.tension)>70 || Number(s.relation.affection)>95;
  const pool=contextual.length ? contextual : (emotionalReady ? prefs : []);
  if(!pool.length) return '';
  if(Math.random()*100 > clamp(s.kinkChance,0,100)) return '';
  const picked=pool[Math.floor(Math.random()*pool.length)];
  s.sparkCooldownRemaining=Math.max(1,Number(s.sparkCooldown)||4);
  s.lastSpark=kinkDisplay(s,picked);
  s.updatedAt=now(); writeBackup(s);
  const intensity=Number(s.kinkIntensity)||0;
  const mode=intensity>=80?'bold initiative if the scene genuinely supports it':intensity>=60?'clear physical or verbal initiative':intensity>=35?'flirtation, touch, teasing or a spontaneous gesture':'subtext, thought, tension or a very small gesture';
  return `[AUTO SPARK — next reply only] Context may naturally activate ${kinkPromptText(s,picked)}. Intensity ${intensity}/100: prefer ${mode}. Keep it character-consistent and scene-appropriate; never force escalation just to satisfy the tag.`;
}

function visibleFeelingKeys(s){
  const requested=(Array.isArray(s.activeFeelings)?s.activeFeelings:[]).filter(k=>REL_LABEL[k]);
  const uniq=[...new Set(requested)].slice(0,6);
  if(uniq.length) return uniq;
  const ranked=REL_KEYS.map(k=>[k,clamp(s.relation[k],0,REL_MAX)]).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
  return [...new Set([...ranked,...DEFAULT_VISIBLE_REL])].slice(0,6);
}
function allFeelingsCompact(s){
  return REL_FIELDS.map(([k,l])=>`${l}:${clamp(s.relation[k],0,REL_MAX)}`).join(',');
}

function buildPrompt({includeAutoSpark=false}={}){
  const s=getState(); if(!s.enabled) return '';
  const name=currentCharName(); s.charName=name;
  const blocks=[`[HEARTPULSE private guidance for ${name}; never quote this block.]`,`Agency: write only ${name}, NPCs and world; never write {{user}}'s actions, dialogue, thoughts, feelings, decisions or consent.`];
  if(s.injectRelation){
    const vals=allFeelingsCompact(s);
    const active=visibleFeelingKeys(s).map(k=>`${REL_LABEL[k]}:${clamp(s.relation[k],0,REL_MAX)}`).join(',');
    blocks.push(`[REL 0-${REL_MAX}] ${s.relationLabel}; Active/salient now=${active}. Only these currently salient feeling values are sent as continuity cues; the rest of HeartPulse's stored palette stays local.`);
    if(s.feelingNote) blocks.push(`[FEELING NOTE] ${s.feelingNote}`);
    const i=s.inner||{}, bits=[];
    if(i.mood) bits.push(`mood=${i.mood}`); if(i.motives) bits.push(`motives=${i.motives}`); if(i.hiddenThought) bits.push(`thought=${i.hiddenThought}`); if(i.currentGoal) bits.push(`goal=${i.currentGoal}`); if(i.futureDesire) bits.push(`future=${i.futureDesire}`);
    if(bits.length) blocks.push(`[INNER] ${bits.join(' | ')}`);
  }
  if(s.injectIntentions && s.intentions.length) blocks.push(`[LONG GOALS] ${s.intentions.map(x=>x.text).join('; ')}. Keep alive until completed/abandoned; advance only when plausible.`);
  if(s.injectKinks){
    const prefs=[...new Set([...enabledStoredKinks(s),...enabledCustomTokens(s)])], active=[...new Set(s.activeKinks)];
    if(prefs.length) blocks.push(`[SPARK PROFILE] ${prefs.map(k=>kinkPromptText(s,k)).join('; ')}; intensity ${s.kinkIntensity}/100. Preferences, not obligations; use naturally. For any sleep/unconsciousness-themed preference, treat it only as a previously consented roleplay scenario; do not infer consent from silence or sleep.`);
    if(active.length) blocks.push(`[ACTIVE SPARK] ${active.map(k=>kinkPromptText(s,k)).join('; ')}.`);
    if(includeAutoSpark){ const auto=maybePrepareAutoSpark(); if(auto) blocks.push(auto); }
  }
  blocks.push(`[LANGUAGE LOCK] Keep the visible roleplay and every HeartPulse text field in Russian unless the user explicitly requests another language. English kink/fetish names are semantic labels only; never switch the reply or metadata language because a preference is written in English.`);
  if(s.manualDirective.trim()) blocks.push(`[CHAR/NPC DIRECTIVE — persistent] ${s.manualDirective.trim()}`);
  if(s.oneShotDirective.trim()) blocks.push(`[CHAR/NPC DIRECTIVE — next reply only] ${s.oneShotDirective.trim()}`);
  blocks.push(`[VISIBLE OUTPUT RULE] Do not print any HeartPulse status panel, relationship percentages, motives/goals summary, or HEARTPULSE metadata in the visible roleplay reply. Keep those only in the hidden HEARTPULSE_STATE comment.`);
  if(s.autoTrack){
    const calibration = !s.calibrated
      ? `CALIBRATE now from the established chat context already available. Return absolute "levels" (0-${REL_MAX}) for all relation keys; do not assume zero just because HeartPulse is new.`
      : `Return only genuine "deltas" for changed relation keys (usually -5..+5, major event up to 15).`;
    blocks.push(`[HP UPDATE] At the very end of the reply emit exactly ONE machine-readable HeartPulse packet and nothing after it. Preferred format is <HEARTPULSE_STATE>{JSON}</HEARTPULSE_STATE>. The HTML-comment example below is accepted only as a fallback. Never put the packet in the visible prose. ${calibration} Keep text fields compact and in Russian. NPCs: include only active/relevant NPCs, but give each a small persistent profile.
<HEARTPULSE_STATE>{"label":"...","shift":"...","active":["love","tenderness"],"note":"...","levels":null,"deltas":{},"inner":{"mood":null,"motives":null,"hiddenThought":null,"currentGoal":null,"futureDesire":null},"intentions_add":[],"intentions_done":[],"npc":[]}</HEARTPULSE_STATE>
Fallback example:
<!--HEARTPULSE_STATE:{"label":"...","shift":"...","active":["love","tenderness"],"note":"1–2 short sentences explaining what is emotionally strongest right now","levels":null,"deltas":{},"inner":{"mood":null,"motives":null,"hiddenThought":null,"currentGoal":null,"futureDesire":null},"intentions_add":[],"intentions_done":[],"npc":[{"name":"...","state":"...","mood":"...","motive":"...","goal":"...","relation":{"trust":0,"affection":0,"desire":0,"irritation":0,"fear":0,"respect":0}}]}-->
Keys: ${REL_FIELDS.map(([k])=>k).join(',')}. Scale: 0-30 absent/very weak, 31-70 emerging, 71-110 established, 111-150 very strong, 151-180 extreme, 181-200 dominant. Track the full emotional state internally, but "active" MUST contain only 1–6 feelings that are genuinely salient in THIS moment. Do not fill all feelings just because they exist. "note" is a compact explanation of the current emotional mix. Independent feelings may coexist. Use null for unchanged inner fields. Durable plans only in intentions_add.`);
  }
  return blocks.join('\n');
}

async function refreshPrompt(opts={}){
  const text=buildPrompt(opts);
  const st=getState(); st.diagnostics.lastPromptAt=now(); writeBackup(st);
  try{
    setExtensionPrompt(PROMPT_ID, text || '', extension_prompt_types.IN_CHAT, 0);
  }catch(e){
    console.error('[HeartPulse] setExtensionPrompt failed', e);
  }
  renderModelPreview();
}
function toast(msg,type='info'){ if(getState().showToasts && window.toastr?.[type]) window.toastr[type](msg,'HeartPulse ❤️‍🔥✨'); }

function normalizeNpc(n,old={}){
  const relKeys=['trust','affection','desire','irritation','fear','respect'];
  const relation=Object.assign({},old.relation||{});
  if(n?.relation&&typeof n.relation==='object') for(const k of relKeys) if(k in n.relation) relation[k]=clamp(n.relation[k],0,REL_MAX);
  return {name:String(n?.name||old.name||'NPC').slice(0,80),state:String(n?.state||n?.note||old.state||'').slice(0,240),mood:String(n?.mood||old.mood||'').slice(0,180),motive:String(n?.motive||old.motive||'').slice(0,220),goal:String(n?.goal||old.goal||'').slice(0,220),relation,lastSeen:now()};
}
function mergeNpcList(s,incoming){
  if(!Array.isArray(incoming)) return;
  const map=new Map((s.npc||[]).map(n=>[String(n.name||'').toLowerCase(),n]));
  for(const n of incoming){ const key=String(n?.name||'').trim().toLowerCase(); if(!key) continue; map.set(key,normalizeNpc(n,map.get(key))); }
  s.npc=[...map.values()].sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0));
}
function applyStatePacket(packet){
  const s=getState();
  if(packet.label) s.relationLabel=String(packet.label).slice(0,100);
  if(packet.shift) s.lastShift=String(packet.shift).slice(0,300);
  if(Array.isArray(packet.active)) s.activeFeelings=[...new Set(packet.active.filter(k=>REL_LABEL[k]))].slice(0,6);
  if(packet.note!==undefined && packet.note!==null) s.feelingNote=String(packet.note).trim().slice(0,360);
  if(packet.levels&&typeof packet.levels==='object'){
    for(const [k] of REL_FIELDS) if(k in packet.levels) s.relation[k]=clamp(packet.levels[k],0,REL_MAX);
    s.calibrated=true; s.calibrationAt=now(); s.recalibrationRequested=false;
  } else if(packet.deltas&&typeof packet.deltas==='object'){
    for(const [k] of REL_FIELDS) if(k in packet.deltas) s.relation[k]=clamp((s.relation[k]||0)+clamp(packet.deltas[k],-15,15),0,REL_MAX);
    if(Object.keys(packet.deltas).length) s.calibrated=true;
  }
  if(packet.inner&&typeof packet.inner==='object'){
    for(const k of ['mood','motives','hiddenThought','currentGoal','futureDesire']){
      if(s.innerLocks?.[k]) continue; const v=packet.inner[k];
      if(v!==null && v!==undefined && String(v).trim()) s.inner[k]=String(v).trim().slice(0,500);
    }
  }
  for(const text of (packet.intentions_add||[])){ const t=String(text).trim(); if(t&&!s.intentions.some(x=>x.text===t)) s.intentions.push({id:makeId(),text:t,priority:'обычно'}); }
  const done=new Set((packet.intentions_done||[]).map(x=>String(x).trim().toLowerCase()));
  if(done.size) s.intentions=s.intentions.filter(x=>!done.has(x.text.toLowerCase()));
  mergeNpcList(s,packet.npc);
  s.journal.unshift({ts:now(),type:'shift',text:s.lastShift||'Эмоциональное состояние обновлено'});
  compactHistory(s);
}

function extractBalancedJson(text,start){
  let i=start; while(i<text.length && /\s/.test(text[i])) i++;
  if(text[i]!=='{') return null;
  let depth=0,inStr=false,escp=false;
  for(let j=i;j<text.length;j++){
    const ch=text[j];
    if(inStr){ if(escp){escp=false;continue;} if(ch==='\\'){escp=true;continue;} if(ch==='"')inStr=false; continue; }
    if(ch==='"'){inStr=true;continue;}
    if(ch==='{') depth++;
    else if(ch==='}'){ depth--; if(depth===0) return {json:text.slice(i,j+1),end:j+1}; }
  }
  return null;
}
function findHeartPulsePacket(text){
  const markers=[
    {marker:'<!--HEARTPULSE_STATE:',source:'html-comment',suffix:'-->'},
    {marker:'<HEARTPULSE_STATE>',source:'xml-tag',suffix:'</HEARTPULSE_STATE>'},
    {marker:'HEARTPULSE_STATE:',source:'plain-marker',suffix:''}
  ];
  for(const def of markers){
    const pos=text.lastIndexOf(def.marker);
    if(pos<0) continue;
    const bal=extractBalancedJson(text,pos+def.marker.length);
    if(!bal) continue;
    let removeEnd=bal.end;
    if(def.suffix){ const sx=text.indexOf(def.suffix,bal.end); if(sx>=0) removeEnd=sx+def.suffix.length; }
    return {packet:safeParse(bal.json),source:def.source,start:pos,end:removeEnd,raw:bal.json};
  }
  const fence=/```(?:json)?\s*([\s\S]*?)```/gi; let m,last=null;
  while((m=fence.exec(text))){ if(/heartpulse/i.test(m[1])) last={m,index:m.index}; }
  if(last){
    const inner=last.m[1]; const key=inner.search(/HEARTPULSE_STATE\s*[:=]/i);
    const brace=key>=0?inner.indexOf('{',key):inner.indexOf('{');
    if(brace>=0){ const bal=extractBalancedJson(inner,brace); if(bal){ const obj=safeParse(bal.json); if(obj) return {packet:obj.HEARTPULSE_STATE||obj.heartpulse_state||obj,source:'code-fence',start:last.index,end:last.index+last.m[0].length,raw:bal.json}; } }
  }
  return null;
}
async function parseLatestModelState(reason='event'){
  const c=ctx(); if(!c?.chat) return false;
  const s=getState(), d=s.diagnostics||{};
  const indexed=[...c.chat].map((m,i)=>({m,i})).reverse().find(x=>x.m&&!x.m.is_user&&typeof x.m.mes==='string');
  d.lastParseAt=now();
  if(!indexed){ d.lastParseStatus='Нет ответа ассистента для проверки'; writeBackup(s); return false; }
  const {m:last,i:index}=indexed; d.lastAssistantIndex=index;
  const found=findHeartPulsePacket(last.m);
  if(!found || !found.packet){
    if(d.lastAppliedAssistantIndex===index && String(d.lastParseStatus||'').includes('применён')) return true;
    d.lastParseStatus=`Пакет не найден (${reason})`;
    d.lastParseError=found && !found.packet ? 'Маркер найден, но JSON не разобран' : '';
    d.lastPacketSource=''; writeBackup(s); renderModelPreview(); return false;
  }
  try{
    applyStatePacket(found.packet);
    const s2=getState(); s2.diagnostics.lastParseAt=now(); s2.diagnostics.lastParseStatus='Пакет найден и применён ✓'; s2.diagnostics.lastParseError=''; s2.diagnostics.lastPacketSource=found.source; s2.diagnostics.lastAssistantIndex=index; s2.diagnostics.lastAppliedAssistantIndex=index;
    last.m=(last.m.slice(0,found.start)+last.m.slice(found.end)).trimEnd();
    await c.saveChat?.(); await saveState(); if(getState().lastShift) toast(getState().lastShift,'success'); render(); return true;
  }catch(e){
    const s3=getState(); s3.diagnostics.lastParseStatus='Ошибка разбора пакета'; s3.diagnostics.lastParseError=String(e?.message||e); writeBackup(s3); console.warn('[HeartPulse] state packet parse failed',e); renderModelPreview(); return false;
  }
}

function panelHtml(){
  const s=getState(), name=esc(currentCharName()), ui=readUi();
  const prefSet=new Set(s.kinks), activeSet=new Set(s.activeKinks);
  const tab=ui.activeTab||'pulse';
  const tabBtn=(id,label)=>`<button data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`;
  const page=(id,html)=>`<section data-page="${id}" class="hp-page ${tab===id?'active':''}">${html}</section>`;
  const innerField=(key,label,placeholder)=>`<div class="hp-inner-field"><div class="hp-inner-title"><b>${label}</b><label class="hp-lock-toggle" title="Зафиксировать поле: модель перестанет менять его автоматически"><input type="checkbox" data-inner-lock="${key}" ${s.innerLocks?.[key]?'checked':''}><span>🔒</span></label></div><textarea class="hp-text hp-inner-text" data-inner="${key}" placeholder="${esc(placeholder)}">${esc(s.inner?.[key]||'')}</textarea></div>`;
  const scan=(s.lastCardScan||[]);
  return `<div id="hpOverlay" class="hp-overlay hp-hidden"><div id="hpPanel" class="hp-panel">
    <header class="hp-head"><div><div class="hp-kicker">HEARTPULSE ENGINE · v0.9.0</div><h2>❤️‍🔥✨ ${name}</h2><p>Живая анкета персонажа · связь · искра · цели · NPC</p></div><button class="hp-close">×</button></header>
    <nav class="hp-tabs">${tabBtn('pulse','💗 Пульс')}${tabBtn('spark','❤️‍🔥 Искра')}${tabBtn('intent','🎯 Намерения')}${tabBtn('npc','👥 NPC')}${tabBtn('journal','📜 Журнал')}${tabBtn('model','👁 Модель')}</nav>
    <main class="hp-body">
      ${page('pulse',`<div class="hp-soft-card"><h3>💞 Эмоциональный пульс</h3><div class="hp-auto-status ${s.autoTrack?'on':''}">${s.autoTrack?'🤖 HeartPulse хранит полную палитру чувств, а здесь показывает только 1–6 самых актуальных сейчас.':'🖐️ Авто-динамика выключена: данные меняешь ты.'}</div><input id="hpRelationLabel" class="hp-input" value="${esc(s.relationLabel)}" placeholder="Например: взаимное движение навстречу"><div class="hp-actions"><button id="hpRecalibrate">${s.recalibrationRequested?'⏳ Переоценка — со следующим ответом':'🧭 Переоценить отношения'}</button></div><p class="hp-muted hp-micro">Внутри движка остаются все чувства 0–200. На экран выводятся только 1–6 чувств, которые сейчас реально важны.</p><div class="hp-rel-grid hp-rel-active">${visibleFeelingKeys(s).map(k=>`<label>${esc(REL_LABEL[k]||k)}<b data-val="${k}">${clamp(s.relation[k],0,REL_MAX)}</b><input class="hp-range" data-rel="${k}" type="range" min="0" max="200" value="${clamp(s.relation[k],0,REL_MAX)}"></label>`).join('')}</div>${s.feelingNote?`<div class="hp-feeling-note">💭 ${esc(s.feelingNote)}</div>`:''}${s.lastShift?`<div class="hp-shift">✨ Последний сдвиг: ${esc(s.lastShift)}</div>`:''}<details id="hpAllFeelings" class="hp-extra-feelings"><summary>🧠 Вся внутренняя палитра (${REL_FIELDS.length})</summary><p class="hp-muted hp-micro">Это скрытый движок. Обычно сюда заходить не нужно; можно раскрыть для ручной правки.</p><div class="hp-rel-grid">${REL_FIELDS.map(([k,l])=>`<label>${l}<b data-val="${k}">${clamp(s.relation[k],0,REL_MAX)}</b><input class="hp-range" data-rel="${k}" type="range" min="0" max="200" value="${clamp(s.relation[k],0,REL_MAX)}"></label>`).join('')}</div></details><div class="hp-inner-mini"><h4>🧠 Что сейчас внутри</h4>${innerField('mood','Настроение','Например: спокойная решимость, тревога, азарт...')}${innerField('motives','Мотивы','Почему персонаж сейчас действует именно так...')}</div><p class="hp-muted hp-tip">Модель сама решает, какие чувства сейчас активны. Если обида, страсть, ревность, дружба или другое состояние действительно стали важны — оно появится в верхних 1–6 ползунках.</p></div>`)}
      ${page('spark',`<div class="hp-hot-card"><h3>❤️‍🔥 Искра / кинки</h3><div class="hp-row"><label>Интенсивность <b id="hpIntensityVal">${s.kinkIntensity}</b><input id="hpIntensity" type="range" min="0" max="100" value="${s.kinkIntensity}"></label><label>Шанс авто-искра <b id="hpChanceVal">${s.kinkChance}%</b><input id="hpChance" type="range" min="0" max="100" value="${s.kinkChance}"></label></div>
      <div class="hp-subtitle">Постоянные предпочтения персонажа</div><div class="hp-chip-grid">${KINK_LIBRARY.map(([k,l])=>`<button class="hp-chip ${prefSet.has(k)?'on':''}" data-kink="${k}">${l}</button>`).join('')}</div>
      <div class="hp-actions"><button id="hpScanCard">✨ Проверить карточку локально</button></div><p class="hp-muted">Без API и без отдельного запроса: HeartPulse читает текст карточки текущего персонажа и ищет известные признаки.</p>
      <div class="hp-scan-report"><b>🩺 Анамнез карточки</b>${s.lastCardScanAt?`<span class="hp-muted">Последняя проверка: ${new Date(s.lastCardScanAt).toLocaleTimeString()}</span>`:''}${scan.length?`<div class="hp-scan-chips">${scan.map(k=>`<span>${esc(kinkDisplay(s,k))}</span>`).join('')}</div>`:'<p class="hp-muted">Ещё не проверено или явных совпадений не найдено.</p>'}</div>
      <div class="hp-subtitle">Активно именно в этой сцене</div><div class="hp-chip-grid hp-active-grid">${KINK_LIBRARY.map(([k,l])=>`<button class="hp-chip scene ${activeSet.has(k)?'on':''}" data-active-kink="${k}">${l}</button>`).join('')}</div>
      <div class="hp-custom-kinks"><div class="hp-subtitle">✍️ Свои кинки / фетиши</div><p class="hp-muted hp-micro">Сохраняются в анкете этого чата. Название может быть на любом языке; описание объясняет модели, как именно это проявляется. Язык ролевой от этого не меняется.</p><div class="hp-custom-form"><input id="hpCustomKinkName" class="hp-input" placeholder="Название, например: Somnophilia"><textarea id="hpCustomKinkDesc" class="hp-text" placeholder="Коротко опиши смысл и желаемое проявление в ролевой..."></textarea><button id="hpCustomKinkSave" type="button">💾 Сохранить</button></div><div class="hp-custom-list">${(s.customKinks||[]).map(k=>`<div class="hp-custom-card"><label><input type="checkbox" data-custom-enabled="${esc(k.id)}" ${k.enabled!==false?'checked':''}> <b>${esc(k.name)}</b></label>${k.description?`<small>${esc(k.description)}</small>`:''}<button type="button" data-custom-del="${esc(k.id)}">🗑</button></div>`).join('')||'<p class="hp-muted">Пока ничего не сохранено.</p>'}</div></div>
      <div class="hp-auto-box"><label><input id="hpAutoSpark" type="checkbox" ${s.autoSpark?'checked':''}> 🎲 Авто-искра без отдельного API-запроса</label><label>Пауза после срабатывания: <input id="hpCooldown" class="hp-mini-input" type="number" min="1" max="12" value="${s.sparkCooldown}"> ответов</label><div class="hp-muted">${s.lastSpark?`Последняя авто-искра: ${esc(s.lastSpark)} · отдых ещё ${s.sparkCooldownRemaining} ответ(а/ов). После паузы искра снова может сработать, но не обязана.`:'Авто-искра ещё не срабатывала.'}</div></div></div>`)}
      ${page('intent',`<div class="hp-gold-card"><h3>🎯 Внутренние намерения</h3><p class="hp-muted">Эти поля может заполнять сама модель после ответа. Ручная правка всегда разрешена; 🔒 фиксирует поле.</p>${innerField('hiddenThought','Скрытая мысль','Что персонаж думает, но не говорит...')}${innerField('currentGoal','Цель сейчас','Чего он хочет добиться прямо сейчас...')}${innerField('futureDesire','Желание на будущее','К чему он хочет прийти позже...')}<div class="hp-subtitle">📌 Долгие цели, которые нельзя забыть</div><div id="hpIntentList">${s.intentions.map(x=>`<div class="hp-intent" data-id="${esc(x.id)}"><span>${esc(x.text)}</span><button data-done="${esc(x.id)}" title="Отметить цель выполненной">✓ Готово</button><button data-del="${esc(x.id)}" title="Удалить цель без отметки о выполнении">🗑</button></div>`).join('')||'<p class="hp-muted">Пока пусто. Модель может добавить такую цель сама, либо ты добавишь вручную.</p>'}</div><div class="hp-inline"><input id="hpIntentInput" class="hp-input" placeholder="Например: подарить кольцо в подходящий момент"><button id="hpIntentAdd">＋</button></div></div>`)}
      ${page('npc',`<div class="hp-soft-card"><h3>👥 NPC</h3><p class="hp-muted">Мини-анкеты NPC сохраняются между сценами. Последние/активные обновляются моделью, старые не стираются сразу.</p><div>${(s.npc||[]).map(n=>`<div class="hp-npc"><b>${esc(n.name||'NPC')}</b><span>${esc(n.state||'')}</span>${n.mood?`<small>🎭 ${esc(n.mood)}</small>`:''}${n.motive?`<small>🧠 ${esc(n.motive)}</small>`:''}${n.goal?`<small>🎯 ${esc(n.goal)}</small>`:''}${n.relation?`<small>💞 ${Object.entries(n.relation).map(([k,v])=>`${esc(k)} ${clamp(v,0,REL_MAX)}`).join(' · ')}</small>`:''}</div>`).join('')||'<p class="hp-muted">Нет сохранённых NPC.</p>'}</div></div>`)}
      ${page('journal',`<div class="hp-soft-card"><h3>📜 Журнал сдвигов</h3>${s.journalArchiveCount?`<p class="hp-muted">🗃️ Старых записей автоматически свёрнуто: ${s.journalArchiveCount}. Текущее состояние, цели и NPC сохранены отдельно.</p>`:''}${s.journal.map((j,ji)=>`<div class="hp-log"><time>${new Date(j.ts).toLocaleString()}</time><span>${esc(j.text)}</span>${j.type==='done'?`<button class="hp-restore-goal" data-restore-journal="${ji}">↩ Вернуть цель</button>`:''}</div>`).join('')||'<p class="hp-muted">Журнал пока пуст.</p>'}</div>`)}
      ${page('model',`<div class="hp-model-card"><h3>👁 Что увидит модель</h3><p class="hp-muted">💾 Данные могут храниться в HeartPulse, даже если соответствующая галочка отправки модели выключена. ${s.calibrated?`✅ Отношения откалиброваны по этому чату.`:`🧭 Нужна первичная калибровка отношений по истории чата.`}</p><div class="hp-diagnostics"><b>🩺 Диагностика авто-анкеты</b><span>Последняя инструкция модели: ${s.diagnostics?.lastPromptAt?new Date(s.diagnostics.lastPromptAt).toLocaleTimeString():'—'}</span><span>Последняя проверка ответа: ${s.diagnostics?.lastParseAt?new Date(s.diagnostics.lastParseAt).toLocaleTimeString():'—'}</span><span>Статус: ${esc(s.diagnostics?.lastParseStatus||'—')}</span>${s.diagnostics?.lastPacketSource?`<span>Формат пакета: ${esc(s.diagnostics.lastPacketSource)}</span>`:''}${s.diagnostics?.lastParseError?`<span class="hp-diag-error">${esc(s.diagnostics.lastParseError)}</span>`:''}<button id="hpDiagParse" type="button">🔎 Проверить последний ответ сейчас</button></div><div class="hp-switches"><label title="Главный выключатель HeartPulse"><input id="hpEnabled" type="checkbox" ${s.enabled?'checked':''}> HeartPulse</label><label title="Просить модель после ответа вернуть скрытое обновление анкеты"><input id="hpAutoTrack" type="checkbox" ${s.autoTrack?'checked':''}> авто-анкета</label><label title="Передавать модели сохранённые отношения и внутреннее состояние"><input id="hpInjectRel" type="checkbox" ${s.injectRelation?'checked':''}> отношения</label><label title="Передавать профиль и активные подсказки Искры"><input id="hpInjectKinks" type="checkbox" ${s.injectKinks?'checked':''}> искра</label><label title="Передавать модели незавершённые долгие цели"><input id="hpInjectIntent" type="checkbox" ${s.injectIntentions?'checked':''}> цели</label><label title="Показывать плавающую кнопку на экране"><input id="hpShowFab" type="checkbox" ${ui.showFab?'checked':''}> кнопка</label></div><p class="hp-muted hp-micro">Галочка = этот модуль участвует в следующем запросе. Снять галочку можно без удаления сохранённых данных.</p><textarea id="hpManual" class="hp-text" placeholder="🎭 Указание {{char}} / NPC — постоянно">${esc(s.manualDirective)}</textarea><textarea id="hpOneShot" class="hp-text" placeholder="⚡ Указание {{char}} / NPC — только следующий ответ">${esc(s.oneShotDirective)}</textarea><textarea id="hpModelPreview" class="hp-preview-box" readonly aria-label="Что увидит модель"></textarea></div>`)}
    </main></div></div>`;
}
function renderModelPreview(){ const el=document.querySelector('#hpModelPreview'); if(el){ const v=buildPrompt({includeAutoSpark:false})||'Ничего не отправляется.'; if('value' in el) el.value=v; else el.textContent=v; } }
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

async function scanAndStoreCard(){
  const found=scanCardKinks();
  const s=getState();
  s.lastCardScan=found;
  s.lastCardScanAt=now();
  if(found.length) s.kinks=[...new Set([...s.kinks,...found])];
  await saveState();
  if(found.length) toast(`Карточка проверена: найдено ${found.length}`,'success');
  else toast('Карточка проверена: явных совпадений по словарю не найдено','info');
  render();
  return found;
}

function bind(){
  const q=(s)=>document.querySelector(s);
  q('.hp-close')?.addEventListener('click',closePanel);
  document.querySelectorAll('.hp-tabs button').forEach(b=>b.addEventListener('click',()=>{ const ui=readUi(); ui.activeTab=b.dataset.tab; saveUi(ui); document.querySelectorAll('.hp-tabs button,.hp-page').forEach(x=>x.classList.remove('active')); b.classList.add('active'); q(`[data-page="${b.dataset.tab}"]`)?.classList.add('active'); renderModelPreview(); }));
  q('#hpExtraFeelings')?.addEventListener('toggle',e=>{ const ui=readUi(); ui.extrasOpen=e.target.open; saveUi(ui); });
  document.querySelectorAll('[data-rel]').forEach(r=>r.addEventListener('input',()=>{ const s=getState(); s.relation[r.dataset.rel]=Number(r.value); document.querySelector(`[data-val="${r.dataset.rel}"]`).textContent=r.value; writeBackup(s); }));
  document.querySelectorAll('[data-rel]').forEach(r=>r.addEventListener('change',saveState));
  q('#hpRelationLabel')?.addEventListener('change',async e=>{getState().relationLabel=e.target.value; await saveState();});
  q('#hpRecalibrate')?.addEventListener('click',async()=>{const s=getState();s.calibrated=false;s.calibrationAt=0;s.recalibrationRequested=true;await saveState();toast('Переоценка подготовлена: новые проценты придут после следующего обычного ответа модели','info');render();});
  document.querySelectorAll('[data-kink]').forEach(b=>b.addEventListener('click',async()=>{ const s=getState(),k=b.dataset.kink; s.kinks=s.kinks.includes(k)?s.kinks.filter(x=>x!==k):[...s.kinks,k]; b.classList.toggle('on'); await saveState(); }));
  document.querySelectorAll('[data-active-kink]').forEach(b=>b.addEventListener('click',async()=>{ const s=getState(),k=b.dataset.activeKink; s.activeKinks=s.activeKinks.includes(k)?s.activeKinks.filter(x=>x!==k):[...s.activeKinks,k]; b.classList.toggle('on'); await saveState(); }));
  q('#hpIntensity')?.addEventListener('input',e=>{getState().kinkIntensity=Number(e.target.value); const v=q('#hpIntensityVal'); if(v)v.textContent=e.target.value; writeBackup(getState());});
  q('#hpIntensity')?.addEventListener('change',saveState);
  q('#hpChance')?.addEventListener('input',e=>{getState().kinkChance=Number(e.target.value); const v=q('#hpChanceVal'); if(v)v.textContent=`${e.target.value}%`; writeBackup(getState());});
  q('#hpChance')?.addEventListener('change',saveState);
  q('#hpCooldown')?.addEventListener('change',async e=>{getState().sparkCooldown=clamp(Number(e.target.value),1,12); await saveState();});
  q('#hpAutoSpark')?.addEventListener('change',async e=>{getState().autoSpark=e.target.checked; await saveState();});
  q('#hpCustomKinkSave')?.addEventListener('click',async()=>{ const name=q('#hpCustomKinkName')?.value?.trim(), description=q('#hpCustomKinkDesc')?.value?.trim()||''; if(!name) return toast('Напиши название кинка / фетиша','info'); const s=getState(); const existing=(s.customKinks||[]).find(x=>x.name.toLowerCase()===name.toLowerCase()); if(existing){ existing.description=description||existing.description; existing.enabled=true; } else s.customKinks.push({id:makeId(),name,description,enabled:true}); await saveState(); toast(`Сохранено: ${name}`,'success'); render(); });
  document.querySelectorAll('[data-custom-enabled]').forEach(el=>el.addEventListener('change',async()=>{ const s=getState(), k=s.customKinks.find(x=>x.id===el.dataset.customEnabled); if(k) k.enabled=el.checked; await saveState(); renderModelPreview(); }));
  document.querySelectorAll('[data-custom-del]').forEach(el=>el.addEventListener('click',async()=>{ const s=getState(); s.customKinks=s.customKinks.filter(x=>x.id!==el.dataset.customDel); s.kinks=s.kinks.filter(x=>x!==`custom:${el.dataset.customDel}`); s.activeKinks=s.activeKinks.filter(x=>x!==`custom:${el.dataset.customDel}`); await saveState(); render(); }));
  q('#hpScanCard')?.addEventListener('click',scanAndStoreCard);
  q('#hpIntentAdd')?.addEventListener('click',async()=>{ const t=q('#hpIntentInput').value.trim(); if(!t)return; getState().intentions.push({id:makeId(),text:t,priority:'обычно'}); await saveState(); render(); });
  document.querySelectorAll('[data-done],[data-del]').forEach(b=>b.addEventListener('click',async()=>{ const id=b.dataset.done||b.dataset.del,s=getState(),hit=s.intentions.find(x=>x.id===id); if(b.dataset.done&&hit){ const ok=window.confirm(`Отметить цель выполненной?\n\n${hit.text}`); if(!ok) return; } s.intentions=s.intentions.filter(x=>x.id!==id); if(b.dataset.done&&hit){s.journal.unshift({ts:now(),type:'done',text:`Цель завершена: ${hit.text}`}); toast(`Цель завершена: ${hit.text}`,'success');} await saveState(); render(); }));
  document.querySelectorAll('[data-restore-journal]').forEach(b=>b.addEventListener('click',async()=>{ const s=getState(),idx=Number(b.dataset.restoreJournal),j=s.journal[idx]; if(!j) return; const prefix='Цель завершена:'; const text=String(j.text||'').startsWith(prefix)?String(j.text).slice(prefix.length).trim():String(j.text||'').trim(); if(text&&!s.intentions.some(x=>x.text===text)) s.intentions.push({id:makeId(),text,priority:'обычно'}); s.journal.splice(idx,1); s.journal.unshift({ts:now(),type:'restore',text:`Цель возвращена в активные: ${text}`}); await saveState(); toast(`Цель возвращена: ${text}`,'success'); render(); }));
  document.querySelectorAll('[data-inner]').forEach(el=>el.addEventListener('change',async()=>{ const s=getState(); s.inner[el.dataset.inner]=el.value.trim(); await saveState(); }));
  document.querySelectorAll('[data-inner-lock]').forEach(el=>el.addEventListener('change',async()=>{ const s=getState(); s.innerLocks[el.dataset.innerLock]=el.checked; await saveState(); }));
  [['#hpEnabled','enabled'],['#hpAutoTrack','autoTrack'],['#hpInjectRel','injectRelation'],['#hpInjectKinks','injectKinks'],['#hpInjectIntent','injectIntentions']].forEach(([id,key])=>q(id)?.addEventListener('change',async e=>{getState()[key]=e.target.checked; await saveState(); renderModelPreview();}));
  q('#hpManual')?.addEventListener('change',async e=>{getState().manualDirective=e.target.value; await saveState();});
  q('#hpOneShot')?.addEventListener('change',async e=>{getState().oneShotDirective=e.target.value; await saveState();});
  q('#hpDiagParse')?.addEventListener('click',async()=>{ const ok=await parseLatestModelState('ручная проверка'); toast(ok?'Пакет найден и применён':'Пакет HeartPulse в последнем ответе не найден', ok?'success':'info'); render(); });
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
  safeOn(event_types.MESSAGE_RECEIVED,()=>{ [80,350,900].forEach(ms=>setTimeout(()=>parseLatestModelState('MESSAGE_RECEIVED'),ms)); });
  safeOn(event_types.GENERATION_ENDED,async()=>{ await parseLatestModelState('GENERATION_ENDED'); setTimeout(()=>parseLatestModelState('GENERATION_ENDED+500ms'),500); const s=getState();if(s.oneShotDirective){s.oneShotDirective='';await saveState();render();}await refreshPrompt({includeAutoSpark:false});});
  setInterval(()=>{ ensureButton(); ensureSettingsEntry(); registerWandMenuItem(); syncSettingsEntry(); },1800);
  console.log('[HeartPulse] v0.9.0 ready');
  return true;
}

jQuery(document).ready(()=>{
  try{ init(); }
  catch(e){ console.error('[HeartPulse] fatal init error',e); emergencyOverlay(e); }
  [350,800,1600,3000,5000].forEach(ms=>setTimeout(()=>{ try{ensureButton();ensureSettingsEntry();registerWandMenuItem();if(!document.querySelector('#hpOverlay'))ensurePanel();}catch(e){console.error('[HeartPulse] retry failed',e);} },ms));
});

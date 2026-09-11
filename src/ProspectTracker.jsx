// ==================== VERSION 11 ====================  ← CHECK THIS MATCHES BEFORE YOU COMMIT
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sget, sset, sdel, storageMode as cloudStorageMode } from './storage.js';

const FREE_LIMIT = 3;
const PRO_KEY = 'is_pro';

// The user's dating profile — baked in so it is ALWAYS present, never needs
// saving, and can never be lost to storage. Editable in "My type" (a saved
// override is used if present), but this is the permanent default.
const DEFAULT_ME_DESC = "I'm 60, very active, fit, and I clean up well for a nice restaurant. I'm attracted to active, fit, thin, in-shape women roughly 40-50 (45 is my sweet spot; 55 is my max), who are young and energetic mentally and physically. I love dogs. I'm a family man with older kids and I like women with kids - older kids ideally, but young kids are fine too. I like sports but don't require a partner to. Dealbreakers / low ranking: snooty, stuck-up, high-maintenance, or demanding vibes. Orange County / SoCal profiles that are all about designer outfits, purses, fancy cars, Michelin-star restaurants, opera, Beverly Hills, extravagant travel, and high-end hotels are a turn-off - if her profile signals she expects that from the start, rank her low and say why. Flag anything snooty or entitled in her photos or words.";


const TIERS = [
  { color: '#34C759', label: 'High' },
  { color: '#FFCC00', label: 'Medium' },
  { color: '#FF3B30', label: 'Low' },
];
const APPS = ['Hinge', 'Bumble', 'Tinder', 'Other'];

// Deep link to open a dating app so you can paste your reply and send (compliant —
// we never message on your behalf, just open the app for you).
function appLink(app) {
  const m = {
    'Hinge': 'https://hinge.co/',
    'Bumble': 'https://bumble.com/app',
    'Tinder': 'https://tinder.com/app/recs',
    'Facebook Dating': 'https://www.facebook.com/dating',
    'Match': 'https://www.match.com',
    'Coffee Meets Bagel': 'https://coffeemeetsbagel.com',
    'The League': 'https://www.theleague.com',
  };
  return m[app] || '';
}
const STATUSES = [
  { key: 'new', label: 'New', color: '#0A84FF' },
  { key: 'talking', label: 'Talking', color: '#5E5CE6' },
  { key: 'datePlanned', label: 'Date planned', color: '#FF9F0A' },
  { key: 'dating', label: 'Dating', color: '#34C759' },
  { key: 'faded', label: 'Faded', color: '#8e8e93' },
];

// "See how it works" copy for the info dots
const HOWTO = {
  autofill: { title: '✨ Auto-fill from photos', body: 'Screenshot her profile (and your chat), add the images, then tap this. The app reads every screenshot — stat pills, prompts, even who messaged first — and fills in her age, city, height, and more automatically. No typing.' },
  ideas: { title: '💡 Date & chat ideas', body: 'The app reads everything you know about her — her profile, your notes, how past dates scored — and writes you 3 openers to text right now, 3 real date spots near you that fit her interests, 3 talking points, and one strategic tip. It gets sharper after every date you log.' },
  greenflag: { title: '🟢 Green/Red flag scan', body: 'Reads her profile and chat screenshots and surfaces the subtle green flags (things worth leaning into) and potential red flags (things worth a second look) most people miss.' },
  compat: { title: '❤️ Match score + Do\'s & Don\'ts', body: 'Fill out "My type" once (tap it up top). Then this reads her whole profile against what you want and gives a 0-100 match, plus specific Do\'s and Don\'ts — "she\'s sober, don\'t suggest drinks," "she\'s vegan, here are 3 spots near Balboa Island" — and flags your dealbreakers when it spots them. The more you tell it about your type, the sharper it gets.' },
  brag: { title: '📸 Brag Card', body: 'Turns a match into a clean, shareable card - her best photo, a witty caption, and your "stats" - that you can send to your group chat. Names are auto-hidden so it is private and shareable. This is the feature friends screenshot and pass around.' },
  chatcoach: { title: '🎯 Reply Coach', body: 'Paste what she last said, and get 3 great replies instantly - playful, sincere, or bold - each tuned to her vibe from her profile.' },
  ghost: { title: '👻 Ghost radar', body: 'Flags anyone you have not moved forward with in a while so nobody good slips through the cracks.' },
  wrapped: { title: '📊 Dating Wrapped', body: 'A shareable, Spotify-Wrapped-style recap of your dating life - dates logged, best-rated night, your type, your month. The kind of thing people post and their friends immediately want the app.' },
  vibe: { title: '🎨 Her vibe', body: 'The app reads her photos and names her aesthetic - "coastal sporty," "downtown art girl" - so your date idea actually matches her world.' },
};

const FACTS = [
  { key: 'age', label: 'Age' },
  { key: 'livesIn', label: 'Lives in' },
  { key: 'hometown', label: 'Hometown' },
  { key: 'height', label: 'Height' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'kids', label: 'Kids' },
  { key: 'religion', label: 'Religion' },
  { key: 'firstMove', label: 'Who messaged first' },
];

const SEED_NICKY = {
  id: "seed-nicky",
  name: "Nicky",
  app: "Hinge",
  tier: 0,
  profileNotes: "Psychologist, NYU grad, from New York. Looking for a life partner, monogamous.",
  myNotes: "",
  added: new Date().toISOString().slice(0,10),
  facts: {
    age: "39",
    livesIn: "Beverly Hills",
    hometown: "New York",
    height: "5'9\"",
    drinks: "Sometimes",
    kids: "Wants children",
    religion: "Jewish",
    firstMove: "Nicky (liked his photo first)"
  },
  photos: [],
};

const SEED_MALLORY = {
  id: "seed-mallory",
  name: "Mallory",
  app: "Bumble",
  tier: 0,
  status: "talking",
  nextStep: "Confirm Wednesday dinner (or next week if her kids' first week back is busy)",
  contact: "",
  profileNotes: "Lives in Huntington Beach. Divorced/co-parenting mom with school-age kids (has them on weekends). Homebody who loves her peaceful nights in but genuinely wants to share life with someone special. Warm, easygoing, playful sense of humor. Has a dog named Hurley. Agreed to a casual first date (dinner or coffee, zero pressure). Actively looking for something real, not games.",
  myNotes: "Great early rapport over text — she's responsive, warm, and into the low-key approach. She liked the 'man knocking at your front door someday' line.",
  added: new Date().toISOString().slice(0,10),
  facts: {
    age: "",
    livesIn: "Huntington Beach",
    hometown: "",
    height: "",
    drinks: "",
    kids: "Has school-age kids; has them on weekends",
    religion: "",
    firstMove: ""
  },
  details: [
    { cat: "Kids", text: "School-age kids, back to school; has them weekends" },
    { cat: "Note", text: "Dog named Hurley" },
    { cat: "Likes", text: "Peaceful nights in, movies, low-key evenings" },
    { cat: "She said", text: "Wishes the man she's meant to meet would just knock on her front door and say 'hello, I'm here'" },
    { cat: "She said", text: "Loves being alone but would be nice to share it with someone" },
    { cat: "Note", text: "Co-parenting; weekdays generally more open than weekends" }
  ],
  dates: [],
  photos: [],
};

const SEED_PEOPLE = [SEED_MALLORY, SEED_NICKY];
// ---------- storage: one key per person, plus an index of ids ----------
const INDEX_KEY = 'people_index';
const MIRROR_KEY = 'people_mirror';
const personKey = (id) => 'person_' + id;

// The user's profile: a saved override if they set one, else the permanent
// baked-in default. Never empty, never needs saving to work.
async function getMe() {
  try {
    const saved = await sget('me_desc');
    if (saved && String(saved).trim()) return saved;
  } catch (e) {}
  return DEFAULT_ME_DESC;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function blankPerson(name) {
  return {
    id: newId(),
    name: name || '',
    app: '',
    tier: 1,
    myRank: '',
    bucket: 'active',        // active | hold | deleted
    followUpDate: '',        // when to reconnect (YYYY-MM-DD)
    followUpNote: '',        // what to say / ask when you reconnect
    origin: '',              // how/where you found her (handle, app, event)
    friendVerdicts: { pursue: 0, meh: 0, pass: 0 }, // friend poll tally
    friendComments: [],      // [{who, text}]
    timeline: [],            // [{when, text}] activity log
    status: 'new',
    nextStep: '',
    contact: '',
    dates: [],
    details: [],
    profileNotes: '',
    myNotes: '',
    added: new Date().toISOString().slice(0, 10),
    photos: [],
    facts: { age: '', livesIn: '', hometown: '', height: '', drinks: '', kids: '', religion: '', firstMove: '' },
  };
}

function resizeImage(file, maxDim = 1000, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Robustly pull a JSON object/array out of a model response that may include
// prose, code fences, or stray text around it.
function parseJSON(raw) {
  if (!raw) throw new Error('Empty response');
  let s = String(raw).replace(/```json/gi, '').replace(/```/g, '').trim();
  // direct attempt
  try { return JSON.parse(s); } catch (e) {}
  // find the first { or [ and the matching last } or ]
  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  let start = -1, openCh = '{', closeCh = '}';
  if (firstObj === -1 && firstArr === -1) throw new Error('No JSON found in response');
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) { start = firstArr; openCh = '['; closeCh = ']'; }
  else { start = firstObj; }
  const end = s.lastIndexOf(closeCh);
  if (start !== -1 && end !== -1 && end > start) {
    let candidate = s.slice(start, end + 1);
    try { return JSON.parse(candidate); } catch (e) {}
    // remove trailing commas and retry
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(candidate); } catch (e) {}
    // smart quotes -> straight quotes
    candidate = candidate.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    return JSON.parse(candidate);
  }
  throw new Error('Could not parse response');
}

async function readProfileWithAI(photos) {
  if (!photos || !photos.length) return null;
  const instructions = 'These are screenshots from a dating app, numbered starting at 0. They may include her profile AND chat threads between her and the user (his messages are the colored/right-side bubbles; hers are the gray/left-side bubbles). Read EVERYTHING carefully — profile bio, prompts, stat pills, and every chat bubble — and extract every useful fact about HER.\n\nIDENTIFY THE APP — it is ALWAYS one of exactly three: Hinge, Bumble, or Tinder. Never pick anything else. Decide by the interface:\n- BUMBLE: sent (your) messages are YELLOW bubbles, received are light gray; the message input bar shows \"Aa\" with a GIF button; header shows her name with phone/video icons. Yellow bubbles = Bumble.\n- HINGE: messages attach to a specific profile prompt or photo (a small quoted prompt/photo sits above the comment); sent bubbles are muted purple/blue-gray on white.\n- TINDER: sent bubbles are a blue-to-pink gradient (or solid blue); very minimal chat UI.\nPick the single best of Hinge/Bumble/Tinder. If genuinely unsure, pick the closest match — never leave it blank and never invent another app.\n\nReturn ONLY a raw JSON object, no markdown, with keys: "name" (her first name as shown; "" if not visible), "app" (your best identification from above — do NOT leave blank if you can infer it), "age", "livesIn" (city she states anywhere, including in chat), "hometown", "height", "drinks", "kids" (if she mentions kids at all, summarize e.g. "Has school-age kids, has them on weekends"), "religion", "firstMove" (who sent first message/like; "" if unknown), \"phone\" (her phone number ONLY if she typed one in the chat; \"\" if none), "vibe" (2-4 word aesthetic label for her, e.g. "Beachy SoCal mom", "Polished nightlife"), "profileNotes" (3-6 sentences capturing her life, personality, and everything notable she revealed — kids, pets, homebody vs social, what she wants, her humor, anything from her bio and chats), "pets" (e.g. "Dog named Hurley" or ""), "details" (array of MANY short {"cat","text"} objects — capture everything worth remembering, cat one of Kids/Sports/Likes/Dislikes/"She said"/Note; aim for 5-10 items when the screenshots are rich), "mainPhotoIndex" (0-based index of the best clear photo OF HER FACE; prefer a real photo over a chat screenshot; if unsure use 0). Use "" or [] for anything not found. Read closely — capture as much as a thoughtful user would.';
  return askJSON(instructions, photos, 2500);
}

async function estimateDrive(fromLoc) {
  const prompt = 'Estimate driving from "' + fromLoc + '" to Balboa Island, Newport Beach, California. Give (1) shortest realistic time light traffic, (2) typical rush-hour time, (3) a well-known beach town roughly along the route between them (or "" if none). Respond ONLY with a raw JSON object, keys: "shortTime", "longTime", "beachNote". Each under 12 words. No markdown.';
  const resp = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) throw new Error('Request failed');
  const text = (data.content || []).map(c => c.text || '').join('');
  return parseJSON(text);
}

async function generateDateIdeas(person, me, learnings) {
  const p = person;
  const datesSummary = (p.dates || []).map(d => `${d.when || ''} at ${d.place || ''} (rated ${d.score || '?'}/10): ${d.howItWent || ''}`).join('; ');
  const context = [
    p.name ? 'Name: ' + p.name : '',
    p.facts.age ? 'Age: ' + p.facts.age : '',
    p.facts.livesIn ? 'Lives in: ' + p.facts.livesIn : '',
    p.app ? 'Met on: ' + p.app : '',
    p.profileNotes ? 'Her profile: ' + p.profileNotes : '',
    p.myNotes ? 'My notes: ' + p.myNotes : '',
    datesSummary ? 'Dates so far: ' + datesSummary : 'No dates yet',
  ].filter(Boolean).join('\n');
  const anyDates = (p.dates || []).length > 0;
  const prompt = `You are a sharp, socially-savvy dating coach helping a man plan his ${anyDates ? 'next' : 'first'} date and conversation with a woman he's tracking. He lives ON Balboa Island, Newport Beach, California. Use the specific details of HER to make it personal — reference her interests, her profile, how prior dates went. Pick spots near her, near him, or roughly halfway between her location and Balboa Island.

${me ? 'HIS preferences (honor these):\n' + me + '\n' : ''}${learnings ? 'What has WORKED on his past dates (favor these vibes, avoid what scored low):\n' + learnings + '\n' : ''}
Her info:
${context}

Give concrete, specific, ready-to-use suggestions. Respond ONLY with a raw JSON object (no markdown, no code fences) with these keys:
"openers": array of 3 short text/chat messages he could send her right now, each personalized to something specific about her, each under 30 words;
"dateSpots": array of 3 specific date ideas, each an object {"vibe":"Casual|Upscale|Beachy","place":"real named spot + area","price":"$|$$|$$$","why":"under 16 words why it fits her"};
"talkingPoints": array of 3 conversation topics or questions tailored to her interests, under 20 words each;
"oneMove": a single best strategic tip for this specific ${anyDates ? 'next' : 'first'} date, under 30 words.
Be specific and reference her actual details. No generic advice.`;
  const resp = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) throw new Error((data.error && data.error.message) || 'Request failed');
  const text = (data.content || []).map(c => c.text || '').join('');
  return parseJSON(text);
}

// pull the real media type + base64 payload out of a data URI
function imgBlock(src) {
  let media = 'image/jpeg';
  const m = /^data:([^;,]+)[;,]/.exec(src || '');
  if (m && m[1]) media = m[1];
  const i = src.indexOf(',');
  return { type: 'image', source: { type: 'base64', media_type: media, data: i >= 0 ? src.slice(i + 1) : src } };
}

// shared JSON caller — with auto-retry for transient failures
async function askJSON(prompt, images, maxTokens = 800) {
  const content = [];
  (images || []).slice(0, 20).forEach(src => { content.push(imgBlock(src)); });
  content.push({ type: 'text', text: prompt });
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: maxTokens, messages: [{ role: 'user', content }] }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error((data.error && data.error.message) || 'Request failed');
      const text = (data.content || []).map(c => c.text || '').join('');
      return parseJSON(text);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('Request failed');
}

// A short fingerprint of the inputs a match depends on. If it changes,
// the saved match is stale and must be recomputed.
function matchSig(desc, p) {
  const her = (p.name || '') + '|' + (p.profileNotes || '') + '|' + JSON.stringify(p.facts || {}) + '|' + (p.details || []).length + '|' + (p.photos || []).length;
  const me = (desc || '').trim();
  let h = 0; const s = me + '~~' + her;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return String(h);
}

function personContext(p) {
  const details = (p.details || []).map(d => d.cat + ': ' + d.text).join('; ');
  return [
    p.name ? 'Name: ' + p.name : '',
    p.facts.age ? 'Age: ' + p.facts.age : '',
    p.facts.livesIn ? 'Lives in: ' + p.facts.livesIn : '',
    p.app ? 'App: ' + p.app : '',
    p.profileNotes ? 'Profile: ' + p.profileNotes : '',
    details ? 'Known details: ' + details : '',
    p.myNotes ? 'My notes: ' + p.myNotes : '',
  ].filter(Boolean).join('\n');
}

// Learn from the whole roster: which kinds of dates got high scores (7+),
// so the assistant can lean into what's actually worked for this user.
function buildLearnings(people) {
  const good = [];
  const meh = [];
  (people || []).forEach(p => {
    (p.dates || []).forEach(d => {
      const s = parseInt(d.score, 10);
      if (!d || !d.place) return;
      const entry = (d.place || '') + (d.recap ? ' — ' + d.recap : '');
      if (!isNaN(s) && s >= 7) good.push(entry);
      else if (!isNaN(s) && s > 0 && s <= 4) meh.push(entry);
    });
  });
  if (!good.length && !meh.length) return '';
  let out = '';
  if (good.length) out += 'Dates that scored HIGH (lean into these types/vibes): ' + good.slice(-8).join('; ') + '. ';
  if (meh.length) out += 'Dates that scored LOW (avoid repeating these): ' + meh.slice(-5).join('; ') + '.';
  return out.trim();
}

async function scanFlags(p) {
  const prompt = `Based on this woman's dating profile and any chat screenshots, list subtle GREEN flags (positive signals worth leaning into) and potential RED flags (worth a second look). Be specific to her, not generic. Her info:\n${personContext(p)}\n\nRespond ONLY with raw JSON: {"green": [up to 4 short strings], "red": [up to 3 short strings]}. Each under 14 words. If nothing notable for a category, use an empty array.`;
  return askJSON(prompt, p.photos, 600);
}

async function freeMatchTaste(p, me) {
  const prompt = `Give a QUICK, basic read of this woman for the user — this is the free-tier teaser, so keep it minimal (paid unlocks the deep version). ${me ? 'His preferences: "' + me + '". ' : 'He has not set preferences yet, so judge general date-worthiness. '}Her info:\n${personContext(p)}\n\nEven if information is sparse, you MUST still give your best estimate. Respond ONLY with raw JSON: {"score": number 0-100 (rough match — never null, always a number), "vibe": "2-4 word aesthetic label (guess from any available detail)"}. No reasons, no tips — just those two.`;
  return askJSON(prompt, p.photos, 300);
}

async function matchVerdict(p, me, learnings) {
  const prompt = `You are the dating assistant behind an app that helps a man evaluate women he is tracking. Your job: read HER profile and screenshots VERY closely and tell him how good a match she is FOR HIM, and make his life easier with specific, concrete guidance so he looks outstanding.

HIS preferences and what he is looking for (the more detail, the better you tailor — if sparse, do your best and note it):
"""
${me || '(He has not filled out his preferences yet — give a general read and gently note that filling out his profile will sharply improve matching.)'}
"""

${learnings ? 'What has WORKED on his past dates (learn from this — favor what scored high, avoid what scored low):\n' + learnings + '\n' : ''}
HER info (read the attached screenshots closely too — bio, prompts, stat pills, chats):
${personContext(p)}

He lives on Balboa Island, Newport Beach, California. For date ideas, pick spots that are near her, near him, or roughly halfway between her location and Balboa Island — and tailor to a real trait of hers (e.g. vegan → vegan-friendly spots; beachy → waterfront).

Produce a close read. Even if info is sparse (few facts, no chats), you MUST still return your best-estimate score and vibe — never leave score null. Respond ONLY with a raw JSON object, no markdown, with:
"score": number 0-100 (honest match to HIS stated preferences — always a number, never null),
"vibe": "2-4 word aesthetic label for her",
"headline": one short sentence verdict (under 16 words),
"reasons": [2-4 short strings on why the score is what it is, tied to his preferences],
"dos": [up to 4 short "DO" tips specific to her],
"donts": [up to 4 short "DON'T" tips — e.g. "She is sober — do NOT invite her for drinks"],
"dealbreakerHits": [any of HIS stated dislikes/dealbreakers you actually spot in her profile, quoted briefly; empty array if none],
"dateIdeas": [exactly 3 objects, one casual, one upscale, one beachy/fun, each: {"vibe":"Casual|Upscale|Beachy","place":"specific named spot + neighborhood","price":"$|$$|$$$","why":"under 16 words why it fits HER and works as a date"}],
"missingInfo": "one short line on what info would sharpen this, or empty string".
Be specific and honest, never flattering. Use real, plausible Southern California / Orange County places.`;
  return askJSON(prompt, p.photos, 1600);
}

async function replyCoach(p, herMessage) {
  const prompt = `She just sent this message: "${herMessage}". Given who she is:\n${personContext(p)}\n\nWrite 3 strong replies he could send back, each a different flavor. Respond ONLY with raw JSON: {"playful": "...", "sincere": "...", "bold": "..."}. Each reply under 30 words, natural and textable, referencing her specifics where possible.`;
  return askJSON(prompt, null, 500);
}

async function readVibe(photos) {
  const prompt = `Look at these dating profile photos and name her overall aesthetic/vibe in 2-4 words (e.g. "coastal sporty", "downtown art girl", "outdoorsy adventurer"), plus one sentence on what kind of date energy matches it. Respond ONLY with raw JSON: {"vibe": "...", "note": "..."}.`;
  return askJSON(prompt, photos, 300);
}

async function bragCaption(p) {
  const prompt = `Write a short, witty, brag-worthy one-line caption for a "prospect card" this guy would share with his group chat about a woman he matched with. Keep her name out of it. Her info:\n${personContext(p)}\n\nRespond ONLY with raw JSON: {"caption": "under 15 words, fun and a little cocky but classy"}.`;
  return askJSON(prompt, null, 200);
}

// Ask a free-form question about THIS prospect, with her photos + data in context.
// The model answers AND may return field updates to apply (e.g. fixing her name).
async function askAboutPerson(p, question) {
  const factKeys = 'age, livesIn, hometown, height, drinks, kids, religion, firstMove';
  const prompt = `You are the user's dating assistant, embedded inside a specific woman's profile in his prospect-tracking app. He is asking you something about HER, and may be pointing you to details visible in her screenshots (attached). Look carefully at every attached image (profile tabs, prompts, stat pills, chat threads) to answer.

What is already saved about her:
${personContext(p)}

His question / request: "${question}"

Respond ONLY with a raw JSON object, no markdown, with:
"answer": a direct, helpful reply to him (under 60 words, conversational),
"updates": an object with ONLY the fields you are confident should be corrected or filled based on the images or his message. Allowed keys: "name", "app" (Hinge/Bumble/Tinder), "profileNotes", and any of these facts nested under "facts": { ${factKeys} }. Omit "updates" entirely or use {} if nothing should change. Never guess a value you cannot support from the images or his message.`;
  const r = await askJSON(prompt, p.photos, 900);
  return r;
}

export default function ProspectTracker() {
  const [people, setPeople] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [filterTier, setFilterTier] = useState(null); // null = all, 0/1/2
  const [view, setView] = useState('all'); // all | active | planning | followups | hold | deleted
  const [showPyramid, setShowPyramid] = useState(false);
  const [sortBy, setSortBy] = useState('age'); // default sort by age
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [howto, setHowto] = useState(null);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [hasPrefs, setHasPrefs] = useState(false);
  const [whyMatch, setWhyMatch] = useState(null);
  const didLoad = useRef(false);

  // ---- load once ----
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    (async () => {
      const proFlag = await sget(PRO_KEY);
      if (proFlag === true) setIsPro(true);
      setHasPrefs(true); // profile is always present (baked-in default)

      // Try BOTH the index and a full-mirror backup; use whichever has more people.
      let fromIndex = [];
      try {
        const index = await sget(INDEX_KEY);
        if (Array.isArray(index)) {
          for (const id of index) {
            const p = await sget(personKey(id));
            if (p) fromIndex.push(p);
          }
        }
      } catch (e) {}

      let fromMirror = [];
      try {
        const mirror = await sget(MIRROR_KEY);
        if (Array.isArray(mirror)) fromMirror = mirror;
      } catch (e) {}

      // Pick the richer source; merge any ids the other has that this one lacks.
      let base = fromMirror.length >= fromIndex.length ? fromMirror : fromIndex;
      const other = base === fromMirror ? fromIndex : fromMirror;
      const ids = new Set(base.map(p => p && p.id));
      other.forEach(p => { if (p && !ids.has(p.id)) { base.push(p); ids.add(p.id); } });

      let list = base.filter(Boolean);

      // Seed people (Mallory, Nicky) are PERMANENT — always ensure they exist,
      // baked into the code so they can never be lost to storage.
      const haveIds = new Set(list.map(p => p && p.id));
      SEED_PEOPLE.forEach(seed => {
        if (!haveIds.has(seed.id)) { list.unshift({ ...seed }); haveIds.add(seed.id); }
      });

      // normalize shape
      list.forEach(p => {
        if (!p.facts) p.facts = {};
        if (p.myNotes === undefined) p.myNotes = '';
        if (p.profileNotes === undefined) p.profileNotes = '';
        if (!p.photos) p.photos = [];
        if (p.status === undefined) p.status = 'new';
        if (p.nextStep === undefined) p.nextStep = '';
        if (p.contact === undefined) p.contact = '';
        if (!p.dates) p.dates = [];
        if (!p.details) p.details = [];
        if (p.myRank === undefined) p.myRank = '';
        if (p.bucket === undefined) p.bucket = 'active';
        if (p.followUpDate === undefined) p.followUpDate = '';
        if (p.followUpNote === undefined) p.followUpNote = '';
        if (p.origin === undefined) p.origin = '';
        if (!p.friendVerdicts) p.friendVerdicts = { pursue: 0, meh: 0, pass: 0 };
        if (!p.friendComments) p.friendComments = [];
        if (!p.timeline) p.timeline = [];
        // one-time cleanup: the original seed-Nicky shipped with placeholder photos
        // that were not actually her. Remove them from the stored copy, once.
        if (p.id === 'seed-nicky' && !p._photoFix) {
          p.photos = [];
          p._photoFix = true;
        }
      });

      // Rank = position in the list. Make sure the numbers match the order.
      list = list.map((p, idx) => ({ ...p, myRank: String(idx + 1) }));

      setPeople(list);
      setLoaded(true);
      // write everything back through both channels so they re-converge
      persistAll(list);
    })();
  }, []);

  // ---- persistence: mirror the WHOLE list + per-person keys + index ----
  const persistAll = useCallback(async (list) => {
    try { await sset(MIRROR_KEY, list); } catch (e) {}
    try { await sset(INDEX_KEY, list.map(p => p.id)); } catch (e) {}
    for (const p of list) { try { await sset(personKey(p.id), p); } catch (e) {} }
  }, []);

  // ---- persistence: save ONE person + keep index + mirror in sync ----
  const savePerson = useCallback(async (person, currentList) => {
    await sset(personKey(person.id), person);
    const ids = (currentList || []).map(p => p.id);
    await sset(INDEX_KEY, ids);
    try { await sset(MIRROR_KEY, currentList || []); } catch (e) {}
  }, []);

  const updatePerson = useCallback((id, patch) => {
    setPeople(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch, facts: patch.facts ? { ...p.facts, ...patch.facts } : p.facts } : p);
      const changed = next.find(p => p.id === id);
      if (changed) savePerson(changed, next);
      return next;
    });
  }, [savePerson]);

  const addPerson = useCallback((person) => {
    setPeople(prev => {
      // give the new person the next rank number (goes to the bottom)
      const maxRank = prev.reduce((m, p) => {
        const r = (p.myRank != null && p.myRank !== '') ? parseInt(p.myRank, 10) : 0;
        return r > m ? r : m;
      }, 0);
      const withRank = { ...person, myRank: String(maxRank + 1) };
      const next = [withRank, ...prev];
      savePerson(withRank, next);
      return next;
    });
    setOpenId(person.id);
    setAdding(false);
  }, [savePerson]);

  const removePerson = useCallback((id) => {
    setPeople(prev => {
      const next = prev.filter(p => p.id !== id);
      sset(INDEX_KEY, next.map(p => p.id));
      sset(MIRROR_KEY, next);
      sdel(personKey(id));
      return next;
    });
    setOpenId(null);
  }, []);

  const reorderByIds = useCallback((idOrder) => {
    setPeople(prev => {
      const byId = {}; prev.forEach(p => { byId[p.id] = p; });
      const next = idOrder.map(id => byId[id]).filter(Boolean).map((p, idx) => ({ ...p, myRank: String(idx + 1) }));
      // include any people not in idOrder (safety)
      prev.forEach(p => { if (!idOrder.includes(p.id)) next.push(p); });
      sset(INDEX_KEY, next.map(p => p.id));
      sset(MIRROR_KEY, next);
      next.forEach(p => sset(personKey(p.id), p));
      return next;
    });
  }, []);

  const move = useCallback((id, dir) => {
    setPeople(prev => {
      const i = prev.findIndex(p => p.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(i, 1);   // remove the person
      next.splice(j, 0, moved);            // insert at new spot
      // keep myRank in step with position so the number shown matches
      const renum = next.map((p, idx) => ({ ...p, myRank: String(idx + 1) }));
      sset(INDEX_KEY, renum.map(p => p.id));
      sset(MIRROR_KEY, renum);
      renum.forEach(p => sset(personKey(p.id), p));
      return renum;
    });
  }, []);

  if (!loaded) {
    return <div style={S.screen}><div style={S.loading}>Loading…</div></div>;
  }

  const openPerson = people.find(p => p.id === openId);

  // ---- DETAIL VIEW ----
  const tryAdd = () => {
    if (!isPro && people.length >= FREE_LIMIT) { setShowPaywall(true); return; }
    setAdding(true);
  };

  const goPro = async () => { setIsPro(true); setShowPaywall(false); await sset(PRO_KEY, true); };

  if (openPerson) {
    return (
      <>
        <Detail
          person={openPerson}
          onBack={() => setOpenId(null)}
          onUpdate={updatePerson}
          onRemove={removePerson}
          isPro={isPro}
          onNeedPro={() => setShowPaywall(true)}
          onHowto={setHowto}
          learnings={buildLearnings(people)}
        />
        {howto && <HowToModal item={howto} onClose={() => setHowto(null)} />}
        {showPaywall && <Paywall onClose={() => setShowPaywall(false)} onUpgrade={goPro} />}
      </>
    );
  }

  // ---- ADD VIEW ----
  if (adding) {
    return (
      <>
        <AddScreen onCancel={() => setAdding(false)} onCreate={addPerson} onHowto={setHowto} />
        {howto && <HowToModal item={howto} onClose={() => setHowto(null)} />}
      </>
    );
  }

  // ---- LIST VIEW ----
  const q = query.trim().toLowerCase();
  const todayStr = new Date().toISOString().slice(0, 10);
  const visible = people.filter(p => {
    const bucket = p.bucket || 'active';
    // which section are we looking at?
    if (view === 'all') { /* show everyone regardless of bucket */ }
    else if (view === 'active' && bucket !== 'active') return false;
    else if (view === 'planning' && bucket !== 'planning') return false;
    else if (view === 'hold' && bucket !== 'hold') return false;
    else if (view === 'deleted' && bucket !== 'deleted') return false;
    else if (view === 'followups') {
      // show anyone (not deleted) who has a follow-up date that's due
      if (bucket === 'deleted') return false;
      if (!p.followUpDate) return false;
      if (p.followUpDate > todayStr) return false;
    }
    if (filterTier !== null && p.tier !== filterTier) return false;
    if (!q) return true;
    const hay = (p.name + ' ' + p.app + ' ' + (p.facts.livesIn || '') + ' ' + (p.facts.hometown || '') + ' ' + (p.facts.religion || '') + ' ' + (p.facts.kids || '') + ' ' + (p.contact || '') + ' ' + p.profileNotes + ' ' + p.myNotes + ' ' + (p.followUpNote || '')).toLowerCase();
    return hay.includes(q);
  }).map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const A = a.p, B = b.p;
      const num = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };
      const aiScore = (x) => (x.compat && x.compat.score != null) ? x.compat.score : -1;
      const driveMin = (x) => {
        const t = x.drive && (x.drive.longTime || x.drive.shortTime);
        const n = t ? parseInt(String(t).replace(/[^0-9]/g, ''), 10) : NaN;
        return isNaN(n) ? 99999 : n;
      };
      switch (sortBy) {
        case 'ai': return aiScore(B) - aiScore(A);
        case 'age': {
          const aa = num(A.facts.age), ba = num(B.facts.age);
          if (aa == null && ba == null) break;
          if (aa == null) return 1; if (ba == null) return -1;
          return aa - ba;
        }
        case 'distance': return driveMin(A) - driveMin(B);
        case 'first': {
          const f = (x) => (x.facts.firstMove || '').toLowerCase().includes('her') ? 0 : 1;
          if (f(A) !== f(B)) return f(A) - f(B);
          break;
        }
        case 'kids': {
          const k = (x) => (x.facts.kids || '').trim() ? 0 : 1;
          if (k(A) !== k(B)) return k(A) - k(B);
          break;
        }
        case 'religion': return (A.facts.religion || '~').localeCompare(B.facts.religion || '~');
        case 'myrank': {
          return a.i - b.i; // follow the stored order exactly (arrows reorder the array)
        }
        case 'tier':
        default: break;
      }
      // fallback: your interest tier, then manual order
      const ta = A.tier == null ? 1 : A.tier;
      const tb = B.tier == null ? 1 : B.tier;
      if (ta !== tb) return ta - tb;
      return a.i - b.i;
    }).map(x => x.p);
  const counts = [0, 1, 2].map(t => people.filter(p => p.tier === t && (p.bucket || 'active') === 'active').length);
  const needAction = people.filter(p => p.nextStep && p.nextStep.trim() && (p.bucket || 'active') === 'active').length;
  const holdCount = people.filter(p => (p.bucket || 'active') === 'hold').length;
  const planningCount = people.filter(p => (p.bucket || 'active') === 'planning').length;
  const deletedCount = people.filter(p => (p.bucket || 'active') === 'deleted').length;
  const followUpCount = people.filter(p => (p.bucket || 'active') !== 'deleted' && p.followUpDate && p.followUpDate <= todayStr).length;

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.title}>Prospects <span style={{ fontSize: 11, color: '#5E5CE6', fontWeight: 700, verticalAlign: 'middle' }}>v11</span></div>
        <div style={S.headerRight}>
          <button style={hasPrefs ? S.typeBtnSaved : S.wrappedBtn} onClick={() => setShowPrefs(true)}>🎯 My type{hasPrefs ? ' ✓' : ''}</button>
          {people.length > 0 && <button style={S.wrappedBtn} onClick={() => setShowCoach(true)}>🧠 Coach</button>}
          {people.length > 0 && <button style={S.wrappedBtn} onClick={() => setShowWrapped(true)}>📊 Wrapped</button>}
          {isPro
            ? <span style={S.proBadge}>PRO</span>
            : <button style={S.upgradeBtn} onClick={() => setShowPaywall(true)}>Upgrade</button>}
        </div>
      </div>

      <div style={S.demoToggle}>
        <span style={S.demoLabel}>Preview:</span>
        <button style={!isPro ? S.demoOn : S.demoOff} onClick={() => setIsPro(false)}>Free</button>
        <button style={isPro ? S.demoOnPro : S.demoOff} onClick={() => { setIsPro(true); sset(PRO_KEY, true); }}>Pro ✨</button>
        <span style={S.demoHint}>toggle to compare</span>
        <span style={S.demoHint}>· saving: {cloudStorageMode()}</span>
      </div>

      {!isPro && (
        <div style={S.freeBar}>Free plan · {people.length}/{FREE_LIMIT} prospects · <span style={S.freeBarLink} onClick={() => setShowPaywall(true)}>Go unlimited →</span></div>
      )}

      {people.length > 0 && (
        <div style={S.viewTabs}>
          <button style={{ ...S.viewTab, ...(view === 'all' ? S.viewTabOn : {}) }} onClick={() => setView('all')}>All ({people.filter(p => (p.bucket || 'active') !== 'deleted').length})</button>
          <button style={{ ...S.viewTab, ...(view === 'active' ? S.viewTabOn : {}) }} onClick={() => setView('active')}>Active</button>
          <button style={{ ...S.viewTab, ...(view === 'planning' ? S.viewTabOn : {}) }} onClick={() => setView('planning')}>Planning date{planningCount > 0 ? ' (' + planningCount + ')' : ''}</button>
          <button style={{ ...S.viewTab, ...(view === 'followups' ? S.viewTabOn : {}) }} onClick={() => setView('followups')}>Follow-ups{followUpCount > 0 ? ' (' + followUpCount + ')' : ''}</button>
          <button style={{ ...S.viewTab, ...(view === 'hold' ? S.viewTabOn : {}) }} onClick={() => setView('hold')}>On Hold{holdCount > 0 ? ' (' + holdCount + ')' : ''}</button>
          <button style={{ ...S.viewTab, ...(view === 'deleted' ? S.viewTabOn : {}) }} onClick={() => setView('deleted')}>Deleted{deletedCount > 0 ? ' (' + deletedCount + ')' : ''}</button>
          <button style={{ ...S.viewTab, background: '#5E5CE6', color: '#fff', borderColor: '#5E5CE6' }} onClick={() => setShowPyramid(true)}>🔺 Pyramid</button>
        </div>
      )}

      {people.length > 0 && view === 'active' && (
        <div style={S.statsRow}>
          <div style={S.statChip}><span style={{ color: TIERS[0].color }}>●</span> {counts[0]} high</div>
          <div style={S.statChip}><span style={{ color: TIERS[1].color }}>●</span> {counts[1]} med</div>
          <div style={S.statChip}><span style={{ color: TIERS[2].color }}>●</span> {counts[2]} low</div>
          {needAction > 0 && <div style={{ ...S.statChip, color: '#FF9F0A' }}>⏱ {needAction} to act on</div>}
        </div>
      )}

      {people.length > 0 && (
        <>
          <div style={S.searchWrap}>
            <input style={S.search} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, city, kids, religion, notes…" />
            {query ? <button style={S.searchClear} onClick={() => setQuery('')}>×</button> : null}
          </div>
          <div style={S.sortRow}>
            <span style={S.sortLabel}>Sort:</span>
            <select style={S.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="tier">My interest (High→Low)</option>
              <option value="myrank">My rank (1st, 2nd…)</option>
              <option value="ai">AI match score</option>
              <option value="age">Age</option>
              <option value="distance">Distance from me</option>
              <option value="first">Who reached out first</option>
              <option value="kids">Has kids</option>
              <option value="religion">Religion</option>
            </select>
          </div>
          <div style={S.filterRow}>
            <button style={{ ...S.filterChip, ...(filterTier === null ? S.filterChipOn : {}) }} onClick={() => setFilterTier(null)}>All</button>
            {TIERS.map((t, i) => (
              <button key={i} style={{ ...S.filterChip, ...(filterTier === i ? { background: t.color, color: '#000', borderColor: t.color } : {}) }} onClick={() => setFilterTier(i)}>{t.label}</button>
            ))}
          </div>
        </>
      )}

      <div style={S.list}>
        {visible.length === 0 && (
          <div style={S.emptyState}>{
            people.length === 0 ? 'No prospects yet. Tap below to add your first.' :
            view === 'planning' ? 'Nobody in planning. Set a prospect\'s List to "Planning" when a date is in the works.' :
            view === 'hold' ? 'Nobody on hold. Open a prospect and set their List to "Hold" to park them here.' :
            view === 'deleted' ? 'Nobody deleted. Deleted prospects stay here so you remember not to revisit them.' :
            view === 'followups' ? 'No follow-ups due. Set a follow-up date on a prospect to be reminded to reconnect.' :
            'None match.'
          }</div>
        )}
        {visible.map((p, visIdx) => {
          const tier = TIERS[p.tier] || TIERS[1];
          const status = STATUSES.find(s => s.key === p.status) || STATUSES[0];
          return (
            <div key={p.id} style={S.row} onClick={() => setOpenId(p.id)}>
              <div style={{ ...S.rowBar, background: tier.color }} />
              <div style={S.rank}>{visIdx + 1}</div>
              {p.photos[0]
                ? <img src={p.photos[0]} style={S.rowAvatar} alt="" />
                : <div style={S.rowAvatarBlank}>{(p.name || '?')[0].toUpperCase()}</div>}
              {p.compat && p.compat.score != null ? (
                <div style={{ ...S.matchBadge, borderColor: matchColor(p.compat.score) }}
                  onClick={(e) => { e.stopPropagation(); setWhyMatch(p); }}>
                  <div style={S.matchEmoji}>{matchEmoji(p.compat.score)}</div>
                  <div style={{ ...S.matchNum, color: matchColor(p.compat.score) }}>{p.compat.score}</div>
                </div>
              ) : null}
              <div style={S.rowMid}>
                <div style={S.rowName}>
                  <span style={{ color: tier.color }}>{p.name || 'Untitled'}</span>
                  {p.facts.age ? <span style={{ ...S.rowAge, color: tier.color }}> · {p.facts.age}</span> : null}
                  <span style={{ ...S.tierBadge, background: tier.color }}>{tier.label}</span>
                </div>
                <div style={S.rowSub}>
                  <span style={{ ...S.statusPill, background: status.color }}>{status.label}</span>
                  {p.app ? ' ' + p.app : ''}
                  {p.facts.livesIn ? ' · ' + p.facts.livesIn : ''}
                </div>
                {p.drive && (p.drive.shortTime || p.drive.longTime) ? <div style={S.driveLineRow}>🚗 {p.drive.shortTime || p.drive.longTime} to you</div> : null}
                {p.nextStep && p.nextStep.trim() ? <div style={S.nextStepLine}>⏱ {p.nextStep}</div> : null}
                {p.followUpDate ? <div style={S.followUpLine}>🔔 {p.followUpDate}{p.followUpNote ? ' — ' + p.followUpNote : ''}</div> : null}
              </div>
              <div style={S.rowArrows} onClick={e => e.stopPropagation()}>
                <button style={S.arrowBtn} onClick={() => { setSortBy('myrank'); move(p.id, -1); }}>▲</button>
                <button style={S.arrowBtn} onClick={() => { setSortBy('myrank'); move(p.id, 1); }}>▼</button>
              </div>
            </div>
          );
        })}
      </div>

      <button style={S.fab} onClick={tryAdd}>+ Add prospect</button>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} onUpgrade={goPro} />}
      {howto && <HowToModal item={howto} onClose={() => setHowto(null)} />}
      {showWrapped && <Wrapped people={people} onClose={() => setShowWrapped(false)} />}
      {showCoach && <Coach people={people} onClose={() => setShowCoach(false)} onOpen={(id) => { setShowCoach(false); setOpenId(id); }} />}
      {showPyramid && <Pyramid people={people} onClose={() => setShowPyramid(false)} onOpen={(id) => { setShowPyramid(false); setOpenId(id); }} onReorder={reorderByIds} />}
      {showPrefs && <PrefsModal onClose={() => setShowPrefs(false)} onSaved={(d) => setHasPrefs(!!(d && d.trim()))} />}
      {whyMatch && <WhyMatch person={whyMatch} onClose={() => setWhyMatch(null)} />}
    </div>
  );
}

// ================= ADD SCREEN =================
function AddScreen({ onCancel, onCreate, onHowto }) {
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pickPhotos = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setBusy(true);
    const out = [];
    for (const f of arr) out.push(await resizeImage(f));
    setPhotos(prev => [...prev, ...out]);
    setBusy(false);
  };

  const create = () => {
    const person = blankPerson(name.trim());
    person.photos = photos;
    if (photos.length) person._autoRead = true; // auto-fill on open, no extra tap
    onCreate(person);
  };

  return (
    <div style={S.screen}>
      <div style={S.navBar}>
        <button style={S.navBtn} onClick={onCancel}>Cancel</button>
        <div style={S.navTitle}>New prospect</div>
        <button style={{ ...S.navBtn, ...S.navBtnDone, opacity: (name.trim() || photos.length) ? 1 : 0.4 }} onClick={create} disabled={!name.trim() && !photos.length}>Add</button>
      </div>

      <div style={S.addBody}>
        <div style={S.photoStrip}>
          {photos.map((src, i) => <img key={i} src={src} style={S.stripImg} alt="" />)}
          <button style={S.stripAdd} onClick={() => fileRef.current && fileRef.current.click()}>
            {busy ? '…' : '+'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { pickPhotos(e.target.files); e.target.value = ''; }} />
        </div>
        <div style={S.hint}>Add screenshots of her profile &amp; chat — the app reads them automatically and fills in her details. <InfoDot onClick={() => onHowto(HOWTO.autofill)} /></div>

        <div style={S.fieldLabel}>Name / handle</div>
        <input style={S.bigInput} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nicky" autoFocus />
      </div>
    </div>
  );
}

// ================= DETAIL SCREEN =================
function Detail({ person, onBack, onUpdate, onRemove, isPro, onNeedPro, onHowto, learnings }) {
  const p = person;
  const tier = TIERS[p.tier] || TIERS[1];
  const fileRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [reading, setReading] = useState(false);
  const [readErr, setReadErr] = useState('');
  const [drive, setDrive] = useState(p.drive || null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [ideas, setIdeas] = useState(p.ideas || null);
  const [ideasBusy, setIdeasBusy] = useState(false);
  const [ideasErr, setIdeasErr] = useState('');
  const [editingDate, setEditingDate] = useState(null); // index or 'new'
  const [flags, setFlags] = useState(p.flags || null);
  const [flagsBusy, setFlagsBusy] = useState(false);
  const [compat, setCompat] = useState(p.compat || null);
  const [compatBusy, setCompatBusy] = useState(false);
  const [vibe, setVibe] = useState(p.vibe || null);
  const [hasPrefsLocal, setHasPrefsLocal] = useState(true);
  const [showWhy, setShowWhy] = useState(false);
  const [compatErr, setCompatErr] = useState(false);
  const [addDetail, setAddDetail] = useState(null); // category string or null
  const [detailText, setDetailText] = useState('');
  const [coachMsg, setCoachMsg] = useState('');
  const [coachOut, setCoachOut] = useState(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [brag, setBrag] = useState(null);
  const [bragBusy, setBragBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [askMsg, setAskMsg] = useState('');
  const [askThread, setAskThread] = useState([]); // {q, a}
  const [askBusy, setAskBusy] = useState(false);
  const gate = () => { if (!isPro) { onNeedPro(); return false; } return true; };

  const livesIn = p.facts.livesIn;
  useEffect(() => {
    if (!livesIn) return;
    if (drive && drive.for === livesIn) return;
    let cancel = false;
    setDriveBusy(true);
    (async () => {
      try {
        const r = await estimateDrive(livesIn);
        if (!cancel) { const d = { ...r, for: livesIn }; setDrive(d); onUpdate(p.id, { drive: d }); }
      } catch (e) {
        if (!cancel) setDrive({ error: true, for: livesIn });
      } finally {
        if (!cancel) setDriveBusy(false);
      }
    })();
    return () => { cancel = true; };
  }, [livesIn]);

  const addPhotos = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const out = [];
    for (const f of arr) out.push(await resizeImage(f));
    onUpdate(p.id, { photos: [...p.photos, ...out] });
  };

  const readPhotos = async () => {
    if (!p.photos.length || reading) return;
    setReading(true); setReadErr('');
    let r = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { r = await readProfileWithAI(p.photos); break; }
      catch (e) {
        if (attempt === 1) { setReadErr('Could not read these photos — try again, or add clearer screenshots.'); setReading(false); return; }
      }
    }
    if (r) {
      const patch = applyRead(p, r);
      onUpdate(p.id, patch);
      // re-run the match against the freshly-filled data
      const cur = { ...p, ...patch, facts: patch.facts || p.facts };
      if (isPro) {
        setCompatBusy(true); setCompatErr(false);
        try {
          const desc = await getMe();
          const mv = await matchVerdict(cur, desc, learnings);
          mv.sig = matchSig(desc, cur);
          setCompat(mv); onUpdate(cur.id, { compat: mv });
        } catch (e) { setCompatErr(true); } finally { setCompatBusy(false); }
      }
    }
    setReading(false);
  };

  const getIdeas = async () => {
    if (ideasBusy) return;
    if (!gate()) return;
    setIdeasBusy(true); setIdeasErr('');
    try {
      const desc = await getMe();
      const r = await generateDateIdeas(p, desc, learnings);
      setIdeas(r);
      onUpdate(p.id, { ideas: r });
    } catch (e) {
      setIdeasErr(e && e.message ? e.message : 'Could not generate ideas.');
    } finally {
      setIdeasBusy(false);
    }
  };

  const runFlags = async () => {
    if (flagsBusy) return;
    if (!gate()) return;
    setFlagsBusy(true);
    try { const r = await scanFlags(p); setFlags(r); onUpdate(p.id, { flags: r }); }
    catch (e) {} finally { setFlagsBusy(false); }
  };

  const runCompatCore = async () => {
    const desc = await getMe();
    const r = await matchVerdict(p, desc, learnings);
    r.sig = matchSig(desc, p); // remember what this score was computed against
    setCompat(r); onUpdate(p.id, { compat: r });
    return r;
  };

  const runCompat = async () => {
    if (compatBusy) return;
    if (!gate()) return;
    setCompatBusy(true);
    try { await runCompatCore(); }
    catch (e) { setCompatErr(true); } finally { setCompatBusy(false); }
  };

  // Auto-compute on open. Everything runs automatically — no button taps.
  const autoMatchRef = useRef(false);
  useEffect(() => {
    if (autoMatchRef.current) return;
    autoMatchRef.current = true;
    (async () => {
      const desc = await getMe();
      setHasPrefsLocal(true);

      // STEP 0 — auto-fill from photos. Runs whenever she has photos AND any
      // key field is still missing, so it fills gaps instead of skipping.
      let cur = p;
      const f = p.facts || {};
      const missingKey = !p.app || !f.age || !f.livesIn || !p.profileNotes || !(p.details && p.details.length);
      const looksUnread = p.photos && p.photos.length && (p._autoRead || missingKey);
      if (looksUnread && !reading) {
        setReading(true); setReadErr('');
        try {
          const r = await readProfileWithAI(p.photos);
          if (r) {
            const patch = applyRead(p, r);
            onUpdate(p.id, patch);
            cur = { ...p, ...patch, facts: patch.facts || p.facts };
            if (patch.vibe) setVibe(patch.vibe); // show vibe immediately
          }
        } catch (e) { setReadErr('Could not read the screenshots — tap ✨ Auto-fill to retry.'); }
        finally { setReading(false); }
      }

      const wantSig = matchSig(desc, cur);
      const stale = !cur.compat || cur.compat.free || cur.compat.score == null || cur.compat.sig !== wantSig;

      if (isPro) {
        if (stale) {
          setCompatBusy(true); setCompatErr(false);
          try {
            const r = await matchVerdict(cur, desc, learnings);
            r.sig = wantSig;
            setCompat(r); onUpdate(cur.id, { compat: r });
          }
          catch (e) { setCompatErr(true); }
          finally { setCompatBusy(false); }
        }
      } else {
        if (!cur.compat || cur.compat.score == null) {
          setCompatBusy(true); setCompatErr(false);
          try {
            const r = await freeMatchTaste(cur, desc);
            const light = { score: r.score, vibe: r.vibe, free: true, sig: wantSig };
            setCompat(light); onUpdate(cur.id, { compat: light });
          } catch (e) { setCompatErr(true); }
          finally { setCompatBusy(false); }
        }
      }

      // VIBE — Pro, auto
      if (isPro && !cur.vibe && cur.photos.length) {
        try { const rv = await readVibe(cur.photos); setVibe(rv); onUpdate(cur.id, { vibe: rv }); } catch (e) {}
      }

      // DATE IDEAS + OPENERS — auto for everyone
      if (!cur.ideas) {
        setIdeasBusy(true);
        try { const ri = await generateDateIdeas(cur, desc, learnings); setIdeas(ri); onUpdate(cur.id, { ideas: ri }); }
        catch (e) {}
        finally { setIdeasBusy(false); }
      }
    })();
  }, []);

  const runCoach = async () => {
    if (coachBusy || !coachMsg.trim()) return;
    if (!gate()) return;
    setCoachBusy(true);
    try { const r = await replyCoach(p, coachMsg.trim()); setCoachOut(r); }
    catch (e) {} finally { setCoachBusy(false); }
  };

  const runVibe = async () => {
    if (!p.photos.length) return;
    if (!gate()) return;
    try { const r = await readVibe(p.photos); setVibe(r); onUpdate(p.id, { vibe: r }); } catch (e) {}
  };

  const makeBrag = async () => {
    if (bragBusy) return;
    if (!gate()) return;
    setBragBusy(true);
    try { const r = await bragCaption(p); setBrag(r.caption || ''); }
    catch (e) {} finally { setBragBusy(false); }
  };

  const runAsk = async () => {
    const q = askMsg.trim();
    if (!q || askBusy) return;
    setAskBusy(true);
    setAskMsg('');
    try {
      const r = await askAboutPerson(p, q);
      const answer = (r && r.answer) ? r.answer : 'Done.';
      // apply any field updates the assistant returned
      if (r && r.updates && typeof r.updates === 'object') {
        const u = r.updates;
        const patch = {};
        if (u.name) patch.name = u.name;
        if (u.app) patch.app = u.app;
        if (u.profileNotes) patch.profileNotes = u.profileNotes;
        if (u.facts && typeof u.facts === 'object') patch.facts = u.facts;
        if (Object.keys(patch).length) onUpdate(p.id, patch);
      }
      setAskThread(prev => [...prev, { q, a: answer }]);
    } catch (e) {
      setAskThread(prev => [...prev, { q, a: 'Sorry — could not process that. Try again.' }]);
    } finally {
      setAskBusy(false);
    }
  };

  const saveDate = (entry, index) => {
    const dates = (p.dates || []).slice();
    if (index === 'new') dates.push(entry);
    else dates[index] = entry;
    onUpdate(p.id, { dates });
    setEditingDate(null);
  };

  const deleteDate = (index) => {
    const dates = (p.dates || []).slice();
    dates.splice(index, 1);
    onUpdate(p.id, { dates });
    setEditingDate(null);
  };

  return (
    <div style={S.screen}>
      <div style={S.navBar}>
        <button style={S.navBtn} onClick={onBack}>‹ List</button>
        <div style={S.navTitle}>{p.name || 'Prospect'}</div>
        <button style={confirmDel ? S.navDeleteArmed : S.navDelete} onClick={() => { if (confirmDel) { onUpdate(p.id, { bucket: 'deleted' }); onBack(); } else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000); } }}>{confirmDel ? 'Move to Deleted' : 'Delete'}</button>
      </div>

      <div style={S.detailBody}>
        {/* photos first */}
        <div style={S.photoStrip}>
          {p.photos.map((src, i) => (
            <div key={i} style={S.stripItem}>
              <img src={src} style={S.stripImg} alt="" onClick={() => setViewer(i)} />
              <button style={S.stripDel} onClick={(e) => {
                e.stopPropagation();
                const next = p.photos.slice(); next.splice(i, 1);
                onUpdate(p.id, { photos: next });
              }}>×</button>
            </div>
          ))}
          <button style={S.stripAdd} onClick={() => fileRef.current && fileRef.current.click()}>+</button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />
        </div>
        <div style={S.multiHint}>Tap + then <b>Select</b> to add all her screenshots at once — no need to add them one by one.</div>

        {/* ===== MATCH INTELLIGENCE — the hero panel ===== */}
        <div style={isPro ? S.miPro : S.miFree}>
          <div style={S.miHead}>
            <span style={S.miTitle}>Match Intelligence</span>
            <span style={isPro ? S.miTagPro : S.miTagFree}>{isPro ? '✨ PRO' : 'FREE'}</span>
          </div>

          {/* score + vibe row — both tiers */}
          <div style={S.miScoreRow}>
            <div style={S.miScoreBlock}>
              <div style={S.miEmoji}>{compat && compat.score != null ? matchEmoji(compat.score) : '—'}</div>
              <div style={{ ...S.miScoreNum, color: compat && compat.score != null ? matchColor(compat.score) : '#8e8e93' }}>
                {compat && compat.score != null ? compat.score : (compatBusy ? '…' : '—')}
                <span style={S.miScoreOf}>/100</span>
              </div>
              <div style={S.miScoreLbl}>match to you</div>
            </div>
            <div style={S.miVibeBlock}>
              <div style={S.miVibeLbl}>🎨 Her vibe</div>
              <div style={S.miVibeVal}>{vibe && vibe.vibe ? vibe.vibe : (compat && compat.vibe ? compat.vibe : (compatBusy ? '…' : '—'))}</div>
              {isPro && compat && compat.headline ? <div style={S.miVibeNote}>{compat.headline}</div> : null}
            </div>
          </div>

          {!hasPrefsLocal && !compatBusy ? (
            <div style={S.miNoPrefs}>💡 Fill out 🎯 My type up top for a score matched to the real you.</div>
          ) : null}

          {compatBusy && (!compat || compat.score == null) ? (
            <div style={S.miAnalyzing}>Analyzing her against your type…</div>
          ) : null}

          {compatErr ? (
            <div style={S.miRetryRow}>Couldn't analyze just now. <span style={S.miRetryLink} onClick={() => { setCompatErr(false); runCompat(); }}>Tap to retry</span></div>
          ) : null}

          {/* 🚩 dealbreaker — always visible in Pro when present (never bury a warning) */}
          {isPro && compat && compat.dealbreakerHits && compat.dealbreakerHits.length ? (
            <div style={S.dealbreakerBox}>
              <div style={S.dealbreakerTitle}>🚩 Heads up</div>
              {compat.dealbreakerHits.map((d, i) => <div key={i} style={S.dealbreakerItem}>{d}</div>)}
            </div>
          ) : null}

          {/* 📍 DATE IDEAS — auto-pop, clean cards, both tiers get a taste */}
          {(ideas && ideas.dateSpots && ideas.dateSpots.length) || ideasBusy ? (
            <div style={S.heroBlock}>
              <div style={S.heroBlockTitle}>📍 Where to take her</div>
              {ideasBusy && !(ideas && ideas.dateSpots) ? <div style={S.heroLoading}>Finding great spots…</div> : null}
              {(ideas && ideas.dateSpots ? (isPro ? ideas.dateSpots : ideas.dateSpots.slice(0, 1)) : []).map((o, i) => (
                typeof o === 'string'
                  ? <div key={i} style={S.ideaCard}>📍 {o}</div>
                  : (
                    <div key={i} style={S.ideaCard}>
                      <div style={S.ideaCardTop}><span style={S.ideaVibe}>{o.vibe}</span><span style={S.ideaPrice}>{o.price}</span></div>
                      <div style={S.ideaPlace}>{o.place}</div>
                      {o.why ? <div style={S.ideaWhy}>{o.why}</div> : null}
                    </div>
                  )
              ))}
              {!isPro && ideas && ideas.dateSpots && ideas.dateSpots.length > 1 ? (
                <div style={S.lockRow} onClick={onNeedPro}>🔒 +{ideas.dateSpots.length - 1} more date ideas (upscale, beachy) with Pro</div>
              ) : null}
            </div>
          ) : null}

          {/* 💬 THINGS TO SAY — auto-pop openers */}
          {(ideas && ideas.openers && ideas.openers.length) ? (
            <div style={S.heroBlock}>
              <div style={S.heroBlockTitle}>💬 Say this to her</div>
              {(isPro ? ideas.openers : ideas.openers.slice(0, 1)).map((o, i) => (
                <div key={i} style={S.sayCard} onClick={() => { try { navigator.clipboard.writeText(o); } catch (e) {} }}>{o}<span style={S.sayCopy}>tap to copy</span></div>
              ))}
              {!isPro && ideas.openers.length > 1 ? (
                <div style={S.lockRow} onClick={onNeedPro}>🔒 +{ideas.openers.length - 1} more openers with Pro</div>
              ) : null}
            </div>
          ) : null}

          {/* PRO: collapsible deep analysis (do's, don'ts, reasons) — tap to unfold */}
          {isPro && compat && (compat.dos || compat.donts || compat.reasons) ? (
            <>
              <button style={S.unfoldBtn} onClick={() => setShowWhy(v => !v)}>
                {showWhy ? '▲ Hide the full playbook' : '▼ See the full playbook — why, do\'s & don\'ts'}
              </button>
              {showWhy ? (
                <div style={S.unfoldBox}>
                  {compat.reasons ? compat.reasons.map((r, i) => <div key={i} style={S.compatReason}>• {r}</div>) : null}
                  {compat.dos && compat.dos.length ? (
                    <div style={S.dosBox}><div style={S.dosTitle}>✅ Do</div>{compat.dos.map((d, i) => <div key={i} style={S.doItem}>{d}</div>)}</div>
                  ) : null}
                  {compat.donts && compat.donts.length ? (
                    <div style={S.dontsBox}><div style={S.dontsTitle}>⛔ Don't</div>{compat.donts.map((d, i) => <div key={i} style={S.dontItem}>{d}</div>)}</div>
                  ) : null}
                  {compat.talkingPoints ? null : null}
                  {compat.missingInfo ? <div style={S.compatMissing}>💡 {compat.missingInfo}</div> : null}
                </div>
              ) : null}
            </>
          ) : null}

          {/* FREE: the unlock pitch */}
          {!isPro ? (
            <div style={S.miLocked}>
              <div style={S.miLockedTitle}>🔒 Unlock the full playbook with Pro</div>
              <div style={S.miLockedRow}>✅ Why she matches you + do's &amp; don'ts</div>
              <div style={S.miLockedRow}>🚩 Dealbreaker alerts from her profile</div>
              <div style={S.miLockedRow}>📍 All 3 date ideas — casual, upscale, beachy, priced &amp; halfway between you</div>
              <div style={S.miLockedRow}>💬 Every opener + reply coaching</div>
              <div style={S.miLockedRow}>🧠 Learns what worked on past dates</div>
              <button style={S.miUnlockBtn} onClick={onNeedPro}>See the Pro version →</button>
            </div>
          ) : null}
        </div>

        {readErr ? <div style={S.errText}>{readErr}</div> : null}

        {/* name — editable */}
        <div style={S.fieldLabel}>Name / handle</div>
        <input style={S.bigInput} value={p.name} placeholder="Type or fix her name"
          onChange={e => onUpdate(p.id, { name: e.target.value })} />
        <div style={{ height: 16 }} />

        {/* secondary AI tools (Pro) */}
        {isPro && p.photos.length > 0 && (
          <div style={S.aiToolbar}>
            <button style={S.aiChipBtn} onClick={readPhotos} disabled={reading}>{reading ? 'Reading…' : '✨ Auto-fill'}<InfoDot onClick={() => onHowto(HOWTO.autofill)} /></button>
            <button style={S.aiChipBtn} onClick={runVibe}>🎨 Her vibe<InfoDot onClick={() => onHowto(HOWTO.vibe)} /></button>
            <button style={S.aiChipBtn} onClick={runFlags} disabled={flagsBusy}>{flagsBusy ? '…' : '🟢 Flag scan'}<InfoDot onClick={() => onHowto(HOWTO.greenflag)} /></button>
            <button style={S.aiChipBtn} onClick={runCompat} disabled={compatBusy}>{compatBusy ? '…' : '❤️ Match %'}<InfoDot onClick={() => onHowto(HOWTO.compat)} /></button>
          </div>
        )}

        {isPro && flags ? (
          <div style={S.flagsBox}>
            {(flags.green || []).map((f, i) => <div key={'g' + i} style={S.flagGreen}>🟢 {f}</div>)}
            {(flags.red || []).map((f, i) => <div key={'r' + i} style={S.flagRed}>🔴 {f}</div>)}
          </div>
        ) : null}

        {/* ask the assistant about HER — no need to leave the app */}
        <div style={S.askWrap}>
          <div style={S.askTitle}>💬 Ask about her</div>
          <div style={S.askHint}>Ask me anything or tell me to fix something — e.g. "her name is Sarah, it's in the last photo" or "what should I message her?"</div>
          {askThread.map((t, i) => (
            <div key={i} style={S.askExchange}>
              <div style={S.askQ}>{t.q}</div>
              <div style={S.askA}>{t.a}</div>
            </div>
          ))}
          {askBusy ? <div style={S.askThinking}>Thinking…</div> : null}
          <div style={S.askInputRow}>
            <input style={S.askInput} value={askMsg} onChange={e => setAskMsg(e.target.value)}
              placeholder="Ask or tell me to fix something…"
              onKeyDown={e => { if (e.key === 'Enter') runAsk(); }} />
            <button style={S.askSend} onClick={runAsk} disabled={askBusy || !askMsg.trim()}>Send</button>
          </div>
        </div>

        {/* tier */}
        <div style={S.fieldLabel}>Interest</div>
        <div style={S.tierRow}>
          {TIERS.map((t, i) => (
            <button key={i} onClick={() => onUpdate(p.id, { tier: i })}
              style={{ ...S.tierChip, background: p.tier === i ? t.color : '#1c1c1e', color: p.tier === i ? '#000' : t.color, borderColor: t.color }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* my manual rank */}
        <div style={S.fieldLabel}>My rank (1 = top pick)</div>
        <input style={S.input} type="number" min="1" value={p.myRank || ''} placeholder="e.g. 1"
          onChange={e => onUpdate(p.id, { myRank: e.target.value })} />
        <div style={{ height: 14 }} />

        {/* bucket: where does this person live? */}
        <div style={S.fieldLabel}>List</div>
        <div style={S.tierRow}>
          {[['active', 'Active'], ['planning', 'Planning'], ['hold', 'Hold'], ['deleted', 'Deleted']].map(([key, label]) => (
            <button key={key} onClick={() => onUpdate(p.id, { bucket: key })}
              style={{ ...S.appChip, background: (p.bucket || 'active') === key ? '#0A84FF' : '#1c1c1e', color: (p.bucket || 'active') === key ? '#fff' : '#8e8e93' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ height: 14 }} />

        {/* follow-up reminder — the CRM piece */}
        <div style={S.fieldLabel}>🔔 Reconnect on (date)</div>
        <input style={S.input} type="date" value={p.followUpDate || ''}
          onChange={e => onUpdate(p.id, { followUpDate: e.target.value })} />
        <div style={{ height: 10 }} />
        <div style={S.fieldLabel}>What to say / ask when you reconnect</div>
        <textarea style={S.textarea} value={p.followUpNote || ''}
          placeholder="e.g. Ask how her son's kindergarten start went; her mom visits from Iran every 6 months — ask about family back home."
          onChange={e => onUpdate(p.id, { followUpNote: e.target.value })} />
        {p.followUpDate ? (
          <button style={S.readBtn} onClick={() => {
            const dt = (p.followUpDate || '').replace(/-/g, '');
            const title = 'Reconnect with ' + (p.name || 'prospect');
            const desc = (p.followUpNote || '').replace(/\n/g, ' ');
            const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
              'DTSTART;VALUE=DATE:' + dt, 'SUMMARY:' + title, 'DESCRIPTION:' + desc,
              'END:VEVENT','END:VCALENDAR'].join('\r\n');
            const blob = new Blob([ics], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'reconnect.ics'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
          }}>📅 Add reminder to my calendar</button>
        ) : null}
        <div style={{ height: 14 }} />

        {/* how/where you found her — never lose track */}
        <div style={S.fieldLabel}>📍 How / where I found her</div>
        <input style={S.input} value={p.origin || ''}
          placeholder="e.g. Bumble, matched Aug 12 · IG @handle · met at Balboa fireworks"
          onChange={e => onUpdate(p.id, { origin: e.target.value })} />
        <div style={{ height: 14 }} />

        {/* friend verdict poll — the social layer */}
        <div style={S.fieldLabel}>👥 Friend verdict</div>
        <div style={S.verdictRow}>
          {[['pursue', '👍 Pursue', '#34C759'], ['meh', '🤔 Meh', '#FFCC00'], ['pass', '👎 Pass', '#FF3B30']].map(([key, label, color]) => (
            <button key={key} style={{ ...S.verdictBtn, borderColor: color }}
              onClick={() => {
                const v = { ...(p.friendVerdicts || { pursue: 0, meh: 0, pass: 0 }) };
                v[key] = (v[key] || 0) + 1;
                onUpdate(p.id, { friendVerdicts: v });
              }}>
              <span style={{ color }}>{label}</span>
              <span style={S.verdictCount}>{(p.friendVerdicts && p.friendVerdicts[key]) || 0}</span>
            </button>
          ))}
        </div>
        <div style={{ height: 8 }} />
        <button style={S.readBtn} onClick={() => {
          const c = window.prompt('Add a friend comment (e.g. "Jake: go for it!")');
          if (c && c.trim()) onUpdate(p.id, { friendComments: [...(p.friendComments || []), { text: c.trim() }] });
        }}>+ Add a friend comment</button>
        {(p.friendComments || []).length ? (
          <div style={S.commentsBox}>
            {(p.friendComments || []).map((c, i) => <div key={i} style={S.commentItem}>💬 {c.text}</div>)}
          </div>
        ) : null}
        <div style={{ height: 14 }} />

        {/* status */}
        <div style={S.fieldLabel}>Status</div>
        <div style={S.statusRow}>
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => onUpdate(p.id, { status: s.key })}
              style={{ ...S.statusChip, background: p.status === s.key ? s.color : '#1c1c1e', color: p.status === s.key ? '#fff' : '#8e8e93' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* next step */}
        <div style={S.fieldLabel}>⏱ Next step</div>
        <input style={S.input} value={p.nextStep} placeholder="e.g. Text her about Saturday"
          onChange={e => onUpdate(p.id, { nextStep: e.target.value })} />
        <div style={{ height: 14 }} />

        {/* contact */}
        <Field label="Contact (number / IG)" value={p.contact} onChange={v => onUpdate(p.id, { contact: v })} />

        {/* app */}
        <div style={S.fieldLabel}>App</div>
        <div style={S.tierRow}>
          {APPS.map(a => (
            <button key={a} onClick={() => onUpdate(p.id, { app: a })}
              style={{ ...S.appChip, background: p.app === a ? '#0A84FF' : '#1c1c1e', color: p.app === a ? '#fff' : '#8e8e93' }}>
              {a}
            </button>
          ))}
        </div>

        {/* drive time */}
        {livesIn ? (
          <div style={S.driveBox}>
            <div style={S.driveTitle}>🚗 To Balboa Island</div>
            {driveBusy ? <div style={S.driveLine}>Calculating…</div>
              : drive && drive.error ? <div style={S.driveLine}>Could not estimate.</div>
              : drive ? (
                <>
                  <div style={S.driveLine}>Best case: {drive.shortTime}</div>
                  <div style={S.driveLine}>Rush hour: {drive.longTime}</div>
                  {drive.beachNote ? <div style={S.driveLine}>Along the way: {drive.beachNote}</div> : null}
                </>
              ) : null}
          </div>
        ) : null}

        {/* facts */}
        <div style={S.factsWrap}>
          {FACTS.map(f => (
            <Field key={f.key} label={f.label} value={p.facts[f.key] || ''} onChange={v => onUpdate(p.id, { facts: { [f.key]: v } })} small />
          ))}
        </div>

        {/* things to remember — super easy structured tracking */}
        <div style={S.fieldLabel}>🧠 Remember about her</div>
        <div style={S.rememberBox}>
          {(p.details || []).length === 0 ? <div style={S.rememberEmpty}>Tap a button to jot down what you learn — her kids, sports, likes, things she said.</div> : null}
          {(p.details || []).map((d, i) => (
            <div key={i} style={S.rememberItem}>
              <span style={{ ...S.rememberTag, background: detailColor(d.cat) }}>{d.cat}</span>
              <span style={S.rememberText}>{d.text}</span>
              <button style={S.rememberDel} onClick={() => {
                const next = (p.details || []).slice(); next.splice(i, 1); onUpdate(p.id, { details: next });
              }}>×</button>
            </div>
          ))}
          <div style={S.rememberBtns}>
            {['Kids', 'Sports', 'Likes', 'Dislikes', 'She said', 'Note'].map(cat => (
              <button key={cat} style={S.rememberAdd} onClick={() => setAddDetail(cat)}>+ {cat}</button>
            ))}
          </div>
        </div>

        {/* notes */}
        <div style={S.fieldLabel}>From her profile</div>
        <textarea style={S.textarea} value={p.profileNotes} placeholder="Bio, prompts…"
          onChange={e => onUpdate(p.id, { profileNotes: e.target.value })} />

        {/* date log */}
        <div style={S.fieldLabel}>📅 Dates</div>
        <div style={S.dateLog}>
          {(p.dates || []).map((d, i) => (
            <div key={i} style={S.dateCard} onClick={() => setEditingDate(i)}>
              <div style={S.dateCardTop}>
                <span style={S.dateWhen}>{d.when || 'Date ' + (i + 1)}</span>
                {d.score ? <span style={{ ...S.dateScore, background: scoreColor(d.score) }}>{d.score}/10</span> : null}
              </div>
              {d.place ? <div style={S.datePlace}>📍 {d.place}</div> : null}
              {d.howItWent ? <div style={S.dateHow}>{d.howItWent}</div> : null}
            </div>
          ))}
          <button style={S.dateAdd} onClick={() => setEditingDate('new')}>+ Log a date</button>
        </div>

        {/* more talking points (Pro) — the hero already shows date spots + openers */}
        {isPro && ideas && (ideas.talkingPoints || ideas.oneMove) ? (
          <>
            <div style={S.sectionLabel}>💡 More to talk about <InfoDot onClick={() => onHowto(HOWTO.ideas)} /></div>
            <div style={S.ideasBox}>
              {ideas.oneMove ? <div style={S.ideasStar}>⭐ {ideas.oneMove}</div> : null}
              {ideas.talkingPoints && ideas.talkingPoints.length ? (
                <div style={S.ideasGroup}>
                  {ideas.talkingPoints.map((o, i) => <div key={i} style={S.ideaItem}>💬 {o}</div>)}
                </div>
              ) : null}
              <button style={S.ideasRefresh} onClick={getIdeas} disabled={ideasBusy}>{ideasBusy ? 'Thinking…' : '↻ Fresh ideas'}</button>
            </div>
          </>
        ) : null}
        {ideasErr ? <div style={S.errText}>{ideasErr}</div> : null}

        {/* reply coach */}
        <div style={S.sectionLabel}>🎯 Reply Coach <InfoDot onClick={() => onHowto(HOWTO.chatcoach)} /></div>
        <input style={S.input} value={coachMsg} onChange={e => setCoachMsg(e.target.value)} placeholder="Paste what she last said…" />
        <button style={{ ...S.readBtn, marginTop: 8 }} onClick={runCoach} disabled={coachBusy || !coachMsg.trim()}>{coachBusy ? 'Thinking…' : 'Get 3 replies'}</button>
        {coachOut && (
          <div style={S.ideasBox}>
            {['playful', 'sincere', 'bold'].map(k => coachOut[k] ? (
              <div key={k} style={S.ideasGroup}>
                <div style={S.ideasHead}>{k}</div>
                <div style={S.ideaChat} onClick={() => { try { navigator.clipboard.writeText(coachOut[k]); } catch (e) {} }}>{coachOut[k]}<span style={S.ideaCopy}>copy</span></div>
              </div>
            ) : null)}
            {appLink(p.app) ? (
              <a href={appLink(p.app)} target="_blank" rel="noopener noreferrer" style={S.openAppBtn}>
                Copy a reply, then open {p.app} to send →
              </a>
            ) : null}
          </div>
        )}

        {/* brag card */}
        <div style={S.sectionLabel}>📸 Brag Card <InfoDot onClick={() => onHowto(HOWTO.brag)} /></div>
        <button style={S.bragBtn} onClick={makeBrag} disabled={bragBusy}>{bragBusy ? 'Making…' : 'Make a shareable card'}</button>
        {brag !== null && (
          <div style={S.bragCard}>
            {p.photos[0] ? <img src={p.photos[0]} style={S.bragPhoto} alt="" /> : <div style={S.bragPhotoBlank}>?</div>}
            <div style={S.bragOverlay}>
              <div style={S.bragCaption}>"{brag}"</div>
              <div style={S.bragStats}>
                {p.facts.age ? p.facts.age : ''}{p.facts.livesIn ? ' · ' + p.facts.livesIn : ''}{p.app ? ' · ' + p.app : ''}
              </div>
              <div style={S.bragTier}>{(TIERS[p.tier] || TIERS[1]).label} interest</div>
            </div>
            <div style={S.bragBrand}>tracked in Prospects</div>
          </div>
        )}
        {brag !== null ? <div style={S.bragHint}>Screenshot this to share — her name is never shown.</div> : null}

        {/* friends' opinion card — the social layer, made to screenshot & send */}
        <div style={S.sectionLabel}>🗳️ "Should I pursue?" card</div>
        <div style={S.friendCard}>
          <div style={S.friendCardTop}>
            {p.photos[0] ? <img src={p.photos[0]} style={S.friendCardImg} alt="" /> : <div style={S.friendCardImgBlank}>{(p.name || '?')[0].toUpperCase()}</div>}
            <div>
              <div style={S.friendCardName}>{p.name || 'Prospect'}{p.facts.age ? ', ' + p.facts.age : ''}</div>
              <div style={S.friendCardMeta}>{p.facts.livesIn || ''}{p.app ? ' · ' + p.app : ''}</div>
              {p.compat && p.compat.score != null ? <div style={{ ...S.friendCardScore, color: matchColor(p.compat.score) }}>{matchEmoji(p.compat.score)} {p.compat.score}/100 match</div> : null}
            </div>
          </div>
          <div style={S.friendCardQ}>What do you think — should I pursue her?</div>
          <div style={S.friendCardTally}>
            <span style={{ color: '#34C759' }}>👍 {(p.friendVerdicts && p.friendVerdicts.pursue) || 0}</span>
            <span style={{ color: '#FFCC00' }}>🤔 {(p.friendVerdicts && p.friendVerdicts.meh) || 0}</span>
            <span style={{ color: '#FF3B30' }}>👎 {(p.friendVerdicts && p.friendVerdicts.pass) || 0}</span>
          </div>
          <div style={S.bragBrand}>Prospects</div>
        </div>
        <button style={S.shareBtn} onClick={async () => {
          const text = 'Should I pursue her? 👍 pursue / 🤔 meh / 👎 pass';
          try {
            const blob = await renderProspectCard(p);
            await shareCardBlob(blob, text);
          } catch (e) {
            try { if (navigator.share) await navigator.share({ text }); } catch (e2) {}
          }
        }}>📤 Share her card</button>
        <div style={S.bragHint}>Makes a fun image card (up to 4 of her pics + her stats + a vote prompt) and opens your share sheet — text it to friends. Tap their votes into the 👥 buttons above.</div>
        <div style={{ height: 8 }} />

        <div style={S.myNotesLabel}>🎤 My notes (tap the mic on your keyboard to talk)</div>
        <textarea style={{ ...S.textarea, ...S.myNotes }} value={p.myNotes} placeholder="Dictate or type your own thoughts…"
          onChange={e => onUpdate(p.id, { myNotes: e.target.value })} />

        <div style={S.added}>Added {p.added}</div>
      </div>

      {viewer !== null && (
        <div style={S.viewerOverlay} onClick={() => setViewer(null)}>
          <button style={S.viewerClose} onClick={e => { e.stopPropagation(); setViewer(null); }}>×</button>
          {p.photos.length > 1 && <button style={S.viewerPrev} onClick={e => { e.stopPropagation(); setViewer((viewer - 1 + p.photos.length) % p.photos.length); }}>‹</button>}
          <img src={p.photos[viewer]} style={S.viewerImg} onClick={e => e.stopPropagation()} alt="" />
          {p.photos.length > 1 && <button style={S.viewerNext} onClick={e => { e.stopPropagation(); setViewer((viewer + 1) % p.photos.length); }}>›</button>}
        </div>
      )}

      {editingDate !== null && (
        <DateEditor
          entry={editingDate === 'new' ? null : p.dates[editingDate]}
          onCancel={() => setEditingDate(null)}
          onSave={(entry) => saveDate(entry, editingDate)}
          onDelete={editingDate === 'new' ? null : () => deleteDate(editingDate)}
        />
      )}

      {addDetail !== null && (
        <div style={S.sheetOverlay} onClick={() => { setAddDetail(null); setDetailText(''); }}>
          <div style={S.detailSheet} onClick={e => e.stopPropagation()}>
            <div style={S.sheetHandle} />
            <div style={S.sheetTitle}>Add: {addDetail}</div>
            <input style={S.bigInput} autoFocus value={detailText}
              onChange={e => setDetailText(e.target.value)}
              placeholder={addDetail === 'Kids' ? 'e.g. Daughter Mia, 8, plays soccer' : addDetail === 'She said' ? 'e.g. Said she loves sunset hikes' : 'Type it…'}
              onKeyDown={e => { if (e.key === 'Enter' && detailText.trim()) { onUpdate(p.id, { details: [...(p.details || []), { cat: addDetail, text: detailText.trim() }] }); setAddDetail(null); setDetailText(''); } }} />
            <button style={S.sheetSave} onClick={() => { if (detailText.trim()) { onUpdate(p.id, { details: [...(p.details || []), { cat: addDetail, text: detailText.trim() }] }); setAddDetail(null); setDetailText(''); } }}>Save</button>
            <button style={S.sheetCancel} onClick={() => { setAddDetail(null); setDetailText(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, small }) {
  return (
    <div style={{ marginBottom: small ? 0 : 14 }}>
      <div style={S.fieldLabel}>{label}</div>
      <input style={S.input} value={value} onChange={e => onChange(e.target.value)} placeholder="—" />
    </div>
  );
}

// Build a patch from an AI profile-read, filling in any gaps (never wiping
// data the user already has). Used by both auto-fill-on-open and the button.
function applyRead(p, r) {
  const facts = { ...(p.facts || {}) };
  ['age', 'livesIn', 'hometown', 'height', 'drinks', 'kids', 'religion', 'firstMove'].forEach(k => {
    if (r[k] && !facts[k]) facts[k] = r[k]; // fill only empty facts
  });
  const patch = { facts, _autoRead: false };
  if (r.name && (!p.name || !p.name.trim())) patch.name = r.name;
  if (r.app && !p.app) patch.app = r.app;
  if (r.phone && !p.contact) patch.contact = r.phone;
  if (r.vibe && !p.vibe) patch.vibe = { vibe: r.vibe };
  if (r.profileNotes && !p.profileNotes) patch.profileNotes = r.profileNotes;
  // merge structured details, de-duped
  const existing = (p.details || []);
  const seen = new Set(existing.map(d => (d.cat + '|' + d.text).toLowerCase()));
  const add = [];
  if (Array.isArray(r.details)) {
    r.details.forEach(d => {
      if (d && d.cat && d.text && !seen.has((d.cat + '|' + d.text).toLowerCase())) { add.push(d); seen.add((d.cat + '|' + d.text).toLowerCase()); }
    });
  }
  if (r.pets && !seen.has(('note|' + r.pets).toLowerCase())) add.push({ cat: 'Note', text: r.pets });
  if (add.length) patch.details = [...existing, ...add];
  // main photo to front
  const mi = parseInt(r.mainPhotoIndex, 10);
  if (!isNaN(mi) && mi > 0 && mi < (p.photos || []).length) {
    const reordered = p.photos.slice();
    const [main] = reordered.splice(mi, 1); reordered.unshift(main);
    patch.photos = reordered;
  }
  return patch;
}

function scoreColor(score) {
  const n = parseInt(score, 10) || 0;
  if (n >= 8) return '#34C759';
  if (n >= 5) return '#FFCC00';
  return '#FF3B30';
}

// ---- Shareable card image rendering (canvas → PNG → native share) ----
function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Build a shareable PNG for ONE prospect: a photo collage + her info + vote prompt.
async function renderProspectCard(p) {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  // background
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1830'); g.addColorStop(1, '#0a0a0c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // photo collage (up to 4)
  const pics = (p.photos || []).slice(0, 4);
  const imgs = [];
  for (const src of pics) { const im = await loadImg(src); if (im) imgs.push(im); }
  const gridX = 60, gridY = 60, gridW = W - 120, gridH = 720, gap = 12;
  if (imgs.length === 1) {
    roundRectPath(ctx, gridX, gridY, gridW, gridH, 28); ctx.save(); ctx.clip();
    drawCover(ctx, imgs[0], gridX, gridY, gridW, gridH); ctx.restore();
  } else if (imgs.length >= 2) {
    const cols = 2, rows = Math.ceil(Math.min(imgs.length, 4) / 2);
    const cw = (gridW - gap) / 2, ch = (gridH - (rows - 1) * gap) / rows;
    imgs.slice(0, 4).forEach((im, i) => {
      const cx = gridX + (i % 2) * (cw + gap);
      const cy = gridY + Math.floor(i / 2) * (ch + gap);
      roundRectPath(ctx, cx, cy, cw, ch, 20); ctx.save(); ctx.clip();
      drawCover(ctx, im, cx, cy, cw, ch); ctx.restore();
    });
  } else {
    // no photos — initial circle
    ctx.fillStyle = '#2c2c2e'; roundRectPath(ctx, gridX, gridY, gridW, gridH, 28); ctx.fill();
    ctx.fillStyle = '#8e8e93'; ctx.font = 'bold 200px -apple-system, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText((p.name || '?')[0].toUpperCase(), W / 2, gridY + gridH / 2 + 70);
  }

  // text
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 76px -apple-system, sans-serif';
  const nameLine = (p.name || 'A prospect') + (p.facts && p.facts.age ? ', ' + p.facts.age : '');
  ctx.fillText(nameLine, 60, 870);
  ctx.fillStyle = '#c7c7cc';
  ctx.font = '42px -apple-system, sans-serif';
  const meta = [p.facts && p.facts.livesIn, p.app].filter(Boolean).join('  ·  ');
  if (meta) ctx.fillText(meta, 60, 930);
  if (p.compat && p.compat.score != null) {
    ctx.fillStyle = matchColor(p.compat.score);
    ctx.font = 'bold 48px -apple-system, sans-serif';
    ctx.fillText(matchEmoji(p.compat.score) + '  ' + p.compat.score + '/100 match', 60, 1000);
  }
  // vote prompt
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Should I pursue her?', W / 2, 1120);
  ctx.font = '52px -apple-system, sans-serif';
  ctx.fillText('👍 pursue    🤔 meh    👎 pass', W / 2, 1200);
  ctx.fillStyle = '#5E5CE6';
  ctx.font = 'bold 36px -apple-system, sans-serif';
  ctx.fillText('Prospects', W / 2, 1290);

  return await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.92));
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function shareCardBlob(blob, text) {
  if (!blob) { if (navigator.share) await navigator.share({ text }); return; }
  const file = new File([blob], 'prospect.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
  } catch (e) {}
  // fallback: download the image so the user can attach it
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'prospect.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Render the whole pyramid (everyone's photos) as one shareable PNG.
async function renderPyramidCard(ordered) {
  const W = 1080;
  // build rows 1,2,3,4…
  const rows = []; let idx = 0, size = 1;
  while (idx < ordered.length) { rows.push(ordered.slice(idx, idx + size)); idx += size; size += 1; }
  const cell = 150, gap = 16, topPad = 180, rowGap = 30;
  const H = topPad + rows.length * (cell + 30 + rowGap) + 80;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = Math.max(H, 700);
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#1a1830'); g.addColorStop(1, '#0a0a0c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, canvas.height);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.font = 'bold 64px -apple-system, sans-serif';
  ctx.fillText('🔺 My Prospect Pyramid', W / 2, 90);
  ctx.fillStyle = '#8e8e93'; ctx.font = '36px -apple-system, sans-serif';
  ctx.fillText('Who belongs on top? Send me your ranking 👀', W / 2, 145);

  // preload images
  const imgMap = {};
  for (const p of ordered) { if (p.photos && p.photos[0]) imgMap[p.id] = await loadImg(p.photos[0]); }

  let y = topPad;
  for (const row of rows) {
    const rowW = row.length * cell + (row.length - 1) * gap;
    let x = (W - rowW) / 2;
    for (const p of row) {
      const tier = TIERS[p.tier] || TIERS[1];
      roundRectPath(ctx, x, y, cell, cell, 22); ctx.save(); ctx.clip();
      const im = imgMap[p.id];
      if (im) drawCover(ctx, im, x, y, cell, cell);
      else { ctx.fillStyle = '#2c2c2e'; ctx.fillRect(x, y, cell, cell); ctx.fillStyle = '#8e8e93'; ctx.font = 'bold 70px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.fillText((p.name || '?')[0].toUpperCase(), x + cell / 2, y + cell / 2 + 25); }
      ctx.restore();
      // tier border
      ctx.strokeStyle = tier.color; ctx.lineWidth = 6; roundRectPath(ctx, x, y, cell, cell, 22); ctx.stroke();
      // name
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px -apple-system, sans-serif'; ctx.textAlign = 'center';
      const nm = (p.name || '—').slice(0, 10);
      ctx.fillText(nm, x + cell / 2, y + cell + 26);
      x += cell + gap;
    }
    y += cell + 30 + rowGap;
  }
  ctx.fillStyle = '#5E5CE6'; ctx.font = 'bold 34px -apple-system, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Prospects', W / 2, canvas.height - 30);
  return await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.92));
}

// Match score (0-100) → emoji + color, for the card badge
function matchEmoji(score) {
  const n = parseInt(score, 10);
  if (isNaN(n)) return '';
  if (n >= 85) return '💖';
  if (n >= 70) return '❤️';
  if (n >= 55) return '👍';
  if (n >= 40) return '😐';
  return '👎';
}
function matchColor(score) {
  const n = parseInt(score, 10);
  if (isNaN(n)) return '#8e8e93';
  if (n >= 70) return '#34C759';
  if (n >= 40) return '#FFCC00';
  return '#FF3B30';
}
function detailColor(cat) {
  const m = { Kids: '#FF9F0A', Sports: '#0A84FF', Likes: '#34C759', Dislikes: '#FF3B30', 'She said': '#5E5CE6', Note: '#8e8e93' };
  return m[cat] || '#8e8e93';
}

// ================= DATE EDITOR =================
function DateEditor({ entry, onCancel, onSave, onDelete }) {
  const [when, setWhen] = useState(entry ? entry.when || '' : todayNice());
  const [place, setPlace] = useState(entry ? entry.place || '' : '');
  const [score, setScore] = useState(entry ? entry.score || 0 : 0);
  const [howItWent, setHowItWent] = useState(entry ? entry.howItWent || '' : '');
  const [comments, setComments] = useState(entry ? entry.comments || '' : '');
  const [nextIdea, setNextIdea] = useState(entry ? entry.nextIdea || '' : '');

  const save = () => onSave({ when, place, score, howItWent, comments, nextIdea });

  return (
    <div style={S.sheetOverlay} onClick={onCancel}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.sheetTitle}>{entry ? 'Edit date' : 'Log a date'}</div>

        <div style={S.fieldLabel}>Day &amp; date</div>
        <input style={S.input} value={when} onChange={e => setWhen(e.target.value)} placeholder="e.g. Sat, Aug 24" />
        <div style={{ height: 12 }} />

        <div style={S.fieldLabel}>Where</div>
        <input style={S.input} value={place} onChange={e => setPlace(e.target.value)} placeholder="e.g. Blackie's by the Sea, Newport" />
        <div style={{ height: 12 }} />

        <div style={S.fieldLabel}>How it went — {score || 0}/10</div>
        <div style={S.scoreRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => setScore(n)}
              style={{ ...S.scoreDot, background: n <= score ? scoreColor(score) : '#2c2c2e', color: n <= score ? '#000' : '#8e8e93' }}>{n}</button>
          ))}
        </div>

        <div style={S.fieldLabel}>Recap</div>
        <textarea style={S.textarea} value={howItWent} onChange={e => setHowItWent(e.target.value)} placeholder="How did it actually go?" />

        <div style={S.fieldLabel}>Comments</div>
        <textarea style={S.textarea} value={comments} onChange={e => setComments(e.target.value)} placeholder="Anything she said, notes to self…" />

        <div style={S.fieldLabel}>💡 Idea for next date</div>
        <textarea style={S.textarea} value={nextIdea} onChange={e => setNextIdea(e.target.value)} placeholder="Something she mentioned you could build on…" />

        <button style={S.sheetSave} onClick={save}>Save</button>
        {onDelete ? <button style={S.sheetDelete} onClick={onDelete}>Delete this date</button> : null}
        <button style={S.sheetCancel} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function todayNice() {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ================= INFO DOT + HOW-TO =================
function InfoDot({ onClick }) {
  return <span style={S.infoDot} onClick={(e) => { e.stopPropagation(); onClick(); }}>i</span>;
}

function HowToModal({ item, onClose }) {
  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.howtoCard} onClick={e => e.stopPropagation()}>
        <div style={S.howtoTitle}>{item.title}</div>
        <div style={S.howtoBody}>{item.body}</div>
        <button style={S.howtoBtn} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

// ================= PAYWALL =================
function Paywall({ onClose, onUpgrade }) {
  const perks = [
    'Unlimited prospects',
    '✨ Auto-fill from screenshots',
    '💡 AI date & chat ideas',
    '🎯 Reply Coach',
    '❤️ Compatibility scores',
    '🟢 Green/red flag scans',
    '📸 Shareable Brag Cards',
    '📊 Dating Wrapped',
  ];
  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.paywall} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.paywallTitle}>Go Pro</div>
        <div style={S.paywallSub}>Your dating life, on easy mode.</div>
        <div style={S.perkList}>
          {perks.map((p, i) => <div key={i} style={S.perk}>✓ {p}</div>)}
        </div>
        <button style={S.payBtn} onClick={onUpgrade}>Start Pro — $6.99/mo</button>
        <button style={S.payBtnAlt} onClick={onUpgrade}>Or $39.99/year (save 52%)</button>
        <button style={S.previewBtn} onClick={onUpgrade}>👀 Preview all features free</button>
        <button style={S.sheetCancel} onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

// ================= DATING WRAPPED =================
function WhyMatch({ person, onClose }) {
  const c = person.compat || {};
  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.prefs} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.whyTop}>
          <span style={S.whyBig}>{matchEmoji(c.score)}</span>
          <span style={{ ...S.whyScore, color: matchColor(c.score) }}>{c.score}<span style={S.whyOf}>/100</span></span>
        </div>
        <div style={S.whyName}>Why {person.name || 'she'} is a {c.score >= 70 ? 'strong' : c.score >= 40 ? 'moderate' : 'weak'} match</div>
        {c.headline ? <div style={S.whyHeadline}>{c.headline}</div> : null}
        {(c.reasons || []).map((r, i) => <div key={i} style={S.whyReason}>• {r}</div>)}
        {(c.dealbreakerHits && c.dealbreakerHits.length) ? (
          <div style={S.dealbreakerBox}>
            <div style={S.dealbreakerTitle}>🚩 Dealbreaker alert</div>
            {c.dealbreakerHits.map((d, i) => <div key={i} style={S.dealbreakerItem}>{d}</div>)}
          </div>
        ) : null}
        <button style={S.howtoBtn} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

function PrefsModal({ onClose, onSaved }) {
  const [desc, setDesc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  useEffect(() => {
    (async () => { const d = await sget('me_desc'); setDesc((d && String(d).trim()) ? d : DEFAULT_ME_DESC); setLoaded(true); })();
  }, []);
  const save = async () => {
    await sset('me_desc', desc);
    if (onSaved) onSaved(desc);
    setSavedMsg(true);
    setTimeout(() => { setSavedMsg(false); onClose(); }, 900);
  };
  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.prefs} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.prefsTitle}>🎯 My type</div>
        <div style={S.prefsSub}>Tell me what you're looking for and what turns you off. The more you share, the sharper I can score each prospect and flag her profile for you. This is private, saved on your device, and you can change it anytime.</div>
        {!loaded ? <div style={S.prefsExample}>Loading…</div> : (
          <textarea style={S.prefsInput} value={desc} placeholder="e.g. I'm 60, active and fit, into an age range around 40-50. I dislike snooty/high-maintenance profiles — fancy cars, designer bags, Michelin-only. I love dogs, family, women with older kids..."
            onChange={e => setDesc(e.target.value)} autoFocus />
        )}
        <div style={S.prefsCount}>{desc.trim() ? desc.trim().length + ' characters saved to your profile' : 'Nothing saved yet'}</div>
        <button style={S.sheetSave} onClick={save}>{savedMsg ? '✓ Saved' : 'Save my type'}</button>
        <button style={S.sheetCancel} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function Pyramid({ people, onClose, onOpen, onReorder }) {
  // EVERYONE (including hold/planning/deleted), in current rank/array order.
  const [order, setOrder] = React.useState(people.map(p => p.id));
  const [dragId, setDragId] = React.useState(null);
  const byId = {}; people.forEach(p => { byId[p.id] = p; });
  const ordered = order.map(id => byId[id]).filter(Boolean);

  // Build widening pyramid rows: 1,2,3,4…
  const rows = [];
  let idx = 0, rowSize = 1;
  while (idx < ordered.length) {
    rows.push(ordered.slice(idx, idx + rowSize));
    idx += rowSize; rowSize += 1;
  }

  const moveBefore = (dragId, targetId) => {
    if (dragId === targetId) return;
    setOrder(prev => {
      const next = prev.filter(x => x !== dragId);
      const ti = next.indexOf(targetId);
      next.splice(ti, 0, dragId);
      if (onReorder) onReorder(next);
      return next;
    });
  };

  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.pyramidSheet} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.pyramidTitle}>🔺 Your Prospect Pyramid</div>
        <div style={S.pyramidSub}>Everyone, top pick at the peak. <b>Drag</b> anyone to reposition, or tap to open.</div>
        <div style={S.pyramidWrap}>
          {rows.map((row, ri) => (
            <div key={ri} style={S.pyramidRow}>
              {row.map((p) => {
                const tier = TIERS[p.tier] || TIERS[1];
                const ai = (p.compat && p.compat.score != null) ? p.compat.score : null;
                const dimmed = (p.bucket || 'active') === 'deleted';
                return (
                  <div key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragId) moveBefore(dragId, p.id); setDragId(null); }}
                    onClick={() => onOpen(p.id)}
                    style={{ ...S.pyramidCard, borderColor: tier.color, opacity: dimmed ? 0.4 : 1 }}>
                    {p.photos && p.photos[0]
                      ? <img src={p.photos[0]} style={S.pyramidImg} alt="" draggable={false} />
                      : <div style={S.pyramidImgBlank}>{(p.name || '?')[0].toUpperCase()}</div>}
                    <div style={S.pyramidName}>{p.name || '—'}</div>
                    {ai != null ? <div style={{ ...S.pyramidScore, color: matchColor(ai) }}>{ai}</div> : <div style={{ ...S.pyramidScore, color: '#8e8e93' }}>—</div>}
                  </div>
                );
              })}
            </div>
          ))}
          {ordered.length === 0 ? <div style={S.pyramidEmpty}>Add prospects to see your pyramid.</div> : null}
        </div>
        <div style={S.pyramidDragHint}>Drag a card onto another to move it there. Deleted prospects appear dimmed.</div>
        <button style={S.shareBtn} onClick={async () => {
          try {
            const blob = await renderPyramidCard(ordered);
            await shareCardBlob(blob, 'My prospect pyramid — who belongs on top? 👀');
          } catch (e) {}
        }}>📤 Share my pyramid</button>
        <button style={S.howtoBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function Coach({ people, onClose, onOpen }) {
  const today = new Date().toISOString().slice(0, 10);
  const active = people.filter(p => (p.bucket || 'active') === 'active' || (p.bucket || 'active') === 'planning');

  // ----- WEEKLY PRIORITIZE DIGEST -----
  // Score urgency: has a next step, follow-up due, high interest, high AI match, or going cold.
  const scored = active.map(p => {
    let why = [];
    let urgency = 0;
    if (p.followUpDate && p.followUpDate <= today) { urgency += 40; why.push('follow-up due'); }
    if (p.nextStep && p.nextStep.trim()) { urgency += 25; why.push(p.nextStep.trim()); }
    if (p.tier === 0) urgency += 20;
    const ai = (p.compat && p.compat.score != null) ? p.compat.score : null;
    if (ai != null && ai >= 75) { urgency += 15; why.push('strong match'); }
    // going cold: added a while ago, status still new/talking, no recent date
    if ((p.status === 'new' || p.status === 'talking') && (!p.dates || p.dates.length === 0)) { urgency += 10; why.push('no date yet'); }
    return { p, urgency, why, ai };
  }).sort((a, b) => b.urgency - a.urgency);

  const toActOn = scored.filter(s => s.urgency > 0).slice(0, 3);
  const letGo = scored.filter(s => (s.p.status === 'faded')).slice(0, 2);

  // ----- OUTCOME ANALYTICS -----
  const allDates = people.flatMap(p => (p.dates || []).map(d => ({ ...d, who: p.name })));
  const scoredDates = allDates.filter(d => d.score);
  const good = scoredDates.filter(d => (parseInt(d.score, 10) || 0) >= 7);
  const bad = scoredDates.filter(d => (parseInt(d.score, 10) || 0) <= 4);
  const avg = scoredDates.length ? (scoredDates.reduce((s, d) => s + (parseInt(d.score, 10) || 0), 0) / scoredDates.length).toFixed(1) : null;
  // which apps produce your best prospects (avg AI score by app)
  const appStats = {};
  people.forEach(p => {
    if (!p.app) return;
    const ai = (p.compat && p.compat.score != null) ? p.compat.score : null;
    if (ai == null) return;
    if (!appStats[p.app]) appStats[p.app] = { sum: 0, n: 0 };
    appStats[p.app].sum += ai; appStats[p.app].n += 1;
  });
  const appRanked = Object.keys(appStats).map(a => ({ app: a, avg: Math.round(appStats[a].sum / appStats[a].n), n: appStats[a].n })).sort((x, y) => y.avg - x.avg);

  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.coachSheet} onClick={e => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.coachTitle}>🧠 Your Weekly Coach</div>

        {/* prioritize digest */}
        <div style={S.coachSection}>🎯 Act on these this week</div>
        {toActOn.length === 0 ? <div style={S.coachEmpty}>Nothing urgent. Add a next-step or follow-up date to a prospect to see priorities here.</div> :
          toActOn.map(({ p, why }) => (
            <div key={p.id} style={S.coachRow} onClick={() => onOpen(p.id)}>
              {p.photos && p.photos[0] ? <img src={p.photos[0]} style={S.coachImg} alt="" /> : <div style={S.coachImgBlank}>{(p.name || '?')[0].toUpperCase()}</div>}
              <div style={S.coachRowMid}>
                <div style={S.coachName}>{p.name || 'Untitled'}</div>
                <div style={S.coachWhy}>{why.slice(0, 2).join(' · ')}</div>
              </div>
            </div>
          ))}

        {letGo.length > 0 && (
          <>
            <div style={S.coachSection}>🍂 Consider letting go</div>
            {letGo.map(({ p }) => (
              <div key={p.id} style={S.coachRow} onClick={() => onOpen(p.id)}>
                {p.photos && p.photos[0] ? <img src={p.photos[0]} style={S.coachImg} alt="" /> : <div style={S.coachImgBlank}>{(p.name || '?')[0].toUpperCase()}</div>}
                <div style={S.coachRowMid}>
                  <div style={S.coachName}>{p.name || 'Untitled'}</div>
                  <div style={S.coachWhy}>Faded — move to Hold or Deleted to clear your list</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* outcome analytics */}
        <div style={S.coachSection}>📊 What's working for you</div>
        {scoredDates.length === 0 ? <div style={S.coachEmpty}>Log a few dates with scores and your patterns show up here — what kinds of dates and which apps lead to the best nights.</div> : (
          <div style={S.coachStatsBox}>
            <div style={S.coachStat}>Dates logged: <b>{allDates.length}</b> · Avg rating: <b>{avg}/10</b></div>
            {good.length ? <div style={S.coachStatGood}>✅ Best nights: {good.slice(0, 3).map(d => d.place || d.when).filter(Boolean).join(', ')}</div> : null}
            {bad.length ? <div style={S.coachStatBad}>⛔ Fell flat: {bad.slice(0, 3).map(d => d.place || d.when).filter(Boolean).join(', ')}</div> : null}
            {appRanked.length ? <div style={S.coachStat}>Best app for you: <b>{appRanked[0].app}</b> (avg match {appRanked[0].avg})</div> : null}
          </div>
        )}

        <button style={S.howtoBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function Wrapped({ people, onClose }) {
  const allDates = people.flatMap(p => (p.dates || []).map(d => ({ ...d, who: p.name })));
  const best = allDates.filter(d => d.score).sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  const high = people.filter(p => p.tier === 0).length;
  const topApp = (() => {
    const c = {}; people.forEach(p => { if (p.app) c[p.app] = (c[p.app] || 0) + 1; });
    return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || '—';
  })();
  const avgScore = allDates.length ? (allDates.reduce((s, d) => s + (parseInt(d.score, 10) || 0), 0) / allDates.filter(d => d.score).length).toFixed(1) : '—';
  return (
    <div style={S.sheetOverlay} onClick={onClose}>
      <div style={S.wrapped} onClick={e => e.stopPropagation()}>
        <div style={S.wrappedTitle}>Your Dating Wrapped</div>
        <div style={S.wrappedGrid}>
          <div style={S.wrappedStat}><div style={S.wrappedNum}>{people.length}</div><div style={S.wrappedLbl}>tracked</div></div>
          <div style={S.wrappedStat}><div style={S.wrappedNum}>{allDates.length}</div><div style={S.wrappedLbl}>dates logged</div></div>
          <div style={S.wrappedStat}><div style={S.wrappedNum}>{high}</div><div style={S.wrappedLbl}>high interest</div></div>
          <div style={S.wrappedStat}><div style={S.wrappedNum}>{avgScore}</div><div style={S.wrappedLbl}>avg date score</div></div>
        </div>
        <div style={S.wrappedRow}>🏆 Best night: {best ? `${best.place || best.when || 'a date'} (${best.score}/10)` : 'log a date to see this'}</div>
        <div style={S.wrappedRow}>📱 Your app of choice: {topApp}</div>
        <div style={S.wrappedBrand}>Prospects · screenshot to share</div>
        <button style={S.howtoBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const S = {
  screen: { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif', color: '#fff', background: '#000', minHeight: '100%', maxWidth: 480, margin: '0 auto', paddingBottom: 40, WebkitFontSmoothing: 'antialiased' },
  loading: { padding: 60, textAlign: 'center', color: '#8e8e93' },

  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  wrappedBtn: { background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  proBadge: { background: 'linear-gradient(135deg,#FFD700,#FF9F0A)', color: '#000', fontWeight: 800, fontSize: 12, borderRadius: 7, padding: '4px 9px', letterSpacing: 0.5 },
  upgradeBtn: { background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' },
  freeBar: { fontSize: 12.5, color: '#8e8e93', padding: '0 20px 12px' },
  freeBarLink: { color: '#0A84FF', fontWeight: 700, cursor: 'pointer' },

  infoDot: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 8, background: '#3a3a3c', color: '#fff', fontSize: 10, fontWeight: 800, fontStyle: 'italic', marginLeft: 6, cursor: 'pointer', verticalAlign: 'middle', fontFamily: 'Georgia, serif' },
  sectionLabel: { fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 8, marginTop: 4, display: 'flex', alignItems: 'center' },

  aiToolbar: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  aiChipBtn: { flex: '1 1 44%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c1e', color: '#0A84FF', border: '1px solid #2c2c2e', borderRadius: 11, padding: '11px 8px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },

  vibeChip: { background: 'rgba(94,92,230,0.15)', color: '#c7c5ff', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, marginBottom: 12, lineHeight: 1.4 },
  askWrap: { background: '#0e0e10', border: '1px solid #2c2c2e', borderRadius: 16, padding: 14, marginBottom: 18 },
  askTitle: { fontSize: 15, fontWeight: 800, marginBottom: 4 },
  askHint: { fontSize: 12.5, color: '#8e8e93', marginBottom: 12, lineHeight: 1.4 },
  askExchange: { marginBottom: 12 },
  askQ: { fontSize: 14, fontWeight: 600, color: '#0A84FF', marginBottom: 4 },
  askA: { fontSize: 14.5, color: '#e5e5ea', lineHeight: 1.45, background: '#1c1c1e', borderRadius: 10, padding: '10px 12px' },
  askThinking: { fontSize: 13, color: '#8e8e93', marginBottom: 10 },
  askInputRow: { display: 'flex', gap: 8 },
  askInput: { flex: 1, boxSizing: 'border-box', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: 11, padding: '12px', fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  askSend: { background: '#0A84FF', color: '#fff', border: 'none', borderRadius: 11, padding: '0 18px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  compatBox: { background: '#1c1c1e', borderRadius: 14, padding: 14, marginBottom: 12 },
  compatScore: { fontSize: 30, fontWeight: 900, marginBottom: 6 },
  compatOf: { fontSize: 14, color: '#8e8e93', fontWeight: 600 },
  compatReason: { fontSize: 13.5, color: '#e5e5ea', marginBottom: 3 },
  compatWatch: { fontSize: 13, color: '#FF9F0A', marginTop: 6 },
  compatHeadline: { fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.35 },

  demoToggle: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 12px' },
  demoLabel: { fontSize: 12.5, color: '#8e8e93', fontWeight: 600 },
  demoOn: { background: '#8e8e93', color: '#000', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' },
  demoOnPro: { background: 'linear-gradient(135deg,#FFD700,#FF9F0A)', color: '#000', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' },
  demoOff: { background: '#1c1c1e', color: '#8e8e93', border: '1px solid #2c2c2e', borderRadius: 8, padding: '5px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  demoHint: { fontSize: 11.5, color: '#636366', fontStyle: 'italic' },

  miFree: { background: '#141416', border: '1px solid #2c2c2e', borderRadius: 18, padding: 16, margin: '14px 0 16px' },
  miPro: { background: 'linear-gradient(160deg,#1a1830,#0e0e10)', border: '1.5px solid #5E5CE6', borderRadius: 18, padding: 16, margin: '14px 0 16px', boxShadow: '0 6px 24px rgba(94,92,230,0.25)' },
  miHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  miTitle: { fontSize: 16, fontWeight: 800 },
  miTagFree: { fontSize: 11, fontWeight: 800, color: '#8e8e93', background: '#2c2c2e', borderRadius: 6, padding: '3px 9px', letterSpacing: 0.5 },
  miTagPro: { fontSize: 11, fontWeight: 800, color: '#000', background: 'linear-gradient(135deg,#FFD700,#FF9F0A)', borderRadius: 6, padding: '3px 9px', letterSpacing: 0.5 },
  miScoreRow: { display: 'flex', gap: 14, marginBottom: 10 },
  miScoreBlock: { textAlign: 'center', minWidth: 96, background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '10px 8px' },
  miEmoji: { fontSize: 30, lineHeight: 1 },
  miScoreNum: { fontSize: 30, fontWeight: 900, lineHeight: 1.1 },
  miScoreOf: { fontSize: 13, color: '#8e8e93', fontWeight: 700 },
  miScoreLbl: { fontSize: 11, color: '#8e8e93', fontWeight: 600, marginTop: 2 },
  miVibeBlock: { flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  miVibeLbl: { fontSize: 11, color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  miVibeVal: { fontSize: 17, fontWeight: 800, color: '#c7c5ff' },
  miVibeNote: { fontSize: 12.5, color: '#a9a9b0', marginTop: 4, lineHeight: 1.35 },
  miNoPrefs: { fontSize: 12.5, color: '#FF9F0A', marginBottom: 8 },
  miAnalyzing: { fontSize: 13, color: '#a3a1ff', marginBottom: 8, fontWeight: 600 },
  miRetryRow: { fontSize: 13, color: '#FF9F0A', marginBottom: 8 },
  miRetryLink: { color: '#0A84FF', fontWeight: 700, cursor: 'pointer' },
  miHeadline: { fontSize: 14.5, fontWeight: 700, margin: '4px 0 10px', lineHeight: 1.4 },
  miRefresh: { background: 'none', border: 'none', color: '#a3a1ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 0', marginTop: 4 },
  miLocked: { marginTop: 6, background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 14 },
  miLockedTitle: { fontSize: 14, fontWeight: 800, color: '#FFD700', marginBottom: 8 },
  miLockedRow: { fontSize: 13, color: '#c7c7cc', marginBottom: 6, lineHeight: 1.4 },
  miUnlockBtn: { width: '100%', background: 'linear-gradient(135deg,#FFD700,#FF9F0A)', color: '#000', border: 'none', borderRadius: 11, padding: '13px', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 10 },
  heroBlock: { marginTop: 14 },
  heroBlockTitle: { fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  heroLoading: { fontSize: 13, color: '#8e8e93', padding: '4px 0' },
  sayCard: { position: 'relative', background: '#1c1c1e', borderRadius: 12, padding: '11px 60px 11px 13px', fontSize: 14.5, marginBottom: 7, cursor: 'pointer', lineHeight: 1.4 },
  openAppBtn: { display: 'block', textAlign: 'center', textDecoration: 'none', background: '#0A84FF', color: '#fff', borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 700, marginTop: 8 },
  sayCopy: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#0A84FF', fontWeight: 800, textTransform: 'uppercase' },
  lockRow: { fontSize: 12.5, color: '#FFD700', fontWeight: 700, padding: '9px 12px', background: 'rgba(255,215,0,0.08)', borderRadius: 10, cursor: 'pointer', marginTop: 4 },
  unfoldBtn: { width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#c7c5ff', borderRadius: 11, padding: '12px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', marginTop: 14 },
  unfoldBox: { marginTop: 10, paddingTop: 4 },
  rememberBox: { background: '#141416', border: '1px solid #2c2c2e', borderRadius: 14, padding: 12, marginBottom: 18 },
  rememberEmpty: { fontSize: 12.5, color: '#8e8e93', marginBottom: 10, lineHeight: 1.4 },
  rememberItem: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 },
  rememberTag: { fontSize: 10, fontWeight: 800, color: '#000', borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0 },
  rememberText: { flex: 1, fontSize: 14, color: '#e5e5ea', lineHeight: 1.35 },
  rememberDel: { background: 'none', border: 'none', color: '#8e8e93', fontSize: 18, cursor: 'pointer', flexShrink: 0 },
  rememberBtns: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  rememberAdd: { background: '#1c1c1e', border: '1px solid #2c2c2e', color: '#0A84FF', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  detailSheet: { width: '100%', maxWidth: 480, background: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, boxSizing: 'border-box', border: '0.5px solid #2c2c2e' },
  compatMissing: { fontSize: 12.5, color: '#8e8e93', marginTop: 10, lineHeight: 1.4 },
  dealbreakerBox: { background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.4)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 },
  dealbreakerTitle: { fontSize: 12.5, fontWeight: 800, color: '#FF3B30', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  dealbreakerItem: { fontSize: 13.5, color: '#ffb3ae', marginBottom: 2, lineHeight: 1.4 },
  dosBox: { marginTop: 12 },
  dontsBox: { marginTop: 12 },
  dateIdeaBox: { marginTop: 12 },
  dosTitle: { fontSize: 12, fontWeight: 800, color: '#34C759', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 },
  dontsTitle: { fontSize: 12, fontWeight: 800, color: '#FF3B30', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 },
  doItem: { fontSize: 13.5, color: '#d7f5e0', marginBottom: 4, lineHeight: 1.4 },
  dontItem: { fontSize: 13.5, color: '#ffd3d0', marginBottom: 4, lineHeight: 1.4 },
  tierBadge: { fontSize: 10, fontWeight: 800, color: '#000', borderRadius: 5, padding: '1px 6px', marginLeft: 7, textTransform: 'uppercase', letterSpacing: 0.3, verticalAlign: 'middle' },
  myRankBadge: { fontSize: 12, fontWeight: 800, color: '#fff', background: '#3a3a3c', borderRadius: 6, padding: '1px 7px', marginRight: 6 },
  matchBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 46, height: 46, borderRadius: 12, border: '2px solid', background: '#0e0e10', flexShrink: 0, cursor: 'pointer', marginRight: 2 },
  matchEmoji: { fontSize: 16, lineHeight: 1 },
  matchNum: { fontSize: 12, fontWeight: 800, lineHeight: 1.1 },
  ideaCard: { background: '#151517', borderRadius: 11, padding: '10px 12px', marginBottom: 7 },
  ideaCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  ideaVibe: { fontSize: 11, fontWeight: 800, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: 0.4 },
  ideaPrice: { fontSize: 13, fontWeight: 800, color: '#34C759' },
  ideaPlace: { fontSize: 14.5, fontWeight: 700, marginBottom: 2 },
  ideaWhy: { fontSize: 13, color: '#a9a9b0', lineHeight: 1.4 },
  whyTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  whyBig: { fontSize: 40 },
  whyScore: { fontSize: 38, fontWeight: 900 },
  whyOf: { fontSize: 18, color: '#8e8e93', fontWeight: 700 },
  whyName: { fontSize: 18, fontWeight: 800, marginBottom: 8 },
  whyHeadline: { fontSize: 15, color: '#e5e5ea', marginBottom: 12, lineHeight: 1.4 },
  whyReason: { fontSize: 14, color: '#c7c7cc', marginBottom: 5, lineHeight: 1.45 },
  prefs: { width: '100%', maxWidth: 480, background: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, boxSizing: 'border-box', border: '0.5px solid #2c2c2e', maxHeight: '92%', overflowY: 'auto' },
  prefsTitle: { fontSize: 24, fontWeight: 900, marginBottom: 8 },
  prefsSub: { fontSize: 14, color: '#c7c7cc', lineHeight: 1.5, marginBottom: 12 },
  prefsExample: { fontSize: 12.5, color: '#8e8e93', lineHeight: 1.5, marginBottom: 14, background: '#1c1c1e', borderRadius: 10, padding: '10px 12px' },
  prefsInput: { width: '100%', boxSizing: 'border-box', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: 12, padding: '14px', fontSize: 15, fontFamily: 'inherit', minHeight: 160, resize: 'vertical', outline: 'none', marginBottom: 14, lineHeight: 1.5 },
  prefsCount: { fontSize: 12.5, color: '#34C759', fontWeight: 600, marginBottom: 14, textAlign: 'center' },
  typeBtnSaved: { background: 'rgba(52,199,89,0.18)', color: '#34C759', border: '1px solid #34C759', borderRadius: 9, padding: '7px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  flagsBox: { background: '#1c1c1e', borderRadius: 14, padding: 14, marginBottom: 12 },
  flagGreen: { fontSize: 13.5, color: '#7ee29b', marginBottom: 5, lineHeight: 1.4 },
  flagRed: { fontSize: 13.5, color: '#ff8f88', marginBottom: 5, lineHeight: 1.4 },

  bragBtn: { width: '100%', background: '#1c1c1e', color: '#0A84FF', border: '1px solid #2c2c2e', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
  bragCard: { position: 'relative', borderRadius: 18, overflow: 'hidden', marginBottom: 8, background: '#1c1c1e', aspectRatio: '4/5' },
  bragPhoto: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  bragPhotoBlank: { width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, color: '#3a3a3c' },
  bragOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: '40px 16px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
  bragCaption: { fontSize: 19, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 },
  bragStats: { fontSize: 14, color: '#e5e5ea', fontWeight: 600 },
  bragTier: { display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,0.2)', borderRadius: 7, padding: '3px 9px' },
  bragBrand: { position: 'absolute', top: 12, right: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  bragHint: { fontSize: 12, color: '#8e8e93', marginBottom: 18, textAlign: 'center' },
  verdictRow: { display: 'flex', gap: 8 },
  verdictBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: '#1c1c1e', border: '1.5px solid', borderRadius: 11, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  verdictCount: { fontSize: 18, fontWeight: 900, color: '#fff' },
  commentsBox: { marginTop: 10, background: '#141416', borderRadius: 12, padding: 12 },
  commentItem: { fontSize: 13.5, color: '#e5e5ea', marginBottom: 6, lineHeight: 1.4 },
  friendCard: { background: 'linear-gradient(160deg,#1a1830,#0e0e10)', border: '1.5px solid #5E5CE6', borderRadius: 18, padding: 16, marginBottom: 8 },
  friendCardTop: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  friendCardImg: { width: 64, height: 64, borderRadius: 12, objectFit: 'cover' },
  friendCardImgBlank: { width: 64, height: 64, borderRadius: 12, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#8e8e93' },
  friendCardName: { fontSize: 19, fontWeight: 800 },
  friendCardMeta: { fontSize: 13.5, color: '#c7c7cc', marginTop: 2 },
  friendCardScore: { fontSize: 14, fontWeight: 800, marginTop: 4 },
  friendCardQ: { fontSize: 15, fontWeight: 700, textAlign: 'center', margin: '4px 0 10px' },
  friendCardTally: { display: 'flex', justifyContent: 'center', gap: 20, fontSize: 17, fontWeight: 800, marginBottom: 10 },
  shareBtn: { width: '100%', background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 10 },
  multiHint: { fontSize: 12.5, color: '#8e8e93', marginBottom: 12, lineHeight: 1.4, marginTop: -4 },

  howtoCard: { width: '100%', maxWidth: 480, background: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, boxSizing: 'border-box' },
  howtoTitle: { fontSize: 20, fontWeight: 800, marginBottom: 12 },
  howtoBody: { fontSize: 15, color: '#c7c7cc', lineHeight: 1.5, marginBottom: 20 },
  howtoBtn: { width: '100%', background: '#0A84FF', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },

  paywall: { width: '100%', maxWidth: 480, background: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, boxSizing: 'border-box', border: '0.5px solid #2c2c2e' },
  paywallTitle: { fontSize: 30, fontWeight: 900, textAlign: 'center' },
  paywallSub: { fontSize: 15, color: '#8e8e93', textAlign: 'center', marginBottom: 20 },
  perkList: { marginBottom: 22 },
  perk: { fontSize: 15.5, marginBottom: 10, color: '#e5e5ea' },
  payBtn: { width: '100%', background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', marginBottom: 8 },
  payBtnAlt: { width: '100%', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  previewBtn: { width: '100%', background: 'none', color: '#34C759', border: '1.5px solid #34C759', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 10 },

  wrapped: { width: '100%', maxWidth: 480, background: 'linear-gradient(160deg,#5E5CE6,#0A84FF)', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, boxSizing: 'border-box' },
  wrappedTitle: { fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 20 },
  wrappedGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  wrappedStat: { background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px', textAlign: 'center' },
  wrappedNum: { fontSize: 34, fontWeight: 900, lineHeight: 1 },
  wrappedLbl: { fontSize: 12.5, marginTop: 4, opacity: 0.9 },
  wrappedRow: { fontSize: 14.5, fontWeight: 600, marginBottom: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px' },
  wrappedBrand: { fontSize: 12, textAlign: 'center', opacity: 0.8, margin: '14px 0 16px' },


  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 20px 12px' },
  title: { fontSize: 34, fontWeight: 800, letterSpacing: -0.5 },
  count: { fontSize: 15, color: '#8e8e93', fontWeight: 600 },

  statsRow: { display: 'flex', gap: 8, padding: '0 16px 12px', flexWrap: 'wrap' },
  viewTabs: { display: 'flex', gap: 6, padding: '0 16px 12px', flexWrap: 'wrap' },
  viewTab: { background: '#1c1c1e', color: '#8e8e93', border: '1px solid #2c2c2e', borderRadius: 9, padding: '7px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  viewTabOn: { background: '#0A84FF', color: '#fff', borderColor: '#0A84FF' },
  statChip: { fontSize: 13, color: '#c7c7cc', background: '#1c1c1e', borderRadius: 9, padding: '6px 10px', fontWeight: 600 },

  searchWrap: { position: 'relative', padding: '0 16px 10px' },
  sortRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 10px' },
  sortLabel: { fontSize: 13, color: '#8e8e93', fontWeight: 600 },
  sortSelect: { flex: 1, background: '#1c1c1e', color: '#fff', border: '1px solid #2c2c2e', borderRadius: 10, padding: '9px 10px', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  search: { width: '100%', boxSizing: 'border-box', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: 11, padding: '11px 34px 11px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  searchClear: { position: 'absolute', right: 26, top: 8, background: '#3a3a3c', border: 'none', color: '#fff', width: 24, height: 24, borderRadius: 12, fontSize: 15, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 8, padding: '0 16px 14px' },
  filterChip: { flex: 1, background: '#1c1c1e', border: '1px solid #2c2c2e', color: '#8e8e93', borderRadius: 10, padding: '8px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  filterChipOn: { background: '#0A84FF', color: '#fff', borderColor: '#0A84FF' },
  emptyState: { color: '#8e8e93', fontSize: 14, textAlign: 'center', padding: '40px 20px' },

  statusPill: { fontSize: 11, fontWeight: 700, color: '#fff', borderRadius: 6, padding: '1px 6px', marginRight: 2 },
  nextStepLine: { fontSize: 12.5, color: '#FF9F0A', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  followUpLine: { fontSize: 12.5, color: '#5E5CE6', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  driveLineRow: { fontSize: 12.5, color: '#34C759', marginTop: 3, fontWeight: 600 },

  statusRow: { display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  statusChip: { border: 'none', borderRadius: 9, padding: '8px 11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  dateLog: { marginBottom: 14 },
  dateCard: { background: '#1c1c1e', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' },
  dateCardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  dateWhen: { fontSize: 15, fontWeight: 700 },
  dateScore: { fontSize: 12, fontWeight: 800, color: '#000', borderRadius: 7, padding: '2px 8px' },
  datePlace: { fontSize: 13, color: '#c7c7cc', marginTop: 4 },
  dateHow: { fontSize: 13, color: '#8e8e93', marginTop: 4, lineHeight: 1.4 },
  dateAdd: { width: '100%', background: '#1c1c1e', border: '1.5px dashed #3a3a3c', color: '#0A84FF', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  ideasBtn: { width: '100%', background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 12 },
  ideasBox: { background: '#1c1c1e', borderRadius: 14, padding: 14, marginBottom: 18 },
  ideasStar: { fontSize: 14, fontWeight: 700, color: '#FFCC00', background: 'rgba(255,204,0,0.1)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, lineHeight: 1.4 },
  ideasGroup: { marginBottom: 14 },
  ideasHead: { fontSize: 12, color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  ideaChat: { position: 'relative', background: '#2c2c2e', borderRadius: 12, padding: '10px 44px 10px 12px', fontSize: 14, marginBottom: 6, cursor: 'pointer', lineHeight: 1.4 },
  ideaCopy: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#0A84FF', fontWeight: 700, textTransform: 'uppercase' },
  ideaItem: { fontSize: 14, marginBottom: 6, lineHeight: 1.4, color: '#e5e5ea' },
  ideasRefresh: { background: 'none', border: 'none', color: '#0A84FF', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '4px 0' },

  sheetOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  pyramidSheet: { width: '100%', maxWidth: 480, maxHeight: '92%', overflowY: 'auto', background: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, boxSizing: 'border-box', border: '0.5px solid #2c2c2e' },
  coachSheet: { width: '100%', maxWidth: 480, maxHeight: '92%', overflowY: 'auto', background: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, boxSizing: 'border-box', border: '0.5px solid #2c2c2e' },
  coachTitle: { fontSize: 24, fontWeight: 900, textAlign: 'center', marginBottom: 6 },
  coachSection: { fontSize: 13, fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 10 },
  coachEmpty: { fontSize: 13.5, color: '#8e8e93', lineHeight: 1.5, background: '#141416', borderRadius: 12, padding: 14 },
  coachRow: { display: 'flex', alignItems: 'center', gap: 12, background: '#1c1c1e', borderRadius: 14, padding: 12, marginBottom: 8, cursor: 'pointer' },
  coachImg: { width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 },
  coachImgBlank: { width: 48, height: 48, borderRadius: 10, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#8e8e93', flexShrink: 0 },
  coachRowMid: { flex: 1, minWidth: 0 },
  coachName: { fontSize: 16, fontWeight: 700 },
  coachWhy: { fontSize: 13, color: '#FF9F0A', marginTop: 2, lineHeight: 1.35 },
  coachStatsBox: { background: '#141416', borderRadius: 14, padding: 14 },
  coachStat: { fontSize: 14, color: '#e5e5ea', marginBottom: 8, lineHeight: 1.4 },
  coachStatGood: { fontSize: 13.5, color: '#7ee29b', marginBottom: 8, lineHeight: 1.4 },
  coachStatBad: { fontSize: 13.5, color: '#ff8f88', marginBottom: 8, lineHeight: 1.4 },
  pyramidTitle: { fontSize: 24, fontWeight: 900, textAlign: 'center' },
  pyramidSub: { fontSize: 13, color: '#8e8e93', textAlign: 'center', marginBottom: 18 },
  pyramidWrap: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 18 },
  pyramidRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  pyramidCard: { width: 72, borderRadius: 12, border: '2px solid', background: '#1c1c1e', padding: 6, cursor: 'pointer', textAlign: 'center', flexShrink: 0 },
  pyramidImg: { width: 58, height: 58, borderRadius: 9, objectFit: 'cover', display: 'block', margin: '0 auto' },
  pyramidImgBlank: { width: 58, height: 58, borderRadius: 9, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#8e8e93', margin: '0 auto' },
  pyramidName: { fontSize: 11, fontWeight: 700, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pyramidScore: { fontSize: 15, fontWeight: 900, lineHeight: 1 },
  pyramidEmpty: { color: '#8e8e93', fontSize: 14, textAlign: 'center', padding: 20 },
  pyramidDragHint: { fontSize: 12, color: '#8e8e93', textAlign: 'center', marginBottom: 14 },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '92%', overflowY: 'auto', background: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, boxSizing: 'border-box', border: '0.5px solid #2c2c2e' },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, background: '#3a3a3c', margin: '0 auto 16px' },
  sheetTitle: { fontSize: 22, fontWeight: 800, marginBottom: 18 },
  scoreRow: { display: 'flex', gap: 5, marginBottom: 16 },
  scoreDot: { flex: 1, border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  sheetSave: { width: '100%', background: '#0A84FF', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 6 },
  sheetDelete: { width: '100%', background: 'none', color: '#FF3B30', border: 'none', padding: '13px', fontSize: 15, cursor: 'pointer', marginTop: 4 },
  sheetCancel: { width: '100%', background: 'none', color: '#8e8e93', border: 'none', padding: '10px', fontSize: 15, cursor: 'pointer' },

  list: { padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 },
  row: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, background: '#1c1c1e', borderRadius: 16, padding: '12px 14px 12px 18px', cursor: 'pointer', overflow: 'hidden' },
  rowBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  rank: { fontSize: 13, fontWeight: 700, color: '#8e8e93', width: 18, textAlign: 'center', flexShrink: 0 },
  rowAvatar: { width: 64, height: 64, borderRadius: 14, objectFit: 'cover', flexShrink: 0 },
  rowAvatarBlank: { width: 64, height: 64, borderRadius: 14, background: '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#8e8e93', flexShrink: 0 },
  rowMid: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 17, fontWeight: 700, lineHeight: 1.2 },
  rowAge: { fontWeight: 700 },
  rowSub: { fontSize: 13, color: '#8e8e93', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowArrows: { display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 },
  arrowBtn: { background: '#2c2c2e', border: 'none', color: '#8e8e93', width: 30, height: 22, borderRadius: 7, fontSize: 11, cursor: 'pointer' },
  rowDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },

  fab: { position: 'sticky', bottom: 20, margin: '24px 14px 0', width: 'calc(100% - 28px)', background: '#0A84FF', color: '#fff', border: 'none', borderRadius: 16, padding: '17px', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(10,132,255,0.4)' },

  navBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #2c2c2e', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', zIndex: 10 },
  navBtn: { background: 'none', border: 'none', color: '#0A84FF', fontSize: 17, cursor: 'pointer', padding: 0, fontWeight: 400 },
  navBtnDone: { fontWeight: 700 },
  navTitle: { fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 },
  navDelete: { background: 'none', border: 'none', color: '#FF3B30', fontSize: 17, cursor: 'pointer', padding: 0 },
  navDeleteArmed: { background: '#FF3B30', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '6px 10px', borderRadius: 8 },

  addBody: { padding: 20 },
  detailBody: { padding: 20 },

  photoStrip: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 },
  stripImg: { width: 72, height: 72, objectFit: 'cover', borderRadius: 12, flexShrink: 0, cursor: 'pointer' },
  stripItem: { position: 'relative', flexShrink: 0 },
  stripDel: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, background: '#FF3B30', color: '#fff', border: '2px solid #000', fontSize: 13, lineHeight: '18px', cursor: 'pointer', padding: 0 },
  stripAdd: { width: 72, height: 72, borderRadius: 12, border: '2px dashed #3a3a3c', background: '#1c1c1e', color: '#0A84FF', fontSize: 28, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 13, color: '#8e8e93', marginBottom: 22, lineHeight: 1.4 },

  readBtn: { width: '100%', background: '#2c2c2e', color: '#0A84FF', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 16 },
  errText: { color: '#FF3B30', fontSize: 13, marginBottom: 12 },

  fieldLabel: { fontSize: 12, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 2 },
  bigInput: { width: '100%', boxSizing: 'border-box', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: 12, padding: '15px', fontSize: 17, fontFamily: 'inherit', outline: 'none' },
  input: { width: '100%', boxSizing: 'border-box', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: 10, padding: '12px', fontSize: 15, fontFamily: 'inherit', outline: 'none' },

  tierRow: { display: 'flex', gap: 8, marginBottom: 18 },
  tierChip: { flex: 1, border: '1.5px solid', borderRadius: 11, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  appChip: { flex: 1, border: 'none', borderRadius: 11, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  driveBox: { background: '#1c1c1e', borderRadius: 14, padding: 14, marginBottom: 18 },
  driveTitle: { fontSize: 13, fontWeight: 700, color: '#8e8e93', marginBottom: 6 },
  driveLine: { fontSize: 15, marginBottom: 2 },

  factsWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 },

  textarea: { width: '100%', boxSizing: 'border-box', background: '#1c1c1e', border: 'none', color: '#fff', borderRadius: 12, padding: '13px', fontSize: 15, fontFamily: 'inherit', resize: 'vertical', minHeight: 60, outline: 'none', marginBottom: 18 },
  myNotesLabel: { fontSize: 14, fontWeight: 700, color: '#FFCC00', marginBottom: 6 },
  myNotes: { border: '1.5px solid #FFCC00' },
  added: { fontSize: 12, color: '#636366', textAlign: 'center', marginTop: 8 },

  viewerOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  viewerImg: { maxWidth: '92%', maxHeight: '88%', objectFit: 'contain', borderRadius: 10 },
  viewerClose: { position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 20, width: 40, height: 40, fontSize: 24, cursor: 'pointer' },
  viewerPrev: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 22, width: 44, height: 44, fontSize: 26, cursor: 'pointer' },
  viewerNext: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 22, width: 44, height: 44, fontSize: 26, cursor: 'pointer' },
};

/* ============================================================
   VermiBangla Academy — script.js
   Vanilla JS · localStorage · Hash Router · Offline-first
   ============================================================ */
'use strict';

/* ============================================================
   0. UTILITIES
   ============================================================ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const STORE = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
function bn(n) { return String(n).replace(/[0-9]/g, d => BN_DIGITS[d]); }
function pad(n) { return String(n).padStart(2, '0'); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  const parts = String(iso).split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
function debounce(fn, ms = 180) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function uid() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

/* ============================================================
   1. DATA — FOOD DATABASE
   ============================================================ */
const FOODS = [
  // ---- A: সাধারণত উপযোগী ----
  { name: 'প্রস্তুত গরুর গোবর', cat: 'A',
    prep: 'আগে থেকে কম্পোস্ট করে ঠান্ডা, গন্ধহীন ও দানাদার অবস্থায় আনুন।',
    risk: 'কাঁচা হলে তাপ ও অ্যামোনিয়া ক্ষতিকর; মাছি ও পোকা বাড়ে।',
    test: 'বেডের এক কোণে অল্প পরিমাণে দিয়ে ২৪ ঘণ্টা কেঁচোর প্রতিক্রিয়া দেখুন।',
    avoid: 'কাঁচা, গরম, তীব্র গন্ধযুক্ত বা রাসায়নিক-দূষিত গোবর।' },
  { name: 'পচনশীল উদ্ভিজ্জ বর্জ্য', cat: 'A',
    prep: 'কুচি করে দিন, আর্দ্রতা মাঝারি রাখুন।',
    risk: 'অতিরিক্ত ভেজা হলে পচন ও দুর্গন্ধ।',
    test: 'প্রথমে ২৫০ গ্রামের মতো দিয়ে দেখুন।',
    avoid: 'রান্না করা বা তেল-লবণযুক্ত বর্জ্য।' },
  { name: 'কুচি করা সবজির উচ্ছিষ্ট', cat: 'A',
    prep: 'ছোট টুকরো করে বেডের একপাশে দিন।',
    risk: 'পচা বা ছত্রাকযুক্ত হলে সমস্যা।',
    test: 'অল্প পরিমাণে দিয়ে পরদিন পরীক্ষা করুন।',
    avoid: 'পচা, গন্ধযুক্ত বা রাসায়নিক-স্প্রে করা সবজি।' },
  { name: 'উপযুক্ত শুকনো পাতা', cat: 'A',
    prep: 'হালকা ভিজিয়ে বেডিং হিসেবে বা খাবারের সঙ্গে মিশিয়ে দিন।',
    risk: 'শুকনো অবস্থায় আর্দ্রতা শুষে নিতে পারে।',
    test: 'বেডিং হিসেবে অল্প ব্যবহার করে দেখুন।',
    avoid: 'রঙ করা, গ্লসি বা রাসায়নিক-প্রলেপযুক্ত কাগজ/পাতা।' },
  { name: 'পরিষ্কার উদ্ভিজ্জ অবশিষ্টাংশ', cat: 'A',
    prep: 'কুচি করে মাটির সঙ্গে হালকা মিশিয়ে দিন।',
    risk: 'অতিরিক্ত পরিমাণে দিলে তাপ বাড়তে পারে।',
    test: 'প্রথমে এক মুঠো দিয়ে শুরু করুন।',
    avoid: 'পচা, ছত্রাকযুক্ত বা অজানা উৎসের বর্জ্য।' },
  { name: 'কলার খোসা', cat: 'A',
    prep: 'কুচি করে দিন; বেশি পুরু খোসা ছোট টুকরো করুন।',
    risk: 'অতিরিক্ত দিলে আর্দ্রতা বাড়ে।',
    test: 'একটি খোসা কুচি করে দিন।',
    avoid: 'কীটনাশক-স্প্রে করা বা রাসায়নিকযুক্ত কলা।' },
  { name: 'ডিমের খোসা (ভাঙা)', cat: 'A',
    prep: 'ভালোভাবে ভেঙে গুঁড়ো করে দিন।',
    risk: 'বড় টুকরো হলে ধারালো প্রান্ত কেঁচোর ক্ষতি করতে পারে।',
    test: 'অল্প পরিমাণে গুঁড়ো দিয়ে দিন।',
    avoid: 'রান্না করা বা তেলযুক্ত খোসা।' },
  { name: 'করাত কাঠের গুঁড়ো (রাসায়নিকমুক্ত)', cat: 'A',
    prep: 'ভালোভাবে ভিজিয়ে বেডিং হিসেবে ব্যবহার করুন।',
    risk: 'শুকনো অবস্থায় আর্দ্রতা কমিয়ে দেয়; পাইন/সিডার এড়িয়ে চলুন।',
    test: 'বেডিংয়ের অংশ হিসেবে অল্প ব্যবহার করুন।',
    avoid: 'রাসায়নিক-প্রলেপযুক্ত, রঙিন বা চিপবোর্ডের গুঁড়ো।' },
  { name: 'চায়ের পাতা / কফি গ্রাউন্ড (অল্প)', cat: 'A',
    prep: 'ভালোভাবে শুকিয়ে বা হালকা ভিজিয়ে দিন।',
    risk: 'বেশি দিলে অম্লীয় হয়ে যেতে পারে।',
    test: 'এক চা-চামচ পরিমাণ দিয়ে শুরু করুন।',
    avoid: 'দুধ-চিনিযুক্ত চা-কফি।' },
  { name: 'পুরনো ফুল / শুকনো পাতা', cat: 'A',
    prep: 'ছোট করে কেটে বেডিং বা খাবারে মিশিয়ে দিন।',
    risk: 'কীটনাশক-স্প্রে করা ফুল বিষাক্ত হতে পারে।',
    test: 'অল্প পরিমাণে দিন।',
    avoid: 'ফুলের দোকানের স্প্রে করা ফুল, মালা।' },

  // ---- B: সতর্কতার সঙ্গে ----
  { name: 'সাইট্রাস ফলের খোসা', cat: 'B',
    prep: 'অল্প পরিমাণে, কুচি করে দিন।',
    risk: 'বেশি দিলে অম্লীয়তা বাড়ে, কেঁচো দূরে সরে যেতে পারে।',
    test: 'প্রথমে একটি খোসা দিয়ে দেখুন; ২–৩ দিনে ব্যবহার করুন।',
    avoid: 'একসাথে বেশি বা পচা সাইট্রাস।' },
  { name: 'টক ফল', cat: 'B',
    prep: 'অল্প পরিমাণে, পচা অংশ বাদ দিয়ে দিন।',
    risk: 'অম্লীয়তা ও ফলের মাছি।',
    test: 'এক টুকরো দিয়ে দেখুন।',
    avoid: 'পচা, গন্ধযুক্ত বা ছত্রাকযুক্ত ফল।' },
  { name: 'অতিরিক্ত নাইট্রোজেনসমৃদ্ধ (কচু পাতা, ঘাস)', cat: 'B',
    prep: 'শুকিয়ে বা প্রাক-কম্পোস্ট করে দিন।',
    risk: 'বেশি দিলে অ্যামোনিয়া ও তাপ বাড়ে।',
    test: 'খুব অল্প পরিমাণে দিন।',
    avoid: 'কাঁচা, একসাথে বেশি।' },
  { name: 'রান্নার তেলযুক্ত খাবার', cat: 'B',
    prep: 'খুব অল্প পরিমাণে, শুকনো কাগজে শুষে দিন।',
    risk: 'অতিরিক্ত তেল বেড নষ্ট করে, দুর্গন্ধ ও মাছি।',
    test: 'এক চা-চামচ পরিমাণ।',
    avoid: 'বেশি তেলযুক্ত ভাজা খাবার।' },
  { name: 'দুধ / পনির (অল্প)', cat: 'B',
    prep: 'খুব অল্প পরিমাণে, মাটির সঙ্গে মিশিয়ে দিন।',
    risk: 'পচলে দুর্গন্ধ ও মাছি।',
    test: 'এক চা-চামচ পরিমাণ।',
    avoid: 'বেশি পরিমাণ বা পচা দুধ।' },
  { name: 'মাংস-মাছের অবশিষ্ট (খুব অল্প)', cat: 'B',
    prep: 'মাটির গভীরে পুঁতে দিন; অল্প পরিমাণে।',
    risk: 'মাছি, পোকা ও দুর্গন্ধ; কখনো কখনো শিকারি প্রাণী।',
    test: 'শুধু খুব অল্প পরিমাণে, গভীরে পুঁতে।',
    avoid: 'বড় পরিমাণ, খোলা জায়গায়।' },
  { name: 'লবণযুক্ত খাবার', cat: 'B',
    prep: 'পানি দিয়ে ধুয়ে লবণ কমিয়ে দিন।',
    risk: 'লবণ কেঁচোর জন্য ক্ষতিকর।',
    test: 'খুব অল্প পরিমাণে, ধুয়ে।',
    avoid: 'অতিরিক্ত লবণযুক্ত খাবার।' },
  { name: 'পেঁয়াজ-রসুন (অল্প)', cat: 'B',
    prep: 'কুচি করে, অল্প পরিমাণে দিন।',
    risk: 'তীব্র গন্ধে কেঁচো দূরে সরে যেতে পারে।',
    test: 'এক টুকরো দিয়ে দেখুন।',
    avoid: 'বেশি পরিমাণ।' },
  { name: 'মসলাযুক্ত খাবার', cat: 'B',
    prep: 'অল্প পরিমাণে, মাটির সঙ্গে মিশিয়ে।',
    risk: 'তীব্র গন্ধ ও অম্লীয়তা।',
    test: 'এক চা-চামচ পরিমাণ।',
    avoid: 'বেশি মসলাযুক্ত খাবার।' },
  { name: 'আধা-পচা মিশ্রণ', cat: 'B',
    prep: 'আরও কিছুদিন কম্পোস্ট করে স্থিতিশীল করুন।',
    risk: 'তাপ ও গন্ধ।',
    test: 'প্রথমে প্রাক-কম্পোস্ট করে নিন।',
    avoid: 'গরম বা তীব্র গন্ধযুক্ত অবস্থায়।' },

  // ---- C: এড়িয়ে চলুন ----
  { name: 'কীটনাশকযুক্ত উদ্ভিদ', cat: 'C',
    prep: '—',
    risk: 'কেঁচো ও উপকারী অণুজীবের জন্য বিষাক্ত।',
    test: '—',
    avoid: 'সরাসরি এড়িয়ে চলুন।' },
  { name: 'রাসায়নিক-দূষিত বর্জ্য', cat: 'C',
    prep: '—',
    risk: 'কেঁচো মেরে ফেলে, সার দূষিত করে।',
    test: '—',
    avoid: 'কোনো অবস্থাতেই ব্যবহার করবেন না।' },
  { name: 'প্লাস্টিক ও ধাতু', cat: 'C',
    prep: '—',
    risk: 'পচে না; কেঁচোর ক্ষতি করতে পারে।',
    test: '—',
    avoid: 'সম্পূর্ণ নিষিদ্ধ।' },
  { name: 'অতিরিক্ত লবণযুক্ত বর্জ্য', cat: 'C',
    prep: '—',
    risk: 'লবণ কেঁচোর জন্য বিষ।',
    test: '—',
    avoid: 'কোনো অবস্থাতেই নয়।' },
  { name: 'পচা মাংস ও মাছের বড় পরিমাণ', cat: 'C',
    prep: '—',
    risk: 'দুর্গন্ধ, মাছি, শিকারি প্রাণী।',
    test: '—',
    avoid: 'বড় পরিমাণে কখনো নয়।' },
  { name: 'অতিরিক্ত তেলযুক্ত খাবার', cat: 'C',
    prep: '—',
    risk: 'বেড নষ্ট করে, দুর্গন্ধ।',
    test: '—',
    avoid: 'বড় পরিমাণে নয়।' },
  { name: 'পরিচয়হীন শিল্পবর্জ্য', cat: 'C',
    prep: '—',
    risk: 'কী রাসায়নিক আছে অজানা; বিপজ্জনক।',
    test: '—',
    avoid: 'কখনো নয়।' },
  { name: 'বিষাক্ত উদ্ভিদ', cat: 'C',
    prep: '—',
    risk: 'কেঁচোর জন্য ক্ষতিকর।',
    test: '—',
    avoid: 'সরাসরি এড়িয়ে চলুন।' },
  { name: 'মানব বর্জ্য', cat: 'C',
    prep: '—',
    risk: 'স্বাস্থ্যঝুঁকি ও রোগজীবাণু।',
    test: '—',
    avoid: 'কখনো নয়।' },
  { name: 'রঙিন ম্যাগাজিন / কাগজ', cat: 'C',
    prep: '—',
    risk: 'রঙে ভারী ধাতু ও রাসায়নিক থাকতে পারে।',
    test: '—',
    avoid: 'রঙিন ছাপা কাগজ।' }
];

/* ============================================================
   2. DATA — TROUBLESHOOTING
   ============================================================ */
const PROBLEMS = [
  { title: '১. কেঁচো মারা যাচ্ছে',
    cause: ['অতিরিক্ত তাপ বা ঠান্ডা', 'কাঁচা গোবর থেকে অ্যামোনিয়া', 'অতিরিক্ত পানি বা জলাবদ্ধতা', 'কীটনাশক/রাসায়নিক দূষণ', 'অতিরিক্ত খাবার ও পচন'],
    verify: ['বেডের তাপমাত্রা ও আর্দ্রতা মাপুন', 'গন্ধ পরীক্ষা করুন', 'কোনো নতুন খাবার সম্প্রতি দেওয়া হয়েছে কি না দেখুন', 'পানি জমেছে কি না দেখুন'],
    immediate: ['নতুন খাবার দেওয়া বন্ধ করুন', 'অতিরিক্ত ভেজা হলে বেডিং শুকনো যোগ করুন', 'দূষিত খাবার/উপাদান সরিয়ে ফেলুন', 'বেড বাতাস চলাচল করে এমন জায়গায় সরান'],
    longTerm: ['প্রাক-কম্পোস্ট করা গোবর ব্যবহার করুন', 'তাপমাত্রা ও আর্দ্রতা নিয়মিত রেকর্ড করুন', 'খাবার ধীরে ধীরে বাড়ান'],
    prevent: ['নিয়মিত মনিটরিং', 'কীটনাশকমুক্ত খাবার', 'ড্রেনেজ নিশ্চিত করা'] },

  { title: '২. কেঁচো বেড থেকে বেরিয়ে আসছে',
    cause: ['অতিরিক্ত আর্দ্রতা বা পানি জমা', 'কাঁচা/গরম খাবার', 'অতিরিক্ত তাপ', 'বেডে অক্সিজেনের অভাব', 'খাবারের অভাব'],
    verify: ['নিচে পানি জমেছে কি না দেখুন', 'গন্ধ পরীক্ষা করুন', 'তাপমাত্রা মাপুন'],
    immediate: ['অতিরিক্ত পানি বের করুন', 'খাবার পরীক্ষা করুন', 'বেড বাতাস চলাচল করে এমন জায়গায় সরান'],
    longTerm: ['প্রাক-কম্পোস্ট গোবর ব্যবহার', 'ড্রেনেজ ব্যবস্থা ঠিক রাখা', 'খাবারের পরিমাণ সঠিক রাখা'],
    prevent: ['প্রতিদিন চেক করা', 'উপযুক্ত আর্দ্রতা'] },

  { title: '৩. বেডে দুর্গন্ধ হচ্ছে',
    cause: ['অতিরিক্ত ভেজা', 'কাঁচা খাবার বেশি', 'অতিরিক্ত খাবার', 'বাতাস চলাচলের অভাব'],
    verify: ['গন্ধের ধরন বুঝুন — পচা না অ্যামোনিয়া', 'আর্দ্রতা মাপুন', 'খাবার জমেছে কি না দেখুন'],
    immediate: ['খাবার দেওয়া বন্ধ করুন', 'শুকনো বেডিং যোগ করুন', 'বেড আলোড়িত করুন'],
    longTerm: ['সঠিক পরিমাণে খাবার', 'প্রাক-কম্পোস্ট ব্যবহার', 'ড্রেনেজ ঠিক করা'],
    prevent: ['নিয়মিত পরিদর্শন', 'অতিরিক্ত ভেজা এড়ানো'] },

  { title: '৪. বেড অতিরিক্ত গরম হচ্ছে',
    cause: ['অতিরিক্ত নাইট্রোজেনসমৃদ্ধ খাবার', 'কাঁচা গোবর', 'বড় স্তূপে পচন', 'রোদে সরাসরি রাখা'],
    verify: ['বেডের ভেতরে থার্মোমিটার ঢোকান', 'খাবারের ধরণ দেখুন'],
    immediate: ['খাবার সরান', 'বেড আলোড়িত করুন', 'ছায়ায় সরান'],
    longTerm: ['প্রাক-কম্পোস্ট গোবর', 'অল্প করে খাবার', 'ছাউনি ব্যবস্থা'],
    prevent: ['তাপমাত্রা রেকর্ড', 'নতুন খাবার অল্পে'] },

  { title: '৫. বেড অতিরিক্ত শুকিয়ে যাচ্ছে',
    cause: ['পানি কম', 'শুকনো বাতাস', 'অতিরিক্ত শুকনো বেডিং', 'সরাসরি রোদ'],
    verify: ['আর্দ্রতা পরীক্ষা — মুঠোয় চেপে দেখুন', 'বেডের উপরের স্তর শুকনো কি না'],
    immediate: ['হালকা পানি স্প্রে করুন', 'ভেজা বেডিং মেশান', 'ছায়ায় সরান'],
    longTerm: ['নিয়মিত আর্দ্রতা পরীক্ষা', 'মালচ ব্যবহার'],
    prevent: ['আর্দ্রতা রেকর্ড', 'মাঝারি ছাউনি'] },

  { title: '৬. বেডে পানি জমছে',
    cause: ['ড্রেনেজ ছিদ্র নেই বা বন্ধ', 'অতিরিক্ত পানি দেওয়া', 'বৃষ্টির পানি ঢুকছে', 'বেড ঢালু নয়'],
    verify: ['বেডের নিচে পানি কি না দেখুন', 'ছিদ্র আছে কি না দেখুন'],
    immediate: ['বেড একপাশে কাত করুন', 'অতিরিক্ত পানি বের করুন', 'শুকনো বেডিং যোগ করুন'],
    longTerm: ['ড্রেনেজ ছিদ্র ঠিক করুন', 'বৃষ্টির পানি থেকে সুরক্ষা', 'ঢালু বেড তৈরি'],
    prevent: ['প্রতিদিন চেক', 'সঠিক ছাউনি'] },

  { title: '৭. পিঁপড়া দেখা যাচ্ছে',
    cause: ['বেড শুকনো', 'খাবার খোলা', 'বেডের চারপাশে পিঁপড়ার বাসা', 'মিষ্টি/চিনিযুক্ত খাবার'],
    verify: ['কোথা থেকে আসছে দেখুন', 'খাবারে পিঁপড়া আছে কি না'],
    immediate: ['বেডের চারপাশে পানির বৃত্ত দিন', 'আক্রান্ত খাবার সরান', 'বেড হালকা ভেজান'],
    longTerm: ['সঠিক আর্দ্রতা', 'পরিষ্কার রাখা', 'খাবার ঢেকে রাখা'],
    prevent: ['নিয়মিত পরিদর্শন', 'পিঁপড়ার উৎস সরানো'] },

  { title: '৮. ফলের মাছি বা অন্যান্য মাছি',
    cause: ['অতিরিক্ত ভেজা খাবার', 'খোলা খাবার', 'পচা ফল/সবজি', 'বাতাস চলাচলের অভাব'],
    verify: ['মাছি কোথায় বেশি দেখুন', 'খাবার জমেছে কি না'],
    immediate: ['আক্রান্ত খাবার সরান', 'শুকনো বেডিং যোগ করুন', 'খাবার ঢেকে রাখুন'],
    longTerm: ['সঠিক আর্দ্রতা', 'খাবার মাটির নিচে পুঁতে রাখা', 'নিয়মিত পরিষ্কার'],
    prevent: ['খাবার কুচি করে মাটির সঙ্গে মেশানো'] },

  { title: '৯. খাবার পচছে কিন্তু কেঁচো খাচ্ছে না',
    cause: ['খাবার ইতিমধ্যেই পচে গেছে', 'কাঁচা/অতিরিক্ত গরম খাবার', 'কেঁচো অসুস্থ বা পলায়নরত', 'খাবার উপযুক্ত নয়'],
    verify: ['গন্ধ ও তাপমাত্রা দেখুন', 'কেঁচোর আচরণ দেখুন'],
    immediate: ['পচা খাবার সরান', 'নতুন প্রস্তুত গোবর দিন', 'বেড পরীক্ষা করুন'],
    longTerm: ['প্রাক-কম্পোস্ট ব্যবহার', 'অল্পে অল্পে খাবার', 'নিয়মিত পর্যবেক্ষণ'],
    prevent: ['সঠিক খাদ্য ব্যবস্থাপনা'] },

  { title: '১০. কেঁচোর সংখ্যা বাড়ছে না',
    cause: ['প্রজননের অনুকূল পরিবেশ নেই', 'অতিরিক্ত তাপ/শুষ্কতা', 'খাদ্যের অভাব', 'বেডে বেশি ঘনত্ব'],
    verify: ['কোকুন আছে কি না দেখুন', 'তাপমাত্রা, আর্দ্রতা মাপুন', 'খাবারের অবস্থা দেখুন'],
    immediate: ['পরিবেশ ঠিক করুন', 'প্রয়োজন হলে নতুন বেডে কিছু কেঁচো সরান'],
    longTerm: ['নিয়মিত প্রজনন লগ', 'উপযুক্ত পরিবেশ', 'ধৈর্য'],
    prevent: ['নিয়মিত মনিটরিং'] },

  { title: '১১. কোকুন কম পাওয়া যাচ্ছে',
    cause: ['অনুপযুক্ত পরিবেশ', 'কম খাবার', 'বেডে বেশি কেঁচো', 'বারবার বিরক্ত'],
    verify: ['পরিবেশ ও খাদ্য পরীক্ষা', 'কোকুন আছে কি না লক্ষ্য'],
    immediate: ['পরিবেশ ঠিক করুন', 'খাবার বাড়ান (অল্পে)', 'বিরক্ত করা কমান'],
    longTerm: ['নিয়মিত রেকর্ড', 'ধৈর্য'],
    prevent: ['স্থিতিশীল ব্যবস্থাপনা'] },

  { title: '১২. বেডে সাদা ছত্রাক দেখা যাচ্ছে',
    cause: ['উপকারী অণুজীবের বৃদ্ধি', 'অতিরিক্ত আর্দ্রতা', 'আংশিক পচা খাবার'],
    verify: ['গন্ধ ও কেঁচোর আচরণ দেখুন', 'ছত্রাক কি শুধু উপরে না ভেতরে'],
    immediate: ['যদি গন্ধ না থাকে ও কেঁচো স্বাভাবিক — উদ্বিগ্ন হবেন না', 'অতিরিক্ত ভেজা হলে শুকনো বেডিং দিন'],
    longTerm: ['আর্দ্রতা নিয়ন্ত্রণ', 'বাতাস চলাচল বাড়ানো'],
    prevent: ['নিয়মিত পরিদর্শন', 'সঠিক আর্দ্রতা'] },

  { title: '১৩. খাবারের ওপর অতিরিক্ত গরম বা অ্যামোনিয়ার গন্ধ',
    cause: ['কাঁচা গোবর', 'অতিরিক্ত নাইট্রোজেন', 'বড় স্তূপে পচন'],
    verify: ['তাপমাত্রা মাপুন', 'গন্ধের তীব্রতা বুঝুন'],
    immediate: ['খাবার সরান', 'বেড আলোড়িত করুন', 'নতুন প্রস্তুত খাবার দিন'],
    longTerm: ['প্রাক-কম্পোস্ট ব্যবহার', 'অল্প পরিমাণে খাবার', 'নিয়মিত পরীক্ষা'],
    prevent: ['প্রাক-কম্পোস্টিংয়ের নিয়ম মেনে চলা'] }
];

/* ============================================================
   3. DATA — GLOSSARY
   ============================================================ */
const GLOSSARY = [
  { term: 'Vermicompost', bn: 'কেঁচো সার', desc: 'কেঁচোর সাহায্যে জৈব বর্জ্য থেকে তৈরি জৈব সার।' },
  { term: 'Vermiculture', bn: 'কেঁচো পালন', desc: 'কেঁচো প্রতিপালন ও বংশবিস্তারের প্রক্রিয়া।' },
  { term: 'Vermicast', bn: 'কেঁচোর মল', desc: 'কেঁচোর পরিপাকতন্ত্র থেকে বেরোনো পুষ্টিসমৃদ্ধ পদার্থ।' },
  { term: 'Red Wiggler', bn: 'লাল কেঁচো', desc: 'Eisenia fetida/andrei প্রজাতির কম্পোস্টিং কেঁচোর পরিচিত নাম।' },
  { term: 'Eisenia fetida', bn: 'আইজেনিয়া ফেটিডা', desc: 'ভার্মিকম্পোস্টিংয়ে বহুল ব্যবহৃত প্রজাতি।' },
  { term: 'Eisenia andrei', bn: 'আইজেনিয়া অ্যান্ড্রেই', desc: 'Eisenia fetida-র খুব কাছাকাছি প্রজাতি।' },
  { term: 'Cocoon', bn: 'কোকুন', desc: 'কেঁচোর ডিমের আবরণ — ছোট, ডিমের মতো।' },
  { term: 'Pre-composting', bn: 'প্রাক-কম্পোস্টিং', desc: 'বেডে দেওয়ার আগে গোবরকে আংশিক পচিয়ে নেওয়া।' },
  { term: 'Bedding', bn: 'বেডিং', desc: 'কেঁচোর বাসস্থান ও আর্দ্রতা ধরে রাখার উপাদান।' },
  { term: 'Moisture', bn: 'আর্দ্রতা', desc: 'বেডে পানির পরিমাণ; সাধারণত ৬০–৮০%।' },
  { term: 'pH', bn: 'অম্লত্ব-ক্ষারত্ব', desc: 'বেডের অম্লীয়/ক্ষারীয় মাত্রা; সাধারণত ৬.৫–৭.৫।' },
  { term: 'Aeration', bn: 'বাতাস চলাচল', desc: 'বেডে অক্সিজেন সরবরাহ।' },
  { term: 'Leachate', bn: 'লিচেট', desc: 'বেড থেকে গড়িয়ে আসা তরল, যা ভার্মিওয়াশের সমান নয়।' },
  { term: 'Vermiwash', bn: 'ভার্মিওয়াশ', desc: 'কেঁচোর বেড থেকে সংগৃহীত তরল সার (সতর্কতার সঙ্গে ব্যবহার)।' },
  { term: 'Harvesting', bn: 'সার সংগ্রহ', desc: 'পরিপক্ব সার বেড থেকে আলাদা করা।' },
  { term: 'Organic Matter', bn: 'জৈব পদার্থ', desc: 'মাটি/বেডে থাকা জৈব উৎসের পদার্থ।' },
  { term: 'Clitellum', bn: 'ক্লাইটেলাম', desc: 'প্রাপ্তবয়স্ক কেঁচোর দেহের বলয়; প্রজননে ভূমিকা রাখে।' },
  { term: 'Castings', bn: 'কাস্টিং', desc: 'কেঁচোর মলের সঙ্গে বেডিং মিশ্রিত পদার্থ।' },
  { term: 'Decomposition', bn: 'পচন', desc: 'জৈব পদার্থ ভেঙে সরল উপাদানে পরিণত হওয়া।' },
  { term: 'Humus', bn: 'হিউমাস', desc: 'মাটির গাঢ়, স্থিতিশীল জৈব উপাদান।' }
];

/* ============================================================
   4. DATA — FAQ
   ============================================================ */
const FAQ = [
  { q: 'কত দিনে কেঁচো সার তৈরি হয়?',
    a: 'সাধারণত কয়েক সপ্তাহ থেকে কয়েক মাস পর্যন্ত লাগতে পারে। এটি নির্ভর করে কেঁচোর সংখ্যা, খাদ্য, তাপমাত্রা, আর্দ্রতা ও ব্যবস্থাপনার ওপর। দিন গুনে নয়, সার পরিপক্ব হয়েছে কি না তা দেখে সিদ্ধান্ত নিন।' },
  { q: 'কত কেজি কেঁচো দিয়ে শুরু করব?',
    a: 'ছোট বেডে ০.৫–১ কেজি দিয়ে শুরু করা যায়। তবে বেডের আকার, উপলব্ধ খাদ্য ও আপনার লক্ষ্যের ওপর নির্ভর করে পরিমাণ বদলাবে।' },
  { q: 'কেঁচো কোথায় পাব?',
    a: 'স্থানীয় ভার্মিকম্পোস্ট খামার, কৃষি উদ্যোক্তা, উপজেলা কৃষি অফিস (DAE) ও কৃষি বিশ্ববিদ্যালয়ের সংশ্লিষ্ট বিভাগে খোঁজ করুন। প্রথমে সরাসরি দেখে, প্রজাতি যাচাই করে, অল্প পরিমাণ নিয়ে শুরু করুন।' },
  { q: 'বেডে পানি দেওয়া লাগে কি?',
    a: 'শুধু আর্দ্রতা রক্ষার জন্য হালকা পানি স্প্রে করা যেতে পারে। তবে অতিরিক্ত পানি দেবেন না — ড্রেনেজ অবশ্যই থাকতে হবে।' },
  { q: 'শীতে কেঁচো মরে যায়?',
    a: 'অতিরিক্ত ঠান্ডায় কেঁচোর সক্রিয়তা কমতে পারে। বেড উষ্ণ রাখতে মোটা আচ্ছাদন ব্যবহার করুন এবং খাবার কম দিন।' },
  { q: 'দুর্গন্ধ হলে কী করব?',
    a: 'প্রথমে কারণ খুঁজুন — অতিরিক্ত ভেজা, কাঁচা খাবার, বা বাতাসের অভাব। খাবার দেওয়া বন্ধ করুন, শুকনো বেডিং যোগ করুন, বেড আলোড়িত করুন এবং পরিস্থিতি স্থিতিশীল হলে ধীরে খাবার চালু করুন।' },
  { q: 'কোকুন কীভাবে চিনব?',
    a: 'কোকুন সাধারণত ছোট, ডিমের মতো ও হালকা রঙের। বেডিং ভালোভাবে দেখলে এগুলো চোখে পড়ে।' },
  { q: 'বাড়ির ছাদে করা যাবে?',
    a: 'হ্যাঁ, হালকা প্লাস্টিক ক্রেট ব্যবহার করে করা যায়। তবে ওজন ছাদে ছড়িয়ে দিন, ছায়া ও বাতাস চলাচল নিশ্চিত করুন, এবং বৃষ্টির পানি থেকে সুরক্ষা দিন।' },
  { q: 'কী কী খাবার দেওয়া যাবে না?',
    a: 'কীটনাশকযুক্ত, রাসায়নিক-দূষিত, তেল-লবণ-মসলাযুক্ত, পচা মাংস-মাছের বড় পরিমাণ, প্লাস্টিক ও ধাতু — এগুলো ব্যবহার করবেন না।' },
  { q: 'সার কখন তুলব?',
    a: 'যখন বেডের বেশিরভাগ উপাদান গাঢ় বাদামি, দানাদার ও গন্ধহীন হয়ে যায়, এবং খাবারের কাঁচা অংশ খুব কম থাকে — তখন সংগ্রহ করা যায়।' },
  { q: 'কেঁচো বিক্রি করা যায়?',
    a: 'হ্যাঁ, তবে প্রজাতি ও স্বাস্থ্য যাচাই করে, সঠিক পরিবহন ব্যবস্থা নিশ্চিত করে বিক্রি করুন। স্থানীয় বাজার যাচাই করে মূল্য নির্ধারণ করুন।' },
  { q: 'মাটিতে কতটা দিতে হয়?',
    a: 'ফসল, মাটির অবস্থা ও প্রয়োগের পদ্ধতি অনুযায়ী পরিমাণ বদলায়। নির্দিষ্ট পরিমাণের জন্য স্থানীয় কৃষি সম্প্রসারণ কর্মকর্তার পরামর্শ নিন।' }
];

/* ============================================================
   5. DATA — QUIZ
   ============================================================ */
const QUIZ = [
  { q: 'ভার্মিকম্পোস্ট কী?',
    options: ['রাসায়নিক সার', 'কেঁচোর সাহায্যে তৈরি জৈব সার', 'শুধু গোবর'],
    answer: 1,
    explain: 'কেঁচো জৈব পদার্থ খেয়ে হজম করে যে সার তৈরি হয়, সেটাই ভার্মিকম্পোস্ট।' },
  { q: 'কাঁচা গোবর সরাসরি বেডে দিলে কী হতে পারে?',
    options: ['কিছুই হয় না', 'তাপ ও অ্যামোনিয়া বেড়ে কেঁচো মরতে পারে', 'সার দ্রুত তৈরি হয়'],
    answer: 1,
    explain: 'কাঁচা গোবরে পচনের সময় তাপ ও অ্যামোনিয়া উৎপন্ন হয় — যা কেঁচোর জন্য ক্ষতিকর।' },
  { q: 'কেঁচোর জন্য সাধারণত কোন আর্দ্রতা উপযুক্ত?',
    options: ['১০–২০%', '৬০–৮০%', '১০০%'],
    answer: 1,
    explain: 'সাধারণত ৬০–৮০% আর্দ্রতা উপযুক্ত, তবে মাপার পদ্ধতি ও অবস্থাভেদে বদলাতে পারে।' },
  { q: 'বেডে পানি জমলে কী করা উচিত?',
    options: ['আরও পানি দেওয়া', 'ড্রেনেজ ঠিক করা ও শুকনো বেডিং যোগ করা', 'খাবার বাড়ানো'],
    answer: 1,
    explain: 'অতিরিক্ত পানি কেঁচোর জন্য ক্ষতিকর — ড্রেনেজ নিশ্চিত করুন ও শুকনো বেডিং যোগ করুন।' },
  { q: 'প্রাক-কম্পোস্টিং কেন দরকার?',
    options: ['সময় নষ্ট করতে', 'তাপ ও অ্যামোনিয়া কমানোর জন্য', 'কেঁচো বাড়ানোর জন্য'],
    answer: 1,
    explain: 'প্রাক-কম্পোস্টিং গোবরের তাপ ও অ্যামোনিয়ার ঝুঁকি কমায়।' },
  { q: 'Red Wiggler বলতে কী বোঝায়?',
    options: ['এক ধরনের মাছ', 'কম্পোস্টিং কেঁচোর পরিচিত নাম', 'একটি সার'],
    answer: 1,
    explain: 'Red Wiggler হলো Eisenia fetida/andrei প্রজাতির কম্পোস্টিং কেঁচোর পরিচিত নাম।' },
  { q: 'পিঁপড়া থেকে বেড রক্ষা করতে কী ভালো?',
    options: ['কীটনাশক', 'বেডের চারপাশে পানির বৃত্ত ও পরিচ্ছন্নতা', 'আরও খাবার'],
    answer: 1,
    explain: 'কীটনাশক কেঁচোর জন্য ক্ষতিকর; পানির বৃত্ত ও পরিচ্ছন্নতা নিরাপদ।' },
  { q: 'সাদা ছত্রাক দেখলে কী করবেন?',
    options: ['সাথে সাথে সব ফেলে দিন', 'গন্ধ ও কেঁচোর আচরণ দেখে সিদ্ধান্ত নিন', 'কীটনাশক দিন'],
    answer: 1,
    explain: 'সাদা ছত্রাক সবসময় রোগ নয়; গন্ধ, আর্দ্রতা ও কেঁচোর আচরণ দেখে সিদ্ধান্ত নিন।' }
];

/* ============================================================
   6. DATA — LEARNING PATH
   ============================================================ */
const LEVELS = [
  { title: 'Level 1: Beginner', goal: 'মৌলিক ধারণা স্পষ্ট করা।',
    lessons: ['intro', 'worms'],
    tasks: ['ভার্মিকম্পোস্ট ও সাধারণ কম্পোস্টের পার্থক্য লিখুন', 'নিজের জায়গা ও বাজেটের প্রাথমিক হিসাব করুন'],
    quiz: 'মৌলিক ধারণা যাচাই করুন' },
  { title: 'Level 2: Farm Setup', goal: 'বেড তৈরি ও গোবর প্রস্তুত করা শেখা।',
    lessons: ['bed', 'gobor', 'food'],
    tasks: ['বেড প্ল্যানার ব্যবহার করুন', 'গোবর প্রাক-কম্পোস্ট শুরু করুন'],
    quiz: 'গোবর প্রস্তুতি যাচাই করুন' },
  { title: 'Level 3: Production & Breeding', goal: 'নিয়মিত পরিচর্যা, পরিবেশ ও বংশবিস্তার।',
    lessons: ['environment', 'breeding', 'care', 'problems', 'harvest'],
    tasks: ['দৈনিক লগ রাখা শুরু করুন', 'পরিবেশ মনিটরিং ড্যাশবোর্ড ব্যবহার করুন'],
    quiz: 'পরিবেশ ও সমস্যা যাচাই করুন' },
  { title: 'Level 4: Commercial Farming', goal: 'উৎপাদন বাড়ানো, ব্যবসা ও বাজার।',
    lessons: ['production', 'business', 'marketing', 'farmlog'],
    tasks: ['Production Planner ব্যবহার করুন', 'Business Calculator দিয়ে লাভ-ক্ষতি দেখুন'],
    quiz: 'ব্যবসা ও বাজার যাচাই করুন' }
];

/* ============================================================
   7. LESSON COMPLETION & STATS
   ============================================================ */
function injectLessonFooters() {
  $$('.page[data-lesson]').forEach(page => {
    if (page.querySelector('.lesson-footer')) return;
    const id = page.dataset.lesson;
    const footer = document.createElement('div');
    footer.className = 'card lesson-footer';
    footer.innerHTML = `
      <label class="check">
        <input type="checkbox" class="lesson-done" data-lesson="${id}">
        আমি এই পাঠটি সম্পন্ন করেছি
      </label>
      <p class="muted small" style="margin:0.3rem 0 0 2.5rem;">টিক দিলে অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।</p>
    `;
    page.appendChild(footer);
    const cb = footer.querySelector('input');
    cb.checked = STORE.get(`vba.lesson.${id}`, false);
    cb.addEventListener('change', () => {
      STORE.set(`vba.lesson.${id}`, cb.checked);
      updateLessonStats();
    });
  });
}

function getLessonIds() {
  return $$('.page[data-lesson]').map(p => p.dataset.lesson);
}

function updateLessonStats() {
  const ids = getLessonIds();
  const total = ids.length;
  const done = ids.filter(id => STORE.get(`vba.lesson.${id}`, false)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const elTotal = $('#statTotal');
  const elDone = $('#statDone');
  const elPct = $('#statPct');
  const elBar = $('#statBar');
  if (elTotal) elTotal.textContent = bn(total);
  if (elDone) elDone.textContent = bn(done);
  if (elPct) elPct.textContent = bn(pct) + '%';
  if (elBar) elBar.style.width = pct + '%';
}

/* ============================================================
   8. CHECKBOXES (persistent + daily)
   ============================================================ */
function taskNum(cb) {
  const m = String(cb.dataset.key || '').match(/\d+/);
  return m ? m[0] : '0';
}

function initCheckboxes() {
  $$('input[type="checkbox"][data-key], input[type="checkbox"][data-daily]').forEach(cb => {
    if (cb.classList.contains('lesson-done')) return;
    const isDaily = cb.dataset.daily === '1';
    const key = isDaily
      ? `vba.daily.${todayISO()}.${taskNum(cb)}`
      : `vba.check.${cb.dataset.key}`;
    cb._storeKey = key;
    cb._isDaily = isDaily;
    cb.checked = STORE.get(key, false);
    cb.addEventListener('change', onCheckboxChange);
  });
  updateSetupProgress();
}

function onCheckboxChange(e) {
  const cb = e.target;
  STORE.set(cb._storeKey, cb.checked);

  if (cb._isDaily) {
    const n = taskNum(cb);
    $$('input[type="checkbox"][data-daily="1"]').forEach(other => {
      if (other !== cb && taskNum(other) === n && other._storeKey === cb._storeKey) {
        other.checked = cb.checked;
      }
    });
  }
  updateSetupProgress();
}

function updateSetupProgress() {
  const keys = ['setup1', 'setup2', 'setup3', 'setup4', 'setup5', 'setup6'];
  const done = keys.filter(k => STORE.get(`vba.check.${k}`, false)).length;
  const pct = Math.round((done / keys.length) * 100);
  const bar = $('#setupBar');
  if (bar) bar.style.width = pct + '%';
}

/* ============================================================
   9. THEME
   ============================================================ */
function applyTheme(isDark) {
  const toggle = $('#themeToggle');
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (toggle) toggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (toggle) toggle.textContent = '🌙';
  }
}

function initTheme() {
  const saved = STORE.get('vba.theme', null);
  let dark;
  if (saved === 'dark') dark = true;
  else if (saved === 'light') dark = false;
  else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(dark);
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = !isDark;
  applyTheme(next);
  STORE.set('vba.theme', next ? 'dark' : 'light');
}

/* ============================================================
   10. SIDEBAR
   ============================================================ */
function openSidebar() {
  const sb = $('#sidebar');
  const ov = $('#sidebarOverlay');
  if (sb) sb.classList.add('open');
  if (ov) ov.classList.add('active');
}
function closeSidebar() {
  const sb = $('#sidebar');
  const ov = $('#sidebarOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('active');
}

/* ============================================================
   11. ROUTER
   ============================================================ */
function router() {
  let hash = (location.hash || '#/dashboard').replace(/^#\/?/, '');
  const pageId = (hash.split('?')[0] || 'dashboard').trim() || 'dashboard';
  const target = document.getElementById(`page-${pageId}`);
  const finalId = target ? pageId : 'dashboard';

  $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${finalId}`));
  $$('.nav-link, .bn-link').forEach(a => a.classList.toggle('active', a.dataset.page === finalId));

  const page = document.getElementById(`page-${finalId}`);
  const title = page?.dataset.title || 'ড্যাশবোর্ড';
  const bc = $('#breadcrumb');
  if (bc) {
    if (finalId === 'dashboard') {
      bc.innerHTML = `<span class="current">🏠 ড্যাশবোর্ড</span>`;
    } else {
      bc.innerHTML =
        `<a href="#/dashboard">🏠 ড্যাশবোর্ড</a><span class="sep">/</span>` +
        `<span class="current">${escapeHtml(title)}</span>`;
    }
  }

  if (page?.dataset.lesson) {
    STORE.set('vba.lastLesson', finalId);
    updateResumeButton();
  }

  // Refresh dynamic tables when entering those pages
  if (finalId === 'farmlog') renderLogTable();
  if (finalId === 'environment') renderEnvTable();
  if (finalId === 'breeding') renderBreedingTable();

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateResumeButton() {
  const last = STORE.get('vba.lastLesson', null);
  const btn = $('#resumeBtn');
  const text = $('#lastLesson');
  if (!btn || !text) return;
  if (!last) {
    text.textContent = 'এখনো কোনো পাঠ দেখা হয়নি।';
    btn.hidden = true;
    return;
  }
  const page = document.getElementById(`page-${last}`);
  if (!page) {
    text.textContent = 'এখনো কোনো পাঠ দেখা হয়নি।';
    btn.hidden = true;
    return;
  }
  text.textContent = page.dataset.title || last;
  btn.hidden = false;
  btn.onclick = () => { location.hash = `#/${last}`; };
}

/* ============================================================
   12. GLOBAL SEARCH
   ============================================================ */
let SEARCH_INDEX = [];

function buildSearchIndex() {
  const idx = [];

  $$('.page[data-lesson]').forEach(p => {
    idx.push({
      title: p.dataset.title || p.dataset.lesson,
      type: 'পাঠ',
      href: `#/${p.dataset.page}`,
      keywords: ((p.dataset.title || '') + ' ' + (p.textContent || '')).toLowerCase()
    });
  });

  FOODS.forEach(f => {
    idx.push({
      title: f.name,
      type: 'খাবার',
      href: '#/food',
      keywords: `${f.name} ${f.prep} ${f.risk} ${f.avoid}`.toLowerCase()
    });
  });

  GLOSSARY.forEach(g => {
    idx.push({
      title: `${g.term} — ${g.bn}`,
      type: 'অভিধান',
      href: '#/glossary',
      keywords: `${g.term} ${g.bn} ${g.desc}`.toLowerCase()
    });
  });

  FAQ.forEach(f => {
    idx.push({
      title: f.q,
      type: 'প্রশ্ন',
      href: '#/glossary',
      keywords: `${f.q} ${f.a}`.toLowerCase()
    });
  });

  PROBLEMS.forEach(p => {
    idx.push({
      title: p.title,
      type: 'সমস্যা',
      href: '#/problems',
      keywords: `${p.title} ${p.cause.join(' ')}`.toLowerCase()
    });
  });

  SEARCH_INDEX = idx;
}

function performSearch(rawQuery) {
  const box = $('#searchResults');
  if (!box) return;
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) { box.hidden = true; box.innerHTML = ''; return; }

  const results = SEARCH_INDEX
    .filter(item => item.keywords.includes(q) || item.title.toLowerCase().includes(q))
    .slice(0, 15);

  if (!results.length) {
    box.innerHTML = `<div class="sr-empty">কোনো ফলাফল পাওয়া যায়নি</div>`;
    box.hidden = false;
    return;
  }

  box.innerHTML = results.map(r => `
    <a class="sr-item" href="${r.href}">
      <span>${escapeHtml(r.title)}</span>
      <span class="sr-tag">${escapeHtml(r.type)}</span>
    </a>
  `).join('');
  box.hidden = false;
}

/* ============================================================
   13. FOOD LIST RENDER
   ============================================================ */
const CAT_LABEL = { A: 'সাধারণত উপযোগী', B: 'সতর্কতার সঙ্গে', C: 'এড়িয়ে চলুন' };

function renderFoods(filter = 'all', query = '') {
  const list = $('#foodList');
  if (!list) return;
  const q = String(query || '').trim().toLowerCase();

  const items = FOODS.filter(f => {
    const matchCat = filter === 'all' || f.cat === filter;
    const matchQ = !q || `${f.name} ${f.prep} ${f.risk} ${f.avoid}`.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  if (!items.length) {
    list.innerHTML = `<p class="muted">কোনো খাবার পাওয়া যায়নি।</p>`;
    return;
  }

  list.innerHTML = items.map(f => `
    <div class="food-item cat-${f.cat}">
      <h3>${escapeHtml(f.name)} <span class="cat-tag">${CAT_LABEL[f.cat]}</span></h3>
      <p><strong>প্রস্তুতি:</strong> ${escapeHtml(f.prep)}</p>
      <p><strong>ঝুঁকি:</strong> ${escapeHtml(f.risk)}</p>
      <p><strong>অল্পে পরীক্ষা:</strong> ${escapeHtml(f.test)}</p>
      <p><strong>কখন এড়াবেন:</strong> ${escapeHtml(f.avoid)}</p>
    </div>
  `).join('');
}

/* ============================================================
   14. PROBLEMS RENDER
   ============================================================ */
function renderProblems(query = '') {
  const list = $('#probList');
  if (!list) return;
  const q = String(query || '').trim().toLowerCase();

  const items = PROBLEMS.filter(p =>
    !q || `${p.title} ${p.cause.join(' ')}`.toLowerCase().includes(q)
  );

  if (!items.length) {
    list.innerHTML = `<p class="muted">কোনো সমস্যা পাওয়া যায়নি।</p>`;
    return;
  }

  list.innerHTML = items.map(p => `
    <div class="prob-item">
      <button class="prob-head" type="button">${escapeHtml(p.title)}</button>
      <div class="prob-body">
        <h4>সম্ভাব্য কারণ</h4>
        <ul>${p.cause.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        <h4>কীভাবে যাচাই করবেন</h4>
        <ul>${p.verify.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        <h4>তাৎক্ষণিক করণীয়</h4>
        <ul>${p.immediate.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        <h4>দীর্ঘমেয়াদি সমাধান</h4>
        <ul>${p.longTerm.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        <h4>প্রতিরোধ</h4>
        <ul>${p.prevent.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.prob-head').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('open'));
  });
}

/* ============================================================
   15. GLOSSARY + FAQ RENDER
   ============================================================ */
function renderGlossary(query = '') {
  const list = $('#glossaryList');
  if (!list) return;
  const q = String(query || '').trim().toLowerCase();

  const items = GLOSSARY.filter(g =>
    !q || `${g.term} ${g.bn} ${g.desc}`.toLowerCase().includes(q)
  );

  if (!items.length) {
    list.innerHTML = `<p class="muted">কোনো শব্দ পাওয়া যায়নি।</p>`;
    return;
  }

  list.innerHTML = items.map(g => `
    <div class="glossary-item">
      <strong>${escapeHtml(g.bn)}</strong>
      <em>${escapeHtml(g.term)}</em>
      <p>${escapeHtml(g.desc)}</p>
    </div>
  `).join('');
}

function renderFaq(query = '') {
  const list = $('#faqList');
  if (!list) return;
  const q = String(query || '').trim().toLowerCase();

  const items = FAQ.filter(f =>
    !q || `${f.q} ${f.a}`.toLowerCase().includes(q)
  );

  if (!items.length) {
    list.innerHTML = `<p class="muted">কোনো প্রশ্ন পাওয়া যায়নি।</p>`;
    return;
  }

  list.innerHTML = items.map(f => `
    <div class="faq-item">
      <button class="faq-head" type="button">${escapeHtml(f.q)}</button>
      <div class="faq-body">${escapeHtml(f.a)}</div>
    </div>
  `).join('');

  list.querySelectorAll('.faq-head').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('open'));
  });
}

/* ============================================================
   16. QUIZ RENDER
   ============================================================ */
function renderQuiz() {
  const wrap = $('#quizWrap');
  if (!wrap) return;

  wrap.innerHTML = QUIZ.map((q, qi) => `
    <div class="quiz-q" data-qi="${qi}">
      <p>${bn(qi + 1)}. ${escapeHtml(q.q)}</p>
      ${q.options.map((opt, oi) => `
        <label>
          <input type="radio" name="q${qi}" value="${oi}">
          ${escapeHtml(opt)}
        </label>
      `).join('')}
      <div class="quiz-feedback" hidden></div>
    </div>
  `).join('');

  wrap.querySelectorAll('input[type="radio"]').forEach(r => {
    r.addEventListener('change', () => {
      const box = r.closest('.quiz-q');
      const qi = parseInt(box.dataset.qi, 10);
      const fb = box.querySelector('.quiz-feedback');
      const correct = QUIZ[qi].answer;
      const selected = parseInt(r.value, 10);
      fb.hidden = false;
      if (selected === correct) {
        fb.className = 'quiz-feedback correct';
        fb.textContent = '✅ সঠিক! ' + QUIZ[qi].explain;
      } else {
        fb.className = 'quiz-feedback wrong';
        fb.textContent = '❌ সঠিক উত্তর: ' + QUIZ[qi].options[correct] + ' — ' + QUIZ[qi].explain;
      }
    });
  });
}

/* ============================================================
   17. LEARNING PATH RENDER
   ============================================================ */
function renderLearningPath() {
  const wrap = $('#learningPath');
  if (!wrap) return;

  wrap.innerHTML = LEVELS.map(lv => `
    <div class="level-card">
      <h3>${escapeHtml(lv.title)}</h3>
      <p class="level-meta">${escapeHtml(lv.goal)}</p>
      <ul>
        <li><strong>পাঠ:</strong> ${lv.lessons.map(id => {
          const page = document.getElementById(`page-${id}`);
          return page ? escapeHtml(page.dataset.title || id) : id;
        }).join(', ')}</li>
        <li><strong>বাস্তব কাজ:</strong> ${lv.tasks.map(escapeHtml).join('; ')}</li>
        <li><strong>Self-assessment:</strong> ${escapeHtml(lv.quiz)}</li>
      </ul>
    </div>
  `).join('');
}

/* ============================================================
   18. BED PLANNER
   ============================================================ */
function initBedPlanner() {
  const btn = $('#bedCalcBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const l = parseFloat($('#bedL').value) || 0;
    const w = parseFloat($('#bedW').value) || 0;
    const h = parseFloat($('#bedH').value) || 0;
    const res = $('#bedResult');
    if (l <= 0 || w <= 0) {
      res.className = 'result warn';
      res.innerHTML = 'দৈর্ঘ্য ও প্রস্থ ইতিবাচক সংখ্যা দিন।';
      res.hidden = false;
      return;
    }
    const vol = l * w * h;
    const area = l * w;
    res.className = 'result';
    res.innerHTML = `
      <strong>আনুমানিক আয়তন:</strong> ${bn(vol.toFixed(2))} ঘনফুট<br>
      <strong>পৃষ্ঠতল:</strong> ${bn(area.toFixed(2))} বর্গফুট<br>
      <span class="muted">এটি শুধু উপাদানের পরিমাণ আন্দাজ করতে সাহায্য করে — উৎপাদন বা কেঁচোর ধারণক্ষমতা নির্ধারণ করে না।</span>
    `;
    res.hidden = false;
  });
}

/* ============================================================
   19. FEEDING CALCULATOR
   ============================================================ */
function initFeedCalculator() {
  const btn = $('#feedCalcBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const worm = parseFloat($('#feedWorm').value) || 0;
    const now  = parseFloat($('#feedNow').value) || 0;
    const left = parseFloat($('#feedLeft').value) || 0;
    const res = $('#feedResult');

    if (worm <= 0) {
      res.className = 'result warn';
      res.innerHTML = 'কেঁচোর ওজন (কেজি) দিন।';
      res.hidden = false;
      return;
    }
    if (now <= 0) {
      res.className = 'result warn';
      res.innerHTML = 'বর্তমানে দেওয়া খাবারের পরিমাণ দিন।';
      res.hidden = false;
      return;
    }

    const leftRatio = Math.max(0, left) / now;
    let html = `<strong>পরিস্থিতি:</strong> দেওয়া খাবারের ${bn((leftRatio * 100).toFixed(0))}% এখনো অবশিষ্ট।<br>`;
    let cls = 'result';

    if (leftRatio > 0.6) {
      cls = 'result warn';
      html += '⚠️ খাবার অনেক বেশি জমে আছে। পরিমাণ কমান, কিছুদিন নতুন খাবার দেবেন না।';
    } else if (leftRatio > 0.3) {
      html += '📌 কিছুটা বেশি থাকতে পারে। পরবর্তী খাবার অর্ধেক করে দিন এবং কেঁচোর প্রতিক্রিয়া দেখুন।';
    } else if (leftRatio < 0.1) {
      html += '📌 খাবার প্রায় শেষ। পরিমাণ সামান্য বাড়ানো যেতে পারে — তবে ধীরে।';
    } else {
      html += '✅ পরিমাণ মোটামুটি ঠিক আছে। একই হারে চালিয়ে যান।';
    }

    html += `<br><span class="muted">এটি কোনো নিশ্চিত feeding rate নয়। কেঁচোর আচরণ, তাপমাত্রা ও বেডের অবস্থা দেখে নিজে সিদ্ধান্ত নিন।</span>`;

    res.className = cls;
    res.innerHTML = html;
    res.hidden = false;
  });
}

/* ============================================================
   20. PRODUCTION PLANNER
   ============================================================ */
function initProductionPlanner() {
  const btn = $('#prodCalcBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const beds  = parseInt($('#prodBeds').value, 10) || 0;
    const worm  = parseFloat($('#prodWorm').value) || 0;
    const feed  = parseFloat($('#prodFeed').value) || 0;
    const gobor = parseFloat($('#prodGobor').value) || 0;
    const goal  = parseFloat($('#prodGoal').value) || 0;
    const space = parseFloat($('#prodSpace').value) || 0;
    const res = $('#prodResult');

    if (beds <= 0 || worm <= 0) {
      res.className = 'result warn';
      res.innerHTML = 'বেড সংখ্যা ও প্রতি বেডে কেঁচোর ওজন দিন।';
      res.hidden = false;
      return;
    }

    const totalWorm   = beds * worm;
    const monthlyFeed = feed * 30;
    const goborGap    = monthlyFeed - gobor;

    let html = `
      <h3>প্রাথমিক সেটআপ সারাংশ</h3>
      <ul>
        <li>বেড সংখ্যা: ${bn(beds)}</li>
        <li>মোট কেঁচো: ${bn(totalWorm.toFixed(2))} কেজি (আনুমানিক)</li>
        <li>দৈনিক খাবার: ${bn(feed.toFixed(2))} কেজি</li>
        <li>মাসিক খাদ্য প্রয়োজন: ${bn(monthlyFeed.toFixed(2))} কেজি</li>
        <li>জায়গা: ${bn(space)} বর্গফুট</li>
        <li>উৎপাদনের লক্ষ্য: ${bn(goal)} কেজি/মাস</li>
      </ul>
      <h3>খাদ্য প্রাপ্যতা</h3>
    `;

    if (goborGap > 0) {
      html += `<p>⚠️ মাসিক প্রয়োজনের তুলনায় ${bn(goborGap.toFixed(2))} কেজি কম গোবর আছে। বিকল্প উৎস খুঁজুন।</p>`;
    } else {
      html += `<p>✅ গোবর প্রাপ্যতা মাসিক প্রয়োজনের জন্য যথেষ্ট।</p>`;
    }

    html += `
      <h3>প্রয়োজনীয় পর্যবেক্ষণ</h3>
      <ul>
        <li>তাপমাত্রা, আর্দ্রতা, pH</li>
        <li>খাবারের অবশিষ্টাংশ</li>
        <li>কেঁচোর আচরণ ও কোকুন</li>
        <li>দুর্গন্ধ ও পানি জমা</li>
      </ul>
      <h3>দৈনিক কাজের তালিকা</h3>
      <ul>
        <li>তাপমাত্রা, আর্দ্রতা, গন্ধ পরীক্ষা</li>
        <li>খাবারের অবশিষ্টাংশ দেখা</li>
        <li>পানি জমেছে কি না দেখা</li>
        <li>কেঁচোর আচরণ পর্যবেক্ষণ</li>
      </ul>
      <h3>উৎপাদন রেকর্ডের কাঠামো</h3>
      <p>ফার্ম লগে প্রতিদিন তারিখ, বেড নম্বর, কেঁচোর ওজন, খাদ্য, তাপ, আর্দ্রতা, pH, পর্যবেক্ষণ ও সার সংগ্রহের পরিমাণ লিখে রাখুন।</p>
      <p class="muted">⚠️ সার উৎপাদনের নির্ভুল পূর্বানুমান সম্ভব নয়। এই পরিকল্পনা সহায়ক, নিশ্চিত ফলাফল নয়।</p>
    `;

    res.className = 'result';
    res.innerHTML = html;
    res.hidden = false;
  });
}

/* ============================================================
   21. BUSINESS CALCULATOR
   ============================================================ */
function initBusinessCalculator() {
  const btn = $('#bizCalcBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const fixed    = $$('.biz-fixed').reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
    const variable = $$('.biz-var').reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
    const qty   = parseFloat($('#bizQty').value) || 0;
    const price = parseFloat($('#bizPrice').value) || 0;
    const res = $('#bizResult');

    const revenue  = qty * price;
    const totalCost = fixed + variable;
    const profit   = revenue - totalCost;

    let html = `
      <h3>হিসাবের ফলাফল</h3>
      <ul>
        <li>মোট এককালীন বিনিয়োগ (Fixed): ৳${bn(fixed.toFixed(2))}</li>
        <li>মোট নিয়মিত খরচ (Variable): ৳${bn(variable.toFixed(2))}</li>
        <li>মোট খরচ (Total Cost): ৳${bn(totalCost.toFixed(2))}</li>
        <li>বিক্রয় আয় (Revenue): ৳${bn(revenue.toFixed(2))}</li>
      </ul>
    `;

    if (qty === 0 && price === 0) {
      html += `<p class="muted">বিক্রয়ের পরিমাণ ও প্রতি কেজির মূল্য দিন।</p>`;
    } else if (profit > 0) {
      html += `<p><strong>✅ লাভ:</strong> ৳${bn(profit.toFixed(2))}</p>`;
    } else if (profit < 0) {
      html += `<p><strong>❌ ক্ষতি:</strong> ৳${bn(Math.abs(profit).toFixed(2))}</p>`;
    } else {
      html += `<p>ব্রেক-ইভেন পয়েন্টে আছেন।</p>`;
    }

    if (qty > 0) {
      const varPerKg = variable / qty;
      const contribution = price - varPerKg;
      html += `<h3>ব্রেক-ইভেন বিশ্লেষণ</h3>`;
      html += `<p>প্রতি কেজি Variable খরচ: ৳${bn(varPerKg.toFixed(2))}</p>`;
      if (contribution <= 0) {
        html += `<p class="warn">⚠️ প্রতি কেজিতে contribution margin শূন্য বা ঋণাত্মক (৳${bn(contribution.toFixed(2))})। এই অবস্থায় ব্রেক-ইভেন হিসাব অর্থপূর্ণ নয়। বিক্রয়মূল্য বাড়ান বা খরচ কমান।</p>`;
      } else {
        const beQty = fixed / contribution;
        html += `<p>প্রতি কেজি Contribution: ৳${bn(contribution.toFixed(2))}</p>`;
        html += `<p><strong>ব্রেক-ইভেন পরিমাণ:</strong> ${bn(beQty.toFixed(2))} কেজি</p>`;
      }
    } else if (price > 0) {
      html += `<p class="muted">ব্রেক-ইভেন হিসাবের জন্য বিক্রয়যোগ্য পরিমাণ প্রয়োজন।</p>`;
    }

    html += `<p class="muted">এককালীন ও নিয়মিত খরচ আলাদা রাখা হয়েছে। বাজারমূল্য স্থানীয়ভাবে যাচাই করে নিজে লিখুন।</p>`;

    res.className = 'result';
    res.innerHTML = html;
    res.hidden = false;
  });
}

/* ============================================================
   22. ENVIRONMENT MONITORING
   ============================================================ */
function loadEnv() { return STORE.get('vba.env', []); }
function saveEnv(arr) { STORE.set('vba.env', arr); }

function renderEnvTable() {
  const body = $('#envTableBody');
  if (!body) return;
  const records = loadEnv();
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="7" class="muted">এখনো কোনো রেকর্ড নেই।</td></tr>`;
    return;
  }
  body.innerHTML = records.slice().reverse().map(r => `
    <tr>
      <td>${escapeHtml(fmtDate(r.date))}</td>
      <td>${r.temp ? bn(r.temp) + '°' : '—'}</td>
      <td>${r.moist ? bn(r.moist) + '%' : '—'}</td>
      <td>${r.ph ? bn(r.ph) : '—'}</td>
      <td>${escapeHtml(r.behavior || '—')}</td>
      <td>${escapeHtml(r.smell || '—')}</td>
      <td>${escapeHtml(r.feed || '—')}</td>
    </tr>
  `).join('');
}

function initEnv() {
  const dateEl = $('#envDate');
  if (dateEl && !dateEl.value) dateEl.value = todayISO();

  const btn = $('#envSaveBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const rec = {
        date: $('#envDate').value || todayISO(),
        temp: $('#envTemp').value,
        moist: $('#envMoist').value,
        ph: $('#envPh').value,
        behavior: $('#envBehavior').value,
        smell: $('#envSmell').value,
        feed: $('#envFeed').value
      };
      const msg = $('#envMsg');
      if (!rec.temp && !rec.moist && !rec.ph) {
        msg.className = 'result warn';
        msg.textContent = 'অন্তত তাপমাত্রা, আর্দ্রতা বা pH এর একটি মান দিন।';
        msg.hidden = false;
        return;
      }
      const records = loadEnv();
      records.push(rec);
      saveEnv(records);
      renderEnvTable();
      msg.className = 'result';
      msg.textContent = '✅ রেকর্ড সংরক্ষিত হয়েছে।';
      msg.hidden = false;
      setTimeout(() => { msg.hidden = true; }, 2000);
      $('#envTemp').value = '';
      $('#envMoist').value = '';
      $('#envPh').value = '';
    });
  }

  const clearBtn = $('#envClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('সব পরিবেশ রেকর্ড মুছে ফেলতে চান?')) return;
      saveEnv([]);
      renderEnvTable();
    });
  }

  renderEnvTable();
}

/* ============================================================
   23. BREEDING LOG
   ============================================================ */
function loadBreeding() { return STORE.get('vba.breeding', []); }
function saveBreeding(arr) { STORE.set('vba.breeding', arr); }

function renderBreedingTable() {
  const body = $('#brTableBody');
  if (!body) return;
  const records = loadBreeding();
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="6" class="muted">এখনো কোনো রেকর্ড নেই।</td></tr>`;
    return;
  }
  body.innerHTML = records.slice().reverse().map(r => `
    <tr>
      <td>${escapeHtml(r.bed || '—')}</td>
      <td>${escapeHtml(r.count || '—')}</td>
      <td>${escapeHtml(fmtDate(r.date))}</td>
      <td>${escapeHtml(r.cocoon || '—')}</td>
      <td>${escapeHtml(r.baby || '—')}</td>
      <td>${escapeHtml(r.note || '—')}</td>
    </tr>
  `).join('');
}

function initBreeding() {
  const dateEl = $('#brDate');
  if (dateEl && !dateEl.value) dateEl.value = todayISO();

  const btn = $('#brSaveBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const rec = {
        bed: $('#brBed').value.trim(),
        count: $('#brCount').value.trim(),
        date: $('#brDate').value || todayISO(),
        cocoon: $('#brCocoon').value,
        baby: $('#brBaby').value,
        note: $('#brNote').value.trim()
      };
      if (!rec.bed) {
        alert('বেডের নাম দিন।');
        return;
      }
      const records = loadBreeding();
      records.push(rec);
      saveBreeding(records);
      renderBreedingTable();
      $('#brBed').value = '';
      $('#brCount').value = '';
      $('#brNote').value = '';
      $('#brCocoon').value = 'না';
      $('#brBaby').value = 'না';
    });
  }

  renderBreedingTable();
}

/* ============================================================
   24. FARM LOG (CRUD + CSV)
   ============================================================ */
let logEditingId = null;

function loadLog() { return STORE.get('vba.farmlog', []); }
function saveLog(records) { STORE.set('vba.farmlog', records); }

function renderLogTable() {
  const body = $('#logTableBody');
  if (!body) return;
  const records = loadLog();
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="12" class="muted">এখনো কোনো রেকর্ড নেই।</td></tr>`;
    return;
  }
  body.innerHTML = records.slice().reverse().map(r => `
    <tr>
      <td>${escapeHtml(fmtDate(r.date))}</td>
      <td>${escapeHtml(r.bed || '—')}</td>
      <td>${r.worm ? bn(r.worm) : '—'}</td>
      <td>${r.feed ? bn(r.feed) : '—'}</td>
      <td>${r.temp ? bn(r.temp) : '—'}</td>
      <td>${r.moist ? bn(r.moist) : '—'}</td>
      <td>${r.ph ? bn(r.ph) : '—'}</td>
      <td>${escapeHtml(r.obs || '—')}</td>
      <td>${escapeHtml(r.problem || '—')}</td>
      <td>${escapeHtml(r.action || '—')}</td>
      <td>${r.harvest ? bn(r.harvest) : '—'}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-small btn-ghost" data-edit="${r.id}" title="এডিট">✏️</button>
        <button class="btn btn-small btn-ghost" data-del="${r.id}" title="মুছুন">🗑</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('এই রেকর্ডটি মুছে ফেলবেন?')) return;
      saveLog(loadLog().filter(x => x.id !== btn.dataset.del));
      if (logEditingId === btn.dataset.del) {
        logEditingId = null;
        $('#logSaveBtn').textContent = 'রেকর্ড সংরক্ষণ করুন';
      }
      renderLogTable();
    });
  });

  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = loadLog().find(x => x.id === btn.dataset.edit);
      if (!rec) return;
      logEditingId = rec.id;
      $('#logDate').value   = rec.date || '';
      $('#logBed').value    = rec.bed || '';
      $('#logWorm').value   = rec.worm || '';
      $('#logFeed').value   = rec.feed || '';
      $('#logTemp').value   = rec.temp || '';
      $('#logMoist').value  = rec.moist || '';
      $('#logPh').value     = rec.ph || '';
      $('#logHarvest').value = rec.harvest || '';
      $('#logObs').value    = rec.obs || '';
      $('#logProblem').value = rec.problem || '';
      $('#logAction').value = rec.action || '';
      $('#logSaveBtn').textContent = 'আপডেট করুন';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function clearLogForm() {
  ['logBed','logWorm','logFeed','logTemp','logMoist','logPh','logHarvest','logObs','logProblem','logAction']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const d = $('#logDate');
  if (d) d.value = todayISO();
}

function initFarmLog() {
  const dateEl = $('#logDate');
  if (dateEl && !dateEl.value) dateEl.value = todayISO();

  const saveBtn = $('#logSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const rec = {
        id: logEditingId || uid(),
        date: $('#logDate').value || todayISO(),
        bed: $('#logBed').value.trim(),
        worm: $('#logWorm').value,
        feed: $('#logFeed').value,
        temp: $('#logTemp').value,
        moist: $('#logMoist').value,
        ph: $('#logPh').value,
        harvest: $('#logHarvest').value,
        obs: $('#logObs').value.trim(),
        problem: $('#logProblem').value.trim(),
        action: $('#logAction').value.trim()
      };
      if (!rec.bed) { alert('বেড নম্বর দিন।'); return; }
      const records = loadLog();
      if (logEditingId) {
        const idx = records.findIndex(x => x.id === logEditingId);
        if (idx >= 0) records[idx] = rec;
      } else {
        records.push(rec);
      }
      saveLog(records);
      logEditingId = null;
      saveBtn.textContent = 'রেকর্ড সংরক্ষণ করুন';
      renderLogTable();
      clearLogForm();
    });
  }

  const clearBtn = $('#logClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('সব ফার্ম লগ রেকর্ড মুছে ফেলতে চান?')) return;
      saveLog([]);
      renderLogTable();
    });
  }

  const exportBtn = $('#csvExport');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const records = loadLog();
      if (!records.length) { alert('এক্সপোর্ট করার মতো কোনো রেকর্ড নেই।'); return; }
      const headers = ['id','date','bed','worm','feed','temp','moist','ph','harvest','obs','problem','action'];
      const esc = v => {
        const s = String(v == null ? '' : v);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const rows = [headers.join(',')];
      records.forEach(r => rows.push(headers.map(h => esc(r[h])).join(',')));
      const csv = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vermi-farmlog-${todayISO()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  const importInput = $('#csvImport');
  if (importInput) {
    importInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const text = String(ev.target.result || '').replace(/^\uFEFF/, '');
          const rows = parseCSV(text);
          if (rows.length < 2) throw new Error('CSV ফাঁকা বা ভুল ফরম্যাট।');
          const headers = rows[0].map(h => h.trim().toLowerCase());
          const records = loadLog();
          let added = 0;
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => !c)) continue;
            const rec = { id: uid() };
            headers.forEach((h, j) => { rec[h] = row[j] != null ? row[j] : ''; });
            records.push(rec);
            added++;
          }
          saveLog(records);
          renderLogTable();
          alert(`${bn(added)} টি রেকর্ড ইমপোর্ট হয়েছে।`);
        } catch (err) {
          alert('CSV পড়তে সমস্যা হয়েছে: ' + err.message);
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
  }

  renderLogTable();
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch === '\r') { /* skip */ }
      else cur += ch;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/* ============================================================
   25. WIZARD
   ============================================================ */
function openWizard() {
  const modal = $('#wizardModal');
  if (modal) modal.hidden = false;
  const plan = $('#wizardPlan');
  if (plan) { plan.hidden = true; plan.innerHTML = ''; }
  
  // ফর্ম রিসেট করা
  const form = $('#wizardForm');
  if (form) form.reset();
}

function closeWizard() {
  const modal = $('#wizardModal');
  if (modal) modal.hidden = true;
}

function generatePlan(d) {
  const spaceLabel = { small: 'খুব কম জায়গা', medium: 'মাঝারি জায়গা', large: 'বেশ বড় জায়গা', xlarge: 'বড় জায়গা' }[d.space] || '';
  const placeLabel = { yard: 'বাড়ির আঙিনা', roof: 'ছাদ', shed: 'শেড', land: 'নিজের জমি' }[d.place] || '';
  const purposeLabel = { self: 'নিজের ব্যবহার', sell: 'বিক্রয়', both: 'নিজের ব্যবহার ও বিক্রয়' }[d.purpose] || '';

  const steps = [];
  const cautions = [];

  if (d.space === 'small') {
    steps.push('২–৩টি প্লাস্টিক ক্রেট দিয়ে শুরু করুন।');
    cautions.push('জায়গা কম — বেশি বেড একসাথে করবেন না।');
  } else if (d.space === 'medium') {
    steps.push('৪–৬টি বেড তৈরি করুন (ক্রেট বা ছোট ইট-বেড)।');
  } else {
    steps.push('৬–১০টি বেডের পরিকল্পনা করুন; ধাপে ধাপে বাড়ান।');
  }

  if (d.budget === 'low') {
    steps.push('শুরুতে পুরনো/সস্তা ক্রেট ও স্থানীয় উপকরণ ব্যবহার করুন।');
  } else if (d.budget === 'mid') {
    steps.push('টেকসই প্লাস্টিক বেড বা ছোট ইট-বেড বিবেচনা করুন।');
  } else {
    steps.push('টেকসই ইট-সিমেন্ট বেড ও ছাউনি তৈরি করতে পারেন।');
  }

  if (d.gobor === 'yes') {
    steps.push('নিজের গোবর থাকায় প্রাক-কম্পোস্টিং সহজ হবে — সঠিক তাপমাত্রা ও গন্ধ যাচাই করুন।');
  } else if (d.gobor === 'sometimes') {
    steps.push('গোবর মাঝে মাঝে — বিকল্প জৈব বর্জ্যও ব্যবহার করুন, তবে অল্প পরিমাণে পরীক্ষা করুন।');
    cautions.push('গোবরের ধারাবাহিকতা নিশ্চিত না হলে উৎপাদন পরিকল্পনা বাড়াবেন না।');
  } else {
    steps.push('গোবর সংগ্রহই প্রথম কাজ — স্থানীয় খামার, বাজার বা DAE অফিসে যোগাযোগ করুন।');
    cautions.push('গোবর ছাড়া শুরু করলে সবজির বর্জ্য দিয়ে শুরু করা যায়, তবে গন্ধ ও আর্দ্রতা নিয়ন্ত্রণ কঠিন।');
  }

  if (d.source === 'neighbor' || d.source === 'market') {
    steps.push('গোবর আনার আগে উৎসে রাসায়নিক/কীটনাশক নেই কি না নিশ্চিত করুন।');
  }

  if (d.place === 'roof') {
    steps.push('ছাদে হালকা ক্রেট ব্যবহার করুন, ওজন ছাদে ছড়িয়ে দিন।');
    cautions.push('ছাদে বাতাস ও ছায়া নিশ্চিত করুন; পানি জমতে দেবেন না।');
  } else if (d.place === 'shed') {
    steps.push('শেডে বাতাস চলাচল নিশ্চিত করুন, ছাউনি রাখুন।');
  } else if (d.place === 'yard') {
    steps.push('আঙিনায় ছায়াযুক্ত জায়গায় বেড রাখুন, বৃষ্টির পানি থেকে সুরক্ষা দিন।');
  }

  if (d.purpose === 'sell' || d.purpose === 'both') {
    steps.push('বিক্রয়ের আগে স্থানীয় বাজারমূল্য ও নিয়ম যাচাই করুন, ব্যাচ নম্বর ও লেবেল রাখুন।');
  }

  return `
    <h3>আপনার জন্য প্রাথমিক পরিকল্পনা</h3>
    <p><strong>জায়গা:</strong> ${escapeHtml(spaceLabel)} · <strong>স্থান:</strong> ${escapeHtml(placeLabel)} · <strong>উদ্দেশ্য:</strong> ${escapeHtml(purposeLabel)}</p>
    <h4>প্রথম ধাপ</h4>
    <ul>${steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    ${cautions.length ? `<h4>সতর্কতা</h4><ul>${cautions.map(c => `<li>⚠️ ${escapeHtml(c)}</li>`).join('')}</ul>` : ''}
    <h4>পরবর্তী কাজ</h4>
    <ol>
      <li>খামার ও বেড পরিকল্পনা</li>
      <li>গোবর প্রাক-কম্পোস্ট শুরু</li>
      <li>কেঁচো সংগ্রহের উৎস যাচাই</li>
      <li>প্রথম অল্প খাবার দিয়ে পরিচিতকরণ</li>
    </ol>
    <p class="muted">এই পরিকল্পনা আপনার উত্তরগুলোর ভিত্তিতে তৈরি — বাস্তব প্রস্তুতির ওপর ধাপগুলো নির্ভর করবে।</p>
    <button type="button" class="btn btn-primary" id="wizardStartLearningBtn">শেখা শুরু করুন →</button>
  `;
}

function initWizard() {
  const startBtn = $('#startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (STORE.get('vba.wizardDone', false)) {
        location.hash = '#/intro';
      } else {
        openWizard();
      }
    });
  }

  const closeBtn = $('#wizardClose');
  if (closeBtn) closeBtn.addEventListener('click', closeWizard);

  const skipBtn = $('#wizardSkip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      STORE.set('vba.wizardDone', true);
      closeWizard();
    });
  }

  const modal = $('#wizardModal');
  if (modal) {
    // মোডালের বাইরে ক্লিক করলে বন্ধ হবে
    modal.addEventListener('click', e => {
      if (e.target.id === 'wizardModal') closeWizard();
    });

    // ডাইনামিকালি তৈরি হওয়া "শেখা শুরু করুন" বাটনের ইভেন্ট লিসেনার
    modal.addEventListener('click', e => {
      if (e.target.id === 'wizardStartLearningBtn') {
        closeWizard();
        location.hash = '#/intro';
      }
    });
  }

  const form = $('#wizardForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      const plan = generatePlan(data);
      const planEl = $('#wizardPlan');
      if (planEl) {
        planEl.innerHTML = plan;
        planEl.hidden = false;
        planEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      STORE.set('vba.wizardDone', true);
      STORE.set('vba.wizardData', data);
    });
  }
}

/* ============================================================
   26. BINDINGS + INIT
   ============================================================ */
function bindGlobalEvents() {
  // Sidebar
  const menuBtn = $('#menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  const overlay = $('#sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Theme
  const themeBtn = $('#themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Print
  const printBtn = $('#printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  // Global search
  const search = $('#globalSearch');
  if (search) {
    search.addEventListener('input', debounce(e => performSearch(e.target.value), 150));
    search.addEventListener('focus', e => {
      if (e.target.value.trim()) performSearch(e.target.value);
    });
  }

  const results = $('#searchResults');
  if (results) {
    results.addEventListener('click', e => {
      if (e.target.closest('.sr-item')) {
        results.hidden = true;
        if (search) search.value = '';
      }
    });
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap') && results) results.hidden = true;
  });

  // Food filters
  const foodSearch = $('#foodSearch');
  const foodFilter = $('#foodFilter');
  if (foodSearch) {
    foodSearch.addEventListener('input', debounce(e => {
      renderFoods(foodFilter ? foodFilter.value : 'all', e.target.value);
    }, 150));
  }
  if (foodFilter) {
    foodFilter.addEventListener('change', () => {
      renderFoods(foodFilter.value, foodSearch ? foodSearch.value : '');
    });
  }

  // Problem search
  const probSearch = $('#probSearch');
  if (probSearch) {
    probSearch.addEventListener('input', debounce(e => renderProblems(e.target.value), 150));
  }

  // Glossary search
  const gSearch = $('#glossarySearch');
  if (gSearch) {
    gSearch.addEventListener('input', debounce(e => renderGlossary(e.target.value), 150));
  }

  // FAQ search
  const fSearch = $('#faqSearch');
  if (fSearch) {
    fSearch.addEventListener('input', debounce(e => renderFaq(e.target.value), 150));
  }

  // Hash routing
  window.addEventListener('hashchange', router);
}

function bootstrap() {
  // 1) Theme
  initTheme();

  // 2) Dynamic renders
  buildSearchIndex();
  injectLessonFooters();
  renderFoods('all', '');
  renderProblems('');
  renderGlossary('');
  renderFaq('');
  renderQuiz();
  renderLearningPath();

  // 3) Checkboxes & progress
  initCheckboxes();
  updateLessonStats();

  // 4) Calculators
  initBedPlanner();
  initFeedCalculator();
  initProductionPlanner();
  initBusinessCalculator();

  // 5) Logs & monitoring
  initEnv();
  initBreeding();
  initFarmLog();

  // 6) Wizard
  initWizard();

  // 7) Resume button
  updateResumeButton();

  // 8) Global bindings
  bindGlobalEvents();

  // 9) Initial route
  if (!location.hash) {
    location.hash = '#/dashboard';
  } else {
    router();
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
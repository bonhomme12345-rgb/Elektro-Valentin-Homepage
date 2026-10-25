import {
  doc, getDoc, collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp,
} from 'firebase/firestore/lite';
import { initFirebase } from './firebase.js';
import { textDefaults, multiKeys, DEFAULT_HOURS } from './content.js';
import * as R from './render.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function setupMenu() {
  const btn = $('#menu-btn');
  const nav = $('#nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.dataset.open !== 'true';
    nav.dataset.open = String(open);
    btn.setAttribute('aria-expanded', String(open));
  });
}

function fill(name, html) {
  $$(`[data-render="${name}"]`).forEach((el) => { el.innerHTML = html; });
}

function applyTexts(texts) {
  $$('[data-text]').forEach((el) => {
    const key = el.dataset.text;
    if (!(key in texts)) return;
    if (multiKeys.has(key)) el.innerHTML = R.renderRich(texts[key]);
    else el.textContent = texts[key];
  });
  $$('[data-tel]').forEach((el) => { el.href = R.telHref(texts[el.dataset.tel]); });
  $$('[data-mail]').forEach((el) => { el.href = texts[el.dataset.mail] ? 'mailto:' + texts[el.dataset.mail] : ''; });
  $$('[data-hide-empty]').forEach((el) => { el.hidden = !String(texts[el.dataset.hideEmpty] ?? '').trim(); });
}

function applyHours(hours) {
  fill('hours', R.renderHoursRows(hours));
  $$('[data-render="hours-note"]').forEach((el) => { el.textContent = hours.note || ''; });
  const today = hours.days?.[R.todayIndex()];
  $$('[data-today-hours]').forEach((el) => { el.textContent = today ? today.time : ''; });
}

async function loadImages(db) {
  const slots = $$('[data-image]');
  const keys = [...new Set(slots.map((el) => el.dataset.image))];
  await Promise.all(keys.map(async (key) => {
    const snap = await getDoc(doc(db, 'images', key)).catch(() => null);
    if (!snap?.exists()) return;
    const { url, data, alt } = snap.data();
    slots.filter((el) => el.dataset.image === key).forEach((el) => {
      const img = new Image();
      img.src = url || data;
      img.alt = alt || el.dataset.alt || '';
      img.loading = 'lazy';
      el.replaceChildren(img);
      el.classList.add('has-image');
    });
  }));
}

function setupContactForm() {
  const form = $('#contact-form');
  if (!form) return;
  const msg = $('#form-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // Feld ist unsichtbar, nur Spam-Programme füllen es aus
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    msg.hidden = false;
    msg.className = 'form-msg';
    msg.textContent = 'Wird gesendet …';
    try {
      const { db } = await initFirebase();
      await addDoc(collection(db, 'messages'), {
        name: data.name.trim(),
        contact: data.contact.trim(),
        message: data.message.trim(),
        createdAt: serverTimestamp(),
      });
      form.reset();
      msg.textContent = 'Danke, Ihre Anfrage ist angekommen. Wir melden uns bald bei Ihnen.';
      msg.classList.add('ok');
    } catch (err) {
      console.error(err);
      msg.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an.';
      msg.classList.add('error');
    } finally {
      button.disabled = false;
    }
  });
}

async function loadContent() {
  let db;
  try {
    ({ db } = await initFirebase());
  } catch (err) {
    console.warn('Inhalte aus der Datenbank nicht verfügbar, zeige Standardinhalte.', err);
    return;
  }
  const get = (path) => getDoc(doc(db, path)).then((s) => (s.exists() ? s.data() : null)).catch(() => null);
  const [texts, services, hours, refs] = await Promise.all([
    get('content/texts'), get('content/services'), get('content/hours'), get('content/references'),
  ]);
  if (texts) applyTexts({ ...textDefaults, ...texts });
  if (services?.items) {
    fill('service-checks', R.renderServiceChecks(services.items));
    fill('service-details', R.renderServiceDetails(services.items));
  }
  if (hours?.days) applyHours(hours);
  if (refs?.items) fill('references', R.renderReferences(refs.items));
  if ($('[data-render="news"]')) {
    const snap = await getDocs(query(collection(db, 'news'), orderBy('date', 'desc'), limit(5))).catch(() => null);
    if (snap) fill('news', R.renderNews(snap.docs.map((d) => d.data())));
  }
  await loadImages(db);
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

setupMenu();
applyHours(DEFAULT_HOURS);
setupContactForm();
loadContent();

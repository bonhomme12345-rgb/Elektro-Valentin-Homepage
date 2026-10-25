import {
  getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, deleteDoc, addDoc, collection, getDocs, query, orderBy,
} from 'firebase/firestore/lite';
import {
  getStorage, connectStorageEmulator, ref, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { initFirebase, isLocal } from './firebase.js';
import {
  GROUPS, TEXTS, textDefaults, DEFAULT_SERVICES, DEFAULT_HOURS, DEFAULT_REFERENCES, IMAGE_SLOTS,
} from './content.js';
import { formatDate } from './render.js';
import { resizeImage } from './images.js';

const $ = (sel, root = document) => root.querySelector(sel);
let db;
let storage;

// Kleiner Helfer, um Elemente ohne innerHTML zu bauen.
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

let toastTimer;
function toast(text, kind = 'ok') {
  const el = $('#toast');
  el.textContent = text;
  el.className = 'toast ' + kind;
  el.hidden = false;
  clearTimeout(toastTimer);
  // Fehler bleiben länger stehen, damit man sie lesen kann; Klick schließt.
  toastTimer = setTimeout(() => { el.hidden = true; }, kind === 'error' ? 20000 : 4000);
}

function errorText(err) {
  const known = {
    'permission-denied': 'Keine Berechtigung.',
    'storage/unauthorized': 'Keine Berechtigung zum Hochladen von Fotos.',
    'storage/unauthenticated': 'Bitte neu anmelden.',
    'storage/bucket-not-found': 'Der Fotospeicher wurde nicht gefunden.',
    'storage/no-default-bucket': 'Der Fotospeicher wurde nicht gefunden.',
    'storage/quota-exceeded': 'Der Fotospeicher ist voll.',
    'storage/retry-limit-exceeded': 'Die Verbindung ist zu langsam, bitte noch einmal versuchen.',
  };
  return (known[err.code] || err.message) + (err.code ? ` (${err.code})` : '');
}

async function run(button, label, fn) {
  const old = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    await fn();
  } catch (err) {
    console.error(err);
    toast('Das hat nicht geklappt: ' + errorText(err), 'error');
  } finally {
    button.disabled = false;
    button.textContent = old;
  }
}

const getData = async (path, fallback) => {
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? snap.data() : fallback;
};

const slugify = (s) => s.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eintrag';

function uniqueId(title, items) {
  const base = slugify(title);
  let id = base;
  for (let n = 2; items.some((i) => i.id === id); n++) id = `${base}-${n}`;
  return id;
}

/* ---------- Bilder ---------- */

// Fotos liegen in Firebase Storage unter images/, die Datenbank merkt sich
// zu jedem Bildplatz die Adresse. Ältere Einträge haben das Bild noch direkt
// im Feld "data" gespeichert.
async function uploadImage(key, file, alt) {
  const blob = await resizeImage(file);
  const path = `images/${key}-${Date.now()}.jpg`;
  await uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
  const url = await getDownloadURL(ref(storage, path));
  const old = await getDoc(doc(db, 'images', key));
  await setDoc(doc(db, 'images', key), { url, path, alt, updatedAt: new Date().toISOString() });
  if (old.exists() && old.data().path) await deleteObject(ref(storage, old.data().path)).catch(() => {});
  return url;
}

async function removeImage(key) {
  const snap = await getDoc(doc(db, 'images', key));
  if (!snap.exists()) return;
  if (snap.data().path) await deleteObject(ref(storage, snap.data().path)).catch(() => {});
  await deleteDoc(doc(db, 'images', key));
}

function imageControl(key, label, { disabledText } = {}) {
  const preview = h('div', { class: 'img-preview' }, 'Kein Foto');
  const alt = h('input', { id: `alt-${key}`, placeholder: 'Kurze Bildbeschreibung, z. B. „Neuer Zählerschrank“' });
  const file = h('input', { id: `file-${key}`, type: 'file', accept: 'image/*' });
  const remove = h('button', { type: 'button', class: 'btn small ghost' }, 'Foto entfernen');
  const status = h('span', { class: 'muted small-text' });
  const box = h('div', { class: 'img-control' }, preview, h('div', { class: 'img-fields' },
    h('strong', {}, label),
    disabledText ? h('p', { class: 'muted small-text' }, disabledText) : [
      h('label', { class: 'field', for: `file-${key}` }, 'Foto auswählen', file),
      h('label', { class: 'field', for: `alt-${key}` }, 'Bildbeschreibung', alt),
      h('div', { class: 'row-actions' }, remove, status),
    ]));
  if (disabledText) return box;

  const show = (data) => {
    preview.replaceChildren(data ? h('img', { src: data, alt: '' }) : 'Kein Foto');
    remove.hidden = !data;
  };
  getDoc(doc(db, 'images', key)).then((snap) => {
    if (snap.exists()) { show(snap.data().url || snap.data().data); alt.value = snap.data().alt || ''; } else show(null);
  });
  file.addEventListener('change', async () => {
    if (!file.files[0]) return;
    status.textContent = 'Foto wird verkleinert und hochgeladen …';
    try {
      show(await uploadImage(key, file.files[0], alt.value.trim()));
      toast('Foto gespeichert.');
    } catch (err) {
      console.error(err);
      toast('Foto nicht gespeichert: ' + errorText(err), 'error');
    } finally {
      status.textContent = '';
      file.value = '';
    }
  });
  alt.addEventListener('change', async () => {
    const snap = await getDoc(doc(db, 'images', key));
    if (snap.exists()) {
      await setDoc(doc(db, 'images', key), { ...snap.data(), alt: alt.value.trim() });
      toast('Bildbeschreibung gespeichert.');
    }
  });
  remove.addEventListener('click', () => run(remove, 'Wird entfernt …', async () => {
    if (!confirm('Dieses Foto wirklich entfernen?')) return;
    await removeImage(key);
    show(null);
    toast('Foto entfernt.');
  }));
  return box;
}

/* ---------- Seitentexte ---------- */

async function textsPanel(panel) {
  const saved = await getData('content/texts', {});
  const inputs = {};
  const groups = GROUPS.map((g, i) => {
    const fields = TEXTS.filter((t) => t.group === g.id).map((t) => {
      const id = 'txt-' + t.key.replace(/\./g, '-');
      const value = saved[t.key] ?? t.default;
      const input = t.multi
        ? h('textarea', { id, rows: Math.min(18, Math.max(4, value.split('\n').length + 1)), value })
        : h('input', { id, value });
      inputs[t.key] = input;
      return h('label', { class: 'field', for: id }, t.label, input);
    });
    return h('details', { class: 'group', open: i === 1 }, h('summary', {}, g.label), ...fields);
  });
  const save = h('button', { type: 'button', class: 'btn primary' }, 'Texte speichern');
  save.addEventListener('click', () => run(save, 'Wird gespeichert …', async () => {
    const changed = {};
    for (const [key, input] of Object.entries(inputs)) {
      const v = input.value.replace(/\r\n/g, '\n');
      if (v !== textDefaults[key]) changed[key] = v;
    }
    await setDoc(doc(db, 'content', 'texts'), changed);
    toast('Texte gespeichert. Die Seite zeigt sie ab sofort.');
  }));
  panel.replaceChildren(
    h('h2', {}, 'Seitentexte'),
    h('p', { class: 'hint' }, 'In mehrzeiligen Feldern beginnt nach einer Leerzeile ein neuer Absatz. "## " am Zeilenanfang macht eine Zwischenüberschrift, "- " einen Aufzählungspunkt.'),
    ...groups,
    h('div', { class: 'save-bar' }, save),
  );
}

/* ---------- Listen (Leistungen, Referenzen) ---------- */

function listPanel(panel, { title, path, defaults, imagePrefix, fields, addLabel, hint }) {
  let items;
  const list = h('div', { class: 'cards' });

  const render = () => {
    list.replaceChildren(...items.map((item, idx) => {
      const inputs = fields.map((f) => {
        const id = `${imagePrefix}-${idx}-${f.key}`;
        const value = f.toInput ? f.toInput(item[f.key]) : (item[f.key] ?? '');
        const input = f.multi ? h('textarea', { id, rows: f.rows || 3, value }) : h('input', { id, value });
        input.addEventListener('input', () => { item[f.key] = f.fromInput ? f.fromInput(input.value) : input.value; });
        return h('label', { class: 'field', for: id }, f.label, input);
      });
      const up = h('button', { type: 'button', class: 'btn small ghost', disabled: idx === 0, 'aria-label': 'Nach oben' }, '↑');
      const down = h('button', { type: 'button', class: 'btn small ghost', disabled: idx === items.length - 1, 'aria-label': 'Nach unten' }, '↓');
      const del = h('button', { type: 'button', class: 'btn small danger' }, 'Löschen');
      up.addEventListener('click', () => { [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]; render(); });
      down.addEventListener('click', () => { [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]]; render(); });
      del.addEventListener('click', () => {
        if (!confirm(`„${item.title || 'Eintrag'}“ löschen? Das wird erst mit „Speichern“ wirksam.`)) return;
        items.splice(idx, 1);
        render();
      });
      return h('div', { class: 'card' },
        h('div', { class: 'card-head' }, h('strong', {}, item.title || 'Neuer Eintrag'), h('div', { class: 'row-actions' }, up, down, del)),
        ...inputs,
        imageControl(`${imagePrefix}-${item.id}`, 'Foto', item.id ? {} : { disabledText: 'Erst speichern, dann kannst du ein Foto hinzufügen.' }));
    }));
    if (!items.length) list.append(h('p', { class: 'muted' }, 'Noch keine Einträge.'));
  };

  const add = h('button', { type: 'button', class: 'btn' }, addLabel);
  add.addEventListener('click', () => {
    items.push(Object.fromEntries(fields.map((f) => [f.key, f.toInput ? [] : ''])));
    render();
    list.lastElementChild?.querySelector('input')?.focus();
  });
  const save = h('button', { type: 'button', class: 'btn primary' }, 'Speichern');
  save.addEventListener('click', () => run(save, 'Wird gespeichert …', async () => {
    const before = (await getData(path, { items: defaults })).items;
    items = items.filter((i) => i.title.trim());
    for (const item of items) if (!item.id) item.id = uniqueId(item.title, items);
    await setDoc(doc(db, ...path.split('/')), { items });
    // Fotos gelöschter Einträge mit entfernen
    const ids = new Set(items.map((i) => i.id));
    await Promise.all(before.filter((i) => !ids.has(i.id)).map((i) => removeImage(`${imagePrefix}-${i.id}`)));
    render();
    toast('Gespeichert. Die Seite zeigt die Änderung ab sofort.');
  }));

  return (async () => {
    items = structuredClone((await getData(path, { items: defaults })).items);
    render();
    panel.replaceChildren(h('h2', {}, title), hint ? h('p', { class: 'hint' }, hint) : '', list,
      h('div', { class: 'save-bar' }, add, save));
  })();
}

const servicesPanel = (panel) => listPanel(panel, {
  title: 'Leistungen',
  path: 'content/services',
  defaults: DEFAULT_SERVICES,
  imagePrefix: 'leistung',
  addLabel: 'Leistung hinzufügen',
  hint: 'Die Reihenfolge hier gilt für die Startseite und die Seite „Leistungen“.',
  fields: [
    { key: 'title', label: 'Name der Leistung' },
    { key: 'text', label: 'Beschreibung', multi: true, rows: 3 },
    {
      key: 'bullets', label: 'Stichpunkte (einer pro Zeile)', multi: true, rows: 3,
      toInput: (v) => (v || []).join('\n'), fromInput: (v) => v.split('\n').map((s) => s.trim()).filter(Boolean),
    },
  ],
});

const referencesPanel = (panel) => listPanel(panel, {
  title: 'Referenzen',
  path: 'content/references',
  defaults: DEFAULT_REFERENCES,
  imagePrefix: 'referenz',
  addLabel: 'Referenz hinzufügen',
  hint: 'Jede Referenz bekommt einen Titel, eine kurze Beschreibung und ein Foto.',
  fields: [
    { key: 'title', label: 'Titel, z. B. „Sanierung Einfamilienhaus“' },
    { key: 'caption', label: 'Kurze Beschreibung, z. B. „Neue Elektroinstallation, Wettenberg“' },
  ],
});

/* ---------- Öffnungszeiten ---------- */

async function hoursPanel(panel) {
  const hours = structuredClone(await getData('content/hours', DEFAULT_HOURS));
  const rows = hours.days.map((d, i) => {
    const input = h('input', { id: `hours-${i}`, value: d.time });
    input.addEventListener('input', () => { d.time = input.value; });
    return h('label', { class: 'hours-row', for: `hours-${i}` }, h('strong', {}, d.day), input);
  });
  const note = h('input', { id: 'hours-note', value: hours.note || '' });
  const save = h('button', { type: 'button', class: 'btn primary' }, 'Öffnungszeiten speichern');
  save.addEventListener('click', () => run(save, 'Wird gespeichert …', async () => {
    hours.note = note.value.trim();
    await setDoc(doc(db, 'content', 'hours'), hours);
    toast('Öffnungszeiten gespeichert.');
  }));
  panel.replaceChildren(
    h('h2', {}, 'Öffnungszeiten'),
    h('p', { class: 'hint' }, 'Zum Beispiel „7:30 – 16:30“ oder „geschlossen“. Die Startseite zeigt automatisch die Zeit für den heutigen Tag.'),
    h('div', { class: 'hours-grid' }, ...rows),
    h('label', { class: 'field', for: 'hours-note' }, 'Hinweis unter den Zeiten', note),
    h('div', { class: 'save-bar' }, save),
  );
}

/* ---------- Neuigkeiten ---------- */

async function newsPanel(panel) {
  const today = new Date().toISOString().slice(0, 10);
  let editingId = null;
  const title = h('input', { id: 'news-title' });
  const date = h('input', { id: 'news-date', type: 'date', value: today });
  const body = h('textarea', { id: 'news-body', rows: 5 });
  const save = h('button', { type: 'button', class: 'btn primary' }, 'Veröffentlichen');
  const cancel = h('button', { type: 'button', class: 'btn ghost', hidden: true }, 'Abbrechen');
  const formTitle = h('h3', {}, 'Neue Meldung');
  const list = h('div', { class: 'cards' });

  const reset = () => {
    editingId = null;
    title.value = ''; body.value = ''; date.value = today;
    formTitle.textContent = 'Neue Meldung';
    save.textContent = 'Veröffentlichen';
    cancel.hidden = true;
  };
  cancel.addEventListener('click', reset);

  const load = async () => {
    const snap = await getDocs(query(collection(db, 'news'), orderBy('date', 'desc')));
    list.replaceChildren(...snap.docs.map((d) => {
      const n = d.data();
      const edit = h('button', { type: 'button', class: 'btn small ghost' }, 'Bearbeiten');
      const del = h('button', { type: 'button', class: 'btn small danger' }, 'Löschen');
      edit.addEventListener('click', () => {
        editingId = d.id;
        title.value = n.title; date.value = n.date; body.value = n.body;
        formTitle.textContent = 'Meldung bearbeiten';
        save.textContent = 'Änderung speichern';
        cancel.hidden = false;
        title.focus();
      });
      del.addEventListener('click', () => run(del, 'Wird gelöscht …', async () => {
        if (!confirm(`„${n.title}“ löschen?`)) return;
        await deleteDoc(doc(db, 'news', d.id));
        if (editingId === d.id) reset();
        await load();
        toast('Meldung gelöscht.');
      }));
      return h('div', { class: 'item' },
        h('div', {}, h('strong', {}, n.title), h('div', { class: 'muted small-text' }, formatDate(n.date))),
        h('div', { class: 'row-actions' }, edit, del));
    }));
    if (snap.empty) list.append(h('p', { class: 'muted' }, 'Noch keine Meldungen. Die Startseite zeigt dann „Aktuell gibt es keine Neuigkeiten“.'));
  };

  save.addEventListener('click', () => run(save, 'Wird gespeichert …', async () => {
    if (!title.value.trim() || !date.value) { toast('Bitte Überschrift und Datum ausfüllen.', 'error'); return; }
    const data = { title: title.value.trim(), date: date.value, body: body.value.trim() };
    if (editingId) await setDoc(doc(db, 'news', editingId), data);
    else await addDoc(collection(db, 'news'), data);
    toast(editingId ? 'Meldung geändert.' : 'Meldung veröffentlicht.');
    reset();
    await load();
  }));

  await load();
  panel.replaceChildren(
    h('h2', {}, 'Neuigkeiten'),
    h('p', { class: 'hint' }, 'Die Startseite zeigt die fünf neuesten Meldungen.'),
    h('div', { class: 'card' }, formTitle,
      h('label', { class: 'field', for: 'news-title' }, 'Überschrift', title),
      h('label', { class: 'field', for: 'news-date' }, 'Datum', date),
      h('label', { class: 'field', for: 'news-body' }, 'Text', body),
      h('div', { class: 'row-actions' }, save, cancel)),
    h('h3', {}, 'Veröffentlichte Meldungen'),
    list,
  );
}

/* ---------- Bilder ---------- */

async function imagesPanel(panel) {
  panel.replaceChildren(
    h('h2', {}, 'Bilder'),
    h('p', { class: 'hint' }, 'Fotos werden beim Hochladen automatisch auf eine passende Größe gebracht. Fotos für einzelne Leistungen und Referenzen fügst du in diesen Bereichen hinzu. Ohne Foto zeigt die Seite den gelben Blitz auf Blau.'),
    ...IMAGE_SLOTS.map((s) => h('div', { class: 'card' }, imageControl(s.key, s.label))),
  );
}

/* ---------- Anfragen ---------- */

async function messagesPanel(panel) {
  const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')));
  updateBadge(snap.size);
  const items = snap.docs.map((d) => {
    const m = d.data();
    const when = m.createdAt?.toDate?.().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) || '';
    const del = h('button', { type: 'button', class: 'btn small ghost' }, 'Erledigt, löschen');
    del.addEventListener('click', () => run(del, 'Wird gelöscht …', async () => {
      if (!confirm('Diese Anfrage löschen?')) return;
      await deleteDoc(doc(db, 'messages', d.id));
      await messagesPanel(panel);
      toast('Anfrage gelöscht.');
    }));
    return h('div', { class: 'card message' },
      h('div', { class: 'card-head' }, h('strong', {}, m.name), h('span', { class: 'muted small-text' }, when)),
      h('div', { class: 'msg-contact' }, m.contact),
      h('p', { class: 'msg-body' }, m.message),
      h('div', { class: 'row-actions' }, del));
  });
  panel.replaceChildren(
    h('h2', {}, 'Anfragen'),
    h('p', { class: 'hint' }, 'Hier landen die Nachrichten aus dem Kontaktformular. Lösche eine Anfrage, sobald sie erledigt ist.'),
    ...(items.length ? items : [h('p', { class: 'muted' }, 'Keine offenen Anfragen.')]),
  );
}

function updateBadge(count) {
  const badge = $('#badge-messages');
  badge.textContent = count;
  badge.hidden = !count;
}

/* ---------- Grundgerüst ---------- */

const PANELS = {
  texte: textsPanel,
  leistungen: servicesPanel,
  zeiten: hoursPanel,
  neuigkeiten: newsPanel,
  referenzen: referencesPanel,
  bilder: imagesPanel,
  anfragen: messagesPanel,
};

async function openPanel(name) {
  document.querySelectorAll('.admin-nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.panel === name)));
  const panel = $('#panel');
  panel.replaceChildren(h('p', { class: 'muted' }, 'Wird geladen …'));
  try {
    await PANELS[name](panel);
  } catch (err) {
    console.error(err);
    panel.replaceChildren(h('p', { class: 'error' }, 'Dieser Bereich konnte nicht geladen werden: ' + err.message));
  }
}

function showScreen(id) {
  for (const s of ['screen-loading', 'screen-login', 'screen-denied', 'screen-app']) $('#' + s).hidden = s !== id;
}

async function start() {
  ({ db } = await initFirebase());
  const { app } = await initFirebase();
  const auth = getAuth(app);
  // Neue Firebase-Projekte heißen <projekt>.firebasestorage.app; falls die
  // Konfiguration den Speicher (noch) nicht nennt, wird dieser Name genommen.
  const bucket = app.options.storageBucket || `${app.options.projectId}.firebasestorage.app`;
  storage = getStorage(app, `gs://${bucket}`);
  if (isLocal) connectStorageEmulator(storage, location.hostname, 9199);
  if (isLocal) {
    connectAuthEmulator(auth, `http://${location.hostname}:9099`, { disableWarnings: true });
    // Nur für automatische Tests im Emulator: Anmeldung ohne Google-Fenster
    window.emulatorSignIn = (email) => signInWithCredential(auth, GoogleAuthProvider.credential(
      JSON.stringify({ sub: email, email, email_verified: true })));
  }

  $('#login').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') toast('Anmeldung fehlgeschlagen: ' + err.message, 'error');
    }
  });
  $('#toast').addEventListener('click', () => { $('#toast').hidden = true; });
  document.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', () => signOut(auth)));
  document.querySelectorAll('.admin-nav button').forEach((b) => b.addEventListener('click', () => openPanel(b.dataset.panel)));

  onAuthStateChanged(auth, async (user) => {
    if (!user) { showScreen('screen-login'); return; }
    const email = (user.email || '').toLowerCase();
    let allowed = false;
    try {
      allowed = (await getDoc(doc(db, 'admins', email))).exists();
    } catch (err) {
      console.error(err);
    }
    if (!allowed) {
      $('#denied-email').textContent = email;
      showScreen('screen-denied');
      return;
    }
    $('#user-email').textContent = email;
    showScreen('screen-app');
    openPanel('texte');
    getDocs(collection(db, 'messages')).then((s) => updateBadge(s.size)).catch(() => {});
  });
}

start().catch((err) => {
  console.error(err);
  $('#screen-loading').textContent = 'Das Adminmenü konnte nicht starten: ' + err.message;
});

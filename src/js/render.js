// Reine Funktionen, die HTML erzeugen. Sie laufen beim Bauen in Node
// und im Browser, damit beide Wege dasselbe Ergebnis liefern.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

// Mehrzeiliger Text: Leerzeile = Absatz, "## " = Zwischenüberschrift, "- " = Liste.
export function renderRich(text) {
  const blocks = String(text ?? '').replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    let lines = block.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim() !== '');
    while (lines.length) {
      if (lines[0].startsWith('## ')) {
        out.push(`<h3>${esc(lines[0].slice(3).trim())}</h3>`);
        lines = lines.slice(1);
        continue;
      }
      if (lines[0].startsWith('- ')) {
        const items = [];
        while (lines.length && lines[0].startsWith('- ')) items.push(lines.shift().slice(2).trim());
        out.push(`<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
        continue;
      }
      const para = [];
      while (lines.length && !lines[0].startsWith('## ') && !lines[0].startsWith('- ')) para.push(lines.shift());
      out.push(`<p>${para.map(esc).join('<br>')}</p>`);
    }
  }
  return out.join('\n');
}

export function telHref(number) {
  const digits = String(number ?? '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  return 'tel:' + (digits.startsWith('0') && !digits.startsWith('00') ? '+49' + digits.slice(1) : digits);
}

const TICK = '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13 L9 19 L21 5"/></svg>';

export function renderServiceChecks(items) {
  return items
    .map((s) => `<li><a href="/leistungen#${esc(s.id)}">${TICK}<span>${esc(s.title)}</span></a></li>`)
    .join('\n');
}

export function renderServiceDetails(items) {
  return items
    .map((s) => {
      const bullets = (s.bullets || []).filter(Boolean);
      return `<article class="service" id="${esc(s.id)}">
  <div class="photo" data-image="leistung-${esc(s.id)}" data-alt="${esc(s.title)}"></div>
  <div class="service-body">
    <h2>${esc(s.title)}</h2>
    ${renderRich(s.text)}
    ${bullets.length ? `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  </div>
</article>`;
    })
    .join('\n');
}

export function renderHoursRows(hours) {
  return (hours.days || [])
    .map((d) => `<tr><td>${esc(d.day)}</td><td>${esc(d.time)}</td></tr>`)
    .join('\n');
}

// Montag = 0 … Sonntag = 6, passend zur Reihenfolge in den Öffnungszeiten.
export function todayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

export function renderReferences(items) {
  if (!items.length) {
    return '<p class="empty-note">Hier zeigen wir bald ausgewählte Projekte.</p>';
  }
  return items
    .map((r) => `<figure class="ref">
  <div class="photo" data-image="referenz-${esc(r.id)}" data-alt="${esc(r.title)}"></div>
  <figcaption><strong>${esc(r.title)}</strong>${esc(r.caption)}</figcaption>
</figure>`)
    .join('\n');
}

export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

export function renderNews(items) {
  if (!items.length) return '<p class="empty-note">Aktuell gibt es keine Neuigkeiten.</p>';
  return items
    .map((n) => `<article>
  <time datetime="${esc(n.date)}">${esc(formatDate(n.date))}</time>
  <h3>${esc(n.title)}</h3>
  ${renderRich(n.body)}
</article>`)
    .join('\n');
}

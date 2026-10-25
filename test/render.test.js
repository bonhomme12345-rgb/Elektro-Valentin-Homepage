import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRich, esc, telHref, formatDate, todayIndex, renderNews } from '../src/js/render.js';

test('renderRich baut Absätze, Überschriften und Listen', () => {
  assert.equal(renderRich('Hallo\nWelt\n\n## Titel\n- eins\n- zwei'),
    '<p>Hallo<br>Welt</p>\n<h3>Titel</h3>\n<ul><li>eins</li><li>zwei</li></ul>');
});

test('Texte aus dem Adminmenü werden nicht als HTML ausgeführt', () => {
  assert.equal(esc('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  assert.equal(renderRich('<b>fett</b>'), '<p>&lt;b&gt;fett&lt;/b&gt;</p>');
});

test('Telefonnummern werden zu internationalen Links', () => {
  assert.equal(telHref('06 41 / 8 31 35'), 'tel:+4964183135');
  assert.equal(telHref(''), '');
});

test('Datum und Wochentag', () => {
  assert.equal(formatDate('2026-12-24'), '24.12.2026');
  assert.equal(todayIndex(new Date('2026-10-26T12:00:00')), 0); // Montag
  assert.equal(todayIndex(new Date('2026-10-25T12:00:00')), 6); // Sonntag
});

test('Leere Neuigkeiten zeigen einen Hinweis', () => {
  assert.match(renderNews([]), /keine Neuigkeiten/);
});

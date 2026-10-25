// Standardinhalte der Seite. Alles hier kann im Adminmenü überschrieben werden.
// Die Build-Datei füllt diese Texte schon beim Bauen in die Seiten ein,
// damit die Seite auch ohne Datenbank vollständig ist.

export const GROUPS = [
  { id: 'kontakt', label: 'Kontaktdaten (überall auf der Seite)' },
  { id: 'start', label: 'Startseite' },
  { id: 'leistungen', label: 'Leistungen' },
  { id: 'ueber-uns', label: 'Über uns' },
  { id: 'referenzen', label: 'Referenzen' },
  { id: 'kontaktseite', label: 'Kontaktseite' },
  { id: 'impressum', label: 'Impressum' },
  { id: 'datenschutz', label: 'Datenschutz' },
];

// multi: true heißt mehrzeiliger Text. Leerzeile = neuer Absatz,
// "## " am Zeilenanfang = Zwischenüberschrift, "- " = Aufzählungspunkt.
export const TEXTS = [
  { key: 'kontakt.strasse', group: 'kontakt', label: 'Straße', default: 'Burgstraße 22' },
  { key: 'kontakt.ort', group: 'kontakt', label: 'PLZ und Ort', default: '35435 Wettenberg' },
  { key: 'kontakt.telefon', group: 'kontakt', label: 'Telefon', default: '06 41 / 8 31 35' },
  { key: 'kontakt.fax', group: 'kontakt', label: 'Telefax', default: '06 41 / 8 58 51' },
  { key: 'kontakt.mobil', group: 'kontakt', label: 'Mobil', default: '01 70 / 3 52 42 10' },
  { key: 'kontakt.email', group: 'kontakt', label: 'E-Mail (leer lassen, um sie auszublenden)', default: '' },

  { key: 'start.eyebrow', group: 'start', label: 'Kleine Zeile über der Überschrift', default: 'Ihr Elektriker in Wettenberg' },
  { key: 'start.titel', group: 'start', label: 'Große Überschrift', default: 'Strom, Telefon und Sat-Empfang aus einer Hand.' },
  {
    key: 'start.text', group: 'start', label: 'Einleitungstext', multi: true,
    default: 'Elektroinstallationen, E-Check, Telefonanlagen, Blitzschutz, Sat-Anlagen und Netzwerk für Privathaushalte und Betriebe in Wettenberg, Gießen und Umgebung.',
  },

  { key: 'leistungen.titel', group: 'leistungen', label: 'Überschrift', default: 'Was wir für Sie tun' },
  {
    key: 'leistungen.text', group: 'leistungen', label: 'Einleitungstext', multi: true,
    default: 'Vom einzelnen Steckdosenkreis bis zur kompletten Installation im Neubau: Wir planen, installieren und prüfen fachgerecht und sauber.',
  },

  { key: 'ueber.titel', group: 'ueber-uns', label: 'Überschrift', default: 'Ein Fachbetrieb aus Wettenberg' },
  {
    key: 'ueber.text', group: 'ueber-uns', label: 'Text über den Betrieb', multi: true,
    default: 'Elektro Valentin ist Ihr Ansprechpartner für Elektrotechnik in Wettenberg und Umgebung.\n\nHier stehen später die Geschichte des Betriebs, das Team und das Einsatzgebiet. Diesen Text änderst du im Adminmenü unter „Seitentexte“.',
  },

  { key: 'referenzen.titel', group: 'referenzen', label: 'Überschrift', default: 'Ausgewählte Projekte' },
  {
    key: 'referenzen.text', group: 'referenzen', label: 'Einleitungstext', multi: true,
    default: 'Ein kleiner Einblick in Arbeiten, die wir für unsere Kunden umgesetzt haben.',
  },

  { key: 'kontaktseite.titel', group: 'kontaktseite', label: 'Überschrift', default: 'So erreichen Sie uns' },
  {
    key: 'kontaktseite.text', group: 'kontaktseite', label: 'Text über dem Formular', multi: true,
    default: 'Rufen Sie uns an oder schreiben Sie uns über das Formular. Wir melden uns so schnell wie möglich zurück.',
  },

  {
    key: 'impressum.text', group: 'impressum', label: 'Impressum (ohne Adresse, die kommt aus den Kontaktdaten)', multi: true,
    default: [
      '## Angaben gemäß § 5 DDG',
      'Inhaber: [Name des Inhabers bitte ergänzen]',
      '',
      '## Berufsrechtliche Angaben',
      'Berufsbezeichnung: [z. B. Elektrotechnikermeister], verliehen in der Bundesrepublik Deutschland',
      'Zuständige Kammer: [z. B. Handwerkskammer Wiesbaden, bitte prüfen]',
      'Eintragung in die Handwerksrolle: [Nummer bitte ergänzen]',
      '',
      '## Umsatzsteuer',
      'Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [bitte ergänzen]',
      '',
      '## Verbraucherstreitbeilegung',
      'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    ].join('\n'),
  },
  {
    key: 'datenschutz.text', group: 'datenschutz', label: 'Datenschutzerklärung (Verantwortlicher kommt aus den Kontaktdaten)', multi: true,
    default: [
      '## Allgemeines',
      'Wir freuen uns über Ihren Besuch. Der Schutz Ihrer Daten ist uns wichtig. Diese Seite verwendet keine Werbe- oder Statistikdienste und setzt keine Cookies zu Tracking-Zwecken. Die Schriften werden von unserem eigenen Server geladen.',
      '',
      '## Hosting',
      'Diese Website wird bei Google Firebase gehostet. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Beim Aufruf der Seite verarbeitet der Anbieter technisch notwendige Daten wie Ihre IP-Adresse, Datum und Uhrzeit des Abrufs und den verwendeten Browser, um die Seite auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Eine Übermittlung in die USA ist nicht ausgeschlossen; Google ist nach dem EU-US Data Privacy Framework zertifiziert.',
      '',
      '## Kontaktformular',
      'Wenn Sie uns über das Kontaktformular schreiben, speichern wir Ihren Namen, Ihre Kontaktangabe und Ihre Nachricht in einer Datenbank von Google Firebase (Cloud Firestore), um Ihre Anfrage zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Wir löschen die Angaben, sobald Ihre Anfrage erledigt ist und keine gesetzlichen Aufbewahrungspflichten bestehen.',
      '',
      '## Kontakt per Telefon oder E-Mail',
      'Wenn Sie uns anrufen oder schreiben, verarbeiten wir Ihre Angaben nur zur Bearbeitung Ihres Anliegens.',
      '',
      '## Ihre Rechte',
      'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten sowie das Recht auf Datenübertragbarkeit und Widerspruch. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim Hessischen Beauftragten für Datenschutz und Informationsfreiheit.',
      '',
      '[Diese Vorlage bitte rechtlich prüfen lassen.]',
    ].join('\n'),
  },
];

export const DEFAULT_SERVICES = [
  {
    id: 'elektroinstallationen', title: 'Elektroinstallationen',
    text: 'Neubau, Altbausanierung und Erweiterungen: von der Steckdose bis zur kompletten Unterverteilung.',
    bullets: ['Neu- und Umbau', 'Zählerschrank und Unterverteilung', 'Beleuchtung innen und außen'],
  },
  {
    id: 'e-check', title: 'E-Check',
    text: 'Die regelmäßige Prüfung Ihrer elektrischen Anlage und Geräte, mit Prüfprotokoll für Versicherung und Vermieter.',
    bullets: ['Prüfung von Anlagen und ortsveränderlichen Geräten', 'Prüfprotokoll und Prüfplakette'],
  },
  {
    id: 'telefonanlagen', title: 'Telefonanlagen',
    text: 'Planung, Einrichtung und Wartung von Telefonanlagen für Büro und Zuhause.',
    bullets: [],
  },
  {
    id: 'blitzschutz', title: 'Blitzschutz',
    text: 'Äußerer und innerer Blitzschutz sowie Überspannungsschutz für Wohnhäuser und Gewerbe.',
    bullets: [],
  },
  {
    id: 'sat-anlagen', title: 'Sat-Anlagen',
    text: 'Montage, Ausrichtung und Umrüstung von Satellitenanlagen, auch für mehrere Teilnehmer.',
    bullets: [],
  },
  {
    id: 'netzwerk', title: 'Netzwerk',
    text: 'Netzwerkverkabelung, Netzwerkschränke und WLAN für Wohnhaus, Büro und Werkstatt.',
    bullets: ['Datenleitungen und Netzwerkdosen', 'Netzwerkschrank und Patchfeld', 'WLAN-Ausleuchtung im ganzen Haus'],
  },
];

export const DEFAULT_HOURS = {
  days: [
    { day: 'Montag', time: '7:30 – 16:30' },
    { day: 'Dienstag', time: '7:30 – 16:30' },
    { day: 'Mittwoch', time: '7:30 – 16:30' },
    { day: 'Donnerstag', time: '7:30 – 16:30' },
    { day: 'Freitag', time: '7:30 – 13:00' },
    { day: 'Samstag', time: 'geschlossen' },
    { day: 'Sonntag', time: 'geschlossen' },
  ],
  note: 'Termine vor Ort nach Vereinbarung.',
};

export const DEFAULT_REFERENCES = [];

// Feste Bildplätze, die nicht zu einer Leistung oder Referenz gehören.
export const IMAGE_SLOTS = [
  { key: 'start-hero', label: 'Startseite: großes Foto neben der Überschrift' },
  { key: 'ueber-team', label: 'Über uns: Team- oder Porträtfoto' },
];

export const textDefaults = Object.fromEntries(TEXTS.map((t) => [t.key, t.default]));
export const multiKeys = new Set(TEXTS.filter((t) => t.multi).map((t) => t.key));

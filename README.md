# Elektro Valentin – Firmenhomepage

Schlichte Firmenhomepage im Stil des Logos, gehostet auf Google Firebase.
Texte, Bilder, Leistungen, Referenzen, Neuigkeiten und Öffnungszeiten werden im
Adminmenü unter `/admin` gepflegt. Anfragen aus dem Kontaktformular landen dort
unter „Anfragen“.

Texte und Einstellungen liegen in Firestore, Fotos in Firebase Storage
(Blaze-Tarif, im Freikontingent). Fotos werden beim Hochladen im Browser auf
höchstens 2400 px verkleinert.

## Seiten

| Adresse | Inhalt |
| --- | --- |
| `/` | Startseite mit Leistungen, Kontakt, Neuigkeiten und Öffnungszeiten |
| `/leistungen` | Alle Leistungen mit Foto, Text und Stichpunkten |
| `/ueber-uns` | Über den Betrieb |
| `/referenzen` | Projekte mit Foto |
| `/kontakt` | Kontaktdaten, Öffnungszeiten, Kontaktformular |
| `/impressum`, `/datenschutz` | Rechtliches (Vorlagen, bitte prüfen lassen) |
| `/admin` | Adminmenü, nur nach Anmeldung mit Google |

## Einmalige Einrichtung in Firebase

Projekt: [elektro-valentin](https://console.firebase.google.com/project/elektro-valentin/overview)

1. **Datenbank anlegen:** Firestore Database → „Datenbank erstellen“ →
   Standort `europe-west3 (Frankfurt)` → „Im Produktionsmodus starten“.
2. **Login einschalten:** Authentication → „Jetzt starten“ → Anbieter „Google“
   aktivieren und speichern.
3. **Web-App registrieren:** Projekteinstellungen (Zahnrad) → Allgemein →
   „App hinzufügen“ → Web (`</>`). Name z. B. „Homepage“, Häkchen bei
   „Firebase Hosting einrichten“ setzen. Die angezeigten Code-Schnipsel brauchst
   du nicht, die Seite holt sich die Daten selbst.
4. **Dich als Admin freischalten:** Firestore Database → „Sammlung starten“ →
   Sammlungs-ID `admins` → Dokument-ID = deine Google-E-Mail-Adresse in
   Kleinbuchstaben (z. B. `max.mustermann@gmail.com`) → ein Feld `name` mit
   deinem Namen → Speichern. Weitere Personen schaltest du genauso frei.
5. **Automatisches Veröffentlichen von GitHub aus:** ist eingerichtet. GitHub
   meldet sich über Workload Identity Federation beim Dienstkonto
   `github-deploy` an, ganz ohne Schlüsseldatei; nur dieses Repository darf das.
   Jede Änderung auf `main` wird automatisch veröffentlicht, jeder Pull Request
   bekommt einen Vorschau-Link (siehe „Summary“ des GitHub-Laufs).

6. **Fotospeicher (Storage):** Firebase-Konsole → Storage → „Jetzt starten“,
   Standort `europe-west3`, Produktionsmodus. Einmalig danach auf dem eigenen
   Rechner im Projektordner `npx firebase deploy --only storage --project elektro-valentin`
   ausführen (unter Windows `npx.cmd`) und die Frage nach der IAM-Rolle mit
   „Y“ beantworten. Damit dürfen die Storage-Regeln in der Sammlung `admins`
   nachsehen, wer Fotos hochladen darf.
7. **Eigene Domain:** Hosting → „Benutzerdefinierte Domain hinzufügen“ und die
   angezeigten DNS-Einträge bei Squarespace Domains eintragen. Danach unter
   Authentication → Einstellungen → Autorisierte Domains prüfen, dass die Domain
   dort steht, sonst klappt die Anmeldung im Adminmenü nicht.

## Vor dem Livegang prüfen

- Öffnungszeiten (die eingetragenen Zeiten sind Beispiele)
- Texte „Über uns“, Impressum und Datenschutzerklärung (Platzhalter in
  eckigen Klammern ersetzen, rechtlich prüfen lassen)
- E-Mail-Adresse unter „Kontaktdaten“ eintragen, falls sie erscheinen soll

## Für Entwickler

```bash
npm install
npm run dev     # baut die Seite und startet die Firebase-Emulatoren
npm test        # prüft die Darstellungsfunktionen
npm run build   # baut nach dist/
```

`npm run dev` braucht Java (für den Firestore-Emulator). Die Seite läuft dann
unter http://127.0.0.1:5000, das Adminmenü unter http://127.0.0.1:5000/admin.
Im Emulator kannst du dich mit einem beliebigen Testkonto anmelden; schalte es
vorher im Emulator-Fenster (http://127.0.0.1:4000/firestore) in der Sammlung
`admins` frei.

Aufbau:

- `src/js/content.js`: alle Standardtexte, Leistungen und Öffnungszeiten.
  Was im Adminmenü gespeichert wird, ersetzt diese Standards.
- `src/pages/`: die Seiten. `data-text="…"` markiert einen bearbeitbaren Text,
  `data-render="…"` einen Bereich aus der Datenbank, `data-image="…"` einen
  Bildplatz.
- `src/js/site.js`: lädt die Inhalte aus der Datenbank in die Seite.
- `src/js/admin.js`: das Adminmenü.
- `firestore.rules`: wer was lesen und schreiben darf.
- `scripts/build.mjs`: setzt die Seiten zusammen und füllt die Standardtexte ein,
  damit die Seite auch ohne Datenbank vollständig ist.

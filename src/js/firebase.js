import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite';

// Lokal (npm run dev) laufen Datenbank und Login im Firebase-Emulator.
export const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

let ready;

// Auf Firebase Hosting liefert /__/firebase/init.json die Projektdaten,
// deshalb steht hier kein Schlüssel im Code.
export function initFirebase() {
  ready ??= (async () => {
    const config = isLocal
      ? { projectId: 'demo-elektro-valentin', apiKey: 'demo-key', authDomain: location.host }
      : await fetch('/__/firebase/init.json').then((r) => {
        if (!r.ok) throw new Error('Firebase-Konfiguration nicht gefunden');
        return r.json();
      });
    const app = initializeApp(config);
    const db = getFirestore(app);
    if (isLocal) connectFirestoreEmulator(db, location.hostname, 8080);
    return { app, db };
  })();
  return ready;
}

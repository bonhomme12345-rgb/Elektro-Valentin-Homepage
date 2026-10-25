// Verkleinert ein Foto im Browser, damit es als Bilddatei in die Datenbank passt
// (ein Eintrag darf höchstens 1 MB groß sein) und die Seite schnell lädt.

const MAX_SIDE = 1600;
const MAX_CHARS = 900_000;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Diese Datei ist kein lesbares Bild.')); };
    img.src = url;
  });
}

export async function resizeImage(file) {
  const img = await loadImage(file);
  let side = MAX_SIDE;
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.72, 0.62]) {
      const data = canvas.toDataURL('image/jpeg', quality);
      if (data.length <= MAX_CHARS) return data;
    }
    side = Math.round(side * 0.75);
  }
  throw new Error('Das Foto ist zu groß. Bitte ein kleineres Foto wählen.');
}

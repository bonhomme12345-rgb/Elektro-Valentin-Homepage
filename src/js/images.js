// Verkleinert ein Foto im Browser vor dem Hochladen, damit die Seite schnell lädt.
// Handyfotos mit 4000 px und mehr werden auf höchstens 2400 px gebracht.

const MAX_SIDE = 2400;
const QUALITY = 0.85;

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
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  if (!blob) throw new Error('Das Foto konnte nicht umgewandelt werden.');
  return blob;
}

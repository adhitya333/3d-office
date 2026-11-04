/** Resize large references once before upload; image bytes never go into localStorage. */
export async function prepareChatImage(file: File): Promise<{ name: string; data: string }> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (file.size > 15_000_000) throw new Error('Choose an image smaller than 15 MB.');
  let blob: Blob = file;
  const bitmap = await createImageBitmap(file);
  try {
    if (Math.max(bitmap.width, bitmap.height) > 2048 || file.size > 1_800_000) {
      const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d'); if (!context) throw new Error('Could not prepare this image.');
      context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not resize this image.')), 'image/jpeg', 0.86));
      canvas.width = canvas.height = 1;
    }
  } finally { bitmap.close(); }
  if (blob.size > 2_000_000) throw new Error('This image is still too large. Try a smaller crop.');
  const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('Could not read this image.')); reader.readAsDataURL(blob); });
  return { name: file.name, data };
}

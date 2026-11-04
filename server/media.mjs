import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

export function imageType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mime: 'image/png', ext: 'png' };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: 'image/jpeg', ext: 'jpg' };
  if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  throw new Error('Use a PNG, JPEG or WebP image.');
}

/** Images stay outside the public build. Only authenticated API requests can read them. */
export function createMediaStore(root) {
  const directory = path.join(root, '.office-data', 'media');
  const publicImage = record => ({ id: record.id, url: `/api/media/${record.id}`, name: record.name, mime: record.mime });
  const save = async (bytes, employeeId, name, generated = false) => {
    if (!bytes.length || bytes.length > (generated ? 10_000_000 : 2_000_000)) throw new Error('Image is too large.');
    const type = imageType(bytes), id = randomBytes(16).toString('hex');
    const record = { id, employeeId, name: String(name || 'image').replace(/[^\w .()-]/g, '').slice(0, 90) || 'image', ...type, generated };
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${id}.${type.ext}`), bytes);
    await writeFile(path.join(directory, `${id}.json`), JSON.stringify(record));
    return publicImage(record);
  };
  const get = async id => {
    if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Image not found.');
    const record = JSON.parse(await readFile(path.join(directory, `${id}.json`), 'utf8'));
    if (record.id !== id || !['png','jpg','webp'].includes(record.ext)) throw new Error('Image not found.');
    return { ...record, filename: path.join(directory, `${id}.${record.ext}`) };
  };
  return {
    get,
    async upload({ data, employeeId, name }) {
      if (typeof data !== 'string' || data.length > 2_700_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) throw new Error('Invalid image.');
      return save(Buffer.from(data, 'base64'), employeeId, name);
    },
    async importFile(filename, employeeId) { if ((await stat(filename)).size > 10_000_000) throw new Error('Generated image is too large.'); return save(await readFile(filename), employeeId, 'Generated image', true); },
    async prepare(id, employeeId, cwd) {
      const record = await get(id);
      if (record.employeeId !== employeeId) throw new Error('This image belongs to a different employee chat.');
      const target = path.join(cwd, 'attachments'); await mkdir(target, { recursive: true });
      const filename = path.join(target, `${record.id}.${record.ext}`);
      await writeFile(filename, await readFile(record.filename));
      return filename;
    },
  };
}

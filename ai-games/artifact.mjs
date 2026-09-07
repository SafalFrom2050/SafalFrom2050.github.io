export const MAX_FILE = 500 * 1024;
export const MAX_TOTAL = 2 * 1024 * 1024;
export const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
export function validName(name) {
  return typeof name === 'string' && /^[A-Za-z0-9_./-]{1,128}$/.test(name)
    && name.split('/').every(part => part && !part.startsWith('.'))
    && /\.(html?|m?js|css|json|svg|txt|md|png|jpe?g|webp|gif|wasm|mp3|wav|ogg)$/i.test(name);
}
export function manifestFor(game, id) {
  if (!validId(id)) throw new Error('Invalid game ID');
  const entries = game.fileManifest ?? game.files ?? [];
  if (!Array.isArray(entries) || entries.length > 32) throw new Error('Invalid manifest');
  if (!entries.length) {
    if (typeof game.htmlContent !== 'string' || !game.htmlContent.trim()) throw new Error('Missing game files');
    const body = new TextEncoder().encode(game.htmlContent);
    if (body.byteLength > MAX_FILE) throw new Error('Game file too large');
    return { legacy: body };
  }
  const names = entries.map(entry => entry?.name).filter(name =>
    !(typeof name === 'string' && /^preview(?:_v\d+)?\.(?:png|jpe?g|webp)$/i.test(name)));
  if (names.some(name => !validName(name)) || new Set(names).size !== names.length || !names.includes('index.html')) throw new Error('Invalid game files');
  const base = game.storageBasePath ?? `ai_games_files/${id}`;
  if (base !== `ai_games_files/${id}`) throw new Error('Unexpected game location');
  return { names, base };
}
export async function boundedBytes(response) {
  if (!response.ok) throw new Error('Game download failed');
  if (Number(response.headers.get('content-length')) > MAX_FILE) throw new Error('Game file too large');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE) throw new Error('Game file too large');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel(); throw error; }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}
export async function loadArtifact(game, id, fetchFile) {
  const manifest = manifestFor(game, id);
  if (manifest.legacy) return [{ name: 'index.html', body: manifest.legacy }];
  const files = [];
  let total = 0;
  // Sequential downloads bound peak memory and stop immediately at the limit.
  for (const name of manifest.names) {
    const body = await boundedBytes(await fetchFile(`${manifest.base}/${name}`));
    total += body.byteLength;
    if (total > MAX_TOTAL) throw new Error('Game project too large');
    files.push({ name, body });
  }
  return files;
}

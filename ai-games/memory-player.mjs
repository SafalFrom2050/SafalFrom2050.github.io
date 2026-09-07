import { parse } from './vendor/acorn.mjs';

const BASE = 'https://shared-game.invalid/';
const MIME = { html: 'text/html', htm: 'text/html', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', txt: 'text/plain', md: 'text/plain', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', wasm: 'application/wasm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' };
const absolute = (value, base = BASE) => new URL(value, base).href;
function dataUrl(text, type) {
  const bytes = typeof text === 'string' ? new TextEncoder().encode(text) : text;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${type};base64,${btoa(binary)}`;
}

// Parse import locations rather than replacing JavaScript strings/comments.
function prepareScript(source, name) {
  const base = absolute(name);
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module', allowReturnOutsideFunction: true });
  const edits = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
      const value = node.source.value;
      if (/^(\.|\/)/.test(value)) edits.push([node.source.start, node.source.end, JSON.stringify(absolute(value, base))]);
    }
    if (node.type === 'ImportExpression') {
      edits.push([node.source.start, node.source.start, 'globalThis.__resolveGameModule(']);
      edits.push([node.source.end, node.source.end, `,${JSON.stringify(base)})`]);
    }
    if (node.type === 'MemberExpression' && node.object?.type === 'MetaProperty' && node.object.meta.name === 'import' && node.property?.name === 'url') {
      edits.push([node.start, node.end, JSON.stringify(base)]);
      return;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(ast);
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + replacement + source.slice(end);
  return source;
}

// Runs inside the opaque sandbox. Only manifest URLs are mapped to game bytes.
function bootstrap(resources, base) {
  // Sandboxed games get session-only preferences, never the portal's storage.
  for (const name of ['localStorage', 'sessionStorage']) {
    const values = new Map();
    Object.defineProperty(globalThis, name, { value: {
      get length() { return values.size; },
      key(index) { return [...values.keys()][index] ?? null; },
      getItem(key) { return values.get(String(key)) ?? null; },
      setItem(key, value) { values.set(String(key), String(value)); },
      removeItem(key) { values.delete(String(key)); },
      clear() { values.clear(); }
    } });
  }
  const key = value => { const url = new URL(String(value), base); url.search = ''; url.hash = ''; return url.href; };
  const resolve = value => resources[key(value)] || String(value);
  globalThis.__resolveGameModule = (value, from) => {
    const result = new URL(String(value), from).href;
    return resources[key(result)] ? key(result) : result;
  };
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = (input, options) => {
    const value = input instanceof Request ? input.url : input;
    const mapped = resolve(value);
    return nativeFetch(mapped === String(value) ? input : mapped, { ...options, credentials: 'omit' });
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) { return open.call(this, method, resolve(url), ...args); };
  for (const [type, attribute] of [[HTMLScriptElement, 'src'], [HTMLImageElement, 'src'], [HTMLLinkElement, 'href'], [HTMLMediaElement, 'src']]) {
    const descriptor = Object.getOwnPropertyDescriptor(type.prototype, attribute);
    if (descriptor?.set) Object.defineProperty(type.prototype, attribute, { ...descriptor, set(value) { descriptor.set.call(this, resolve(value)); } });
  }
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) { return setAttribute.call(this, name, ['src', 'href'].includes(name.toLowerCase()) ? resolve(value) : value); };
}

export function playerDocument(files) {
  const sources = new Map(files.map(file => [absolute(file.name), file.body]));
  const resources = Object.create(null);
  const inProgress = new Set();
  function resource(url) {
    const original = url;
    const parsed = new URL(url); parsed.search = ''; parsed.hash = '';
    url = parsed.href;
    if (!sources.has(url)) return original;
    if (resources[url]) return resources[url];
    if (inProgress.has(url)) throw new Error('Circular stylesheet');
    inProgress.add(url);
    const extension = new URL(url).pathname.split('.').pop().toLowerCase();
    let source = sources.get(url);
    if (/^(html?|m?js|css|json|svg|txt|md)$/.test(extension)) source = new TextDecoder().decode(source);
    if (['js', 'mjs'].includes(extension)) source = prepareScript(source, url);
    if (extension === 'css') source = css(source, url);
    resources[url] = dataUrl(source, MIME[extension] || 'text/plain');
    inProgress.delete(url);
    return resources[url];
  }
  function css(source, base) {
    return source.replace(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/g, (_, quote, value) => `url("${resource(absolute(value.trim(), base))}")`)
      .replace(/@import\s+(['"])([^'"]+)\1/g, (_, quote, value) => `@import "${resource(absolute(value, base))}"`);
  }
  for (const url of sources.keys()) resource(url);
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(sources.get(absolute('index.html'))), 'text/html');
  const existingImports = {};
  for (const map of doc.querySelectorAll('script[type="importmap"]')) {
    for (const [name, value] of Object.entries(JSON.parse(map.textContent).imports || {})) {
      if (typeof value === 'string') existingImports[name] = resource(absolute(value));
    }
  }
  doc.querySelectorAll('base, meta[http-equiv], script[type="importmap"]').forEach(element => element.remove());
  for (const element of doc.querySelectorAll('[src], [href], [poster]')) {
    for (const attribute of ['src', 'href', 'poster']) {
      const value = element.getAttribute(attribute);
      if (value && !value.startsWith('#')) element.setAttribute(attribute, resource(absolute(value)));
    }
  }
  for (const element of doc.querySelectorAll('style')) element.textContent = css(element.textContent, BASE);
  for (const element of doc.querySelectorAll('[style]')) element.setAttribute('style', css(element.getAttribute('style'), BASE));
  for (const script of doc.querySelectorAll('script:not([src])')) {
    if (!script.type || ['module', 'text/javascript', 'application/javascript'].includes(script.type)) script.textContent = prepareScript(script.textContent, 'index.html');
  }
  const policy = doc.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' data: https:; style-src 'unsafe-inline' data: https:; img-src data: blob: https:; media-src data: blob: https:; font-src data: https:; connect-src data: https:; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  const imports = doc.createElement('script'); imports.type = 'importmap';
  imports.textContent = JSON.stringify({ imports: { ...existingImports, ...resources } }).replaceAll('<', '\\u003c');
  const setup = doc.createElement('script');
  setup.textContent = `(${bootstrap.toString()})(${JSON.stringify(resources).replaceAll('<', '\\u003c')},${JSON.stringify(BASE)});`;
  doc.head.prepend(policy, imports, setup);
  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}

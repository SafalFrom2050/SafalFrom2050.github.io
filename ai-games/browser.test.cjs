// Run with Playwright installed, or set PLAYWRIGHT_MODULE to its absolute path.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) return res.writeHead(301, { location: url.pathname + '/' + url.search }).end();
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const files = {
      'index.html': '<!doctype html><link rel="stylesheet" href="css/style.css"><h1 id="game">Starting</h1><script type="module" src="js/main.js"></script>',
      'js/main.js': 'import {greeting} from "./helper.mjs"; const again = await import("./helper.mjs"); localStorage.setItem("test", "ok"); const data = await (await fetch("data.json")).json(); document.querySelector("#game").textContent = greeting === again.greeting && data.title === greeting ? greeting : "failed";',
      'js/helper.mjs': 'export const greeting = "Game is running";',
      'css/style.css': 'h1 { color: rgb(1, 2, 3); }',
      'data.json': '{"title":"Game is running"}'
    };
    await context.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType:'text/javascript', body: `window.firebase={apps:[],initializeApp(){},firestore(){return {collection(){return {doc(id){return {async get(){
      if(id==='private')throw {code:'permission-denied'};
      if(id==='network')throw {code:'unavailable'};
      return {exists:id!=='missing',data:()=>({title:'Shared test game',description:'A multi-file game',isPublished:true,publishStatus:'complete',...(id==='legacy'?{htmlContent:'<h1>Legacy game</h1>'}:{fileManifest:${JSON.stringify(Object.keys(files).map(name => ({name})))}})})};
    }}}}}}}};` }));
    await context.route('https://firebasestorage.googleapis.com/**', route => {
      const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/o/')[1]).split('/').slice(2).join('/');
      return route.fulfill({contentType:'text/plain',body:files[name],headers:{'access-control-allow-origin':'*'}});
    });
    await page.goto(`${base}/ai-games?gameId=fixture`);
    const play = page.getByRole('button', {name:'Play game',exact:true});
    await play.waitFor();
    assert.match(page.url(), /ai-games\/\?gameId=fixture$/);
    await play.click();
    await page.frameLocator('iframe').getByText('Game is running',{exact:true}).waitFor();
    const frame = page.frames()[1];
    assert.equal(await frame.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(1, 2, 3)');
    assert.equal(await frame.evaluate(()=>localStorage.getItem('test')),'ok');
    assert.equal(await page.evaluate(()=>localStorage.getItem('test')),null);
    assert.equal(await frame.evaluate(()=>{try{return !!parent.document;}catch{return false;}}),false);
    await page.getByRole('button',{name:'Close game',exact:true}).click();
    await play.waitFor();
    assert.equal(await page.locator('iframe').count(),0);
    await page.reload();
    await play.waitFor();
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    for(const [id,title,retry] of [['missing','Game unavailable',false],['private','Game unavailable',false],['network','Could not open game',true],['','Choose an AI game',false]]) {
      await page.goto(`${base}/ai-games/?gameId=${id}`);
      await page.getByRole('heading',{name:title,exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Try again'}).isVisible(),retry);
    }
    await page.goto(`${base}/ai-games/?gameId=legacy`);
    await play.click();
    await page.frameLocator('iframe').getByText('Legacy game',{exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS: redirect, reload, modules, dynamic import, CSS, JSON fetch, isolated storage, parent isolation, close, mobile layout, errors, legacy HTML');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

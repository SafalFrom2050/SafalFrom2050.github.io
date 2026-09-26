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
    assert.equal(await page.locator('#android-download').isVisible(), false);
    await play.click();
    await page.frameLocator('iframe').getByText('Game is running',{exact:true}).waitFor();
    const frame = page.frames()[1];
    assert.equal(await frame.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(1, 2, 3)');
    assert.equal(await frame.evaluate(()=>localStorage.getItem('test')),'ok');
    assert.equal(await page.evaluate(()=>localStorage.getItem('test')),null);
    assert.equal(await frame.evaluate(()=>{try{return !!parent.document;}catch{return false;}}),false);
    if (await page.evaluate(() => document.fullscreenEnabled)) {
      await page.locator('#fullscreen').click();
      await page.waitForFunction(() => document.fullscreenElement?.id === 'player');
      assert.equal(await page.locator('#stop').isVisible(), true);
      await page.getByRole('button', {name:'Exit full screen',exact:true}).click();
      await page.waitForFunction(() => !document.fullscreenElement);
    }
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
    // Model browsers without element fullscreen (including iPhone Safari).
    await page.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', {configurable:true, get:()=>false});
      Object.defineProperty(navigator, 'userAgentData', {value:undefined});
      Object.defineProperty(navigator, 'userAgent', {value:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1'});
    });
    await page.goto(`${base}/ai-games/?gameId=fixture`);
    await play.click();
    await page.frameLocator('iframe').getByText('Game is running',{exact:true}).waitFor();
    assert.equal(await page.locator('#android-download').isVisible(),false);
    const priorScroll = await page.evaluate(()=>scrollY);
    await page.getByRole('button',{name:'Expand game',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#player').classList.contains('expanded'));
    assert.equal(await page.locator('.site-header').evaluate(el=>el.inert),true);
    let bounds = await page.locator('#player').boundingBox();
    assert.equal(Math.round(bounds.height),844);
    assert.equal(Math.round(bounds.y),0);
    await page.setViewportSize({width:844,height:390});
    bounds = await page.locator('#player').boundingBox();
    assert.equal(Math.round(bounds.height),390);
    assert.equal(await page.frames()[1].evaluate(()=>localStorage.getItem('test')),'ok');
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Exit expanded view',exact:true}).click();
    assert.equal(await page.locator('.site-header').evaluate(el=>el.inert),false);
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-priorScroll)<2);
    // A rejected native request must also expand instead of displaying an error.
    await page.evaluate(()=>{
      Object.defineProperty(document,'fullscreenEnabled',{get:()=>true});
      document.querySelector('#player').requestFullscreen=()=>Promise.reject(new Error('Denied'));
    });
    await page.locator('#fullscreen').click();
    await page.getByRole('button',{name:'Exit expanded view',exact:true}).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#player').evaluate(el=>el.classList.contains('expanded')),false);
    await page.locator('#fullscreen').click();
    await page.getByRole('button',{name:'Exit expanded view',exact:true}).waitFor();
    await page.getByRole('button',{name:'Close game',exact:true}).click();
    await play.waitFor();
    assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('player-expanded')),false);
    const androidPage = await context.newPage();
    await androidPage.addInitScript(()=>Object.defineProperty(navigator,'userAgentData',{value:{platform:'Android'}}));
    await androidPage.goto(`${base}/ai-games/?gameId=fixture`);
    await androidPage.getByRole('link',{name:'Download app for Android',exact:true}).waitFor();
    assert.equal(await androidPage.locator('#android-download').getAttribute('href'),'https://play.google.com/store/apps/details?id=dif.instantgames');
    await androidPage.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: share routes, player isolation, game resources, native fullscreen, fallback expansion, rotation, scroll restoration, Android CTA, errors, legacy HTML');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

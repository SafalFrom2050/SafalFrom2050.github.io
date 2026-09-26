import test from 'node:test';
import assert from 'node:assert/strict';
import { manifestFor, loadArtifact, validId, MAX_FILE, MAX_TOTAL } from './artifact.mjs';

test('public IDs and published paths cannot address private artifacts', () => {
  for (const id of ['', '../draft', 'a/b', 'a?b', 'a'.repeat(129)]) assert.equal(validId(id), false);
  assert.equal(validId('oVXfHVxRFo55saZAqoKj'), true);
  assert.throws(() => manifestFor({ fileManifest: [{name:'index.html'}], storageBasePath: 'games/private' }, 'public'));
});
test('manifest requires an entrypoint and safe unique bounded files', () => {
  for (const name of ['../main.js', '/main.js', '.hidden.js', 'a//main.js', 'a\\main.js', 'a/.hidden.js', 'main.exe']) {
    assert.throws(() => manifestFor({fileManifest:[{name:'index.html'},{name}]},'public'));
  }
  assert.throws(() => manifestFor({fileManifest:[{name:'main.js'}]},'public'));
  assert.throws(() => manifestFor({fileManifest:[{name:'index.html'},{name:'index.html'}]},'public'));
  assert.throws(() => manifestFor({fileManifest:Array.from({length:33},(_,i)=>({name:`${i}.js`}))},'public'));
  assert.deepEqual(manifestFor({fileManifest:[{name:'index.html'},{name:'js/main.js'}]},'public').names,['index.html','js/main.js']);
});
test('legacy HTML stays bounded and never needs a Storage read', async () => {
  const files = await loadArtifact({htmlContent:'<h1>Legacy</h1>'},'public',()=>assert.fail('No download expected'));
  assert.equal(new TextDecoder().decode(files[0].body),'<h1>Legacy</h1>');
  assert.throws(()=>manifestFor({htmlContent:'x'.repeat(MAX_FILE+1)},'public'));
});
test('legacy preview caches are skipped while real binary assets are kept', () => {
  const manifest = manifestFor({fileManifest:[{name:'index.html'},{name:'preview_v3.png'},{name:'preview.png'},{name:'assets/sprite.png'}]},'public');
  assert.deepEqual(manifest.names,['index.html','assets/sprite.png']);
});
test('downloads reject HTTP failures and enforce file and total byte limits', async () => {
  const game = {fileManifest:[{name:'index.html'}]};
  await assert.rejects(loadArtifact(game,'public',async()=>new Response('missing',{status:404})));
  await assert.rejects(loadArtifact(game,'public',async()=>new Response(new Uint8Array(MAX_FILE+1))));
  let calls=0;
  await assert.rejects(loadArtifact({fileManifest:[{name:'index.html'},...Array.from({length:5},(_,i)=>({name:`${i}.js`}))]},'public',async()=>{calls++; return new Response(new Uint8Array(MAX_FILE));}));
  assert.equal(calls,Math.floor(MAX_TOTAL/MAX_FILE)+1);
});

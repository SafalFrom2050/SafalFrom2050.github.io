import { validId, loadArtifact } from './artifact.mjs';
import { playerDocument } from './memory-player.mjs';
import { setupPlayerDisplay } from './player-display.mjs';

const $ = id => document.getElementById(id);
const id = new URL(location.href).searchParams.get('gameId');
let game;
const status = message => { $('status').textContent = message; };

const display = setupPlayerDisplay({
  player: $('player'), toggle: $('fullscreen'), close: $('stop'),
  background: [...document.querySelectorAll('.site-header, .game-heading, #status, #retry, #details')]
});
const platform = navigator.userAgentData?.platform || navigator.userAgent;
$('android-download').hidden = !/android/i.test(platform);

async function closePlayer() {
  await display.exit();
  $('frame-host').replaceChildren();
  $('player').hidden = true;
  $('details').hidden = false;

}

async function play() {
  $('play').disabled = true;
  status('Loading game files…');
  try {

    const files = await loadArtifact(game, id, path => fetch(
      `https://firebasestorage.googleapis.com/v0/b/dif-instantgames.appspot.com/o/${encodeURIComponent(path)}?alt=media`,
      { credentials: 'omit', signal: AbortSignal.timeout(20000) }
    ));

    const frame = document.createElement('iframe');
    frame.title = game.title || 'AI game';
    frame.setAttribute('sandbox', 'allow-scripts allow-pointer-lock');
    frame.setAttribute('allow', 'fullscreen');
    frame.referrerPolicy = 'no-referrer';
    frame.srcdoc = playerDocument(files);
    $('frame-host').classList.toggle('portrait', game.isPortrait !== false && game.orientation !== 'landscape');
    $('frame-host').replaceChildren(frame);
    $('details').hidden = true;
    $('player').hidden = false;
    status('');
    $('stop').focus();
  } catch {
    await closePlayer();
    status('Could not load this game. Check your connection and try Play again, or open the link in a full browser. The game may no longer be available.');
  } finally { $('play').disabled = false; }
}

async function load() {
  $('retry').hidden = true;
  if (!validId(id)) {
    $('title').textContent = 'Choose an AI game';
    status('This link is missing a valid game ID. Explore AI games to find something to play.');
    return;
  }
  status('Loading game details…');
  try {
    if (!globalThis.firebase) throw new Error('Firebase unavailable');
    if (!firebase.apps.length) firebase.initializeApp({
      apiKey: 'AIzaSyCa21G1mEhrJKmoPLRZ8hbJikyI4lGdY5Y',
      projectId: 'dif-instantgames',
      appId: '1:555879374010:web:405a0d17f2b1b20e85b683'
    });
    const snapshot = await firebase.firestore().collection('ai_games').doc(id).get({ source: 'server' });
    game = snapshot.exists ? snapshot.data() : null;
    if (!game || game.isPublished !== true || game.publishStatus !== 'complete') {
      $('title').textContent = 'Game unavailable';
      status('This game does not exist or is no longer published.');
      return;
    }
    const title = typeof game.title === 'string' ? game.title : 'Untitled AI game';
    $('title').textContent = title;
    document.title = `${title} | alt games portal`;
    $('description').textContent = typeof game.description === 'string' ? game.description : '';
    $('category').textContent = typeof game.category === 'string' ? game.category : 'AI game';
    const preview = Array.isArray(game.screenshotUrls) && game.screenshotUrls.find(value => {
      try { return typeof value === 'string' && new URL(value).protocol === 'https:'; } catch { return false; }
    });
    if (preview) {
      $('preview').onload = () => { $('preview').hidden = false; $('placeholder').hidden = true; };
      $('preview').src = preview;
    }
    $('details').hidden = false;
    status('');
  } catch (error) {
    const unavailable = error.code === 'permission-denied';
    $('title').textContent = unavailable ? 'Game unavailable' : 'Could not open game';
    status(unavailable ? 'This game does not exist or is no longer published.' : 'Check your connection and try again.');
    $('retry').hidden = unavailable;
  }
}
$('play').addEventListener('click', play);
$('stop').addEventListener('click', async () => { await closePlayer(); $('play').focus(); });
$('retry').addEventListener('click', () => location.reload());

load();

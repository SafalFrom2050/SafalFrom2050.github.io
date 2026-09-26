export function setupPlayerDisplay({ player, toggle, close, background }) {
  let savedScroll = 0;
  let expanded = false;
  const nativeAvailable = () => Boolean(document.fullscreenEnabled && player.requestFullscreen);
  function updateButton() {
    const native = document.fullscreenElement === player;
    toggle.textContent = native ? 'Exit full screen' : expanded ? 'Exit expanded view' : nativeAvailable() ? 'Full screen' : 'Expand game';
    toggle.setAttribute('aria-pressed', String(native || expanded));
  }
  function expand() {
    savedScroll = window.scrollY;
    expanded = true;
    document.body.style.setProperty('--page-scroll-top', `-${savedScroll}px`);
    document.body.classList.add('player-expanded');
    player.classList.add('expanded');
    player.setAttribute('role', 'dialog');
    player.setAttribute('aria-modal', 'true');
    background.forEach(element => { element.inert = true; });
    updateButton();
    toggle.focus();
  }
  function collapse() {
    if (!expanded) return;
    expanded = false;
    player.classList.remove('expanded');
    document.body.classList.remove('player-expanded');
    document.body.style.removeProperty('--page-scroll-top');
    player.removeAttribute('role');
    player.removeAttribute('aria-modal');
    background.forEach(element => { element.inert = false; });
    window.scrollTo(0, savedScroll);
    updateButton();
    toggle.focus();
  }
  async function exit() {
    collapse();
    if (document.fullscreenElement === player) await document.exitFullscreen();
    updateButton();
  }
  toggle.addEventListener('click', async () => {
    if (expanded || document.fullscreenElement === player) { await exit(); return; }
    if (nativeAvailable()) {
      try { await player.requestFullscreen(); updateButton(); return; } catch { /* Use the same fallback when a browser rejects fullscreen. */ }
    }
    if (!player.hidden) expand();
  });
  document.addEventListener('fullscreenchange', updateButton);
  document.addEventListener('keydown', event => {
    if (!expanded) return;
    if (event.key === 'Escape') { event.preventDefault(); collapse(); }
    if (event.key === 'Tab') {
      const frame = player.querySelector('iframe');
      if (event.shiftKey && document.activeElement === close) { event.preventDefault(); frame?.focus(); }
      else if (!event.shiftKey && document.activeElement === frame) { event.preventDefault(); close.focus(); }
    }
  });
  updateButton();
  return { exit };
}

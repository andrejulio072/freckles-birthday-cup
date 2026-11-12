'use strict';

const $ = (id) => document.getElementById(id);
const games = {
  sled: {title:'Sled Sprint', type:'01 / Speed', help:'Start the clock, then tap Push or hit Space as fast as you can. You have eight seconds.', unit:' pushes'},
  wall: {title:'Wall Ball Zone', type:'02 / Timing', help:'Tap Throw or press Space when the orange marker crosses the pink zone. The target moves after each of your six throws.', unit:' / 6'},
  reaction: {title:'Beat the Buzzer', type:'03 / Reaction', help:'Arm the lights, then wait for GO. Tap the button or press Space as soon as it says GO.', unit:' ms'}
};
const captions = [
  'Lauren and Andre posing beside the gym banner', 'Lauren flexing beside the car',
  'Lauren celebrating beside the car', 'Lauren posing in front of the gym banner',
  'Lauren striking a pose on the stair railing', 'Lauren flexing in her personal trainer hoodie',
  'A collage of Lauren’s gym poses', 'Another pose beside the gym banner'
];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const storeKey = 'freckles-cup-arcade-v1';
const scores = {};
try {
  const saved = JSON.parse(localStorage.getItem(storeKey) || '{}') || {};
  Object.keys(games).forEach((name) => {
    if (Number.isInteger(saved[name]) && saved[name] >= 0) scores[name] = saved[name];
  });
} catch {}
let soundEnabled = false;
let audio;
function beep(frequency, duration = .1) {
  if (!soundEnabled || !audio || audio.state !== 'running') return;
  const note = audio.createOscillator();
  const volume = audio.createGain();
  note.frequency.value = frequency;
  volume.gain.setValueAtTime(.07, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  note.connect(volume).connect(audio.destination);
  note.start();
  note.stop(audio.currentTime + duration);
}
$('sound').addEventListener('click', async () => {
  if (!soundEnabled) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio ||= new Audio();
      await audio.resume();
    } catch { return; }
  }
  soundEnabled = !soundEnabled;
  $('sound').textContent = soundEnabled ? 'Game sound on' : 'Game sound off';
  $('sound').setAttribute('aria-pressed', String(soundEnabled));
  beep(620);
});
function confetti() {
  if (reducedMotion.matches) return;
  const layer = $('confetti');
  const pieces = document.createDocumentFragment();
  const colors = ['#f88ab2','#f5a35c','#b995ee','#f7d47c','#ad3767'];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--size', 5 + Math.random() * 9 + 'px');
    piece.style.setProperty('--color', colors[i % colors.length]);
    piece.style.setProperty('--x', (Math.random() - .5) * 110 + 'vw');
    piece.style.setProperty('--y', (Math.random() - .56) * 110 + 'vh');
    piece.style.setProperty('--spin', (Math.random() - .5) * 1500 + 'deg');
    pieces.append(piece);
  }
  layer.replaceChildren(pieces);
  clearTimeout(confetti.timer);
  confetti.timer = setTimeout(() => layer.replaceChildren(), 1500);
}
const birthdayLetter = document.querySelector('.birthday-letter');
$('open-letter').addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  birthdayLetter.open = true;
});
birthdayLetter.addEventListener('toggle', (event) => {
  if (event.currentTarget.open) confetti();
});
function updateScores() {
  let count = 0;
  Object.entries(games).forEach(([name, game]) => {
    const score = scores[name];
    $('best-' + name).textContent = score === undefined ? 'Best —' : 'Best ' + score + game.unit;
    if (score !== undefined) count++;
  });
  $('progress-fill').style.width = count / 3 * 100 + '%';
  $('events-completed').textContent = count + ' / 3';
  $('celebrate').disabled = count < 3;
  if (count === 3) $('medal-status').textContent = 'All three events complete. Your medal is ready.';
}
updateScores();
$('celebrate').addEventListener('click', () => {
  $('medal-status').textContent = '🥇 Lauren · Team Freckles · Birthday Cup champion';
  beep(784, .35);
  confetti();
});

const gameDialog = $('game-dialog');
const stage = $('game-stage');
const action = $('game-action');
const retry = $('try-again');
const status = $('game-status');
let state;
let animation;
let timer;
let opener;
function cancelGameWork() {
  cancelAnimationFrame(animation);
  clearTimeout(timer);
}
function setupGame(name) {
  cancelGameWork();
  state = {name, phase:'ready', pushes:0, throws:0, hits:0};
  $('game-type').textContent = games[name].type;
  $('game-title').textContent = games[name].title;
  $('game-help').textContent = games[name].help;
  action.textContent = name === 'reaction' ? 'Arm the lights' : 'Start';
  action.disabled = false;
  retry.hidden = true;
  status.textContent = '';
  if (name === 'sled') {
    stage.innerHTML = '<div class="game-meta"><span id="seconds">8.0 s</span><span id="pushes">0 pushes</span></div><div class="track" aria-hidden="true"><div class="push-fill" id="push-fill"></div></div>';
  } else if (name === 'wall') {
    stage.innerHTML = '<div class="game-meta"><span id="throws">0 / 6 throws</span><span id="hits">0 hits</span></div><div class="track" aria-hidden="true"><span class="zone" id="zone"></span><span class="needle" id="needle"></span></div>';
    placeZone();
  } else {
    stage.innerHTML = '<strong id="light-state">READY?</strong>';
  }
}
function finishGame(score, message) {
  cancelGameWork();
  state.phase = 'finished';
  action.disabled = true;
  retry.hidden = false;
  if (score !== null) {
    const previous = scores[state.name];
    const record = previous === undefined || (state.name === 'reaction' ? score < previous : score > previous);
    if (record) {
      scores[state.name] = score;
      try { localStorage.setItem(storeKey, JSON.stringify(scores)); } catch {}
      message += ' New personal best.';
    }
    updateScores();
    beep(740, .23);
  }
  status.textContent = message;
  retry.focus();
}
function tickSled(now) {
  const remaining = state.ends - now;
  $('seconds').textContent = Math.max(0, remaining / 1000).toFixed(1) + ' s';
  if (remaining <= 0) {
    finishGame(state.pushes, state.pushes + ' pushes in eight seconds.');
    return;
  }
  animation = requestAnimationFrame(tickSled);
}
function placeZone() {
  state.width = .23 - .013 * state.throws;
  state.zone = .13 + Math.random() * (.73 - state.width);
  $('zone').style.left = state.zone * 100 + '%';
  $('zone').style.width = state.width * 100 + '%';
}
function markerPosition(now) {
  const cycle = ((now - state.start) * (.00087 + state.throws * .000055)) % 2;
  return 1 - Math.abs(1 - cycle);
}
function tickWall(now) {
  $('needle').style.left = markerPosition(now) * 100 + '%';
  animation = requestAnimationFrame(tickWall);
}
function performAction() {
  if (!state || state.phase === 'finished') return;
  const now = performance.now();
  if (state.name === 'sled') {
    if (state.phase === 'ready') {
      state.phase = 'active';
      state.ends = now + 8000;
      action.textContent = 'Push!';
      tickSled(now);
      return;
    }
    if (now >= state.ends) {
      tickSled(now);
      return;
    }
    state.pushes++;
    $('pushes').textContent = state.pushes + ' pushes';
    $('push-fill').style.width = Math.min(100, state.pushes * 2) + '%';
    if (state.pushes % 4 === 0) beep(330, .055);
  } else if (state.name === 'wall') {
    if (state.phase === 'ready') {
      state.phase = 'active';
      state.start = now;
      action.textContent = 'Throw!';
      tickWall(now);
      return;
    }
    const marker = markerPosition(now);
    const hit = marker >= state.zone && marker <= state.zone + state.width;
    state.throws++;
    if (hit) state.hits++;
    $('throws').textContent = state.throws + ' / 6 throws';
    $('hits').textContent = state.hits + ' hits';
    status.textContent = hit ? 'On target!' : 'Missed. Next throw!';
    beep(hit ? 660 : 200, .08);
    if (state.throws === 6) finishGame(state.hits, state.hits + ' hits out of six.');
    else {
      state.start = now;
      placeZone();
    }
  } else if (state.phase === 'ready') {
    state.phase = 'waiting';
    $('light-state').textContent = 'WAIT…';
    action.textContent = 'Hit!';
    timer = setTimeout(() => {
      state.phase = 'go';
      $('light-state').textContent = 'GO!';
      $('light-state').className = 'go';
      state.start = performance.now();
      beep(820);
    }, 1200 + Math.random() * 2400);
  } else if (state.phase === 'waiting') {
    $('light-state').textContent = 'TOO EARLY';
    $('light-state').className = 'false-start';
    finishGame(null, 'False start. Wait for GO on the next attempt.');
  } else {
    const elapsed = Math.round(now - state.start);
    $('light-state').textContent = elapsed + ' MS';
    finishGame(elapsed, elapsed + ' ms reaction time.');
  }
}
document.querySelectorAll('[data-game]').forEach((button) => button.addEventListener('click', () => {
  opener = button;
  setupGame(button.dataset.game);
  gameDialog.showModal();
  action.focus();
}));
action.addEventListener('click', performAction);
retry.addEventListener('click', () => {
  setupGame(state.name);
  action.focus();
});
gameDialog.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.target !== action) return;
  event.preventDefault();
  if (!event.repeat) performAction();
});
gameDialog.addEventListener('close', () => {
  cancelGameWork();
  state = undefined;
  opener?.focus({preventScroll:true});
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || !state || ['ready','finished'].includes(state.phase)) return;
  finishGame(null, 'The attempt paused when you left the page. Play again to restart.');
});

const viewer = $('photo-viewer');
const photoGrid = $('photo-grid');
const fullPhoto = $('full-photo');
let photoIndex = 0;
const photoLinks = captions.map((caption, index) => {
  const number = index + 1;
  const link = document.createElement('a');
  link.className = 'photo-slot';
  link.href = 'photos/lauren-' + number + '.webp';
  link.setAttribute('aria-label', 'Open photo ' + number + ' of ' + captions.length);
  const img = new Image();
  img.src = 'photos/lauren-' + number + '-small.webp';
  img.alt = caption;
  img.loading = 'lazy';
  img.decoding = 'async';
  link.append(img);
  photoGrid.append(link);
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showPhoto(index);
    viewer.showModal();
  });
  return link;
});
function showPhoto(index) {
  photoIndex = (index + captions.length) % captions.length;
  fullPhoto.src = photoLinks[photoIndex].href;
  fullPhoto.alt = captions[photoIndex];
  $('photo-count').textContent = (photoIndex + 1) + ' / ' + captions.length;
}
$('previous-photo').addEventListener('click', () => showPhoto(photoIndex - 1));
$('next-photo').addEventListener('click', () => showPhoto(photoIndex + 1));
viewer.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showPhoto(photoIndex - 1);
  if (event.key === 'ArrowRight') showPhoto(photoIndex + 1);
});
viewer.addEventListener('close', () => photoLinks[photoIndex].focus({preventScroll:true}));
document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => $(button.dataset.close).close());
});
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    target.classList.remove('waiting');
    observer.unobserve(target);
  }), {threshold:.1});
  document.querySelectorAll('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top > innerHeight) element.classList.add('waiting');
    observer.observe(element);
  });
}

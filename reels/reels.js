const reelCards = [...document.querySelectorAll('.reel-card')];
const reelDialog = document.querySelector('#reel-player');
const reelVideo = reelDialog.querySelector('video');
const reelTitle = document.querySelector('#reel-title');
const reelCount = document.querySelector('#reel-count');
const reelProgress = reelDialog.querySelector('.reel-progress i');
let currentReel = 0;
let reelTrigger;

function showReel(index) {
  currentReel = (index + reelCards.length) % reelCards.length;
  const card = reelCards[currentReel];
  reelTitle.textContent = card.querySelector('.reel-label').textContent;
  reelCount.textContent = `${currentReel + 1} / ${reelCards.length}`;
  reelVideo.poster = card.querySelector('img').src;
  reelDialog.classList.remove('is-playing');
  reelProgress.style.transform = 'scaleX(0)';
  reelVideo.src = card.dataset.clip;
  reelVideo.play().catch(() => {
    // The native play button remains available if the browser blocks playback.
  });
}

reelCards.forEach((card, index) => {
  card.addEventListener('click', () => {
    reelTrigger = card;
    reelDialog.showModal();
    showReel(index);
  });
});

document.querySelector('#reel-previous').addEventListener('click', () => showReel(currentReel - 1));
document.querySelector('#reel-next').addEventListener('click', () => showReel(currentReel + 1));

reelVideo.addEventListener('playing', () => reelDialog.classList.add('is-playing'));
for (const event of ['pause', 'ended', 'waiting', 'error']) {
  reelVideo.addEventListener(event, () => reelDialog.classList.remove('is-playing'));
}
reelVideo.addEventListener('timeupdate', () => {
  const progress = reelVideo.duration ? reelVideo.currentTime / reelVideo.duration : 0;
  reelProgress.style.transform = `scaleX(${progress})`;
});

reelDialog.addEventListener('close', () => {
  reelVideo.pause();
  reelVideo.removeAttribute('src');
  reelVideo.load();
  reelTrigger?.focus();
});

(() => {
  const audio = document.getElementById('birthday-music');
  const button = document.getElementById('birthday-music-toggle');
  const label = button.querySelector('.music-label');
  let waitingForTap = false;

  function updateButton() {
    const playing = !audio.paused && !audio.ended;
    label.textContent = playing ? 'Pause birthday music' : 'Play birthday music';
  }

  function play() {
    return audio.play().catch((error) => {
      if (error.name === 'NotAllowedError') waitingForTap = true;
      updateButton();
    });
  }

  audio.addEventListener('playing', () => {
    waitingForTap = false;
    updateButton();
  });
  audio.addEventListener('pause', updateButton);
  audio.addEventListener('ended', updateButton);

  button.addEventListener('click', () => {
    if (audio.paused) play();
    else audio.pause();
  });

  document.getElementById('open-letter').addEventListener('click', (event) => {
    if (waitingForTap && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) play();
  });

  document.getElementById('reel-player').addEventListener('play', () => {
    audio.pause();
  }, true);

  play();
})();

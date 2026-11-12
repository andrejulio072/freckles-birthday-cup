'use strict';

const bonusDialog = document.getElementById('bonus-dialog');
const bonusTitle = document.getElementById('bonus-title');
const bonusHelp = document.getElementById('bonus-help');
const bonusStage = document.getElementById('bonus-stage');
const bonusStatus = document.getElementById('bonus-status');
const bonusRetry = document.getElementById('bonus-retry');
const directions = {ArrowUp: [0,-1], ArrowLeft: [-1,0], ArrowDown: [0,1], ArrowRight: [1,0]};
const cones = new Set(['1,0','1,1','3,1','3,2','1,3']);
const episodes = [
  {title:'The car park', prompt:'I’m trying to reverse into a space. What can I already hear in my head?', choices:['The parking sensors working overtime','You laughing from the office','A round of applause'], answer:1, line:'That laugh starts before the handbrake goes on.'},
  {title:'The dating debrief', prompt:'I walk in with “Right, you’ll never guess what happened.” What comes next?', choices:['A quiet shift','A quick story with no detours','An episode you have to stop and hear'], answer:2, line:'The date lasted one evening. The debrief somehow got a second season.'},
  {title:'The shift swap', prompt:'I said I’d swap if you wore my PT shirt. What did it look like on you?', choices:['A dress','A perfectly fitted uniform','A HYROX race bib'], answer:0, line:'One shift swap. One PT shirt dress. An entire photo gallery.'}
];
let bonusGame;
let bonusOpener;
let parking;
let episode;
let episodeScore;
let answered;

function parkingBoard() {
  const grid = document.createElement('div');
  grid.className = 'parking-grid';
  grid.setAttribute('aria-hidden', 'true');
  for (let y=0; y<4; y++) {
    for (let x=0; x<5; x++) {
      const cell = document.createElement('span');
      const isBay = x===4 && y===0;
      if (isBay) { cell.className='parking-bay'; cell.textContent='P'; }
      if (cones.has(x+','+y)) { cell.className='parking-cone'; cell.textContent='▲'; }
      if (x===parking.x && y===parking.y) {
        cell.classList.add('car-cell');
        cell.textContent='🚗';
      }
      grid.append(cell);
    }
  }
  bonusStage.querySelector('.parking-grid')?.remove();
  bonusStage.prepend(grid);
}
function drive(key) {
  if (parking.done) return;
  const [dx,dy] = directions[key];
  const x=parking.x+dx, y=parking.y+dy;
  if (x<0 || x>4 || y<0 || y>3 || cones.has(x+','+y)) {
    bonusStatus.textContent='Freckles is definitely laughing. Try another direction.';
    return;
  }
  parking.x=x;
  parking.y=y;
  parking.moves++;
  parking.done=x===4 && y===0;
  parkingBoard();
  if (parking.done) {
    bonusStatus.textContent='Parked in '+parking.moves+' moves. The office has gone suspiciously quiet.';
    bonusStage.classList.add('bonus-win');
    bonusStage.querySelectorAll('button').forEach(button=>button.disabled=true);
    bonusRetry.hidden=false;
    bonusRetry.focus();
  } else {
    bonusStatus.textContent='Row '+(y+1)+', column '+(x+1)+' · '+parking.moves+' moves.';
  }
}
function showEpisode(moveFocus=false) {
  const card=episodes[episode];
  answered=false;
  bonusStage.replaceChildren();
  const heading=document.createElement('h3');
  heading.textContent=(episode+1)+' / '+episodes.length+' · '+card.title;
  const prompt=document.createElement('p');
  prompt.textContent=card.prompt;
  const options=document.createElement('div');
  options.className='episode-options';
  card.choices.forEach((choice,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='button secondary';
    button.textContent=choice;
    button.addEventListener('click',()=>chooseEpisode(index));
    options.append(button);
  });
  bonusStage.append(heading,prompt,options);
  if (moveFocus) options.querySelector('button').focus();
}
function chooseEpisode(index) {
  if (answered) return;
  answered=true;
  const card=episodes[episode];
  const correct=index===card.answer;
  if (correct) episodeScore++;
  const choices=bonusStage.querySelectorAll('.episode-options button');
  choices.forEach((button,i)=>{
    button.disabled=true;
    if (i===card.answer) button.classList.add('episode-answer');
  });
  bonusStatus.textContent=(correct?'Exactly. ':'Plot twist. ')+card.line;
  if (episode===episodes.length-1) {
    bonusStatus.textContent+=' '+episodeScore+' / '+episodes.length+' right. Season two pending.';
    bonusStage.classList.add('bonus-win');
    bonusRetry.hidden=false;
    bonusRetry.focus();
    return;
  }
  const next=document.createElement('button');
  next.type='button';
  next.className='button primary';
  next.textContent='Next episode';
  next.addEventListener('click',()=>{
    episode++;
    bonusStatus.textContent='';
    showEpisode(true);
  });
  bonusStage.append(next);
  next.focus();
}
function setupBonus() {
  bonusStatus.textContent='';
  bonusStage.replaceChildren();
  bonusStage.className='';
  bonusRetry.hidden=true;
  if (bonusGame==='parking') {
    bonusTitle.textContent='Park It, Andre';
    bonusHelp.textContent='Get to P without hitting the cones. Tap the arrows or use the arrow keys.';
    parking={x:0,y:3,moves:0,done:false};
    const controls=document.createElement('div');
    controls.className='parking-controls';
    [['ArrowUp','↑','Move up'],['ArrowLeft','←','Move left'],['ArrowDown','↓','Move down'],['ArrowRight','→','Move right']].forEach(([key,symbol,label])=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='button secondary';
      button.textContent=symbol;
      button.setAttribute('aria-label',label);
      button.addEventListener('click',()=>drive(key));
      controls.append(button);
    });
    bonusStage.append(controls);
    parkingBoard();
    bonusStatus.textContent='Start at row 4, column 1. The bay is at row 1, column 5.';
  } else {
    bonusTitle.textContent='Previously on Andre';
    bonusHelp.textContent='Pick the next line in each episode.';
    episode=0;
    episodeScore=0;
    showEpisode();
  }
}
document.querySelectorAll('[data-bonus]').forEach(button=>button.addEventListener('click',()=>{
  bonusOpener=button;
  bonusGame=button.dataset.bonus;
  setupBonus();
  bonusDialog.showModal();
  bonusStage.querySelector('button').focus();
}));
bonusRetry.addEventListener('click',()=>{
  setupBonus();
  bonusStage.querySelector('button').focus();
});
bonusDialog.addEventListener('keydown',event=>{
  if (bonusGame!=='parking' || !Object.hasOwn(directions,event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
  event.preventDefault();
  if (!event.repeat) drive(event.key);
});
bonusDialog.addEventListener('close',()=>bonusOpener?.focus({preventScroll:true}));

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
  {title:'The shift swap', prompt:'I said I’d swap if you wore my PT shirt. What did it look like on you?', choices:['A dress','A perfectly fitted uniform','A HYROX race bib'], answer:0, line:'I offered you a shift swap and somehow got a whole photo gallery of you in my PT shirt.'},
  {title:'The short version', prompt:'When I tell you I’ll give you the short version, how much time should you set aside?', choices:['An afternoon, just in case','Thirty seconds','Exactly one ad break'], answer:0, line:'I always think I can tell it quickly, and then I remember the bit I left out.'},
  {title:'The unofficial campaign', prompt:'What did I actually ask you to do in exchange for swapping the shift?', choices:['Film seven reels','Wear my PT shirt','Teach me to park'], answer:1, line:'All I asked for was the shirt, and somehow I got reels, photos and a car in the campaign.'},
  {title:'The big reunion', prompt:'Since you left the gym, what’s been piling up for the next time I see you?', choices:['My perfectly parked cars','A wardrobe of fitted PT shirts','The stories I still need to tell you'], answer:2, line:'I’ve got so much to catch you up on that I’m already thinking about where to start.'},
  {title:'The birthday penalty', prompt:'If you’re charging me a penalty for being a day late, what would I rather do?', choices:['Wall balls','Reverse park while you watch','Let you review the footage of me parking'], answer:0, line:'I’ll take the wall balls because at least the target stays in front of me.'},
  {title:'The recurring character', prompt:'What do I think about now whenever I’m making a mess of parking?', choices:['Booking another driving lesson','You watching from the office and laughing','Whether I can count it as HYROX training'], answer:1, line:'You don’t even have to be there anymore, and I can still hear you laughing.'}
];
let bonusGame;
let bonusOpener;
let parking;
let episode;
let episodeScore;
let answered;
let bonusTimer;

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
  clearTimeout(bonusTimer);
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
  } else if (bonusGame==='shirt') {
    setupShirtCatch();
  } else if (bonusGame==='memory') {
    setupMemoryMatch();
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
bonusDialog.addEventListener('close',()=>{
  clearTimeout(bonusTimer);
  bonusOpener?.focus({preventScroll:true});
});

function endBonus(message) {
  bonusStatus.textContent=message;
  bonusStage.classList.add('bonus-win');
  bonusRetry.hidden=false;
  bonusRetry.focus();
}

function setupShirtCatch() {
  bonusTitle.textContent='Catch My PT Shirt';
  bonusHelp.textContent='Tap the spot holding the shirt before it moves. On a keyboard, use 1, 2 or 3.';
  const start=document.createElement('button');
  start.type='button';
  start.className='button primary';
  start.textContent='Start the 12-second round';
  bonusStage.append(start);
  start.addEventListener('click',()=>{
    const end=performance.now()+12000;
    let hits=0;
    let target=-1;
    let nextMove=0;
    const stats=document.createElement('p');
    const lanes=document.createElement('div');
    lanes.className='shirt-lanes';
    const buttons=Array.from({length:3},(_,i)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='button secondary';
      button.addEventListener('click',()=>{
        if (target!==i || performance.now()>=end) return;
        hits++;
        pickLane();
        updateLanes();
      });
      lanes.append(button);
      return button;
    });
    function pickLane() {
      target=(target+1+Math.floor(Math.random()*2)+3)%3;
      nextMove=performance.now()+950;
    }
    function updateLanes() {
      buttons.forEach((button,i)=>{
        button.classList.toggle('has-shirt',i===target);
        button.textContent=i===target?'👕':String(i+1);
        button.setAttribute('aria-label',i===target?'Spot '+(i+1)+', shirt':'Spot '+(i+1)+', empty');
      });
      stats.textContent=hits+' caught · '+Math.max(0,Math.ceil((end-performance.now())/1000))+' s left';
    }
    function tickShirt() {
      if (!bonusDialog.open || bonusGame!=='shirt') return;
      const now=performance.now();
      if (now>=end) {
        target=-1;
        updateLanes();
        buttons.forEach(button=>button.disabled=true);
        endBonus('You caught '+hits+(hits===1?' shirt. ':' shirts. ')+(hits?'Fine, I’ll swap.':'I’ve seen you move faster when I say I’ve got a story.'));
        return;
      }
      if (now>=nextMove) pickLane();
      updateLanes();
      bonusTimer=setTimeout(tickShirt,100);
    }
    lanes.addEventListener('keydown',event=>{
      if (!['1','2','3'].includes(event.key) || event.repeat) return;
      event.preventDefault();
      buttons[Number(event.key)-1].click();
    });
    bonusStage.replaceChildren(stats,lanes);
    pickLane();
    tickShirt();
    buttons[0].focus();
  });
}

function setupMemoryMatch() {
  bonusTitle.textContent='Match the Evidence';
  bonusHelp.textContent='Flip two cards at a time. Find all four photo pairs.';
  const cards=[2,4,5,6,2,4,5,6];
  const descriptions={2:'Car pose',4:'Banner pose',5:'Stair railing',6:'PT shirt'};
  for (let i=cards.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [cards[i],cards[j]]=[cards[j],cards[i]];
  }
  const grid=document.createElement('div');
  grid.className='evidence-grid';
  let first;
  let locked=false;
  let matches=0;
  let turns=0;
  function hidePhoto(button) {
    button.classList.remove('revealed');
    button.textContent='?';
    button.setAttribute('aria-label','Hidden photo '+button.dataset.slot);
  }
  cards.forEach((photo,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.dataset.slot=String(index+1);
    hidePhoto(button);
    button.addEventListener('click',()=>{
      if (locked || button===first?.button) return;
      const img=new Image();
      img.src='photos/lauren-'+photo+'-small.webp';
      img.alt='';
      button.replaceChildren(img);
      button.classList.add('revealed');
      button.setAttribute('aria-label',descriptions[photo]+', card '+(index+1));
      if (!first) {
        first={button,photo};
        return;
      }
      turns++;
      if (first.photo===photo) {
        matches++;
        first.button.disabled=true;
        button.disabled=true;
        first=undefined;
        if (matches===4) {
          endBonus('All four pairs in '+turns+' turns. I really did get a lot of mileage out of that shift swap.');
        } else {
          bonusStatus.textContent=matches+' / 4 pairs found.';
          grid.querySelector('button:not(:disabled)').focus();
        }
        return;
      }
      locked=true;
      bonusStatus.textContent='Different photos. Try another pair.';
      bonusTimer=setTimeout(()=>{
        hidePhoto(first.button);
        hidePhoto(button);
        first=undefined;
        locked=false;
      },800);
    });
    grid.append(button);
  });
  bonusStage.append(grid);
}

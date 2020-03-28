const STAVE_OFFSET_LEFT = 140
const STAVE_OFFSET_TOP = 45
const PLAY_COLOUR = 'crimson'
let notes = []
let bases = []
let playButton = null
let playPanel = null
let fullTune = null

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNotePlayer(ellipse, stem, audio, text) {
  return async function() {
    if (audio.readyState < 2) {
      audio.load()
    }
    let stemDisplay = stem.style.display

    ellipse.setAttributeNS(null, 'fill', PLAY_COLOUR)
    stem.setAttributeNS(null, 'stroke', PLAY_COLOUR)
    text.setAttributeNS(null, 'fill', PLAY_COLOUR)
    text.setAttributeNS(null, 'stroke', PLAY_COLOUR)
    stem.style.display = ''

    audio.play();
    await sleep(200);

    ellipse.setAttributeNS(null, 'fill', 'black')
    stem.setAttributeNS(null, 'stroke', 'black')
    stem.style.display = stemDisplay
    text.setAttributeNS(null, 'fill', 'black')
    text.setAttributeNS(null, 'stroke', '')
  };
}

async function playTune() {
  playButton.disabled = true
  deactivateCurrentCell()
  deactivateCurrentClue()
  if (fullTune.readyState < 4) {
    fullTune.load()
  }
  await sleep(1000);

  fullTune.play()
  const GAP_MS = 300
  let lastNote = null
  for (let note of notes) {
    if (lastNote) {
      lastNote.ellipse.setAttributeNS(null, 'fill', 'black')
      lastNote.stem.setAttributeNS(null, 'stroke', 'black')
      lastNote.text.setAttributeNS(null, 'fill', 'black')
      lastNote.text.setAttributeNS(null, 'stroke', '')
    }
    note.ellipse.setAttributeNS(null, 'fill', PLAY_COLOUR)
    note.stem.setAttributeNS(null, 'stroke', PLAY_COLOUR)
    note.text.setAttributeNS(null, 'fill', PLAY_COLOUR)
    note.text.setAttributeNS(null, 'stroke', PLAY_COLOUR)
    lastNote = note
    await sleep(GAP_MS);
  }
  if (lastNote) {
    lastNote.ellipse.setAttributeNS(null, 'fill', 'black')
    lastNote.stem.setAttributeNS(null, 'stroke', 'black')
    lastNote.text.setAttributeNS(null, 'fill', 'black')
    lastNote.text.setAttributeNS(null, 'stroke', '')
  }
  playButton.disabled = false
}

function makeStem(row, col, h) {
  let x = 0.0 + STAVE_OFFSET_LEFT + GRIDLINE + (col * (GRIDLINE + SQUARE_DIM))
  let y = 0.0 + STAVE_OFFSET_TOP + GRIDLINE + (row * (GRIDLINE + SQUARE_DIM))
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttributeNS(null, 'stroke', 'black');
  line.setAttributeNS(null, 'stroke-width', 3);
  line.setAttributeNS(null, 'x1', x);
  line.setAttributeNS(null, 'x2', x);
  line.setAttributeNS(null, 'y1', y);
  line.setAttributeNS(null, 'y2', y - (h * (GRIDLINE + SQUARE_DIM)))
  line.style.display = 'none'
  svg.appendChild(line)
  return line
}

function makeNote(row, col, noteFile, stemRow, stemCol, stemH, text) {
  let audio = document.createElement('audio')
  audio.controls = false
  audio.preload = 'auto'
  audio.setAttributeNS(null, 'src', noteFile)
  audio.setAttributeNS(null, 'type', 'audio/mpeg')
  playPanel.appendChild(audio)

  let x = 0.0 + STAVE_OFFSET_LEFT + GRIDLINE +
    (col * (GRIDLINE + SQUARE_DIM)) + CIRCLE_RADIUS
  let y = 0.0 + STAVE_OFFSET_TOP + GRIDLINE +
    (row * (GRIDLINE + SQUARE_DIM)) + CIRCLE_RADIUS
  const ellipse =
    document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttributeNS(null, 'cx', x)
  ellipse.setAttributeNS(null, 'cy', y)
  ellipse.setAttributeNS(null, 'rx', 17)
  ellipse.setAttributeNS(null, 'ry', 12)
  ellipse.setAttributeNS(null, 'transform', 'rotate(-28,' + x + ',' + y + ')')
  ellipse.setAttributeNS(null, 'class', 'clickable')
  svg.appendChild(ellipse)
  let stem = makeStem(stemRow, stemCol, stemH)
  ellipse.addEventListener(
    'click', getNotePlayer(ellipse, stem, audio, text));
  return {
    'ellipse': ellipse,
    'stem': stem,
    'audio': audio,
    'text': text,
  }
}

function makeBase(row, col, w) {
  let x = 0.0 + STAVE_OFFSET_LEFT + GRIDLINE + (col * (GRIDLINE + SQUARE_DIM))
  let y = -2.0 + STAVE_OFFSET_TOP + GRIDLINE + (row * (GRIDLINE + SQUARE_DIM))
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttributeNS(null, 'stroke', 'black');
  line.setAttributeNS(null, 'stroke-width', 6);
  line.setAttributeNS(null, 'x1', x);
  line.setAttributeNS(null, 'x2', x + w * (GRIDLINE + SQUARE_DIM));
  line.setAttributeNS(null, 'y1', y);
  line.setAttributeNS(null, 'y2', y)
  line.style.display = 'none'
  svg.appendChild(line)
  return line
}

updateAndSaveState = (function() {
  var cached_function = updateAndSaveState;
  return function() {
    cached_function.apply(this);
    if (!playPanel) {
      return
    }
    if (numCellsFilled == numCellsToFill) {
      playPanel.style.display = ''
      background.setAttributeNS(null, 'fill', 'lightgray');
      for (let note of notes) {
        note.stem.style.display = ''
      }
      for (let base of bases) {
        base.style.display = ''
      }
    } else {
      playPanel.style.display = 'none'
      background.setAttributeNS(null, 'fill', gridBackground);
      for (let note of notes) {
        note.stem.style.display = 'none'
      }
      for (let base of bases) {
        base.style.display = 'none'
      }
    }
  }
})();


function customizePuzzle() {
  for (let n = 0; n < 5; n++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttributeNS(null, 'stroke', 'black');
    line.setAttributeNS(null, 'stroke-width', 2);
    let x1 = 0
    let x2 = (2 * STAVE_OFFSET_LEFT) + boxWidth
    let y = STAVE_OFFSET_TOP + GRIDLINE + (n + 1) * (GRIDLINE + SQUARE_DIM)
    line.setAttributeNS(null, 'x1', x1);
    line.setAttributeNS(null, 'x2', x2);
    line.setAttributeNS(null, 'y1', y);
    line.setAttributeNS(null, 'y2', y);
    svg.appendChild(line)
  }
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttributeNS(null, 'stroke', 'black');
  line.setAttributeNS(null, 'stroke-width', 2);
  line.setAttributeNS(null, 'x1', 0);
  line.setAttributeNS(null, 'x2', 0);
  line.setAttributeNS(null, 'y1',
    (STAVE_OFFSET_TOP + GRIDLINE + (GRIDLINE + SQUARE_DIM)));
  line.setAttributeNS(null, 'y2',
    (STAVE_OFFSET_TOP + GRIDLINE + 5 * (GRIDLINE + SQUARE_DIM)));
  svg.appendChild(line)

  const clefSig =
    document.createElementNS('http://www.w3.org/2000/svg', 'image');
  clefSig.setAttributeNS(null, 'href', 'kr-clef-sig.png');
  clefSig.setAttributeNS(null, 'x', 0);
  clefSig.setAttributeNS(null, 'height', 233);
  clefSig.setAttributeNS(null, 'width', 144);
  clefSig.setAttributeNS(null, 'y', 32);
  svg.appendChild(clefSig)

  const sharp1 =
    document.createElementNS('http://www.w3.org/2000/svg', 'image');
  sharp1.setAttributeNS(null, 'href', 'kr-sharp.png');
  sharp1.setAttributeNS(null, 'x',
    5 + STAVE_OFFSET_LEFT + 7 * (GRIDLINE + SQUARE_DIM));
  sharp1.setAttributeNS(null, 'height', 43);
  sharp1.setAttributeNS(null, 'width', 22);
  sharp1.setAttributeNS(null, 'y', 0);
  svg.appendChild(sharp1)

  const sharp2 =
    document.createElementNS('http://www.w3.org/2000/svg', 'image');
  sharp2.setAttributeNS(null, 'href', 'kr-sharp.png');
  sharp2.setAttributeNS(null, 'x',
    5 + STAVE_OFFSET_LEFT + 15 * (GRIDLINE + SQUARE_DIM));
  sharp2.setAttributeNS(null, 'height', 43);
  sharp2.setAttributeNS(null, 'y', 0);
  svg.appendChild(sharp2)

  const gp = document.getElementById('grid-parent')
  playPanel = document.createElement('div');
  playPanel.style.display = 'none';
  playPanel.style.position = 'absolute';
  playPanel.style.textAlign = 'center';
  playPanel.style.top = '260px';
  playPanel.style.left =
    '' + (STAVE_OFFSET_LEFT + 14 * (GRIDLINE + SQUARE_DIM)) + 'px'
  gp.appendChild(playPanel);
  
  fullTune = document.createElement('audio')
  fullTune.preload = 'auto'
  fullTune.controls = false
  fullTune.setAttributeNS(null, 'src', 'kr-fe.mp3')
  fullTune.setAttributeNS(null, 'type', 'audio/mpeg')
  playPanel.appendChild(fullTune)

  let texts = svg.getElementsByTagName('text')

  notes.push(makeNote(1, 3, 'kr-E.mp3', 5, 3, 3.4, texts[77]))

  notes.push(makeNote(1.5, 7, 'kr-Dsharp.mp3', 5, 7, 2.9, texts[116]))

  bases.push(makeBase(5, 3, 4))

  notes.push(makeNote(1, 11, 'kr-E.mp3', 6, 11, 4.4, texts[85]))

  notes.push(makeNote(1.5, 15, 'kr-Dsharp.mp3', 6, 15, 3.9, texts[122]))

  notes.push(makeNote(1, 19, 'kr-E.mp3', 6, 19, 4.4, texts[93]))

  notes.push(makeNote(2.5, 23, 'kr-B.mp3', 6, 23, 2.9, texts[164]))

  notes.push(makeNote(1.5, 27, 'kr-D.mp3', 6, 27, 3.9, texts[130]))

  notes.push(makeNote(2, 31, 'kr-C.mp3', 6, 31, 3.4, texts[134]))

  bases.push(makeBase(6, 11, 20))

  notes.push(makeNote(3, 34.01, 'kr-A.mp3', 0, 35, -3.45, texts[173]))

  playButton = document.createElement('button');
  playButton.setAttributeNS(null, 'class', 'button');
  playButton.innerHTML =
    'Play tune! <span style="font-size:large">&rtrif;</span>'
  playButton.addEventListener('click', playTune);
  playPanel.appendChild(playButton);

  playPanel.insertAdjacentHTML('beforeend',
    '<div style="color:green">You can also click on any note appearing in the grid</div>')

  updateAndSaveState()
}


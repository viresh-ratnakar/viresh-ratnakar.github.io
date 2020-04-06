function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}

function getLight(clueIndex) {
  let light = ''
  for (let rowcol of clues[clueIndex].cells) {
    light = light + grid[rowcol[0]][rowcol[1]].currentLetter
  }
  return light
}

function getEnd(clueIndex) {
  let c = clues[clueIndex].cells
  return c[c.length - 1]
}

function getStart(clueIndex) {
  let c = clues[clueIndex].cells
  return c[0]
}

let pathByKey = {}
let litPaths = []
let w1 = []
let w2 = []
let p1 = {}
let p2 = {}
const PATH_OFFSET = 6
const PATH_THICKNESS = 3
let lim = null
let lh = null

function join(rc1, rc2, color) {
  const path =
    document.createElementNS('http://www.w3.org/2000/svg', 'g');
  path.style.display = 'none'
  svg.appendChild(path)
  if (rc1[0] > rc2[0]) {
    let temp = rc1
    rc1 = rc2
    rc2 = temp
  }
  let row = rc1[0]
  let col = rc1[1]
  let vert_y = -1
  let vert_x = GRIDLINE + (col + 1) * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET
  let vert_height = 0
  while (row < rc2[0]) {
    const pathRect =
      document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pathRect.setAttributeNS(
            null, 'x',
            GRIDLINE + (col + 1) * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET);
    pathRect.setAttributeNS(
            null, 'y',
            GRIDLINE + (row + 1) * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET);
    pathRect.setAttributeNS(null, 'width', PATH_THICKNESS);
    pathRect.setAttributeNS(null, 'height', SQUARE_DIM + GRIDLINE);
    pathRect.setAttributeNS(null, 'fill', color);
    path.appendChild(pathRect)
    if (vert_y < 0) {
      vert_y = GRIDLINE + (row + 1) * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET
    }
    vert_height += SQUARE_DIM + GRIDLINE
    row = row + 1
  }
  let deltax = 1
  if (col > rc2[1]) {
    deltax = -1
  }
  let hor_x = -1
  let hor_y = GRIDLINE + (row + 1) * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET
  let hor_width = 0
  while (col != rc2[1]) {
    const pathRect =
      document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    let x = col + 1
    if (deltax < 0) {
      x = col
    }
    pathRect.setAttributeNS(
            null, 'x',
            GRIDLINE + x * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET);
    pathRect.setAttributeNS(
            null, 'y',
            GRIDLINE + (row + 1) * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET);
    pathRect.setAttributeNS(null, 'height', PATH_THICKNESS);
    pathRect.setAttributeNS(null, 'width', SQUARE_DIM + GRIDLINE);
    pathRect.setAttributeNS(null, 'fill', color);
    path.appendChild(pathRect)
    if (hor_x < 0 || deltax < 0) {
      hor_x = GRIDLINE + x * (SQUARE_DIM + GRIDLINE) - PATH_OFFSET
    }
    hor_width += SQUARE_DIM + GRIDLINE
    col = col + deltax
  }
  // Add worm rings
  const WORM_SEGMENT = 5
  const WORM_THICKNESS = 1
  for (let worm_y = vert_y + WORM_SEGMENT; worm_y < vert_y + vert_height;
       worm_y += WORM_SEGMENT + WORM_THICKNESS) {
    const ringRect =
      document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ringRect.setAttributeNS(null, 'x', vert_x)
    ringRect.setAttributeNS(null, 'y', worm_y)
    ringRect.setAttributeNS(null, 'width', PATH_THICKNESS);
    ringRect.setAttributeNS(null, 'height', WORM_THICKNESS);
    ringRect.setAttributeNS(null, 'fill', 'black');
    path.appendChild(ringRect)
  }
  for (let worm_x = hor_x + WORM_SEGMENT; worm_x < hor_x + hor_width;
       worm_x += WORM_SEGMENT + WORM_THICKNESS) {
    const ringRect =
      document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ringRect.setAttributeNS(null, 'x', worm_x)
    ringRect.setAttributeNS(null, 'y', hor_y)
    ringRect.setAttributeNS(null, 'width', WORM_THICKNESS);
    ringRect.setAttributeNS(null, 'height', PATH_THICKNESS);
    ringRect.setAttributeNS(null, 'fill', 'black');
    path.appendChild(ringRect)
  }
  return path
}

// Cute padder from https://gist.github.com/1180489
function pad(a,b){return(1e15+a+"").slice(-b)}

function setupWh() {
  w1 = ['A14', 'D21', 'A24', 'D31', 'D34']
  w2 = ['D9', 'D11', 'D16', 'A32', 'A41']
  for (let idx of w1) {
    p1[idx] = getEnd(idx)
  }
  for (let idx of w2) {
    p2[idx] = getStart(idx)
  }
  let colors = ['sandybrown', 'lightgreen', 'orange', 'pink', 'lightblue']
  let ci = 0
  for (let idx1 of w1) {
    let color = colors[ci]
    ci = ci + 1
    for (let idx2 of w2) {
      let rc1 = p1[idx1]
      let rc2 = p2[idx2]
      pathByKey[idx1 + idx2] = join(rc1, rc2, color)
    }
  }
}

// Override updateAndSaveState() to check wormhole crossers.
updateAndSaveState = (function() {
  var cached_function = updateAndSaveState;
  return function() {
    cached_function.apply(this);
    for (let path of litPaths) {
      path.style.display = 'none'
    }
    litPaths = []
    let lw1 = {}
    for (let idx of w1) {
      lw1[idx] = getLight(idx)
    }
    let lw2 = {}
    for (let idx of w2) {
      lw2[idx] = getLight(idx)
    }
    let pds = [0,0,0,0,0]
    for (let idx1 of w1) {
      for (let idx2 of w2) {
        let rc1 = p1[idx1]
        let rc2 = p2[idx2]
        let dist = Math.abs(rc1[0] - rc2[0]) + Math.abs(rc1[1] - rc2[1])
        let hc = hashCode(lw1[idx1] + lw2[idx2] + idx1 + idx2)
        let found = true
        if (hc == 1750500808) {
          pds[0] = dist
        } else if (hc == 1427268095) {
          pds[1] = dist
        } else if (hc == 1908734353) {
          pds[2] = dist
        } else if (hc == -629716546) {
          pds[3] = dist
        } else if (hc == -1101400181) {
          pds[4] = dist
        } else {
          found = false
        }
        if (found) {
          let path = pathByKey[idx1 + idx2]
          path.style.display = ''
          litPaths.push(path)
        }
      }
    }
    for (let i of [0,1,2,3,4]) {
      let pdh = pad(pds[i], 2)
      let e = document.getElementById('pd' + i)
      e.innerHTML = pad(pds[i], 2)
      if (pds[i] != 0) {
        e.style.color = 'green' 
      } else {
        e.style.color = '' 
      }
    }
    if (lim) {
      if (hashCode(answersList[0].input.value) == 72196554) {
        lim.style.display = ''
        lh.style.display = ''
      } else {
        lim.style.display = 'none'
        lh.style.display = 'none'
      }
    }
  };
})();

function customizePuzzle() {
  setupWh()

  lim = document.createElement('img');
  lim.setAttributeNS(null, 'src', 'gussalufz-19.svg')
  lim.setAttributeNS(null, 'width', 180)
  lim.setAttributeNS(null, 'height', 120)
  lim.style.position = 'relative'
  lim.style.left = '300px'
  lim.style.top = '-170px'
  lim.style.display = 'none'
  let p = document.getElementById('questions')
  p.appendChild(lim)
  lh = document.createElement('span')
  lh.innerHTML = '&#128420;'
  lh.style.color = 'red'
  lh.style.display = 'none'
  answersList[0].input.parentElement.appendChild(lh)

  updateAndSaveState()
}

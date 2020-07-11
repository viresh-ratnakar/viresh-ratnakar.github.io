function setupChA() {
  const elt = document.getElementsByClassName('answer')[0]
  elt.addEventListener('input', chA);
  clearAllButton.addEventListener('click', chA)
  revealAllButton.addEventListener('click', chA)
}

function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}

function chA() {
  const elt = document.getElementsByClassName('answer')[0]
  let eltAltr = document.getElementById('altr')
  let hc = hashCode(elt.value)
  if (hc == 34710129 || hc == 2079330534 || hc == 34697636) {
    if (!eltAltr) {
      eltAltrPar = document.createElement('span');
      eltAltrPar.innerHTML = '&nbsp; <button class="button" style="font-size:10px;padding:4px 8px" onclick="shA()" id="altr">Show Al’s ' + elt.value + ' Trick!</button>'
      const q = document.getElementsByClassName('question')[0]
      q.appendChild(eltAltrPar)
      eltAltr = document.getElementById('altr')
    }
    eltAltr.style.display = ''
  } else {
    if (eltAltr) {
      eltAltr.style.display = 'none'
    }
  }
}

function doA(movers) {
  let midX = (GRIDLINE + (GRIDLINE + SQUARE_DIM)*15)*0.5
  let delta = 1
  let did = false
  for (let row = 0; row < 15; row++) {
    let cell = movers[row][7].cell
    if (!cell) {
      continue
    }
    let x = Number(cell.getAttribute('x'))
    let w = Number(cell.getAttribute('width'))
    if (w > 1) {
      w = w - 2
      x = x + delta
      cell.setAttributeNS(null, 'width', w)
      cell.setAttributeNS(null, 'x', x)
      did = true
    }
  }
  if (did) {
    for (let row = 0; row < 15; row++) {
      for (let e of movers[row][7].others) {
        let x = Number(e.getAttribute('x'))
        x = x + delta
        e.setAttributeNS(null, 'x', x)
      }
    }
    delta++
  } else {
    for (let row = 0; row < 15; row++) {
      let cell = movers[row][7].cell
      if (cell) {
        cell.style.display = 'none'
      }
      for (let e of movers[row][7].others) {
        e.style.display = 'none'
      }
    }
  }
  let midDelta = delta

  for (let col = 6; col >= 3; col--) {
    did = false
    for (let row = 0; row < 15; row++) {
      let cell = movers[row][col].cell
      if (!cell) {
        continue
      }
      let x = Number(cell.getAttribute('x'))
      let w = Number(cell.getAttribute('width'))
      if (w > 0) {
        w = w - 1
        x = x + delta
        if (x + w > midX) {
          w = midX - x
        }
        cell.setAttributeNS(null, 'width', w)
        cell.setAttributeNS(null, 'x', x)
        did = true
      }
    }
    if (did) {
      for (let row = 0; row < 15; row++) {
        for (let e of movers[row][col].others) {
          let x = Number(e.getAttribute('x'))
          x = x + delta
          e.setAttributeNS(null, 'x', x)
        }
      }
      delta++
    } else {
      for (let row = 0; row < 15; row++) {
        let cell = movers[row][col].cell
        if (cell) {
          cell.style.display = 'none'
        }
        for (let e of movers[row][col].others) {
          e.style.display = 'none'
        }
      }
    }
  }
  delta--
  if (delta <= 0) {
    delta = 1
  }

  for (let col = 2; col >= 0; col--) {
    for (let row = 0; row < 15; row++) {
      let cell = movers[row][col].cell
      if (cell) {
        const x = Number(cell.getAttribute('x')) + delta
        cell.setAttributeNS(null, 'x', x)
      }
      for (let e of movers[row][col].others) {
        const x = Number(e.getAttribute('x')) + delta
        e.setAttributeNS(null, 'x', x)
      }
    }
  }

  delta = midDelta

  for (let col = 8; col <= 11; col++) {
    did = false
    for (let row = 0; row < 15; row++) {
      let cell = movers[row][col].cell
      if (!cell) {
        continue
      }
      let x = Number(cell.getAttribute('x'))
      let w = Number(cell.getAttribute('width'))
      if (w > 0) {
        w = w - 1
        x = x - delta
        if (x < midX) {
          w -= (midX - x)
          if (w < 0) {
            w = 0
          }
          x = midX
        }
        cell.setAttributeNS(null, 'width', w)
        cell.setAttributeNS(null, 'x', x)
        did = true
      }
    }
    if (did) {
      for (let row = 0; row < 15; row++) {
        for (let e of movers[row][col].others) {
          let x = Number(e.getAttribute('x'))
          x = x - delta
          e.setAttributeNS(null, 'x', x)
        }
      }
      delta++
    } else {
      for (let row = 0; row < 15; row++) {
        let cell = movers[row][col].cell
        if (cell) {
          cell.style.display = 'none'
        }
        for (let e of movers[row][col].others) {
          e.style.display = 'none'
        }
      }
    }
  }

  for (let col = 12; col < 15; col++) {
    for (let row = 0; row < 15; row++) {
      let cell = movers[row][col].cell
      if (cell) {
        const x = Number(cell.getAttribute('x')) - delta
        cell.setAttributeNS(null, 'x', x)
      }
      for (let e of movers[row][col].others) {
        const x = Number(e.getAttribute('x')) - delta
        e.setAttributeNS(null, 'x', x)
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function obfs(s) {
 o = ''
 m = '42themeaningoflife'
 for (let i = 0; i < s.length; i++) {
   c = s.charCodeAt(i) ^ m.charCodeAt(i % m.length)
   o = o + String.fromCharCode(c)
 }
 return o
}

let aActv = -1

async function shA() {
  if (aActv >= 0) {
    aActv += 5
    return
  }
  let alq = document.getElementById('alq')
  if (!alq) {
    alq = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    alq.setAttributeNS(null, 'id', 'alq')

    let gs = (SQUARE_DIM + GRIDLINE) * gridWidth + GRIDLINE

    alq1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    alq1.setAttributeNS(null, 'x', Math.floor(340 * gs / 481))
    alq1.setAttributeNS(null, 'y', Math.floor(360 * gs / 481))
    alq1.setAttributeNS(null, 'fill', 'white')
    alq1.style.fontSize = '14px'
    const text1 = document.createTextNode(obfs(decodeURIComponent("%16a%11%1A%0C%02%10%12N%19%0B%08%1F%0A%09")))
    alq1.appendChild(text1);
    alq.appendChild(alq1)

    alq2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    alq2.setAttributeNS(null, 'x', Math.floor(340 * gs / 481))
    alq2.setAttributeNS(null, 'y', Math.floor(410 * gs / 481))
    alq2.setAttributeNS(null, 'fill', 'white')
    alq2.style.fontSize = '14px'
    const text2 = document.createTextNode(obfs(decodeURIComponent("YKT%09%02%08E%00%1C%0CN%03%0A%07%08GD")))
    alq2.appendChild(text2);
    alq.appendChild(alq2)

    alq3 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    alq3.setAttributeNS(null, 'x', Math.floor(340 * gs / 481))
    alq3.setAttributeNS(null, 'y', Math.floor(460 * gs / 481))
    alq3.setAttributeNS(null, 'fill', 'white')
    alq3.style.fontSize = '14px'
    const text3 = document.createTextNode(obfs(decodeURIComponent("%E2%80%A0s%18H%2F%0C%03%07%0B%0CBG%5E_%5EXK")))
    alq3.appendChild(text3);
    alq.appendChild(alq3)

    svg.appendChild(alq)
  }
  alq.style.display = ''
  let eltAltr = document.getElementById('altr')
  deactivateCurrentCell()
  eltAltr.disabled = true
  gridInput.style.display = 'none'
  let wasShowingNinas = showingNinas

  const texts = document.getElementsByTagName('text')
  const rects = document.getElementsByTagName('rect')

  let movers = []
  for (let row = 0; row < 15; row++) {
    movers[row] = []
    for (let col = 0; col < 15; col++) {
      movers[row].push({
        'cell': null,
        'cellX': -1,
        'cellW': -1,
        'cellF': '',
        'others': [],
        'othersX': [],
      })
    }
  }
  const elts = []
  for (let i = 0; i < texts.length; i++) {
    elts.push(texts[i])
  }
  for (let i = 0; i < rects.length; i++) {
    elts.push(rects[i])
  }
  let alElts = []

  for (let elt of elts) {
    const x = Number(elt.getAttribute('x'))
    const y = Number(elt.getAttribute('y'))
    const c = elt.getAttribute('class')
    let col = -1
    let row = -1
    if (c == 'cell') {
      col = Math.round((x - GRIDLINE) / (SQUARE_DIM + GRIDLINE))
      row = Math.round((y - GRIDLINE) / (SQUARE_DIM + GRIDLINE))
      movers[row][col].cell = elt
      movers[row][col].cellX = x
      movers[row][col].cellW = Number(elt.getAttribute('width'))
      movers[row][col].cellF = elt.style.fill
      if ((col >= 0 && col <= 2) || (col >= 12 && col <= 14)) {
        if (row >= 0 && row % 2 == 0) {
          alElts.push(elt)
        }
      }
    } else if (c == 'cell-text') {
      col = Math.round((x - LIGHT_START_X) / (SQUARE_DIM + GRIDLINE))
      row = Math.round((y - LIGHT_START_Y) / (SQUARE_DIM + GRIDLINE))
      movers[row][col].others.push(elt)
      movers[row][col].othersX.push(x)
    } else if (c == 'cell-num') {
      col = Math.round((x - NUMBER_START_X) / (SQUARE_DIM + GRIDLINE))
      row = Math.round((y - NUMBER_START_Y) / (SQUARE_DIM + GRIDLINE))
      movers[row][col].others.push(elt)
      movers[row][col].othersX.push(x)
    } else if (c == 'background') {
      const w = Number(elt.getAttribute('width'))
      if (w == BAR_WIDTH) {
        col = Math.round(((x - GRIDLINE + BAR_WIDTH_BY2) / (SQUARE_DIM + GRIDLINE)) - 1)
        if (col == 11) {
          col = 12
        }
        row = Math.round((y - GRIDLINE) / (SQUARE_DIM + GRIDLINE))
        movers[row][col].others.push(elt)
        movers[row][col].othersX.push(x)
      } else if (w == SQUARE_DIM) {
        col = Math.round((x - GRIDLINE) / (SQUARE_DIM + GRIDLINE))
        if (col == 11) {
          col = 12
        }
        row = Math.round(((y - GRIDLINE + BAR_WIDTH_BY2) / (SQUARE_DIM + GRIDLINE)) - 1)
        movers[row][col].others.push(elt)
        movers[row][col].othersX.push(x)
      }
    }
  }

  if (showingNinas) {
    hideNinas()
  }
  let steps = SQUARE_DIM + 2
  for (let s = 0; s < steps; s++) {
    doA(movers)
    await sleep(50)
  }
  for (e of alElts) {
    e.style.fill = 'palegreen'
  }
  aActv = 10
  eltAltr.innerText = '' + aActv + 's, click for more time'
  eltAltr.disabled = false
  while (aActv >= 0) {
    eltAltr.style.background = 'darkgreen'
    await sleep(500)
    eltAltr.style.background = '#4CAF50'
    await sleep(500)
    for (e of alElts) {
      e.style.fill = 'palegreen'
    }
    aActv--
    eltAltr.innerText = (aActv < 10 ? '0' : '') + aActv + 's, click for more time'
  }
  eltAltr.style.background = ''
  let av = document.getElementsByClassName('answer')[0].value
  eltAltr.innerText = 'Show Al’s ' + av + ' Trick!'

  alq.style.display = 'none'
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (movers[row][col].cell) {
        movers[row][col].cell.setAttributeNS(null, 'x', movers[row][col].cellX)
        movers[row][col].cell.setAttributeNS(null, 'width', movers[row][col].cellW)
        movers[row][col].cell.style.fill = movers[row][col].cellF
        movers[row][col].cell.style.display = ''
      }
      if (!movers[row][col].others) {
        continue
      }
      for (let i = 0; i < movers[row][col].others.length; i++) {
        let e = movers[row][col].others[i]
        let x = movers[row][col].othersX[i]
        e.setAttributeNS(null, 'x', x)
        e.style.display = ''
      }
    }
  }
  gridInput.style.display = ''
  if (wasShowingNinas) {
    showNinas()
  }
}

function customizePuzzle() {
  setupChA()
  chA()
}


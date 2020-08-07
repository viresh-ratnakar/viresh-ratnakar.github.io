let puz = null;

function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}

let shuf = []

function getCurrShuf() {
  let allClueTRs = document.getElementsByTagName('tr')
  let indexInAll = [0, 0, 0, 0, 0, 0, 0]
  for (let j = 0; j < shuf.length; j++) {
    let tr = shuf[j]
    for (let i = 26; i < 33; i++) {
      if (allClueTRs[i] == tr) {
        indexInAll[i - 26] = j
        break
      }
    }
  }
  return indexInAll
}

function doShuf(shufIndex, dir) {
  let allClueTRs = document.getElementsByTagName('tr')
  let indexInAll = [0, 0, 0, 0, 0, 0, 0]
  let index = -1
  for (let j = 0; j < shuf.length; j++) {
    let tr = shuf[j]
    for (let i = 26; i < 33; i++) {
      if (allClueTRs[i] == tr) {
        indexInAll[i - 26] = j
        if (j == shufIndex) {
          index = i
        }
        break
      }
    }
  }
  if (index < 26 || index >= 33) {
    addError('Hmm. shuf-index ' + shufIndex + ' found at ' + index)
    return
  }
  let newIndex = index + dir
  if (newIndex < 26 || newIndex >= 33) {
    return
  }
  let tr = shuf[shufIndex]
  if (newIndex == index - 1) {
    tr.parentNode.insertBefore(tr, allClueTRs[newIndex]);
  } else if (newIndex == index + 1) {
    tr.parentNode.insertBefore(allClueTRs[newIndex], tr);
  }
  let temp = indexInAll[index - 26]
  indexInAll[index - 26] = indexInAll[newIndex - 26]
  indexInAll[newIndex - 26] = temp
  let cls = ''
  if (hashCode('' + indexInAll) == -1059631075) {
    cls = 'shuf-green'
  }
  for (let tr of shuf) {
    tr.className = cls
  }
}

function setupShuffle() {
  let allClueTRs = document.getElementsByTagName('tr');
  allClueTRs[25].children[0].colSpan = 4
  for (let i = 33; i < 51; i++) {
    let tr = allClueTRs[i]
    let clueTd = tr.children[1]
    clueTd.colSpan = 3
  }
  for (let i = 0; i < 7; i++) {
    let tr = allClueTRs[26 + i]
    tr.style.borderTop = '2px solid khaki'
    tr.style.borderBottom = '2px solid khaki'
    let clueTd = tr.children[1]
    clueTd.style.paddingBottom = '6px'
    let td1 = document.createElement('td')
    td1.innerHTML =
        '<button class="shuf-button" ' +
        'onclick="let e = arguments[0] || window.event; e.stopPropagation(); ' +
        'doShuf(' + i + ',-1)">&uarr;</button>';
    td1.style.verticalAlign = 'middle'
    tr.appendChild(td1)
    let td2 = document.createElement('td')
    td2.innerHTML =
        '<button class="shuf-button" ' +
        'onclick="let e = arguments[0] || window.event; e.stopPropagation(); ' +
        'doShuf(' + i + ',1)">&darr;</button>';
    td2.style.verticalAlign = 'middle'
    tr.appendChild(td2)
    shuf.push(tr)
  }
}

function addButtonHandlers() {
  puz.revealAllButton.addEventListener('click', function() {
    let y = '' + (hashCode('424242') - 1534060131)
    for (let i = 0; i < 7; i++) {
      let currShuf = getCurrShuf()
      for (let j = i; j < 7; j++) {
        let z = parseInt(y[i])
        if (z == currShuf[j]) {
          for (let k = 0; k < j - i; k++) {
            doShuf(z, -1)
          }
          doShuf(z, 0)
          break;
        }
      }
    }
  });

  puz.revealButton.addEventListener('click', function() {
    doShuf(0, 0)
  })

  puz.clearAllButton.addEventListener('click', function() {
    doShuf(0, 0)
  })
}

function customizeExolve(p) {
  puz = p
  addButtonHandlers()
  setupShuffle()
}


function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}

let bug = null;
let bugFunButton = null;
let bugShow1Button = null;
let bugShow2Button = null;

let circles = [
  {'key': 85663199, 'color': 'brown', 'hash': -1639408043, 'shown': false}, 
  {'key': -1642898820, 'color': 'brown', 'hash': 609744217, 'shown': false}, 
  {'key': 85722843, 'color': 'brown', 'hash': -1637559081, 'shown': false}, 
  {'key': 85633501, 'color': 'brown', 'hash': -1640328692, 'shown': false}, 
  {'key': 85633532, 'color': 'brown', 'hash': -1640327726, 'shown': false}, 
  {'key': 85514399, 'color': 'brown', 'hash': -1644020856, 'shown': false}, 

  {'key': 85752727, 'color': 'green', 'hash': -1636632692, 'shown': false}, 
  {'key': 85693176, 'color': 'green', 'hash': -1638478775, 'shown': false}, 
  {'key': 85752758, 'color': 'green', 'hash': -1636631716, 'shown': false}, 
  {'key': -1642958216, 'color': 'green', 'hash': 607902921, 'shown': false}, 
  {'key': -1644026042, 'color': 'green', 'hash': 574800317, 'shown': false}, 
  {'key': -1636637843, 'color': 'green', 'hash': 803834501, 'shown': false}, 
  {'key': 606973321, 'color': 'green', 'hash': 1636303840, 'shown': false}, 
  {'key': 608820363, 'color': 'green', 'hash': 1693562152, 'shown': false}, 
  {'key': -1640331865, 'color': 'green', 'hash': 689319821, 'shown': false}, 
  {'key': -1639408344, 'color': 'green', 'hash': 717948961, 'shown': false}, 
];
let circlesLU = {}

let keyLocs = [
  610667343,
  610667374,
  610667405,
  610667436
]

function revealer(circle) {
  return function() {
    circle.cellCircle.style.stroke = circle.currStroke
    circle.shown = true
  }
}

function setBugFunVisibility(bugVisible) {
  bugFunButton.disabled = !bugVisible || (bug.puz.currRow < 0) ||
      bug.puz.activeCells.length == 0 ||
      bug.puz.gridInputWrapper.style.display == 'none'
}

function buttonVisibilitySetter() {
  let toShowAndBugVisibility = getToShowAndBugVisibility()
  let visible = toShowAndBugVisibility[1]
  setBugFunVisibility(visible)
  bugShow1Button.disabled = !visible
  bugShow2Button.disabled = !visible
}

function getToShowAndBugVisibility() {
  let unshown = {}
  let keyArray = ['0','0','0','0']
  for (let row = 0; row < bug.puz.gridHeight; row++) {
    for (let col = 0; col < bug.puz.gridWidth; col++) {
      let gridCell = bug.puz.grid[row][col]
      let rc = JSON.stringify([row,col])
      let rcHash = hashCode(rc)
      let keyIndex = keyLocs.indexOf(rcHash)
      if (keyIndex >= 0) {
        keyArray[keyIndex] = gridCell.currLetter
      }
      let circle = circlesLU[rcHash]
      if (!circle) {
        continue
      }
      if (!circle.cellCircle) {
        continue
      }
      let found = gridCell.currLetter &&
        hashCode(rc + gridCell.currLetter) == circle['hash'];
      if (!found) {
        circle.cellCircle.style.stroke = 'transparent'
        circle.currStroke = 'transparent'
        circle.shown = false
      } else {
        circle.currStroke = (row == bug.puz.currRow && col == bug.puz.currCol) ?
          'white' : circle.color
        if (!circle.shown) {
          unshown[circle.index] = [row, col, circle]
        } else {
          circle.cellCircle.style.stroke = circle.currStroke
	}
      }
    }
  }
  return [unshown, hashCode(keyArray.join('')) == 2656935]
}

function replaceHandlers() {

  bug.puz.deactivateCurrCell = (function() {
    var cached_function = bug.puz.deactivateCurrCell
    return function() {
      cached_function.apply(this);
      buttonVisibilitySetter()
    };
  })();

  bug.puz.updateDisplayAndGetState = (function() {
    var cached_function = bug.puz.updateDisplayAndGetState;
    return function() {
      let ret = cached_function.apply(this);
      if (!bug) {
        return ret
      }
      let toShowAndBugVisibility = getToShowAndBugVisibility()
      let visible = toShowAndBugVisibility[1]
      setBugFunVisibility(visible)
      bugShow1Button.disabled = true
      bugShow2Button.disabled = true
      if (!visible) {
        bug.hide()
      } else {
        bug.show()
        let toReveal = toShowAndBugVisibility[0]
        let gridPath = []
        for (let index in toReveal) {
          let reveal = toReveal[index]
          gridPath.push([reveal[0], reveal[1], revealer(reveal[2])])
        }
        if (gridPath.length > 0) {
          if (visible) {
            let last = gridPath[gridPath.length - 1]
            gridPath.push([last[0], last[1], buttonVisibilitySetter])
          }
          bug.gridMoves(gridPath, true)
        } else {
          bugShow1Button.disabled = !visible
          bugShow2Button.disabled = !visible
        }
      }
      return ret
    };
  })();
}

function setUpCircles() {
  let index = 0
  for (let circle of circles) {
    circle.index = index++
    circlesLU[circle.key] = circle
  }
  for (let row = 0; row < bug.puz.gridHeight; row++) {
    for (let col = 0; col < bug.puz.gridWidth; col++) {
      let circle = circlesLU[hashCode(JSON.stringify([row,col]))]
      if (!circle) {
        continue
      }
      const cellCircle =
        document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cellCircle.setAttributeNS(
          null, 'cx',
          bug.puz.cellLeftPos(col, bug.puz.circleR + bug.puz.GRIDLINE));
      cellCircle.setAttributeNS(
          null, 'cy', 
          bug.puz.cellTopPos(row, bug.puz.circleR + bug.puz.GRIDLINE));
      cellCircle.setAttributeNS(null, 'class', 'xlv-cell-circle');
      cellCircle.setAttributeNS(null, 'r', bug.puz.circleR);
      cellCircle.style.stroke = 'transparent'
      circle.currStroke = 'transparent'
      bug.puz.svg.appendChild(cellCircle)
      cellCircle.addEventListener('click',
        bug.puz.cellActivator.bind(bug.puz, row, col));
      circle.cellCircle = cellCircle
    }
  }
}

function bugFun(puz) {
  if (!bug) {
    return
  }
  if (!bug.puz.currCellIsValid()) {
    return
  }
  bug.gridMoveTo(bug.puz.currRow, bug.puz.currCol, buttonVisibilitySetter)
}

function showRange(index1, index2) {
  for (index = index1; index <= index2; index++) {
    circles[index].cellCircle.style.stroke = 'transparent'
    circles[index].shown = false
  }
  let toShowAndBugVisibility = getToShowAndBugVisibility()
  let toReveal = toShowAndBugVisibility[0]
  let visible = toShowAndBugVisibility[1]
  if (!visible) {
    return
  }
  let gridPath = []
  for (let index in toReveal) {
    let reveal = toReveal[index]
    gridPath.push([reveal[0], reveal[1], revealer(reveal[2])])
  }
  bug.gridMoves(gridPath, false)
}

function bugShow1() {
  if (!bug || !bug.visible) {
    return
  }
  showRange(0, 5)
}

function bugShow2() {
  if (!bug || !bug.visible) {
    return
  }
  showRange(6, 15)
}

function customizeExolve(puz) {
  bug = new Bug(14, 14, 'gussalufz-20-bug.svg', puz)

  setUpCircles()
  let buttonRow = document.createElement('div')
  buttonRow.setAttributeNS(null, 'class', 'button-row')
  document.getElementById(puz.prefix + '-controls').appendChild(buttonRow)

  replaceHandlers()

  buttonRow.innerHTML =
    '<span style="color:midnightblue;font-weight:bold;margin-right:1em">' +
       'Bug-related actions:</span> ' +
    '<button id="unlocker-1">Unlocker 1</button> ' +
    '<button id="unlocker-2">Unlocker 2</button> ' +
    '<button id="bug-fun">Timepass</button>';

  bugShow1Button = document.getElementById('unlocker-1')
  bugShow1Button.setAttributeNS(null, 'class', 'xlv-button')
  bugShow1Button.title = 'Help find the first unlocker'
  bugShow1Button.style.fontSize = '11px'
  bugShow1Button.addEventListener('click', bugShow1)

  bugShow2Button = document.getElementById('unlocker-2')
  bugShow2Button.setAttributeNS(null, 'class', 'xlv-button')
  bugShow2Button.title = 'Help find the second unlocker'
  bugShow2Button.style.fontSize = '11px'
  bugShow2Button.addEventListener('click', bugShow2)

  bugFunButton = document.getElementById('bug-fun')
  bugFunButton.setAttributeNS(null, 'class', 'xlv-button')
  bugFunButton.title = 'Just some fun after clicking on a light'
  bugFunButton.style.fontSize = '11px'
  bugFunButton.addEventListener('click', bugFun)

  puz.updateDisplayAndGetState()
}

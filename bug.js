function Bug(row, col, imgSrc) {
  this.getMoveFunction = function(b) {
    return function() {
      b.move()
    }
  }
  this.checkRowCol = function(row, col) {
    if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) {
      return false
    }
    let gridCell = grid[row][col]
    if (!gridCell.cellRect) {
      return false
    }
    return true
  }
  this.xFromGridCell = function(gridCell) {
    return gridCell.cellLeft + (SQUARE_DIM - (5 * this.w / 8) + 1)
  }
  this.yFromGridCell = function(gridCell) {
    return gridCell.cellTop + (SQUARE_DIM - (11 * this.h / 16))
  }


  if (!this.checkRowCol(row, col)) {
    console.log('Invalid location: ' + row + ',' + col)
    return
  }
  this.homeRow = row
  this.homeCol = col

  this.img = document.createElement('img')
  this.img.src = imgSrc
  this.img.style.transform = 'scaleX(-1)'  // flip

  let gridCell = grid[row][col]
  this.w = 24
  this.h = 24
  this.x = this.xFromGridCell(gridCell)
  this.y = this.yFromGridCell(gridCell)

  this.timer = null;
  this.interval = 40  // millis
  this.delta = 4
  this.path = []
  this.pathIndex = 0

  this.img.style.position = 'absolute'
  this.img.style.top = this.y + 'px'
  this.img.style.left = this.x + 'px'
  this.img.style.width = this.w + 'px'
  this.img.style.height = this.h + 'px'

  this.visible = false
  this.img.style.display = 'none'
  document.getElementById('grid-parent').appendChild(this.img)

  this.hide = function() {
    this.visible = false
    this.img.style.display = 'none'
  }
  this.show = function() {
    this.visible = true
    this.img.style.display = ''
  }

  this.adjustMove = function(d) {
    if (d > 0) {
      if (d > this.delta) {
        return(this.delta)
      }
    } else if (d < 0) {
      if (d < 0 - this.delta) {
        return (0 - this.delta)
      }
    }
    return d
  }

  this.addPath = function(targetX, targetY, func = null) {
    if (this.path.length == 0) {
      return
    }
    let x = this.path[this.path.length - 1][0]
    let y = this.path[this.path.length - 1][1]
    while (x != targetX || y != targetY) {
      let xMove = this.adjustMove(targetX - x)
      let yMove = this.adjustMove(targetY - y)
      x = x + xMove
      y = y + yMove
      this.path.push([x, y, []])
    }
    let last = this.path[this.path.length - 1]
    if (func) {
      last[2].push(func)
    }
  }

  this.addPathToNearestGridCell = function() {
    let nearestGridXY = null
    let nearestGridRowCol = null
    let nearestDistanceSq = Number.MAX_SAFE_INTEGER
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        let gridCell = grid[row][col]
        if (!gridCell.cellRect) {
          continue
        }
        let x = this.xFromGridCell(gridCell)
        let y = this.yFromGridCell(gridCell)
        let dSq = ((x - this.x) * (x - this.x)) + ((y - this.y) * (y - this.y))
        if (dSq < nearestDistanceSq) {
          nearestDistanceSq = dSq
          nearestGridXY = [x, y]
          nearestGridRowCol = [row, col]
        }
      }
    }
    if (nearestGridXY) {
      this.addPath(nearestGridXY[0], nearestGridXY[1], null)
    }
    return nearestGridRowCol
  }

  this.move = function() {
    if (!this.timer || !this.path.length ||
        this.pathIndex < 0 || this.pathIndex >= this.path.length) {
      return
    }
    let xyf = this.path[this.pathIndex++]
    this.x = xyf[0]
    this.y = xyf[1]
    this.img.style.top = this.y + 'px'
    this.img.style.left = this.x + 'px'
    for (let f of xyf[2]) {
      f()
    }
    if (this.pathIndex >= this.path.length) {
      clearInterval(this.timer)
      this.timer = null
      this.pathIndex = 0
      this.path = []
    }
  }

  this.addGridPath = function(startRow, startCol, endRow, endCol, func = null) {
    // Solve the maze.
    let best = new Array(gridHeight)
    for (let row = 0; row < gridHeight; row++) {
      best[row] = new Array(gridWidth)
      for (let col = 0; col < gridWidth; col++) {
        best[row][col] = null
      }
    }
    best[startRow][startCol] = {
      'moves': 0,
      'prev': null
    }
    let index = 0
    let candidates = [[startRow, startCol]]
    while (index < candidates.length) {
      let candidate = candidates[index++]
      let row = candidate[0]
      let col = candidate[1]
      let bestForThis = best[row][col]
      let nbrs =
        [[row + 1, col], [row, col + 1], [row - 1, col], [row, col - 1]]
      for (let nbr of nbrs) {
        let nbrRow = nbr[0]
        let nbrCol = nbr[1]
        if (!this.checkRowCol(nbrRow, nbrCol)) {
          continue
        }
        if (!best[nbrRow][nbrCol]) {
          best[nbrRow][nbrCol] = {
            'moves': bestForThis['moves'] + 1,
            'prev': [row, col]
          }
          candidates.push([nbrRow, nbrCol])
        } else if (bestForThis['moves'] + 1 < best[nbrRow][nbrCol]['moves']) {
          best[nbrRow][nbrCol] = {
            'moves': bestForThis['moves'] + 1,
            'prev': [row, col]
          }
        }
      }
    }
    let revPath = [[endRow, endCol]]
    let row = endRow
    let col = endCol
    while (best[row][col] && best[row][col].prev) {
      revPath.push(best[row][col].prev)
      row = revPath[revPath.length - 1][0]
      col = revPath[revPath.length - 1][1]
    }
    
    for (let index = revPath.length - 1; index >= 0; index--) {
      let row = revPath[index][0]
      let col = revPath[index][1]
      if (row == startRow && col == startCol && index > 0) {
        // We will make at least one move.
        continue
      }
      let gridCell = grid[row][col]
      let x = this.xFromGridCell(gridCell)
      let y = this.yFromGridCell(gridCell)
      this.addPath(x, y, index > 0 ? null : func)
    }
  }

  this.gridMoveTo = function(row, col, func = null) {
    this.gridMoves([[row, col, func]], false)
  }

  // gridPath should be an array, with each entry being a [row, col] or
  // [row, col, func]
  this.gridMoves = function(gridPath, goHomeAfterwards = false) {
    if (gridInputWrapper.style.display == '') {
      gridInput.focus()
    }
    this.pathIndex = 0
    this.path = [[this.x, this.y, []]]
    let rc = this.addPathToNearestGridCell()
    if (!rc) {
      console.log('Could not find nearest grid cell')
      return
    }
    let lastRow = rc[0]
    let lastCol = rc[1]
    for (let rcf of gridPath) {
      let row = rcf[0]
      let col = rcf[1]
      if (!this.checkRowCol(row, col)) {
        console.log('Invalid destination: ' + row + ',' + col)
        return
      }
      let f = rcf.length > 2 ? rcf[2] : null
      this.addGridPath(lastRow, lastCol, row, col, f)
      lastRow = row
      lastCol = col
    }
    if (goHomeAfterwards) {
      this.addGridPath(lastRow, lastCol, this.homeRow, this.homeCol, null)
    }
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.timer = setInterval(this.getMoveFunction(this), this.interval)
  }
};

/*
MIT License

Copyright (c) 2022 Viresh Ratnakar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

function ExolveWebifi(webifi, puz) {
  this.webifi = webifi;
  this.name = 'Exolve';
  this.puz = puz;
  this.description = 'An interactive crossword player.';

  this.webifi.registerAvatar(this.name, this.description, {
    'intro': {
      description: 'Describe the crossword, providing info such as grid size, number of clues, title, preamble, etc.',
      prefixes: ['?|intro|introduction|describe|puzzle|crossword'],
    },
    'status': {
      description: 'Get current status and lists unsolved clues in fraction-most-filled order.',
      prefixes: ['status', 'How am I doing', 'unsolved clues'],
    },
    'navigate': {
      description: 'Navigate to a clue by naming it, or say first or last across or down or clue.',
      prefixes: ['[number]', '[number]A|[number]D', '[number] across|down|A|D', 'first|last across|down|clue'],
      helpkeys: ['number', 'jump',],
    },
    'clue': {
      description: 'Read the current clue and its status.',
      prefixes: ['clue', 'read',],
    },
    'crossers': {
      description: 'Describes clues for lights that cross the current lights.',
      prefixes: ['crossers', 'crossing clues', 'crossing lights'],
    },
    'enter': {
      description: 'Enter the solution for the current clue.',
      prefixes: ['enter', 'fill', 'that\'s', 'that|this is', 'that|this should|would be',],
      helpkeys: ['solve', 'solution'],
    },
    'clear': {
      description: 'Clear entries in the current light.',
      prefixes: ['clear', 'clear this', 'clear all',],
    },
    'next': {
      description: 'Go to the next clue.',
      prefixes: ['next', 'next clue'],
    },
    'previous': {
      description: 'Go to the previous clue.',
      prefixes: ['prev', 'previous', 'prev|previous clue'],
    },
    }, this.handler.bind(this));
}

ExolveWebifi.prototype.describe = function() {
  const description = [];
  description.push(`This crossword has ${this.puz.gridHeight} rows and ${this.puz.gridWidth} columns.`);
  if (this.puz.title) description.push('Its title is ' + this.puz.title + ';');
  if (this.puz.setter) description.push('and the setter is ' + this.puz.setter + '.');
  description.push(`There are ${this.puz.allClueIndices.length} clues.`);
  this.webifi.output(this.name, description.join(' '));

  const preamble = document.getElementById(this.puz.prefix + '-preamble').innerText;
  if (preamble) {
    this.webifi.output(this.name, 'Preamble: ' + preamble);
  }
  this.webifi.output(this.name,
      'Here are some commands you can use. Say "help" to get the full list of commands.', [
        '"status" lists unsolved clues in fraction-most-filled order.',
        'You can jump to any clue by entering its number followed optionally by "across" or "down".',
        'You can say "clue" to get the current clue to be read out again.',
        'You can search for clues by saying "clue" or "clue with" followed by words that should all be present in the matching clues.',
        'You can enter solutions by saying "fill" or "enter" followed by the entry.',
        'You can also say "first clue" or "last clue" or "first across clue," etc.',
        'You can navigate through clues in grid order by saying "next" or "previous".']);

}

ExolveWebifi.prototype.status = function() {
  const indicesAndFracs = [];
  let clueCount = 0;
  for (let ci of this.puz.allClueIndices) {
    const clue = this.puz.clues[ci];
    if (!clue || clue.parentClueIndex) {
      continue;
    }
    const cells = this.puz.getAllCells(ci);
    if (!cells || cells.length < 1) {
      continue;
    }
    clueCount++;
    const filled = this.numFilled(cells);
    if (filled == cells.length) {
      continue;
    }
    indicesAndFracs.push([ci, filled, cells.length]);
  }
  if (indicesAndFracs.length == 0 && this.puz.numCellsFilled == this.puz.numCellsToFill) {
    this.webifi.output(this.name,
        `You have completely filled the crossword's ${clueCount} clues and ${this.puz.numCellsToFill} cells`);
    return;
  }
  indicesAndFracs.sort((a, b) => b[1]/b[2] - a[1]/a[2]);
  list = [];
  for (let iAndF of indicesAndFracs) {
    const ci = iAndF[0];
    list.push(this.clueName(ci) + ' has ' + (iAndF[2] - iAndF[1]) + ' unfilled cells, out of ' + iAndF[2] + '. ' + this.readEntry(ci));
  }
  this.webifi.output(this.name,
    `There are ${this.puz.numCellsToFill - this.puz.numCellsFilled} unfilled cells out of ${this.puz.numCellsToFill} cells. ` +
    (indicesAndFracs.length > 1 ?
    `Here are the ${indicesAndFracs.length} unsolved clues out of ${clueCount}, in fraction-most-filled order.` :
    'Here is the last unsolved clue.'),
    list, false);

}


ExolveWebifi.prototype.ensureActiveClue = function() {
  if (this.puz.allClueIndices.length == 0) {
    return;
  }
  if (!this.puz.currClueIndex) {
    this.puz.cnavTo(this.puz.allClueIndices[0]);
  }
  console.assert(this.puz.currClueIndex);
}

ExolveWebifi.prototype.clueName = function(ci) {
  const dir = ci.charAt(0);
  const num = ci.substr(1);
  return num + ' ' + (dir == 'A' ? 'Across' : (dir == 'D' ? 'Down' : dir));
}

ExolveWebifi.prototype.linkedChildrenNames = function(indices) {
  const cnames = [];
  for (let ci of indices) cnames.push(this.clueName(ci));
  return cnames.join(' and ');
}

ExolveWebifi.prototype.readCells = function(cells, pattern) {
  if (!pattern) {
    for (let i = 0; i < cells.length; i++) pattern += '?';
  }
  let ppos = 0;
  let entry = '';
  for (let i = 0; i < cells.length; i++) {
    while (ppos < pattern.length && pattern[ppos] != '?') {
      entry += pattern[ppos++];
    }
    if (ppos >= pattern.length) {
      console.log('Hmm. bad placeholder in ' + clueName + ': ' + pattern);
      break;
    }
    const cell = cells[i];
    const gridCell = this.puz.grid[cell[0]][cell[1]];
    entry += gridCell.currLetter;
    ppos++;
  }
  const spokenChunks = [];
  let blanks = 0;
  let chunk = '';
  let haveBlanks = false;
  for (let letter of entry) {
    if (letter != '0') {
      if (blanks > 0) {
        spokenChunks.push((blanks == 1) ? 'blank,' : ('webifi-escape ' + blanks + ' webifi-escape blanks,'));
      }
      if (letter == ' ' || letter == '-') {
        if (chunk) {
          spokenChunks.push(chunk + ',');
          chunk = '';
        }
        if (letter == '-') {
          spokenChunks.push(letter);
        }
      } else {
        chunk += letter;
      }
      blanks = 0;
    } else {
      if (chunk) {
        spokenChunks.push(chunk + ',');
        chunk = '';
      }
      blanks++;
      haveBlanks = true;
    }
  }
  if (chunk) {
    spokenChunks.push(chunk);
    chunk = '';
  } else if (blanks > 0) {
    spokenChunks.push((blanks == 1) ? 'blank' : ('webifi-escape ' + blanks + ' webifi-escape blanks'));
  }
  let spokenEntry = spokenChunks.join(' ').trim();
  if (spokenEntry.endsWith(',')) {
    spokenEntry = spokenEntry.substr(0, spokenEntry.length - 1);
  }
  if (haveBlanks) {
    spokenEntry = this.webifi.annotateText(spokenEntry);
  }
  if (!spokenEntry.endsWith('.')) {
    spokenEntry += '.';
  }
  return spokenEntry;
}

ExolveWebifi.prototype.readEntry = function(ci) {
  const clue = this.puz.clues[ci];
  if (!clue || clue.parentClueIndex) {
    return '';
  }
  const cells = this.puz.getAllCells(ci);
  const pattern = clue.placeholder || '';
  return this.readCells(cells, pattern);
}

ExolveWebifi.prototype.clue = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  let ci = this.puz.currClueIndex;
  let clueName = this.clueName(ci);
  let clue = this.puz.clues[ci];

  if (clue.parentClueIndex) {
    ci = clue.parentClueIndex;
    const parentName = this.clueName(ci);
    clue = this.puz.clues[ci];
    this.webifi.output(this.name, clueName + ' is a part of the linked clue, ' + parentName + '.');
    clueName = parentName;
  } else if (clue.childenClueIndices && clue.childrenClueIndices.length > 0) {
    const childrenName = this.linkedChildrenNames(clue.childrenClueIndices);
    this.webifi.output(this.name, clueName + '  is a linked clue consisting of ' + childrenName + '.');
  }
  let clueText = clue.clue;
  let enumText = clue.enumStr;
  if (enumText) {
    const loc = clueText.lastIndexOf(enumText);
    if (loc >= 0) {
      clueText = clueText.substr(0, loc);
    }
    enumText = enumText.replace(/,/g, ' comma ').
      replace(/-/g, ' dash ').
      replace(/'/, ' apostrophe ').trim();
    clueText = clueText + ' webifi-escape ... ' + enumText + ' webifi-escape';
  }
  this.webifi.output(this.name,
      clueName + '. ' + this.webifi.annotateText(clueText));
  this.webifi.output(this.name, 'Current entry ... ' + this.readEntry(ci));
}

ExolveWebifi.prototype.crossers = function() {
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  let clue = this.puz.clues[ci];
  if (!clue) retuen;
  let clueName = this.clueName(ci);
  let myIndices = [ci];
  if (clue.childrenClueIndices) {
    myIndices = myIndices.concat(clue.childrenClueIndices);
  }
  // TODO

  const indices = [];
  for (let ci of this.puz.allClueIndices) {
    const clue = this.puz.clues[ci];
    if (!clue || clue.parentClueIndex) {
      continue;
    }
    const cells = this.puz.getAllCells(ci);
    if (!cells || cells.length < 1) {
      continue;
    }
    const filled = this.numFilled(cells);
    if (filled == cells.length) {
      continue;
    }
    indicesAndFracs.push([ci, filled, cells.length]);
  }
}

ExolveWebifi.prototype.numFilled = function(cells) {
  let numFilled = 0;
  for (let cell of cells) {
    if (this.puz.grid[cell[0]][cell[1]].currLetter != '0') {
      numFilled++;
    }
  }
  return numFilled;
}

ExolveWebifi.prototype.next = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  this.puz.cnavNext();
  this.clue();
}

ExolveWebifi.prototype.previous = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  this.puz.cnavPrev();
  this.clue();
}

ExolveWebifi.prototype.navigate = function(num, dir) {
  const givenDir = dir.charAt(0).toUpperCase();
  let ci = (givenDir || this.puz.currDir || '') +  num;
  if (!this.puz.clues[ci] && !givenDir) {
    const otherDir = (this.puz.currDir == 'A') ? 'D' :
        ((this.puz.currDir == 'D') ? 'A' : '');
    if (otherDir) {
      ci = otherDir +  num;
    }
  }
  if (!this.puz.clues[ci]) {
    if (givenDir) {
      this.webifi.output(this.name, 'There is no clue numbered ' + num + ' ' + givenDir + ' in this crossword.');
    } else {
      this.webifi.output(this.name, 'There is no clue numbered ' + num + ' in this crossword.');
    }
    return;
  }
  this.puz.cnavTo(ci, false);
  this.clue();
}

ExolveWebifi.prototype.navFirstLast = function(navWords) {
  if (navWords.length < 2) return;
  let dir = navWords[1].toUpperCase().charAt(0);
  const fl = navWords[0].toLowerCase();
  const indices = this.puz.allClueIndices.slice();
  if (fl == 'first') {
    if (dir != 'A' && dir != 'D') {
      dir = 'A';
    }
  } else if (fl == 'last') {
    if (dir != 'A' && dir != 'D') {
      dir = 'D';
    }
    indices.reverse();
  }
  for (let index of indices) {
    if (index.charAt(0) == dir) {
      this.navigate(index.substr(1), dir);
      return;
    }
  }
}

ExolveWebifi.prototype.clearCurr = function() {
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  this.puz.clearCurr();
  const cells = this.puz.getAllCells(ci);
  const clue = this.puz.clues[ci];
  const pattern = clue.placeholder || '';
  this.webifi.output(this.name, 'Cleared ' + this.clueName(ci) + ', it now reads: ' + this.readCells(cells, pattern));;
  if (this.numFilled(cells) > 0) {
    this.webifi.output(this.name, 'The non-blanks are from full crossers. Another "clear" command can clear them. You can also say "crossers" to find where they are coming from.');
  }
}

ExolveWebifi.prototype.enterInCells = function(cells, letters, clobber=false, warnings=[]) {
  console.assert(cells.length > 0, cells, letters);
  console.assert(cells.length == letters.length, cells, letters);
  let conflict = false;
  let changes = false;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const gridCell = this.puz.grid[cell[0]][cell[1]];
    if (gridCell.currLetter != '0' && (gridCell.currLetter != letters[i])) {
      conflict = true;
      warnings.push('Cell number ' + (i+1) + ' already has ' + gridCell.currLetter + ' instead of ' + letters[i] + '.');
    }
  }
  if (conflict && !clobber) {
    return;
  }
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const row = cell[0];
    const col = cell[1];
    const gridCell = this.puz.grid[row][col];
    const letter = letters[i];
    if (gridCell.currLetter != letter) {
      gridCell.currLetter = letter;
      gridCell.textNode.nodeValue = letter;
      if (this.puz.atCurr(row, col)) {
        this.puz.gridInput.value = letter;
      }
      changes = true;
    }
  }
  if (changes) {
    this.puz.updateAndSaveState();
  }
}

ExolveWebifi.prototype.enter = function(phrase, confirmation='') {
  this.ensureActiveClue();
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  let letters = phrase.toUpperCase().replace(/[^A-Z]/g, '').split('');
  let cells = this.puz.getAllCells(ci);
  if (letters.length <= 0 || cells.length <= 0) {
    return;
  }
  const warnings = [];
  const extra = letters.length - cells.length;
  if (extra > 0) {
    warnings.push('This will ignore ' + extra + ' extra letters in ' + phrase + '.');
    letters = letters.slice(0, cells.length);
  } else if (extra < 0) {
    cells = cells.slice(0, letters.length);
  }
  if (!confirmation) {
    this.enterInCells(cells, letters, false, warnings);
    if (warnings.length > 0) {
      this.webifi.getUserInput(this.name, 'There are potential problems. ' + warnings.join(' ') + ' Enter yes or OK to confirm.',
          this.enter.bind(this, phrase));
    } else {
      this.webifi.output(this.name, 'Entered ' + phrase + ' in ' + this.clueName(ci) + '!');
    }
  } else {
    confirmation = confirmation.toLowerCase();
    if (confirmation == 'y' || confirmation == 'yes' || confirmation == 'ok') {
      this.enterInCells(cells, letters, true);
      this.webifi.output(this.name, 'Entered ' + phrase + ' in ' + this.clueName(ci) + '!');
    }
  }
}

ExolveWebifi.prototype.handler = function(input, words, commandName,
    numMatchedWords, matchingPrefix, numbers) {
  const remaining = words.slice(numMatchedWords).join(' ');
  if (commandName == 'intro') {
    this.describe();
  } else if (commandName == 'status') {
    this.status();
  } else if (commandName == 'clue') {
    this.clue();
  } else if (commandName == 'enter') {
    this.enter(remaining);
  } else if (commandName == 'clear') {
    // TODO: implement clear-all
    this.clearCurr();
  } else if (commandName == 'crossers') {
    this.crossers();
  } else if (commandName == 'next') {
    this.next();
  } else if (commandName == 'previous') {
    this.previous();
  } else if (commandName == 'navigate' && numbers.length > 0) {
    this.navigate(parseInt(numbers[0]),
        words[numMatchedWords - 1].replace(/[^a-zA-Z]/g, ''));
  } else if (commandName == 'navigate') {
    this.navFirstLast(words);
  }
}

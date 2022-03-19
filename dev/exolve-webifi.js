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

function ExolveWebifi(webifi, puz, exetLexicon) {
  this.webifi = webifi;
  this.name = 'Exolve';

  this.puz = puz;
  this.totalClues = this.puz.allClueIndices.length;
  this.fillableClues = 0;
  for (let ci of this.puz.allClueIndices) {
    const clue = this.puz.clues[ci];
    if (!clue || clue.parentClueIndex) {
      continue;
    }
    const cells = this.puz.getAllCells(ci);
    if (!cells || cells.length < 1) {
      continue;
    }
    this.fillableClues++;
  }

  this.lex = exetLexicon;
  this.description = 'An interactive crossword player.';

  this.clueHistory = [];
  this.WORD_GROUP_SIZE = 4;
  this.WORD_CHOICES = this.WORD_GROUP_SIZE * webifi.MAX_LIST_LEN;

  this.webifi.registerAvatar(this.name, this.description, {
    'intro': {
      description: 'Describe the crossword, providing info such as grid size, number of clues, title, preamble, etc.',
      prefixes: ['?|intro|introduction|describe|puzzle|crossword'],
    },
    'status': {
      description: 'Get current status and lists some unsolved clues in fraction-most-filled order.',
      prefixes: ['status', 'How am I doing', 'unsolved clues'],
    },
    'display': {
      description: 'Toggles or sets whether the crossword itself is displayed.',
      prefixes: ['display', 'display on|off',],
    },
    'navigate': {
      description: 'Navigate to a clue by naming or characterizing it.',
      prefixes: [
        '[number]', '[number]A|[number]D', '[number] across|down|A|D',
        'best|easiest|solvable',
        'next|most best|easiest|solvable', 'next', 'prev|previous|back',
        'first|last', 'first|last across|down|clue',
      ],
      helpkeys: ['number', 'jump', 'nav',],
    },
    'clue': {
      description: 'Read the current clue and its status.',
      prefixes: ['clue', 'read',],
    },
    'entry': {
      description: 'Read the current entry in the current clue.',
      prefixes: ['entry|cells|letters|word|phrase', 'read|current entry|cells|letters|word|phrase', ],
    },
    'crossers': {
      description: 'Describes clues for lights that cross the current lights.',
      prefixes: ['crossers', 'crossing clues', 'crossing lights'],
    },
    'enter': {
      description: 'Enter the solution for the current clue, optionally starting at a cell.',
      prefixes: ['enter|fill', 'enter|fill at|in|from cell [number]'],
      helpkeys: ['solve', 'solution'],
    },
    'clear': {
      description: 'Clear entries in the current light or a particular cell.',
      prefixes: ['clear', 'clear cell [number]',],
    },
    'check': {
      description: 'Check entries in the current light or a particular cell or everywhere.',
      prefixes: ['check', 'check cell [number]', 'check all'],
    },
    'reveal': {
      description: 'Reveal entries in the current light or a particular cell or everywhere.',
      prefixes: ['reveal', 'reveal cell [number]', 'reveal all'],
    },
    'anagrams': {
      description: 'Get anagrams of a word or phrase or any set of letters.',
      prefixes: ['anagrams|anagram', 'anagrams|anagram of',],
    },
    'matches': {
      description: 'Get words or phrases matching the current light, or matching a letter pattern',
      prefixes: ['matches', 'matching words', 'matching phrases', 'what fits',],
    },
    'homophones': {
      description: 'Get homophones of a word or phrase.',
      prefixes: ['homophone|homophones', 'homophone|homophones of', 'words sounding like',],
    },
    'spoonerisms': {
      description: 'Get Spoonerisms of a word or phrase.',
      prefixes: ['spoonerism|spoonerisms', 'spoonerism|spoonerisms of',],
      helpkeys: ['reverend', 'spooner'],
    },
    }, this.handler.bind(this));

  document.addEventListener('exolve', (e) => {
    if (e.detail.id != this.puz.id) {
      return;
    }
    let msg = 'You have completed the puzzle';
    if (e.detail.title) msg += ', titled, "' + e.detail.title + '"';
    if (e.detail.setter) msg += ' by "' + e.detail.setter + '"';
    msg += '.';
    if (e.detail.knownCorrect) msg += ' Your solution is correct!';
    if (e.detail.knownIncorrect) msg += ' Your solution has mistakes.';
    this.webifi.output(this.name, msg);
  });

  this.display = false;
  this.setDisplay();

  this.ensureActiveClue();
}

ExolveWebifi.prototype.handleDescribe = function() {
  const description = [];
  if (this.puz.title) description.push('The title of this crossword is "' + this.puz.title + '";');
  if (this.puz.setter) description.push('and the setter is "' + this.puz.setter + '".');
  description.push(`This crossword has ${this.puz.gridHeight} rows and ${this.puz.gridWidth} columns.`);
  description.push(`There are ${this.fillableClues} clues to solve.`);
  this.webifi.output(this.name, description.join(' '));

  const preamble = document.getElementById(this.puz.prefix + '-preamble').innerText;
  if (preamble) {
    this.webifi.output(this.name, 'Preamble: ' + preamble);
  }
  this.webifi.output(this.name,
      'Here are some commands you can use. Say "help" to get the full list of commands.', [
        'You can say "clue" to get the current clue to be read out.',
        '"status" lists some unsolved clues in fraction-most-filled order.',
        'Jump to any clue by entering its number followed optionally by "A" or "D" or "across" or "down". You can also say "next" or "next best" or "previous" or "back".',
        'You can enter solutions by saying "fill" or "enter" followed by the entry.',], false);

}

ExolveWebifi.prototype.getBestClues = function() {
  const indicesAndFracs = [];
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
  indicesAndFracs.sort((a, b) => b[1]/b[2] - a[1]/a[2]);
  return indicesAndFracs;
}

ExolveWebifi.prototype.handleStatus = function() {
  const indicesAndFracs = this.getBestClues();
  if (indicesAndFracs.length == 0 && this.puz.numCellsFilled == this.puz.numCellsToFill) {
    this.webifi.output(this.name,
        `You have completely filled the crossword's ${this.fillableClues} clues and ${this.puz.numCellsToFill} cells.`);
    return;
  }
  list = [];
  let num = 0;
  for (let iAndF of indicesAndFracs) {
    const ci = iAndF[0];
    list.push(this.clueName(ci) + ' has ' + (iAndF[2] - iAndF[1]) + ' unfilled cells, out of ' + iAndF[2] + '. ' + this.readEntry(ci) + '.');
    if (++num >= 5) break;
  }
  const len = indicesAndFracs.length;
  this.webifi.output(this.name,
    `There are ${this.puz.numCellsToFill - this.puz.numCellsFilled} unfilled cells out of ${this.puz.numCellsToFill} cells. ` +
    (len > 1 ?
    `There are ${len} unsolved clues out of ${this.fillableClues}. ${num < len ? "Here are the first few" :  "Here they are"} in fraction-most-filled order:` :
    'Here is the last unsolved clue.'),
    list, false);
}

ExolveWebifi.prototype.setDisplay = function() {
  this.puz.frame.style.display = this.display ? '' : 'none';
}

ExolveWebifi.prototype.handleDisplay = function(words, numMatched) {
  if (numMatched == 1) {
    this.display = !this.display;
  } else {
    const setting = words[1].toLowerCase();
    if (setting == 'on') {
      this.display = true;
    } else if (setting == 'off') {
      this.display = false;
    }
  }
  this.setDisplay();
  this.webifi.output(this.name, 'Display is now ' + (this.display ? 'on' : 'off'));
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

ExolveWebifi.prototype.getCellsEntry = function(cells, pattern) {
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
      break;
    }
    const cell = cells[i];
    const gridCell = this.puz.grid[cell[0]][cell[1]];
    entry += (gridCell.currLetter == '0' ? '?' : gridCell.currLetter);
    ppos++;
  }
  return entry;
}

ExolveWebifi.prototype.readCells = function(cells, pattern) {
  const entry = this.getCellsEntry(cells, pattern);
  const spokenChunks = [];
  let blanks = 0;
  let chunk = '';
  let haveBlanks = false;
  for (let letter of entry) {
    if (letter != '?') {
      if (blanks > 0) {
        spokenChunks.push((blanks == 1) ? 'blank' : ('webifi-escape ' + blanks + ' webifi-escape blanks'));
      }
      if (letter == ' ' || letter == '-') {
        if (chunk) {
          spokenChunks.push(chunk);
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
        spokenChunks.push(chunk);
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
  let spokenEntry = spokenChunks.join('<pause>').trim();
  if (haveBlanks) {
    spokenEntry = this.webifi.annotateText(spokenEntry);
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

ExolveWebifi.prototype.handleClue = function() {
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
    clueText = clueText + ' webifi-escape<pause>' + enumText + ' webifi-escape';
  }
  this.webifi.output(this.name,
      clueName + '. ' + this.webifi.annotateText(clueText));
  this.webifi.output(this.name, 'Current entry:<pause>' + this.readEntry(ci) + '.');
  if (this.clueHistory.length == 0 ||
      this.clueHistory[this.clueHistory.length - 1] != ci) {
    this.clueHistory.push(ci);
  }
}

ExolveWebifi.prototype.handleEntry = function() {
  this.ensureActiveClue();
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  this.webifi.output(this.name, this.readEntry(ci) + '.');
}

ExolveWebifi.prototype.handleCrossers = function() {
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  let clue = this.puz.clues[ci];
  if (!clue) return;
  let myIndices = [ci];
  if (clue.childrenClueIndices) {
    myIndices = myIndices.concat(clue.childrenClueIndices);
  }
  const cells = this.puz.getAllCells(ci);

  const crossers = [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const gridCell = this.puz.grid[cell[0]][cell[1]];
    if (gridCell.acrossClueLabel) {
      const ac = 'A' + gridCell.acrossClueLabel;
      if (!myIndices.includes(ac)) {
        crossers.push([i + 1, gridCell.currLetter, ac]);
      }
    }
    if (gridCell.downClueLabel) {
      const dn = 'D' + gridCell.downClueLabel;
      if (!myIndices.includes(dn)) {
        crossers.push([i + 1, gridCell.currLetter, dn]);
      }
    }
  }
  const descs = [];
  for (let crosser of crossers) {
    let cci = crosser[2];
    let cname = `${this.clueName(cci)}`;
    let cclue = this.puz.clues[cci];
    if (cclue.parentClueIndex) {
      cname = `${this.clueName(cci)}; which is part of the linked clue in<pause> ${this.clueName(cclue.parentClueIndex)}`;
      cci = cclue.parentClueIndex;
      cclue = this.puz.clues[cci];
    }
    if (crosser[1] == '0') {
      descs.push(`Cell ${crosser[0]}, which is blank<pause> crosses: ${cname}.`);
    } else {
      const cpattern = cclue.placeholder || '';
      const ccells = this.puz.getAllCells(cci);
      const centry = this.getCellsEntry(ccells, cpattern);
      if (centry.indexOf('?') < 0) {
        descs.push(`Cell ${crosser[0]} has ${crosser[1]}<pause> which comes from the entry<pause> ${this.readEntry(cci)}<pause> in ${cname}.`);
      } else {
        descs.push(`Cell ${crosser[0]} has ${crosser[1]}<pause> which crosses an incomplete entry<pause> in ${cname}.`);
      }
    }
  }
  if (crossers.length == 0) {
    this.webifi.output(this.name, `${this.clueName(ci)} has no crossing clues over ${cells.length} cells.`);
  } else {
    this.webifi.output(this.name, `${this.clueName(ci)} has ${crossers.length} crossing ${crossers.length == 1 ? 'clue' : 'clues'} over ${cells.length} cells.`, descs, false);
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

ExolveWebifi.prototype.handleNavigateToNumber = function(num, dir) {
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
  this.handleClue();
}

ExolveWebifi.prototype.navigateFirstLast = function(fl, dir) {
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
      this.handleNavigateToNumber(index.substr(1), dir);
      return;
    }
  }
}

ExolveWebifi.prototype.navigateNextBest = function() {
  const bestClues = this.getBestClues();
  if (bestClues.length == 0) {
    this.webifi.output(this.name, 'There are no unsolved clues left. Perhaps just name a clue to jump to, or say "first" or "last"?');
    return;
  }
  const bestCluesIndices = [];
  for (let x of bestClues) {
    bestCluesIndices.push(x[0]);
  }

  let bestIndex = 0;
  if (this.clueHistory.length > 0) {
    const myIndex = bestCluesIndices.lastIndexOf(this.clueHistory[this.clueHistory.length - 1]);
    if (myIndex >= 0) {
      let bcIndex = myIndex - 1;
      let chIndex = this.clueHistory.length - 2;
      while (bcIndex >= 0) {
        let ci = bestCluesIndices[bcIndex];
        while (chIndex >= 0 &&
               this.clueHistory[chIndex] == this.clueHistory[chIndex + 1]) {
          chIndex--;
        }
        if (chIndex < 0 || this.clueHistory[chIndex] != ci) {
          break;
        }
        bcIndex--;
        chIndex--;
      }
      if (bcIndex < 0) {
        // History matches: we've been going down the bestClues list.
        bestIndex = (myIndex + 1) % bestCluesIndices.length;
      }
    }
  }
  this.puz.cnavTo(bestCluesIndices[bestIndex], false);
  if (!this.puz.currClueIndex) return;
  this.handleClue();
}

ExolveWebifi.prototype.navigateNext = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  this.puz.cnavNext();
  this.handleClue();
}

ExolveWebifi.prototype.navigatePrev = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  this.puz.cnavPrev();
  this.handleClue();
}

ExolveWebifi.prototype.navigateBack = function() {
  if (this.clueHistory.length == 0) {
    this.ensureActiveClue();
    this.handleClue();
    return;
  }
  let index = this.clueHistory.length  - 1;
  const curr = this.clueHistory[index];
  while (index >= 0 && this.clueHistory[index] == curr) {
    index--;
  }
  if (index < 0) {
    this.puz.cnavPrev();
  } else {
    this.puz.cnavTo(this.clueHistory[index], false);
  }
  if (!this.puz.currClueIndex) return;
  this.handleClue();
}

ExolveWebifi.prototype.handleNavigate = function(words, numMatchedWords) {
  const fl = words[0].toLowerCase();
  if (fl == 'first' || fl == 'last') {
    const dir = (numMatchedWords > 1) ? words[1].charAt(0).toUpperCase() : '';
    this.navigateFirstLast(fl, dir);
    return;
  }

  if (numMatchedWords != words.length) {
    this.webifi.output(this.name, 'Could not understand the "navigate" command. Try saying "help navigate".');
    return;
  }

  const prefix = words.slice(0, numMatchedWords).join(' ').toLowerCase();

  if (prefix.includes('best') || prefix.includes('most') ||
      prefix.includes('easiest') || prefix.includes('solvable')) {
    this.navigateNextBest();
    return;
  }

  if (prefix == 'next') {
    this.navigateNext();
    return;
  }
  if (prefix == 'prev' || prefix == 'previous') {
    this.navigatePrev();
    return;
  }
  if (prefix == 'back') {
    this.navigateBack();
    return;
  }
  this.webifi.output(this.name, 'Could not understand the "navigate" command. Try saying "help navigate".');
}

ExolveWebifi.prototype.handleClearCurr = function(numbers) {
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  const cells = this.puz.getAllCells(ci);
  const clue = this.puz.clues[ci];

  const pattern = clue.placeholder || '';
  if (numbers && numbers.length > 0) {
    const cellNumber = numbers[0];
    if (cellNumber < 1 || cellNumber > cells.length) {
      this.webifi.output(this.name, 'Cell number ' + cellNumber + ' not in range 1 to ' + cells.length);
      return;
    }
    const cell = cells[cellNumber - 1];
    this.puz.clearCell(cell[0], cell[1]);
    this.puz.updateAndSaveState();
    this.webifi.output(this.name, 'Cleared cell ' + cellNumber + ' in ' + this.clueName(ci) + ', the entry now reads: ' + this.readCells(cells, pattern));
  } else {
    this.puz.clearCurr();
    this.webifi.output(this.name, 'Cleared ' + this.clueName(ci) + ', it now reads: ' + this.readCells(cells, pattern));
    if (this.numFilled(cells) > 0) {
      this.webifi.output(this.name, 'The non-blanks are from full crossers. Another "clear" command can clear them. You can also say "crossers" to find where they are coming from.');
    }
  }
}

ExolveWebifi.prototype.handleCheck = function(words, numMatched, numbers) {
  if (this.puz.hasUnsolvedCells) {
    this.webifi.output(this.name, 'Sorry, this crossword does not include solutions that can be checked.');
    return;
  }
  const filledPre = this.puz.numCellsFilled;
  if (numMatched == 2 && words[1].toLowerCase() == 'all') {
    this.puz.checkAll(false);
  } else {
    const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
    if (!ci) return;
    if (numbers && numbers.length > 0) {
      const cellNumber = numbers[0];
      const cells = this.puz.getAllCells(ci);
      if (cellNumber < 1 || cellNumber > cells.length) {
        this.webifi.output(this.name, 'Cell number ' + cellNumber + ' not in range 1 to ' + cells.length);
        return;
      }
      const cell = cells[cellNumber - 1];
      this.puz.activateCell(cell[0], cell[1]);
      this.puz.cellNotLight = true;
    }
    this.puz.checkCurr();
  }
  const filledPost = this.puz.numCellsFilled; 
  if (filledPost == filledPre) {
    this.webifi.output(this.name, 'All checked cells are correct');
  } else {
    const cleared = filledPre - filledPost;
    const term = (cleared > 1) ? ' cells that were ' : ' cell that was ';
    this.webifi.output(this.name, 'Cleared ' + cleared + term + 'incorrect');
  }
}

ExolveWebifi.prototype.handleReveal = function(words, numMatched, numbers) {
  if (this.puz.hasUnsolvedCells) {
    this.webifi.output(this.name, 'Sorry, this crossword does not include solutions that can be revealed.');
    return;
  }
  const filledPre = this.puz.numCellsFilled;
  if (numMatched == 2 && words[1].toLowerCase() == 'all') {
    this.puz.revealAll(false);
    this.webifi.output(this.name,
        `The crossword's ${this.fillableClues} clues and ${this.puz.numCellsToFill} cells have been fully revealed`);
  } else {
    const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
    const clue = this.puz.clues[ci];
    const cells = this.puz.getAllCells(ci);
    if (!ci) return;
    if (numbers && numbers.length > 0) {
      const cellNumber = numbers[0];
      if (cellNumber < 1 || cellNumber > cells.length) {
        this.webifi.output(this.name, 'Cell number ' + cellNumber + ' not in range 1 to ' + cells.length);
        return;
      }
      const cell = cells[cellNumber - 1];
      this.puz.activateCell(cell[0], cell[1]);
      this.puz.cellNotLight = true;
    }
    this.puz.revealCurr();
    const pattern = clue.placeholder || '';
    this.webifi.output(this.name, 'Revealed. The entry now reads: ' + this.readCells(cells, pattern));
  }
}

ExolveWebifi.prototype.enterInCells = function(cells, letters, cellOffset, clobber=false, warnings=[]) {
  console.assert(cells.length > 0, cells, letters);
  console.assert(cells.length == letters.length, cells, letters);
  let conflict = false;
  let changes = false;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const gridCell = this.puz.grid[cell[0]][cell[1]];
    if (gridCell.currLetter != '0' && (gridCell.currLetter != letters[i])) {
      conflict = true;
      warnings.push('Cell number ' + (i + cellOffset) + ' already has ' + gridCell.currLetter + ' instead of ' + letters[i] + '.');
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

ExolveWebifi.prototype.handleEnter = function(phrase, numbers, confirmation='') {
  this.ensureActiveClue();
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  let letters = phrase.toUpperCase().replace(/[^A-Z]/g, '').split('');
  let cells = this.puz.getAllCells(ci);
  if (letters.length <= 0 || cells.length <= 0) {
    return;
  }
  let cellNumber = 1;
  if (numbers && numbers.length > 0) {
    cellNumber = numbers[0];
    if (cellNumber < 1 || cellNumber > cells.length) {
      this.webifi.output(this.name, 'Cell number ' + cellNumber + ' not in range 1 to ' + cells.length);
      return;
    }
    if (cellNumber > 1) cells = cells.slice(cellNumber - 1);
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
    this.enterInCells(cells, letters, cellNumber, false, warnings);
    if (warnings.length > 0) {
      this.webifi.getUserInput(this.name, 'There are potential problems.<pause>' + warnings.join(',<pause>') + '<pause>Enter yes or OK to confirm.',
          this.handleEnter.bind(this, phrase, numbers));
    } else {
      this.webifi.output(this.name, 'Entered ' + phrase + ' in ' + this.clueName(ci) + (cellNumber > 1 ? (' starting at cell ' + cellNumber + '.') : '.'));
    }
  } else {
    confirmation = confirmation.toLowerCase();
    if (confirmation == 'y' || confirmation == 'yes' || confirmation == 'ok') {
      this.enterInCells(cells, letters, cellNumber, true);
      this.webifi.output(this.name, 'Entered ' + phrase + ' in ' + this.clueName(ci) + (cellNumber > 1 ? (' starting at cell ' + cellNumber + '.') : '.'));
    }
  }
}

ExolveWebifi.prototype.numEnumPunctMatches = function(p, e) {
  let num = 0;
  let minl = Math.min(p.length, e.length);
  for (let i = 0; i < minl; i++) {
    if (p[i] != '?' && p[i] == e[i]) num++;
    if (p[i] == '?' && !this.lex.allLetters[e[i].toUpperCase()]) num--;
  }
  return num;
}

ExolveWebifi.prototype.enumMatchSorter = function(p, k1, k2) {
  const entry1 = this.lex.getLex(k1);
  const entry2 = this.lex.getLex(k2);
  return this.numEnumPunctMatches(p, entry2) -
         this.numEnumPunctMatches(p, entry1);
}

ExolveWebifi.prototype.makeGroups = function(list, groupSize) {
  const grouped = [];
  let x = -1;
  for (let i = 0; i < list.length; i++) {
    if (i % groupSize == 0) {
      grouped.push('');
      x = grouped.length - 1;
    }
    if (grouped[x]) grouped[x] = grouped[x] + ',<pause>' + list[i];
    else grouped[x] = list[i];
  }
  return grouped;
}

ExolveWebifi.prototype.handleMatches = function(pattern) {
  if (!pattern) {
    this.ensureActiveClue();
    const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
    if (!ci) return;
    const cells = this.puz.getAllCells(ci);
    const placeholder = this.puz.clues[ci].placeholder || '';
    pattern = this.getCellsEntry(cells, placeholder);
  }
  const matchingIndices = this.lex.getLexChoices(pattern, 10000);
  if (matchingIndices.length == 0) {
    this.webifi.output(this.name, 'No matches were found.');
    return;
  }
  matchingIndices.sort(this.enumMatchSorter.bind(this, pattern));
  if (matchingIndices.length > this.WORD_CHOICES) {
    matchingIndices.length = this.WORD_CHOICES;
  }
  const matchingWords = [];
  for (let idx of matchingIndices) {
    matchingWords.push(this.lex.getLex(idx));
  }
  this.webifi.output(this.name, 'Here are some matches.', this.makeGroups(matchingWords, this.WORD_GROUP_SIZE), false);
}

ExolveWebifi.prototype.handleAnagrams = function(fodder) {
  if (!fodder) {
    return;
  }
  const matchingWords = this.lex.getAnagrams(fodder, this.WORD_CHOICES);
  if (matchingWords.length == 0) {
    this.webifi.output(this.name, 'No anagrams were found.');
    return;
  }
  this.webifi.output(this.name, 'Here are some anagrams of ' + fodder + '.', this.makeGroups(matchingWords, this.WORD_GROUP_SIZE), false);
}

ExolveWebifi.prototype.handleHomophones = function(phrase) {
  if (!phrase) {
    return;
  }
  const matchingWords = this.lex.getHomophones(phrase);
  if (matchingWords.length == 0) {
    this.webifi.output(this.name, 'No homophones were found.');
    return;
  }
  // Best to spell out homophones.
  for (let i = 0; i < matchingWords.length; i++) {
    matchingWords[i] = this.webifi.annotateText(matchingWords[i].toUpperCase());
  }
  this.webifi.output(this.name, 'Here are some homophones of ' + phrase + '.', this.makeGroups(matchingWords, this.WORD_GROUP_SIZE), false);
}

ExolveWebifi.prototype.handleSpoonerisms = function(phrase) {
  if (!phrase) {
    return;
  }
  const matchingWords = this.lex.getSpoonerisms(phrase);
  if (matchingWords.length == 0) {
    this.webifi.output(this.name, 'No spoonerisms were found.');
    return;
  }
  // Best to spell out spoonerisms.
  for (let i = 0; i < matchingWords.length; i++) {
    matchingWords[i] = this.webifi.annotateText(matchingWords[i].join(' ').toUpperCase());
  }
  this.webifi.output(this.name, 'Here are some spoonerisms of ' + phrase + '.', this.makeGroups(matchingWords, this.WORD_GROUP_SIZE), false);
}

ExolveWebifi.prototype.handler = function(input, words, commandName,
    numMatchedWords, matchingPrefix, numbers) {
  const remaining = words.slice(numMatchedWords).join(' ');
  if (commandName == 'intro') {
    this.handleDescribe();
  } else if (commandName == 'status') {
    this.handleStatus();
  } else if (commandName == 'display') {
    this.handleDisplay(words, numMatchedWords);
  } else if (commandName == 'clue') {
    this.handleClue();
  } else if (commandName == 'entry') {
    this.handleEntry();
  } else if (commandName == 'enter') {
    this.handleEnter(remaining, numbers);
  } else if (commandName == 'clear') {
    this.handleClearCurr(numbers);
  } else if (commandName == 'check') {
    this.handleCheck(words, numMatchedWords, numbers);
  } else if (commandName == 'reveal') {
    this.handleReveal(words, numMatchedWords, numbers);
  } else if (commandName == 'crossers') {
    this.handleCrossers();
  } else if (commandName == 'navigate' && numbers.length > 0) {
    this.handleNavigateToNumber(parseInt(numbers[0]),
        words[numMatchedWords - 1].replace(/[^a-zA-Z]/g, ''));
  } else if (commandName == 'navigate') {
    this.handleNavigate(words, numMatchedWords);
  } else if (commandName == 'matches') {
    this.handleMatches(remaining);
  } else if (commandName == 'anagrams') {
    this.handleAnagrams(remaining);
  } else if (commandName == 'homophones') {
    this.handleHomophones(remaining);
  } else if (commandName == 'spoonerisms') {
    this.handleSpoonerisms(remaining);
  }
}

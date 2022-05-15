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

function CrosswordWebifi(webifi, puz) {
  this.webifi = webifi;
  this.name = 'Crossword';

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

  this.description = 'An interactive crossword player';

  this.clueHistory = [];

  this.webifi.registerAvatar(this.name, this.description, {
    'intro': {
      description: 'Describe the crossword, providing info such as grid size, number of clues, title, preamble, etc.',
      prefixes: ['intro|introduction|describe|puzzle|crossword'],
    },
    'status': {
      description: 'Get current status and list some unsolved clues in fraction-most-filled order.',
      prefixes: ['status|look|where', 'where am i', 'how am i doing', 'unsolved clues'],
    },
    'navigate': {
      description: 'Navigate to a clue by naming or characterizing it.',
      prefixes: [
        '[number]', '[number]A|[number]D', '[number] across|down|A|D',
        'navigate|best|easiest|solvable',
        'next|most best|easiest|solvable',
        'next', 'next clue',
        'prev|previous|back', 'previous clue',
        'first|last', 'first|last across|down|clue',
      ],
      helpkeys: ['number', 'jump', 'nav',],
    },
    'clue': {
      description: 'Read the current clue again.',
      prefixes: ['clue',],
    },
    'words': {
      description: 'Read parts of the current clue again.',
      prefixes: [
        'words|word|part|parts [number]',
        'words|word|part|parts at|from [number]',
        'clue words|word|part|parts [number]',
        'clue words|word|part|parts at|from [number]',
        'clue start|starting|end|ending',
        'word|words|clue at start|starting|end|ending',
        'word|words|clue at the start|starting|end|ending',
        'clue word|words at start|starting|end|ending',
        'clue word|words at the start|starting|end|ending',
        'words|word|clue after',
        'clue words|word after',
        'words|word|clue before',
        'clue words|word before',
      ],
    },
    'entry': {
      description: 'Read the current entry (letters entered as well as blanks) and identfy the current clue again.',
      prefixes: ['entry|current|read|cells|letters', 'read|current entry|cells|letters', ],
    },
    'crossers': {
      description: 'Describe clues for lights that cross the current lights.',
      prefixes: ['crossers', 'crossing clues', 'crossing lights'],
    },
    'type': {
      description: 'Enter the solution for the current clue, optionally starting at a cell.',
      prefixes: ['type|enter|fill', 'type|enter|fill at|in|from cell [number]'],
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
    'matches': {
      description: 'Get words or phrases matching the letters that have been entered so far in the current light.',
      prefixes: ['matches', 'matching words', 'matching phrases', 'what fits',],
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

  this.ensureActiveClue();
}

CrosswordWebifi.prototype.handleDescribe = function() {
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
        'You can say "clue" to get the current clue to be read out, and "entry" to get its current entry to be read out.',
        'You can enter solutions by saying "type" followed by the word or phrase to enter.',
        'The "status" command tells you where you are, and lists some unsolved clues in fraction-most-filled order.',
        'Jump to any clue by entering its number followed optionally by "A" or "D" or "across" or "down". You can also say "next" or "next best" or "previous" or "back".',
      ], false);

}

CrosswordWebifi.prototype.getBestClues = function() {
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

CrosswordWebifi.prototype.handleStatus = function() {
  const indicesAndFracs = this.getBestClues();
  if (indicesAndFracs.length == 0 && this.puz.numCellsFilled == this.puz.numCellsToFill) {
    this.webifi.output(this.name,
        `You have completely filled the crossword's ${this.fillableClues} clues and ${this.puz.numCellsToFill} cells.`);
    return;
  }
  this.ensureActiveClue();
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  const currClue = ci ? ('You are currently at ' + this.clueName(ci) + '. ') : '';

  list = [];
  let num = 0;
  for (let iAndF of indicesAndFracs) {
    const ci = iAndF[0];
    let clueDesc = this.clueName(ci) + ' has ' + (iAndF[2] - iAndF[1]) + ' unfilled cells, out of ' + iAndF[2] + '.';
    if (iAndF[1] > 0) {
      clueDesc += ' It reads: <pause> ' + this.readEntry(ci) + '.';
    }
    list.push(clueDesc);
    if (++num >= 5) break;
  }
  const len = indicesAndFracs.length;
  this.webifi.output(this.name,
    `${currClue}There are ${this.puz.numCellsToFill - this.puz.numCellsFilled} unfilled cells out of ${this.puz.numCellsToFill} cells. ` +
    (len > 1 ?
    `There are ${len} unsolved clues out of ${this.fillableClues}. ${num < len ? "Here are the first few" :  "Here they are"} in fraction-most-filled order:` :
    'Here is the last unsolved clue.'),
    list, false);
}

CrosswordWebifi.prototype.ensureActiveClue = function() {
  if (this.puz.allClueIndices.length == 0) {
    return;
  }
  if (!this.puz.currClueIndex) {
    this.puz.cnavTo(this.puz.allClueIndices[0]);
  }
  console.assert(this.puz.currClueIndex);
}

CrosswordWebifi.prototype.clueName = function(ci) {
  const dir = ci.charAt(0);
  const num = ci.substr(1);
  return num + ' ' + (dir == 'A' ? 'Across' : (dir == 'D' ? 'Down' : dir));
}

CrosswordWebifi.prototype.linkedChildrenNames = function(indices) {
  const cnames = [];
  for (let ci of indices) cnames.push(this.clueName(ci));
  return cnames.join(' and ');
}

CrosswordWebifi.prototype.getCellsEntry = function(cells, pattern) {
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

CrosswordWebifi.prototype.readCells = function(cells, pattern) {
  const entry = this.getCellsEntry(cells, pattern);
  return this.markUpEntry(entry);
}

CrosswordWebifi.prototype.readEntry = function(ci) {
  const clue = this.puz.clues[ci];
  if (!clue || clue.parentClueIndex) {
    return '';
  }
  const cells = this.puz.getAllCells(ci);
  const pattern = clue.placeholder || '';
  return this.readCells(cells, pattern);
}

/**
 * Remove in-clue annos and any HTML tags.
 */
CrosswordWebifi.prototype.cleanClueText = function(s) {
  s = this.puz.stripLineBreaks(s);
  s = s.replace(/<[^>]*>/g, '');
  let out = '';
  let idx = s.indexOf('~{');
  let endIdx = 0;
  while (idx >= 0) {
    out = out + s.substring(endIdx, idx);
    endIdx = s.indexOf('}~', idx + 2);
    if (endIdx < 0) {
      endIdx = idx;
      break;
    }
    let skip = 2;
    if (s.charAt(idx + skip) == '{') {
      let close = s.indexOf('}', idx + skip + 1);
      if (close >= idx + skip + 1) {
        skip = close + 1 - idx;
      }
    }
    out = out + s.substring(idx + skip, endIdx);
    endIdx += 2;
    idx = s.indexOf('~{', endIdx);
  }
  out = out + s.substr(endIdx);
  return out;
}

CrosswordWebifi.prototype.markUpEnum = function(enumStr) {
  return enumStr.replace(/,/g, ',<spoken:comma>').
      replace(/-/g, '-<spoken-hyphen>').
      replace(/'/, "'<spoken:apostrophe>");
}

CrosswordWebifi.prototype.markUpEntry = function(entry) {
  if (entry.indexOf('?') >= 0) {
    return '<verbose>' + entry.replace(/\?/g, '_') + '</verbose>';
  } else {
    return entry;
  }
}

CrosswordWebifi.prototype.handleClue = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  let ci = this.puz.currClueIndex;
  let clueName = this.clueName(ci);
  let clue = this.puz.clues[ci];

  if (clue.parentClueIndex) {
    ci = clue.parentClueIndex;
    const parentName = this.clueName(ci);
    clue = this.puz.clues[ci];
    clueName = parentName;
  } else if (clue.childenClueIndices && clue.childrenClueIndices.length > 0) {
    const childrenName = this.linkedChildrenNames(clue.childrenClueIndices);
  }
  let clueText = this.cleanClueText(clue.clue);
  let enumText = clue.enumStr;
  if (enumText) {
    const loc = clueText.lastIndexOf(enumText);
    if (loc >= 0) {
      clueText = clueText.substr(0, loc);
    }
    enumText = this.markUpEnum(enumText);
    clueText = clueText + ' <pause>' + enumText;
  }
  this.webifi.output(this.name, clueText);
  if (this.clueHistory.length == 0 ||
      this.clueHistory[this.clueHistory.length - 1] != ci) {
    this.clueHistory.push(ci);
    this.handleEntry();
  }
}

CrosswordWebifi.prototype.wordMatch = function(matcher, word) {
  return word.toLowerCase().startsWith(matcher.toLowerCase());
}

CrosswordWebifi.prototype.handleWords = function(
    words, numMatchedWords, matchingPrefix, numbers) {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  let ci = this.puz.currClueIndex;
  let clue = this.puz.clues[ci];

  if (clue.parentClueIndex) {
    ci = clue.parentClueIndex;
    clue = this.puz.clues[ci];
  }
  let clueText = this.cleanClueText(clue.clue);
  if (clue.enumStr) {
    const loc = clueText.lastIndexOf(clue.enumStr);
    if (loc >= 0) {
      clueText = clueText.substr(0, loc);
    }
  }
  clueText = clueText.trim();
  const clueWords = clueText.split(' ');
  let startWord = -1;
  let endWord = -1;
  let before = false;
  let phraseWords = null;

  if (numbers.length > 0) {
    startWord = numbers[0] - 1;
  } else if (numMatchedWords >= 2) {
    if (words[numMatchedWords - 1].startsWith('start')) {
      startWord = 0;
    } else if (words[numMatchedWords - 1].startsWith('end')) {
      startWord = Math.max(0, clueWords.length - 3);
    } else {
      phraseWords = words.slice(numMatchedWords);
      if (phraseWords.length > 0) {
        for (let i = 0; i < clueWords.length; i++) {
          let match = true;
          for (let j = 0; j < phraseWords.length; j++) {
            if (i + j >= clueWords.length ||
                !this.wordMatch(phraseWords[j], clueWords[i + j])) {
              match = false;
              break;
            }
          }
          if (match) {
            if (words[numMatchedWords - 1] == 'before') {
              startWord = Math.max(1, i - 3);
            } else if (words[numMatchedWords - 1] == 'after') {
              startWord = i + phraseWords.length;
            }
            break;
          }
        }
      }
    }
  }
  endWord = Math.min(startWord + 3, clueWords.length);
  if (startWord >= 0 && startWord < clueWords.length &&
      endWord > startWord) {
    const cluePart = clueWords.slice(startWord, endWord).join(' ');
    this.webifi.output(this.name, '<punctuate>' + cluePart + '</punctuate>');
  } else {
    this.webifi.output(this.name, 'There is no matching part for that in the current clue');
  }
}

CrosswordWebifi.prototype.handleEntry = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  let ci = this.puz.currClueIndex;
  let clueName = this.clueName(ci);
  let clue = this.puz.clues[ci];

  let linkedInfo = '';
  if (clue.parentClueIndex) {
    ci = clue.parentClueIndex;
    const parentName = this.clueName(ci);
    linkedInfo = 'Note that ' + clueName + ' is a part of the linked clue, ' + parentName;
    clueName = parentName;
  } else if (clue.childenClueIndices && clue.childrenClueIndices.length > 0) {
    const childrenName = this.linkedChildrenNames(clue.childrenClueIndices);
    linkedInfo = 'Note that ' + clueName + ' is a linked clue consisting of ' + childrenName;
  }
  this.webifi.output(this.name, 'Current entry in this ' + clueName + ' clue is: <pause>' + this.readEntry(ci));
  if (linkedInfo) {
    this.webifi.output(this.name, linkedInfo);
  }
}

CrosswordWebifi.prototype.handleCrossers = function() {
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
      cname = `${this.clueName(cci)}; which is part of the linked clue in <pause> ${this.clueName(cclue.parentClueIndex)}`;
      cci = cclue.parentClueIndex;
      cclue = this.puz.clues[cci];
    }
    if (crosser[1] == '0') {
      descs.push(`Cell ${crosser[0]}, which is blank, <pause> crosses: ${cname}.`);
    } else {
      const cpattern = cclue.placeholder || '';
      const ccells = this.puz.getAllCells(cci);
      const centry = this.getCellsEntry(ccells, cpattern);
      if (centry.indexOf('?') < 0) {
        descs.push(`Cell ${crosser[0]} has <verbose>${crosser[1]}</verbose>, <pause> which comes from the entry<pause> ${this.readEntry(cci)} <pause> in ${cname}.`);
      } else {
        descs.push(`Cell ${crosser[0]} has <verbose>${crosser[1]}</verbose>, <pause> which crosses an incomplete entry <pause> in ${cname}.`);
      }
    }
  }
  if (crossers.length == 0) {
    this.webifi.output(this.name, `${this.clueName(ci)} has no crossing clues over ${cells.length} cells.`);
  } else {
    this.webifi.output(this.name, `${this.clueName(ci)} has ${crossers.length} crossing ${crossers.length == 1 ? 'clue' : 'clues'} over ${cells.length} cells.`, descs, false);
  }
}

CrosswordWebifi.prototype.numFilled = function(cells) {
  let numFilled = 0;
  for (let cell of cells) {
    if (this.puz.grid[cell[0]][cell[1]].currLetter != '0') {
      numFilled++;
    }
  }
  return numFilled;
}

CrosswordWebifi.prototype.handleNavigateToNumber = function(num, dir) {
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

CrosswordWebifi.prototype.navigateFirstLast = function(fl, dir) {
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

CrosswordWebifi.prototype.navigateNextBest = function() {
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

CrosswordWebifi.prototype.navigateNext = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  this.puz.cnavNext();
  this.handleClue();
}

CrosswordWebifi.prototype.navigatePrev = function() {
  this.ensureActiveClue();
  if (!this.puz.currClueIndex) return;
  this.puz.cnavPrev();
  this.handleClue();
}

CrosswordWebifi.prototype.navigateBack = function() {
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

CrosswordWebifi.prototype.handleNavigate = function(words, numMatchedWords) {
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
      prefix.includes('navigate') || prefix.includes('easiest') ||
      prefix.includes('solvable')) {
    this.navigateNextBest();
    return;
  }

  if (prefix == 'next' || prefix == 'next clue') {
    this.navigateNext();
    return;
  }
  if (prefix == 'prev' || prefix == 'previous' || prefix == 'previous clue') {
    this.navigatePrev();
    return;
  }
  if (prefix == 'back') {
    this.navigateBack();
    return;
  }
  this.webifi.output(this.name, 'Could not understand the "navigate" command. Try saying "help navigate".');
}

CrosswordWebifi.prototype.handleClearCurr = function(numbers) {
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

CrosswordWebifi.prototype.handleCheck = function(words, numMatched, numbers) {
  if (this.puz.hasUnsolvedCells) {
    this.webifi.output(this.name, 'Sorry, this crossword does not include solutions that can be checked.');
    return;
  }
  const filledPre = this.puz.numCellsFilled;
  let all = false;
  if (numMatched == 2 && words[1].toLowerCase() == 'all') {
    this.puz.checkAll(false);
    all = true;
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
     if (all) {
       this.webifi.output(this.name, 'All the entries in the crossword are correct!');
     } else {
       this.webifi.output(this.name, 'All cells are correct');
     }
  } else {
    const cleared = filledPre - filledPost;
    const term = (cleared > 1) ? ' cells that were ' : ' cell that was ';
    this.webifi.output(this.name, 'Cleared ' + cleared + term + 'incorrect');
  }
}

CrosswordWebifi.prototype.handleReveal = function(words, numMatched, numbers) {
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

CrosswordWebifi.prototype.enterInCells = function(cells, letters, cellOffset, clobber=false, warnings=[]) {
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

CrosswordWebifi.prototype.handleEnter = function(phrase, numbers, confirmation='') {
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
      this.webifi.getUserInput(this.name, 'There are potential problems. <pause>' + warnings.join(', <pause>') + ' <pause>Enter yes or OK to confirm.',
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

CrosswordWebifi.prototype.handleMatches = function() {
  this.ensureActiveClue();
  const ci = this.puz.clueOrParentIndex(this.puz.currClueIndex);
  if (!ci) return;
  const cells = this.puz.getAllCells(ci);
  const placeholder = this.puz.clues[ci].placeholder || '';
  pattern = this.getCellsEntry(cells, placeholder);
  // Pass back to webifi, to be picked up by WordsWebifi
  this.webifi.processInput('pattern ' + pattern);
}

CrosswordWebifi.prototype.handler = function(input, words, commandName,
    numMatchedWords, matchingPrefix, numbers) {
  const remaining = words.slice(numMatchedWords).join(' ');
  if (commandName == 'intro') {
    this.handleDescribe();
  } else if (commandName == 'status') {
    this.handleStatus();
  } else if (commandName == 'clue' && words.length == 1) {
    this.handleClue();
  } else if (commandName == 'words') {
    this.handleWords(words, numMatchedWords, matchingPrefix, numbers);
  } else if (commandName == 'entry') {
    this.handleEntry();
  } else if (commandName == 'type') {
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
    this.handleMatches();
  }
}

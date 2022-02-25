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

The latest code and documentation for Webifi can be found at:
https://github.com/viresh-ratnakar/webifi
*/

/**
 * Constructor to create TODO
 *
 * containerId TODO
 */
function Webifi(containerId='', className='') {
  this.VERSION = 'Webifi v0.00, February 19, 2022';
  this.MAX_LEN = 280;
  this.MAX_LIST_LEN = 20;
  this.MAX_LOG_ENTRIES = 1000;
  this.logEntries = [];
  this.logIndex = 0;

  this.stopWords = {
    'the': true,
    'of': true,
    'a': true,
    'an': true,
    'to': true,
    'for': true,
    'on': true,
    'with': true,
    'in': true,
    'or': true,
    'and': true,
    'is': true,
    'are': true,
    'by': true,
    'it': true,
    'this': true,
    'that': true,
    'be': true,
    'should': true,
    'would': true,
    'could': true,
  };
  this.avatars = {};
  this.sortedAvatarNames = [];
  this.index = {};
  this.helpIndex = {};
  this.name = 'Webifi';
  this.description = 'The basic interactive fiction-esque web interface.';

  this.pendingInputClosure = null;

  this.registerAvatar(this.name, this.description, {
    'hello': {
      description: 'Get an introduction to Webifi and a listing of available avatars.',
      prefixes: ['whats your name', 'what\'s your name', 'who are you', 'hi|hello|greeting|greetings'],
    },
    'echo': {
      description: 'Tests who a word or phrase or sentence gets spoken.',
      prefixes: ['echo',],
    },
    'talking-speed': {
      description: 'Get Webifi to talk faster or slower or at its normal speed.',
      prefixes: ['talk fast|faster', 'talk slow|slower|slowly', 'talk normal|normally', 'talk|speed|rate [number]', 'talk at [number]', 'talking speed|rate [number]'],
    },
    'help': {
      description: 'Get a listing of all commands or help on a specific command or topic.',
      prefixes: ['help|list|commands|?', 'help|commands on|with|for',] 
    },
  }, this.basicHandler.bind(this));

  const parent = !containerId ? document.body :
                 document.getElementById(containerId);
  console.assert(parent,
      'Webifi("' + containerId + '"): could not find/create parent');
  console.assert(!document.getElementById('webifi-root'),
      'Element with id "webifi-root" already exists!');
  parent.insertAdjacentHTML('afterbegin', `
    <div id="webifi-root" class="webifi-root">
      <div id="webifi-log" class="webifi-log"></div>
      <hr>
      <div id="webifi-input-wrapper" class="webifi-input-wrapper">
        <input id="webifi-input" class="webifi-input"
            type="text" autocomplete="off" spellcheck="false"
            placeholder="Enter a command such as 'help'"
            size="${this.MAX_LEN}"
            maxlength="${this.MAX_LEN}">
        </input>
      </div>
    </div>
  `);
  this.root = document.getElementById('webifi-root');
  if (className) {
    this.root.classList.add(className);
  }
  this.log = document.getElementById('webifi-log');
  this.input = document.getElementById('webifi-input');
  this.input.addEventListener('change', this.handleInput.bind(this));

  this.synth = window.speechSynthesis;
  this.voice = null;
  this.rate = 1.0;
  if (!this.synth) {
    console.log('Speech synthesis is not supported');
  }
  this.synth.onvoiceschanged = this.setVoice.bind(this);
  this.root.display = 'none';
}

Webifi.prototype.setVoice = function() {
  if (!this.synth) {
    return;
  }
  const voices = this.synth.getVoices();
  for (let voice of voices) {
    if (!this.voice) {
      this.voice = voice;
    }
    if (voice.name.indexOf('UK English Female') >= 0 ||
        voice.name.indexOf('Daniel') >= 0 ||
        voice.name.indexOf('Rishi') >= 0) {
      console.log('Found voice: ' + voice.name);
      this.voice = voice;
      break;
    }
  }
  if (!this.voice) {
    console.log('Speech synthesis: no voice found');
    return;
  }
}

Webifi.prototype.appendToLog = function(from, text, list=[], numbered=true) {
  if (!text && (!list || list.length == 0)) {
    return;
  }
  if (this.logEntries.length > this.logIndex &&
      this.logEntries[this.logIndex]) {
    this.logEntries[this.logIndex].remove();
  }
  const logEntry = document.createElement('div');
  logEntry.className = 'webifi-log-entry';
  logEntry.innerText = (from ? from + ': ' : '') + text;
  if (list && list.length > 0) {
    const l = document.createElement(numbered ? 'ol' : 'ul');
    logEntry.append(l);
    for (let entry of list) {
      const li = document.createElement('li');
      li.innerText = entry;
      l.append(li);
    }
  }
  this.log.append(logEntry);

  // Scroll to the bottom
  this.log.scrollTop = Number.MAX_SAFE_INTEGER;

  if (this.logEntries.length <= this.logIndex) {
    this.logEntries.length = this.logIndex + 1;
  }
  this.logEntries[this.logIndex] = logEntry;
  this.logIndex = (this.logIndex + 1) % this.MAX_LOG_ENTRIES;
}

Webifi.prototype.wordsOf = function(s) {
  const words = s.replace(/\s/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  if (words.length == 1 && !words[0]) {
    return [];
  }
  return words;
}

Webifi.prototype.replaceNumbers = function(s, numbers) {
  return s.replaceAll(/[0-9]+(?:\.[0-9]+)?/g, (match, offset, s) => {
    numbers.push(match);
    return s.substr(0, offset) + '[number]';
  });
}

/**
 * Will skip annotating parts within 'webifi-escape' occurrences/
 */
Webifi.prototype.annotateText = function(text) {
  const words = this.wordsOf(text);
  const originalLength = words.length;
  let skip = false;
  for (let i = 0; i < originalLength; i++) {
    if (words[i] == 'webifi-escape') {
      words[i] = '';
      skip = !skip;
      continue;
    }
    if (skip) {
      continue;
    }
    const word = words[i].
      replace(/\//g, ' slash ').
      replace(/%/g, ' percent ').
      replace(/\//g, ' slash ').
      replace(/#/g, ' hash-symbol ').
      replace(/\$/g, ' dollar-symbol ').
      replace(/&/g, ' ampersand ').
      replace(/@/g, ' at-symbol ').trim().replace(/\s+/g, ' ');
    if (word == '?') {
      words[i] = 'question-mark';
    } else if (word == '.') {
      words[i] = 'period';
    } else if (word == '!') {
      words[i] = 'exclamation-mark';
    } else if (word == '-' || word == '—') {
      words[i] = 'dash';
    } else {
      // Annotate hyphen or dash in the unmodified word first.
      const dashParts = words[i].split(/[—-]/);
      if (dashParts.length > 1) {
        words.push('Note that "' + words[i] + '" is spelled as ' + dashParts.join(' dash ') + '.');
      }
      words[i] = word;
      const wordParts = word.split(' ');
      for (let wordPart of wordParts) {
        const letters = wordPart.replace(/[^a-zA-Z\(\)\?\.,!—-]/g, '');
        const lettersAfter = letters.substr(1);
        if (lettersAfter.toLowerCase() != lettersAfter ||
            (letters.length < wordPart.length) ||
            wordPart.indexOf('\'') >= 0 ||
            (!wordPart.endsWith('...') && wordPart.endsWith('.'))) {
          const spellingBits = wordPart.split('');
          const spelling = spellingBits.join(' ').toUpperCase().
              replace(/\./g, 'period').replace(/'/g, 'apostrophe');
          words.push('Note that "' + wordPart + '" is spelled as ' + spelling + '.');
        }
      }
    }
  }
  if (words.length > 0 && words[words.length - 1].endsWith('...')) {
    words.push('Note that the last word ends with dot-dot-dot.');
  }
  if (originalLength > 0 &&
      !words[originalLength - 1].endsWith('.')) {
    words[originalLength - 1] += '.';
  }
  return words.join(' ');
}

Webifi.prototype.notIndexable = function(lcWord) {
  return this.stopWords[lcWord] ||
    (lcWord.search(/[^a-z0-9\.,'\[\]-]/) >= 0) || false;
}

Webifi.prototype.commandMatch = function(words, matchers) {
  let matchLength = 0;
  let longestMatchIndex = -1;
  for (let index = 0; index < matchers.length; index++) {
    const matcher = matchers[index];
    let allMatch = true;
    for (let i = 0; i < matcher.length; i++) {
      if (i >= words.length || !matcher[i].includes(words[i])) {
        allMatch = false;
        break;
      }
    }
    if (allMatch && (matcher.length > matchLength)) {
      matchlength = matcher.length;
      longestMatchIndex = index;
    }
  }
  return longestMatchIndex;
}

Webifi.prototype.handleInput = function() {
  let input = this.input.value.trim().substr(0, this.MAX_LEN);
  this.input.value = '';
  if (!input) {
    return;
  }
  if (this.synth) {
    this.synth.cancel();
  }
  if (this.pendingInputClosure) {
    this.appendToLog('', 'User input: ' + input);
    const func = this.pendingInputClosure;
    this.pendingInputClosure = null;
    func(input);
    return;
  }
  this.appendToLog('', '> ' + input);
  // Remove trailing punctuation.
  if (input.length > 1 &&
      (input.endsWith('?') || input.endsWith('!') || input.endsWith('.'))) {
    input = input.substr(0, input.length - 1);
  }
  const numbers = [];
  const words = this.wordsOf(input);
  const modWords = words.slice();
  const candidates = {};
  for (let i = 0; i < modWords.length; i++) {
    modWords[i] = this.replaceNumbers(words[i].toLowerCase(), numbers);
    if (!this.index[modWords[i]]) continue;
    const choices = this.index[modWords[i]];
    for (let choice of choices) {
      if (!candidates[choice.avatar]) {
        candidates[choice.avatar] = {};
      }
      candidates[choice.avatar][choice.command] = true;
    }
  }
  // Sort by priority.
  const candidateAvatars = [];
  for (let avatarName of this.sortedAvatarNames) {
    if (candidates[avatarName]) {
      candidateAvatars.push(avatarName);
    }
  }
  for (let avatarName of candidateAvatars) {
    const avatar = this.avatars[avatarName];
    for (let commandName in candidates[avatarName]) {
      const command = avatar.commands[commandName];
      const match = this.commandMatch(modWords, command.matchers);
      if (match >= 0) {
        avatar.handler(input, words, commandName,
                       command.matchers[match].length, command.prefixes[match],
                       numbers);
      }
    }
  }
  this.input.focus();
}

Webifi.prototype.output = function(avatarName, text, list=[], numbered=true) {
  if (this.pendingInputClosure) {
    console.log('output() denied to ' + avatarName + ' as there is user input pending');
    return;
  }
  if (!this.avatars[avatarName]) {
    console.log('Avatar ' + avatarName + ' not found');
    return;
  }
  const avatar = this.avatars[avatarName];
  if (text.length > this.MAX_LEN) {
    text = text.substr(0, this.MAX_LEN);
  }
  if (list.length > this.MAX_LIST_LEN) {
    list.length = this.MAX_LIST_LEN;
  }
  for (let index = 0; index < list.length; index++) {
    if (list[index].length > this.MAX_LEN) {
      list[index] = list[index].substr(0, this.MAX_LEN);
    }
  }

  this.appendToLog(avatarName, text, list, numbered);
  if (!this.synth || !this.voice) {
    console.log('Speech synthesis or voice not available');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = this.voice;
  utterance.lang = this.voice.lang;
  utterance.pitch = avatar.pitch;
  utterance.rate = this.rate;
  this.synth.speak(utterance);
  let index = 1;
  for (let entry of list) {
    const prefix = numbered ? ('Number ' + index + ' out of ' + list.length + ': ') : '';
    const li = new SpeechSynthesisUtterance(prefix + entry);
    index++;
    li.voice = this.voice;
    li.lang = this.voice.lang;
    li.pitch = avatar.pitch;
    li.rate = this.rate;
    this.synth.speak(li);
  }
}

Webifi.prototype.getUserInput = function(avatarName, prompt, func) {
  if (this.pendingInputClosure) {
    console.log('getUserInput() from ' + avatarName +
        ' returning false as there already is user input pending');
    return false;
  }
  this.output(avatarName, prompt + '. Please enter your response:');
  this.pendingInputClosure = func;
  return true;
}

/**
 * TODO
 * commands is a dict that look like: {
 *   '..name..': {
 *     description: '...',
 *     prefixes: ['....', ],
 *     helpkeys: ['...', ], // optional additional keywords for "help"
 *   },
 * }
 * prefixes can include the special placeholder symbol, '[number]' for
 * capturing numeric parameters.
 */
Webifi.prototype.registerAvatar = function(name, description, commands, handler) {
  if (this.avatars[name]) {
    console.log('Cannot register an avatar under the already used name, ' + name);
    return false;
  }
  const avatarIndex = Object.keys(this.avatars).length;
  this.avatars[name] = {
    'commands': commands,
    'handler': handler,
    'description': description,
    'pitch': 1.2 - ((avatarIndex % 4) * 0.2),
  };
  this.sortedAvatarNames = [name].concat(this.sortedAvatarNames);
  for (let commandName in commands) {
    const command = commands[commandName];
    command.matchers = [];
    for (let prefix of command.prefixes) {
      const matcher = [];
      const words = this.wordsOf(prefix);
      for (let word of words) {
        const variants = word.toLowerCase().split('|');
        matcher.push(variants);
        for (let variant of variants) {
          if (this.notIndexable(variant)) {
            continue;
          }
          if (!this.index[variant]) this.index[variant] = [];
          this.index[variant].push({'avatar': name, 'command': commandName});
          if (!this.helpIndex[variant]) this.helpIndex[variant] = [];
          this.helpIndex[variant].push({'avatar': name, 'command': commandName});
        }
      }
      command.matchers.push(matcher);
    }
    const helpkeys = [commandName].concat(
        command['helpkeys'] || []);
    for (let h of helpkeys) {
      const words = this.wordsOf(h);
      for (let word of words) {
        const lcWord = word.toLowerCase();
        if (this.notIndexable(lcWord)) {
          continue;
        }
        if (!this.helpIndex[lcWord]) this.helpIndex[lcWord] = [];
        this.helpIndex[lcWord].push({'avatar': name, 'command': commandName});
      }
    }
  }
  const avatarWords = this.wordsOf(name + ' ' + description);
  for (let word of avatarWords) {
    const lcWord = word.toLowerCase();
    if (this.notIndexable(lcWord)) {
      continue;
    }
    if (!this.helpIndex[lcWord]) this.helpIndex[lcWord] = [];
    this.helpIndex[lcWord].push({'avatar': name});
  }
  return true;
}

/**
 * TODO
 */
Webifi.prototype.start = function() {
  this.root.display = '';
  this.input.focus();
}

/**
 * TODO
 */
Webifi.prototype.stop = function() {
  this.root.display = 'none';
}

Webifi.prototype.introduce = function() {
  this.output(this.name, 'Hi! I am Webifi, an interactive fiction-esque web interface.');
  this.output(this.name, 'You can say, "help," to get a full list of commands, or you can say, "help," followed by a topic.');
  if (this.sortedAvatarNames.length > 1) {
    this.output(this.name,
        'Here are the avatars helping me. You can also say, "help," followed by any avatar name.',
        this.sortedAvatarNames.slice(0, this.sortedAvatarNames.length - 1));
  }
  this.output(this.name, 'You can always cut short whatever I am saying by entering any word, such as OK or Shh.');
}

Webifi.prototype.help = function(topic) {
  const words = this.wordsOf(topic);
  const candidates = {};
  for (let word of words) {
    const lcWord = word.toLowerCase();
    if (!this.helpIndex[lcWord]) continue;
    const choices = this.helpIndex[lcWord];
    for (let choice of choices) {
      if (!candidates[choice.avatar]) {
        candidates[choice.avatar] = {};
      }
      const command = choice.command || '_';
      candidates[choice.avatar][command] = true;
    }
  }
  if (Object.keys(candidates).length == 0) {
    this.output(this.name, 'Sorry, I do not have any help available for ' + topic);
    return;
  }
  for (let avatarName in candidates) {
    const avatar = this.avatars[avatarName];
    for (let commandName in candidates[avatarName]) {
      if (commandName == '_') {
        const list = Object.keys(avatar.commands);
        const opening = avatarName + '. ' + avatar.description + ' Available commands:';
        this.output(avatarName, opening, list);
        continue;
      }
      const command = avatar.commands[commandName];
      const opening = (avatarName == this.name) ?
         this.name : ('As ' + avatarName + ', I');
      const prefixesToSay = command.prefixes.map(x => x.replace(/\|/g, ' or '));
      this.output(avatarName,
          opening + ' can handle the command ' +
          commandName + '. ' + command.description +
          ' Trigger this command with any of these prefixes:',
          prefixesToSay);
    }
  }
}

Webifi.prototype.basicHandler = function(input, words, commandName,
                                         numMatchedWords, matchingPrefix,
                                         numbers) {
  let remaining = '';
  if (numMatchedWords < words.length) {
    remaining = words.slice(numMatchedWords).join(' ');
  }
  if (commandName == 'hello') {
    this.introduce();
  } else if (commandName == 'echo') {
    this.output(this.name, this.annotateText(remaining));
  } else if (commandName == 'talking-speed' && numbers.length > 0) {
    this.rate = parseFloat(numbers[0]);
    if (isNaN(this.rate) || this.rate < 0.1 || this.rate > 2.0) this.rate = 1.0;
    this.output(this.name, 'OK, talking speed now set to ' + this.rate.toFixed(1));
  } else if (commandName == 'talking-speed' && words.length > 1) {
    const qualifier = words[1].toLowerCase().charAt(0);
    if (qualifier == 's' && this.rate >= 0.2) {
      this.rate = this.rate - 0.1;
    } else if (qualifier == 'f' && this.rate <= 1.9) {
      this.rate = this.rate + 0.1;
    } else if (qualifier == 'n') {
      this.rate = 1.0;
    }
    this.output(this.name, 'OK, talking speed now set to ' + this.rate.toFixed(1));
  } else if (commandName == 'help') {
    if (remaining) {
      this.help(remaining);
    } else {
      for (let a of this.sortedAvatarNames) {
        this.help(a);
      }
    }
  }
}

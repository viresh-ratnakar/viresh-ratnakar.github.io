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

function WordsWebifi(webifi) {
  this.webifi = webifi;
  this.name = 'Words';
  this.description = 'Word patterns, anagrams, word sounds, definitions, synonyms';

  this.lex = null;
  if (!this.initLex()) {
    this.loadLex();
  }
  this.WORD_GROUP_SIZE = 4;
  this.WORD_CHOICES = this.WORD_GROUP_SIZE * webifi.MAX_LIST_LEN;

  this.webifi.registerAvatar(this.name, this.description, {
    'define': {
      description: 'Use dictionary dev dot api to look up a word or phrase.',
      prefixes: ['define|definition|definitions', 'look up', 'definition|definitions|meaning of',],
      helpkeys: ['word', 'words', 'phrase',],
    },
    'synonyms': {
      description: 'Use dictionary dev dot api to look up synonyms of a word or phrase.',
      prefixes: ['synonym|synonyms|syns', 'synonym|synonyms|syns of',],
      helpkeys: ['word', 'words', 'phrase',],
    },
    'pattern': {
      description: 'Get words or phrases matching the given letter pattern.',
      prefixes: ['pattern|word-pattern|letter-pattern',],
      helpkeys: ['word', 'words', 'phrase', 'letters',],
    },
    'anagrams': {
      description: 'Get anagrams of a word or phrase or any set of letters.',
      prefixes: ['anagrams|anagram', 'anagrams|anagram of',],
      helpkeys: ['word', 'words', 'phrase', 'letters',],
    },
    'homophones': {
      description: 'Get homophones of a word or phrase.',
      prefixes: ['homophone|homophones', 'homophone|homophones of', 'words sounding like',],
      helpkeys: ['word', 'words', 'phrase', 'sound', 'sounds',],
    },
    'spoonerisms': {
      description: 'Get Spoonerisms of a word or phrase.',
      prefixes: ['spoonerism|spoonerisms', 'spoonerism|spoonerisms of',],
      helpkeys: ['reverend', 'spooner', 'word', 'words', 'phrase', 'sound', 'sounds',],
    },
  }, this.handler.bind(this));
}

WordsWebifi.prototype.initLex = function() {
  if ((typeof exetLexicon == 'undefined') || (typeof exetLexiconInit== 'undefined') ) {
    console.log('Lexicon not yet available');
    return false;
  }
  if (this.lex) {
    console.log('Lexicon already initialized');
    return true;
  }
  console.log('Initializing lexicon');
  exetLexiconInit();
  this.lex = exetLexicon;
  return true;
}

WordsWebifi.prototype.loadLex = function() {
  const handler = this.initLex.bind(this);
  const scriptLufz = document.createElement('script');
  scriptLufz.src = this.webifi.scriptUrlBase + 'lufz-en-lexicon.js';
  scriptLufz.onload = handler;
  scriptLufz.onerror = (ev) => {console.log(ev); console.log('error loading script');}
  const scriptLex = document.createElement('script');
  scriptLex.src = this.webifi.scriptUrlBase + 'exet-lexicon.js';
  scriptLex.onload = handler;
  document.head.append(scriptLufz);
  document.head.append(scriptLex);
}

WordsWebifi.prototype.syndefHandler = function(input, words, commandName,
    numMatchedWords) {
  let onlySyns = (commandName == 'synonyms');
  const phrase = words.slice(numMatchedWords).join(' ');
  if (!phrase) {
    return;
  }
  const webifi = this.webifi;
  const name = this.name;
  webifi.output(name, 'Looking for ' + (onlySyns ? 'synonyms' : 'definitions') + ' of ' + phrase);
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status < 200 || this.status > 299) {
        webifi.output(name, 'Look-up failed for ' + phrase);
        return
      }
      const json = this.responseText.replace(/\n/g, '');
      try {
        const parsedDefs = JSON.parse(json);
        const results = [];
        for (let parsedDef of parsedDefs) {
          for (let meaning of parsedDef.meanings) {
            const pos = meaning.partOfSpeech || '';
            for (let definition of meaning.definitions) {
              let def = (pos ? (pos + '. ') : '') + definition.definition;
              let syns = '';
              if ('synonyms' in definition) {
                syns = definition.synonyms.join(', ');
                if (syns) {
                  def = def + '. Synonyms: ' + syns;
                }
              }
              if (onlySyns) {
                if (syns) results.push(syns);
              } else {
                results.push(def);
              }
            }
          }
        }
        if (results.length > 0) {
          webifi.output(name, (onlySyns ? 'Synonyms' : 'Definitions') + ' of ' + phrase, results);
        } else {
          webifi.output(name, 'No ' + (onlySyns ? 'synonyms' : 'definitions') + ' were found for ' + phrase);
        }
      } catch (err) {
        webifi.output(name, 'Could not parse look-up results for ' + phrase);
      }
    }
  };
  xhttp.open(
      'GET', 'https://api.dictionaryapi.dev/api/v2/entries/en/' + phrase, true);
  xhttp.send();
}

WordsWebifi.prototype.numEnumPunctMatches = function(p, e) {
  let num = 0;
  let minl = Math.min(p.length, e.length);
  for (let i = 0; i < minl; i++) {
    if (p[i] != '?' && p[i] == e[i]) num++;
    if (p[i] == '?' && !this.lex.allLetters[e[i].toUpperCase()]) num--;
  }
  return num;
}

WordsWebifi.prototype.enumMatchSorter = function(p, k1, k2) {
  const entry1 = this.lex.getLex(k1);
  const entry2 = this.lex.getLex(k2);
  return this.numEnumPunctMatches(p, entry2) -
         this.numEnumPunctMatches(p, entry1);
}

WordsWebifi.prototype.makeGroups = function(list, groupSize) {
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

WordsWebifi.prototype.handlePattern = function(pattern) {
  if (!pattern) {
    return;
  }
  if (!this.lex) {
    this.webifi.output(this.name, 'This command is not available as the lexicon file has not been loaded');
    return;
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

WordsWebifi.prototype.handleAnagrams = function(fodder) {
  if (!fodder) {
    return;
  }
  if (!this.lex) {
    this.webifi.output(this.name, 'This command is not available as the lexicon file has not been loaded');
    return;
  }
  const matchingWords = this.lex.getAnagrams(fodder, this.WORD_CHOICES);
  if (matchingWords.length == 0) {
    this.webifi.output(this.name, 'No anagrams were found.');
    return;
  }
  this.webifi.output(this.name, 'Here are some anagrams of ' + fodder + '.', this.makeGroups(matchingWords, this.WORD_GROUP_SIZE), false);
}

WordsWebifi.prototype.handleHomophones = function(phrase) {
  if (!phrase) {
    return;
  }
  if (!this.lex) {
    this.webifi.output(this.name, 'This command is not available as the lexicon file has not been loaded');
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

WordsWebifi.prototype.handleSpoonerisms = function(phrase) {
  if (!phrase) {
    return;
  }
  if (!this.lex) {
    this.webifi.output(this.name, 'This command is not available as the lexicon file has not been loaded');
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


WordsWebifi.prototype.handler = function(input, words, commandName,
    numMatchedWords, matchingPrefix, numbers) {
  if (commandName == 'define' || commandName == 'synonyms') {
    this.syndefHandler(input, words, commandName, numMatchedWords, matchingPrefix, numbers);
    return;
  }
  const remaining = words.slice(numMatchedWords).join(' ');
  if (commandName == 'pattern') {
    this.handlePattern(remaining);
  } else if (commandName == 'anagrams') {
    this.handleAnagrams(remaining);
  } else if (commandName == 'homophones') {
    this.handleHomophones(remaining);
  } else if (commandName == 'spoonerisms') {
    this.handleSpoonerisms(remaining);
  }
}

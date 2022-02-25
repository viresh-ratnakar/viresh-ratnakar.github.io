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

function DictionaryWebifi(webifi) {
  this.webifi = webifi;
  this.name = 'Dictionary';
  this.description = 'Dictionary look-ups of words and phrases.';

  this.webifi.registerAvatar(this.name, this.description, {
    'define': {
      description: 'Use dictionary dev dot api to look up a word or phrase.',
      prefixes: ['define|definition|definitions', 'look up', 'definition|definitions|meaning of',],
      helpkeys: ['word', 'phrase',],
    },
    'synonyms': {
      description: 'Use dictionary dev dot api to look up synonyms of a word or phrase.',
      prefixes: ['synonyms|syns', 'synonyms|syns of',],
      helpkeys: ['word', 'phrase',],
    },
  }, this.handler.bind(this));
}

DictionaryWebifi.prototype.handler = function(input, words, commandName,
    numMatchedWords, matchingPrefix, numbers) {
  if (commandName != 'define' && commandName != 'synonyms') {
    return;
  }
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

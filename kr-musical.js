
/*
The MIT License (MIT)

Copyright (c) 2013 Keith William Horwood

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var Synth, AudioSynth, AudioSynthInstrument;
!function(){

	var URL = window.URL || window.webkitURL;
	var Blob = window.Blob;

	if(!URL || !Blob) {
		throw new Error('This browser does not support AudioSynth');
	}

	var _encapsulated = false;
	var AudioSynthInstance = null;
	var pack = function(c,arg){ return [new Uint8Array([arg, arg >> 8]), new Uint8Array([arg, arg >> 8, arg >> 16, arg >> 24])][c]; };
	var setPrivateVar = function(n,v,w,e){Object.defineProperty(this,n,{value:v,writable:!!w,enumerable:!!e});};
	var setPublicVar = function(n,v,w){setPrivateVar.call(this,n,v,w,true);};
	AudioSynthInstrument = function AudioSynthInstrument(){this.__init__.apply(this,arguments);};
	var setPriv = setPrivateVar.bind(AudioSynthInstrument.prototype);
	var setPub = setPublicVar.bind(AudioSynthInstrument.prototype);
	setPriv('__init__', function(a,b,c) {
		if(!_encapsulated) { throw new Error('AudioSynthInstrument can only be instantiated from the createInstrument method of the AudioSynth object.'); }
		setPrivateVar.call(this, '_parent', a);
		setPublicVar.call(this, 'name', b);
		setPrivateVar.call(this, '_soundID', c);
	});
	setPub('play', function(note, octave, duration) {
		return this._parent.play(this._soundID, note, octave, duration);
	});
	setPub('generate', function(note, octave, duration) {
		return this._parent.generate(this._soundID, note, octave, duration);
	});
	AudioSynth = function AudioSynth(){if(AudioSynthInstance instanceof AudioSynth){return AudioSynthInstance;}else{ this.__init__(); return this; }};
	setPriv = setPrivateVar.bind(AudioSynth.prototype);
	setPub = setPublicVar.bind(AudioSynth.prototype);
	setPriv('_debug',false,true);
	setPriv('_bitsPerSample',16);
	setPriv('_channels',1);
	setPriv('_sampleRate',44100,true);
	setPub('setSampleRate', function(v) {
		this._sampleRate = Math.max(Math.min(v|0,44100), 4000);
		this._clearCache();
		return this._sampleRate;
	});
	setPub('getSampleRate', function() { return this._sampleRate; });
	setPriv('_volume',32768,true);
	setPub('setVolume', function(v) {
		v = parseFloat(v); if(isNaN(v)) { v = 0; }
		v = Math.round(v*32768);
		this._volume = Math.max(Math.min(v|0,32768), 0);
		this._clearCache();
		return this._volume;
	});
	setPub('getVolume', function() { return Math.round(this._volume/32768*10000)/10000; });
	setPriv('_notes',{'C':261.63,'C#':277.18,'D':293.66,'D#':311.13,'E':329.63,'F':349.23,'F#':369.99,'G':392.00,'G#':415.30,'A':440.00,'A#':466.16,'B':493.88});
	setPriv('_fileCache',[],true);
	setPriv('_temp',{},true);
	setPriv('_sounds',[],true);
	setPriv('_mod',[function(i,s,f,x){return Math.sin((2 * Math.PI)*(i/s)*f+x);}]);
	setPriv('_resizeCache', function() {
		var f = this._fileCache;
		var l = this._sounds.length;
		while(f.length<l) {
			var octaveList = [];
			for(var i = 0; i < 8; i++) {
				var noteList = {};
				for(var k in this._notes) {
					noteList[k] = {};
				} 
				octaveList.push(noteList);
			}
			f.push(octaveList);
		}
	});
	setPriv('_clearCache', function() {
		this._fileCache = [];
		this._resizeCache();
	});
	setPub('generate', function(sound, note, octave, duration) {
		var thisSound = this._sounds[sound];
		if(!thisSound) {
			for(var i=0;i<this._sounds.length;i++) {
				if(this._sounds[i].name==sound) {
					thisSound = this._sounds[i];
					sound = i;
					break;
				}
			}
		}
		if(!thisSound) { throw new Error('Invalid sound or sound ID: ' + sound); }
		var t = (new Date).valueOf();
		this._temp = {};
		octave |= 0;
		octave = Math.min(8, Math.max(1, octave));
		var time = !duration?2:parseFloat(duration);
		if(typeof(this._notes[note])=='undefined') { throw new Error(note + ' is not a valid note.'); }
		if(typeof(this._fileCache[sound][octave-1][note][time])!='undefined') {
			if(this._debug) { console.log((new Date).valueOf() - t, 'ms to retrieve (cached)'); }
			return this._fileCache[sound][octave-1][note][time];
		} else {
			var frequency = this._notes[note] * Math.pow(2,octave-4);
			var sampleRate = this._sampleRate;
			var volume = this._volume;
			var channels = this._channels;
			var bitsPerSample = this._bitsPerSample;
			var attack = thisSound.attack(sampleRate, frequency, volume);
			var dampen = thisSound.dampen(sampleRate, frequency, volume);
			var waveFunc = thisSound.wave;
			var waveBind = {modulate: this._mod, vars: this._temp};
			var val = 0;
			var curVol = 0;

			var data = new Uint8Array(new ArrayBuffer(Math.ceil(sampleRate * time * 2)));
			var attackLen = (sampleRate * attack) | 0;
			var decayLen = (sampleRate * time) | 0;

			for (var i = 0 | 0; i !== attackLen; i++) {
		
				val = volume * (i/(sampleRate*attack)) * waveFunc.call(waveBind, i, sampleRate, frequency, volume);

				data[i << 1] = val;
				data[(i << 1) + 1] = val >> 8;

			}

			for (; i !== decayLen; i++) {

				val = volume * Math.pow((1-((i-(sampleRate*attack))/(sampleRate*(time-attack)))),dampen) * waveFunc.call(waveBind, i, sampleRate, frequency, volume);

				data[i << 1] = val;
				data[(i << 1) + 1] = val >> 8;

			}

			var out = [
				'RIFF',
				pack(1, 4 + (8 + 24/* chunk 1 length */) + (8 + 8/* chunk 2 length */)), // Length
				'WAVE',
				// chunk 1
				'fmt ', // Sub-chunk identifier
				pack(1, 16), // Chunk length
				pack(0, 1), // Audio format (1 is linear quantization)
				pack(0, channels),
				pack(1, sampleRate),
				pack(1, sampleRate * channels * bitsPerSample / 8), // Byte rate
				pack(0, channels * bitsPerSample / 8),
				pack(0, bitsPerSample),
				// chunk 2
				'data', // Sub-chunk identifier
				pack(1, data.length * channels * bitsPerSample / 8), // Chunk length
				data
			];
			var blob = new Blob(out, {type: 'audio/wav'});
			var dataURI = URL.createObjectURL(blob);
			this._fileCache[sound][octave-1][note][time] = dataURI;
			if(this._debug) { console.log((new Date).valueOf() - t, 'ms to generate'); }
			return dataURI;
		}
	});
	setPub('play', function(sound, note, octave, duration) {
		var src = this.generate(sound, note, octave, duration);
		var audio = new Audio(src);
		audio.play();
		return true;
	});
	setPub('debug', function() { this._debug = true; });
	setPub('createInstrument', function(sound) {
		var n = 0;
		var found = false;
		if(typeof(sound)=='string') {
			for(var i=0;i<this._sounds.length;i++) {
				if(this._sounds[i].name==sound) {
					found = true;
					n = i;
					break;
				}
			}
		} else {
			if(this._sounds[sound]) {
				n = sound;
				sound = this._sounds[n].name;
				found = true;
			}
		}
		if(!found) { throw new Error('Invalid sound or sound ID: ' + sound); }
		_encapsulated = true;
		var ins = new AudioSynthInstrument(this, sound, n);
		_encapsulated = false;
		return ins;
	});
	setPub('listSounds', function() {
		var r = [];
		for(var i=0;i<this._sounds.length;i++) {
			r.push(this._sounds[i].name);
		}
		return r;
	});
	setPriv('__init__', function(){
		this._resizeCache();
	});
	setPub('loadSoundProfile', function() {
		for(var i=0,len=arguments.length;i<len;i++) {
			o = arguments[i];
			if(!(o instanceof Object)) { throw new Error('Invalid sound profile.'); }
			this._sounds.push(o);
		}
		this._resizeCache();
		return true;
	});
	setPub('loadModulationFunction', function() {
		for(var i=0,len=arguments.length;i<len;i++) {
			f = arguments[i];
			if(typeof(f)!='function') { throw new Error('Invalid modulation function.'); }
			this._mod.push(f);
		}
		return true;
	});
	AudioSynthInstance = new AudioSynth();
	Synth = AudioSynthInstance;
}();

Synth.loadModulationFunction(
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 1 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x); },
	function(i, sampleRate, frequency, x) { return 0.5 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x); }
);

Synth.loadSoundProfile({
	name: 'piano',
	attack: function() { return 0.002; },
	dampen: function(sampleRate, frequency, volume) {
		return Math.pow(0.5*Math.log((frequency*volume)/sampleRate),2);
	},
	wave: function(i, sampleRate, frequency, volume) {
		var base = this.modulate[0];
		return this.modulate[1](
			i,
			sampleRate,
			frequency,
			Math.pow(base(i, sampleRate, frequency, 0), 2) +
				(0.75 * base(i, sampleRate, frequency, 0.25)) +
				(0.1 * base(i, sampleRate, frequency, 0.5))
		);
	}
},
{
	name: 'organ',
	attack: function() { return 0.3 },
	dampen: function(sampleRate, frequency) { return 1+(frequency * 0.01); },
	wave: function(i, sampleRate, frequency) {
		var base = this.modulate[0];
		return this.modulate[1](
			i,
			sampleRate,
			frequency,
			base(i, sampleRate, frequency, 0) +
				0.5*base(i, sampleRate, frequency, 0.25) +
				0.25*base(i, sampleRate, frequency, 0.5)
		);
	}
},
{
	name: 'acoustic',
	attack:	function() { return 0.002; },
	dampen: function() { return 1; },
	wave: function(i, sampleRate, frequency) {

		var vars = this.vars;
		vars.valueTable = !vars.valueTable?[]:vars.valueTable;
		if(typeof(vars.playVal)=='undefined') { vars.playVal = 0; }
		if(typeof(vars.periodCount)=='undefined') { vars.periodCount = 0; }
	
		var valueTable = vars.valueTable;
		var playVal = vars.playVal;
		var periodCount = vars.periodCount;

		var period = sampleRate/frequency;
		var p_hundredth = Math.floor((period-Math.floor(period))*100);

		var resetPlay = false;

		if(valueTable.length<=Math.ceil(period)) {
	
			valueTable.push(Math.round(Math.random())*2-1);
	
			return valueTable[valueTable.length-1];
	
		} else {
	
			valueTable[playVal] = (valueTable[playVal>=(valueTable.length-1)?0:playVal+1] + valueTable[playVal]) * 0.5;
	
			if(playVal>=Math.floor(period)) {
				if(playVal<Math.ceil(period)) {
					if((periodCount%100)>=p_hundredth) {
						// Reset
						resetPlay = true;
						valueTable[playVal+1] = (valueTable[0] + valueTable[playVal+1]) * 0.5;
						vars.periodCount++;	
					}
				} else {
					resetPlay = true;	
				}
			}
	
			var _return = valueTable[playVal];
			if(resetPlay) { vars.playVal = 0; } else { vars.playVal++; }
	
			return _return;
	
		}
	}
},
{
	name: 'edm',
	attack:	function() { return 0.002; },
	dampen: function() { return 1; },
	wave: function(i, sampleRate, frequency) {
		var base = this.modulate[0];
		var mod = this.modulate.slice(1);
		return mod[0](
			i,
			sampleRate,
			frequency,
			mod[9](
				i,
				sampleRate,
				frequency,
				mod[2](
					i,
					sampleRate,
					frequency,
					Math.pow(base(i, sampleRate, frequency, 0), 3) +
						Math.pow(base(i, sampleRate, frequency, 0.5), 5) +
						Math.pow(base(i, sampleRate, frequency, 1), 7)
				)
			) +
				mod[8](
					i,
					sampleRate,
					frequency,
					base(i, sampleRate, frequency, 1.75)
				)
		);
	}
});

// --------END AUDIOSYNTH CODE---------------------------------

const STAVE_OFFSET_LEFT = 140
const STAVE_OFFSET_TOP = 45
const PLAY_COLOUR = 'crimson'
let piano = Synth.createInstrument('piano');
let notes = []
let bases = []
let playButton = null

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNotePlayer(ellipse, stem, note, octave, sec) {
  return async function() {
    ellipse.setAttributeNS(null, 'fill', PLAY_COLOUR)
    stem.setAttributeNS(null, 'stroke', PLAY_COLOUR)
    stem.style.display = ''
    piano.play(note, octave, sec);
    await sleep(200);
    ellipse.setAttributeNS(null, 'fill', 'black')
    stem.setAttributeNS(null, 'stroke', 'black')
    stem.style.display = 'none'
  };
}

async function playTune() {
  playButton.disabled = true
  deactivateCurrentCell()
  deactivateCurrentClue()
  for (let note of notes) {
    note.stem.style.display = ''
  }
  for (let base of bases) {
    base.style.display = ''
  }
  background.setAttributeNS(null, 'fill', 'lightgray');
  await sleep(1000);
  let lastNote = null
  for (let note of notes) {
    if (lastNote) {
      lastNote.ellipse.setAttributeNS(null, 'fill', 'black')
      lastNote.stem.setAttributeNS(null, 'stroke', 'black')
    }
    note.ellipse.setAttributeNS(null, 'fill', PLAY_COLOUR)
    note.stem.setAttributeNS(null, 'stroke', PLAY_COLOUR)
    lastNote = note
    piano.play(note.note, note.octave, note.sec)
    await sleep(150);
  }
  if (lastNote) {
    lastNote.ellipse.setAttributeNS(null, 'fill', 'black')
    lastNote.stem.setAttributeNS(null, 'stroke', 'black')
  }
  await sleep(2000);
  for (let note of notes) {
    note.stem.style.display = 'none'
  }
  for (let base of bases) {
    base.style.display = 'none'
  }
  background.setAttributeNS(null, 'fill', gridBackground);
  playButton.disabled = false
}

function makeStem(row, col, h) {
  let x = 0.0 + STAVE_OFFSET_LEFT + GRIDLINE + (col * (GRIDLINE + SQUARE_DIM))
  let y = 0.0 + STAVE_OFFSET_TOP + GRIDLINE + (row * (GRIDLINE + SQUARE_DIM))
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttributeNS(null, 'stroke', 'black');
  line.setAttributeNS(null, 'stroke-width', 3);
  line.setAttributeNS(null, 'x1', x);
  line.setAttributeNS(null, 'x2', x);
  line.setAttributeNS(null, 'y1', y);
  line.setAttributeNS(null, 'y2', y - (h * (GRIDLINE + SQUARE_DIM)))
  line.style.display = 'none'
  svg.appendChild(line)
  return line
}

function makeNote(row, col, note, octave, sec, stemRow, stemCol, stemH) {
  let x = 0.0 + STAVE_OFFSET_LEFT + GRIDLINE +
    (col * (GRIDLINE + SQUARE_DIM)) + CIRCLE_RADIUS
  let y = 0.0 + STAVE_OFFSET_TOP + GRIDLINE +
    (row * (GRIDLINE + SQUARE_DIM)) + CIRCLE_RADIUS
  const ellipse =
    document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttributeNS(null, 'cx', x)
  ellipse.setAttributeNS(null, 'cy', y)
  ellipse.setAttributeNS(null, 'rx', 17)
  ellipse.setAttributeNS(null, 'ry', 12)
  ellipse.setAttributeNS(null, 'transform', 'rotate(-28,' + x + ',' + y + ')')
  ellipse.setAttributeNS(null, 'class', 'clickable')
  svg.appendChild(ellipse)
  let stem = makeStem(stemRow, stemCol, stemH)
  ellipse.addEventListener(
    'click', getNotePlayer(ellipse, stem, note, octave, sec));
  return {
    'ellipse': ellipse,
    'stem': stem,
    'note': note,
    'octave': octave,
    'sec': sec
  }
}

function makeBase(row, col, w) {
  let x = 0.0 + STAVE_OFFSET_LEFT + GRIDLINE + (col * (GRIDLINE + SQUARE_DIM))
  let y = -2.0 + STAVE_OFFSET_TOP + GRIDLINE + (row * (GRIDLINE + SQUARE_DIM))
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttributeNS(null, 'stroke', 'black');
  line.setAttributeNS(null, 'stroke-width', 6);
  line.setAttributeNS(null, 'x1', x);
  line.setAttributeNS(null, 'x2', x + w * (GRIDLINE + SQUARE_DIM));
  line.setAttributeNS(null, 'y1', y);
  line.setAttributeNS(null, 'y2', y)
  line.style.display = 'none'
  svg.appendChild(line)
  return line
}

updateAndSaveState = (function() {
  var cached_function = updateAndSaveState;
  return function() {
    cached_function.apply(this);
    if (!playButton) {
      return
    }
    if (numCellsFilled == numCellsToFill) {
      playButton.style.display = ''
    } else {
      playButton.style.display = 'none'
    }
  }
})();


function customizePuzzle() {
  for (let n = 0; n < 5; n++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttributeNS(null, 'stroke', 'black');
    line.setAttributeNS(null, 'stroke-width', 2);
    let x1 = 0
    let x2 = (2 * STAVE_OFFSET_LEFT) + boxWidth
    let y = STAVE_OFFSET_TOP + GRIDLINE + (n + 1) * (GRIDLINE + SQUARE_DIM)
    line.setAttributeNS(null, 'x1', x1);
    line.setAttributeNS(null, 'x2', x2);
    line.setAttributeNS(null, 'y1', y);
    line.setAttributeNS(null, 'y2', y);
    svg.appendChild(line)
  }
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttributeNS(null, 'stroke', 'black');
  line.setAttributeNS(null, 'stroke-width', 2);
  line.setAttributeNS(null, 'x1', 0);
  line.setAttributeNS(null, 'x2', 0);
  line.setAttributeNS(null, 'y1',
    (STAVE_OFFSET_TOP + GRIDLINE + (GRIDLINE + SQUARE_DIM)));
  line.setAttributeNS(null, 'y2',
    (STAVE_OFFSET_TOP + GRIDLINE + 5 * (GRIDLINE + SQUARE_DIM)));
  svg.appendChild(line)

  const clefSig =
    document.createElementNS('http://www.w3.org/2000/svg', 'image');
  clefSig.setAttributeNS(null, 'href', 'kr-clef-sig.png');
  clefSig.setAttributeNS(null, 'x', 0);
  clefSig.setAttributeNS(null, 'height', 233);
  clefSig.setAttributeNS(null, 'y', 32);
  svg.appendChild(clefSig)

  const sharp1 =
    document.createElementNS('http://www.w3.org/2000/svg', 'image');
  sharp1.setAttributeNS(null, 'href', 'kr-sharp.png');
  sharp1.setAttributeNS(null, 'x',
    5 + STAVE_OFFSET_LEFT + 7 * (GRIDLINE + SQUARE_DIM));
  sharp1.setAttributeNS(null, 'height', 43);
  sharp1.setAttributeNS(null, 'y', 0);
  svg.appendChild(sharp1)

  const sharp2 =
    document.createElementNS('http://www.w3.org/2000/svg', 'image');
  sharp2.setAttributeNS(null, 'href', 'kr-sharp.png');
  sharp2.setAttributeNS(null, 'x',
    5 + STAVE_OFFSET_LEFT + 15 * (GRIDLINE + SQUARE_DIM));
  sharp2.setAttributeNS(null, 'height', 43);
  sharp2.setAttributeNS(null, 'y', 0);
  svg.appendChild(sharp2)

  notes.push(makeNote(1, 3, 'E', 5, 0.5, 5, 3, 3.4))

  notes.push(makeNote(1.5, 7, 'D#', 5, 0.5, 5, 7, 2.9))

  bases.push(makeBase(5, 3, 4))

  notes.push(makeNote(1, 11, 'E', 5, 0.5, 6, 11, 4.4))

  notes.push(makeNote(1.5, 15, 'D', 5, 0.5, 6, 15, 3.9))

  notes.push(makeNote(1, 19, 'E', 5, 0.5, 6, 19, 4.4))

  notes.push(makeNote(2.5, 23, 'B', 4, 0.5, 6, 23, 2.9))

  notes.push(makeNote(1.5, 27, 'D', 5, 0.5, 6, 27, 3.9))

  notes.push(makeNote(2, 31, 'C', 5, 0.5, 6, 31, 3.4))

  bases.push(makeBase(6, 11, 20))

  notes.push(makeNote(3, 34.01, 'A', 4, 1.0, 0, 35, -3.45))

  const gp = document.getElementById('grid-parent')
  playButton = document.createElement('button');
  playButton.setAttributeNS(null, 'class', 'button');
  playButton.style.position = 'absolute';
  playButton.style.top = '248px';
  playButton.style.left =
    '' + (STAVE_OFFSET_LEFT + 18 * (GRIDLINE + SQUARE_DIM)) + 'px'
  playButton.innerHTML = 'Play! <span style="font-size:large">&rtrif;</span>'
  playButton.addEventListener('click', playTune);
  gp.appendChild(playButton);
  updateAndSaveState()
}


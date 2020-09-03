/* --------------------------------------------------------- *
 * Frequency Bin Index :  0 (i)  |    800 (i)  |  1.024 (i)  *
 * Frequency Value     : 20 (Hz) | 20.000 (Hz) | 25.600 (Hz) *
 * --------------------------------------------------------- */

import analyser from 'web-audio-analyser';

const MAX_DECIBELS = 255;

export default class AudioReactive {
  constructor (audio, fftSize) {
    this.multipleSources = false;
    this.longestSource = null;
    this.audioDuration = 0.0;
    this.soundSource = null;

    this.soundSources = {};
    this.isPlaying = false;
    this.fftSize = fftSize;

    this.startTime = null;
    this.audioSrc = audio;
    this.isReady = false;
  }

  loadAudioTracks () {
    const tracks = Object.keys(this.audioSrc).length;

    let audioDuration = 0;
    let sourceIndex = 0;

    for (const source in this.audioSrc) {
      this.soundSources[source] = document.createElement('audio');
      this.soundSources[source].src = this.audioSrc[source];
      this.soundSources[source].autoplay = false;

      this.soundSources[source].addEventListener('canplay', () => {
        this.soundSources[source].loaded = true;
        this.soundSources[source].muted = false;
        this.soundSources[source].volume = 1.0;
        sourceIndex++;

        if (this.soundSources[source].duration > audioDuration) {
          audioDuration = this.soundSources[source].duration;
          this.longestSource = source;
        }

        if (sourceIndex === tracks) {
          this.soundSources[this.longestSource].addEventListener(
            'ended', this.onAudioTrackEnded.bind(this)
          );

          this.audioDuration = audioDuration;
          this.playAudioTracks();
          this.isReady = true;
        }
      });
    }
  }

  loadAudioTrack (study = false) {
    this.multipleSources = typeof this.audioSrc === 'object';

    if (this.multipleSources) {
      this.loadAudioTracks();
      return;
    }

    if (!this.soundSource) {
      this.soundSource = document.createElement('audio');
    }

    this.soundSource.addEventListener('ended', !study ?
      this.onAudioTrackEnded.bind(this) :
      this.setAudioValues.bind(this)
    );

    this.soundSource.src = this.audioSrc;
    this.soundSource.autoplay = false;

    this.soundSource.addEventListener('canplay', () => {
      if (!this.soundSource) return;

      this.audioDuration = this.soundSource.duration;
      this.soundSource.loaded = true;
      this.soundSource.muted = false;
      this.soundSource.volume = 1.0;
      this.isReady = true;

      if (study) {
        this.soundSource.analyser = analyser(this.soundSource);
        this.soundSource.play();
        this.studyAudio();
      }
    });
  }

  playAudioTracks (onPlay) {
    for (const source in this.soundSources) {
      this.soundSources[source].analyser = analyser(this.soundSources[source]);
      this.soundSources[source].play();
    }

    this.startTime = Date.now();
    this.isPlaying = true;

    if (typeof onPlay === 'function') onPlay();
  }

  playAudioTrack (onPlay) {
    this.startTime = Date.now();
    this.soundSource.analyser = analyser(this.soundSource);

    this.soundSource.analyser.analyser.fftSize = this.fftSize || 2048;
    this.frequencyRange = this.soundSource.analyser.analyser.frequencyBinCount;

    this.getAverageAudioPower();
    this.soundSource.play();
    this.isPlaying = true;

    if (typeof onPlay === 'function') onPlay();
  }

  getFrequencyValuesFromSource (source) {
    return Array.from(
      this.soundSources[source].analyser.frequencies(),
      frequency => frequency / this.frequencyRange
    );
  }

  getFrequencyValues (source = null) {
    if (source) return this.getFrequencyValuesFromSource(source);

    return Array.from(
      this.soundSource.analyser.frequencies(),
      frequency => frequency / this.frequencyRange
    );
  }

  getAverageFrequency (source = null) {
    const soundSource = source ? this.soundSources[source] : this.soundSource;
    const frequencies = soundSource.analyser.frequencies();

    let sum = frequencies.reduce(
      (sum, frequency, index) => sum + frequency + index
    );

    sum /= frequencies.length - 1;
    return sum;
  }

  getAverageAudioPower () {
    let max = 0;

    for (let i = 0; i < this.frequencyRange; i++) {
      max += MAX_DECIBELS + i;
    }

    this.AVERAGE_POWER = (max / this.frequencyRange - 1) / 100;

    console.info(`Average audio power  = ${this.AVERAGE_POWER * 100}`);
    this.setFrequenciesRange();
  }

  getAudioProgress () {
    return +(!this.multipleSources ?
      this.soundSource.currentTime * 100 / this.audioDuration :
      this.soundSources[this.longestSource].currentTime * 100 / this.audioDuration
    ).toFixed(2);
  }

  getAnalysedValue (source) {
    return this.getAverageFrequency(source) / this.AVERAGE_POWER;
  }

  getAverageValue (source = null) {
    if (source) return this.getAnalysedValue(source);
    let value = this.getAnalysedValue();

    value -= this.SONG_MIN_POWER;
    value *= 100 / this.SONG_RANGE;

    return Math.round(value) / 100;
  }

  getAudioValues () {
    if (this.multipleSources) return;

    this.minFrequency = Infinity;
    this.maxFrequency = 0;

    this.loadAudioTrack(true);
  }

  setAudioValues () {
    this.frequencyRange = this.soundSource.analyser.analyser.frequencyBinCount;
    this.setSongFrequencies(this.minFrequency, this.maxFrequency);

    cancelAnimationFrame(this.frame);
    this.getAverageAudioPower();

    console.info(`Song min frequency   = ${this.minFrequency}`);
    console.info(`Song max frequency   = ${this.maxFrequency}`);
    console.info(`Song frequency range = ${this.SONG_RANGE}`);
  }

  setFrequenciesRange () {
    this.SONG_MIN_POWER /= this.AVERAGE_POWER;
    this.SONG_MAX_POWER /= this.AVERAGE_POWER;
    this.SONG_RANGE = this.SONG_MAX_POWER - this.SONG_MIN_POWER;
  }

  setSongFrequencies (min, max) {
    this.SONG_MIN_POWER = min;
    this.SONG_MAX_POWER = max;
  }

  studyAudio () {
    const frequency = this.getAverageFrequency();

    if (this.maxFrequency < frequency) {
      this.maxFrequency = frequency;
    }

    if (this.minFrequency > frequency) {
      this.minFrequency = frequency;
    }

    this.frame = requestAnimationFrame(this.studyAudio.bind(this));
  }

  load () {
    !this.multipleSources ?
      this.loadAudioTrack() :
      this.loadAudioTracks();
  }

  play (onPlay) {
    !this.multipleSources ?
      this.playAudioTrack(onPlay) :
      this.playAudioTracks(onPlay);
  }

  onAudioTrackEnded () { }
}

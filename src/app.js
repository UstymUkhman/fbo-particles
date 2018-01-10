// Inspired by: http://barradeau.com/blog/?p=621

import AudioreactiveParticles from './AudioreactiveParticles';
import Particles from './Particles';

const SONG = 'assets/Linkin Park - Faint.mp3';
let currentExperiment = new Particles();

const audioreactive = document.getElementById('audioreactive');
const overlay = document.getElementById('background-overlay');
const particles = document.getElementById('particles');

audioreactive.addEventListener('click', () => {
  audioreactive.classList.add('active');
  particles.classList.remove('active');

  currentExperiment.destroy();
  currentExperiment = new AudioreactiveParticles(SONG);

  overlay.classList.remove('fade');

  setTimeout(() => {
    overlay.classList.add('fade');
  }, 500);
});

particles.addEventListener('click', () => {
  audioreactive.classList.remove('active');
  particles.classList.add('active');

  currentExperiment.destroy();
  currentExperiment = new Particles();

  overlay.classList.add('fade');

  setTimeout(() => {
    overlay.classList.remove('fade');
  }, 500);
});

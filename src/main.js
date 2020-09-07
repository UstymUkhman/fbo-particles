import NoiseParticles from '@/NoiseParticles';
import AudioreactiveParticles from '@/AudioreactiveParticles';

const label = document.getElementById('label');
const noise = document.getElementById('noise');

const container = document.getElementById('container');
const audioreactive = document.getElementById('audioreactive');

let noiseParticles = new NoiseParticles(container);
let audioreactiveParticles = null;

noise.addEventListener('click', () => {
  label.classList.add('hidden');
  noise.classList.add('active');

  audioreactiveParticles.destroy();
  audioreactive.classList.remove('active');
  noiseParticles = new NoiseParticles(container);
});

audioreactive.addEventListener('click', () => {
  noiseParticles.destroy();
  label.classList.remove('hidden');
  noise.classList.remove('active');
  audioreactive.classList.add('active');

  audioreactiveParticles = new AudioreactiveParticles(container, () => {
    audioreactiveParticles.start();
  });
});

window.addEventListener('resize', () => {
  !noise.classList.contains('active')
    ? audioreactiveParticles.onResize()
    : noiseParticles.onResize();
}, false);

import NoiseParticles from '@/NoiseParticles';
import AudioreactiveParticles from '@/AudioreactiveParticles';

const noise = document.getElementById('noise');
const container = document.getElementById('container');
const audioreactive = document.getElementById('audioreactive');

let noiseParticles = new NoiseParticles(container);
let audioreactiveParticles = null;

audioreactive.addEventListener('click', () => {
  noiseParticles.destroy();
  noise.classList.remove('active');
  audioreactive.classList.add('active');

  audioreactiveParticles = new AudioreactiveParticles(container, () => {
    audioreactiveParticles.start();
  });
});

noise.addEventListener('click', () => {
  noise.classList.add('active');
  audioreactiveParticles.destroy();

  audioreactive.classList.remove('active');
  noiseParticles = new NoiseParticles(container);
});

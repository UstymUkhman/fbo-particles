// import NoiseParticles from '@/NoiseParticles';
import AudioreactiveParticles from '@/AudioreactiveParticles';

// let noiseParticles = null;
let audioreactiveParticles = null;

const noise = document.getElementById('noise');
const container = document.getElementById('container');
const audioreactive = document.getElementById('audioreactive');

audioreactive.addEventListener('click', () => {
  // noiseParticles.destroy();
  noise.classList.remove('active');
  audioreactive.classList.add('active');

  audioreactiveParticles = new AudioreactiveParticles(container, () => {
    audioreactiveParticles.start();
  });
});

// noise.addEventListener('click', () => {
//   noise.classList.add('active');
//   audioreactiveParticles.destroy();

//   audioreactive.classList.remove('active');
//   noiseParticles = new NoiseParticles(container);
// });

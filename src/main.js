import AudioreactiveParticles from '@/AudioreactiveParticles';

document.addEventListener('click', () => {
  const particles = new AudioreactiveParticles(
    document.getElementById('container'), () => {
      particles.startExperiment();
    }
  );
});

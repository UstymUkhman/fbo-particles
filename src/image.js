import AudioReactive from './AudioReactive';
import * as THREE from 'three';
import Stats from 'stats.js';
import Fbo from './FBO.js';

const OrbitControls = require('three-orbit-controls')(THREE);


export default class AudioreactiveParticles {
  constructor (track, lowPerformance = false) {
    const fftSize = lowPerformance ? 256 : null;

    this.audio = new AudioReactive(track, fftSize);
    this.audio.setSongFrequencies(510.5, 622.2);

    this.shaders = `./glsl/image`;
    this.simulationShader = null;

    this.distance = 50.0;
    this.speed    = 10.0;
    this.pressed  = null;

    this.size = {
      width  : window.innerWidth,
      height : window.innerHeight
    };

    this.createScene();
    this.createCamera();
    this.createRenderer();

    this.createOrbitControls();
    this.createStats();

    this.image = new Image();
    this.image.onload = this.createImage.bind(this);

    this.image.src = './assets/height.jpg';
    this.image.crossOrigin = 'anonymous';

    this.bindEvents();
  }

  createScene () {
    this.scene = new THREE.Scene();
  }

  createCamera () {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 500;
  }

  createRenderer () {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);
  }

  createOrbitControls () {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  createStats () {
    this.stats = new Stats();
    this.stats.showPanel(0);

    document.body.appendChild(this.stats.dom);
  }

  createImage () {
    const positions = new THREE.DataTexture(
      this.getDataImage(),
      this.image.width,
      this.image.height,
      THREE.RGBFormat,
      THREE.FloatType
    );

    positions.needsUpdate = true;

    this.simulationShader = new THREE.ShaderMaterial({
      fragmentShader: require(`${this.shaders}/simulation.frag`),
      vertexShader: require(`${this.shaders}/simulation.vert`),

      uniforms: {
        positions: { type: 't', value: positions },
        time: { type: 'f', value: 0.0 },
      }
    });

    const renderShader = new THREE.ShaderMaterial({
      fragmentShader: require(`${this.shaders}/render.frag`),
      vertexShader: require(`${this.shaders}/render.vert`),

      uniforms: {
        positions: { type: 't', value: null }
      }
    });

    this.fbo = new Fbo(
      this.image.width, this.image.height,
      this.renderer, this.simulationShader, renderShader
    );

    this.scene.add(this.fbo.particles);
    this.audio.play(this.update.bind(this));
    // this.audio.getAudioValues();
    this.update();
  }

  getDataImage () {
    const ELEVATION = 64;
    const width     = this.image.width;
    const height    = this.image.height;

    const context = this.getContext(width, height);
    context.drawImage(this.image, 0, 0);

    const imgageData = context.getImageData(0, 0, width, height);
    const imgData = imgageData.data;

    const length = width * height;
    const data = new Float32Array(length * 3);

    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      const c1 = imgData[i4]     / 255 * 0.299;
      const c2 = imgData[i4 + 1] / 255 * 0.587;
      const c3 = imgData[i4 + 2] / 255 * 0.114;

      data[i3]     = (i % width) - width * 0.5;
      data[i3 + 1] = (c1 + c2 + c3) * ELEVATION;
      data[i3 + 2] = (parseInt(i / width) - height * 0.5);
    }

    return data;
  }

  getContext (width, height) {
    const canvas = document.createElement('canvas');
    canvas.height = height;
    canvas.width = width;

    return canvas.getContext('2d');
  }

  update () {
    const angle = Math.PI / 180;
    this.stats.begin();

    const audioValue = this.audio.getAverageValue();
    this.simulationShader.uniforms.time.value = audioValue;

    this.fbo.particles.rotation.y -= angle * 0.1;
    this.fbo.update();

    this.fbo.particles.position.y = -128;
    this.camera.lookAt(this.fbo.particles.position);

    this.renderer.render(this.scene, this.camera);

    this.stats.end();
    requestAnimationFrame(this.update.bind(this));
  }

  bindEvents () {
    let events = [
      { event: 'resize' , action: this.onResize }
    ];

    for (let i = 0; i < events.length; i++) {
      window.addEventListener(events[i].event, events[i].action.bind(this));
    }
  }

  onResize () {
    this.size = {
      width  : window.innerWidth,
      height : window.innerHeight
    };

    this.renderer.setSize(this.size.width, this.size.height);

    this.camera.aspect = this.size.width / this.size.height;
    this.camera.updateProjectionMatrix();
  }
}

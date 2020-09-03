import { PerspectiveCamera } from '@three/cameras/PerspectiveCamera';
import { ShaderMaterial } from '@three/materials/ShaderMaterial';
import { WebGLRenderer } from '@three/renderers/WebGLRenderer';

import { RGBFormat, FloatType } from '@three/constants.js';
import { DataTexture } from '@three/textures/DataTexture';
import { OrbitControls } from '@controls/OrbitControls';

import vertParticles from '@/glsl/image/particles.vert';
import fragParticles from '@/glsl/image/particles.frag';

import vertRenderer from '@/glsl/image/render.vert';
import fragRenderer from '@/glsl/image/render.frag';

import AudioReactive from '@/AudioReactive';
import { Scene } from '@three/scenes/Scene';
import Fbo from '@/FBO';

export default class AudioreactiveParticles {
  constructor (container, onLoad) {
    this.container = container;
    this.audio = new AudioReactive('./assets/faint.mp3');
    this.audio.setSongFrequencies(510.5, 633.55);

    this.simulationShader = null;
    this.renderShader = null;
    this.isReady = false;

    this.distance = 50.0;
    this.pressed = null;
    this.speed = 10.0;

    this.size = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createOrbitControls();

    this.image = new Image();
    this.onImageLoad = onLoad;
    this.image.src = './assets/height.jpg';
    this.image.onload = this.createImage.bind(this);
  }

  createScene () {
    this.scene = new Scene();
  }

  createCamera () {
    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 500;
  }

  createRenderer () {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  createOrbitControls () {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  createImage () {
    const positions = new DataTexture(
      this.getDataImage(),
      this.image.width,
      this.image.height,
      RGBFormat,
      FloatType
    );

    positions.needsUpdate = true;

    this.simulationShader = new ShaderMaterial({
      vertexShader: vertParticles,
      fragmentShader: fragParticles,

      uniforms: {
        positions: { type: 't', value: positions },
        time: { type: 'f', value: 0.0 }
      }
    });

    this.renderShader = new ShaderMaterial({
      vertexShader: vertRenderer,
      fragmentShader: fragRenderer,

      uniforms: {
        positions: { type: 't', value: null },
        frequency: { type: 'f', value: 0.0 }
      }
    });

    this.fbo = new Fbo(
      this.image.width, this.image.height,
      this.renderer, this.simulationShader, this.renderShader
    );

    this.audio.load();
    this.onImageLoad();
    this.scene.add(this.fbo.particles);
  }

  startExperiment () {
    this.audio.play(this.update.bind(this));
  }

  getDataImage () {
    const ELEVATION = 64;
    const width = this.image.width;
    const height = this.image.height;

    const context = this.getContext(width, height);
    context.drawImage(this.image, 0, 0);

    const imgageData = context.getImageData(0, 0, width, height);
    const imgData = imgageData.data;

    const length = width * height;
    const data = new Float32Array(length * 3);

    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      const c1 = imgData[i4] / 255 * 0.299;
      const c2 = imgData[i4 + 1] / 255 * 0.587;
      const c3 = imgData[i4 + 2] / 255 * 0.114;

      data[i3] = (i % width) - width * 0.5;
      data[i3 + 1] = (c1 + c2 + c3) * ELEVATION;
      data[i3 + 2] = (parseInt(i / width, 10) - height * 0.5);
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
    const audioValue = this.audio.getAverageValue();

    this.renderShader.uniforms.frequency.value = audioValue;
    this.simulationShader.uniforms.time.value = audioValue;

    this.fbo.particles.rotation.y -= angle * 0.1;
    this.fbo.update();

    this.fbo.particles.position.y = -128;
    this.camera.lookAt(this.fbo.particles.position);

    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.update.bind(this));
  }

  onResize () {
    this.size = {
      height: window.innerHeight,
      width: window.innerWidth
    };

    this.renderer.setSize(this.size.width, this.size.height);
    this.camera.aspect = this.size.width / this.size.height;
    this.camera.updateProjectionMatrix();
  }

  destroy () {
    this.audio._soundSource.pause();
    this.audio._soundSource.remove();
    this.audio._soundSource = null;
    this.audio = null;

    cancelAnimationFrame(this.frame);
    this.container.removeChild(this.renderer.domElement);
  }
}

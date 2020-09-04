import { PerspectiveCamera } from '@three/cameras/PerspectiveCamera';
import { ShaderMaterial } from '@three/materials/ShaderMaterial';
import { WebGLRenderer } from '@three/renderers/WebGLRenderer';
import { RGBFormat, FloatType, GLSL3 } from '@three/constants';
import { DataTexture } from '@three/textures/DataTexture';

import vertParticles from '@/glsl/image/particles.vert';
import fragParticles from '@/glsl/image/particles.frag';

import vertRenderer from '@/glsl/image/render.vert';
import fragRenderer from '@/glsl/image/render.frag';

import AudioReactive from '@/AudioReactive';
import { Scene } from '@three/scenes/Scene';
import Fbo from '@/FBO';

const ANGLE = Math.PI / 180;
const ELEVATION = 64;

export default class AudioreactiveParticles {
  constructor (container, callback) {
    this.audio = new AudioReactive('./assets/faint.mp3');
    this.audio.setSongFrequencies(510.5, 633.55);

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ratio = this.width / this.height;

    this.simulationShader = null;
    this.onImageLoad = callback;
    this.container = container;
    this.renderShader = null;

    this.distance = 50.0;
    this.speed = 10.0;
    this.fbo = null;

    this.createScene();
    this.createCamera();
    this.createRenderer();

    this.image = new Image();
    this.image.src = './assets/height.jpg';
    this.image.onload = this.createImage.bind(this);
  }

  createScene () {
    this.scene = new Scene();
  }

  createCamera () {
    this.camera = new PerspectiveCamera(60, this.ratio, 1, 1000);
    this.camera.position.z = 500;
  }

  createRenderer () {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000);

    this.container.appendChild(this.renderer.domElement);
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
      fragmentShader: fragParticles,
      vertexShader: vertParticles,

      uniforms: {
        positions: { value: positions },
        time: { value: 0.0 }
      }
    });

    this.renderShader = new ShaderMaterial({
      fragmentShader: fragRenderer,
      vertexShader: vertRenderer,

      uniforms: {
        positions: { value: null },
        frequency: { value: 0.0 }
      }
    });

    this.simulationShader.glslVersion = GLSL3;
    this.renderShader.glslVersion = GLSL3;

    this.fbo = new Fbo(
      this.image.width, this.image.height,
      this.renderer, this.simulationShader, this.renderShader
    );

    this.camera.lookAt(this.fbo.particles.position);
    this.scene.add(this.fbo.particles);

    this.audio.load();
    this.onImageLoad();
  }

  getDataImage () {
    const canvas = document.createElement('canvas');
    const height = this.image.height;
    const width = this.image.width;

    const length = width * height;
    const data = new Float32Array(length * 3);

    canvas.height = height;
    canvas.width = width;

    const context = canvas.getContext('2d');
    context.drawImage(this.image, 0, 0);

    const imgageData = context.getImageData(0, 0, width, height).data;

    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      const c1 = imgageData[i4] / 255 * 0.299;
      const c2 = imgageData[i4 + 1] / 255 * 0.587;
      const c3 = imgageData[i4 + 2] / 255 * 0.114;

      data[i3] = (i % width) - width * 0.5;
      data[i3 + 1] = (c1 + c2 + c3) * ELEVATION;
      data[i3 + 2] = (parseInt(i / width, 10) - height * 0.5);
    }

    return data;
  }

  start () {
    this.audio.play(this.update.bind(this));
  }

  update () {
    const audioValue = this.audio.getAverageValue();

    this.renderShader.uniforms.frequency.value = audioValue;
    this.simulationShader.uniforms.time.value = audioValue;

    this.fbo.particles.rotation.y -= ANGLE * 0.1;
    this.fbo.update();

    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.update.bind(this));
  }

  onResize () {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ratio = this.width / this.height;

    this.camera.aspect = this.ratio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  destroy () {
    this.audio.soundSource.pause();
    this.audio.soundSource.remove();

    cancelAnimationFrame(this.frame);
    this.container.removeChild(this.renderer.domElement);

    delete this.audio.soundSource;
    delete this.audio;
  }
}

import { WireframeGeometry } from '@three/geometries/WireframeGeometry';
import { LineBasicMaterial } from '@three/materials/LineBasicMaterial';
import { PerspectiveCamera } from '@three/cameras/PerspectiveCamera';

import { SphereGeometry } from '@three/geometries/SphereGeometry';
import { ShaderMaterial } from '@three/materials/ShaderMaterial';
import { SpriteMaterial } from '@three/materials/SpriteMaterial';
import { WebGLRenderer } from '@three/renderers/WebGLRenderer';

import { TextureLoader } from '@three/loaders/TextureLoader';
import { LineSegments } from '@three/objects/LineSegments';
import { DataTexture } from '@three/textures/DataTexture';

import vertParticles from '@/glsl/noise/particles.vert';
import fragParticles from '@/glsl/noise/particles.frag';

import vertSphere from '@/glsl/noise/sphere.vert';
import fragSphere from '@/glsl/noise/sphere.frag';

import vertRender from '@/glsl/noise/render.vert';
import fragRender from '@/glsl/noise/render.frag';

import { Sprite } from '@three/objects/Sprite';
import { Vector3 } from '@three/math/Vector3';

import { Scene } from '@three/scenes/Scene';
import { Mesh } from '@three/objects/Mesh';
import { Color } from '@three/math/Color';

import {
  GLSL3,
  FloatType,
  RGBFormat,
  UVMapping,
  DoubleSide,
  SmoothShading,
  RepeatWrapping,
  AdditiveBlending
} from '@three/constants';
import FBO from '@/FBO';

const ANGLE = Math.PI / 180;
const PARTICLES_SIZE = 512;

export default class NoiseParticles {
  constructor (container) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ratio = this.width / this.height;

    this.simulationShader = null;
    this.container = container;
    this.renderShader = null;
    this.startTime = null;
    this.pressed = null;

    this.lightSpeed = 0.0;
    this.distance = 50.0;
    this.speed = 10.0;

    this.createScene();
    this.createCamera();

    this.createRenderer();
    this.createParticles();

    this.createSphere();
    this.createEvents();
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

  createParticles () {
    const length = Math.pow(PARTICLES_SIZE, 2) * 3;
    const data = this.getSphere(PARTICLES_SIZE / 4, length);

    const texture = new DataTexture(
      data, PARTICLES_SIZE, PARTICLES_SIZE,
      RGBFormat, FloatType, UVMapping,
      RepeatWrapping, RepeatWrapping
    );

    this.particleColor = new Vector3();
    this.camera.position.z = 400;
    texture.needsUpdate = true;

    this.simulationShader = new ShaderMaterial({
      fragmentShader: fragParticles,
      vertexShader: vertParticles,
      glslVersion: GLSL3,
      transparent: true,

      uniforms: {
        distance: { value: this.distance },
        speed: { value: this.speed },
        data: { value: texture },
        timer: { value: 0.0 }
      }
    });

    this.renderShader = new ShaderMaterial({
      fragmentShader: fragRender,
      vertexShader: vertRender,
      glslVersion: GLSL3,
      transparent: true,
      side: DoubleSide,

      uniforms: {
        color: { value: this.particleColor },
        positions: { value: null }
      }
    });

    this.fbo = new FBO(
      PARTICLES_SIZE, PARTICLES_SIZE, this.renderer,
      this.simulationShader, this.renderShader
    );

    this.scene.add(this.fbo.particles);
    this.startTime = 0.0;
  }

  getSphere (size, length) {
    const point = new Vector3();
    const data = new Float32Array(length);

    for (let i = 0; i < length; i += 3) {
      this.getPoint(point, size);

      data[i] = point.x;
      data[i + 1] = point.y;
      data[i + 2] = point.z;
    }

    return data;
  }

  getPoint (vertex, size) {
    vertex.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );

    return vertex.length() > 1
      ? this.getPoint(vertex, size)
      : vertex.normalize().multiplyScalar(size);
  }

  async createSphere () {
    const loader = new TextureLoader();

    const glow = await loader.load('./assets/glow.png');
    const white = await loader.load('./assets/white.jpg');
    const black = await loader.load('./assets/black.jpg');

    this.sphere = new Mesh(
      new SphereGeometry(1, 32, 32),
      new ShaderMaterial({
        flatShading: SmoothShading,
        fragmentShader: fragSphere,
        vertexShader: vertSphere,
        glslVersion: GLSL3,

        uniforms: {
          progress: { type: 'f', value: 0.0 },
          black: { type: 't', value: black },
          white: { type: 't', value: white }
        }
      })
    );

    this.wireframes = new LineSegments(
      new WireframeGeometry(this.sphere.geometry),
      new LineBasicMaterial({
        transparent: true,
        color: 0xFFFFFF,
        linewidth: 1
      })
    );

    this.sprite = new Sprite(
      new SpriteMaterial({
        blending: AdditiveBlending,
        transparent: true,
        color: 0xFFFFFF,
        opacity: 0.0,
        map: glow
      })
    );

    this.sphere.position.set(0, 0, 0);
    this.sprite.scale.set(3, 3, 1);

    this.sphere.add(this.wireframes);
    this.sphere.add(this.sprite);
    this.scene.add(this.sphere);

    this.update();
  }

  createEvents () {
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.renderer.domElement.addEventListener('contextmenu', this.onMouseDown.bind(this), false);
  }

  update () {
    const time = Math.cos(Date.now() * 0.001);
    const speedFrac = Math.max(0, this.speed - 110.0);
    const scale = this.sprite.scale.x + speedFrac / 100000.0;

    this.simulationShader.uniforms.distance.value = this.distance;
    this.simulationShader.uniforms.speed.value = this.speed;
    this.simulationShader.uniforms.timer.value += 0.01;

    this.fbo.particles.rotation.x = time * ANGLE * 2.0;
    this.fbo.particles.rotation.y -= ANGLE * 0.1;

    this.sprite.material.opacity = Math.min(0.5, speedFrac / 1000.0);
    this.sprite.scale.x = Math.min(3.5, scale);
    this.sprite.scale.y = Math.min(3.5, scale);

    this.updateSphere();
    this.fbo.update();

    if (this.pressed !== null) this.animate();
    else {
      if (this.lightSpeed > 0) this.lightSpeed -= 0.05;
      if (this.distance > 90) this.distance -= 1.5;

      if (this.speed > 500) {
        this.speed -= 5.0;
      }

      else if (this.speed > 10) {
        this.speed -= 2.5;
      }

      else {
        this.sprite.material.opacity = 0;
        this.sprite.scale.set(3, 3, 1);
        this.speed = 10;
      }

      if (this.particleColor.x > 0.0) {
        this.particleColor.subScalar(
          this.speed > 10 ? 0.002 : 0.01
        );
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.update.bind(this));
  }

  updateSphere () {
    this.startTime += 0.1;

    this.lightSpeed = Math.max(0.0, Math.min(this.lightSpeed, 20.0));
    if (!this.lightSpeed <= 0.0) this.startTime = 0.0;

    const progress = this.lightSpeed / 20.0;
    const hex = 1 - progress;

    this.wireframes.material.opacity = Math.max(0.5 - progress, 0.25);
    this.wireframes.material.color = new Color(hex, hex, hex);

    let scale = this.lightSpeed * 4.0 + 20;
    if (!this.pressed) scale -= 1.0;

    this.sphere.material.uniforms.progress.value = progress;
    this.sphere.rotation.y += this.lightSpeed / 50.0;
    this.sphere.scale.set(scale, scale, scale);
  }

  animate () {
    const frac = this.pressed === null ? 1 : 2.5;
    const delay = Date.now() - this.pressed;
    const power = delay / frac * 0.0005;

    if (this.particleColor.x < 0.7529411764705882) {
      this.particleColor.addScalar(0.001);
    }

    this.distance = power * 20 + 90;
    this.speed = power * 340 + 10;
    this.lightSpeed = power * 5;
  }

  onMouseDown (event) {
    if (event.which === 1) {
      this.onLeftPress();
    }
  }

  onMouseUp (event) {
    if (event.which === 1) {
      this.pressed = null;
    }
  }

  onLeftPress () {
    if (this.lightSpeed) return;

    const now = Date.now();
    this.down = now;

    if (this.pressed === null) {
      this.pressed = now;
    }

    this.animate();
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
    cancelAnimationFrame(this.frame);
    this.container.removeChild(this.renderer.domElement);

    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this), false);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.renderer.domElement.removeEventListener('contextmenu', this.onMouseDown.bind(this), false);
  }
}

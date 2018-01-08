import TweenLite from 'gsap/TweenLite';
import * as THREE from 'three';

import Stats from 'stats.js';
import Fbo from './FBO.js';

const OrbitControls = require('three-orbit-controls')(THREE);


export default class Particles {
  constructor (mode) {
    this.shaders = `./glsl/${mode}`;
    this.simulationShader = null;
    this.renderShader = null;
    this.startTime = null;

    this.lightSpeed = 0.0;
    this.distance   = 50.0;
    this.speed      = 10.0;
    this.mode       = mode;
    this.pressed    = null;

    this.size = {
      width  : window.innerWidth,
      height : window.innerHeight
    };

    this.colors = [
      new THREE.Color(0x11E8BB),
      new THREE.Color(0x8200C9),
      new THREE.Color(0x4564C4),
      new THREE.Color(0xFF9405),
      new THREE.Color(0x5ECF00)
    ];

    this.createScene();
    this.createCamera();
    this.createRenderer();

    this.createOrbitControls();
    this.createStats();

    this.createLights();
    this.createNoise();
    this.update();

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

  getSphere (size, length) {
    const data = new Float32Array(length);
    const point = new THREE.Vector3();

    for (let i = 0; i < length; i += 3) {
      this.getPoint(point, size);

      data[i] = point.x;
      data[i + 1] = point.y;
      data[i + 2] = point.z;
    }

    return data;
  }

  getPoint (vertex, size) {
    vertex.x = Math.random() * 2 - 1;
    vertex.y = Math.random() * 2 - 1;
    vertex.z = Math.random() * 2 - 1;

    if (vertex.length() > 1) {
      return this.getPoint(vertex, size);
    }

    return vertex.normalize().multiplyScalar(size);
  }

  createLights () {
    this.sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        shading: THREE.FlatShading,
        color: 0xFFFFFF
      })
    );

    this.sphere.add(new THREE.LineSegments(
      new THREE.WireframeGeometry(this.sphere.geometry),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    ));

    this.sphere.position.set(0, 0, 0);
    this.scene.add(this.sphere);
  }

  createNoise () {
    const size = 512;
    const length = Math.pow(size, 2) * 3;

    const data    = this.getSphere(size / 4, length);
    const texture = new THREE.DataTexture(
      data, size, size,
      THREE.RGBFormat,
      THREE.FloatType,
      THREE.DEFAULT_MAPPING,
      THREE.RepeatWrapping,
      THREE.RepeatWrapping
    );

    this.bigColor   = new THREE.Vector3(0.250, 0.250, 0.250);
    this.smallColor = new THREE.Vector3(0.125, 0.125, 0.125);

    this.controls.minDistance = 400;
    this.controls.maxDistance = 400;

    this.camera.position.z = 400;
    texture.needsUpdate = true;

    this.simulationShader = new THREE.ShaderMaterial({
      fragmentShader: require(`${this.shaders}/simulation.frag`),
      vertexShader: require(`${this.shaders}/simulation.vert`),

      uniforms: {
        distance: { type: 'f', value: this.distance },
        speed:    { type: 'f', value: this.speed    },
        texture:  { type: 't', value: texture       },
        timer:    { type: 'f', value: 0.0           }
      }
    });

    this.renderShader = new THREE.ShaderMaterial({
      fragmentShader: require(`${this.shaders}/render.frag`),
      vertexShader: require(`${this.shaders}/render.vert`),

      side: THREE.DoubleSide,
      transparent: true,

      uniforms: {
        big:       { type: 'v3', value: this.bigColor   },
        small:     { type: 'v3', value: this.smallColor },
        positions: { type: 't',  value: null }
      }
    });

    this.fbo = new Fbo(
      size, size, this.renderer,
      this.simulationShader, this.renderShader
    );

    this.scene.add(this.fbo.particles);
    this.startTime = 0.0;
  }

  update () {
    const angle = Math.PI / 180;
    this.stats.begin();

    this.fbo.particles.rotation.y -= angle * 0.1;
    this.fbo.update();

    if (this.mode === 'noise') {
      this.simulationShader.uniforms.distance.value = this.distance;
      this.simulationShader.uniforms.speed.value = this.speed;
      this.simulationShader.uniforms.timer.value += 0.01;

      const time = Math.cos(Date.now() * 0.001);
      this.fbo.particles.rotation.x = time * angle * 2.0;

      this.updateSphereAspect(time);

      if (this.pressed === null) {
        if (this.lightSpeed >  0) this.lightSpeed -= 0.05;
        if (this.distance   > 90) this.distance   -= 1.5;
        if (this.speed      > 10) this.speed      -= 2.5;

        if (this.bigColor.x > 0.250) {
          this.bigColor.x -= 0.01;
          this.bigColor.y -= 0.01;
          this.bigColor.z -= 0.01;
        }

        if (this.smallColor.x > 0.125) {
          this.smallColor.x -= 0.01;
          this.smallColor.y -= 0.01;
          this.smallColor.z -= 0.01;
        }
      } else {
        this.animate();
      }
    }

    this.renderer.render(this.scene, this.camera);

    this.stats.end();
    requestAnimationFrame(this.update.bind(this));
  }

  updateSphereAspect (time) {
    if (!this.lightSpeed) return;

    this.startTime += 0.1;
    let radius = this.lightSpeed / 4.0 * 50.0;

    if (radius > 50.0) {
      radius = 50.0;
    }

    if (this.lightSpeed <= 0.0) {
      this.lightSpeed = 0.0;
      this.startTime = 0.0;
      radius = 0.0;
    } else if (this.lightSpeed > 20.0) {
      this.lightSpeed = 20.0;
    }

    if (+this.startTime.toFixed(1) % 5.0 === 0.0) {
      this.updateSphereColor();
    }

    const x = -radius * Math.cos(time * Math.PI);
    const y =  radius * Math.sin(this.startTime);
    const z =  radius * Math.cos(Math.acos(y / radius));

    const scale = this.lightSpeed * 2.5;
    const rotation = this.lightSpeed / 100.0;

    this.sphere.rotation.x += rotation;
    this.sphere.rotation.y += rotation;
    this.sphere.rotation.z += rotation;

    this.sphere.position.set(x, y, z);
    this.sphere.scale.set(scale, scale, scale);
  }

  updateSphereColor () {
    const current = new THREE.Color(this.sphere.material.color.getHex());
    const nextColor = this.colors[Math.floor(Math.random() * 5)];

    TweenLite.to(current, 1, {
      r: nextColor.r,
      g: nextColor.g,
      b: nextColor.b,

      onUpdate: () => {
        this.sphere.material.color = current;
      }
    });
  }

  animate (pressed = false) {
    const frac  = this.pressed === null ? 1 : 2.5;
    const delay = Date.now() - this.pressed;
    const power = delay / frac * 0.0005;

    if (this.bigColor.x < 224.0) {
      this.bigColor.x += 0.005;
      this.bigColor.y += 0.005;
      this.bigColor.z += 0.005;
    }

    if (this.smallColor.x < 192.0) {
      this.smallColor.x += 0.01;
      this.smallColor.y += 0.01;
      this.smallColor.z += 0.01;
    }

    this.speed      = power * 340 + 10;
    this.distance   = power *  20 + 90;
    this.lightSpeed = power *   5;

    if (!pressed) {
      this.onKeyUp(!pressed);
    }
  }

  bindEvents () {
    let events = [
      { event: 'keydown' , action: this.onKeyDown },
      { event: 'resize' , action: this.onResize },
      { event: 'keyup' , action: this.onKeyUp }
    ];

    for (let i = 0; i < events.length; i++) {
      window.addEventListener(events[i].event, events[i].action.bind(this));
    }

    this.renderer.domElement.addEventListener('contextmenu', this.onRightClick.bind(this))
    this.renderer.domElement.addEventListener('mousedown', this.onRightClick.bind(this))
    this.renderer.domElement.addEventListener('mouseup', this.onRightUp.bind(this))
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

  onRightClick (event) {
    if (event.which === 3) {
      event.preventDefault()
      event.stopPropagation()
      this.controls.enabled = false
    }
  }

  onRightUp (event) {
    this.controls.enabled = true
  }

  onKeyDown (event) {
    if (event.keyCode === 32) {
      if (this.pressed === null) {
        this.pressed = Date.now();
      }

      this.down = Date.now();
      this.animate(true);
    }
  }

  onKeyUp (event) {
    const delay = !(this.down - this.pressed) ? 1000 : 0;

    if (Date.now() - this.down >= 1000) {
      this.pressed = null;
    }

    if (event.which === 32) {
      setTimeout(() => {
        this.pressed = null;
      }, delay);
    }
  }
}

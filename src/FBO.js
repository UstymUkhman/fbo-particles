import { RGBAFormat, FloatType, NearestFilter } from '@three/constants';
import { OrthographicCamera } from '@three/cameras/OrthographicCamera';
import { WebGLRenderTarget } from '@three/renderers/WebGLRenderTarget';

import { BufferAttribute } from '@three/core/BufferAttribute';
import { BufferGeometry } from '@three/core/BufferGeometry';

import { Points } from '@three/objects/Points';
import { Scene } from '@three/scenes/Scene';
import { Mesh } from '@three/objects/Mesh';

export default class Fbo {
  constructor (width, height, renderer, simulationMaterial, renderMaterial) {
    const size = width * height;
    const vertices = new Float32Array(size * 3);

    const particles = new BufferGeometry();
    const geometry = new BufferGeometry();

    this.scene = new Scene();

    this.camera = new OrthographicCamera(
      -1, 1, 1, -1, 1 / 2 ** 53, 1
    );

    this.target = new WebGLRenderTarget(width, height, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: FloatType
    });

    geometry.setAttribute('position', new BufferAttribute(
      new Float32Array([
        -1, -1, 0, 1, 1, 0, -1, 1, 0,
        -1, -1, 0, 1, -1, 0, 1, 1, 0
      ]), 3
    ));

    geometry.setAttribute('uv', new BufferAttribute(
      new Float32Array([
        0, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 1, 1
      ]), 2
    ));

    this.scene.add(new Mesh(geometry, simulationMaterial));

    for (let i = 0; i < size; i++) {
      const i3 = i * 3;
      vertices[i3] = (i % width) / width;
      vertices[i3 + 1] = (i / width) / height;
    }

    particles.setAttribute('position', new BufferAttribute(vertices, 3));

    this.particles = new Points(particles, renderMaterial);
    this.particles.position.y = -128.0;
    this.renderer = renderer;
  }

  update () {
    this.renderer.setRenderTarget(this.target);
    this.particles.material.uniforms.positions.value = this.target.texture;

    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
  }
}

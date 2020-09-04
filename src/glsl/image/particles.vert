precision mediump float;

uniform float time;

out float vTime;
out vec2 vUv;

void main (void) {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vTime = time;
  vUv = uv;
}

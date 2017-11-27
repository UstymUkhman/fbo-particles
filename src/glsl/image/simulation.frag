precision highp float;

uniform sampler2D positions;

varying float vTime;
varying vec2 vUv;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main (void) {
  vec3 position = texture2D(positions, vUv).xyz;
  position.y *= vTime;

  gl_FragColor = vec4(position, 1.0);
}

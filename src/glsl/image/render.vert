precision mediump float;

uniform sampler2D positions;
uniform float frequency;

out float power;

void main (void) {
  vec3 position = texture(positions, position.xy).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  gl_PointSize = 1.0;
  power = frequency;
}

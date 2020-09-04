precision highp float;

uniform sampler2D positions;

out vec4 fragColor;
in float vTime;
in vec2 vUv;

void main (void) {
  vec3 position = texture(positions, vUv).xyz;
  position.y *= vTime;

  fragColor = vec4(position, 1.0);
}

#include ../curl.glsl;

precision highp float;

uniform sampler2D data;

uniform float distance;
uniform float speed;
uniform float timer;

out vec4 fragColor;
in vec2 vUv;

void main (void) {
  vec3 position = texture(data, vUv).xyz;

  vec3 tar = position + curl(
    position.x, position.y, position.z, timer
  ) * speed;

  float d = length(position - tar) / distance;
  position = mix(position, tar, pow(d, 5.0));

  float alpha = clamp(speed + 40.0, 0.0, 250.0) / 250.0;
  fragColor = vec4(position, alpha);
}

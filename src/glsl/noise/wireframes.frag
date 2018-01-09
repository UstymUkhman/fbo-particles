precision highp float;

uniform float progress;

void main (void) {
  float prog = mix(0.2, 0.8, progress);
  vec3 color = vec3(prog);
  gl_FragColor = vec4(color, 0.0);
}

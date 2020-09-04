precision highp float;

uniform vec3 color;

in float size;

void main (void) {
  float alpha = 0.1 + color.x * (1.0 / 1.91875);
  gl_FragColor = vec4(color, alpha);
}

precision highp float;

uniform vec3 color;

out vec4 fragColor;
in float size;

void main (void) {
  float alpha = 0.1 + color.x * (1.0 / 1.91875);
  fragColor = vec4(color, alpha);
}

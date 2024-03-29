precision highp float;

out vec4 fragColor;
in float power;

void main (void) {
  vec3 color = vec3(clamp(power, 0.1, 0.8));
  fragColor = vec4(color, 1.0);
}

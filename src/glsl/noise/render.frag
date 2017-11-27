precision highp float;

uniform vec3 small;
uniform vec3 big;

varying float size;

void main (void) {
  float alpha = 0.2 + small.x * (0.3 / 191.875);
  gl_FragColor = vec4(small, alpha);

  if (size > 1.0) {
    float alpha = 0.5 + big.x * (0.45 / 223.750);
    gl_FragColor = vec4(big * vec3(1.0 - length(gl_PointCoord.xy - vec2(0.5))) * 1.5, alpha);
  }
}

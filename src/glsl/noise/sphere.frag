precision highp float;

uniform sampler2D black, white;
uniform float progress;

out vec4 fragColor;
in vec3 norm;
in vec3 eye;

vec2 matcap (vec3 e, vec3 n) {
  vec3 reflection = reflect(e, n);
  float m = 2.8284271247461903 * sqrt(reflection.z + 1.0);

  return reflection.xy / m + 0.5;
}

void main (void) {
  /*
    --- "spite" version: ---

    vec3 reflection = reflect(eye, norm); // === eye - 2.0 * dot(norm, eye) * norm;
   
    float m = 2.0 * sqrt(
        pow(reflection.x,       2.0) +
        pow(reflection.y,       2.0) +
        pow(reflection.z + 1.0, 2.0)
    );
   
    vec2 vN = reflection.xy / m + 0.5;
    fragColor = mix(
        vec4(texture(black, vN).rgb, 1.0),
        vec4(texture(white, vN).rgb, 1.0),
        progress
    );
  */

  // "hughsk" version:
  vec2 uv = matcap(eye, norm).xy;

  fragColor = mix(
    vec4(texture(black, uv).rgb, 1.0),
    vec4(texture(white, uv).rgb, 1.0),
    progress
  );
}

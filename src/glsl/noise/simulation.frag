precision highp float;

uniform sampler2D texture;

uniform float distance;
uniform float speed;
uniform float timer;

varying vec2 vUv;

vec3 mod289 (vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289 (vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute (vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float noise (vec2 v) {
  const vec4 C = vec4(
     0.211324865405187,
     0.366025403784439,
    -0.577350269189626,
     0.024390243902439
  );

  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;

  x12.xy -= i1;
  i = mod289(i);

  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);

  m = m * m;
  m = m * m;

  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;

  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 20.0 * dot(m, g);
}

vec3 curl (float x, float y, float z) {
  float	eps	 = 1.0,
        eps2 = 2.0;

  vec3 curl = vec3(0.0);
  float n1, n2, a, b;

  x *= 0.01;
  y *= 0.01;
  z *= 0.01;

  x += timer * 0.5;
  y += timer * 0.5;
  z += timer * 0.5;

  n1 = noise(vec2(x, y + eps));
  n2 = noise(vec2(x, y - eps));
  a	 = (n1 -	n2) / eps2;

  n1 = noise(vec2(x, z + eps));
  n2 = noise(vec2(x, z - eps));
  b	 = (n1 - n2) / eps2;

  curl.x = a - b;

  n1 = noise(vec2(y, z + eps));
  n2 = noise(vec2(y, z - eps));
  a  = (n1 - n2) / eps2;

  n1 = noise(vec2(x	+	eps, z));
  n2 = noise(vec2(x	+	eps, z));
  b  = (n1 - n2) / eps2;

  curl.y = a - b;

  n1 = noise(vec2(x	+	eps, y));
  n2 = noise(vec2(x	-	eps, y));
  a  = (n1 - n2) / eps2;

  n1 = noise(vec2( y + eps, z));
  n2 = noise(vec2( y - eps, z));
  b  = (n1 - n2) / eps2;

  curl.z = a - b;
  return curl * speed;
}

void main (void) {
  vec3 position = texture2D(texture, vUv).xyz;

  vec3 tar = position + curl(
    position.x, position.y, position.z
  );

  float d = length(position - tar) / distance;
  position = mix(position, tar, pow(d, 5.0));

  gl_FragColor = vec4(position, 1.0);
}

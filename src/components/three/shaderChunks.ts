/** Small GLSL helpers shared by the coffee shaders (liquid, crema, stream). */

export const NOISE_GLSL = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < FBM_OCTAVES; i++) {
      v += a * vnoise(p);
      p = r * p * 2.03 + 11.7;
      a *= 0.5;
    }
    return v;
  }
  vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
`;

/** Directions of the two dominant lights, matching <Lighting/>. */
export const KEY_LIGHT_DIR: [number, number, number] = [-0.45, 0.78, 0.43];
export const BAY_LIGHT_DIR: [number, number, number] = [0.0, 0.92, -0.38];

import * as THREE from "three";

/**
 * High-fidelity ocean shader using smooth vertex elevation and per-pixel
 * analytical wave normal evaluation.
 * Creates silky, serene oceanic swells and reflections matching the hero poster:
 * - Silky horizontal wave reflections
 * - Golden sunset corridor reflecting down the center of the sea
 * - Deep twilight indigo water body with Fresnel sky reflection
 * - Zero polygon stepping / faceting
 */
export const OceanShader = {
  uniforms: {
    time: { value: 0 },
    sunDirection: { value: new THREE.Vector3(0, -0.02, -1).normalize() },
    cameraPos: { value: new THREE.Vector3(0, 0, 0) },
    twilightIntensity: { value: 1.0 },
    waveMode: { value: 0.0 }, // 0.0 = calm mirror (水天一色), 1.0 = gentle ripples (微波起伏)
    milkyWayMatrix: { value: new THREE.Matrix4() },
    uStarDirs: {
      value: Array.from({ length: 24 }, () => new THREE.Vector3(0, 1, 0)),
    },
    uStarCols: {
      value: Array.from({ length: 24 }, () => new THREE.Vector3(1, 1, 1)),
    },
    uStarCount: { value: 0 },
  },

  vertexShader: `
    uniform float time;
    uniform vec3 cameraPos;
    uniform float waveMode;

    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vOceanUv;

    void main() {
      vOceanUv = uv;

      // Smooth oceanic swell modulated by waveMode (0 in calm mode)
      vec2 pos = position.xy;
      float w1 = sin(pos.y * 0.035 + time * 0.45) * 0.055;
      float w2 = cos(pos.x * 0.025 + pos.y * 0.02 + time * 0.35) * 0.035;
      float swellY = (w1 + w2) * waveMode;

      vec4 localPos = vec4(pos.x, swellY, pos.y, 1.0);
      vec4 worldPos = modelMatrix * localPos;
      vWorldPosition = worldPos.xyz;

      vViewDir = normalize(cameraPos - vWorldPosition);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 sunDirection;
    uniform vec3 cameraPos;
    uniform float twilightIntensity;
    uniform float waveMode;

    uniform vec3 uStarDirs[24];
    uniform vec3 uStarCols[24];
    uniform int uStarCount;

    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vOceanUv;

    // Multi-octave analytical wave normal calculation (per-pixel, perfectly smooth)
    vec3 calculateWaveNormal(vec2 p, float t) {
      float dx = 0.0;
      float dz = 0.0;

      // Harmonic 1: Long gentle swell
      float k1 = 0.065;
      float w1 = t * 0.55;
      float phase1 = p.y * k1 + p.x * 0.012 + w1;
      float c1 = cos(phase1) * 0.045;
      dz += c1 * k1;
      dx += c1 * 0.012;

      // Harmonic 2: Counter swell
      float k2 = 0.12;
      float w2 = t * 0.75;
      float phase2 = p.y * k2 - p.x * 0.025 + w2;
      float c2 = cos(phase2) * 0.028;
      dz += c2 * k2;
      dx -= c2 * 0.025;

      // Harmonic 3: Mid ripples
      float k3 = 0.28;
      float w3 = t * 1.15;
      float phase3 = (p.y * 0.95 + p.x * 0.3) * k3 + w3;
      float c3 = cos(phase3) * 0.014;
      dz += c3 * (k3 * 0.95);
      dx += c3 * (k3 * 0.3);

      // Harmonic 4: Fine silky capillary ripples
      float k4 = 0.65;
      float w4 = t * 1.65;
      float phase4 = (p.y * 0.9 + p.x * -0.42) * k4 + w4;
      float c4 = cos(phase4) * 0.007;
      dz += c4 * (k4 * 0.9);
      dx += c4 * (k4 * -0.42);

      return normalize(vec3(-dx * 1.8, 1.0, -dz * 1.8));
    }

    // Sky color function for sea reflection - pure celestial palette without sunset glare
    vec3 sampleSkyForOcean(vec3 ray) {
      float elevation = max(0.0, ray.y);

      vec3 cZenith       = vec3(0.015, 0.020, 0.048);
      vec3 cHighSky      = vec3(0.038, 0.052, 0.140);
      vec3 cMidSky       = vec3(0.085, 0.090, 0.220);
      vec3 cIndigoPurple = vec3(0.145, 0.120, 0.280);
      vec3 cLavender     = vec3(0.240, 0.165, 0.340);
      vec3 cDuskRose     = vec3(0.350, 0.190, 0.280);

      float h = elevation;
      vec3 col = cZenith;
      col = mix(col, cHighSky,      1.0 - smoothstep(0.48, 0.85, h));
      col = mix(col, cMidSky,       1.0 - smoothstep(0.26, 0.58, h));
      col = mix(col, cIndigoPurple, 1.0 - smoothstep(0.14, 0.35, h));
      col = mix(col, cLavender,     1.0 - smoothstep(0.05, 0.22, h));
      col = mix(col, cDuskRose,     1.0 - smoothstep(0.01, 0.10, h));

      // Gentle, subtle horizon rim only (no glaring golden wash)
      float horizonRim = exp(-pow(h * 64.0, 1.6));
      col += vec3(0.38, 0.22, 0.16) * (horizonRim * 0.25 * twilightIntensity);

      return col;
    }

    void main() {
      vec3 viewDir = normalize(vViewDir);

      // Surface normal: flat (0, 1, 0) for calm mirror mode, wave normal for rippled mode
      vec3 waveN = calculateWaveNormal(vWorldPosition.xz, time);
      vec3 N = normalize(mix(vec3(0.0, 1.0, 0.0), waveN, waveMode));

      // Reflected ray
      vec3 R = reflect(-viewDir, N);
      R.y = max(0.002, R.y);
      R = normalize(R);

      // Sample reflected sky color along ray R
      vec3 reflectedSky = sampleSkyForOcean(R);

      // Mirror state: authentic 3D Gaussian pinprick reflections of the stars above the water
      if (waveMode < 0.7) {
        vec3 starReflectSum = vec3(0.0);
        for (int i = 0; i < 24; i++) {
          if (i >= uStarCount) break;
          float alignment = dot(R, uStarDirs[i]);
          if (alignment > 0.9982) {
            // Isotropic 3D cone - forms crisp, round, glowing star reflections with zero stretching
            float dist = (1.0 - alignment) * 4000.0;
            float starPoint = exp(-dist * dist);
            float twinkle = sin(time * 3.4 + float(i) * 2.1) * 0.25 + 0.75;
            starReflectSum += uStarCols[i] * (starPoint * twinkle * 3.5);
          }
        }
        reflectedSky += starReflectSum * (1.0 - waveMode);
      }

      // Fresnel reflection factor: higher base reflection for mirror mode (0.35) for "sky-sea unity"
      float cosTheta = clamp(dot(viewDir, N), 0.0, 1.0);
      float F0 = mix(0.35, 0.08, waveMode);
      float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, mix(2.2, 3.8, waveMode));

      // Pure midnight indigo oceanic water body (matching reference image)
      vec3 deepWater = vec3(0.015, 0.024, 0.052);
      vec3 shallowWater = vec3(0.028, 0.045, 0.088);
      vec3 waterBody = mix(deepWater, shallowWater, clamp(vWorldPosition.y * 4.0 + 0.5, 0.0, 1.0));

      // Subtle cool ambient sheen on ripples
      if (waveMode > 0.1) {
        float waveSheen = pow(clamp(dot(N, vec3(0.0, 0.92, -0.38)), 0.0, 1.0), 8.0) * 0.10 * waveMode;
        waterBody += vec3(0.08, 0.11, 0.18) * waveSheen;
      }

      // Composite reflection + body
      vec3 finalColor = mix(waterBody, reflectedSky, fresnel);

      // Atmospheric distance fog smoothly merging ocean with horizon twilight
      float dist = length(cameraPos - vWorldPosition);
      float fogFactor = clamp((dist - 35.0) / 280.0, 0.0, 1.0);
      fogFactor = pow(fogFactor, 1.7);

      vec3 horizonFogColor = sampleSkyForOcean(vec3(0.0, 0.005, -1.0));
      finalColor = mix(finalColor, horizonFogColor, fogFactor * 0.92);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

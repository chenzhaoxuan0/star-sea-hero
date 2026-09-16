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
    milkyWayMatrix: { value: new THREE.Matrix4() },
  },

  vertexShader: `
    uniform float time;
    uniform vec3 cameraPos;

    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vOceanUv;

    void main() {
      vOceanUv = uv;

      // Gentle broad oceanic swell in vertex shader
      vec2 pos = position.xy;
      float w1 = sin(pos.y * 0.035 + time * 0.45) * 0.06;
      float w2 = cos(pos.x * 0.025 + pos.y * 0.02 + time * 0.35) * 0.04;
      float swellY = w1 + w2;

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

    varying vec3 vWorldPosition;
    varying vec3 vViewDir;
    varying vec2 vOceanUv;

    // Multi-octave analytical wave normal calculation (per-pixel, perfectly smooth)
    vec3 calculateWaveNormal(vec2 p, float t) {
      float dx = 0.0;
      float dz = 0.0;

      // Harmonic 1: Long horizontal swell (matching poster's calm sea)
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

    // Sky color function matching skyShader for accurate reflection
    vec3 sampleSky(vec3 ray) {
      float elevation = max(0.0, ray.y);

      vec3 cZenith       = vec3(0.015, 0.020, 0.048);
      vec3 cHighSky      = vec3(0.042, 0.058, 0.155);
      vec3 cMidSky       = vec3(0.105, 0.105, 0.275);
      vec3 cIndigoPurple = vec3(0.205, 0.155, 0.385);
      vec3 cLavender     = vec3(0.340, 0.225, 0.475);
      vec3 cDuskRose     = vec3(0.550, 0.275, 0.405);
      vec3 cHorizonAmber = vec3(0.890, 0.450, 0.235);
      vec3 cHorizonGold  = vec3(0.960, 0.650, 0.350);

      float h = elevation;
      vec3 col = cZenith;
      col = mix(col, cHighSky,      1.0 - smoothstep(0.48, 0.85, h));
      col = mix(col, cMidSky,       1.0 - smoothstep(0.26, 0.58, h));
      col = mix(col, cIndigoPurple, 1.0 - smoothstep(0.14, 0.35, h));
      col = mix(col, cLavender,     1.0 - smoothstep(0.05, 0.22, h));
      col = mix(col, cDuskRose,     1.0 - smoothstep(0.02, 0.11, h));

      // Golden horizon glow
      float forwardGlow = dot(normalize(vec2(ray.x, ray.z)), normalize(vec2(sunDirection.x, sunDirection.z)));
      float azimuthFactor = pow(clamp(forwardGlow * 0.5 + 0.5, 0.0, 1.0), 1.5);
      float horizonBand = exp(-pow(h * 36.0, 1.45));
      float horizonCore = exp(-pow(h * 72.0, 1.75));
      vec3 glowColor = mix(cHorizonAmber, cHorizonGold, horizonCore * 0.7);
      col += glowColor * (horizonBand * (0.60 + 0.40 * azimuthFactor) * 1.15 * twilightIntensity);

      return col;
    }

    void main() {
      vec3 viewDir = normalize(vViewDir);

      // Analytical per-pixel normal
      vec3 N = calculateWaveNormal(vWorldPosition.xz, time);

      // Reflected ray
      vec3 R = reflect(-viewDir, N);
      R.y = max(0.003, R.y);
      R = normalize(R);

      // Sample reflected sky color along ray R
      vec3 reflectedSky = sampleSky(R);

      // Diffused golden specular corridor down the center of the water
      vec3 halfVec = normalize(viewDir - sunDirection);
      float specBroad = pow(max(0.0, dot(N, halfVec)), 14.0);
      float specCore  = pow(max(0.0, dot(N, halfVec)), 48.0);
      vec3 specularGlow = vec3(0.92, 0.52, 0.28) * (specCore * 0.45 + specBroad * 0.22) * twilightIntensity;

      // Physically-based Schlick Fresnel with richer ambient sky reflection
      float cosTheta = clamp(dot(viewDir, N), 0.0, 1.0);
      float F0 = 0.12;
      float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, 3.2);

      // Deep twilight water body matching the poster's rich, tranquil indigo ocean
      vec3 deepWater = vec3(0.075, 0.095, 0.175);
      vec3 shallowWater = vec3(0.115, 0.145, 0.245);
      vec3 waterBody = mix(deepWater, shallowWater, clamp(vWorldPosition.y * 4.0 + 0.5, 0.0, 1.0));

      // Subtle ambient wave sheen reflecting sky tones across foreground swells
      float waveSheen = pow(clamp(dot(N, vec3(0.0, 0.85, -0.52)), 0.0, 1.0), 9.0) * 0.18;
      waterBody += vec3(0.14, 0.16, 0.28) * waveSheen;

      // Composite reflection + body
      vec3 finalColor = mix(waterBody, reflectedSky, fresnel);
      finalColor += specularGlow;

      // Atmospheric distance fog smoothly merging ocean with horizon twilight
      float dist = length(cameraPos - vWorldPosition);
      float fogFactor = clamp((dist - 40.0) / 260.0, 0.0, 1.0);
      fogFactor = pow(fogFactor, 1.6);

      vec3 horizonFogColor = sampleSky(vec3(sunDirection.x * 0.35, 0.005, sunDirection.z * 0.35));
      finalColor = mix(finalColor, horizonFogColor, fogFactor * 0.90);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

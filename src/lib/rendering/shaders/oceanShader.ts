import * as THREE from "three";

/**
 * Ocean shader with authentic planar reflection (Reflector),
 * multi-octave wave normal perturbations, and seamless horizon atmospheric haze.
 */
export const OceanShader = {
  name: "OceanPlanarShader",

  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    time: { value: 0 },
    waveMode: { value: 0.0 }, // 0.0 = calm mirror, 1.0 = rippled swell
    twilightIntensity: { value: 0.45 },
    cameraPos: { value: new THREE.Vector3() },
  },

  vertexShader: `
    uniform mat4 textureMatrix;

    varying vec4 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vViewDir = cameraPosition - worldPos.xyz;
      vUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float waveMode;
    uniform float twilightIntensity;
    uniform vec3 cameraPos;

    varying vec4 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    // Multi-octave analytical wave normal calculation (per-pixel smooth)
    vec3 calculateWaveNormal(vec2 p, float t) {
      float dx = 0.0;
      float dz = 0.0;

      // Harmonic 1: Long gentle ocean swell
      float k1 = 0.055;
      float w1 = t * 0.55;
      float phase1 = p.y * k1 + p.x * 0.012 + w1;
      float c1 = cos(phase1) * 0.045;
      dz += c1 * k1;
      dx += c1 * 0.012;

      // Harmonic 2: Counter swell
      float k2 = 0.11;
      float w2 = t * 0.78;
      float phase2 = p.y * k2 - p.x * 0.022 + w2;
      float c2 = cos(phase2) * 0.028;
      dz += c2 * k2;
      dx -= c2 * 0.022;

      // Harmonic 3: Mid capillary ripples
      float k3 = 0.26;
      float w3 = t * 1.25;
      float phase3 = (p.y * 0.92 + p.x * 0.32) * k3 + w3;
      float c3 = cos(phase3) * 0.014;
      dz += c3 * (k3 * 0.92);
      dx += c3 * (k3 * 0.32);

      // Harmonic 4: High frequency silky micro-ripples
      float k4 = 0.62;
      float w4 = t * 1.85;
      float phase4 = (p.y * 0.88 - p.x * 0.44) * k4 + w4;
      float c4 = cos(phase4) * 0.007;
      dz += c4 * (k4 * 0.88);
      dx -= c4 * (k4 * 0.44);

      return normalize(vec3(-dx * 1.8, 1.0, -dz * 1.8));
    }

    void main() {
      vec3 viewDir = normalize(vViewDir);

      // 1. Calculate normal: flat (0, 1, 0) for calm mirror mode, wave normal for rippled mode
      vec3 waveN = calculateWaveNormal(vWorldPosition.xz, time);
      vec3 N = normalize(mix(vec3(0.0, 1.0, 0.0), waveN, waveMode));

      // 2. Sample Planar Reflection
      vec4 reflectUv = vUv;
      if (waveMode > 0.01) {
        // Wave ripple distortion
        reflectUv.xy += waveN.xz * (0.035 * waveMode * reflectUv.w);
      }

      vec3 reflectedSky = texture2DProj(tDiffuse, reflectUv).rgb;

      // 3. Physical Fresnel factor (Schlick): high base reflection in calm mode for true starry mirror
      float cosTheta = clamp(dot(viewDir, N), 0.0, 1.0);
      float F0 = mix(0.75, 0.16, waveMode);
      float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, mix(2.4, 4.0, waveMode));

      // Deep midnight oceanic water body (pure deep sea, not reflecting sunset glow)
      vec3 deepWater = vec3(0.008, 0.012, 0.026);
      vec3 shallowWater = vec3(0.014, 0.020, 0.042);
      vec3 waterBody = mix(deepWater, shallowWater, clamp(vWorldPosition.y * 4.0 + 0.5, 0.0, 1.0));

      // Ambient wave crest highlight in wavy mode
      if (waveMode > 0.05) {
        float waveSheen = pow(clamp(dot(N, vec3(0.0, 0.92, -0.38)), 0.0, 1.0), 8.0) * 0.08 * waveMode;
        waterBody += vec3(0.08, 0.11, 0.18) * waveSheen;
      }

      vec3 finalColor = mix(waterBody, reflectedSky, fresnel);

      // 4. Seamless Atmospheric Horizon Transition (Zero Black Seam!)
      // Exactly matching skyShader's cHorizonBase = vec3(0.165, 0.130, 0.225)
      vec3 cHorizonBase = vec3(0.165, 0.130, 0.225);
      
      // Angular elevation angle towards camera: viewDir.y = +0.85 / dist > 0
      // Near camera (dist ~5m): viewElevation ~0.17
      // Far horizon (dist > 400m): viewElevation < 0.002
      float viewElevation = clamp(viewDir.y, 0.0, 1.0);
      float horizonFactor = 1.0 - smoothstep(0.0004, 0.0035, viewElevation);
      
      // Also blend by distance for distant haze
      float dist = length(cameraPos - vWorldPosition);
      float distFog = smoothstep(450.0, 2400.0, dist);
      float totalHorizonBlend = clamp(max(horizonFactor, distFog), 0.0, 1.0);

      finalColor = mix(finalColor, cHorizonBase, totalHorizonBlend);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

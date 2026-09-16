import * as THREE from "three";

/**
 * Advanced Ocean Surface Shader with:
 * 1. Multi-octave Cascading Directional Gerstner Waves (Trochoidal Dynamics)
 * 2. Physical Fresnel (Schlick Law) & Optical Water Body Absorption
 * 3. Perspective-Foreshortened Planar Reflection with Edge-Protection Fallback
 * 4. Micro-facet Starlight Specular Glints ("波光粼粼") & Wave Crest Subsurface Scattering
 * 5. Seamless Atmospheric Aerial Perspective Horizon Blending (Zero Black Seam)
 */
export const OceanShader = {
  name: "OceanPlanarShader",

  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    time: { value: 0 },
    waveMode: { value: 1.0 }, // 0.0 = celestial mirror, 1.0 = rippled swell
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

    // --- Gerstner (Trochoidal) Wave Component ---
    // Evaluates a single Gerstner wave octave with deep-water gravity dispersion
    void addGerstnerWave(
      vec2 p,
      float t,
      vec2 dir,
      float wavelength,
      float amplitude,
      float steepness,
      inout float dx,
      inout float dz,
      inout float dy
    ) {
      float k = 6.28318530718 / wavelength; // Wavenumber
      float w = sqrt(9.81 * k);             // Deep-water dispersion: omega = sqrt(g * k)
      float phase = dot(dir, p) * k - w * t;
      float sinP = sin(phase);
      float cosP = cos(phase);

      float kA = k * amplitude;
      dx -= dir.x * kA * cosP;
      dz -= dir.y * kA * cosP;
      dy -= steepness * kA * sinP;
    }

    // --- Multi-Octave Cascading Gerstner Wave Normal ---
    // Combines primary ocean swell, cross-seas, wind chops, and fine capillary ripples
    vec3 calculateGerstnerNormal(vec2 p, float t, float lodFade) {
      float dx = 0.0;
      float dz = 0.0;
      float dy = 1.0;

      // Primary ocean swells (long wavelengths, majestic slow rhythm)
      addGerstnerWave(p, t * 0.72, normalize(vec2(0.32, 0.95)),  68.0, 0.085, 0.75, dx, dz, dy);
      addGerstnerWave(p, t * 0.85, normalize(vec2(-0.55, 0.83)), 42.0, 0.052, 0.70, dx, dz, dy);

      // Mid-frequency crossing wind waves (creates diamond interference pattern)
      addGerstnerWave(p, t * 1.10, normalize(vec2(0.82, 0.57)),  22.0, 0.031, 0.65, dx, dz, dy);
      addGerstnerWave(p, t * 1.35, normalize(vec2(-0.25, 0.97)), 12.0, 0.018, 0.60, dx, dz, dy);

      // Higher-frequency surface chop (attenuated smoothly by LOD at distance)
      if (lodFade > 0.05) {
        float hfWeight = lodFade;
        addGerstnerWave(p, t * 1.70, normalize(vec2(0.68, -0.73)), 6.2, 0.009 * hfWeight, 0.55, dx, dz, dy);
        addGerstnerWave(p, t * 2.10, normalize(vec2(-0.78, 0.62)), 3.1, 0.005 * hfWeight, 0.50, dx, dz, dy);

        // Capillary surface tension ripples
        float capPhase1 = (p.y * 0.85 + p.x * 0.52) * 4.2 - t * 3.2;
        float capPhase2 = (p.y * 0.62 - p.x * 0.78) * 7.5 - t * 4.6;
        float capAmp = 0.0022 * hfWeight;
        dx += cos(capPhase1) * capAmp * 0.52 - sin(capPhase2) * capAmp * 0.78;
        dz += cos(capPhase1) * capAmp * 0.85 + sin(capPhase2) * capAmp * 0.62;
      }

      return normalize(vec3(dx * 1.65, dy, dz * 1.65));
    }

    void main() {
      vec3 viewDir = normalize(vViewDir);
      float viewElevation = clamp(viewDir.y, 0.0, 1.0);
      float dist = length(cameraPos - vWorldPosition);

      // Distance LOD fade: high-frequency ripples gently relax into flat water at the horizon
      float lodFade = clamp(1.0 - smoothstep(80.0, 1200.0, dist), 0.0, 1.0);

      // 1. Calculate Wave Normal: flat (0, 1, 0) for calm mirror, Gerstner normal for rippled
      vec3 waveN = calculateGerstnerNormal(vWorldPosition.xz, time, lodFade);
      vec3 N = normalize(mix(vec3(0.0, 1.0, 0.0), waveN, waveMode));

      // 2. Perspective-Foreshortened Planar Reflection Sampling
      // At grazing angles near the horizon, vertical wave facets are strongly compressed in perspective.
      // We damp the vertical UV displacement proportionally to viewElevation to prevent edge artifacts.
      vec4 reflectUv = vUv;
      if (waveMode > 0.01) {
        float grazingDamp = smoothstep(0.001, 0.045, viewElevation);
        float distortScale = 0.026 * waveMode * (0.35 + 0.65 * lodFade);
        reflectUv.x += waveN.x * (distortScale * reflectUv.w);
        reflectUv.y += waveN.z * (distortScale * reflectUv.w * grazingDamp);
      }

      // Forward azimuth factor for twilight horizon warmth (matching skyShader)
      float forwardGlow = dot(normalize(vec2(viewDir.x, viewDir.z)), vec2(0.0, 1.0));
      float azimuthFactor = pow(clamp(forwardGlow * 0.5 + 0.5, 0.0, 1.0), 1.6);
      vec3 cHorizonBase = vec3(0.165, 0.130, 0.225);
      vec3 twilightWarmth = vec3(0.240, 0.140, 0.120);
      vec3 horizonAtmosphere = cHorizonBase + twilightWarmth * ((0.40 + 0.60 * azimuthFactor) * 0.14 * twilightIntensity);

      // Safe projected sampling with border guard
      vec2 projCoords = reflectUv.xy / reflectUv.w;
      vec3 reflectedSky = texture2DProj(tDiffuse, reflectUv).rgb;

      // Soft edge-guard: if wave distortion pushes UV near buffer borders, softly blend to horizon color
      float edgeSafety = smoothstep(0.001, 0.030, projCoords.y) * 
                         (1.0 - smoothstep(0.970, 0.999, projCoords.y)) *
                         smoothstep(0.001, 0.030, projCoords.x) *
                         (1.0 - smoothstep(0.970, 0.999, projCoords.x));
      reflectedSky = mix(horizonAtmosphere, reflectedSky, edgeSafety);

      // 3. Physical Fresnel Factor (Schlick's Law)
      // Water IOR n = 1.333 -> F0 = 0.0204 (~2%). In rippled mode, we use ~0.038.
      // In calm mirror mode, high F0 (0.72) is preserved for the crystal celestial mirror.
      float cosTheta = clamp(dot(viewDir, N), 0.0, 1.0);
      float F0 = mix(0.72, 0.038, waveMode);
      float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, mix(2.4, 5.0, waveMode));

      // 4. Optical Water Body (Absorption & Subsurface Scattering)
      // Deep midnight ocean abyss
      vec3 cAbyss = vec3(0.006, 0.010, 0.022);
      vec3 cMidWater = vec3(0.014, 0.022, 0.045);
      vec3 cTranslucentCrest = vec3(0.028, 0.055, 0.088);
      vec3 waterBody = mix(cAbyss, cMidWater, clamp(vWorldPosition.y * 3.0 + 0.6, 0.0, 1.0));

      // Subsurface scattering on wave crests facing ambient celestial light
      if (waveMode > 0.05) {
        float forwardScatter = pow(clamp(dot(viewDir, vec3(0.0, 0.88, -0.47)), 0.0, 1.0), 3.5);
        float crestFacing = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        waterBody += cTranslucentCrest * (forwardScatter * crestFacing * 0.12 * waveMode);
      }

      // 5. Starlight Specular Glints ("波光粼粼" 微表面星河微芒)
      if (waveMode > 0.05) {
        vec3 starLightVector = normalize(vec3(0.05, 0.98, -0.20));
        vec3 H = normalize(viewDir + starLightVector);
        float NdotH = clamp(dot(waveN, H), 0.0, 1.0);
        float specularGlint = pow(NdotH, 42.0) * 0.08 * lodFade * waveMode;
        float sharpSparkle = pow(NdotH, 220.0) * 0.22 * lodFade * waveMode;
        vec3 glintColor = vec3(0.75, 0.85, 1.0);
        reflectedSky += glintColor * (specularGlint + sharpSparkle);
      }

      // 6. Base Ocean Color Composition
      vec3 finalColor = mix(waterBody, reflectedSky, fresnel);

      // 7. Seamless Aerial Perspective Atmosphere Horizon Blending
      // Distance atmospheric haze + grazing angle convergence:
      // Smoothly transitions from foreground water body + reflection to horizon atmosphere
      float hazeByDist = 1.0 - exp(-dist * 0.0022);
      float hazeByElevation = 1.0 - smoothstep(0.0003, 0.048, viewElevation);
      float totalHorizonBlend = clamp(max(hazeByDist, hazeByElevation), 0.0, 1.0);
      totalHorizonBlend = pow(totalHorizonBlend, 0.85);

      finalColor = mix(finalColor, horizonAtmosphere, totalHorizonBlend);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

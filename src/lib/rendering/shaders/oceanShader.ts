import * as THREE from "three";

/**
 * Advanced Ocean Surface Shader with:
 * 1. Dual-Mode Wave Dynamics:
 *    - Calm Mode (0.0): Glassy Liquid Sea ("镜水微澜") with ultra-low frequency breathing swell,
 *      surface tension micro-flow, and anisotropic starlight glitter paths.
 *    - Rippled Mode (1.0): Multi-octave Cascading Directional Gerstner Waves (Trochoidal Dynamics).
 * 2. Physical Water Fresnel (Schlick Law) with optical depth penetration and grazing convergence.
 * 3. Water Medium Chromatic Absorption (Beer-Lambert extinction).
 * 4. Micro-facet Starlight Specular Glints ("波光粼粼") & Translucent Water Forward Scattering.
 * 5. Seamless Aerial Perspective Atmosphere Horizon Blending (Zero Black Seam, Pure Midnight Indigo).
 */
export const OceanShader = {
  name: "OceanPlanarShader",

  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    time: { value: 0 },
    waveMode: { value: 1.0 }, // 0.0 = glassy liquid mirror, 1.0 = rippled swell
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

    // --- Calm Mode: Authentic Liquid Breathing Swell ("镜水微澜") ---
    // Simulates ultra-long wavelength, slow-motion liquid breathing undulation
    // and subtle surface tension, so calm water feels truly liquid rather than a rigid glass mirror.
    vec3 calculateCalmBreathingNormal(vec2 p, float t) {
      float dx = 0.0;
      float dz = 0.0;

      // Primary breathing swell (~140m wavelength, very slow period ~18s)
      float p1 = (p.y * 0.94 + p.x * 0.34) * 0.0448 - t * 0.35;
      float c1 = cos(p1) * 0.0035;
      dz += c1 * 0.94;
      dx += c1 * 0.34;

      // Secondary counter swell (~85m wavelength, period ~14s)
      float p2 = (p.y * 0.82 - p.x * 0.57) * 0.0739 - t * 0.45;
      float c2 = cos(p2) * 0.0022;
      dz += c2 * 0.82;
      dx -= c2 * 0.57;

      // Liquid surface tension silky micro-undulation (~35m wavelength)
      float p3 = (p.x * 0.78 + p.y * 0.62) * 0.179 - t * 0.68;
      float c3 = cos(p3) * 0.0012;
      dx += c3 * 0.78;
      dz += c3 * 0.62;

      return normalize(vec3(-dx, 1.0, -dz));
    }

    // --- Rippled Mode: Precomputed Gerstner (Trochoidal) Wave Constants ---
    // Mathematically precomputes wavenumber k = 2pi / lambda, deep-water angular frequency
    // w = sqrt(g * k), normalized propagation direction, and steepness coefficients.
    // Completely eliminates runtime sqrt() and division instructions across millions of fragments.
    void addPrecomputedGerstner(
      vec2 p,
      float t,
      vec2 dir,
      float k,
      float w_t,
      float kA,
      float s_kA,
      inout float dx,
      inout float dz,
      inout float dy
    ) {
      float phase = dot(dir, p) * k - w_t * t;
      float sinP = sin(phase);
      float cosP = cos(phase);

      dx -= dir.x * kA * cosP;
      dz -= dir.y * kA * cosP;
      dy -= s_kA * sinP;
    }

    // --- Multi-Octave Cascading Gerstner Wave Normal (Zero-Loss High Performance) ---
    vec3 calculateGerstnerNormal(vec2 p, float t, float lodFade) {
      float dx = 0.0;
      float dz = 0.0;
      float dy = 1.0;

      // Primary ocean swells (long wavelengths, majestic slow rhythm)
      // W1: lambda=68m, amp=0.085m, Q=0.75, speed=0.72x
      addPrecomputedGerstner(p, t, vec2(0.31908, 0.94773), 0.092400, 0.685492, 0.007854, 0.005890, dx, dz, dy);
      // W2: lambda=42m, amp=0.052m, Q=0.70, speed=0.85x
      addPrecomputedGerstner(p, t, vec2(-0.55243, 0.83356), 0.149600, 1.029719, 0.007779, 0.005445, dx, dz, dy);

      // Mid-frequency crossing wind waves (creates diamond interference pattern)
      // W3: lambda=22m, amp=0.031m, Q=0.65, speed=1.10x
      addPrecomputedGerstner(p, t, vec2(0.82115, 0.57071), 0.285599, 1.841220, 0.008854, 0.005755, dx, dz, dy);
      // W4: lambda=12m, amp=0.018m, Q=0.60, speed=1.35x
      addPrecomputedGerstner(p, t, vec2(-0.24945, 0.96839), 0.523599, 3.059621, 0.009425, 0.005655, dx, dz, dy);

      // Higher-frequency surface chop (attenuated smoothly by LOD at distance)
      if (lodFade > 0.05) {
        float hfWeight = lodFade;
        // W5: lambda=6.2m, amp=0.009m, Q=0.55, speed=1.70x
        addPrecomputedGerstner(p, t, vec2(0.68172, -0.73161), 1.013417, 5.360158, 0.009121 * hfWeight, 0.005016 * hfWeight, dx, dz, dy);
        // W6: lambda=3.1m, amp=0.005m, Q=0.50, speed=2.10x
        addPrecomputedGerstner(p, t, vec2(-0.78280, 0.62227), 2.026834, 9.364032, 0.010134 * hfWeight, 0.005067 * hfWeight, dx, dz, dy);

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

      // Distance LOD fade: high-frequency ripples gently relax into smooth water at the horizon
      float lodFade = clamp(1.0 - smoothstep(80.0, 1200.0, dist), 0.0, 1.0);

      // 1. Calculate Wave Normal with Coherent Uniform Branching:
      // In default rippled mode (waveMode >= 0.99), completely skip calm mode breathing normal.
      // In calm mode (waveMode <= 0.01), completely skip Gerstner wave generation.
      // Dynamic uniform branching executes zero unneeded ALU instructions on the GPU.
      vec3 activeN;
      if (waveMode >= 0.99) {
        activeN = calculateGerstnerNormal(vWorldPosition.xz, time, lodFade);
      } else if (waveMode <= 0.01) {
        activeN = calculateCalmBreathingNormal(vWorldPosition.xz, time);
      } else {
        vec3 calmN = calculateCalmBreathingNormal(vWorldPosition.xz, time);
        vec3 gerstnerN = calculateGerstnerNormal(vWorldPosition.xz, time, lodFade);
        activeN = normalize(mix(calmN, gerstnerN, waveMode));
      }

      // 2. Perspective-Foreshortened Planar Reflection Sampling
      // At grazing angles near the horizon, vertical displacement is dampened to avoid edge tearing.
      // In calm mode, subtle anisotropic elongation along line of sight creates realistic starlight reflection paths.
      vec4 reflectUv = vUv;
      float grazingDamp = smoothstep(0.001, 0.045, viewElevation);
      float distortScale = mix(0.0042, 0.026 * (0.35 + 0.65 * lodFade), waveMode);
      
      reflectUv.x += activeN.x * (distortScale * reflectUv.w);
      reflectUv.y += activeN.z * (distortScale * reflectUv.w * mix(grazingDamp * 1.4, grazingDamp, waveMode));

      // Clean celestial horizon airglow matching skyShader (refined nocturnal indigo, zero orange/red)
      float forwardGlow = dot(normalize(vec2(viewDir.x, viewDir.z)), vec2(0.0, 1.0));
      float azimuthFactor = pow(clamp(forwardGlow * 0.5 + 0.5, 0.0, 1.0), 1.6);
      vec3 cHorizonSky = vec3(0.036, 0.050, 0.125);
      vec3 cAirglow = vec3(0.015, 0.025, 0.055);
      vec3 horizonAtmosphere = cHorizonSky + cAirglow * ((0.40 + 0.60 * azimuthFactor) * 0.12 * twilightIntensity);

      // Safe projected sampling with border guard
      vec2 projCoords = reflectUv.xy / reflectUv.w;
      vec3 reflectedSky = texture2DProj(tDiffuse, reflectUv).rgb;

      // Soft edge-guard: if wave distortion pushes UV near buffer borders, softly blend to horizon color
      float edgeSafety = smoothstep(0.000, 0.015, projCoords.y) * 
                         (1.0 - smoothstep(0.985, 1.000, projCoords.y)) *
                         smoothstep(0.000, 0.015, projCoords.x) *
                         (1.0 - smoothstep(0.985, 1.000, projCoords.x));
      reflectedSky = mix(horizonAtmosphere, reflectedSky, edgeSafety);

      // Beer-Lambert Water Medium Chromatic Glaze (subtle oceanic absorption filtering)
      vec3 waterAbsorptionTint = mix(vec3(0.93, 0.97, 1.02), vec3(1.0), waveMode * 0.4);
      reflectedSky *= waterAbsorptionTint;

      // 3. Physical Fresnel Factor (Schlick's Law)
      // Real water index of refraction n = 1.333 -> F0 = 0.0204.
      // In calm mode: F0 ~ 0.065 allows gaze to penetrate into the dark abyss in the foreground,
      // while grazing angles smoothly climb to 100% celestial mirror reflection ("水天一色").
      float cosTheta = clamp(dot(viewDir, activeN), 0.0, 1.0);
      float F0 = mix(0.065, 0.038, waveMode);
      float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, mix(3.6, 5.0, waveMode));

      // 4. Optical Water Body (Depth Absorption & Forward Scattering)
      vec3 cAbyss = vec3(0.005, 0.008, 0.018);
      vec3 cMidWater = vec3(0.012, 0.020, 0.042);
      vec3 cTranslucentCrest = vec3(0.026, 0.052, 0.085);
      
      float depthFactor = clamp((1.0 - cosTheta) * 0.5 + (vWorldPosition.y * 2.5 + 0.6) * 0.5, 0.0, 1.0);
      vec3 waterBody = mix(cAbyss, cMidWater, depthFactor);

      // Forward light scattering through liquid surface
      float forwardScatter = pow(clamp(dot(viewDir, vec3(0.0, 0.88, -0.47)), 0.0, 1.0), 3.5);
      float crestFacing = clamp(activeN.y * 0.5 + 0.5, 0.0, 1.0);
      waterBody += cTranslucentCrest * (forwardScatter * crestFacing * (0.04 + 0.08 * waveMode));

      // 5. Starlight Specular Glints & Calm Liquid Glimmer ("波光粼粼" & 水上星道)
      vec3 starLightVector = normalize(vec3(0.05, 0.98, -0.20));
      vec3 H = normalize(viewDir + starLightVector);
      float NdotH = clamp(dot(activeN, H), 0.0, 1.0);
      
      // Calm mode: soft, silky liquid shimmer along starlight reflection paths
      float calmGlint = pow(NdotH, 48.0) * 0.04 * (1.0 - waveMode);
      // Rippled mode: crisp micro-facet sparkles dancing on wave peaks
      float waveGlint = (pow(NdotH, 42.0) * 0.08 + pow(NdotH, 220.0) * 0.22) * lodFade * waveMode;
      
      vec3 glintColor = vec3(0.78, 0.88, 1.0);
      reflectedSky += glintColor * (calmGlint + waveGlint);

      // 6. Base Ocean Color Composition
      vec3 finalColor = mix(waterBody, reflectedSky, fresnel);

      // 7. Seamless Aerial Perspective Atmosphere Horizon Blending
      // Smoothly transitions extreme distant water boundary into horizon atmosphere while preserving crisp star reflections.
      // Zero black seam: grazing angle convergence replaces foreground water body with 100% mirror sky reflection,
      // and extreme distance converges seamlessly into horizonAtmosphere matching the sky dome exactly.
      float hazeByDist = 1.0 - exp(-dist * 0.0008);
      float hazeByElevation = 1.0 - smoothstep(0.0001, 0.018, viewElevation);
      float totalHorizonBlend = clamp(max(hazeByDist, hazeByElevation), 0.0, 1.0);
      totalHorizonBlend = pow(totalHorizonBlend, 2.5);

      // Near the horizon (grazing angle), ensure full 100% specular mirror reflection (no dark abyss body tint)
      finalColor = mix(finalColor, reflectedSky, hazeByElevation);

      // At extreme distance, seamlessly unify with horizonAtmosphere
      finalColor = mix(finalColor, horizonAtmosphere, totalHorizonBlend);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

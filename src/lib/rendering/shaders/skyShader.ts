import * as THREE from "three";

/**
 * Atmospheric twilight glow and ethereal procedural Milky Way nebula.
 * Reproduces the exact palette and lighting of the hero poster:
 * - Golden amber & salmon twilight strip right at the horizon
 * - Romantic transition through coral rose, soft lavender, royal indigo, to cosmic night navy
 * - Magnificent arching Milky Way galaxy across the upper sky with glowing nebula and dust lanes
 */
export const SkyShader = {
  uniforms: {
    time: { value: 0 },
    sunDirection: { value: new THREE.Vector3(0, -0.02, -1).normalize() },
    milkyWayMatrix: { value: new THREE.Matrix4() },
    twilightIntensity: { value: 1.0 },
  },

  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vRayDirection;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vRayDirection = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 sunDirection;
    uniform mat4 milkyWayMatrix;
    uniform float twilightIntensity;

    varying vec3 vWorldPosition;
    varying vec3 vRayDirection;

    // --- Simplex / 3D Noise for Nebula and Dust Lanes ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    // Fractal Brownian Motion for multi-scale gas & dust
    float fbm(vec3 p) {
      float f = 0.0;
      f += 0.5000 * snoise(p); p *= 2.02;
      f += 0.2500 * snoise(p); p *= 2.03;
      f += 0.1250 * snoise(p); p *= 2.01;
      f += 0.0625 * snoise(p);
      return f;
    }

    void main() {
      vec3 ray = normalize(vRayDirection);
      float elevation = ray.y; // -1 to 1

      // 1. Atmosphere base gradient (zenith to horizon)
      vec3 cZenith       = vec3(0.015, 0.020, 0.048); // Deep cosmic night
      vec3 cHighSky      = vec3(0.042, 0.058, 0.155); // Deep navy
      vec3 cMidSky       = vec3(0.105, 0.105, 0.275); // Rich indigo
      vec3 cIndigoPurple = vec3(0.205, 0.155, 0.385); // Royal purple
      vec3 cLavender     = vec3(0.340, 0.225, 0.475); // Twilight lavender
      vec3 cDuskRose     = vec3(0.550, 0.275, 0.405); // Warm rose-pink
      vec3 cHorizonAmber = vec3(0.890, 0.450, 0.235); // Sunset amber
      vec3 cHorizonGold  = vec3(0.960, 0.650, 0.350); // Soft gold

      // Elevation height ramp
      float h = max(0.0, elevation);
      vec3 skyColor = cZenith;
      skyColor = mix(skyColor, cHighSky,      1.0 - smoothstep(0.48, 0.85, h));
      skyColor = mix(skyColor, cMidSky,       1.0 - smoothstep(0.26, 0.58, h));
      skyColor = mix(skyColor, cIndigoPurple, 1.0 - smoothstep(0.14, 0.35, h));
      skyColor = mix(skyColor, cLavender,     1.0 - smoothstep(0.05, 0.22, h));
      skyColor = mix(skyColor, cDuskRose,     1.0 - smoothstep(0.02, 0.11, h));

      // 2. Horizon Twilight Glow (centered toward sunDirection)
      float forwardGlow = dot(normalize(vec2(ray.x, ray.z)), normalize(vec2(sunDirection.x, sunDirection.z)));
      float azimuthFactor = pow(clamp(forwardGlow * 0.5 + 0.5, 0.0, 1.0), 1.5);

      // Smooth, non-blown-out golden-amber glow along the horizon
      float horizonBand = exp(-pow(h * 36.0, 1.45));
      float horizonCore = exp(-pow(h * 72.0, 1.75));
      vec3 glowColor = mix(cHorizonAmber, cHorizonGold, horizonCore * 0.7);
      skyColor += glowColor * (horizonBand * (0.60 + 0.40 * azimuthFactor) * 1.15 * twilightIntensity);

      // 3. Arching Milky Way Galaxy & Nebula
      vec3 galRay = (milkyWayMatrix * vec4(ray, 0.0)).xyz;
      float galLat = abs(galRay.y);
      float bandWidth = 0.42;

      if (galLat < bandWidth && elevation > 0.02) {
        float bandProfile = cos(galLat / bandWidth * 1.5707963);
        bandProfile = pow(bandProfile, 1.35);

        // Galactic longitude modulation: core at galRay.z > 0
        float coreAngle = galRay.z;
        float coreBoost = 1.0 + 1.4 * pow(max(0.0, coreAngle), 1.8);

        // Smooth multi-octave FBM 3D noise
        vec3 pNoise = galRay * 3.2;
        float nebulaNoise1 = fbm(pNoise);
        float nebulaNoise2 = fbm(pNoise * 2.0 + vec3(2.1, 4.3, 1.2));

        // Dark dust lanes slicing through the galactic core
        float dustNoise = fbm(pNoise * 2.8 + vec3(5.2, 1.7, 3.4));
        float dustLane = smoothstep(0.03, 0.30, abs(galRay.y + dustNoise * 0.07 - 0.015));

        // Combined nebula density
        float nebulaDensity = clamp((nebulaNoise1 * 0.65 + nebulaNoise2 * 0.35) * 1.4 - 0.15, 0.0, 1.0);
        nebulaDensity *= bandProfile * coreBoost * dustLane;

        // Elevation fade so nebula seamlessly blends into the sky
        float horizonFade = smoothstep(0.05, 0.25, elevation);
        nebulaDensity *= horizonFade;

        // Nebula Palette matching poster (rich magenta-lilac, vibrant purple, deep cyan-violet)
        vec3 nebulaCoreCol  = vec3(0.86, 0.64, 0.94); // radiant stardust core
        vec3 nebulaMidCol   = vec3(0.54, 0.34, 0.82); // glowing purple
        vec3 nebulaOuterCol = vec3(0.20, 0.28, 0.66); // cosmic violet-blue

        vec3 nebulaColor = mix(nebulaOuterCol, nebulaMidCol, smoothstep(0.08, 0.45, nebulaDensity));
        nebulaColor = mix(nebulaColor, nebulaCoreCol, smoothstep(0.45, 0.88, nebulaDensity));

        skyColor += nebulaColor * (nebulaDensity * 1.65);
      }

      // 4. Subtle atmospheric haze below horizon for seamless ocean seam
      if (elevation < 0.0) {
        skyColor = mix(skyColor, cHorizonAmber * 0.25, exp(elevation * 22.0));
      }

      gl_FragColor = vec4(skyColor, 1.0);
    }
  `,
};

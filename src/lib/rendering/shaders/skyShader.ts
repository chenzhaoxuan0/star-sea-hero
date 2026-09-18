import * as THREE from "three";

/**
 * Atmospheric twilight glow, astronomical Milky Way galaxy, and adjustable starlit clouds.
 */
export const SkyShader = {
  uniforms: {
    time: { value: 0 },
    sunDirection: { value: new THREE.Vector3(0, -0.02, -1).normalize() },
    milkyWayMatrix: { value: new THREE.Matrix4() },
    uMilkyWayMap: { value: null as THREE.Texture | null },
    uMilkyWayIntensity: { value: 1.0 },
    twilightIntensity: { value: 0.40 },
    uCloudDensity: { value: 0.0 },
    uCloudElevation: { value: 0.20 },
    uCloudCoverage: { value: 0.40 },
    uCloudOffset: { value: new THREE.Vector2(0, 0) },
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
    uniform sampler2D uMilkyWayMap;
    uniform float uMilkyWayIntensity;
    uniform float twilightIntensity;

    uniform float uCloudDensity;
    uniform float uCloudElevation;
    uniform float uCloudCoverage;
    uniform vec2 uCloudOffset;

    varying vec3 vWorldPosition;
    varying vec3 vRayDirection;

    // --- Simplex / 3D Noise for Milky Way and Natural Nocturnal Clouds ---
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

      // 1. Atmosphere celestial dome (zenith down to horizon)
      vec3 cZenith       = vec3(0.007, 0.010, 0.026); // Deep cosmic void
      vec3 cHighSky      = vec3(0.015, 0.024, 0.065); // Deep midnight navy
      vec3 cMidSky       = vec3(0.026, 0.038, 0.098); // Rich nocturnal indigo
      vec3 cHorizonSky   = vec3(0.036, 0.050, 0.125); // Exact unified nocturnal horizon tone

      float h = max(0.0, elevation);
      vec3 skyColor = cZenith;
      skyColor = mix(skyColor, cHighSky,    1.0 - smoothstep(0.48, 0.85, h));
      skyColor = mix(skyColor, cMidSky,     1.0 - smoothstep(0.24, 0.58, h));
      skyColor = mix(skyColor, cHorizonSky, 1.0 - smoothstep(0.00, 0.28, h));

      // 2. Astrophotography-Grade Authentic Milky Way Galaxy (Stellarium All-Sky Panorama)
      // Flows seamlessly all the way down to sea level, unblocked by horizon haze
      if (elevation > -0.005) {
        vec3 vEq = (milkyWayMatrix * vec4(ray, 0.0)).xyz;
        float declination = asin(clamp(vEq.z, -1.0, 1.0));
        float v = declination / 3.141592653589793 + 0.5;
        float ra = atan(vEq.y, vEq.x);
        float u = fract(0.2239 - ra / 6.283185307179586);

        vec4 mwTex = texture2D(uMilkyWayMap, vec2(u, v));

        // Smooth continuous transition across water line
        float mwExtinction = clamp(elevation * 100.0 + 0.15, 0.0, 1.0);

        vec3 mwRgb = mwTex.rgb;
        vec3 mwGraded = pow(mwRgb, vec3(1.32)) * 1.15;
        mwGraded = (mwGraded / (vec3(1.0) + mwGraded * 0.28)) * 0.96;

        skyColor += mwGraded * (mwExtinction * uMilkyWayIntensity);
      }

      // 3. Ethereal Horizon Airglow (Additive, never covers or blackens stars/Milky Way!)
      float forwardGlow = dot(normalize(vec2(ray.x, ray.z)), normalize(vec2(sunDirection.x, sunDirection.z)));
      float azimuthFactor = pow(clamp(forwardGlow * 0.5 + 0.5, 0.0, 1.0), 1.6);
      float twilightElev = exp(-pow(h * 32.0, 1.25));
      vec3 cAirglow = vec3(0.015, 0.025, 0.055);
      skyColor += cAirglow * (twilightElev * (0.40 + 0.60 * azimuthFactor) * 0.12 * twilightIntensity);

      // 4. Natural Nocturnal Atmospheric Clouds / Mist (Adjustable)
      if (uCloudDensity > 0.01 && elevation > 0.02) {
        vec2 cloudCoord = (ray.xz / max(ray.y, 0.08)) * 0.35;
        vec2 drift = uCloudOffset + vec2(time * 0.008, time * 0.003);
        vec3 pCloud = vec3(cloudCoord + drift, 0.0);

        // Domain-warped soft nocturnal wisps
        vec3 pWarp = pCloud * 1.2;
        float warp = fbm(pWarp);
        float cloudNoise = fbm(pWarp * 1.6 + vec3(warp * 0.7, warp * 0.5, time * 0.005));

        // Elevation window matching uCloudElevation and uCloudCoverage
        float elevDist = abs(elevation - uCloudElevation);
        float elevMask = 1.0 - smoothstep(0.0, uCloudCoverage * 0.45, elevDist);
        elevMask = pow(clamp(elevMask, 0.0, 1.0), 1.5);

        // Density modulation
        float threshold = 0.48 - (uCloudDensity - 1.0) * 0.14;
        float cloudAlpha = smoothstep(threshold - 0.10, threshold + 0.30, cloudNoise) * elevMask * uCloudDensity;
        cloudAlpha = clamp(cloudAlpha, 0.0, 0.80);

        // Starlit midnight mist (soft lunar silver-indigo, gently catching celestial light)
        vec3 cloudColor = vec3(0.065, 0.080, 0.130) + vec3(0.10, 0.13, 0.20) * (cloudNoise * 0.5 + 0.5);
        skyColor = mix(skyColor, cloudColor, cloudAlpha * 0.60);
      }

      // 5. Below Horizon atmospheric haze: seamlessly continues the exact horizon tone into the depths
      if (elevation < 0.0) {
        vec3 cAbyssHaze = vec3(0.008, 0.012, 0.025);
        skyColor = mix(cHorizonSky, cAbyssHaze, clamp(-elevation * 5.0, 0.0, 1.0));
      }

      gl_FragColor = vec4(skyColor, 1.0);
    }
  `,
};

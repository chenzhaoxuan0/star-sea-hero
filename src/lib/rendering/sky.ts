import * as THREE from "three";
import { SkyShader } from "./shaders/skyShader";
import type { QualitySettings } from "./quality";
import {
  chooseMilkyWayLadder,
  loadMilkyWayTexture,
  readNetworkHints,
  shouldClimbToTier,
  type MilkyWayProgress,
} from "./milkyWayTexture";
import type { ConstellationDefinition, HorizonPosition, StarRecord } from "@/types/astronomy";

export type SkyOptions = {
  /** Upper bound reported by the GL implementation, used to cap anisotropy. */
  maxAnisotropy?: number;
  /** Upper bound reported by the GL implementation, used to cap texture size. */
  maxTextureSize?: number;
  onMilkyWayProgress?: (progress: MilkyWayProgress) => void;
};

export type SkyHandle = {
  skyDome: THREE.Mesh;
  starPoints: THREE.Points;
  constellationLines: THREE.LineSegments;
  selectedLines: THREE.LineSegments;
  starPositions: Map<string, THREE.Vector3>;
  update: (elapsed: number) => void;
  updateConstellations: (selectedId: string) => void;
  updateStars: (newStars: Array<StarRecord & { horizon: HorizonPosition }>, selectedId: string) => void;
  updateMilkyWay: (matrix: THREE.Matrix4) => void;
  updateClouds: (density: number, elevation: number, coverage: number, offset?: { x: number; y: number }) => void;
  dispose: () => void;
};

/**
 * Creates the celestial dome, procedural Milky Way nebula, multi-scale twinkling
 * stars, and elegant constellation lines.
 */
export function createSky(
  quality: QualitySettings,
  stars: Array<StarRecord & { horizon: HorizonPosition }> = [],
  constellations: ConstellationDefinition[] = [],
  initialSelectedId = "",
  initialMilkyWayMatrix?: THREE.Matrix4,
  options?: SkyOptions,
): SkyHandle {
  // 1. Sky Dome Mesh with smooth celestial curvature
  const skyGeometry = new THREE.SphereGeometry(500, 64, 48);

  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: SkyShader.vertexShader,
    fragmentShader: SkyShader.fragmentShader,
    uniforms: THREE.UniformsUtils.clone(SkyShader.uniforms),
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });

  // Astrophotography Milky Way panorama, delivered progressively.
  // The smallest encode lands almost immediately so the galaxy is never missing, then
  // each larger encode is bound as it arrives. Nothing here blocks scene construction:
  // the dome renders stars and gradient while the panorama streams in behind them.
  let milkyWayTexture: THREE.Texture | null = null;
  let milkyWayDisposed = false;

  const ladder = chooseMilkyWayLadder({
    viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1920,
    maxTextureSize: options?.maxTextureSize ?? 4096,
    hints: readNetworkHints(),
  });

  const bindMilkyWayTexture = (texture: THREE.Texture) => {
    const previous = milkyWayTexture;
    milkyWayTexture = texture;
    skyMaterial.uniforms.uMilkyWayMap.value = texture;
    previous?.dispose();
  };

  void (async () => {
    // Throughput sample for the rung just finished. Only bandwidth-dominated transfers
    // are usable; shouldClimbToTier ignores anything smaller. Browser-reported link
    // estimates are cold and unreliable at first load, so measured bytes are the only
    // trustworthy input here.
    let sampleBytes = 0;
    let sampleMs = 0;

    for (let index = 0; index < ladder.length; index += 1) {
      if (milkyWayDisposed) return;
      const tier = ladder[index];
      const nextTier = ladder[index + 1];

      if (nextTier && !shouldClimbToTier({ nextTier, bytesSoFar: sampleBytes, msSoFar: sampleMs })) {
        // The link is not delivering fast enough to make the next encode feel like an
        // improvement. Keep what is on screen instead of stalling behind a 7 MB wait.
        return;
      }

      const startedAt = performance.now();
      try {
        const { texture, bytes } = await loadMilkyWayTexture(tier, {
          maxAnisotropy: options?.maxAnisotropy ?? 1,
          onProgress: options?.onMilkyWayProgress,
        });
        if (milkyWayDisposed) {
          texture.dispose();
          return;
        }
        bindMilkyWayTexture(texture);
        // Measure this rung alone. A cumulative rate would be dominated by the latency
        // of the tiny leading encodes and would report a hopelessly slow link.
        sampleBytes = bytes;
        sampleMs = performance.now() - startedAt;
      } catch (error) {
        // A failed tier is not fatal: keep whatever lower-resolution encode is already
        // on screen and stop climbing rather than retrying into a dead end.
        console.warn(`Star Sea: Milky Way ${tier} texture failed to load.`, error);
        return;
      }
    }
  })();

  const milkyWayMatrix = initialMilkyWayMatrix
    ? initialMilkyWayMatrix.clone()
    : new THREE.Matrix4();
  skyMaterial.uniforms.milkyWayMatrix.value.copy(milkyWayMatrix);

  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);

  // 2. Stars Layer (Real catalog + multi-tier faint background stars)
  const positionMap = new Map<string, THREE.Vector3>();

  // Determine total stars based on quality (rich dense starry dome)
  const targetStarCount = Math.max(stars.length + 3200, quality.starLimit * 4);
  const positions = new Float32Array(targetStarCount * 3);
  const colors = new Float32Array(targetStarCount * 3);
  const sizes = new Float32Array(targetStarCount);
  const twinkles = new Float32Array(targetStarCount * 2); // (frequency, phase)
  const isBright = new Float32Array(targetStarCount); // 1.0 for hero stars with spikes

  let starIdx = 0;
  const colorHelper = new THREE.Color();

  // (A) Catalog Stars
  stars.forEach((star) => {
    const vec = new THREE.Vector3(
      star.horizon.vector.x,
      star.horizon.vector.y,
      star.horizon.vector.z,
    );
    vec.normalize().multiplyScalar(420);
    positionMap.set(star.id, vec);

    positions[starIdx * 3] = vec.x;
    positions[starIdx * 3 + 1] = vec.y;
    positions[starIdx * 3 + 2] = vec.z;

    colorHelper.set(star.color);
    colors[starIdx * 3] = colorHelper.r;
    colors[starIdx * 3 + 1] = colorHelper.g;
    colors[starIdx * 3 + 2] = colorHelper.b;

    // Magnitude to size
    const baseSize = Math.max(2.2, 5.2 - star.magnitude * 0.6);
    sizes[starIdx] = baseSize;

    const altitude = Math.max(0.05, vec.y / 420);
    twinkles[starIdx * 2] = 2.0 + (1.0 - altitude) * 4.5;
    twinkles[starIdx * 2 + 1] = Math.random() * Math.PI * 2;

    isBright[starIdx] = star.magnitude < 2.2 ? 1.0 : 0.0;
    starIdx++;
  });

  // (B) Procedural Background & Galactic Arch Stars
  const starPalettes = [
    new THREE.Color("#dbeafe"), // cool diamond blue-white
    new THREE.Color("#ffffff"), // pure white
    new THREE.Color("#fef3c7"), // warm golden
    new THREE.Color("#ede9fe"), // soft lavender
    new THREE.Color("#bfdbfe"), // celestial cyan
    new THREE.Color("#fbcfe8"), // cosmic lilac
  ];

  const invMilkyWay = milkyWayMatrix.clone().invert();
  const galNGP = new THREE.Vector3(-0.86765, -0.19808, 0.45601).normalize();
  const galSgr = new THREE.Vector3(-0.0547, -0.8728, -0.4849).normalize();
  const galCyg = new THREE.Vector3().crossVectors(galNGP, galSgr).normalize();

  while (starIdx < targetStarCount) {
    const vec = new THREE.Vector3();

    // 45% of stars concentrated along the arching galactic plane
    if (Math.random() < 0.48) {
      const galLong = Math.random() * Math.PI * 2;
      const galLat = (Math.random() - 0.5) * 0.38; // close to galactic plane
      const cosB = Math.cos(galLat);
      const sinB = Math.sin(galLat);
      const vJ2000 = new THREE.Vector3()
        .addScaledVector(galSgr, Math.cos(galLong) * cosB)
        .addScaledVector(galCyg, Math.sin(galLong) * cosB)
        .addScaledVector(galNGP, sinB);

      vec.copy(vJ2000).applyMatrix4(invMilkyWay).normalize();
      if (vec.y < 0.005) vec.y = Math.abs(vec.y) + 0.005; // natural celestial dome down to sea level
      vec.normalize().multiplyScalar(418 + (Math.random() - 0.5) * 12);
    } else {
      // Uniform celestial dome
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.98 + 0.005);
      const r = 415 + (Math.random() - 0.5) * 15;
      vec.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    }

    positions[starIdx * 3] = vec.x;
    positions[starIdx * 3 + 1] = vec.y;
    positions[starIdx * 3 + 2] = vec.z;

    const col = starPalettes[Math.floor(Math.random() * starPalettes.length)];
    const dim = 0.55 + Math.random() * 0.45;
    colors[starIdx * 3] = col.r * dim;
    colors[starIdx * 3 + 1] = col.g * dim;
    colors[starIdx * 3 + 2] = col.b * dim;

    sizes[starIdx] = 1.4 + Math.random() * 2.2;

    const altitude = Math.max(0.05, vec.y / 420);
    twinkles[starIdx * 2] = 1.5 + (1.0 - altitude) * 3.5;
    twinkles[starIdx * 2 + 1] = Math.random() * Math.PI * 2;
    isBright[starIdx] = 0.0;

    starIdx++;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  starGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  starGeometry.setAttribute("twinkle", new THREE.BufferAttribute(twinkles, 2));
  starGeometry.setAttribute("isBright", new THREE.BufferAttribute(isBright, 1));

  const starMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      time: { value: 0 },
      pixelRatio: { value: Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2.0) },
    },
    vertexShader: `
      attribute float size;
      attribute vec2 twinkle;
      attribute float isBright;

      uniform float time;
      uniform float pixelRatio;

      varying vec3 vColor;
      varying float vAlpha;
      varying float vIsBright;
      varying float vAltitude;

      void main() {
        vColor = color;
        vIsBright = isBright;
        vAltitude = position.y;

        // Strictly occlude any star below the sea level horizon (position.y <= 0.0)
        // Discard immediately before rasterization by moving outside clip space
        if (position.y <= 0.0) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          return;
        }

        // Twinkle calculation
        float freq = twinkle.x;
        float phase = twinkle.y;
        float tw = 0.75 + 0.25 * sin(time * freq + phase) + 0.12 * cos(time * freq * 1.5 + phase * 0.7);
        vAlpha = clamp(tw, 0.3, 1.3);

        // Soft celestial extinction as stars set into the sea surface (0.0 to 3.5 altitude units)
        float horizonExtinction = smoothstep(0.0, 3.5, position.y);
        vAlpha *= horizonExtinction;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pixelRatio * (vAlpha * 0.3 + 0.7);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vIsBright;
      varying float vAltitude;

      void main() {
        // Discard any star fragment below the water line
        if (vAltitude <= 0.0) discard;

        vec2 p = gl_PointCoord - vec2(0.5);
        float d = length(p);

        if (d > 0.5) discard;

        // Smooth circular antialiased falloff
        float circle = 1.0 - smoothstep(0.28, 0.50, d);
        // Soft glowing gaussian core
        float core = exp(-d * d * 16.0);
        float intensity = core * circle * 1.6;

        // 4-point cross diffraction spikes and radiant halo for bright hero stars
        if (vIsBright > 0.5) {
          float spikeH = max(0.0, 1.0 - abs(p.y) * 16.0) * max(0.0, 1.0 - abs(p.x) * 2.0);
          float spikeV = max(0.0, 1.0 - abs(p.x) * 16.0) * max(0.0, 1.0 - abs(p.y) * 2.0);
          float halo = exp(-d * 3.5) * 0.5;
          intensity += (spikeH + spikeV) * 0.8 + halo;
        }

        vec3 rgb = vColor * intensity * vAlpha;
        gl_FragColor = vec4(rgb, clamp(intensity * vAlpha, 0.0, 1.0));
      }
    `,
  });

  const starPoints = new THREE.Points(starGeometry, starMaterial);

  // 3. Constellation Lines (Pre-allocated Zero-Allocation Buffer with setDrawRange)
  const starById = new Map(stars.map((s) => [s.id, s]));

  // Calculate maximum line segment capacity across all constellations
  const maxSegments = constellations.reduce((sum, c) => sum + c.segments.length, 0);
  const maxFloats = Math.max(maxSegments * 2 * 3, 2400); // 2 vertices per segment, 3 floats per vertex

  const defaultLinesArray = new Float32Array(maxFloats);
  const selectedLinesArray = new Float32Array(maxFloats);

  const defaultLineGeom = new THREE.BufferGeometry();
  const defPosAttr = new THREE.BufferAttribute(defaultLinesArray, 3);
  defPosAttr.setUsage(THREE.DynamicDrawUsage);
  defaultLineGeom.setAttribute("position", defPosAttr);
  const defaultLineMat = new THREE.LineBasicMaterial({
    color: "#7faac9",
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    depthTest: false,
  });
  const constellationLines = new THREE.LineSegments(defaultLineGeom, defaultLineMat);
  constellationLines.frustumCulled = false;

  const selectedLineGeom = new THREE.BufferGeometry();
  const selPosAttr = new THREE.BufferAttribute(selectedLinesArray, 3);
  selPosAttr.setUsage(THREE.DynamicDrawUsage);
  selectedLineGeom.setAttribute("position", selPosAttr);
  const selectedLineMat = new THREE.LineBasicMaterial({
    color: "#00f0ff",
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const selectedLines = new THREE.LineSegments(selectedLineGeom, selectedLineMat);
  selectedLines.frustumCulled = false;
  selectedLines.renderOrder = 100;
  starPoints.renderOrder = 90;
  starPoints.frustumCulled = false;
  constellationLines.renderOrder = 80;

  let currentStars = stars;
  let prevCatalogCount = stars.length;

  // Preallocated shared temporary vectors for line segment calculations (Zero GC allocations)
  const tmpVecFrom = new THREE.Vector3();
  const tmpVecTo = new THREE.Vector3();

  const buildLinePositions = (selectedId: string) => {
    let defFloatIdx = 0;
    let selFloatIdx = 0;

    constellations.forEach((c) => {
      const isSelected = c.id === selectedId;
      c.segments.forEach(([fromId, toId]) => {
        const fromStar = starById.get(fromId);
        const toStar = starById.get(toId);
        if (!fromStar || !toStar) return;

        tmpVecFrom.set(
          fromStar.horizon.vector.x,
          fromStar.horizon.vector.y,
          fromStar.horizon.vector.z,
        ).normalize().multiplyScalar(418);

        tmpVecTo.set(
          toStar.horizon.vector.x,
          toStar.horizon.vector.y,
          toStar.horizon.vector.z,
        ).normalize().multiplyScalar(418);

        // If both stars are below the sea level horizon, omit segment completely
        if (tmpVecFrom.y <= 0.0 && tmpVecTo.y <= 0.0) return;

        // If one star has set into the sea, mathematically clip line segment at sea surface
        if (tmpVecFrom.y <= 0.0) {
          const t = (0.05 - tmpVecFrom.y) / (tmpVecTo.y - tmpVecFrom.y);
          tmpVecFrom.lerp(tmpVecTo, t);
          tmpVecFrom.y = 0.05;
        } else if (tmpVecTo.y <= 0.0) {
          const t = (0.05 - tmpVecTo.y) / (tmpVecFrom.y - tmpVecTo.y);
          tmpVecTo.lerp(tmpVecFrom, t);
          tmpVecTo.y = 0.05;
        }

        if (isSelected) {
          if (selFloatIdx + 6 <= maxFloats) {
            selectedLinesArray[selFloatIdx++] = tmpVecFrom.x;
            selectedLinesArray[selFloatIdx++] = tmpVecFrom.y;
            selectedLinesArray[selFloatIdx++] = tmpVecFrom.z;
            selectedLinesArray[selFloatIdx++] = tmpVecTo.x;
            selectedLinesArray[selFloatIdx++] = tmpVecTo.y;
            selectedLinesArray[selFloatIdx++] = tmpVecTo.z;
          }
        } else {
          if (defFloatIdx + 6 <= maxFloats) {
            defaultLinesArray[defFloatIdx++] = tmpVecFrom.x;
            defaultLinesArray[defFloatIdx++] = tmpVecFrom.y;
            defaultLinesArray[defFloatIdx++] = tmpVecFrom.z;
            defaultLinesArray[defFloatIdx++] = tmpVecTo.x;
            defaultLinesArray[defFloatIdx++] = tmpVecTo.y;
            defaultLinesArray[defFloatIdx++] = tmpVecTo.z;
          }
        }
      });
    });

    defPosAttr.needsUpdate = true;
    defaultLineGeom.setDrawRange(0, defFloatIdx / 3);

    selPosAttr.needsUpdate = true;
    selectedLineGeom.setDrawRange(0, selFloatIdx / 3);
  };

  buildLinePositions(initialSelectedId);

  const updateConstellations = (selectedId: string) => {
    buildLinePositions(selectedId);

    // Highlight selected constellation stars
    const sizeAttr = starGeometry.getAttribute("size") as THREE.BufferAttribute | undefined;
    const isBrightAttr = starGeometry.getAttribute("isBright") as THREE.BufferAttribute | undefined;
    const colorAttr = starGeometry.getAttribute("color") as THREE.BufferAttribute | undefined;
    if (sizeAttr && isBrightAttr && colorAttr) {
      const sizeArr = sizeAttr.array as Float32Array;
      const brightArr = isBrightAttr.array as Float32Array;
      const colorArr = colorAttr.array as Float32Array;
      const selStars = new Set<string>();
      if (selectedId) {
        const con = constellations.find((c) => c.id === selectedId);
        con?.segments.forEach(([a, b]) => {
          selStars.add(a);
          selStars.add(b);
        });
      }
      currentStars.forEach((star, idx) => {
        if (idx >= sizeArr.length) return;
        const baseSize = Math.max(2.2, 5.2 - star.magnitude * 0.6);
        if (selStars.has(star.id)) {
          // Radiant electric cyan highlight pointing out the selected constellation
          colorArr[idx * 3] = 0.05;
          colorArr[idx * 3 + 1] = 0.95;
          colorArr[idx * 3 + 2] = 1.0;
          sizeArr[idx] = Math.max(baseSize * 3.0, 12.0);
          brightArr[idx] = 1.0;
        } else {
          colorHelper.set(star.color);
          colorArr[idx * 3] = colorHelper.r;
          colorArr[idx * 3 + 1] = colorHelper.g;
          colorArr[idx * 3 + 2] = colorHelper.b;
          sizeArr[idx] = baseSize;
          brightArr[idx] = star.magnitude < 2.2 ? 1.0 : 0.0;
        }
      });
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      isBrightAttr.needsUpdate = true;
    }
  };

  const updateStars = (newStars: Array<StarRecord & { horizon: HorizonPosition }>, selectedId: string) => {
    currentStars = newStars;
    starById.clear();
    newStars.forEach((star) => starById.set(star.id, star));

    const posAttr = starGeometry.getAttribute("position") as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const sizeAttr = starGeometry.getAttribute("size") as THREE.BufferAttribute;
    const sizeArray = sizeAttr.array as Float32Array;
    const isBrightAttr = starGeometry.getAttribute("isBright") as THREE.BufferAttribute;
    const isBrightArray = isBrightAttr.array as Float32Array;
    const colorAttr = starGeometry.getAttribute("color") as THREE.BufferAttribute;
    const colorArray = colorAttr.array as Float32Array;

    const selectedStarIds = new Set<string>();
    if (selectedId) {
      const selectedCon = constellations.find((c) => c.id === selectedId);
      selectedCon?.segments.forEach(([a, b]) => {
        selectedStarIds.add(a);
        selectedStarIds.add(b);
      });
    }

    newStars.forEach((star, idx) => {
      if (idx * 3 + 2 >= posArray.length) return;
      let vec = positionMap.get(star.id);
      if (!vec) {
        vec = new THREE.Vector3();
        positionMap.set(star.id, vec);
      }
      vec.set(
        star.horizon.vector.x,
        star.horizon.vector.y,
        star.horizon.vector.z,
      ).normalize().multiplyScalar(420);

      posArray[idx * 3] = vec.x;
      posArray[idx * 3 + 1] = vec.y;
      posArray[idx * 3 + 2] = vec.z;

      const baseSize = Math.max(2.2, 5.2 - star.magnitude * 0.6);
      if (selectedStarIds.has(star.id)) {
        colorArray[idx * 3] = 0.05;
        colorArray[idx * 3 + 1] = 0.95;
        colorArray[idx * 3 + 2] = 1.0;
        sizeArray[idx] = Math.max(baseSize * 3.0, 12.0);
        isBrightArray[idx] = 1.0;
      } else {
        colorHelper.set(star.color);
        colorArray[idx * 3] = colorHelper.r;
        colorArray[idx * 3 + 1] = colorHelper.g;
        colorArray[idx * 3 + 2] = colorHelper.b;
        sizeArray[idx] = baseSize;
        isBrightArray[idx] = star.magnitude < 2.2 ? 1.0 : 0.0;
      }
    });

    // Submerge any stars that were rendered previously but have now dipped below horizon
    for (let i = newStars.length; i < prevCatalogCount; i++) {
      if (i * 3 + 2 < posArray.length) {
        posArray[i * 3 + 1] = -999.0;
        sizeArray[i] = 0.0;
      }
    }
    prevCatalogCount = newStars.length;

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    isBrightAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    updateConstellations(selectedId);
  };

  const updateMilkyWay = (matrix: THREE.Matrix4) => {
    skyMaterial.uniforms.milkyWayMatrix.value.copy(matrix);
  };

  const updateClouds = (
    density: number,
    elevation: number,
    coverage: number,
    offset?: { x: number; y: number },
  ) => {
    skyMaterial.uniforms.uCloudDensity.value = density;
    skyMaterial.uniforms.uCloudElevation.value = elevation;
    skyMaterial.uniforms.uCloudCoverage.value = coverage;
    if (offset) {
      skyMaterial.uniforms.uCloudOffset.value.set(offset.x, offset.y);
    }
  };

  const update = (elapsed: number) => {
    skyMaterial.uniforms.time.value = elapsed;
    starMaterial.uniforms.time.value = elapsed;
  };

  const dispose = () => {
    milkyWayDisposed = true;
    milkyWayTexture?.dispose();
    milkyWayTexture = null;
    skyGeometry.dispose();
    skyMaterial.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    defaultLineGeom.dispose();
    defaultLineMat.dispose();
    selectedLineGeom.dispose();
    selectedLineMat.dispose();
  };

  return {
    skyDome,
    starPoints,
    constellationLines,
    selectedLines,
    starPositions: positionMap,
    update,
    updateConstellations,
    updateStars,
    updateMilkyWay,
    updateClouds,
    dispose,
  };
}

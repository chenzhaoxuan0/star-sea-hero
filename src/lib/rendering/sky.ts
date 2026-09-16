import * as THREE from "three";
import { SkyShader } from "./shaders/skyShader";
import type { QualitySettings } from "./quality";
import type { ConstellationDefinition, HorizonPosition, StarRecord } from "@/types/astronomy";

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

  // Ultra High-Resolution Astrophotography Milky Way Panorama (4K / 8K with 16x Anisotropic Filtering)
  const textureLoader = new THREE.TextureLoader();
  const texturePath =
    quality.starLimit >= 1800
      ? "/textures/milkyway_8k_eq.webp"
      : "/textures/milkyway_4k_eq.webp";
  const milkyWayTexture = textureLoader.load(texturePath);
  milkyWayTexture.wrapS = THREE.RepeatWrapping;
  milkyWayTexture.wrapT = THREE.ClampToEdgeWrapping;
  milkyWayTexture.colorSpace = THREE.SRGBColorSpace;
  milkyWayTexture.generateMipmaps = true;
  milkyWayTexture.minFilter = THREE.LinearMipmapLinearFilter;
  milkyWayTexture.magFilter = THREE.LinearFilter;
  milkyWayTexture.anisotropy = 16;
  skyMaterial.uniforms.uMilkyWayMap.value = milkyWayTexture;

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
      if (vec.y < 0.02) vec.y = Math.abs(vec.y) + 0.05; // keep in upper sky
      vec.normalize().multiplyScalar(418 + (Math.random() - 0.5) * 12);
    } else {
      // Uniform upper celestial dome
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.94 + 0.03);
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

      void main() {
        vColor = color;
        vIsBright = isBright;

        // Twinkle calculation
        float freq = twinkle.x;
        float phase = twinkle.y;
        float tw = 0.75 + 0.25 * sin(time * freq + phase) + 0.12 * cos(time * freq * 1.5 + phase * 0.7);
        vAlpha = clamp(tw, 0.3, 1.3);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pixelRatio * (vAlpha * 0.3 + 0.7);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vIsBright;

      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float d = length(p);

        if (d > 0.5) discard;

        // Smooth circular antialiased falloff
        float circle = 1.0 - smoothstep(0.28, 0.50, d);
        // Soft glowing gaussian core
        float core = exp(-d * d * 16.0);
        float intensity = core * circle * 1.6;

        // 4-point cross diffraction spikes for bright hero stars
        if (vIsBright > 0.5) {
          float spikeH = max(0.0, 1.0 - abs(p.y) * 18.0) * max(0.0, 1.0 - abs(p.x) * 2.2);
          float spikeV = max(0.0, 1.0 - abs(p.x) * 18.0) * max(0.0, 1.0 - abs(p.y) * 2.2);
          intensity += (spikeH + spikeV) * 0.5;
        }

        vec3 rgb = vColor * intensity * vAlpha;
        gl_FragColor = vec4(rgb, clamp(intensity * vAlpha, 0.0, 1.0));
      }
    `,
  });

  const starPoints = new THREE.Points(starGeometry, starMaterial);

  // 3. Constellation Lines
  const starById = new Map(stars.map((s) => [s.id, s]));
  const defaultLines: number[] = [];
  const selectedLinesArray: number[] = [];

  const buildLinePositions = (selectedId: string) => {
    defaultLines.length = 0;
    selectedLinesArray.length = 0;

    constellations.forEach((c) => {
      const isSelected = c.id === selectedId;
      c.segments.forEach(([fromId, toId]) => {
        const fromStar = starById.get(fromId);
        const toStar = starById.get(toId);
        if (!fromStar || !toStar) return;

        const pFrom = new THREE.Vector3(
          fromStar.horizon.vector.x,
          fromStar.horizon.vector.y,
          fromStar.horizon.vector.z,
        ).normalize().multiplyScalar(418);
        const pTo = new THREE.Vector3(
          toStar.horizon.vector.x,
          toStar.horizon.vector.y,
          toStar.horizon.vector.z,
        ).normalize().multiplyScalar(418);

        const target = isSelected ? selectedLinesArray : defaultLines;
        target.push(pFrom.x, pFrom.y, pFrom.z, pTo.x, pTo.y, pTo.z);
      });
    });
  };

  buildLinePositions(initialSelectedId);

  const defaultLineGeom = new THREE.BufferGeometry();
  defaultLineGeom.setAttribute("position", new THREE.Float32BufferAttribute(defaultLines, 3));
  const defaultLineMat = new THREE.LineBasicMaterial({
    color: "#7faac9",
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    depthTest: false,
  });
  const constellationLines = new THREE.LineSegments(defaultLineGeom, defaultLineMat);

  const selectedLineGeom = new THREE.BufferGeometry();
  selectedLineGeom.setAttribute("position", new THREE.Float32BufferAttribute(selectedLinesArray, 3));
  const selectedLineMat = new THREE.LineBasicMaterial({
    color: "#d0f0ff",
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    depthTest: false,
  });
  const selectedLines = new THREE.LineSegments(selectedLineGeom, selectedLineMat);

  const updateConstellations = (selectedId: string) => {
    buildLinePositions(selectedId);
    defaultLineGeom.setAttribute("position", new THREE.Float32BufferAttribute(defaultLines, 3));
    selectedLineGeom.setAttribute("position", new THREE.Float32BufferAttribute(selectedLinesArray, 3));
  };

  const updateStars = (newStars: Array<StarRecord & { horizon: HorizonPosition }>, selectedId: string) => {
    positionMap.clear();
    starById.clear();
    newStars.forEach((star) => starById.set(star.id, star));

    const posAttr = starGeometry.getAttribute("position") as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    newStars.forEach((star, idx) => {
      if (idx * 3 + 2 >= posArray.length) return;
      const vec = new THREE.Vector3(
        star.horizon.vector.x,
        star.horizon.vector.y,
        star.horizon.vector.z,
      ).normalize().multiplyScalar(420);
      positionMap.set(star.id, vec);

      posArray[idx * 3] = vec.x;
      posArray[idx * 3 + 1] = vec.y;
      posArray[idx * 3 + 2] = vec.z;
    });

    posAttr.needsUpdate = true;
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
    milkyWayTexture.dispose();
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

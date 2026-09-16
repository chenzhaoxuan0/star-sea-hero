import * as THREE from "three";
import { OceanShader } from "./shaders/oceanShader";
import type { QualitySettings } from "./quality";

export type OceanHandle = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  setWaveMode: (mode: number) => void;
  updateStarReflections: (stars: Array<{ horizon: { vector: { x: number; y: number; z: number } }; color: string; magnitude: number }>) => void;
  update: (elapsed: number, camera: THREE.Camera) => void;
  dispose: () => void;
};

export function createOcean(quality: QualitySettings): OceanHandle {
  const segments = Math.max(96, quality.oceanSegments);
  const size = 600;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

  const material = new THREE.ShaderMaterial({
    vertexShader: OceanShader.vertexShader,
    fragmentShader: OceanShader.fragmentShader,
    uniforms: THREE.UniformsUtils.clone(OceanShader.uniforms),
    side: THREE.DoubleSide,
    transparent: false,
    depthWrite: true,
    depthTest: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // Lower ocean slightly for expansive celestial dome view
  mesh.position.set(0, -0.85, 0);

  const setWaveMode = (mode: number) => {
    material.uniforms.waveMode.value = mode;
  };

  const tempCol = new THREE.Color();
  const updateStarReflections = (stars: Array<{ horizon?: { vector?: { x: number; y: number; z: number } }; color?: string; magnitude?: number }>) => {
    if (!stars || !Array.isArray(stars)) return;
    const visibleBright = stars
      .filter((s) => s?.horizon?.vector && typeof s.horizon.vector.y === "number" && s.horizon.vector.y > 0.04)
      .sort((a, b) => (a.magnitude ?? 5) - (b.magnitude ?? 5))
      .slice(0, 24);

    const dirArray = material.uniforms.uStarDirs.value as THREE.Vector3[];
    const colArray = material.uniforms.uStarCols.value as THREE.Vector3[];

    visibleBright.forEach((star, idx) => {
      if (!star?.horizon?.vector) return;
      dirArray[idx].set(star.horizon.vector.x, star.horizon.vector.y, star.horizon.vector.z).normalize();
      try {
        tempCol.set(star.color || "#ffffff");
      } catch {
        tempCol.set(0xffffff);
      }
      colArray[idx].set(tempCol.r, tempCol.g, tempCol.b);
    });

    material.uniforms.uStarCount.value = visibleBright.length;
  };

  const update = (elapsed: number, camera: THREE.Camera) => {
    material.uniforms.time.value = elapsed;
    material.uniforms.cameraPos.value.copy(camera.position);
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return {
    mesh,
    material,
    setWaveMode,
    updateStarReflections,
    update,
    dispose,
  };
}

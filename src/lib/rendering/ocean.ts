import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { OceanShader } from "./shaders/oceanShader";
import type { QualitySettings } from "./quality";

export type OceanHandle = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  setWaveMode: (mode: number) => void;
  updateStarReflections?: (stars: Array<{ horizon?: { vector?: { x: number; y: number; z: number } }; color?: string; magnitude?: number }>) => void;
  update: (elapsed: number, camera: THREE.Camera) => void;
  dispose: () => void;
};

export function createOcean(quality: QualitySettings): OceanHandle {
  const size = 6000;
  const geometry = new THREE.PlaneGeometry(size, size);

  const textureResolution = quality.reflectionScale >= 0.7 ? 1024 : 512;

  const reflector = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth: textureResolution,
    textureHeight: textureResolution,
    color: 0xffffff,
    shader: OceanShader,
    multisample: quality.reflectionScale >= 0.7 ? 2 : 0,
  });

  // Rotate horizontal and place at sea level
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(0, -0.85, 0);

  const material = reflector.material as THREE.ShaderMaterial;

  const setWaveMode = (mode: number) => {
    if (material.uniforms.waveMode) {
      material.uniforms.waveMode.value = mode;
    }
  };

  const update = (elapsed: number, camera: THREE.Camera) => {
    if (material.uniforms.time) {
      material.uniforms.time.value = elapsed;
    }
    if (material.uniforms.cameraPos) {
      material.uniforms.cameraPos.value.copy(camera.position);
    }
  };

  const dispose = () => {
    geometry.dispose();
    if (typeof (reflector as unknown as { dispose: () => void }).dispose === "function") {
      (reflector as unknown as { dispose: () => void }).dispose();
    } else {
      material.dispose();
    }
  };

  return {
    mesh: reflector as unknown as THREE.Mesh,
    material,
    setWaveMode,
    update,
    dispose,
  };
}

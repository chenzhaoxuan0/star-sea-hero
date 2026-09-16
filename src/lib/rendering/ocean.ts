import * as THREE from "three";
import { OceanShader } from "./shaders/oceanShader";
import type { QualitySettings } from "./quality";

export type OceanHandle = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
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
  mesh.position.set(0, -0.65, 0);

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
    update,
    dispose,
  };
}

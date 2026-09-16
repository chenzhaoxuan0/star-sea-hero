import * as THREE from "three";
import type { QualitySettings } from "./quality";
import type { ConstellationDefinition, HorizonPosition, StarRecord } from "@/types/astronomy";
import { createSky, type SkyHandle } from "./sky";
import { createOcean, type OceanHandle } from "./ocean";

export type SceneHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  starPositions: Map<string, THREE.Vector3>;
  updateConstellation: (id: string) => void;
  render: (elapsed: number) => void;
  dispose: () => void;
};

export function createScene(
  canvas: HTMLCanvasElement,
  quality: QualitySettings,
  stars: Array<StarRecord & { horizon: HorizonPosition }> = [],
  constellations: ConstellationDefinition[] = [],
  selectedConstellationId = "",
): SceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality.maxPixelRatio > 1,
    alpha: false,
    powerPreference: "high-performance",
  });

  const pixelRatio = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    quality.maxPixelRatio,
  );
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    throw new Error(
      [
        "Star Sea shader compilation failed.",
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#02040a");

  // Perspective camera matching astrophotography composition (~62 deg FOV)
  const aspect = (canvas.clientWidth || window.innerWidth) / Math.max(canvas.clientHeight || window.innerHeight, 1);
  const camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 1200);
  camera.position.set(0, 0, 0);
  // Default look direction: forward towards horizon with subtle upward tilt (sky takes ~65% of screen)
  camera.lookAt(0, 0.12, -1);

  // 1. Sky & Celestial Layer
  const sky: SkyHandle = createSky(quality, stars, constellations, selectedConstellationId);
  scene.add(sky.skyDome);
  scene.add(sky.starPoints);
  scene.add(sky.constellationLines);
  scene.add(sky.selectedLines);

  // 2. Physical Ocean Surface
  const ocean: OceanHandle = createOcean(quality);
  scene.add(ocean.mesh);

  const updateConstellation = (id: string) => {
    sky.updateConstellations(id);
  };

  const render = (elapsed: number) => {
    sky.update(elapsed);
    ocean.update(elapsed, camera);
    renderer.render(scene, camera);
  };

  const dispose = () => {
    sky.dispose();
    ocean.dispose();
    renderer.dispose();
  };

  return {
    scene,
    camera,
    renderer,
    starPositions: sky.starPositions,
    updateConstellation,
    render,
    dispose,
  };
}

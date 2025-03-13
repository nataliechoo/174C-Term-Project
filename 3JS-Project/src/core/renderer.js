import * as THREE from "three";
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import Stats from "three/examples/jsm/libs/stats.module.js";

/**
 * Initialize renderer with enhanced quality settings
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @returns {THREE.WebGLRenderer} Initialized renderer
 */
export function initRenderer(width, height) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(width, height);
  
  // Tone mapping setup
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  
  return renderer;
}

/**
 * Setup HDR environment for scene
 * @param {THREE.Scene} scene - The scene to add environment to
 * @param {THREE.WebGLRenderer} renderer - The renderer to use
 */
// Changed to allow it to be setup at a later point.
export let hdrEnvironmentTexture = null;

export function setupEnvironment(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  
  // expose environment texture for toggling
  return envMap;
}

export let keyLight, fillLight, backLight, capybaraLight;

/**
 * Initialize lighting for scene
 * @param {THREE.Scene} scene - The scene to add lights to
 */
export function initLighting(scene) {
  keyLight = new THREE.DirectionalLight(
    new THREE.Color("hsl(30, 100%, 85%)"),
    2.5
  );
  keyLight.position.set(-100, 100, 100);
  scene.add(keyLight);

  fillLight = new THREE.DirectionalLight(
    new THREE.Color("hsl(240, 100%, 85%)"),
    1.5
  );
  fillLight.position.set(100, 100, 100);
  scene.add(fillLight);

  backLight = new THREE.DirectionalLight(0xffffff, 2.0);
  backLight.position.set(100, 100, -100);
  scene.add(backLight);

  capybaraLight = new THREE.PointLight(0xffff00, 1000, 2000); // Color, intensity, distance, decay
  capybaraLight.position.set(-2700, 1000, -3500); // Position above the sleeping capybara
  scene.add(capybaraLight);

  // Shadow settings
  [keyLight, fillLight, backLight, capybaraLight].forEach(light => {
    light.castShadow = true;
    scene.add(light);
  });

  // Higher quality shadows
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
}

/**
 * Initialize performance stats monitor
 * @returns {Stats} Stats object for monitoring
 */
export function initStats() {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  return stats;
} 
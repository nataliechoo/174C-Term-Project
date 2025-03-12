import * as THREE from 'three';
import { scene } from "../main.js";

export function createGround() {
  const groundSize = 10000;
  const segments = 500;

  const textureLoader = new THREE.TextureLoader();
  
  /*
  * CREDIT FOR TEXTURES:
  * https://3dtextures.me/2020/07/28/stylized-grass-002/
  */

  const colorMap = textureLoader.load('/assets/grassy-ground/Stylized_Grass_002_basecolor.jpg');
  const normalMap = textureLoader.load('/assets/grassy-ground/Stylized_Grass_002_normal.jpg');
  const displacementMap = textureLoader.load('/assets/grassy-ground/Stylized_Grass_002_height.png');
  const roughnessMap = textureLoader.load('/assets/grassy-ground/Stylized_Grass_002_roughness.jpg');
  const aoMap = textureLoader.load('/assets/grassy-ground/Stylized_Grass_002_ambientOcclusion.jpg');

  colorMap.colorSpace = THREE.SRGBColorSpace; // For color data
  normalMap.colorSpace = THREE.NoColorSpace; // For non-color data
  roughnessMap.colorSpace = THREE.NoColorSpace;
  displacementMap.colorSpace = THREE.NoColorSpace;
  aoMap.colorSpace = THREE.NoColorSpace;

  // set wrapping/repeat clearly for all textures
  [colorMap, normalMap, displacementMap, roughnessMap, aoMap].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10,10); // adjust tiling as needed
  });

  const geometry = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);

  // important: AO map requires second UV set (uv2)
  geometry.setAttribute('uv2', geometry.attributes.uv);

  // material using all provided textures
  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    displacementMap: displacementMap,
    displacementScale: 10, // Adjust height clearly here
    roughnessMap: roughnessMap,
    aoMap: aoMap,
    aoMapIntensity: 1.0, // adjust AO intensity as desired
    roughness: 1.0,
    metalness: 0.0,
  });

  const groundMesh = new THREE.Mesh(geometry, material);
  groundMesh.rotation.x = -Math.PI / 2; // rotate to match 3js
  groundMesh.receiveShadow = true;

  groundMesh.position.y += 50;

  scene.add(groundMesh);
}

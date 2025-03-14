import * as THREE from "three";

/**
 * Apply material to teapot mesh
 */
export function applyTeapotMaterial(mesh) {
  // load externals
  const textureLoader = new THREE.TextureLoader();
  const normalMap = textureLoader.load("/assets/teapot/model_0_normal.png");

  // set material properties
  mesh.material.transmission = 1.0; 
  mesh.material.metalness = 1.0; 
  mesh.material.roughness = 0.2; 

  // load color
  mesh.material.Color = textureLoader.load("/assets/teapot/model_0_color.png");

  // apply texture via normal map
  mesh.material.normalMap = normalMap;
  mesh.material.needsUpdate = true;
}

/**
 * Apply material to moon mesh
 */
export function applyMoonMesh(mesh, index) {
  const textureLoader = new THREE.TextureLoader();

  // load textures based on the mesh index
  const colorMap = textureLoader.load(`/assets/moon/model_${index}_color.png`);
  const normalMap = textureLoader.load(`/assets/moon/model_${index}_normal.png`);
  const roughnessMap = textureLoader.load(`/assets/moon/model_${index}_roughness.png`);
  const transmittanceMap = textureLoader.load(`/assets/moon/model_${index}_transmittance.png`);

  // for some reason, the glb refers to it as metallicRoughness despite the womp exporting it as metallic
  const metallicMap = textureLoader.load(`/assets/moon/model_${index}_metallicRoughness.png`);

  // Ensure the material is MeshPhysicalMaterial (supports transmittance)
  if (!(mesh.material instanceof THREE.MeshPhysicalMaterial)) {
    mesh.material = new THREE.MeshPhysicalMaterial();
  }

  // apply the maps
  mesh.material.map = colorMap; 
  mesh.material.metalnessMap = metallicMap;
  mesh.material.normalMap = normalMap; 
  mesh.material.roughnessMap = roughnessMap; 
  // mesh.material.transmissionMap = transmittanceMap; 
  // Temporarily disable transmission and clearcoat for testing
  mesh.material.transmission = 0.0; // no transmission
  mesh.material.clearcoat = 0.0; 
  mesh.material.emissiveIntensity = 1.7; 

  // set material properties
  mesh.material.metalness = 1.0; 
  mesh.material.roughness = 1.0; 
  mesh.material.transmission = 0.5; 

  // Set material properties for translucency and glossiness
  mesh.material.transmission = 1.0; 
  mesh.material.clearcoat = 1.0; 
  mesh.material.clearcoatRoughness = 0.01; 
  mesh.material.ior = 2.5; 

  // Ensure the material updates
  mesh.material.needsUpdate = true;
}

/**
 * Apply material to capybara mesh
 */
export function applyCapybaraMaterial(mesh, index) {
  const textureLoader = new THREE.TextureLoader();

  // load textures based on the mesh index
  const colorMap = textureLoader.load(
    `/assets/capybara/model_${index}_color.png`
  );
  const normalMap = textureLoader.load(
    `/assets/capybara/model_${index}_normal.png`
  );
  const roughnessMap = textureLoader.load(
    `/assets/capybara/model_${index}_roughness.png`
  );
  const transmittanceMap = textureLoader.load(
    `/assets/capybara/model_${index}_transmittance.png`
  );

  // for some reason, the glb refers to it as metallicRoughness despite the womp exporting it as metallic
  const metallicMap = textureLoader.load(
    `/assets/capybara/model_${index}_metallicRoughness.png`
  );

  // Ensure the material is MeshPhysicalMaterial (supports transmittance)
  if (!(mesh.material instanceof THREE.MeshPhysicalMaterial)) {
    mesh.material = new THREE.MeshPhysicalMaterial();
  }

  // apply the maps
  mesh.material.map = colorMap;
  mesh.material.metalnessMap = metallicMap;
  mesh.material.normalMap = normalMap;
  mesh.material.roughnessMap = roughnessMap;
  mesh.material.transmissionMap = transmittanceMap;

  // set material properties
  mesh.material.metalness = 1.0;
  mesh.material.roughness = 1.0;
  mesh.material.transmission = 0.5;

  // make the snot shiny
  if (index === 3) {
    // Set material properties for translucency and glossiness
    mesh.material.transmission = 1.0;
    mesh.material.clearcoat = 1.0;
    mesh.material.clearcoatRoughness = 0.01;
    mesh.material.ior = 2.5;
  }

  // Ensure the material updates
  mesh.material.needsUpdate = true;
} 


export function applySleepingCapybaraMaterial(mesh, index) {
  const textureLoader = new THREE.TextureLoader();

  // load textures based on the mesh index
  const colorMap = textureLoader.load(
    `/assets/capybara-sleeping/model_${index}_color.png`
  );
  const normalMap = textureLoader.load(
    `/assets/capybara-sleeping/model_${index}_normal.png`
  );
  const roughnessMap = textureLoader.load(
    `/assets/capybara-sleeping/model_${index}_roughness.png`
  );
  const transmittanceMap = textureLoader.load(
    `/assets/capybara-sleeping/model_${index}_transmittance.png`
  );

  // for some reason, the glb refers to it as metallicRoughness despite the womp exporting it as metallic
  // const metallicMap = textureLoader.load(
  //   `/assets/capybara-sleeping/model_${index}_metallicRoughness.png`
  // );

  // Ensure the material is MeshPhysicalMaterial (supports transmittance)
  if (!(mesh.material instanceof THREE.MeshPhysicalMaterial)) {
    mesh.material = new THREE.MeshPhysicalMaterial();
  }

  // apply the maps
  mesh.material.map = colorMap;
  // mesh.material.metalnessMap = metallicMap;
  mesh.material.normalMap = normalMap;
  mesh.material.roughnessMap = roughnessMap;
  mesh.material.transmissionMap = transmittanceMap;

  // set material properties
  mesh.material.metalness = 1.0;
  mesh.material.roughness = 1.0;
  mesh.material.transmission = 0.5;

  // make the snot shiny
  if (index === 0) {
    // Set material properties for translucency and glossiness
    mesh.material.transmission = 1.0;
    mesh.material.clearcoat = 1.0;
    mesh.material.clearcoatRoughness = 0.01;
    mesh.material.ior = 2.5;
  }

  // Ensure the material updates
  mesh.material.needsUpdate = true;
} 
import * as THREE from "three";
import { scene } from "../main.js";

// Animation mixers
export let miffyWaveMixer;
export let miffyPickupMixer;
export let miffyHoldingMixer;
export let miffyPutdownMixer;
export let cloudMixer;
export let ovenOpenMixer;
export let doorOpenMixer;

/**
 * Setup Miffy wave animation
 */
export function setupMiffyWave(object, gltf) {
  scene.add(object);
  miffyWaveMixer = new THREE.AnimationMixer(gltf.scene);
  const clips = gltf.animations;
  const waveClip = THREE.AnimationClip.findByName(clips, 'waving');

  const action = miffyWaveMixer.clipAction(waveClip);
  console.log("ANIMATING CLIPS");
  console.log(waveClip);
  action.play(); 
}

/**
 * Setup Miffy pickup animation
 */
export function miffyPickup(object, gltf) {
  scene.add(object);
  miffyPickupMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');

  const action = miffyPickupMixer.clipAction(pickupClip);
  console.log("ANIMATING PICKUP CLIP");
  console.log(pickupClip);
  action.play(); 
}

/**
 * Setup Miffy holding animation
 */
export function miffyHolding(object, gltf) {
  scene.add(object);
  miffyHoldingMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const holdingClip = THREE.AnimationClip.findByName(clips, 'holding');

  const action = miffyHoldingMixer.clipAction(holdingClip);
  console.log("ANIMATING HOLDING CLIP");
  console.log(holdingClip);
  action.play(); 
}

/**
 * Setup Miffy putdown animation
 */
export function miffyPutdown(object, gltf) {
  scene.add(object);
  miffyPutdownMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const putdownClip = THREE.AnimationClip.findByName(clips, 'putdown');

  const action = miffyPutdownMixer.clipAction(putdownClip);
  console.log("ANIMATING PUTDOWN CLIP");
  console.log(putdownClip);
  action.play(); 
}

/**
 * Setup cloud animation
 */
export function cloudAnimation(object, gltf) {
  scene.add(object);
  cloudMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const cloudMovement = THREE.AnimationClip.findByName(clips, 'cloudMovement');

  const action = cloudMixer.clipAction(cloudMovement);
  console.log("ANIMATING CLOUD CLIP");
  console.log(cloudMovement);
  action.play(); 
}

/**
 * Setup oven open animation
 */
export function ovenOpen(object, gltf) {
  scene.add(object);
  ovenOpenMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const open = THREE.AnimationClip.findByName(clips, 'open');

  const action = ovenOpenMixer.clipAction(open);
  console.log("ANIMATING OVEN OPENING CLIP");
  console.log(open);
  action.play(); 
}

/**
 * Setup door open animation
 */
export function doorOpen(object, gltf) {
  scene.add(object);
  doorOpenMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const open = THREE.AnimationClip.findByName(clips, 'open');

  const action = doorOpenMixer.clipAction(open);
  console.log("ANIMATING DOOR OPENING CLIP");
  console.log(open);
  action.play(); 
}

/**
 * Update all animation mixers
 * @param {number} delta - time delta
 */
export function updateAnimations(delta) {
  if (miffyWaveMixer) {
    miffyWaveMixer.update(delta);
  }
  if (miffyPickupMixer) {
    miffyPickupMixer.update(delta);
  }
  if (miffyHoldingMixer) {
    miffyHoldingMixer.update(delta);
  }
  if (miffyPutdownMixer) {
    miffyPutdownMixer.update(delta);
  }  
  if (cloudMixer) {
    cloudMixer.update(delta);
  }
  if (ovenOpenMixer) {
    ovenOpenMixer.update(delta);
  }
  if (doorOpenMixer) {
    doorOpenMixer.update(delta);
  }
} 
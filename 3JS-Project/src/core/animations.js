import * as THREE from "three";
import { scene, animationTiming } from "../main.js";

// Animation mixers
export let miffyWaveMixer;
export let miffyPickupMixer;
export let miffyHoldingMixer;
export let miffyPutdownMixer;
export let cloudMixer;
export let ovenOpenMixer;
export let doorOpenMixer;

export const mixers = [];

/**
 * Setup Miffy wave animation
 */
export function setupMiffyWave(object, gltf) {
  scene.add(object);
  miffyWaveMixer = new THREE.AnimationMixer(gltf.scene);
  mixers.push(miffyWaveMixer);
  const clips = gltf.animations;
  const waveClip = THREE.AnimationClip.findByName(clips, 'waving');

  if (waveClip) {
    const action = miffyWaveMixer.clipAction(waveClip);
    action.setLoop(THREE.LoopRepeat);
    action.stop();
    
    object.userData.waveAction = action;
    object.userData.waveStarted = false;
    console.log("Cashier Miffy wave animation ready");
  } else {
    console.warn("Waving animation not found for Cashier Miffy");
  }
}

/**
 * Setup Miffy pickup animation
 */
export function miffyPickup(object, gltf) {
  scene.add(object);
  miffyPickupMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');


  if (pickupClip) {
    const action = miffyPickupMixer.clipAction(pickupClip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
    // console.log("Barista Miffy is picking up!");

    // Attach tray to Miffy's hand
    setTimeout(() => {
      const handBone = object.getObjectByName("hand_r"); // Adjust based on your model
      if (handBone && trayObject) {
        handBone.add(trayObject);
        trayObject.position.set(0, 10, 0); // Adjust tray position relative to hand
        console.log("Tray attached to Miffy's hand!");
      }
    }, 500); // Delay to match pickup timing
  }
}

/**
 * Setup Miffy pickup and putdown for barista
 */
export function miffyBarista(object, gltf) {
  scene.add(object);
  miffyPickupMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;

  // Find animations
  const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');
  const putdownClip = THREE.AnimationClip.findByName(clips, 'putdown');

  if (pickupClip && putdownClip) {
    const pickupAction = miffyPickupMixer.clipAction(pickupClip);
    pickupAction.setLoop(THREE.LoopOnce);
    pickupAction.clampWhenFinished = true;
    pickupAction.play();
    console.log("Barista Miffy is picking up!");

  } else {
    console.warn("Pickup or Putdown animation not found for Barista Miffy");
  }
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

export function updateAnimations(delta, elapsedTime) {
  [
    miffyWaveMixer,
    miffyPickupMixer,
    miffyHoldingMixer,
    miffyPutdownMixer,
    ovenOpenMixer,
    doorOpenMixer,
    ...mixers
  ].forEach(mixer => {
    if (mixer) mixer.update(delta);
  });

  // Capybara movement logic with bobbing
  const capybara = scene.getObjectByName("capybara");
  const miffy = scene.getObjectByName("cashier-miffy");

  if (capybara?.userData?.targetPosition) {
    const { 
      sequenceStartOffset, // Seconds after animation sequence starts
      duration, 
      startPosition, 
      targetPosition 
    } = capybara.userData;

    // Get time since animation sequence began
    const sequenceTime = elapsedTime - animationTiming.BEGIN_ANIMATION_SEQUENCE;

    // Debugging Logs
    console.log("🔍 Capybara Movement Debug:");
    console.log("Elapsed Time:", elapsedTime);
    console.log("BEGIN_ANIMATION_SEQUENCE:", animationTiming.BEGIN_ANIMATION_SEQUENCE);
    console.log("Sequence Time:", sequenceTime);
    console.log("Sequence Start Offset:", sequenceStartOffset);
    console.log("Capybara Target Position:", targetPosition);
    console.log("Capybara Start Position:", startPosition);

    if (sequenceTime >= sequenceStartOffset) {
      const progress = Math.min(
        (sequenceTime - sequenceStartOffset) / duration, 
        1
      );

      console.log("Capybara Progress:", progress);

      // Calculate new position
      const newX = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, progress);
      const newZ = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, progress);

      // Bobbing effect
      let newY;
      if (progress < 1) {
        const bobHeight = 5;
        const bobFrequency = 10;
        const bobOffset = Math.sin(elapsedTime * bobFrequency) * bobHeight;
        newY = THREE.MathUtils.lerp(startPosition.y, targetPosition.y, progress) + bobOffset;
      } else {
        newY = targetPosition.y;
      }

      console.log(`Capybara Moving to: (${newX}, ${newY}, ${newZ})`);
      capybara.position.set(newX, newY, newZ);

      // Control Miffy's waving
      if (miffy?.userData?.waveAction) {
        if (progress > 0 && progress < 1 && !miffy.userData.waveStarted) {
          miffy.userData.waveAction.play();
          miffy.userData.waveStarted = true;
        } else if (progress === 1 && miffy.userData.waveStarted) {
          miffy.userData.waveAction.stop();
          miffy.userData.waveStarted = false;
        }
      }
    }
  }
}



export function configureCapybaraMovement(capybara, config) {
  capybara.userData.startPosition = config.startPosition;
  capybara.userData.targetPosition = config.targetPosition;
  capybara.userData.sequenceStartOffset = config.sequenceStartOffset; // Seconds after sequence start
  capybara.userData.duration = config.duration;
}

export function configureMiffyWave(miffy, config) {
  miffy.userData.waveDelay = config.delay;
}
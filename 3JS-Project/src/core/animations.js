import * as THREE from "three";
import { scene, animationTiming } from "../main.js";
import { trayObject } from "./models.js";

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
  const mixer = new THREE.AnimationMixer(object);
  mixers.push(mixer); 

  const clips = gltf.animations;
  const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');
  const putdownClip = THREE.AnimationClip.findByName(clips, 'putdown');

  if (pickupClip && putdownClip) {
    const pickupAction = mixer.clipAction(pickupClip);
    const putdownAction = mixer.clipAction(putdownClip);

    pickupAction.setLoop(THREE.LoopOnce);
    putdownAction.setLoop(THREE.LoopOnce);
    pickupAction.clampWhenFinished = true;
    putdownAction.clampWhenFinished = true;

    object.userData.pickupAction = pickupAction;
    object.userData.putdownAction = putdownAction;

    mixer.addEventListener('loop', (e) => {
      if (e.action === pickupAction && trayObject) {
        // Attach tray when pickup animation starts
        const handBone = object.getObjectByName("BoneR"); 
        if (handBone) {
          handBone.add(trayObject);
          trayObject.position.set(0, 10, 0); 
          console.log("Tray attached to Miffy's hand!");
        }
      }
    });
    
    mixer.addEventListener('finished', (e) => {
      if (e.action === putdownAction && trayObject) {
        if (trayObject.parent) {
          scene.attach(trayObject); 
          trayObject.position.set(-380, 260, -500); 
          trayObject.rotation.set(0, Math.PI * 16, 0);
          trayObject.scale.set(1.5, 1.5, 1.5);
          console.log("Tray placed at final position!");
    
          const croissant = scene.getObjectByName("croissant");
          const donut = scene.getObjectByName("donut");
    
          if (croissant && croissant.parent !== trayObject) {
            trayObject.add(croissant);
            croissant.position.set(0, 20, -10);
            croissant.rotation.set(0, Math.PI / 3, 0);
            croissant.scale.set(1.0, 1.0, 1.0);
            console.log("Re-parented croissant to tray");
          }
          if (donut && donut.parent !== trayObject) {
            trayObject.add(donut);
            donut.position.set(0, 5, 30);
            donut.rotation.set(0, Math.PI / 3, 0); 
            donut.scale.set(1.0, 1.0, 1.0); 
            console.log("Re-parented donut to tray");
          }
        }
      }
    });

    pickupAction.clampWhenFinished = true;
    mixer.addEventListener('finished', (e) => {
      if (e.action === pickupAction) {
        putdownAction.play(); 
      }
    });
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

export function capySleep(object, gltf) {
  scene.add(object);
  capySleepMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const sleep = THREE.AnimationClip.findByName(clips, 'sleeping');

  const action = capySleepMixer.clipAction(sleep);
  console.log("ANIMATING SLEEPING CLIP");
  console.log(sleep);
  action.play();
}

export function floating(object, gltf) {
  scene.add(object);
  bubbleMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const floating = THREE.AnimationClip.findByName(clips, 'float');

  const action = bubbleMixer.clipAction(floating);
  console.log("ANIMATING FLOATING CLIP");
  console.log(floating);
  action.play();
}


export function updateAnimations(delta, elapsedTime) {
  [miffyWaveMixer, miffyPickupMixer, miffyHoldingMixer, miffyPutdownMixer, ovenOpenMixer, doorOpenMixer, ...mixers]
    .forEach(mixer => mixer?.update(delta));

  // Capybara movement logic
  const capybara = scene.getObjectByName("capybara");
  const miffy = scene.getObjectByName("cashier-miffy");

  if (capybara?.userData?.targetPosition && animationTiming.BEGIN_ANIMATION_SEQUENCE !== null) {
    const { sequenceStartOffset, duration, startPosition, targetPosition } = capybara.userData;
    const sequenceTime = elapsedTime - animationTiming.BEGIN_ANIMATION_SEQUENCE;

    // Debugging Logs
    // console.log("🔍 Capybara Movement Debug:");
    // console.log("Elapsed Time:", elapsedTime);
    // console.log("BEGIN_ANIMATION_SEQUENCE:", animationTiming.BEGIN_ANIMATION_SEQUENCE);
    // console.log("Sequence Time:", sequenceTime);
    // console.log("Sequence Start Offset:", sequenceStartOffset);
    // console.log("Capybara Target Position:", targetPosition);
    // console.log("Capybara Start Position:", startPosition);

    if (sequenceTime >= sequenceStartOffset) {
      const progress = Math.min((sequenceTime - sequenceStartOffset) / duration, 1);
      const newX = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, progress);
      const newZ = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, progress);
      const newY = progress < 1 ? THREE.MathUtils.lerp(startPosition.y, targetPosition.y, progress) + Math.sin(elapsedTime * 10) * 5 : targetPosition.y;

      capybara.position.set(newX, newY, newZ);

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

  // Barista rotation and put down logic
  const barista = scene.getObjectByName("barista-miffy");
  if (capybara?.userData?.targetPosition && animationTiming.BEGIN_ANIMATION_SEQUENCE !== null) {
    const sequenceTime = elapsedTime - animationTiming.BEGIN_ANIMATION_SEQUENCE;

    if (sequenceTime >= capybara.userData.sequenceStartOffset + capybara.userData.duration && barista && !barista.userData.rotationDone) {
      barista.userData.rotationDone = true;
      barista.userData.initialYRotation = barista.rotation.y;
      barista.userData.targetYRotation = barista.rotation.y + Math.PI;
      barista.userData.rotationStartTime = elapsedTime;
      barista.userData.rotationDuration = 2;
    }

    if (barista?.userData.rotationStartTime) {
      const rotationProgress = Math.min((elapsedTime - barista.userData.rotationStartTime) / barista.userData.rotationDuration, 1);
      barista.rotation.y = THREE.MathUtils.lerp(barista.userData.initialYRotation, barista.userData.targetYRotation, rotationProgress);

      if (rotationProgress === 1 && !barista.userData.rotationPaused) {
        barista.userData.rotationPaused = true;
        setTimeout(() => {
          if (!barista.userData.pickupDone && barista.userData.pickupAction) {
            barista.userData.pickupAction.play();
            barista.userData.pickupDone = true;

            barista.userData.pickupAction.getMixer().addEventListener("finished", () => {
              barista.userData.secondRotationDone = true;
              barista.userData.secondInitialYRotation = barista.rotation.y;
              barista.userData.secondTargetYRotation = barista.userData.initialYRotation;
              barista.userData.secondRotationStartTime = elapsedTime;
              barista.userData.secondRotationDuration = 2;

              setTimeout(() => {
                if (barista.userData.putdownAction) barista.userData.putdownAction.play();
              }, barista.userData.secondRotationDuration * 1000);
            });
          }
          barista.userData.rotationPaused = false;
        }, 2000);
      }

      if (barista?.userData.secondRotationStartTime) {
        const secondRotationProgress = Math.min((elapsedTime - barista.userData.secondRotationStartTime) / barista.userData.secondRotationDuration, 1);
        barista.rotation.y = THREE.MathUtils.lerp(barista.userData.secondInitialYRotation, barista.userData.secondTargetYRotation, secondRotationProgress);

        if (secondRotationProgress === 1) {
          barista.userData.rotationDone = false;
          barista.userData.secondRotationDone = false;
        }
      }
    }
  }
}

/**
 * Configure Capybara movement
 */
export function configureCapybaraMovement(capybara, config) {
  capybara.userData.startPosition = config.startPosition;
  capybara.userData.targetPosition = config.targetPosition;
  capybara.userData.sequenceStartOffset = config.sequenceStartOffset;
  capybara.userData.duration = config.duration;
}

/**
 * Configure Miffy wave
 */
export function configureMiffyWave(miffy, config) {
  miffy.userData.waveDelay = config.delay;
}
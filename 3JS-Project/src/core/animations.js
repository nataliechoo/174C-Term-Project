import * as THREE from "three";
import { scene, animationTiming } from "../main.js";
import { trayObject } from "./models.js";
import { cameraMode } from "./camera.js";

// Add reference to fetch croissant baker from main
let croissantBaker = null;

// Animation mixers
export let miffyWaveMixer;
export let miffyPickupMixer;
export let miffyHoldingMixer;
export let miffyPutdownMixer;
export let cloudMixer;
export let ovenOpenMixer;
export let doorOpenMixer;
export let capySleepMixer;
export let bubbleMixer;

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
          
          // Ensure the croissant is always attached to the tray
          const croissant = scene.getObjectByName("croissant");
          if (croissant) {
            trayObject.add(croissant);
            croissant.position.set(0, 5, 0); // Adjust relative to tray
            console.log("Croissant attached to tray!");
          }
        }
      }
    });
    
    mixer.addEventListener('finished', (e) => {
      if (e.action === putdownAction && trayObject) {
        if (trayObject.parent) {
          const croissant = scene.getObjectByName("croissant");
          if (croissant) {
            trayObject.add(croissant);
            croissant.position.set(0, 5, 0);
          }
    
          scene.attach(trayObject);
          trayObject.position.set(-380, 260, -500);
          trayObject.rotation.set(0, Math.PI * 16, 0);
          trayObject.scale.set(1.5, 1.5, 1.5);
          console.log("Tray placed at final position!");
    
          if (croissant) {
            trayObject.add(croissant);
            croissant.position.set(0, 5, 0);
            console.log("Croissant re-attached to tray!");
          }
        }
      }
    });
    
    
    mixer.addEventListener('finished', (e) => {
      if (e.action === putdownAction && trayObject) {
        if (trayObject.parent) {
          const croissant = scene.getObjectByName("croissant");
          if (croissant && croissant.parent === trayObject) {
            scene.attach(croissant);
            
            const worldPos = new THREE.Vector3();
            croissant.getWorldPosition(worldPos);
            croissant.userData.originalWorldPosition = worldPos.clone();
            
            if (croissantBaker && !croissantBaker.userData?.bakingStarted) {
              console.log("Starting croissant baking early in the animation sequence");
              croissantBaker.userData = croissantBaker.userData || {};
              croissantBaker.userData.bakingStarted = true;
              croissantBaker.userData.isAnimationSequence = true;
              
              croissantBaker.startBakingSequence(() => {
                console.log("Croissant baking completed from animation");
                
                // The croissant is already on the tray now, no need to re-attach it
                // Just make sure it's visible and fully "done"
                const croissant = scene.getObjectByName("croissant");
                if (croissant) {
                  // Ensure the croissant is visible
                  croissant.visible = true;
                  console.log("Baking sequence completed - croissant should be visible on tray");
                }
              });
            }
          }
          
          // Now place the tray at its final position
          scene.attach(trayObject); 
          trayObject.position.set(-380, 260, -500); 
          trayObject.rotation.set(0, Math.PI * 16, 0);
          trayObject.scale.set(1.5, 1.5, 1.5);
          console.log("Tray placed at final position!");
    
          // Keep donut on the tray
          const donut = scene.getObjectByName("donut");
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
  const openClip = THREE.AnimationClip.findByName(clips, 'open');

  if (openClip) {
    const action = ovenOpenMixer.clipAction(openClip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play(); // Open the oven immediately

    object.userData.ovenAction = action;
    object.userData.ovenOpened = true;
    object.userData.ovenClosedAfterBaking = false;

    // Ensure the oven stays open and only closes when the croissant is inside
    setTimeout(() => {
      const croissant = scene.getObjectByName("croissant");
      if (croissant && croissant.parent === object) {
        action.timeScale = -1; // Play backward (close)
        action.reset().play();
        object.userData.ovenClosedAfterBaking = true;
      } else {
      }
    }, 3000); // Adjust the timing if needed
  } else {
  }
}


/**
 * Setup door open animation
 */
export function doorOpen(object, gltf) {
  scene.add(object);
  doorOpenMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const openClip = THREE.AnimationClip.findByName(clips, 'open');

  if (openClip) {
    const action = doorOpenMixer.clipAction(openClip);
    action.setLoop(THREE.LoopOnce); 
    action.clampWhenFinished = true; 
    action.paused = true;

    object.userData.doorAction = action;
    object.userData.doorMixer = doorOpenMixer;
    object.userData.doorOpenProgress = 0; 
    object.userData.doorClosing = false;

    console.log("Door animation ready");
  } else {
    console.warn("Door open animation not found");
  }
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

// Add a function to set the croissant baker reference
export function setCroissantBaker(baker) {
  croissantBaker = baker;
  console.log("Croissant baker reference set in animations.js");
}

export function updateAnimations(delta, elapsedTime) {
  if (delta === 0) {
      delta = 1 / 60; // Assume ~60 FPS if time is stuck
  }

  if (animationTiming.BEGIN_ANIMATION_SEQUENCE === Infinity) {
      return;
  }

  [miffyWaveMixer, miffyPickupMixer, miffyHoldingMixer, miffyPutdownMixer, 
   ovenOpenMixer, doorOpenMixer, capySleepMixer, bubbleMixer, ...mixers]
    .forEach(mixer => mixer?.update(delta));

  // Capybara movement logic
  const capybara = scene.getObjectByName("capybara");
  const miffy = scene.getObjectByName("cashier-miffy");
  const croissant = scene.getObjectByName("croissant");
  const oven = scene.getObjectByName("oven");
  const tray = scene.getObjectByName("tray");

  if (oven?.userData?.ovenAction && tray) {
      const ovenAction = oven.userData.ovenAction;
      if (!oven.userData.ovenOpenedForBaking) {
          ovenAction.timeScale = 1;
          ovenAction.reset().play();
          oven.userData.ovenOpenedForBaking = true;
          oven.userData.ovenClosedAfterBaking = false;
      }

      const trayFinalPosition = new THREE.Vector3(-380, 260, -500);
      if (!oven.userData.ovenClosedAfterBaking && tray.position.equals(trayFinalPosition)) {
          setTimeout(() => {
              ovenAction.timeScale = -1;
              ovenAction.reset().play();
              oven.userData.ovenClosedAfterBaking = true;
          }, 800);
      }
  }

  if (capybara?.userData?.targetPosition && animationTiming.BEGIN_ANIMATION_SEQUENCE !== null) {
      const { sequenceStartOffset, duration, startPosition, targetPosition } = capybara.userData;
      const sequenceTime = elapsedTime - animationTiming.BEGIN_ANIMATION_SEQUENCE;

      // First movement logic
      if (!capybara.userData.startedSecondMove) {
        if (sequenceTime >= sequenceStartOffset) {
          const progress = Math.min((sequenceTime - sequenceStartOffset) / duration, 1);
          const newX = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, progress);
          const newZ = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, progress);
          const newY = progress < 1 ? 
            THREE.MathUtils.lerp(startPosition.y, targetPosition.y, progress) + Math.sin(elapsedTime * 10) * 5 : 
            targetPosition.y;

          capybara.position.set(newX, newY, newZ);

          // **Rotate Capybara to Face Movement**
          if (progress > 0) {
              const direction = new THREE.Vector3().subVectors(targetPosition, startPosition).normalize();
              capybara.rotation.y = Math.atan2(direction.x, direction.z) - Math.PI / 2;
          }

          if (progress === 1 && !capybara.userData.reachedCashRegister) {
            capybara.userData.reachedCashRegister = true;
            capybara.userData.pauseStartTime = elapsedTime;
            console.log("Capybara reached the cash register. Waiting to move to the stool...");
          }

          // Wave logic for Miffy
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

      // Second movement logic
      if (capybara.userData.reachedCashRegister && !capybara.userData.startedSecondMove && elapsedTime - capybara.userData.pauseStartTime > 5) {
        console.log("Capybara waited 5 seconds. Moving to the stool...");
        capybara.userData.startedSecondMove = true;
        capybara.userData.secondStartTime = elapsedTime;
        capybara.userData.startPosition = capybara.position.clone();
      }

      if (capybara.userData.startedSecondMove && !capybara.userData.finishedMoving) {
        const secondMoveProgress = Math.min((elapsedTime - capybara.userData.secondStartTime) / capybara.userData.secondDuration, 1);
        const newX = THREE.MathUtils.lerp(capybara.userData.startPosition.x, capybara.userData.stoolPosition.x, secondMoveProgress);
        const newZ = THREE.MathUtils.lerp(capybara.userData.startPosition.z, capybara.userData.stoolPosition.z, secondMoveProgress);
        const newY = capybara.userData.stoolPosition.y + (secondMoveProgress < 1 ? Math.sin(elapsedTime * 10) * 5 : 0);

        capybara.position.set(newX, newY, newZ);

        // **Rotate Capybara to Face Movement**
        if (secondMoveProgress > 0) {
            const direction = new THREE.Vector3().subVectors(capybara.userData.stoolPosition, capybara.userData.startPosition).normalize();
            capybara.rotation.y = Math.atan2(direction.x, direction.z) - Math.PI / 2;
        }

        if (secondMoveProgress === 1) {
          console.log("Capybara is now sitting on the chair.");
          capybara.userData.finishedMoving = true;
          capybara.position.copy(capybara.userData.stoolPosition);
        }
      }
    }

  // Barista rotation logic
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

      if (barista?.userData.rotationStartTime && !barista.userData.rotationPaused) {
          const rotationProgress = Math.min((elapsedTime - barista.userData.rotationStartTime) / barista.userData.rotationDuration, 1);
          barista.rotation.y = THREE.MathUtils.lerp(barista.userData.initialYRotation, barista.userData.targetYRotation, rotationProgress);

          if (rotationProgress === 1) {
              barista.userData.rotationPaused = true;

              setTimeout(() => {
                  if (!barista.userData.pickupDone && barista.userData.pickupAction) {
                      barista.userData.pickupAction.reset().play();
                      barista.userData.pickupDone = true;

                      barista.userData.pickupAction.getMixer().addEventListener("finished", () => {
                          barista.userData.secondRotationDone = true;
                          barista.userData.secondInitialYRotation = barista.rotation.y;
                          barista.userData.secondTargetYRotation = barista.userData.initialYRotation;
                          barista.userData.secondRotationStartTime = elapsedTime;
                          barista.userData.secondRotationDuration = 2;
                      });
                  }
              }, 2000);
          }
      }

      if (barista?.userData.secondRotationStartTime) {
          const secondRotationProgress = Math.min((elapsedTime - barista.userData.secondRotationStartTime) / barista.userData.secondRotationDuration, 1);
          barista.rotation.y = THREE.MathUtils.lerp(barista.userData.secondInitialYRotation, barista.userData.secondTargetYRotation, secondRotationProgress);

          if (secondRotationProgress === 1) {
              barista.userData.rotationDone = false;
              barista.userData.secondRotationDone = false;
              barista.userData.rotationPaused = false;
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
  
  // FIX: Ensure stool position is set
  capybara.userData.stoolPosition = config.stoolPosition;
  capybara.userData.secondDuration = config.secondDuration;
}


/**
 * Configure Miffy wave
 */
export function configureMiffyWave(miffy, config) {
  miffy.userData.waveDelay = config.delay;
}
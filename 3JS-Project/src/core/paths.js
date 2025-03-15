import * as THREE from "three";
import { bspline_interpolate } from "./b-spline.js";
import { animationTiming, scene } from "../main.js";
import { starObject } from "./models.js";

let starLight;

// Initialize star point light once
export function initStarLight() {
  starLight = new THREE.PointLight(0xffff00, 50000, 8000, 2); 
  starLight.castShadow = true; 
  starLight.shadow.mapSize.width = 2048; // lower if laggy
  starLight.shadow.mapSize.height = 2048;
  starLight.shadow.camera.near = 1;
  starLight.shadow.camera.far = 5000;
  
  scene.add(starLight);
}

// Camera path control points
export const cameraControlPoints = [
  [950, 600, -2550],
  [950, 600, -2550],
  [800, 500, -750],
  [650, 500, 1000],
  [250, 500, 1850],
  [-150, 500, 1850], // this is where we pause to look at the sign?
  [-500, 500, 1300],
  [-500, 550, 500],
  [-500, 600, 200],
  [-200, 650, 0],
  [200, 700, 500],
  [200, 700, 500],
];

// Star animation path control points
export const starControlPoints = [
  [750, 400, -3150],
  [750, 400, -3150],
  [300, 500, -3500],
  [0, 500, -3750],
  [-200, 600, -4000],
  [-300, 650, -4250],
  [-100, 675, -4400],
  [800, 675, -4250],
  [800, 675, -4250]
];

// B-spline parameters
export const splineDegree = 2;
export const starSplineDegree = 2;

/**
 * Initialize B-spline visualization
 */
export function initSplinePaths() {
  // Create visual markers for camera control points
  cameraControlPoints.forEach(point => {
    const sphereGeometry = new THREE.SphereGeometry(10, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(point[0], point[1], point[2]);
    scene.add(sphere); // comment to disable visual
  });

  // Create camera path line
  const numCurvePoints = 100;
  const curvePoints = [];

  // Sample camera curve t = [0,1]
  for (let i = 0; i <= numCurvePoints; i++) {
    let t = i / numCurvePoints;
    const point = bspline_interpolate(t, splineDegree, cameraControlPoints);
    curvePoints.push(new THREE.Vector3(point[0], point[1], point[2]));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const curveLine = new THREE.Line(geometry, material);
  scene.add(curveLine); // comment to disable visual

  // Create visual markers for star control points
  starControlPoints.forEach(point => {
    const starSphereGeometry = new THREE.SphereGeometry(10, 16, 16);
    const starSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const starSphere = new THREE.Mesh(starSphereGeometry, starSphereMaterial);
    starSphere.position.set(point[0], point[1], point[2]);
    scene.add(starSphere); // comment to disable visual
  });

  // Create star path line
  const starNumCurvePoints = 100;
  const starCurvePoints = [];

  // Sample star curve t = [0,1]
  for (let i = 0; i <= starNumCurvePoints; i++) {
    let t = i / starNumCurvePoints;
    const point = bspline_interpolate(t, starSplineDegree, starControlPoints);
    starCurvePoints.push(new THREE.Vector3(point[0], point[1], point[2]));
  }

  const starGeometry = new THREE.BufferGeometry().setFromPoints(starCurvePoints);
  const starMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff });
  const starCurveLine = new THREE.Line(starGeometry, starMaterial);
  scene.add(starCurveLine); // comment to disable visual

  console.log("Spline and control points added to scene");
}

/**
 * Update camera position along B-spline path
 * @param {THREE.Camera} camera - Camera to move along path
 * @param {number} elapsedTime - Elapsed time
 */
export function updateCameraPath(camera, elapsedTime) {
  const duration = 7; // Duration for full traversal along spline
  const finalSplinePoint = cameraControlPoints[cameraControlPoints.length - 2]; // Last REAL control point

  let t = elapsedTime / duration;

  if (t >= 1) {
      // Camera has reached end of spline
      camera.position.set(finalSplinePoint[0], finalSplinePoint[1], finalSplinePoint[2]);

      // Check if lerp has already been completed
      if (!camera.userData.lerpCompleted) {
          const capybara = scene.getObjectByName("capybara");
          if (capybara) {
              const capybaraWorldPosition = new THREE.Vector3();
              capybara.getWorldPosition(capybaraWorldPosition);

              // Store initial look-at position for lerping
              if (!camera.userData.initialLookAt) {
                  camera.userData.initialLookAt = new THREE.Vector3().copy(camera.getWorldDirection(new THREE.Vector3()));
                  camera.userData.lerpStartTime = elapsedTime;
              }

              const lerpDuration = 2; // Duration of lerp in seconds
              const progress = Math.min((elapsedTime - camera.userData.lerpStartTime) / lerpDuration, 1);

              const interpolatedLookAt = new THREE.Vector3().lerpVectors(
                  camera.userData.initialLookAt,
                  capybaraWorldPosition,
                  progress
              );

              camera.lookAt(interpolatedLookAt);

              // Mark lerp as completed once progress reaches 1
              if (progress === 1) {
                  camera.userData.lerpCompleted = true;
                  console.log("Lerp completed: Camera now looking at capybara.");
              }
          }
      }
  } else {
      // Normal spline movement
      const pos = bspline_interpolate(t, splineDegree, cameraControlPoints);
      camera.position.set(pos[0], pos[1], pos[2]);

      // Regular look-ahead along spline
      const lookAheadOffset = 0.1;
      let nextT = Math.min(t + lookAheadOffset, 1.0);
      const nextPos = bspline_interpolate(nextT, splineDegree, cameraControlPoints);
      camera.lookAt(new THREE.Vector3(nextPos[0], nextPos[1], nextPos[2]));
  }
}

/**
 * Update star position along B-spline path
 * @param {number} elapsedTime - Elapsed time
 */
export function updateStarPath(elapsedTime) {
  if (!starObject || !starLight) return;
  const capySleepDuration = 7.5;
  // Before BEGIN_ANIMATION_SEQUENCE starts, keep star at the first control point
  // hard coding condition until capybara scene finishes to begin movement.
  if (animationTiming.BEGIN_ANIMATION_SEQUENCE === Infinity || (elapsedTime - animationTiming.BEGIN_ANIMATION_SEQUENCE < capySleepDuration)) {
    const startPoint = starControlPoints[0];
    starObject.position.set(startPoint[0], startPoint[1] - 100, startPoint[2]);
    starLight.position.set(startPoint[0], startPoint[1] + 400, startPoint[2]); // Adjust light position
    return;
  } 

  // After BEGIN_ANIMATION_SEQUENCE starts, move star along spline
  const adjustedElapsedTime = elapsedTime - (animationTiming.BEGIN_ANIMATION_SEQUENCE + capySleepDuration);
  const starDuration = 7; // Adjust duration to control star speed
  let starT = (adjustedElapsedTime % starDuration) / starDuration;

  const starPos = bspline_interpolate(starT, starSplineDegree, starControlPoints);

  // Move the star with Y offset of -100
  starObject.position.set(starPos[0], starPos[1] - 100, starPos[2]);
  starLight.position.set(starPos[0], starPos[1] + 400, starPos[2]); // Update light position to match star's position
  // Add slow rotation to the star
  const rotationSpeedX = 0.008; // Rotation speed around X-axis

  starObject.rotation.x += rotationSpeedX; // Rotate around the Y-axis
} 


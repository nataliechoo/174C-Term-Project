import * as THREE from "three";
import { SpringMassDebugger, SpringMassSystem } from "./SpringMassSystem.js";

// Default physics parameters
const DEFAULT_SPRING_CONSTANT = 50;
const DEFAULT_DAMPING_CONSTANT = 20;
const DEFAULT_PARTICLE_MASS = 1;
const DEFAULT_BOTTOM_MASS_MULTIPLIER = 3;

// Default wind parameters
const DEFAULT_WIND_STRENGTH = 5;
const DEFAULT_WIND_FREQUENCY = 0.2;

// Default rotation limit parameters
const DEFAULT_MAX_ROTATION_ANGLE = Math.PI / 6; // 30 degrees

export class SignPhysics {
  constructor(scene) {
    this.scene = scene;
    this.physics = new SpringMassSystem();
    this.debugger = new SpringMassDebugger(this.physics, scene);
    this.sign = null;
    this.initialized = false;
    this.boundingBoxHelper = null;
    this.showBoundingBox = false;

    // Spring-mass system properties
    this.springConstant = DEFAULT_SPRING_CONSTANT;
    this.dampingConstant = DEFAULT_DAMPING_CONSTANT;
    this.particleMass = DEFAULT_PARTICLE_MASS;

    // Wind properties
    this.windStrength = DEFAULT_WIND_STRENGTH;
    this.windFrequency = DEFAULT_WIND_FREQUENCY;
    this.windOffset = Math.random() * Math.PI * 2;
    this.windDirection = new THREE.Vector3(0, 0, 1); // Wind in Z direction

    // Rotation limit
    this.maxRotationAngle = DEFAULT_MAX_ROTATION_ANGLE;

    // Set gravity
    this.physics.setGravity(new THREE.Vector3(0, -9.8, 0));

    // Use verlet integration
    this.physics.setIntegration("verlet", 1 / 60);

    // For positioning
    this.originalRotation = new THREE.Euler();
    this.originalPosition = new THREE.Vector3();
    this.pivotOffset = new THREE.Vector3();

    // Visual elements
    this.topAnchorMarker = null;
    this.bottomAnchorMarker = null;
    this.anchorLine = null;
  }

  // Initialize the physics for the sign
  init(sign) {
    if (this.initialized) return;
    this.sign = sign;

    // Store original sign properties
    this.originalRotation.copy(sign.rotation);
    this.originalPosition.copy(sign.position);

    // Find the sign's bounding box
    let boundingBox = new THREE.Box3();
    sign.traverse((node) => {
      if (node.isMesh) {
        node.geometry.computeBoundingBox();
        boundingBox.expandByObject(node);
      }
    });

    // Create bounding box helper
    this.boundingBox = boundingBox;
    this.boundingBoxHelper = new THREE.Box3Helper(boundingBox, 0xffff00);
    this.boundingBoxHelper.visible = this.showBoundingBox;
    this.scene.add(this.boundingBoxHelper);

    // Get sign dimensions and center
    const boxCenter = boundingBox.getCenter(new THREE.Vector3());

    // Use the back edge (max Z) for the top anchor point
    const backZ = boundingBox.max.z;

    // Create anchor points
    const topPos = new THREE.Vector3(
      boxCenter.x,
      boundingBox.max.y, // Top of sign
      backZ // Back edge
    );

    const bottomPos = new THREE.Vector3(
      boxCenter.x,
      boundingBox.min.y, // Bottom of sign
      boxCenter.z // Center Z (for swinging)
    );

    // Calculate pivot offset (critical for correct rotation)
    this.pivotOffset = new THREE.Vector3().subVectors(topPos, sign.position);

    // Create physics particles
    const topParticle = this.physics.createParticle(this.particleMass, topPos);
    topParticle.setFixed(true); // Top is fixed

    const bottomParticle = this.physics.createParticle(
      this.particleMass * DEFAULT_BOTTOM_MASS_MULTIPLIER,
      bottomPos
    );

    // Create spring between particles
    const restLength = topPos.distanceTo(bottomPos);
    this.physics.createSpring(
      topParticle,
      bottomParticle,
      this.springConstant,
      this.dampingConstant,
      restLength
    );

    // Store references to particles
    this.topParticle = topParticle;
    this.bottomParticle = bottomParticle;

    // Create debug visualization
    this.createDebugVisuals(topPos, bottomPos);

    this.initialized = true;
  }

  // Create visual markers and line for debugging
  createDebugVisuals(topPos, bottomPos) {
    const markerGeometry = new THREE.SphereGeometry(5, 8, 8);

    // Top marker (red)
    const topMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.topAnchorMarker = new THREE.Mesh(markerGeometry, topMarkerMaterial);
    this.topAnchorMarker.position.copy(topPos);
    this.topAnchorMarker.visible = this.showBoundingBox;
    this.scene.add(this.topAnchorMarker);

    // Bottom marker (green)
    const bottomMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });
    this.bottomAnchorMarker = new THREE.Mesh(
      markerGeometry,
      bottomMarkerMaterial
    );
    this.bottomAnchorMarker.position.copy(bottomPos);
    this.bottomAnchorMarker.visible = this.showBoundingBox;
    this.scene.add(this.bottomAnchorMarker);

    // Connecting line (blue)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      topPos,
      bottomPos,
    ]);
    this.anchorLine = new THREE.Line(lineGeometry, lineMaterial);
    this.anchorLine.visible = this.showBoundingBox;
    this.scene.add(this.anchorLine);

    // Initialize physics debugging visuals
    this.debugger.createVisualization();
    this.debugger.setVisible(false);
  }

  // Apply forces to limit the sign's rotation angle
  applyRotationLimit() {
    if (!this.topParticle || !this.bottomParticle) return;

    const topPos = this.topParticle.position;
    const bottomPos = this.bottomParticle.position;

    // Get current angle from vertical
    const directionYZ = new THREE.Vector3(
      0,
      bottomPos.y - topPos.y,
      bottomPos.z - topPos.z
    ).normalize();

    const verticalDir = new THREE.Vector3(0, -1, 0);
    let angle = Math.acos(directionYZ.dot(verticalDir));

    // Determine sign of angle
    if (bottomPos.z > topPos.z) {
      angle = -angle;
    }

    // Only apply limiting force when approaching the limit
    if (Math.abs(angle) > this.maxRotationAngle * 0.7) {
      // How close we are to the limit (0-1+)
      const limitRatio = Math.abs(angle) / this.maxRotationAngle;

      // Force increases exponentially as we approach and exceed the limit
      const forceMagnitude = 100 * Math.pow(limitRatio, 4);

      // Direction is opposite to current rotation
      const forceDir = new THREE.Vector3(0, 0, -Math.sign(angle));

      // Apply the limiting force
      this.bottomParticle.addForce(forceDir.multiplyScalar(forceMagnitude));
    }
  }

  // Update the sign's position and rotation based on physics
  update(deltaTime) {
    if (!this.initialized || !this.sign) return;

    // Calculate wind force
    const windTime =
      performance.now() * 0.001 * this.windFrequency + this.windOffset;
    const windFactor = Math.sin(windTime) * this.windStrength;
    const windForce = this.windDirection.clone().multiplyScalar(windFactor);

    // Apply forces
    this.physics.setWind(windForce);
    this.applyRotationLimit();

    // Step physics simulation
    this.physics.step(deltaTime);

    // Update sign based on physics
    this.updateSignFromPhysics();

    // Update debug visualization
    this.updateDebugVisuals();
    this.debugger.update();
  }

  // Update the sign's position and rotation to match physics
  updateSignFromPhysics() {
    if (!this.topParticle || !this.bottomParticle) return;

    const topPos = this.topParticle.position;
    const bottomPos = this.bottomParticle.position;

    // Keep bottom particle in the Y-Z plane
    this.bottomParticle.position.x = this.topParticle.position.x;

    // Calculate direction and angle
    const direction = new THREE.Vector3()
      .subVectors(bottomPos, topPos)
      .normalize();
    const angleX = Math.atan2(direction.z, -direction.y);

    // Rotation matrix for pivot offset calculation
    const rotationMatrix = new THREE.Matrix4().makeRotationX(angleX);

    // Apply rotation to the sign
    this.sign.rotation.x = this.originalRotation.x + angleX;

    // Update sign position to maintain the pivot point
    const rotatedOffset = this.pivotOffset.clone().applyMatrix4(rotationMatrix);
    const newPosition = new THREE.Vector3().subVectors(topPos, rotatedOffset);
    this.sign.position.copy(newPosition);

    // Update bounding box
    const newBoundingBox = new THREE.Box3();
    this.sign.traverse((node) => {
      if (node.isMesh) {
        newBoundingBox.expandByObject(node);
      }
    });

    if (this.boundingBoxHelper) {
      this.boundingBoxHelper.box.copy(newBoundingBox);
    }
  }

  // Update debug visualization elements
  updateDebugVisuals() {
    if (!this.topParticle || !this.bottomParticle) return;

    // Update markers
    if (this.topAnchorMarker) {
      this.topAnchorMarker.position.copy(this.topParticle.position);
    }

    if (this.bottomAnchorMarker) {
      this.bottomAnchorMarker.position.copy(this.bottomParticle.position);
    }

    // Update line
    if (this.anchorLine) {
      const linePoints = [
        this.topParticle.position,
        this.bottomParticle.position,
      ];
      this.anchorLine.geometry.setFromPoints(linePoints);
    }
  }

  // Toggle debug visualization
  toggleDebug() {
    if (!this.initialized) return;
    this.debugger.setVisible(!this.debugger.visible);
    console.log(
      "Physics debug visualization: ",
      this.debugger.visible ? "ON" : "OFF"
    );
  }

  // Toggle bounding box visualization
  toggleBoundingBox() {
    if (!this.initialized || !this.boundingBoxHelper) return;
    this.showBoundingBox = !this.showBoundingBox;

    // Update visibility
    this.boundingBoxHelper.visible = this.showBoundingBox;
    if (this.topAnchorMarker)
      this.topAnchorMarker.visible = this.showBoundingBox;
    if (this.bottomAnchorMarker)
      this.bottomAnchorMarker.visible = this.showBoundingBox;
    if (this.anchorLine) this.anchorLine.visible = this.showBoundingBox;

    console.log(
      "Bounding box visualization: ",
      this.showBoundingBox ? "ON" : "OFF"
    );
  }
}

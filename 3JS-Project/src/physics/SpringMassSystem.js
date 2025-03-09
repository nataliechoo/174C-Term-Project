import * as THREE from "three";

// Particle class representing a mass in the system
class Particle {
  constructor(mass, position, velocity = new THREE.Vector3(0, 0, 0)) {
    this.mass = mass;
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.force = new THREE.Vector3(0, 0, 0);
    this.oldPosition = position.clone();
    this.fixed = false; // Whether this particle can move or is fixed in place
  }

  // Reset accumulated forces
  resetForce() {
    this.force.set(0, 0, 0);
  }

  // Add a force to the particle
  addForce(force) {
    this.force.add(force);
  }

  // Fix the particle in place
  setFixed(fixed) {
    this.fixed = fixed;
  }
}

// Spring class connecting two particles
class Spring {
  constructor(p1, p2, ks, kd, restLength) {
    this.p1 = p1;
    this.p2 = p2;
    this.ks = ks; // Spring constant
    this.kd = kd; // Damping constant
    this.restLength = restLength || p1.position.distanceTo(p2.position);
  }

  // Apply spring forces to connected particles
  applyForce() {
    // Vector from p1 to p2
    const direction = new THREE.Vector3().subVectors(
      this.p2.position,
      this.p1.position
    );
    const distance = direction.length();

    // Skip if particles are at the same position to avoid division by zero
    if (distance === 0) return;

    // Normalize direction vector
    direction.normalize();

    // Spring force = ks * (distance - restLength)
    const springForce = direction
      .clone()
      .multiplyScalar(this.ks * (distance - this.restLength));

    // Calculate velocity difference for damping
    const relativeVelocity = new THREE.Vector3().subVectors(
      this.p2.velocity,
      this.p1.velocity
    );

    // Projection of relative velocity onto direction
    const dampingForce = direction
      .clone()
      .multiplyScalar(this.kd * relativeVelocity.dot(direction));

    // Apply forces to particles
    if (!this.p1.fixed) {
      this.p1.addForce(springForce);
      this.p1.addForce(dampingForce);
    }

    if (!this.p2.fixed) {
      this.p2.addForce(springForce.clone().negate());
      this.p2.addForce(dampingForce.clone().negate());
    }
  }
}

// Main class for the mass-spring system
export class SpringMassSystem {
  constructor() {
    this.particles = [];
    this.springs = [];
    this.gravity = new THREE.Vector3(0, -9.8, 0);
    this.windForce = new THREE.Vector3(0, 0, 0);
    this.integration = "verlet";
    this.dt = 1 / 60; // Default timestep
  }

  // Create a particle and add it to the system
  createParticle(mass, position, velocity = new THREE.Vector3(0, 0, 0)) {
    const particle = new Particle(mass, position, velocity);
    this.particles.push(particle);
    return particle;
  }

  // Create a spring between two particles
  createSpring(p1, p2, ks, kd, restLength) {
    const spring = new Spring(p1, p2, ks, kd, restLength);
    this.springs.push(spring);
    return spring;
  }

  // Set integration method (verlet, euler, symplectic)
  setIntegration(type, dt) {
    this.integration = type;
    if (dt) this.dt = dt;
  }

  // Set gravity force
  setGravity(g) {
    this.gravity = g.clone();
  }

  // Set wind force
  setWind(windForce) {
    this.windForce = windForce.clone();
  }

  // Calculate all forces in the system
  accumulateForces() {
    // Reset all forces
    for (const particle of this.particles) {
      particle.resetForce();

      // Apply gravity
      if (!particle.fixed) {
        particle.addForce(this.gravity.clone().multiplyScalar(particle.mass));

        // Apply wind force
        particle.addForce(this.windForce.clone());
      }
    }

    // Apply spring forces
    for (const spring of this.springs) {
      spring.applyForce();
    }
  }

  // Verlet integration
  verletIntegration(dt) {
    for (const particle of this.particles) {
      if (particle.fixed) continue;

      // Save old position for next iteration
      const oldPos = particle.oldPosition.clone();

      // Calculate acceleration: a = F/m
      const acceleration = particle.force.clone().divideScalar(particle.mass);

      // Verlet integration formula: x(t+dt) = 2*x(t) - x(t-dt) + a*dt^2
      const newPos = new THREE.Vector3()
        .addVectors(
          particle.position.clone().multiplyScalar(2),
          oldPos.clone().multiplyScalar(-1)
        )
        .add(acceleration.clone().multiplyScalar(dt * dt));

      // Update positions
      particle.oldPosition.copy(particle.position);
      particle.position.copy(newPos);

      // Calculate current velocity (for force calculations)
      particle.velocity.subVectors(particle.position, oldPos).divideScalar(dt);
    }
  }

  // Euler integration
  eulerIntegration(dt) {
    for (const particle of this.particles) {
      if (particle.fixed) continue;

      // Calculate acceleration: a = F/m
      const acceleration = particle.force.clone().divideScalar(particle.mass);

      // Update velocity: v = v + a*dt
      particle.velocity.add(acceleration.clone().multiplyScalar(dt));

      // Update position: p = p + v*dt
      particle.position.add(particle.velocity.clone().multiplyScalar(dt));

      // Save old position
      particle.oldPosition.copy(
        particle.position
          .clone()
          .sub(particle.velocity.clone().multiplyScalar(dt))
      );
    }
  }

  // Perform a single integration step
  step(dt) {
    // Accumulate all forces in the system
    this.accumulateForces();

    // Apply the selected integration method
    switch (this.integration) {
      case "verlet":
        this.verletIntegration(dt || this.dt);
        break;
      case "euler":
        this.eulerIntegration(dt || this.dt);
        break;
      default:
        this.verletIntegration(dt || this.dt);
    }
  }
}

// Helper class to create debug visualization
export class SpringMassDebugger {
  constructor(system, scene) {
    this.system = system;
    this.scene = scene;
    this.particleMeshes = [];
    this.springLines = [];
    this.visible = false;
  }

  // Create the debug visualization
  createVisualization() {
    // Create particle meshes
    const sphereGeometry = new THREE.SphereGeometry(5, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    for (const particle of this.system.particles) {
      const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      mesh.position.copy(particle.position);
      this.particleMeshes.push(mesh);
      this.scene.add(mesh);
    }

    // Create spring lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

    for (const spring of this.system.springs) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        spring.p1.position,
        spring.p2.position,
      ]);
      const line = new THREE.Line(geometry, lineMaterial);
      this.springLines.push({ line, spring });
      this.scene.add(line);
    }
  }

  // Update visualization positions
  update() {
    if (!this.visible) return;

    // Update particle meshes
    for (let i = 0; i < this.particleMeshes.length; i++) {
      this.particleMeshes[i].position.copy(this.system.particles[i].position);
    }

    // Update spring lines
    for (const { line, spring } of this.springLines) {
      const positions = [spring.p1.position, spring.p2.position];
      line.geometry.setFromPoints(positions);
      line.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Toggle visibility
  setVisible(visible) {
    this.visible = visible;

    for (const mesh of this.particleMeshes) {
      mesh.visible = visible;
    }

    for (const { line } of this.springLines) {
      line.visible = visible;
    }
  }

  // Clean up (remove all meshes)
  dispose() {
    for (const mesh of this.particleMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const { line } of this.springLines) {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    }

    this.particleMeshes = [];
    this.springLines = [];
  }
}

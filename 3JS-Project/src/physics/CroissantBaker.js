import * as THREE from "three";
import { ThermoelasticSystem } from "./ThermoelasticSystem.js";

/**
 * CroissantBaker - A specialized thermoelastic system for baking croissants
 * Handles interactions between oven and croissant
 */
export class CroissantBaker {
    constructor(scene) {
        this.scene = scene;
        this.thermoSystem = new ThermoelasticSystem(scene);
        this.ovenObject = null;
        this.croissantObject = null;
        this.initialized = false;
        this.isInOven = false;
        this.isBaking = false;
        
        // Store original positions
        this.originalCroissantPosition = null;
        this.ovenPosition = null;
        
        // Configure animation timing parameters
        this.animationConfig = {
            // Animation sequence timing (in seconds)
            timings: {
                initialDelay: 5,    // Wait before starting
                bakeTime: 15,       // Bake duration
                coolTime: 20,       // Cool duration 
                resetDelay: 7,      // Wait before repeating
            },
            // Automatic animation state
            auto: {
                enabled: true,
                state: 'idle',
                stateTimer: 0
            },
            // Baking timer for manual control
            manual: {
                timer: 0,
                duration: 15 // seconds
            }
        };
        
        // Steam particles
        this.steamParticles = null;
        this.particleSystem = null;
        this.steamSettings = null;
    }
    
    /**
     * Initialize the baker with oven and croissant objects
     * @param {Object} ovenObject - The oven THREE.js object
     * @param {Object} croissantObject - The croissant THREE.js object
     */
    init(ovenObject, croissantObject) {
        this.ovenObject = ovenObject;
        this.croissantObject = croissantObject;
        
        // Store original positions
        this.originalCroissantPosition = croissantObject.position.clone();
        this.ovenPosition = ovenObject.position.clone();
        
        // Configure thermoelastic properties
        const thermoSettings = {
            minTemperature: 25,
            maxTemperature: 220,
            expansionFactor: 1.6,    
            heatingRate: 0.2,        
            coolingRate: 0.2,        
            colorWhenCold: new THREE.Color(0xf5deb3),  // Wheat color
            colorWhenHot: new THREE.Color(0xff4500),   // Red-orange for hot
            colorWhenDone: new THREE.Color(0xcd853f),  // Peru brown for baked
            bakeThreshold: 180       // Temperature threshold for "baked" state
        };
        
        // Add croissant to thermoelastic system with custom settings
        this.thermoSystem.init([{
            object: croissantObject,
            settings: thermoSettings
        }]);
        
        // Configure steam properties based on thermoelastic settings
        this.steamSettings = {
            particleCount: 150,
            maxHeight: thermoSettings.expansionFactor * 25, // Scale max height with expansion factor
            startHeight: 25,
            maxRadius: 20,
            tempThreshold: 0.2,      // Temperature threshold to start showing steam (0-1)
            baseLifetime: 0.8,       // Base lifetime in seconds
            lifetimeVariance: 0.5,   // Additional lifetime based on temperature
            baseSpeed: 30,           // Base upward speed
            fadeAcceleration: 0.9,   // Fade acceleration factor when reaching max height
            opacity: 0.5             // Maximum opacity
        };
        
        // Initialize steam particles
        this.initSteamParticles();
        
        this.initialized = true;
        this.animationConfig.auto.state = 'waiting';
        console.log("Croissant baker initialized, automatic animation will begin soon");
    }
    
    /**
     * Start the automatic animation sequence
     */
    startAutoAnimation() {
        this.animationConfig.auto.enabled = true;
        this.animationConfig.auto.state = 'waiting';
        this.animationConfig.auto.stateTimer = 0;
        console.log("Starting automatic baking animation sequence");
    }
    
    /**
     * Stop the automatic animation sequence
     */
    stopAutoAnimation() {
        this.animationConfig.auto.enabled = false;
        console.log("Stopping automatic baking animation sequence");
    }
    
    /**
     * Toggle automatic animation on/off
     */
    toggleAutoAnimation() {
        if (this.animationConfig.auto.enabled) {
            this.stopAutoAnimation();
        } else {
            this.startAutoAnimation();
        }
    }
    
    /**
     * Initialize steam particle system
     */
    initSteamParticles() {
        // Create particle geometry
        const particleCount = this.steamSettings.particleCount;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Arrays to hold particle data
        this.steamParticles = {
            positions: new Float32Array(particleCount * 3),
            sizes: new Float32Array(particleCount),
            lifetimes: new Float32Array(particleCount),
            speeds: new Float32Array(particleCount),
            count: particleCount,
            active: false
        };
        
        // Initialize particles to inactive state
        for (let i = 0; i < particleCount; i++) {
            this.steamParticles.positions[i * 3] = 0;
            this.steamParticles.positions[i * 3 + 1] = 0;
            this.steamParticles.positions[i * 3 + 2] = 0;
            this.steamParticles.sizes[i] = 0;
            this.steamParticles.lifetimes[i] = 0;
            this.steamParticles.speeds[i] = 0.8 + Math.random() * 1.5; 
        }
        
        // Set attributes for the particles
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.steamParticles.positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.steamParticles.sizes, 1));
        
        // Create particle material with custom shader
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 8,
            transparent: true,
            opacity: this.steamSettings.opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            map: this.createSteamTexture()
        });
        
        // Create particle system
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
        
        console.log("Steam particle system initialized with settings:", this.steamSettings);
    }
    
    /**
     * Create a circular texture for the steam particles
     */
    createSteamTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        
        // Create radial gradient
        const gradient = context.createRadialGradient(
            32, 32, 0, 
            32, 32, 32
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        // Draw circle
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(32, 32, 32, 0, Math.PI * 2);
        context.fill();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    /**
     * Update steam particles based on croissant temperature
     * @param {number} deltaTime - Time delta in seconds
     */
    updateSteamParticles(deltaTime) {
        if (!this.steamParticles || !this.particleSystem || this.isInOven) {
            if (this.particleSystem) {
                this.particleSystem.visible = false;
            }
            return;
        }
        
        // Get current croissant temperature
        const item = this.thermoSystem.findObjectItem(this.croissantObject);
        if (!item) return;
        
        const temperature = item.currentTemperature;
        const minTemp = item.settings.minTemperature;
        const maxTemp = item.settings.maxTemperature;
        
        // Only show steam if temperature is above room temperature
        const tempRatio = Math.max(0, (temperature - minTemp) / (maxTemp - minTemp));
        
        // Make steam appear more gradually - require higher temperature to start showing steam
        if (tempRatio > this.steamSettings.tempThreshold) {
            // Gradually increase visibility based on temperature
            const steamVisibility = Math.max(0, 
                (tempRatio - this.steamSettings.tempThreshold) / 
                (1 - this.steamSettings.tempThreshold)
            );
            
            this.particleSystem.visible = true;
            this.steamParticles.active = true;
            
            // Position particle system at croissant
            this.particleSystem.position.copy(this.croissantObject.position);
            this.particleSystem.position.y += this.steamSettings.startHeight;
            
            // Get position and size attributes
            const positions = this.particleSystem.geometry.attributes.position.array;
            const sizes = this.particleSystem.geometry.attributes.size.array;
            
            // Update each particle
            for (let i = 0; i < this.steamParticles.count; i++) {
                // Update lifetime
                this.steamParticles.lifetimes[i] -= deltaTime;
                
                // If particle is dead or not initialized, respawn it
                if (this.steamParticles.lifetimes[i] <= 0) {
                    // Random position around the croissant
                    const theta = Math.random() * Math.PI * 2;
                    const radius = Math.random() * this.steamSettings.maxRadius;
                    
                    positions[i * 3] = Math.cos(theta) * radius;
                    positions[i * 3 + 1] = 0; // Start at the base
                    positions[i * 3 + 2] = Math.sin(theta) * radius;
                    
                    // Random lifetime based on temperature
                    const maxLifetime = this.steamSettings.baseLifetime + 
                                       tempRatio * this.steamSettings.lifetimeVariance;
                    this.steamParticles.lifetimes[i] = maxLifetime * Math.random();
                    
                    // Initial size based on temperature
                    sizes[i] = 2 + 6 * tempRatio * Math.random();
                }
                // Move existing particles upward
                else {
                    // Move upward
                    positions[i * 3 + 1] += deltaTime * this.steamSettings.baseSpeed * 
                                          this.steamParticles.speeds[i];
                    
                    // Add some random drift
                    positions[i * 3] += (Math.random() - 0.5) * deltaTime * 10;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * deltaTime * 10;
                    
                    // Particle grows as it rises, then fades
                    const lifeProgress = 1 - (this.steamParticles.lifetimes[i] / 2);
                    sizes[i] = Math.max(0, (4 + 8 * tempRatio) * (1 - lifeProgress));
                    
                    // Limit maximum height for particles
                    if (positions[i * 3 + 1] > this.steamSettings.maxHeight) {
                        // Accelerate the fade out
                        this.steamParticles.lifetimes[i] *= this.steamSettings.fadeAcceleration;
                    }
                }
            }
            
            // Update the buffers
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
            this.particleSystem.geometry.attributes.size.needsUpdate = true;
            
            // Update material opacity based on temperature
            this.particleSystem.material.opacity = Math.min(
                this.steamSettings.opacity, 
                steamVisibility * this.steamSettings.opacity
            );
        } else {
            this.particleSystem.visible = false;
            this.steamParticles.active = false;
        }
    }
    
    /**
     * Update the automatic animation sequence state machine
     * @param {number} deltaTime - Time delta in seconds
     */
    updateAnimationSequence(deltaTime) {
        if (!this.animationConfig.auto.enabled || !this.initialized) return;
        
        // Update state timer
        this.animationConfig.auto.stateTimer += deltaTime;
        const stateTimer = this.animationConfig.auto.stateTimer;
        const timings = this.animationConfig.timings;
        
        // State machine for animation sequence
        switch (this.animationConfig.auto.state) {
            case 'waiting':
                // Initial delay before starting the sequence
                if (stateTimer >= timings.initialDelay) {
                    this.putInOven();
                    this.animationConfig.auto.state = 'baking';
                    this.animationConfig.auto.stateTimer = 0;
                    console.log("Auto animation: Started baking");
                }
                break;
                
            case 'baking':
                // Bake for specified duration
                if (stateTimer >= timings.bakeTime) {
                    this.takeOutOfOven();
                    this.animationConfig.auto.state = 'cooling';
                    this.animationConfig.auto.stateTimer = 0;
                    console.log("Auto animation: Removed from oven, cooling");
                }
                break;
                
            case 'cooling':
                // Cool for specified duration
                if (stateTimer >= timings.coolTime) {
                    this.reset();
                    this.animationConfig.auto.state = 'resetting';
                    this.animationConfig.auto.stateTimer = 0;
                    console.log("Auto animation: Reset croissant");
                }
                break;
                
            case 'resetting':
                // Wait before restarting the sequence
                if (stateTimer >= timings.resetDelay) {
                    this.animationConfig.auto.state = 'waiting';
                    this.animationConfig.auto.stateTimer = 0;
                    console.log("Auto animation: Restarting sequence");
                }
                break;
                
            default:
                this.animationConfig.auto.state = 'waiting';
                this.animationConfig.auto.stateTimer = 0;
        }
    }
    
    /**
     * Put croissant in oven and start baking
     */
    putInOven() {
        if (!this.initialized || this.isInOven) return;
        
        // Configure oven placement if not already defined
        if (!this.ovenPlacement) {
            this.ovenPlacement = {
                offsetY: 10,  // Height inside oven
                offsetZ: 20,  // Depth inside oven
                transition: {
                    active: false,
                    duration: 1.0,  // seconds
                    elapsed: 0,
                    startPosition: null,
                    endPosition: null
                }
            };
        }
        
        // Move croissant to oven position
        const ovenInteriorPosition = this.ovenPosition.clone().add(
            new THREE.Vector3(0, this.ovenPlacement.offsetY, this.ovenPlacement.offsetZ)
        );
        this.croissantObject.position.copy(ovenInteriorPosition);
        
        // Start heating
        this.thermoSystem.startHeating(this.croissantObject);
        
        this.isInOven = true;
        this.isBaking = true;
        this.animationConfig.manual.timer = 0;
        
        // Hide steam particles while in oven
        if (this.particleSystem) {
            this.particleSystem.visible = false;
        }
        
        console.log("Croissant placed in oven, baking started");
    }
    
    /**
     * Take croissant out of oven
     */
    takeOutOfOven() {
        if (!this.initialized || !this.isInOven) return;
        
        // Move croissant back to original position
        this.croissantObject.position.copy(this.originalCroissantPosition);
        
        // Start cooling
        this.thermoSystem.startCooling(this.croissantObject);
        
        this.isInOven = false;
        this.isBaking = false;
        
        console.log("Croissant removed from oven, cooling started");
    }
    
    /**
     * Update the baking simulation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        // Update thermoelastic system
        this.thermoSystem.update(deltaTime);
        
        // Update steam particles
        this.updateSteamParticles(deltaTime);
        
        // Update automatic animation sequence
        this.updateAnimationSequence(deltaTime);
        
        // Handle automatic baking timer (backup for manual mode)
        if (this.isBaking) {
            this.animationConfig.manual.timer += deltaTime;
            
            // Take out of oven when baking is complete
            if (this.animationConfig.manual.timer >= this.animationConfig.manual.duration && 
                !this.animationConfig.auto.enabled) {
                this.takeOutOfOven();
            }
        }
    }
    
    /**
     * Reset the croissant to its original state
     */
    reset() {
        if (!this.initialized) return;
        
        this.isInOven = false;
        this.isBaking = false;
        this.animationConfig.manual.timer = 0;
        
        // Move croissant back to original position
        this.croissantObject.position.copy(this.originalCroissantPosition);
        
        // Reset thermoelastic state
        this.thermoSystem.resetObject(this.croissantObject);
        
        // Hide steam particles
        if (this.particleSystem) {
            this.particleSystem.visible = false;
        }
        
        console.log("Croissant baker reset");
    }
    
    /**
     * Toggle debug visualization
     */
    toggleDebug() {
        this.thermoSystem.toggleDebug();
        console.log("Baking state:", {
            isInOven: this.isInOven,
            isBaking: this.isBaking,
            bakingProgress: this.animationConfig.manual.timer / this.animationConfig.manual.duration,
            steamActive: this.steamParticles?.active,
            autoAnimating: this.animationConfig.auto.enabled,
            animationState: this.animationConfig.auto.state,
            stateTimer: this.animationConfig.auto.stateTimer,
            animationTimings: this.animationConfig.timings
        });
    }
} 
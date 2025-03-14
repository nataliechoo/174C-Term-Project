import * as THREE from "three";

/**
 * ThermoelasticSystem - A simplified system to simulate thermal expansion and color changes
 * based on temperature for 3D objects.
 */
export class ThermoelasticSystem {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.initialized = false;
        
        // Steam particles for visual effect
        this.steamParticles = null;
        this.particleSystem = null;
        this.steamEnabled = false;
        
        // Default thermoelastic settings
        this.defaultSettings = {
            minTemperature: 25,      // Room temperature (°C)
            maxTemperature: 200,     // Baking temperature (°C)
            expansionFactor: 1.3,    // Maximum size increase (1.3 = 30% larger)
            heatingRate: 0.5,        // Temperature increase per second (degrees)
            coolingRate: 0.8,        // Temperature decrease per second (degrees)
            heatingDuration: 15,      // Duration in seconds to heat to max temperature
            coolingDuration: 10,      // Duration in seconds to cool to min temperature
            colorWhenCold: new THREE.Color(0xf5deb3),  // Wheat/bread color
            colorWhenHot: new THREE.Color(0xff4500),   // Red-orange for hot
            colorWhenDone: new THREE.Color(0x4b3621),  // Dark brown for baked
            bakeThreshold: 180,      // Temperature at which it's considered "baked"
            // Steam settings
            steamThreshold: 0.2,     // Temperature ratio threshold for steam
            maxSteamHeight: 50,      // Maximum height of steam particles
            steamStartHeight: 25,    // Height above object to start steam
            maxSteamRadius: 20,      // Maximum radius of steam from center
            steamBaseSpeed: 20       // Base upward speed of steam particles
        };
    }

    /**
     * Initialize the system with a list of objects
     * @param {Array} objectsConfig - Array of objects with their config
     * @param {Boolean} enableSteam - Whether to enable steam particle effects
     */
    init(objectsConfig, enableSteam = false) {
        this.objects = objectsConfig.map(config => {
            // Merge with default settings
            const settings = { ...this.defaultSettings, ...config.settings };
            
            // Store original color and scale information
            const meshData = [];
            config.object.traverse(node => {
                if (node.isMesh) {
                    // Store original material and color
                    const originalMaterial = node.material.clone();
                    const originalColor = originalMaterial.color.clone();
                    
                    meshData.push({
                        mesh: node,
                        originalColor: originalColor,
                        originalScale: node.scale.clone()
                    });
                }
            });
            
            // Store original scale
            const originalScale = config.object.scale.clone();
            
            return {
                object: config.object,
                meshes: meshData,
                settings: settings,
                currentTemperature: settings.minTemperature,
                isHeating: false,
                isCooling: false,
                isBaked: false,
                originalScale: originalScale,
                targetScale: originalScale.clone().multiplyScalar(settings.expansionFactor),
                isInEnclosure: false,  // Flag to track if object is inside an enclosure (like an oven)
            };
        });

        this.initialized = true;
        console.log("Thermoelastic system initialized with", this.objects.length, "objects");
        
        // Initialize steam particles if enabled
        this.steamEnabled = enableSteam;
        if (this.steamEnabled) {
            this.initSteamParticles();
        }
    }

    /**
     * Initialize steam particle system
     */
    initSteamParticles() {
        // Create particle geometry
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Arrays to hold particle data
        this.steamParticles = {
            positions: new Float32Array(particleCount * 3),
            sizes: new Float32Array(particleCount),
            lifetimes: new Float32Array(particleCount),
            count: particleCount,
            active: false
        };
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            this.steamParticles.positions[i * 3] = 0;
            this.steamParticles.positions[i * 3 + 1] = 0;
            this.steamParticles.positions[i * 3 + 2] = 0;
            this.steamParticles.sizes[i] = 0;
            this.steamParticles.lifetimes[i] = 0;
        }
        
        // Set attributes for the particles
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.steamParticles.positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.steamParticles.sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 8,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            map: this.createSteamTexture()
        });
        
        // Create particle system
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
        
        console.log("Steam particle system initialized");
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
     * Set whether an object is inside an enclosure (like an oven)
     * @param {Object} object - THREE.js object
     * @param {Boolean} isInEnclosure - Whether object is in an enclosure
     */
    setObjectInEnclosure(object, isInEnclosure) {
        const item = this.findObjectItem(object);
        if (item) {
            item.isInEnclosure = isInEnclosure;
        }
    }

    /**
     * Start heating the object
     * @param {Object} object - THREE.js object
     */
    startHeating(object) {
        const item = this.findObjectItem(object);
        if (item) {
            item.isHeating = true;
            item.isCooling = false;
            
            // Calculate heating rate based on duration
            this._calculateRate(item, true);
        }
    }

    /**
     * Stop heating and start cooling the object
     * @param {Object} object - THREE.js object
     */
    startCooling(object) {
        const item = this.findObjectItem(object);
        if (item) {
            item.isHeating = false;
            item.isCooling = true;
            
            // Calculate cooling rate based on duration
            this._calculateRate(item, false);
        }
    }

    /**
     * Calculate heating or cooling rate based on desired duration
     * @private
     * @param {Object} item - Object item from the objects array
     * @param {boolean} isHeating - Whether calculating heating (true) or cooling (false) rate
     */
    _calculateRate(item, isHeating) {
        if (isHeating) {
            const duration = item.settings.heatingDuration;
            if (duration > 0) {
                const tempDiff = item.settings.maxTemperature - item.currentTemperature;
                // Calculate rate to reach max temperature in exactly the specified duration
                item.settings.heatingRate = tempDiff / (duration * 60); // Account for the 60 multiplier in update
                console.log(`Heating to ${item.settings.maxTemperature}°C in ${duration} seconds (rate: ${item.settings.heatingRate})`);
            } else {
                console.log(`Started heating object to ${item.settings.maxTemperature}°C with default rate`);
            }
        } else {
            const duration = item.settings.coolingDuration;
            if (duration > 0) {
                const tempDiff = item.currentTemperature - item.settings.minTemperature;
                // Calculate rate to reach min temperature in exactly the specified duration
                item.settings.coolingRate = tempDiff / (duration * 60); // Account for the 60 multiplier in update
                console.log(`Cooling to ${item.settings.minTemperature}°C in ${duration} seconds (rate: ${item.settings.coolingRate})`);
            } else {
                console.log(`Started cooling object with default rate`);
            }
        }
    }

    /**
     * Find the item in our objects array that corresponds to a THREE.js object
     * @param {Object} object - THREE.js object
     * @returns {Object} The item from the objects array
     */
    findObjectItem(object) {
        return this.objects.find(item => item.object === object);
    }

    /**
     * Update the steam particles based on object temperature
     * @param {Object} item - Object item from the objects array
     * @param {number} deltaTime - Time delta in seconds
     */
    updateSteamParticles(item, deltaTime) {
        if (!this.steamEnabled || !this.steamParticles || !this.particleSystem) {
            this._hideParticleSystem();
            return;
        }
        
        const tempRatio = this._calculateTempRatio(item);
        const settings = item.settings;
        
        // Always update particle position to follow the object (croissant)
        if (item.object) {
            // Get current world position of the object
            const objectWorldPos = new THREE.Vector3();
            item.object.getWorldPosition(objectWorldPos);
            
            // Always position particles at the object's position
            this.particleSystem.position.copy(objectWorldPos);
            
            // Add height offset
            this.particleSystem.position.y += settings.steamStartHeight;
        }
        
        // Show steam during heating and during cooling period, as long as temperature is high enough
        if (tempRatio > settings.steamThreshold || item.isInEnclosure || (item.isCooling && item.isBaked)) {
            this._updateParticlePositions(tempRatio, deltaTime, settings);
            this._updateParticleOpacity(Math.max(tempRatio, item.isInEnclosure ? 0.4 : 0));
            this.particleSystem.visible = true;
            this.steamParticles.active = true;
        } else {
            this._hideParticleSystem();
        }
    }

    /**
     * Calculate temperature ratio for particles
     * @private
     * @param {Object} item - Object item from the objects array
     * @returns {number} Temperature ratio between 0 and 1
     */
    _calculateTempRatio(item) {
        const temperature = item.currentTemperature;
        const minTemp = item.settings.minTemperature;
        const maxTemp = item.settings.maxTemperature;
        
        // Temperature ratio between 0 and 1
        return Math.max(0, (temperature - minTemp) / (maxTemp - minTemp));
    }

    /**
     * Hide the particle system
     * @private
     */
    _hideParticleSystem() {
        if (this.particleSystem) {
            this.particleSystem.visible = false;
        }
        if (this.steamParticles) {
            this.steamParticles.active = false;
        }
    }

    /**
     * Update particle positions and sizes
     * @private
     * @param {number} tempRatio - Temperature ratio
     * @param {number} deltaTime - Time delta in seconds
     * @param {Object} settings - Object settings
     */
    _updateParticlePositions(tempRatio, deltaTime, settings) {
        // Get position and size attributes
        const positions = this.particleSystem.geometry.attributes.position.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        
        // Update each particle
        for (let i = 0; i < this.steamParticles.count; i++) {
            // Update lifetime
            this.steamParticles.lifetimes[i] -= deltaTime;
            
            // If particle is dead or not initialized, respawn it
            if (this.steamParticles.lifetimes[i] <= 0) {
                this._respawnParticle(i, positions, sizes, tempRatio, settings);
            }
            // Move existing particles upward
            else {
                this._moveParticle(i, positions, sizes, tempRatio, deltaTime, settings);
            }
        }
        
        // Update the buffers
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
    }

    /**
     * Respawn a dead particle
     * @private
     * @param {number} index - Particle index
     * @param {Float32Array} positions - Position array
     * @param {Float32Array} sizes - Size array
     * @param {number} tempRatio - Temperature ratio
     * @param {Object} settings - Object settings
     */
    _respawnParticle(index, positions, sizes, tempRatio, settings) {
        // Random position around the object
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * settings.maxSteamRadius;
        
        positions[index * 3] = Math.cos(theta) * radius;
        positions[index * 3 + 1] = 0; // Start at the base
        positions[index * 3 + 2] = Math.sin(theta) * radius;
        
        // Random lifetime
        this.steamParticles.lifetimes[index] = 0.5 + Math.random() * 0.5;
        
        // Initial size based on temperature
        sizes[index] = 2 + 6 * tempRatio * Math.random();
    }

    /**
     * Move an existing particle
     * @private
     * @param {number} index - Particle index
     * @param {Float32Array} positions - Position array
     * @param {Float32Array} sizes - Size array
     * @param {number} tempRatio - Temperature ratio
     * @param {number} deltaTime - Time delta in seconds
     * @param {Object} settings - Object settings
     */
    _moveParticle(index, positions, sizes, tempRatio, deltaTime, settings) {
        // Move upward
        positions[index * 3 + 1] += deltaTime * settings.steamBaseSpeed;
        
        // Add some random drift
        positions[index * 3] += (Math.random() - 0.5) * deltaTime * 10;
        positions[index * 3 + 2] += (Math.random() - 0.5) * deltaTime * 10;
        
        // Fade out as it rises
        const lifeProgress = 1 - this.steamParticles.lifetimes[index];
        sizes[index] = Math.max(0, (4 + 8 * tempRatio) * (1 - lifeProgress));
        
        // Limit maximum height
        if (positions[index * 3 + 1] > settings.maxSteamHeight) {
            this.steamParticles.lifetimes[index] *= 0.9; // Accelerate fade out
        }
    }

    /**
     * Update particle system opacity based on temperature
     * @private
     * @param {number} tempRatio - Temperature ratio
     */
    _updateParticleOpacity(tempRatio) {
        this.particleSystem.material.opacity = Math.min(0.5, tempRatio * 0.8);
    }

    /**
     * Update the thermoelastic system
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized || this.objects.length === 0) return;

        // Update each registered object
        this.objects.forEach((item) => {
            // Update temperature
            if (item.isHeating) {
                item.currentTemperature = Math.min(
                    item.settings.maxTemperature,
                    item.currentTemperature + item.settings.heatingRate * deltaTime * 60
                );
                
                // Mark as baked if it reaches bake threshold
                if (!item.isBaked && item.currentTemperature >= item.settings.bakeThreshold) {
                    item.isBaked = true;
                    console.log("Object has been baked!");
                }
            } else if (item.isCooling) {
                item.currentTemperature = Math.max(
                    item.settings.minTemperature,
                    item.currentTemperature - item.settings.coolingRate * deltaTime * 60
                );
                
                // Stop cooling once it reaches minimum temperature
                if (item.currentTemperature === item.settings.minTemperature) {
                    item.isCooling = false;
                    console.log("Object has cooled down to room temperature");
                }
            }
            
            // Calculate temperature ratio for all updates (needed for scale and color)
            const tempRatio = (item.currentTemperature - item.settings.minTemperature) / 
                             (item.settings.maxTemperature - item.settings.minTemperature);
                             
            // Skip mesh updates if no meshes
            if (item.meshes.length === 0) {
                // Still update scale and steam even if no meshes
                this._updateScale(item, tempRatio);
                
                // Update steam particles if applicable
                if (this.steamEnabled && this.objects.indexOf(item) === 0) {
                    this.updateSteamParticles(item, deltaTime);
                }
                return;
            }
            
            // Update color for all meshes
            item.meshes.forEach(meshData => {
                if (!meshData.mesh.material || !meshData.mesh.material.color) return;
                
                if (item.isBaked) {
                    if (!item.isInEnclosure && item.isCooling) {
                        // During cooling phase after being baked, lerp from hot to baked color
                        const coolingProgress = 1 - tempRatio;
                        meshData.mesh.material.color.lerpColors(
                            item.settings.colorWhenHot,
                            item.settings.colorWhenDone,
                            coolingProgress
                        );
                    } else if (!item.isInEnclosure && !item.isCooling) {
                        // When baked and cooling is complete, maintain the baked color
                        meshData.mesh.material.color.copy(item.settings.colorWhenDone);
                    } else if (item.isInEnclosure) {
                        // While in oven after reaching baking threshold, maintain hot color
                        meshData.mesh.material.color.copy(item.settings.colorWhenHot);
                    }
                } else if (item.isHeating || item.isInEnclosure) {
                    meshData.mesh.material.color.lerpColors(
                        item.settings.colorWhenCold,
                        item.settings.colorWhenHot,
                        tempRatio
                    );
                } else {
                    // If not baked and not in oven, keep original cold color
                    meshData.mesh.material.color.copy(item.settings.colorWhenCold);
                }
            });
            
            // Update scale based on temperature
            this._updateScale(item, tempRatio);
            
            // Update steam particles for this object if enabled and it's the first object
            // (We're using one particle system for simplicity, so only show steam for the first hot object)
            if (this.steamEnabled && this.objects.indexOf(item) === 0) {
                this.updateSteamParticles(item, deltaTime);
            }
        });
        
        // Update particle system if visible
        if (this.steamEnabled && this.particleSystem && this.particleSystem.visible) {
            // Make sure we have objects before updating
            if (this.objects.length > 0) {
                this.updateSteamParticles(this.objects[0], deltaTime);
            }
        }
    }

    /**
     * Reset a specific object to its original state
     * @param {Object} object - THREE.js object
     */
    resetObject(object) {
        const item = this.findObjectItem(object);
        if (item) {
            item.currentTemperature = item.settings.minTemperature;
            item.isHeating = false;
            item.isCooling = false;
            item.isBaked = false;
            item.isInEnclosure = false;
            
            // Reset materials for all meshes
            item.meshes.forEach(meshData => {
                if (meshData.mesh.material && meshData.mesh.material.color) {
                    meshData.mesh.material.color.copy(item.settings.colorWhenCold);
                }
            });
            
            // Reset scale
            item.object.scale.copy(item.originalScale);
            
            // Hide steam particles
            if (this.steamEnabled && this.particleSystem) {
                this.particleSystem.visible = false;
            }
            
            console.log("Reset object to original state");
        }
    }
    
    /**
     * Enable or disable steam particle effects
     * @param {Boolean} enabled - Whether to enable steam effects
     */
    enableSteam(enabled) {
        if (enabled && !this.steamEnabled) {
            this.steamEnabled = true;
            if (!this.steamParticles) {
                this.initSteamParticles();
            }
        } else if (!enabled && this.steamEnabled) {
            this.steamEnabled = false;
            if (this.particleSystem) {
                this.particleSystem.visible = false;
            }
        }
    }

    /**
     * Helper method to update object scale based on temperature
     * @private
     * @param {Object} item - Object item from the objects array
     * @param {number} tempRatio - Temperature ratio between 0 and 1
     */
    _updateScale(item, tempRatio) {
        if ((item.isHeating || item.isCooling) && item.object) {
            // Check if object has necessary scale properties
            if (item.originalScale && item.targetScale) {
                // Scale proportionally to temperature
                const newScale = new THREE.Vector3().lerpVectors(
                    item.originalScale,
                    item.targetScale,
                    tempRatio
                );
                
                // Apply the new scale
                item.object.scale.copy(newScale);
            }
        }
    }
} 
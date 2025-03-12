import * as THREE from "three";

/**
 * ThermoelasticSystem - A system to simulate thermal expansion and color changes
 * based on temperature for 3D objects.
 */
export class ThermoelasticSystem {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.initialized = false;
        
        // Default thermoelastic settings
        this.defaultSettings = {
            minTemperature: 25,      // Room temperature (°C)
            maxTemperature: 200,     // Baking temperature (°C)
            expansionFactor: 1.3,    // Maximum size increase (1.3 = 30% larger)
            heatingRate: 0.5,        // Temperature increase per second
            coolingRate: 0.8,        // Temperature decrease per second
            colorWhenCold: new THREE.Color(0xf5deb3),  // Wheat/bread color
            colorWhenHot: new THREE.Color(0xff4500),   // Red-orange for hot
            colorWhenDone: new THREE.Color(0x8b4513),  // Saddle brown for baked
            bakeThreshold: 180,      // Temperature at which it's considered "baked"
        };
    }

    /**
     * Initialize the system with a list of objects
     * @param {Array} objectsConfig - Array of objects with their config
     */
    init(objectsConfig) {
        this.objects = objectsConfig.map(config => {
            // Merge with default settings
            const settings = { ...this.defaultSettings, ...config.settings };
            
            // Find all meshes and store their original materials
            const meshes = [];
            config.object.traverse(node => {
                if (node.isMesh) {
                    // Clone the material to avoid affecting other objects
                    const originalMaterial = Array.isArray(node.material) 
                        ? node.material.map(mat => mat.clone()) 
                        : node.material.clone();
                    
                    // If it's a single material, make it an array for consistent handling
                    const materialArray = Array.isArray(originalMaterial) 
                        ? originalMaterial 
                        : [originalMaterial];
                    
                    // Assign the cloned material to the mesh
                    node.material = Array.isArray(node.material) 
                        ? materialArray 
                        : materialArray[0];
                    
                    // Store original colors
                    const originalColors = materialArray.map(mat => mat.color.clone());
                    
                    meshes.push({
                        mesh: node,
                        originalMaterial: originalMaterial,
                        originalColors: originalColors
                    });
                }
            });
            
            // Store original scale
            const originalScale = config.object.scale.clone();
            
            return {
                object: config.object,
                meshes: meshes,
                settings: settings,
                currentTemperature: settings.minTemperature,
                isHeating: false,
                isCooling: false,
                isBaked: false,
                originalScale: originalScale,
                targetScale: originalScale.clone().multiplyScalar(settings.expansionFactor),
            };
        });

        this.initialized = true;
        console.log("Thermoelastic system initialized with", this.objects.length, "objects containing", 
                    this.objects.reduce((total, obj) => total + obj.meshes.length, 0), "meshes");
    }

    /**
     * Add a new object to the thermoelastic system
     * @param {Object} object - THREE.js object
     * @param {Object} settings - Custom settings (optional)
     */
    addObject(object, settings = {}) {
        if (!this.initialized) {
            this.init([]);
        }

        // Find all meshes and store their original materials
        const meshes = [];
        object.traverse(node => {
            if (node.isMesh) {
                // Clone the material
                const originalMaterial = Array.isArray(node.material) 
                    ? node.material.map(mat => mat.clone()) 
                    : node.material.clone();
                
                // If it's a single material, make it an array for consistent handling
                const materialArray = Array.isArray(originalMaterial) 
                    ? originalMaterial 
                    : [originalMaterial];
                
                // Assign the cloned material to the mesh
                node.material = Array.isArray(node.material) 
                    ? materialArray 
                    : materialArray[0];
                
                // Store original colors
                const originalColors = materialArray.map(mat => mat.color.clone());
                
                meshes.push({
                    mesh: node,
                    originalMaterial: originalMaterial,
                    originalColors: originalColors
                });
            }
        });
        
        const originalScale = object.scale.clone();
        const objectSettings = { ...this.defaultSettings, ...settings };
        
        this.objects.push({
            object: object,
            meshes: meshes,
            settings: objectSettings,
            currentTemperature: objectSettings.minTemperature,
            isHeating: false,
            isCooling: false,
            isBaked: false,
            originalScale: originalScale,
            targetScale: originalScale.clone().multiplyScalar(objectSettings.expansionFactor),
        });
        
        console.log("Added new object to thermoelastic system with", meshes.length, "meshes");
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
            console.log("Started heating object");
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
            console.log("Started cooling object");
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
     * Update the thermoelastic system
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized || this.objects.length === 0) return;

        this.objects.forEach(item => {
            // Skip if no meshes
            if (item.meshes.length === 0) return;
            
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
            
            // Calculate temperature ratio (0 to 1)
            const tempRatio = (item.currentTemperature - item.settings.minTemperature) / 
                             (item.settings.maxTemperature - item.settings.minTemperature);
            
            // Update color for all meshes
            item.meshes.forEach(meshData => {
                // Handle arrays of materials or single materials consistently
                const materials = Array.isArray(meshData.mesh.material) 
                    ? meshData.mesh.material 
                    : [meshData.mesh.material];
                
                const originalColors = meshData.originalColors;
                
                materials.forEach((material, idx) => {
                    if (!material || !material.color) return;
                    
                    if (item.isBaked) {
                        // If baked and cooling down, lerp from hot color to baked color
                        if (item.isCooling) {
                            const colorRatio = 1 - (item.currentTemperature - item.settings.minTemperature) / 
                                            (item.settings.bakeThreshold - item.settings.minTemperature);
                            
                            material.color.lerpColors(
                                item.settings.colorWhenHot,
                                item.settings.colorWhenDone,
                                colorRatio
                            );
                        }
                        // If at room temperature and baked, use baked color
                        else if (item.currentTemperature === item.settings.minTemperature) {
                            material.color.copy(item.settings.colorWhenDone);
                        }
                    } else {
                        // If not baked, lerp between original and hot color with easing function
                        const originalColor = originalColors[Math.min(idx, originalColors.length - 1)];
                        
                        // Apply easing to make color change more gradual (start slow, accelerate in middle)
                        const easedTempRatio = tempRatio * tempRatio;
                            
                        material.color.lerpColors(
                            originalColor,
                            item.settings.colorWhenHot,
                            easedTempRatio
                        );
                    }
                });
            });
            
            // Update scale based on temperature
            if (item.isHeating || item.isBaked) {
                // Scale up proportionally to temperature, with a more gradual curve
                const scaleRatio = Math.min(1, tempRatio * tempRatio * 1.2); // More gradual expansion using quadratic curve
                
                const newScaleX = THREE.MathUtils.lerp(
                    item.originalScale.x, 
                    item.targetScale.x, 
                    scaleRatio
                );
                const newScaleY = THREE.MathUtils.lerp(
                    item.originalScale.y, 
                    item.targetScale.y, 
                    scaleRatio
                );
                const newScaleZ = THREE.MathUtils.lerp(
                    item.originalScale.z, 
                    item.targetScale.z, 
                    scaleRatio
                );
                
                item.object.scale.set(newScaleX, newScaleY, newScaleZ);
            }
        });
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
            
            // Reset materials for all meshes
            item.meshes.forEach(meshData => {
                // Reset material colors
                if (Array.isArray(meshData.mesh.material)) {
                    meshData.mesh.material.forEach((material, idx) => {
                        if (material && material.color && idx < meshData.originalColors.length) {
                            material.color.copy(meshData.originalColors[idx]);
                        }
                    });
                } else if (meshData.mesh.material && meshData.mesh.material.color) {
                    meshData.mesh.material.color.copy(meshData.originalColors[0]);
                }
            });
            
            // Reset scale
            item.object.scale.copy(item.originalScale);
            
            console.log("Reset object to original state");
        }
    }

    /**
     * Debug visualization
     */
    toggleDebug() {
        // Would add temperature visualizations, etc. if needed
        console.log("Objects in thermoelastic system:", this.objects);
        
        this.objects.forEach((item, index) => {
            console.log(`Object ${index}:`, {
                temperature: item.currentTemperature,
                isHeating: item.isHeating,
                isCooling: item.isCooling,
                isBaked: item.isBaked,
                meshCount: item.meshes.length
            });
        });
    }
} 
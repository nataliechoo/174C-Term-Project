import * as THREE from "three";
import { ThermoelasticSystem } from "./ThermoelasticSystem.js";

/**
 * CroissantBaker - A simplified thermoelastic system for baking croissants
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
        
        // Timer references for cleanup
        this.bakingTimers = [];
    }
    
    /**
     * Initialize the baker with oven and croissant objects
     * @param {Object} ovenObject - The oven THREE.js object
     * @param {Object} croissantObject - The croissant THREE.js object
     * @param {Object} options - Optional settings for baking
     * @param {number} options.heatingDuration - Time in seconds for heating (default: 15)
     * @param {number} options.coolingDuration - Time in seconds for cooling (default: 10)
     */
    init(ovenObject, croissantObject, options = {}) {
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
            heatingDuration: options.heatingDuration || 15, // Time in seconds to heat up
            coolingDuration: options.coolingDuration || 10, // Time in seconds to cool down
            colorWhenCold: new THREE.Color(0xffffff),  // Normal color
            colorWhenHot: new THREE.Color(0xff4500),   // Red for hot
            colorWhenDone: new THREE.Color(0xcd853f),  // Brown for baked
            bakeThreshold: 180,      // Temperature threshold for "baked" state
            // Steam settings are already defined in ThermoelasticSystem's defaults
        };
        
        // Initialize thermoelastic system with steam enabled
        this.thermoSystem.init([{
            object: croissantObject,
            settings: thermoSettings
        }], true); // Enable steam
        
        this.initialized = true;
        console.log(`Croissant baker initialized with heating time: ${thermoSettings.heatingDuration}s, cooling time: ${thermoSettings.coolingDuration}s`);
    }
    
    /**
     * Put croissant in oven and start baking
     */
    putInOven() {
        if (!this.initialized || this.isInOven) return;
        
        // Move croissant to oven position
        const ovenInteriorPosition = this.ovenPosition.clone().add(
            new THREE.Vector3(0, 20, 20) // Offset inside oven
        );
        this.croissantObject.position.copy(ovenInteriorPosition);
        
        // Start heating and mark as in enclosure (oven)
        this.thermoSystem.startHeating(this.croissantObject);
        this.thermoSystem.setObjectInEnclosure(this.croissantObject, true);
        
        this.isInOven = true;
        this.isBaking = true;
        
        console.log("Croissant placed in oven, baking started");
    }
    
    /**
     * Take croissant out of oven
     */
    takeOutOfOven() {
        if (!this.initialized || !this.isInOven) return;
        
        // Move croissant back to original position
        this.croissantObject.position.copy(this.originalCroissantPosition);
        
        // Start cooling and mark as out of enclosure (oven)
        this.thermoSystem.startCooling(this.croissantObject);
        this.thermoSystem.setObjectInEnclosure(this.croissantObject, false);
        
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
        
        // Update thermoelastic system (which handles temperature, color and steam particles)
        this.thermoSystem.update(deltaTime);
    }
    
    /**
     * Reset the croissant to its original state and clear any pending timers
     */
    reset() {
        if (!this.initialized) return;
        
        // Clear any pending timers
        this.clearTimers();
        
        this.isInOven = false;
        this.isBaking = false;
        
        // Move croissant back to original position
        this.croissantObject.position.copy(this.originalCroissantPosition);
        
        // Reset thermoelastic state
        this.thermoSystem.resetObject(this.croissantObject);
        this.thermoSystem.enableSteam(false);
        
        console.log("Croissant baker reset");
    }
    
    /**
     * Clear all active baking timers
     * @private
     */
    clearTimers() {
        // Clear all pending timers
        this.bakingTimers.forEach(timerId => clearTimeout(timerId));
        this.bakingTimers = [];
    }
    
    /**
     * Start a full baking sequence with time-based heating and cooling from config
     * @param {Function} onComplete - Callback to run when baking is complete
     * @returns {boolean} Whether the baking sequence started successfully
     */
    startBakingSequence(onComplete) {
        if (!this.initialized || !this.croissantObject || !this.ovenObject) {
            console.error("CroissantBaker not properly initialized");
            return false;
        }
        
        // Clear any pending timers from previous baking
        this.clearTimers();
        
        // Get the durations from the thermoelastic system settings
        const item = this.thermoSystem.findObjectItem(this.croissantObject);
        if (!item) {
            console.error("Croissant not found in thermoelastic system");
            return false;
        }
        
        const heatingDuration = item.settings.heatingDuration;
        const coolingDuration = item.settings.coolingDuration;
        
        console.log(`Starting full baking sequence: ${heatingDuration}s heating, ${coolingDuration}s cooling`);
        
        // Reset any previous state
        this.thermoSystem.resetObject(this.croissantObject);
        
        // Enable steam for visual effect
        this.thermoSystem.enableSteam(true);
        
        // Put croissant in oven - rates will be calculated from durations
        this.putInOven();
        
        // Schedule the sequence of events
        
        // 1. Take out of oven after heating duration
        const takeOutTimer = setTimeout(() => {
            this.takeOutOfOven();
        }, heatingDuration * 1000);
        this.bakingTimers.push(takeOutTimer);
        
        // 2. Disable steam a few seconds after taking out (let it fade naturally)
        const disableSteamTimer = setTimeout(() => {
            this.thermoSystem.enableSteam(false);
        }, (heatingDuration + (3 * coolingDuration / 4)) * 1000);
        this.bakingTimers.push(disableSteamTimer);
        
        // 3. Call completion callback after cooling is done
        const completionTimer = setTimeout(() => {
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
            console.log("Baking sequence completed");
        }, (heatingDuration + coolingDuration) * 1000);
        this.bakingTimers.push(completionTimer);
        
        return true;
    }
    
    /**
     * Clean up resources when this object is no longer needed
     */
    dispose() {
        this.clearTimers();
    }
} 
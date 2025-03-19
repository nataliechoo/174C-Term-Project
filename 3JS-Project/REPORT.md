### CS 174C Final Project Report: Café Cuties
By: Natalie C., Shelby F., Katerina S., Vrishank K.

To run our project, ensure you have Node.js installed. Clone the repository and navigate to the project directory. Run npm install to install dependencies. Start a local server by running npm run dev and open the project in a browser at http://localhost:3000 or npx vite at http://localhost:5173.
Abstract
Our project is a cozy, interactive café scene designed to create a visually immersive experience using Three.js for rendering and models created in Womp. The main goal of this project is to showcase advanced physics-based simulations and rendering techniques, bringing the environment to life with dynamic elements and realistic animations. Inspired by the peaceful and inviting atmosphere of a café, we aim to develop a short cinematic that captures the charm and relaxation of spending a day in a beautifully designed coffee shop.
## 1. Introduction  
Cafés are spaces of comfort and community, where people gather to enjoy pastries, coffee, and conversation. Our project aims to simulate this experience through a visually appealing and physics-driven virtual environment. We integrated dynamic interactions, physics-based motion, and smooth camera animations to bring our café to life.  

Multiple simulation systems were used including thermoelastic baking physics, a particle system for steam visualization, and a mass-spring system for sign physics. Additionally, we used spline-based camera movements to ensure fluid scene transitions.  

## 2. Technical Implementation  
The café scene is built using Three.js, an open-source 3D JavaScript library. Models were designed in Womp, and the animations and physics simulations were custom-built. The environment includes realistic lighting, object interactions, and smooth animation sequences.  

Key features of the scene include an interactive baking system where pastries rise and change color based on temperature, a dynamic hanging sign reacting to forces like wind, and steam particles emerging from freshly baked goods. Camera paths were designed using B-Spline interpolation, ensuring fluid and cinematic transitions.  

## 3. Thermoelastic System  
To simulate baking physics, we implemented a thermoelastic system in `ThermoelasticSystem.js`, which handles the thermal expansion and color transitions of pastries. The system modifies an object’s scale and material properties based on temperature, transitioning from raw to fully baked states.  

The temperature of each pastry is controlled over time, with specific thresholds defining when expansion begins and ends. The system also integrates with a particle system that generates steam when pastries exceed a set baking threshold.  
## 4. Particle System  
A particle system was added to simulate steam rising from hot baked goods. Implemented within `ThermoelasticSystem.js`, it dynamically spawns particles with randomized lifetimes, sizes, and movement. The emission rate is temperature-dependent, ensuring realistic behavior. The particles use additive blending to create a soft, wispy appearance, and their motion is governed by physics-inspired calculations.  
## 5. Mass-Spring System for Sign Physics  
Café signs often sway due to minor disturbances such as wind or movement. To replicate this, we developed a mass-spring system in `SpringMassSystem.js`, with sign-specific constraints implemented in `SignPhysics.js`. This system applies spring forces and damping to the hanging signs, making them react naturally to environmental forces.  

The physics were integrated using Verlet/Euler integration, allowing for smooth oscillations and realistic motion. Additionally, rotation limits were set to prevent excessive swinging. The simulation successfully mimics the behavior of a sign hanging by a chain, with gentle motion that adds to the café’s immersive atmosphere.  
## 6. B-Spline Paths for Camera Transitions  
To create fluid cinematic transitions, we implemented B-Spline interpolation using De Boor’s algorithm. The system dynamically calculates control points and smoothly interpolates the camera’s movement along predefined paths. This method ensures visually pleasing movement without abrupt shifts.  

The camera paths guide the viewer through different areas of the café, focusing on key moments such as a capybara waking up, a pastry being baked, and a sign swaying in the breeze. The spline algorithm optimizes performance, reducing unnecessary computations while maintaining high-quality motion.  
## 7. Evaluation & Results  
Our implementation successfully replicates real-world physics in an engaging virtual environment. The thermoelastic baking system accurately depicts the transition from raw to baked pastries. The particle system adds a layer of realism with temperature-driven steam emissions. The mass-spring system provides dynamic motion to hanging signs, creating a visually rich experience.  

The B-Spline camera system ensures smooth and natural transitions, making the scene feel cinematic. Overall, the project meets its goal of delivering an immersive café experience with high-quality physics-based interactions.  

8. Controls and How to Navigate The Café
Our project uses Three.js OrbitControls, which enable Zoom in, Zoom out, rotate around a focus point by left-clicking, or drag (vertical/sideways) movement with right-click.  To see the render scene, load the project and switch Camera Mode: Manual to Camera Mode: Path. To disable the splines and control points, press the button that disables spline visualizations. After finishing the render, switch camera mode to manual again to free fly. To re-view the render, you will need to reload the page and start from the beginning.
9. Conclusion  
Café Cuties demonstrates the potential of physics-driven animations in virtual environments. By combining thermoelastic simulations, particle effects, mass-spring physics, and spline-based motion, we created a café scene that feels alive and interactive. The final product is both visually compelling and technically robust, providing a strong foundation for further development.  

Future improvements could include AI-driven character interactions, more detailed environmental elements, and enhanced lighting techniques such as ray tracing. Expanding interactivity, such as allowing users to customize the café layout, would further enhance engagement.  






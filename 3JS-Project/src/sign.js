// import './style.css' // edit later
// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// export function SignLoader(scene) {
//     const sign_mtlLoader = new MTLLoader()
//     // mtlLoader.setTexturePath('/assets/')
//     sign_mtlLoader.setPath('/assets/')
//     sign_mtlLoader.load(
//     // source
//     'sign/model.mtl',

//     // preLoad callback 
//     function ( materials ) {
//         // Add the loaded object to the scene
//         materials.preload();

//         const objLoader = new OBJLoader()
//         // objLoader.setMaterials(materials); // COMMENT THIS LINE TO REMOVE MATERIAL 
//         objLoader.setPath('/assets/')
//         objLoader.load(
//             'sign/sign_base.obj', // source

//             function ( object ) {
//                 // Add the loaded object to the scene
//                 object.position.x -= 150;
//                 object.position.y += 300;
//                 object.position.z -= 150;
                
//                 scene.add( object );
//             },
//             function ( xhr ) {
//                 console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
//             },
//             function ( err ) {
//                 console.error( 'An error happened' );
//             }
//         );
//     },
//     )
// }

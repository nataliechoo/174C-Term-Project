import './style.css' // edit later
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import Stats from 'three/examples/jsm/libs/stats.module' // FOR FPS MONITORING

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

camera.position.z = 1000

// Renderer and Canvas
const renderer = new THREE.WebGLRenderer()
renderer.setAnimationLoop( animate );
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// User controls 
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// LIGHTING (not all needed, but atlweast one light needed to see the object)
var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
keyLight.position.set(-100, 0, 100);

var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
fillLight.position.set(100, 0, 100);

var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(100, 0, -100).normalize();

scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);


const objLoader = new OBJLoader()
objLoader.setPath('/assets/')
objLoader.load(
  // resource
  'star.obj',

  // onLoad callback 
  function ( object ) {
    // Add the loaded object to the scene
    object.position.y -= 60;
    scene.add( object );
  },

  // onProgress callback
  function ( xhr ) {
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  },

  // onError callback
  function ( err ) {
    console.error( 'An error happened' );
  }
);

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)
}
// FOR FPS MONITORING
// const stats = new Stats()
// document.body.appendChild(stats.dom)

function animate() {
  requestAnimationFrame(animate);
  
  controls.update()

  renderer.render(scene, camera)

  // stats.update() // FOR FPS MONITORING
}
animate()
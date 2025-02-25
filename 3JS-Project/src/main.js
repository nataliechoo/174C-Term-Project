import './style.css' // edit later
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

// Renderer and Canvas
const renderer = new THREE.WebGLRenderer()
renderer.setAnimationLoop( animate );
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Cube body
const cube_geometry = new THREE.BoxGeometry(1,1,1)
const gcube_material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // Green material
const cube = new THREE.Mesh(cube_geometry, gcube_material)
scene.add(cube)

camera.position.z = 5

animate();

function animate() {
  //requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}
import './style.css'; 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'; 

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Light blue sky 

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

camera.position.set(0, 200, 1000); 
camera.lookAt(0, 500, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setAnimationLoop(animate);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// lighting
var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 85%)'), 2.5);
keyLight.position.set(-100, 100, 100);
scene.add(keyLight);

var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 85%)'), 1.5);
fillLight.position.set(100, 100, 100);
scene.add(fillLight);

var backLight = new THREE.DirectionalLight(0xffffff, 2.0);
backLight.position.set(100, 100, -100);
scene.add(backLight);

// base_and_window model
const mtlLoader = new MTLLoader();
mtlLoader.setPath('/assets/base-and-window/');
mtlLoader.load('model.mtl',
  function (materials) {
    console.log("✅ Base MTL file loaded successfully", materials);
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('/assets/base-and-window/');
    objLoader.load('base_and_window.obj',
      function (object) {
        console.log("Base OBJ file loaded successfully");
        scene.add(object);
        object.rotation.y = Math.PI; 
      },
      undefined,
      function (err) {
        console.error('Error loading base OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading base MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

//table model
const tableMtlLoader = new MTLLoader();
tableMtlLoader.setPath('/assets/long-table/');
tableMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Table MTL file loaded successfully", materials);
    materials.preload();

    const tableObjLoader = new OBJLoader();
    tableObjLoader.setMaterials(materials);
    tableObjLoader.setPath('/assets/long-table/');
    tableObjLoader.load('long_table.obj',
  function (object) {
    console.log("Table OBJ file loaded successfully");
    scene.add(object);

    object.position.set(0, 110, -600);
    object.rotation.y = Math.PI / 2; 
    object.scale.set(0.5, 0.5, 0.5); 

  },

      undefined,
      function (err) {
        console.error('Error loading table OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading table MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

const smallTableMtlLoader = new MTLLoader();
smallTableMtlLoader.setPath('/assets/small-table/');
smallTableMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Small Table MTL file loaded successfully", materials);
    materials.preload();

    const smallTableObjLoader = new OBJLoader();
    smallTableObjLoader.setMaterials(materials);
    smallTableObjLoader.setPath('/assets/small-table/');
    smallTableObjLoader.load('small_table.obj',
      function (object) {
        console.log("Small Table OBJ file loaded successfully");
        scene.add(object);

        object.position.set(-200, 110, -500); 
        object.rotation.y = Math.PI / 3;
        object.scale.set(0.4, 0.4, 0.4); 
      },
      undefined,
      function (err) {
        console.error('Error loading small table OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading small table MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

// cup model
const cupMtlLoader = new MTLLoader();
cupMtlLoader.setPath('/assets/cup/');
cupMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Cup MTL file loaded successfully", materials);
    materials.preload();

    const cupObjLoader = new OBJLoader();
    cupObjLoader.setMaterials(materials);
    cupObjLoader.setPath('/assets/cup/');
    cupObjLoader.load('cup.obj',
      function (object) {
        console.log("Cup OBJ file loaded successfully");
        scene.add(object);

        //placed on long-table
        object.position.set(-100, 270, 200); 
        object.scale.set(0.3, 0.3, 0.3); 
      },
      undefined,
      function (err) {
        console.error('Error loading cup OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading cup MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

const teapotMtlLoader = new MTLLoader();
teapotMtlLoader.setPath('/assets/teapot/');
teapotMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Teapot MTL file loaded successfully", materials);
    materials.preload();

    const teapotObjLoader = new OBJLoader();
    teapotObjLoader.setMaterials(materials);
    teapotObjLoader.setPath('/assets/teapot/');
    teapotObjLoader.load('teapot.obj',
      function (object) {
        console.log("Teapot OBJ file loaded successfully");
        scene.add(object);

        // placed on small-table
        object.position.set(-500, 110, 0);
        object.scale.set(3, 3, 3);
      },
      undefined,
      function (err) {
        console.error('Error loading teapot OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading teapot MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

// capybara model
const capybaraMtlLoader = new MTLLoader();
capybaraMtlLoader.setPath('/assets/capybara/');
capybaraMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Capybara MTL file loaded successfully", materials);
    materials.preload();

    const capybaraObjLoader = new OBJLoader();
    capybaraObjLoader.setMaterials(materials);
    capybaraObjLoader.setPath('/assets/capybara/');
    capybaraObjLoader.load('capybara.obj',
      function (object) {
        console.log("Capybara OBJ file loaded successfully");
        scene.add(object);

        object.position.set(400, 110, 300); 
        object.scale.set(0.3, 0.3, 0.3); 
      },
      undefined,
      function (err) {
        console.error('Error loading capybara OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading capybara MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

// Miffy model
const miffyMtlLoader = new MTLLoader();
miffyMtlLoader.setPath('/assets/miffy/');
miffyMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Miffy MTL file loaded successfully", materials);
    materials.preload();

    const miffyObjLoader = new OBJLoader();
    miffyObjLoader.setMaterials(materials);
    miffyObjLoader.setPath('/assets/miffy/');
    miffyObjLoader.load('miffy.obj',
      function (object) {
        console.log("Miffy OBJ file loaded successfully");
        scene.add(object);

        object.position.set(-200, 60, -400); 
        object.rotation.y = Math.PI / 6;
        object.scale.set(1.2, 1.2, 1.2); 

      },
      undefined,
      function (err) {
        console.error('Error loading Miffy OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading Miffy MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);

// star model
const starMtlLoader = new MTLLoader();
starMtlLoader.setPath('/assets/star/');
starMtlLoader.load('model.mtl',
  function (materials) {
    console.log("Star MTL file loaded successfully", materials);
    materials.preload();

    const starObjLoader = new OBJLoader();
    starObjLoader.setMaterials(materials);
    starObjLoader.setPath('/assets/star/');
    starObjLoader.load('star.obj',
      function (object) {
        console.log("Star OBJ file loaded successfully");
        scene.add(object);

        object.position.set(0, 900, -400); 
        object.rotation.y = Math.PI / 4; 
        object.scale.set(1, 1, 1); 

      },
      undefined,
      function (err) {
        console.error('rror loading Star OBJ:', err);
      }
    );
  },
  undefined,
  function (err) {
    console.error('Error loading Star MTL:', err);
    console.error('Error details:', err.message || "No message available");
    console.error('Error event:', err.target);
  }
);


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
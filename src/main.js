// src/main.js
import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js';
import { Vehicle } from './vehicle.js';
import { Controls } from './controls.js';

let scene, camera, renderer, clock;
let world;
let truck;
let controlsInput;
let followCamera = { enabled: true, offset: new THREE.Vector3(0, 5, -12), lerp: 0.08 };

init();
animate();

function init(){
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,4,-10);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  hemi.position.set(0,20,0);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(-5,10,5);
  dir.castShadow = true;
  scene.add(dir);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(1000,1000,10,10);
  const groundMat = new THREE.MeshStandardMaterial({ color:0x6b6b6b, roughness:0.9, metalness:0.0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Physics world
  world = new CANNON.World({ gravity: new CANNON.Vec3(0,-9.82,0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.defaultContactMaterial.friction = 0.4;

  // Ground physics body
  const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: new CANNON.Material() });
  groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
  world.addBody(groundBody);

  // Create a few environment objects
  addEnvironment();

  // Truck
  truck = new Vehicle(scene, world);

  // Input
  controlsInput = new Controls();

  // Resize
  window.addEventListener('resize', onResize);

  clock = new THREE.Clock();
}

function addEnvironment(){
  // Simple buildings and obstacles as boxes
  const boxGeo = new THREE.BoxGeometry(6,6,6);
  const boxMat = new THREE.MeshStandardMaterial({ color:0x999999 });
  for(let i=0;i<20;i++){
    const m = new THREE.Mesh(boxGeo, boxMat);
    m.position.set((Math.random()-0.5)*200,3,(Math.random()-0.5)*200);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);

    // physics
    const body = new CANNON.Body({ mass:0, shape: new CANNON.Box(new CANNON.Vec3(3,3,3)) });
    body.position.copy(m.position);
    world.addBody(body);
  }
}

function updatePhysics(delta){
  // Simple fixed-step integration
  world.step(1/60, delta, 3);
  truck.updateFromPhysics();
}

function updateCamera(){
  if(followCamera.enabled){
    const target = truck.chassisMesh.position.clone();
    const behind = truck.chassisMesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(followCamera.offset.z);
    const desired = new THREE.Vector3().copy(target).add(new THREE.Vector3(followCamera.offset.x, followCamera.offset.y, 0));
    desired.add(behind);
    camera.position.lerp(desired, followCamera.lerp);
    const lookAt = truck.chassisMesh.position.clone().add(new THREE.Vector3(0,2,0));
    camera.lookAt(lookAt);
  }
}

function animate(){
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  // read inputs and apply to truck
  const inputState = controlsInput.getState();
  truck.applyControls(inputState, delta);

  updatePhysics(delta);
  updateCamera();

  // HUD update
  const speedKph = Math.round(truck.getSpeedKmh());
  document.getElementById('speed').textContent = speedKph;

  renderer.render(scene, camera);
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

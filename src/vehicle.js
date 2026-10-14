// src/vehicle.js
import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import * as CANNON from 'https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js';

export class Vehicle{
  constructor(scene, world){
    this.scene = scene;
    this.world = world;

    // Visual chassis
    const chassisGeo = new THREE.BoxGeometry(3.5,1.4,6);
    const chassisMat = new THREE.MeshStandardMaterial({ color:0x222222, metalness:0.3, roughness:0.4 });
    this.chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    this.chassisMesh.castShadow = true;
    scene.add(this.chassisMesh);

    // Physics chassis
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.75,0.7,3));
    this.chassisBody = new CANNON.Body({ mass: 2500 });
    this.chassisBody.addShape(chassisShape);
    this.chassisBody.position.set(0,4,0);
    this.chassisBody.angularDamping = 0.4;
    world.addBody(this.chassisBody);

    // Wheels (visual)
    this.wheelMeshes = [];
    this.wheelBodies = [];
    const wheelGeo = new THREE.CylinderGeometry(1.1,1.1,0.8,16);
    const wheelMat = new THREE.MeshStandardMaterial({ color:0x111111, metalness:0.2, roughness:0.7 });
    for(let i=0;i<4;i++){
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI/2;
      w.castShadow = true;
      scene.add(w);
      this.wheelMeshes.push(w);

      const wb = new CANNON.Body({ mass:50, shape: new CANNON.Sphere(0.6) });
      this.world.addBody(wb);
      this.wheelBodies.push(wb);
    }

    // Simple constraints to approximate wheels
    // Positions relative to chassis
    this.wheelOffsets = [
      new CANNON.Vec3(-1.6,-0.9, 2.6), // front-left
      new CANNON.Vec3( 1.6,-0.9, 2.6), // front-right
      new CANNON.Vec3(-1.6,-0.9,-2.6), // rear-left
      new CANNON.Vec3( 1.6,-0.9,-2.6), // rear-right
    ];

    for(let i=0;i<4;i++){
      const wb = this.wheelBodies[i];
      const worldPoint = this.chassisBody.position.vadd(this.wheelOffsets[i]);
      wb.position.copy(worldPoint);
      const constraint = new CANNON.LockConstraint(this.chassisBody, wb);
      this.world.addConstraint(constraint);
    }

    // Driving parameters
    this.engineForce = 0;
    this.maxEngineForce = 15000;
    this.steering = 0;
    this.maxSteer = 0.5; // radians
    this.brakeForce = 0;
    this.handbrake = false;
  }

  applyControls(input, delta){
    // Throttle
    const throttle = input.forward ? 1 : (input.backward ? -0.6 : 0);
    const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);

    // Simple engine application to rear wheels
    const speed = this.getSpeedKmh();
    const speedFactor = Math.max(0, 1 - speed/180);
    this.engineForce = throttle * this.maxEngineForce * speedFactor;

    // Apply force to chassis in forward direction
    const forward = this.chassisBody.quaternion.vmult(new CANNON.Vec3(0,0,1));
    const force = forward.scale(-this.engineForce * delta);
    this.chassisBody.applyForce(force, this.chassisBody.position);

    // Steering torque
    const steerAngle = steer * this.maxSteer;
    const yawTorque = steerAngle * 1200;
    this.chassisBody.torque.y += yawTorque * delta;

    // Braking
    if(input.brake){
      // apply damping
      const vel = this.chassisBody.velocity;
      this.chassisBody.velocity.scale(0.98, this.chassisBody.velocity);
    }

    // Handbrake
    if(input.handbrake){
      this.chassisBody.velocity.x *= 0.95;
      this.chassisBody.velocity.z *= 0.95;
    }

    // Reset
    if(input.reset){
      this.resetPosition();
    }

    // Sync visuals to physics
    this.syncVisuals();
  }

  getSpeedKmh(){
    const v = this.chassisBody.velocity.length();
    return v * 3.6;
  }

  resetPosition(){
    this.chassisBody.position.set(0,6,0);
    this.chassisBody.velocity.set(0,0,0);
    this.chassisBody.angularVelocity.set(0,0,0);
    this.chassisBody.quaternion.set(0,0,0,1);
  }

  updateFromPhysics(){
    this.syncVisuals();
  }

  syncVisuals(){
    // chassis
    this.chassisMesh.position.copy(this.chassisBody.position);
    this.chassisMesh.quaternion.copy(this.chassisBody.quaternion);

    // wheels
    for(let i=0;i<4;i++){
      const offset = this.wheelOffsets[i];
      const worldPoint = this.chassisBody.pointToWorldFrame(offset);
      this.wheelMeshes[i].position.set(worldPoint.x, worldPoint.y, worldPoint.z);
    }
  }
}

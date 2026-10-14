// src/vehicle.js
// Replaced simple lock-constraint wheel approximation with a proper RaycastVehicle
// using cannon-es RaycastVehicle for more realistic suspension and wheel behaviour.

import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import * as CANNON from 'https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js';

export class Vehicle{
  constructor(scene, world){
    this.scene = scene;
    this.world = world;

    // Chassis visual
    const chassisGeo = new THREE.BoxGeometry(3.8,1.6,6.2);
    const chassisMat = new THREE.MeshStandardMaterial({ color:0x222222, metalness:0.35, roughness:0.45 });
    this.chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    this.chassisMesh.castShadow = true;
    scene.add(this.chassisMesh);

    // Chassis physics
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.9,0.8,3.1));
    this.chassisBody = new CANNON.Body({ mass: 2500 });
    this.chassisBody.addShape(chassisShape);
    this.chassisBody.position.set(0,4,0);
    this.chassisBody.angularDamping = 0.4;
    this.world.addBody(this.chassisBody);

    // Create the vehicle (raycast vehicle)
    this.vehicle = new CANNON.RaycastVehicle({ chassisBody: this.chassisBody, indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2 });

    // Wheel options
    const wheelOptions = {
      radius: 1.05,
      directionLocal: new CANNON.Vec3(0,-1,0),
      suspensionStiffness: 45,
      suspensionRestLength: 0.55,
      suspensionRelaxation: 2,
      dampingCompression: 2.4,
      dampingRelaxation: 2.4,
      frictionSlip: 3.5,
      rollInfluence: 0.02,
      axleLocal: new CANNON.Vec3(-1,0,0),
      chassisConnectionPointLocal: new CANNON.Vec3(),
      maxSuspensionForce: 1e4,
    };

    // Wheel connection points (relative to chassis)
    // front-left, front-right, rear-left, rear-right
    const halfWidth = 1.7;
    const halfLength = 2.6;
    const wheelBaseHeight = -0.9;

    const connectionPoints = [
      new CANNON.Vec3(-halfWidth, wheelBaseHeight,  halfLength), // front-left (0)
      new CANNON.Vec3( halfWidth, wheelBaseHeight,  halfLength), // front-right (1)
      new CANNON.Vec3(-halfWidth, wheelBaseHeight, -halfLength), // rear-left  (2)
      new CANNON.Vec3( halfWidth, wheelBaseHeight, -halfLength), // rear-right (3)
    ];

    for(let i=0;i<4;i++){
      const opts = Object.assign({}, wheelOptions);
      opts.chassisConnectionPointLocal = connectionPoints[i].clone();
      // slightly stiffer suspension on rear
      if(i >= 2){ opts.suspensionStiffness = 55; opts.frictionSlip = 3.8; }
      this.vehicle.addWheel(opts);
    }

    this.vehicle.addToWorld(this.world);

    // Create visual wheel meshes
    this.wheelMeshes = [];
    const wheelGeo = new THREE.CylinderGeometry(wheelOptions.radius, wheelOptions.radius, 0.9, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color:0x111111, metalness:0.25, roughness:0.7 });
    for(let i=0;i<this.vehicle.wheelInfos.length;i++){
      const wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.z = Math.PI/2; // cylinders in Three have Y axis as up; rotate so the wheel faces forward
      wm.castShadow = true;
      wm.receiveShadow = true;
      this.scene.add(wm);
      this.wheelMeshes.push(wm);
    }

    // Driving properties
    this.maxEngineForce = 22000; // N
    this.engineForce = 0;
    this.maxBrakeForce = 12000;

    // Indexes
    this.frontLeft = 0; this.frontRight = 1; this.rearLeft = 2; this.rearRight = 3;

    // Steering limits
    this.maxSteerVal = 0.6; // radians (~34deg)

    // Temporary vectors for reuse
    this.tmpVec3 = new THREE.Vector3();

    // Bind update loop helper
    this._updateVisuals = this._updateVisuals.bind(this);
  }

  applyControls(input, delta){
    // Throttle and braking
    const throttle = input.forward ? 1 : 0;
    const reverse = input.backward ? 1 : 0;
    const brake = input.brake ? 1 : 0; // keyboard shift = brake
    const handbrake = input.handbrake ? 1 : 0; // space

    // Build engine force sign
    const engineSign = throttle - reverse; // forward (1) or reverse (-1)
    const targetEngine = engineSign * this.maxEngineForce;
    // simple interpolation for smoother force changes
    this.engineForce += (targetEngine - this.engineForce) * Math.min(10 * delta, 1);

    // Apply engine force to rear wheels
    this.vehicle.applyEngineForce(-this.engineForce, this.rearLeft);
    this.vehicle.applyEngineForce(-this.engineForce, this.rearRight);

    // Steering
    const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    const steerVal = steerInput * this.maxSteerVal;
    this.vehicle.setSteeringValue(steerVal, this.frontLeft);
    this.vehicle.setSteeringValue(steerVal, this.frontRight);

    // Brakes
    const brakeForce = (brake ? this.maxBrakeForce : 0) + (handbrake ? this.maxBrakeForce*0.6 : 0);
    // Apply braking to all wheels when braking; handbrake adds extra to rear wheels
    for(let i=0;i<this.vehicle.wheelInfos.length;i++){
      this.vehicle.setBrake(brakeForce, i);
    }

    if(handbrake){
      // stronger on rear wheels
      this.vehicle.setBrake(this.maxBrakeForce*1.5, this.rearLeft);
      this.vehicle.setBrake(this.maxBrakeForce*1.5, this.rearRight);
    }

    // Reset
    if(input.reset){
      this.resetPosition();
    }

    // Update visuals so the camera and HUD show smooth state
    this._updateVisuals();
  }

  getSpeedKmh(){
    const v = this.chassisBody.velocity.length();
    return v * 3.6;
  }

  resetPosition(){
    // Lift slightly and zero velocities
    this.chassisBody.position.set(0,6,0);
    this.chassisBody.quaternion.set(0,0,0,1);
    this.chassisBody.velocity.set(0,0,0);
    this.chassisBody.angularVelocity.set(0,0,0);
    // remove wheel impulses if any
    for(let i=0;i<this.vehicle.wheelInfos.length;i++){
      this.vehicle.wheelInfos[i].rotation = 0;
      this.vehicle.wheelInfos[i].deltaRotation = 0;
    }
  }

  updateFromPhysics(){
    // Called each physics step to sync visuals
    this._updateVisuals();
  }

  _updateVisuals(){
    // Chassis visual
    this.chassisMesh.position.copy(this.chassisBody.position);
    this.chassisMesh.quaternion.copy(this.chassisBody.quaternion);

    // Wheels
    for(let i=0;i<this.vehicle.wheelInfos.length;i++){
      this.vehicle.updateWheelTransform(i);
      const t = this.vehicle.wheelInfos[i].worldTransform; // has position and quaternion
      const pos = t.position;
      const quat = t.quaternion;
      const wm = this.wheelMeshes[i];
      wm.position.set(pos.x, pos.y, pos.z);
      wm.quaternion.set(quat.x, quat.y, quat.z, quat.w);

      // Cylinder geometry faces +Y by default in Three; we've rotated it so wheel forward axis matches.
      // We can also add visual rotation for rolling based on wheelInfo.rotation
      const wheelInfo = this.vehicle.wheelInfos[i];
      // wheelInfo.rotation is the rotation around axle (radians)
      wm.rotateX(wheelInfo.rotation - (wm.userRotation || 0));
      wm.userRotation = wheelInfo.rotation;
    }
  }
}

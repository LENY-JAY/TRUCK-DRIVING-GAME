// src/controls.js
export class Controls{
  constructor(){
    this.state = { forward:false, backward:false, left:false, right:false, brake:false, handbrake:false, reset:false };
    this._bind();
  }

  _bind(){
    window.addEventListener('keydown', (e)=>{
      switch(e.code){
        case 'KeyW': case 'ArrowUp': this.state.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.state.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.state.left = true; break;
        case 'KeyD': case 'ArrowRight': this.state.right = true; break;
        case 'Space': this.state.handbrake = true; break;
        case 'KeyR': this.state.reset = true; break;
        case 'ShiftLeft': this.state.brake = true; break;
      }
    });
    window.addEventListener('keyup', (e)=>{
      switch(e.code){
        case 'KeyW': case 'ArrowUp': this.state.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.state.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.state.left = false; break;
        case 'KeyD': case 'ArrowRight': this.state.right = false; break;
        case 'Space': this.state.handbrake = false; break;
        case 'KeyR': this.state.reset = false; break;
        case 'ShiftLeft': this.state.brake = false; break;
      }
    });

    // simple gamepad polling
    this.gamepadIndex = null;
    window.addEventListener('gamepadconnected', (e)=>{ this.gamepadIndex = e.gamepad.index; console.log('gamepad connected', e.gamepad); });
    window.addEventListener('gamepaddisconnected', ()=>{ this.gamepadIndex = null; console.log('gamepad disconnected'); });
  }

  getState(){
    // poll gamepad if available
    if(this.gamepadIndex !== null){
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if(gp){
        this.state.forward = gp.buttons[7]?.value > 0.1; // RT
        this.state.backward = gp.buttons[6]?.value > 0.1; // LT
        this.state.left = gp.axes[0] < -0.2;
        this.state.right = gp.axes[0] > 0.2;
        this.state.handbrake = gp.buttons[0]?.pressed; // A
      }
    }
    return this.state;
  }
}

var ThirdPersonController = pc.createScript('thirdPersonController');

ThirdPersonController.attributes.add('camera', { type: 'entity', title: 'Camera' });
ThirdPersonController.attributes.add('pivot', {type: 'entity'});
ThirdPersonController.attributes.add('playerGraphics', {type: 'entity'});
ThirdPersonController.attributes.add('moveSpeed', { type: 'number', default: 4, title: 'Move Speed' });
ThirdPersonController.attributes.add('lookSpeed', { type: 'number', default: 1, title: 'Turn Speed' });

ThirdPersonController.prototype.initialize = function () {
    //console.log("INIT 3rd person controller prototype");
    // Enable the mouse to control the camera rotation
    pc.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    pc.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    // Initialize the character's movement direction
    this.direction = new pc.Vec3(); 
    this.eulers = new pc.Vec3();
    this.force = new pc.Vec3();
    this.jumpTimer = 0;
    this.jumpInterval = 0.4;
    this.walkSpeed = 20;
    this.runSpeed = 100;
    this.moveSpeed = 20;
    this.jumpPower = 450;
    this.maxSpeed = 10;
    this.ghostMode = false;

};

ThirdPersonController.prototype.update = function (dt) {
    this.jumpTimer -= dt;
    // on update the eulers
    this.pivot.setLocalEulerAngles(this.eulers.x, this.eulers.y, 0);
    this.playerGraphics.setLocalEulerAngles(0,this.eulers.y,0);
    // movement
    var x = 0;
    var z = 0;
    var app = this.app;
    var right = this.camera.right;
    var forward = this.camera.forward;

    // Use W-A-S-D keys to move player
    // Check for key presses
    if (app.keyboard.wasPressed(pc.KEY_Q)){ 
        this.ghostMode = !this.ghostMode;
        this.entity.rigidbody.enabled = !this.ghostMode;
        this.entity.rigidbody.applyImpulse(this.entity.rigidbody.linearVelocity.mulScalar(-1))
    }

    
    if (app.keyboard.isPressed(pc.KEY_A)){ 
        x -= right.x;
        z -= right.z;
    }

    if (app.keyboard.isPressed(pc.KEY_D)) {
        x += right.x;
        z += right.z;
    }

    if (app.keyboard.isPressed(pc.KEY_W)) {
        x += forward.x;
        z += forward.z;
    }

    if (app.keyboard.isPressed(pc.KEY_S)) {
        x -= forward.x;
        z -= forward.z;
    }
    
    
    
    if (app.keyboard.isPressed(pc.KEY_SPACE)) {
        if (this.ghostMode){
            let boost = app.keyboard.isPressed(pc.KEY_SHIFT) ? 1 : .1;
            this.entity.translate(0,boost,0)
        } else if (this.checkIfOnGround() && this.jumpTimer <= 0){
            this.entity.rigidbody.applyForce(new pc.Vec3(0,this.jumpPower,0))
            this.jumpTimer = this.jumpInterval;
        }
    }
   

    this.moveSpeed = app.keyboard.isPressed(pc.KEY_SHIFT) ? this.runSpeed : this.walkSpeed; 
    
    if (this.ghostMode){
        this.force.set(x, 0, z).normalize().scale(this.moveSpeed * dt);
        this.entity.translate(this.force.x,this.force.y,this.force.z);
        return;    
    }

    if ((x !== 0 || z !== 0)){ //&& this.checkIfOnGround()) {
        let onGroundSpeed = this.checkIfOnGround() ? 1 : 0.4;
        this.force.set(x, 0, z).normalize().scale(this.moveSpeed * onGroundSpeed);
        let flatSpeed = Utils3.flattenVec3(this.entity.rigidbody.linearVelocity).length();
        if (flatSpeed <= this.maxSpeed ){ 
            this.entity.rigidbody.applyForce(this.force);
        }
    }
    this.entity.rigidbody.linearDamping = this.checkIfOnGround() == true ? 0.8 : 0;

};
ThirdPersonController.prototype.onMouseDown = function (e) {
    if (this.enabled) this.app.mouse.enablePointerLock();
}

ThirdPersonController.prototype.onMouseMove = function (e) {
    if (pc.Mouse.isPointerLocked() == false) return;
    this.eulers.y -= this.lookSpeed * e.dx;
    this.eulers.x -= this.lookSpeed * e.dy;
    this.eulers.x %= 360;
    // clamp btw -21 and 47
    let min = -41;
    let max = 46;
    this.eulers.x = clamp(this.eulers.x,min,max); 
};

ThirdPersonController.prototype.checkIfOnGround = function () {
    var from = this.entity.getPosition();
    var to = new pc.Vec3().add2(from,new pc.Vec3(0,-1.05,0));
    // Raycast between the two points and return the closest hit result
    var result = this.app.systems.rigidbody.raycastFirst(from, to);

    // If there was a hit, store the entity
    if (result) {
        var dist = Math.abs(result.point.y - from.y);
        if (dist > 1.8) {
            // console.log('noground, dist:'+dist);
            return false;}
        else return true;
    }
    // console.log('noground, nohit');
    return false;
};

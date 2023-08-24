// https://www.npmjs.com/package/playcanvas-vector-math?activeTab=code?
// Extend playcanvas vec3

pc.Vec3.prototype.distance = function(a,b){return a.clone().sub(b).length()}
pc.Vec3.prototype.trunc = function(){return new pc.Vec3(this.x.toFixed(3),this.y.toFixed(3),this.z.toFixed(3));}
pc.Vec3.prototype.flat = function(){ return new pc.Vec3(this.x.toFixed(3),0,this.z.toFixed(3));}
pc.Vec3.prototype.angle = function(vector1,vector2){
  var dotProduct = vector1.dot(vector2);
  var magnitude1 = vector1.length();
  var magnitude2 = vector2.length();
  var angleInRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));
  return angleInRadians * pc.math.RAD_TO_DEG;
}
pc.Vec3.prototype.getYawAngle = function(a,b){
  const angleA = Math.atan2(a.z, a.x);
  const angleB = Math.atan2(b.z, b.x);
  const yawAngle = angleB - angleA;

  return yawAngle * pc.math.RAD_TO_DEG;
}
var _transformedForward = new pc.Vec3();
pc.Quat.prototype.getYaw = function(){
    var transformedForward = _transformedForward;
    this.transformVector(pc.Vec3.FORWARD, transformedForward);

    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;    
}

pc.Entity.prototype.stripBehaviors = function(){ 
    this.getComponentsInChildren('script').forEach(x => x.entity.removeComponent('script'));
    this.getComponentsInChildren('collision').forEach(x => x.entity.removeComponent('collision'));
    this.getComponentsInChildren('rigidbody').forEach(x => x.entity.removeComponent('rigidbody'));
    this.getComponentsInChildren('camera').forEach(x => x.entity.destroy());
};
pc.Entity.prototype.cloneWithMesh = function(){
    const m = this.render.meshInstances[0].mesh;
    const positions =[];
    const uvs = [];
    const indexArray = [];
    const normals = [];
    m.getPositions(positions);
    m.getUvs(0,uvs);
    m.getIndices(indexArray);
    m.getNormals(normals);
    function updateMesh(mesh, initAll) {
        mesh.setPositions(positions);
        mesh.setIndices(indexArray);
        mesh.setNormals(normals);
        mesh.setUvs(0,uvs);
        //if (initAll) { mesh.setUvs(0, uvs); mesh.setIndices(indexArray); }
        mesh.update(pc.PRIMITIVE_TRIANGLES);
    }
    const mesh = new pc.Mesh(pc.app.graphicsDevice);
    mesh.clear(true,false);
    updateMesh(mesh,true);
    const material = this.render.meshInstances[0].material.clone();
    const meshInstance = new pc.MeshInstance(mesh, material);

    const cloneWithNewMesh = this.clone();
    pc.app.root.addChild(cloneWithNewMesh);
    cloneWithNewMesh.render.meshInstances = [meshInstance];
    return cloneWithNewMesh;
}

pc.Vec3.prototype.max = function(){ return Math.max(this.x,this.y,this.z);} // is this really necessary??!

pc.Entity.prototype.moveTo = function(p,r){
    if (this.rigidbody){
        if (r) this.rigidbody.teleport(p,r);
        else this.rigidbody.teleport(p);
    } else {
        this.setPosition(p);
        if (r) this.setEulerAngles(r);
    }
}

pc.Entity.prototype.stripAllAttributes  = function() {
    // using blacklist.. should use whitelist and strip other things..oh well
    this.getComponentsInChildren('script').forEach(x=>{ // remove all scripts
        Object.keys(x._scriptsIndex).forEach(y => { x.destroy(y); });
    });
//    this.getComponentsInChildren('rigidbody')
    
}
pc.Entity.prototype.getNearestObjectOfType = function(component) {
    return pc.app.root.getComponentsInChildren(component).sort((a,b) => (
        new pc.Vec3().distance(this.getPosition(),a.entity.getPosition()) - 
        new pc.Vec3().distance(this.getPosition(),b.entity.getPosition())))[0]
}

pc.Entity.prototype.rotate = function(deg) {
    const rotation = this.getRotation(); // Get the current rotation
    const additionalRotation = new pc.Quat().setFromAxisAngle(pc.Vec3.UP, deg); // Rotate 180 degrees around the global y-axis
    const finalRotation = additionalRotation.mul(rotation);
    this.setRotation(finalRotation);
}

pc.Entity.prototype.instantiate = function(pos=pc.Vec3.ZERO,rot=pc.Vec3.ZERO){ 
    let c = this.clone(); 
    pc.app.root.addChild(c); 
    c.enabled=true; 
    c.rigidbody ? c.rigidbody.teleport(pos,rot) : (() => { c.setPosition(pos); c.setEulerAngles(rot);})() ; 
    return c;
}

//pc.Vec3.prototype.rotate = function(angleDegrees) {
//  // Convert the angle from degrees to radians
//  var angleRadians = pc.math.DEG_TO_RAD * angleDegrees;
//
//  // Create a quaternion for the rotation around the y-axis
//  var rotation = new pc.Quat();
//  rotation.setFromAxisAngle(pc.Vec3.UP, angleRadians);
//
//  // Create a quaternion representing the original vector
//  var originalQuat = new pc.Quat(this.x, this.y, this.z);
//  // Rotate the original quaternion by the rotation quaternion
//  var rotatedQuat = new rotation.mul(originalQuat);
//    console.log("RQ:"+rotatedQuat.trunc());
//    this.x = rotatedQuat.x; this.y = rotatedQuat.y; this.z = rotatedQuat.z;
//    return this;
//}
pc.RigidBodyComponent.prototype.translate = function(x,y,z){
    p = this.entity.getPosition();
    this.teleport(p.x+x,p.y+y,p.z+z);
}

pc.RigidBodyComponent.prototype.rotate = function(x,y,z){
    p = this.entity.getPosition();

    r = this.entity.getEulerAngles();
    r2 = r.y+y;
    //console.log("r.y:"+r.y+", plus :"+y+" equals:"+r2);
    //console.log("o:"+p.trunc());
    this.teleport(p,new pc.Vec3(r.x+x,r2,r.z+z));
    //console.log("after:"+this.entity.getEulerAngles().y);
}

pc.Vec3.prototype.rotate = function(angle) { 
  // Create a quaternion representing the rotation
  const quaternion = new pc.Quat().setFromEulerAngles(0,angle,0);
  // Rotate the vector using the quaternion
  const rotatedVector = quaternion.transformVector(this);
    this.x=rotatedVector.x; this.y=rotatedVector.y; this.z=rotatedVector.z;
  return rotatedVector;
}

pc.RigidBodyComponent.prototype.stop = function(){
    this.applyImpulse(this.linearVelocity.mulScalar(-1))
}

pc.Entity.prototype.getComponent = function(componentName) {
    if (this[componentName]) return [this[componentName]];
    else if (this.script && this.script[componentName]) return [this.script[componentName]];
    else return [];
}
pc.Entity.prototype.getComponentsInChildren = function(componentName) {
    // checks for scripts (user defined) and components (like 'render', 'meshInstances')
    var components = [];
    var nodes = this.find(
        function(node){ 
            return node[componentName];
        }
    );
    for(var i=0;i<nodes.length; i++){
        var  n = nodes[i];
        components.push(n[componentName]);
    }

    nodes = this.find(
        function(node){ 
            return node.script && node.script[componentName];
        }
    );
    for(var i=0;i<nodes.length; i++){
        var  n = nodes[i];
        components.push(n.script[componentName]);
    }
    return components;
}



// https://forum.playcanvas.com/t/solved-is-there-any-way-to-get-the-points-local-position-when-using-raycast/3680/3 ?
pc.Entity.prototype.worldToLocalPos = function (worldPosition) {
    var mat = this.getWorldTransform().clone().invert(); 
    var localPosition = new pc.Vec3(); 
    mat.transformPoint(worldPosition, localPosition);
    return localPosition;
}

pc.Entity.prototype.localToWorldPos = function (worldPosition) {
    var mat = this.getWorldTransform().clone(); 
    var localPosition = new pc.Vec3(); 
    mat.transformPoint(worldPosition, localPosition);
    return localPosition;
}


pc.Quat.prototype.lerp = function(a,b,t){
    // i'm going to try converting a quat to a vec4 and do linear interpolation between the two, it probably won't work
    // lol it works
    let aa = new pc.Vec4(a.x,a.y,a.z,a.w);
    let bb = new pc.Vec4(b.x,b.y,b.z,b.w);
    let l = new pc.Vec4().lerp(aa,bb,t);
    let quat = new pc.Quat(l.x,l.y,l.z,l.w);
    return quat;
}

pc.Quat.prototype.delta = function(a,b){
    let aa = new pc.Vec4(a.x,a.y,a.z,a.w);
    let bb = new pc.Vec4(b.x,b.y,b.z,b.w);
    return new pc.Vec4().sub2(aa,bb).length();
}
Object.defineProperty(pc.Entity.prototype, 'left', { get: function() { return this.right.clone().mulScalar(-1); } });
Object.defineProperty(pc.Entity.prototype, 'back', { get: function() { return this.forward.clone().mulScalar(-1); } });
Object.defineProperty(pc.Entity.prototype, 'down', { get: function() { return this.up.clone().mulScalar(-1); } });


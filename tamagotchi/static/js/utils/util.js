Utils = {
    getRandomUnitVector() {
        // random.onUnitSphere
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos(2 * Math.random() - 1);
        
        var x = Math.sin(phi) * Math.cos(theta);
        var y = Math.sin(phi) * Math.sin(theta);
        var z = Math.cos(phi);
        
        return new pc.Vec3(x, y, z);
    },
    get RandomColor() {
      const colors = [pc.Color.RED, pc.Color.BLUE, pc.Color.GREEN, pc.Color.YELLOW, pc.Color.PURPLE];
      const randomIndex = Math.floor(Math.random() * colors.length);
      return colors[randomIndex];
    },
    Cubec(options){
        const { position = pc.Vec3.ZERO, color = pc.Color.BLUE, scale = pc.Vec.ONE, rigidbody = true, rbType = pc.RIGIDBODY_TYPE_KINEMATIC } = options;
        let a=Cube(position,scale,rigidbody,rbType);
        a.render.meshInstances[0].material = createMaterial(color);
        return a; 

    },
    AddText(options){
        const { color = pc.Color.YELLOW, text = "text", parent = null, localPos = pc.Vec3.ZERO, scale = 1 } = options;
        let entity = new pc.Entity("DebugText");
        parent.addChild(entity);
        entity.setLocalPosition(localPos);
        entity.setLocalScale(new pc.Vec3(1,1,1).mulScalar(scale));
        entity.addComponent('element', {
            type: 'text',
            layers:[0],
            text: text,
            color: color,
            // Align text to the center of the entity
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
            pivot: new pc.Vec2(0.5, 0.5),
            fontSize: 6,
            fontAsset: assets.font,
        });
        return entity; 
    }, 
    getDistToGround(entity){
        const p = entity.getPosition();
        const result = pc.app.systems.rigidbody.raycastFirst(p, p.clone().add(new pc.Vec3(0,-10000,0)));
        if (result) {
              const hitDistance = new pc.Vec3().distance(result.point,p);
              return hitDistance;
        } else {
            console.log("Fail to hit anything! :"+entity.name);
            return -1;
        }

             
    },
    adjustMeshToGround(options) {
        // performanceHelp
        const {entity=null, collisions=true,boxColliderDim=new pc.Vec3(1,2.5,1)} = options;
        // Note boxColliderDim is halfExtents, not fullExtents

        // Before anything, lower mesh as close to ground as it can get before bending.
        const p = entity.getPosition();
        const buffer = 2;
        const groundDist = Utils.getDistToGround(entity);
        entity.translate(0,-groundDist-buffer,0);

        const mesh = entity.getComponentsInChildren('render')[0].meshInstances[0].mesh;
        mesh.vertexBuffer.lock(); // Get the vertex positions from the mesh data
        const vertices = [];
        mesh.getPositions(vertices);
        const vertexCount = vertices.length / 3;

        let minLocalPosition = 999;
        for (let i = 0; i < vertexCount; i++) {
            const x = vertices[i * 3];
            const y = vertices[i * 3 + 1];
            const z = vertices[i * 3 + 2];
            if (y < minLocalPosition) minLocalPosition = y;
        }

        var colliderPositions = [];


        for (let i = 0; i < vertexCount; i++) {
            const x = vertices[i * 3];
            const y = vertices[i * 3 + 1];
            const z = vertices[i * 3 + 2];
            const startPos = entity.localToWorldPos(new pc.Vec3(x, y, z));
            const endPos = startPos.clone().add(pc.Vec3.DOWN.clone().mulScalar(100));

            const result = pc.app.systems.rigidbody.raycastFirst(startPos, endPos);

            if (result) {
              const hitDistance = new pc.Vec3().distance(result.point,startPos);
              let localHeight = y - minLocalPosition;
                let droppedPos = startPos.clone().add(new pc.Vec3(0,-hitDistance + localHeight,0));
                
                // Add collision if needed
                if (collisions && false ){ // this is way too slow
                    if (colliderPositions.filter(x => new pc.Vec3().distance(x, droppedPos) < Math.sqrt(boxColliderDim.x**2+boxColliderDim.z**2)).length == 0){
                        // If no other existing collider position was within range, create a collider here
                        const col = new pc.Entity();
                        col.setPosition(droppedPos.clone().add(pc.Vec3.UP * boxColliderDim.y));
                        col.addComponent('collision',{type:'box',halfExtents:boxColliderDim});
                        col.addComponent('rigidbody',{type:'static'});
                        col.name = "WallCollider";
                        colliderPositions.push(droppedPos);
                        pc.app.root.addChild(col);
                    }
                }


                let localDroppedPos = entity.worldToLocalPos(droppedPos);
                vertices[i * 3 + 1] = localDroppedPos.y;
            }
        }

        mesh.vertexBuffer.unlock();
        mesh.setPositions(vertices);
        mesh.update(pc.PRIMITIVE_TRIANGLES);
    },

    DestroyObjectsWithTagByRadius(options){
        const {tag="none",radius=20,origin=pc.Vec3.ZERO} = options;
        pc.app.root.getComponentsInChildren('tagged').forEach(x=>{
            if (x.tags.includes(tag) && new pc.Vec3().distance(x.entity.getPosition(),origin) < radius){
                x.entity.destroy();
            }
        });
    },
}
 


//console.log("UTILS loading");
function Sphere(p=pc.Vec3.ZERO,s=pc.Vec3.ONE,rigid=true,rbType='kinematic'){
    sphere  = new pc.Entity("sphere");
    sphere.addComponent("render", {  type: "sphere" }); 
    sphere.setLocalScale(s);
    pc.app.root.addChild(sphere); 
    if (rigid){
        sphere.addComponent("rigidbody", { type: "kinematic", restitution: 0.5, });
        sphere.addComponent("collision", {
            type: "sphere",
            halfExtents: new pc.Vec3(s.x/2, s.y/2, s.z/2),
        });
        sphere.rigidbody.type = rbType;
        sphere.rigidbody.teleport(p);
    } else {
        sphere.setPosition(p);
    }
    return sphere;
}

function Cube(p=pc.Vec3.ZERO,s=pc.Vec3.ONE,rigid=true,rbType='kinematic'){
    cube  = new pc.Entity("cube");
    cube.addComponent("render", {  type: "box" }); 
    cube.render.meshInstances[0].material = createMaterial(pc.Color.WHITE);
    cube.setLocalScale(s);
    pc.app.root.addChild(cube); 
    if (rigid){
        cube.addComponent("rigidbody", { type: "kinematic", restitution: 0.5, });
        cube.addComponent("collision", {
            type: "box",
            halfExtents: new pc.Vec3(s.x/2, s.y/2, s.z/2),
        });
        cube.rigidbody.type = rbType;
        cube.rigidbody.teleport(p);
    } else {
        cube.setPosition(p);
    }
    return cube;
}

function SphereStorm(x){
    for (i=0;i<x;i++){
        for(j=0;j<x;j++){
            setTimeout(function(){
                c = NumberSphere(new pc.Vec3(i,j,5)); c.rigidbody.type='dynamic';
            },i*20+j*100)
        }
    } 
    Game.player.rigidbody.teleport(38.32069396972656, -0.400566101074219,  0.3); 
}

function NetworkNumberCube(p){
    const cube = myTemplates['NumberCube'].clone();
    pc.app.root.addChild(cube);
    cube.rigidbody.teleport(p);
    setTimeout(function(){cube.enabled = true},1); // unforunately it flickers at position zero for some fking reason
    return cube;
}

function NumberSphere(p,s,rbType=pc.RIGIDBODY_TYPE_DYNAMIC){
    let sphere = Sphere(p,s,true,rbType);
    sphere.addComponent('script');
    sphere.script.create('numberInfo',{});
    return sphere;
 }

function NumberCube(p,s){
    let cube = Cube(p,s,true,'dynamic');
    
    cube.addComponent('script');
    cube.script.create('numberInfo',{});
    cube.script.create('serverObjectInfo',{});
    cube.script.create('pickUpItem');
    cube.script.pickUpItem.icon = assets.textures.numberCube1;
    cube.script.create('recordPosition');
    return cube;
    
}

function ToonCube(p,s,rigid=true){
    let cube = Cube(p,s,rigid);
    // Load the vertex shader

    fetch('/static/assets/shaders/toon.vert')
    .then(response => response.text())
    .then(vertexShader => {

        // Fetch the fragment shader
        fetch('/static/assets/shaders/toon.frag')
        .then(response => response.text())
        .then(fragmentShader => {

            // Create shader definition
            var shaderDefinition = {
                attributes: {
                    aPosition: pc.SEMANTIC_POSITION,
                    aNormal: pc.SEMANTIC_NORMAL,
                },
                vshader: vertexShader,
                fshader: fragmentShader
            };

            // Create shader
            var shader = new pc.Shader(pc.app.graphicsDevice, shaderDefinition);

            // Apply shader to material
            var material = new pc.StandardMaterial();
            material.shader = shader;

            // Apply material to mesh instance
            cube.render.material = material;
//            var meshInstance = cube.model.model.meshInstances[0]; // replace 'entity' with your model's entity
 //           meshInstance.material = material;
        });
    });

}

curvyFloor = null;

sword2=null

function Light(){
// Create a new Entity
    var light = new pc.Entity();

    // Add a Light Component to the entity
    light.addComponent("light", {
        type: "point",
        color: new pc.Color(1, 1, 1),
        intensity: 1,
        range: 2000
    });

    // Add the new entity to the root of the scene's graph
    pc.app.root.addChild(light);

    // Move the light to a suitable
        // Utils3.debugSphere(from,0.2);
      light.setLocalPosition(0, 250, 0);
      // Utils3.debugSphere(to,0.1);

}


var Utils3 = {
    checkIfEntityHasAllProperties(ent,props){
        // checks if ent has at laest one inst of each prop, if not return false
        return props.map(x => ent.getComponent(x)).filter(x => x.length == 0).length == 0;
    },
    get sixDirs() {
        const north = new pc.Vec3(0, 0, -1);
        const south = new pc.Vec3(0, 0, 1);
        const east = new pc.Vec3(1, 0, 0);
        const west = new pc.Vec3(-1, 0, 0);
        const up = new pc.Vec3(0, 1, 0);
        const down = new pc.Vec3(0, -1, 0);

        return [north, south, east, west, up, down];
    },

//     GetFraction : function(entity){
//         if (entity && entity.script && entity.script.numberInfo){
//             return entity.script.numberInfo.getFraction(entity.script.numberInfo);    
//         } 
        
//     },
    TruncVec3 : function(v){
        r = new pc.Vec3(v.x.toFixed(2),v.y.toFixed(2),v.z.toFixed(2));
        return r;

    },
    GetAllPropertiesFrom : function(entity){
        var properties = {};
        if (entity === null || entity === undefined || entity.script === null) {
          // console.log('tried get all prop from:'+entity+', early out.');
            return {};
        } 
        for(var s in entity.script){
            if (typeof entity.script[s].getObjectProperties === 'function'){
                // get all properties possible and append them, this may cause overwrites
                properties = Object.assign(properties,entity.script[s].getObjectProperties());
            }
        }
        return properties;
    },
    GetUuid : function(entity){
        return (entity && entity.script && entity.script.serverObjectInfo) ? entity.script.serverObjectInfo.uuid : null;
    },
    fixRotation : function(rot){
        // sometimes rotations are close to zero and have "e" in them, so when sharing a number with "e" to the server it loses context and thinks its a string
        if (Math.abs(rot.x) < 0.05) rot.x = 0;
        if (Math.abs(rot.y) < 0.05) rot.y = 0;
        if (Math.abs(rot.z) < 0.05) rot.z = 0;
        return new pc.Vec3(rot.x,rot.y,rot.z);
        
    },
    flattenVec3 : function(v){
        return new pc.Vec3(v.x,0,v.z);
    },
    sphere2 : function(color,pos,scale) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.specular = color;
        material.metalness = 0.0;
        material.gloss = 0.5;
        material.useMetalness = true;
        material.blendType = pc.BLEND_NORMAL;
        material.opacity = 0.5;
        material.opacityFadesSpecular = true;
        material.alphaWrite = false;

        material.update();

        const sphere = new pc.Entity();

        sphere.addComponent("render", {
            material: material,
            type: "sphere",
        });
        pc.app.root.addChild(sphere);
        sphere.setPosition(pos);
        sphere.setLocalScale(scale,scale,scale);
        return sphere;
    },
    debugSphere : function(pos,scale,color=pc.Color.RED){
         var entity = new pc.Entity();
        
        // Add a new Model Component and add it to the Entity.
        entity.addComponent("model", { type: 'sphere' });
        entity.addComponent("render", { type: 'sphere' });
        
        // Create a new Standard material
        var material = new pc.StandardMaterial();

        // Update the material's diffuse and specular properties
        material.diffuse.set(color.r,color.g,color.b);
        material.specular.set(1, 1, 1);
        console.log("Color:"+color.a);
        material.opacity = color.a; // Set the transparency to 0.5 (50% transparent)
        material.blendType = pc.BLEND_NORMAL; // Set the blending mode to normal blending

        // Notify the material that it has been modified
        material.update();
        // set material
        pc.app.root.addChild(entity);
        entity.render.material = material;

        entity.setPosition(pos);
        entity.enabled = true;
        entity.setLocalScale(scale,scale,scale);

        // Add to the Hierarchy

        // Store in a list for some random duration before deleting
        // this.entities.push({
        //     entity: entity,
        //     timer: pc.math.random(0, this.lifetime)
        // });
        return entity;
    }
};

// Unity love
function FindObjectsOfTypeAll(scriptName){
    return pc.app.root.findByName("Root").find(
        function(node){ 
            return  node.script && node.script[scriptName];
        }
    );
}

/* function GetComponentsInChildren(sourceEntity, componentName){
    var components = [];
    var nodes = sourceEntity.find(
        function(node){ 
            return node[componentName];
        }
    );
    for(var i=0;i<nodes.length; i++){
        var  n = nodes[i];
        components.push(n[componentName]);
    }
    return components;
} */

function GetScriptsInChildren(sourceEntity, scriptName){
    var scripts = [];
    var nodes = sourceEntity.find(
        function(node){ 
            return node.script && node.script[scriptName];
        }
    );
    for(var i=0;i<nodes.length; i++){
        var  n = nodes[i];
        scripts.push(n.script[scriptName]);
    }
    return scripts;
}

function getAllProperties(obj){
    var curr = null;
    // because some properties, e.g. those added with attributes.add, are not enumerable.
    var allProps = []
      , curr = obj;
    do{
        var props = Object.getOwnPropertyNames(curr);
        props.forEach(function(prop){
            if (allProps.indexOf(prop) === -1);
                allProps.push(prop);
        });
    }
    while(curr = Object.getPrototypeOf(curr));
    return allProps;
}

var Vector3 = {
    Angle : function(vecA,vecB){
        vecA = vecA.normalize();
        vecB = vecB.normalize();
        var dot = vecA.dot(vecB);
        var angleInRadians = Math.acos(dot);
        var angle = angleInRadians * pc.math.RAD_TO_DEG;
        return angle;
    }, 
    JsonSchema : [{
        name: 'x',
        type: 'number',
        default: 1
    }, {
        name: 'y',
        type: 'number',
        default: 1
    }, {
        name: 'z',
        type: 'number',
        default: 1
    }]
};

const kEpsilon = 0.000001;

        // Is the dot product of two quaternions within tolerance for them to be considered equal?
function IsEqualUsingDot(dot)
{
    // Returns false in the presence of NaN values.
    return dot > 1.0 - kEpsilon;
}

var Quaternion = {
    LookRotation : function(dir){
        // given a vector3 return a quaternion rotation 
        var m = new pc.Mat4();
        var r = new pc.Quat();
        
        // Make the hit entity point in the direction of the hit normal
        this.setMat4Forward(m, dir, pc.Vec3.UP);
        r.setFromMat4(m);
        return r;
    
    },
    FromToRotation(fromVector, toVector)
    {
        fromVector.normalize();
        toVector.normalize();

        let dot = new pc.Vec3().dot(fromVector, toVector);
        let angle = Math.acos(dot) * pc.math.RAD_TO_DEG;
        let axis = new pc.Vec3().cross(fromVector, toVector).normalize();

        return Quaternion.AngleAxis(angle, axis);
    },
    AngleAxis(angle, axis) // float, vec3
    {
        let halfAngle = angle * 0.5;
        let sinHalfAngle = Math.sin(halfAngle * Mathf.Deg2Rad);

        let rotation = new pc.Quat();
        rotation.x = axis.x * sinHalfAngle;
        rotation.y = axis.y * sinHalfAngle;
        rotation.z = axis.z * sinHalfAngle;
        rotation.w = Mathf.Cos(halfAngle * Mathf.Deg2Rad);

        return rotation;
    },
    setMat4Forward : function (mat4, forward, up) {
        var x, y, z;

        x = new pc.Vec3();
        y = new pc.Vec3();
        z = new pc.Vec3();

        
        
        // Inverse the forward direction as +z is pointing backwards due to the coordinate system
        z.copy(forward).mulScalar(-1);
        y.copy(up).normalize();
        x = x.cross(y, z).normalize();
        y = y.cross(z, x);

        var r = mat4.data;

        r[0]  = x.x;
        r[1]  = x.y;
        r[2]  = x.z;
        r[3]  = 0;
        r[4]  = y.x;
        r[5]  = y.y;
        r[6]  = y.z;
        r[7]  = 0;
        r[8]  = z.x;
        r[9]  = z.y;
        r[10] = z.z;
        r[11] = 0;
        r[15] = 1;

        return mat4;
        
    },
    Angle : function(a,b) {
        let vec_a = new pc.Vec4(a.x,a.y,a.z,a.w);
        let vec_b = new pc.Vec4(b.x,b.y,b.z,b.w);
        let dot = vec_a.dot(b); // Dot(a, b);
        return IsEqualUsingDot(dot) ? 0.0 : Math.acos(Math.min(Math.abs(dot), 1.0)) * 2.0 * Mathf.Rad2Deg;
    }
};

// let's directly mess with Math!
var Mathf = {
    Lerp : function  (start, end, amt){
        // console.log('lerp start:'+start+', end:'+end+', amt:'+amt);
        var result = (1-amt)*start+amt*end;
        // console.log('result:'+result);
        return result;
    },
    Clamp : function(min,max,val){
        return Math.max( min, Math.min(val, max) );
    },
    Rad2Deg : 57.29578,

};



function normalizeArray(arr) {
    // Find the maximum and minimum values in the array
    var minVal = Math.min(...arr);
    var maxVal = Math.max(...arr);

    // Normalize each element in the array
    for (var i = 0; i < arr.length; i++) {
        arr[i] = (arr[i] - minVal) / (maxVal - minVal);
    }
}


function getValueAtFractionalIndex(arr, index) {
    let wholeIndex = Math.floor(index);
    let fraction = index - wholeIndex;

    if (wholeIndex >= arr.length - 1) {
        return arr[arr.length - 1];
    }

    return arr[wholeIndex] * (1 - fraction) + arr[wholeIndex + 1] * fraction;
}

function toSquare2DArray(arr) {
    console.log('2d');
    let size = Math.sqrt(arr.length);
    if (size % 1 !== 0) {
        throw new Error("Array length must be a perfect square.");
    }
    let newArr = new Array(size);
    for (let i = 0; i < size; i++) {
        newArr[i] = arr.slice(i*size, (i+1)*size);
    }
    return newArr;
}

function unFlattenVec3Arr(positions){
    // Output array of pc.Vec3 objects
    let vec3Array = [];
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const vec3 = new pc.Vec3(x, y, z);
      vec3Array.push(vec3);
    }
    return vec3Array;
}

function getValueAtFractionalIndex2D(arr, xIndex, yIndex) {
    let xWholeIndex = Math.floor(xIndex);
    let xFraction = xIndex - xWholeIndex;

    let yWholeIndex = Math.floor(yIndex);
    let yFraction = yIndex - yWholeIndex;

    if (xWholeIndex >= arr.length - 1 || yWholeIndex >= arr.length - 1) {
        return arr[arr.length - 1][arr.length - 1];
    }

    let y0 = arr[xWholeIndex][yWholeIndex] * (1 - xFraction) + arr[xWholeIndex + 1][yWholeIndex] * xFraction;
    let y1 = arr[xWholeIndex][yWholeIndex + 1] * (1 - xFraction) + arr[xWholeIndex + 1][yWholeIndex + 1] * xFraction;

    return y0 * (1 - yFraction) + y1 * yFraction;
}

function getHeightByFractionalIndexFrom2DVec3Arr(arr, xIndex, yIndex) {
    let xWholeIndex = Math.floor(xIndex);
    let xFraction = xIndex - xWholeIndex;

    let yWholeIndex = Math.floor(yIndex);
    let yFraction = yIndex - yWholeIndex;

    if (xWholeIndex >= arr.length - 1 || yWholeIndex >= arr.length - 1) {
        return arr[arr.length - 1][arr.length - 1];
    }

    let y0 = arr[xWholeIndex][yWholeIndex].y * (1 - xFraction) + arr[xWholeIndex + 1][yWholeIndex].y * xFraction;
    let y1 = arr[xWholeIndex][yWholeIndex + 1].y * (1 - xFraction) + arr[xWholeIndex + 1][yWholeIndex + 1].y * xFraction;

    return y0 * (1 - yFraction) + y1 * yFraction;
}

function reshape(verts) {
    // [0,1,2,6,7,8] => [[0,1,2],[6,7,8]]
    let result = [];
    for(let i = 0; i < verts.length; i += 3) {
        result.push([verts[i], verts[i + 1], verts[i + 2]]);
    }
    return result;
}

function findExtents(verts) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for(let i = 0; i < verts.length; i++) {
        let x = verts[i][0], y = verts[i][1], z = verts[i][2];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
    }

    return [
        new pc.Vec3(minX, minY, minZ), // Lower-left-front corner
        new pc.Vec3(maxX, maxY, maxZ), // Upper-right-back corner
    ];
}

function getRandomVec3WithinExtents(extents) {
    let min = extents[0];
    let max = extents[1];

    let randomX = Math.random() * (max.x - min.x) + min.x;
    let randomY = Math.random() * (max.y - min.y) + min.y;
    let randomZ = Math.random() * (max.z - min.z) + min.z;

    return new pc.Vec3(randomX, randomY, randomZ);
}

function arrayRotate(arr, amt) {
    if (amt < 0){
        amt = -amt;
        for (let i=0;i<amt;i++){
            arr.unshift(arr.pop());
        }
    } else {
        for (let i=0;i<amt;i++){
            arr.push(arr.shift());
        }
    }
  return arr;
}

function transpose2DArray(array) {
  const numRows = array.length;
  const numCols = array[0].length;

  // Create a new 2D array with transposed dimensions
  const transposedArray = new Array(numCols).fill(null).map(() => new Array(numRows));

  // Fill the transposed array with the elements from the original array
  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      transposedArray[i][j] = array[j][i];
    }
  }

  return transposedArray;
}


function slideArray(arr,amt){
    if (amt < 0){
        amt = -amt;
        for (let i=0;i<amt;i++){
            arr.shift();
            arr.push(0);
        }
    } else {
        for (let i=0;i<amt;i++){
            arr.pop();
            arr.unshift(0);
        }

    }
        // shift removes one from left
        // push adds one from right
        // pop removes one from right

    return arr;
}

function CastleWall(p){
    const clone = myTemplates['castleWall'].clone();
    clone.enabled = true;
    pc.app.root.addChild(clone);
    clone.rigidbody.teleport(p);
    return clone;
    /*
     let om = cb.render.meshInstances[0].mesh;
    let p = [];
    p = om.getPositions(p);
    let n = [];
    om.getNormals(n);
    let uv=[];
    om.getUvs(uv);
    let iss=[];
    om.getIndices[iss];
    mesh = pc.createMesh(
         pc.app.graphicsDevice,p,
     {
         normals: n,
         uvs: uv,
         indices: iss
     });
     */
}


function Hoop(p=pc.Vec3.ZERO){
    const clone = myTemplates['hoop'].clone();
    clone.enabled = true;
    pc.app.root.addChild(clone);
    clone.rigidbody.teleport(p, new pc.Vec3(0,90,90));
    return clone;

}

function ApplyTextureAssetToEntity(entity,textureAsset){
    var material = new pc.StandardMaterial();
    material.diffuseMap = textureAsset.resource;
    material.opacityMap = textureAsset.resource; // Set opacity map to the same texture
    material.blendType = pc.BLEND_NORMAL; // Set blend type to enable transparency

    material.update();
    entity.getComponentsInChildren('render').forEach(render => render. meshInstances.forEach(function(meshInstance) { meshInstance.material = material; }));
    return material;
}

function ApplyTextureFromFileSource(entity,source){
    return new Promise(function(resolve) {
        // Create new texture asset
        var textureAsset = new pc.Asset("MyTexture", "texture", { url: source });
        pc.app.assets.add(textureAsset);
        pc.app.assets.load(textureAsset);
        textureAsset.ready(function () {
            var material = new pc.StandardMaterial();
            material.diffuseMap = textureAsset.resource;
            material.opacityMap = textureAsset.resource; // Set opacity map to the same texture
            material.blendType = pc.BLEND_NORMAL; // Set blend type to enable transparency
        
            material.update();
            entity.render.meshInstances.forEach(function(meshInstance) { meshInstance.material = material; });
            resolve('Texture loaded!');
        });
        textureAsset.on('error', function (err) {   console.error("Texture load failed:"+err);});
      });
}

function Room(){
 // Floor
 // Floor
    var floorPosition = new pc.Vec3(0, 0, 0);
    var floorScale = new pc.Vec3(10, 0.1, 10);
    Cube(floorPosition, floorScale);

    // Walls
    var wall1Position = new pc.Vec3(-5, 2.5, 0);
    var wall1Scale = new pc.Vec3(0.1, 5, 10);
    Cube(wall1Position, wall1Scale);

    var wall2Position = new pc.Vec3(5, 2.5, 0);
    var wall2Scale = new pc.Vec3(0.1, 5, 10);
    Cube(wall2Position, wall2Scale);

    var wall3Position = new pc.Vec3(0, 2.5, -5);
    var wall3Scale = new pc.Vec3(10, 5, 0.1);
    Cube(wall3Position, wall3Scale);



}

function Triangle3(p){
    return Triangle2(p.x,p.y,p.z);
}
function Triangle2(a,b,c){
    let app = pc.app;
    const positions = new Float32Array([a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z]);
    const uvs = new Float32Array([0,0,0,1,1,1]);

    var vertexFormat = new pc.VertexFormat(pc.app.graphicsDevice, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_COLOR, components: 4, type: pc.TYPE_UINT8, normalize: true }
    ]);

    var vertexBuffer = new pc.VertexBuffer(pc.app.graphicsDevice, vertexFormat, 16*16);
    let index = 0;

    // Interleave position and color data
    // Generate array of indices to form triangle list - two triangles per grid square
    const indexArray = [0,1,2];

    // helper function to update required vertex / index streams
    function updateMesh(mesh, initAll) {
        mesh.setPositions(positions);
        mesh.setNormals(pc.calculateNormals(positions, indexArray));
        if (initAll) {
            mesh.setUvs(0, uvs);
            mesh.setIndices(indexArray);
        }
        mesh.update(pc.PRIMITIVE_TRIANGLES);
    }
    const mesh = new pc.Mesh(app.graphicsDevice);
    updateMesh(mesh, true);

    // create material for physics (not visible)
    const physicsMaterial = new pc.StandardMaterial();
    physicsMaterial.gloss = 0.5;
    physicsMaterial.metalness = 0.3;
    physicsMaterial.useMetalness = true;
    physicsMaterial.update();

    // Create the mesh instance
    const meshInstance = new pc.MeshInstance(mesh, physicsMaterial);

    // Create the entity with render component using meshInstances
    const entity = new pc.Entity("Triangle");
    entity.addComponent("render", {
        meshInstances: [meshInstance],
    });

    // Assign the material to the mesh instance
    entity.render.meshInstances.forEach(function(meshInstance) {
        meshInstance.material = red;
    });

    /*var node = new pc.GraphNode();
    var collisionMeshInstance = new pc.MeshInstance(node, mesh, physicsMaterial);
    var collisionModel = new pc.Model();
    collisionModel.graph = node;
    collisionModel.meshInstances.push(collisionMeshInstance);

    entity.addComponent('collision', {type:'mesh'});
    entity.collision.model = collisionModel;

    entity.addComponent('rigidbody', {
        friction: 0.5,
        type: 'static'
    });*/

    app.root.addChild(entity);
    //entity.rigidbody.teleport(new pc.Vec3(100,1,100))
    return entity;
}

function Clouds(pos,count,size=10,scale=2){
    let cloudGroup =  new pc.Entity("cloudGroup");
    pc.app.root.addChild(cloudGroup);
//    cloudGroup.setPosition(pos.clone().add(new pc.Vec3(size,scale-1,size).mulScalar(scale/2))); // center-ish
    console.log("Cloudgroup??"+pc.app.root.findByName("cloudGroup")); 
   for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let s = new pc.Vec3(1, 1, 1).mulScalar(Math.random() + scale);
            let y = Math.random()/3 + 1;
            let p = pos.clone().add(new pc.Vec3(i,y,j).mulScalar(scale));
        //    console.log("pos: "+pos.trunc()+", y:"+y+", i:"+i+", scale;"+scale);
            let cld = Sphere(p, s,false);
              cld.reparent(cloudGroup);
            cld.setPosition(p);
        }
    }
   
   let cloudCollider = new pc.Entity("CloudCollider");
    cloudCollider.addComponent('collision',{type:'box',halfExtents: new pc.Vec3(size*scale/2, scale, size*scale/2)});
    cloudCollider.addComponent('rigidbody',{type:'kinematic'});
    cloudGroup.addChild(cloudCollider);
    cloudCollider.rigidbody.teleport(pos.clone().add(new pc.Vec3(size,scale-1,size).mulScalar(scale/2)));
    
    
    let cloudParticles = new pc.Entity("CloudParticles");
    let extra = 1.1;
    const scaleCurve = new pc.Curve([scale, scale*2.1]);
    cloudParticles.addComponent("particlesystem", {
        numParticles: size*size*3,
        lifetime: 1,
        rate: .001,
        rate2: .001,
        emitterExtents: new pc.Vec3(size*scale*extra, 1, size*scale*extra),
        scaleGraph: scaleCurve,
        colorMap: assets.textures.fuzzk.resource,
    });
    cloudGroup.addChild(cloudParticles);
    cloudParticles.setPosition(pos.clone().add(new pc.Vec3(size,scale-1,size).mulScalar(scale/2)));
}

function createMaterial(color) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        // we need to call material.update when we change its properties
        material.update();
        return material;
    }



function GetCircleOfPoints(degreesToComplete=360, radius=150, scale=5){ // lower scale = higher point count
		// This method can be used to get a set of Vector3 points that draw a cirle about the Y axis.
		// Useful if you want to cast a spell that creates an arrangement of objects in a circle around the spellcaster or target.
		// Note: The Vector3[] array will exist in local space

		const count = Math.round((degreesToComplete * radius / scale / 60));
		const arcLength = degreesToComplete / count;
		const ret = new Array(count);
		for (let i=0;i<count;i++){
			// commented Debug.Log ("radius:"+radius);
			const xPos = Math.sin(pc.math.DEG_TO_RAD * i * arcLength)*radius
			const yPos = Math.cos(pc.math.DEG_TO_RAD * i * arcLength)*radius;
			ret[i] = new pc.Vec3(xPos,0,yPos);
		}
		return ret;
	}

var Meshing = pc.createScript('meshing');

Meshing.attributes.add('text', {type : 'entity'});

// initialize code called once per entity
Meshing.prototype.initialize = function() {
    var node = new pc.GraphNode();
    var material = new pc.StandardMaterial();
    material.diffuse.set(1, 1, 1, 1);
    // var verts = [0, 0, 0, 0, 0, 1, 1, 0, 0];
    // var tris = [0, 1, 2];
    //var normals = pc.calculateNormals(verts, tris);
    
    var mesh = pc.createPlane(this.app.graphicsDevice);
    
    
    var meshInt = new pc.MeshInstance(node, mesh, material);
    
    var model = new pc.Model();
    model.graph = node;
    model.meshInstances.push(meshInt);
    
    this.entity.addComponent('model');
    this.entity.model.model = model;
    
    
    
    var sphere = new pc.Entity();
    sphere.addComponent('model',
    {
    type : 'sphere'
    });
    
    sphere.setLocalScale(0.1, 0.1, 0.1);
    
    
    var pos = [new pc.Vec3(0.5, 0, 0), new pc.Vec3(0, 0, 0.5), new pc.Vec3(0, 0.5, 0)];
    
    for(var a = 0; a < pos.length; a++)
    {
        var clone = sphere.clone();
        
        clone.setPosition(pos[a]);
        this.app.root.addChild(clone);
    }
    
    this.text.element.text = pos.length;
};

// update code called every frame
Meshing.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// Meshing.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/


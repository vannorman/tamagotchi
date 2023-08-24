var Mesh = pc.createScript('mesh');


Mesh.attributes.add('text', {type : 'entity'});
Mesh.attributes.add('size', {type : 'number', default : 3});
Mesh.attributes.add('scale', {type : 'number', default : 3});
Mesh.attributes.add('height', {type : 'number', default : 3});
Mesh.attributes.add('octaves', {type : 'number', default : 5});
Mesh.attributes.add('PersistenceZ', {type : 'number', default : 5});
Mesh.attributes.add('LacunarityX', {type : 'number', default : 5});




Mesh.prototype.initialize = function(){
    var node = new pc.GraphNode();
    var material = new pc.StandardMaterial();
    
    material.diffuse.set(1, 1, 1, 1);
    
    var verts = [];
    var tris = [];
    
    var i = 0;
    
    for(var z = 0; z <= this.size; z++)
    {
        for(var x = 0; x <= this.size; x++)
        {
            var xi = x / this.size;
            var zi = z / this.size;
            verts[i] = x;
            verts[i + 1] = this.octave(xi, zi) * this.height;
            verts[i + 2] = z;
            
            i += 3;
        }
    }
    
    var vert = 0;
    var tri = 0;
    
    for(var zt = 0; zt < this.size; zt++)
    {
        for(var xt = 0; xt < this.size; xt++)
        {
            tris[tri] = vert;
            tris[tri + 1] = vert + this.size + 1;
            tris[tri + 2] = vert + 1;
            tris[tri + 3] = vert + 1;
            tris[tri + 4] = vert + this.size + 1;
            tris[tri + 5] = vert + this.size + 2;
            
            tri += 6;
            vert++;
        }
        
        vert++;
    }
    
    
    var normals = pc.calculateNormals(verts, tris);
    
    var mesh = pc.createMesh(this.app.graphicsDevice, verts, {
        normals: normals,
        indices: tris
    });
    
    var meshInstance = new pc.MeshInstance(node, mesh, material);
    
    var model = new pc.Model();
    model.graph = node;
    model.meshInstances.push(meshInstance);
    
    
    this.entity.addComponent('model');
    this.entity.model.model = model;
    
    
};


Mesh.prototype.update = function(){
   this.text.element.text = this.entity.model.model.meshInstances[0];
};


Mesh.prototype.octave = function(xi, zi){
    var oct = 0;
    var persH = 1;
    var LacX = 1;
    
    for(var x = 0; x < this.octaves; x++)
    {
        for(var z = 0; z < this.octaves; z++)
        {
            var perl = perlin2(xi * LacX, zi * LacX) * persH;
            
            persH *= this.PersistenceZ;
            LacX *= this.LacunarityX;
            oct += perl;
        }
    }
    
    
    return oct;
};


Mesh.prototype.createMesh = function(){
    var node = new pc.GraphNode();
    var material = new pc.StandardMaterial();
    
    material.diffuse.set(1, 1, 1, 1);
    var verts = [0, 0, 0, 0, 0, 1, 1, 0, 0];
    var tris = [0, 1, 2];
    
    var normals = pc.calculateNormals(verts, tris);

    var mesh = pc.createMesh(this.app.graphicsDevice, verts, {
        normals: normals,
        indices: tris
    });

    var meshInstance = new pc.MeshInstance(node, mesh, material);

    var model = new pc.Model();
    model.graph = node;
    model.meshInstances.push(meshInstance);
    
    this.entity.addComponent('model');
    this.entity.model.model = model;
};



    
// swap method called for script hot-reloading
// inherit your script state here
// Mesh.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/


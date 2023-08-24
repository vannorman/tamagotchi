var AlwaysFaceCamera = pc.createScript('alwaysFaceCamera');
AlwaysFaceCamera.attributes.add('reverse', {type:'bool',default:false});


AlwaysFaceCamera.prototype.update = function(dt){
    if (this.reverse){
        const q = Quaternion.LookRotation(this.entity.getPosition().clone().sub(Camera.main.entity.getPosition()));
        this.entity.setRotation(q);
    } else {
        const q = Quaternion.LookRotation(Camera.main.entity.getPosition().clone().sub(this.entity.getPosition()));
        this.entity.setRotation(q);
    
    }
};



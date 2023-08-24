var CollisionDetector = pc.createScript('collisionDetector');
CollisionDetector.attributes.add('reportTo', {type:'object'});


CollisionDetector.prototype.initialize = function (attributes) {

};


CollisionDetector.prototype.initialize = function () {
    this.entity.collision.on('collisionstart', this.onCollisionStart, this);
    this.entity.name="cols";
}

CollisionDetector.prototype.onCollisionStart = function (collision) {
    this.reportTo.onCollisionReport(collision.other);
};



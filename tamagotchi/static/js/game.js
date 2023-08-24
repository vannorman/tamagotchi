var Game = {
    behaviorsToUpdate : [],
    camera : null,
    pivot : null,
    app : null,
    player: null,
    get playerController(){ return  Game.player.getComponentsInChildren('thirdPersonController')[0] },
    fontAsset : null,
    get droppedPosition() {
        let dir = Utils3.flattenVec3(Camera.main.entity.forward);
        let p = Game.player.getPosition().clone().add(dir).add(dir);
        return p;
    },

    get droppedPosition2() {
        let dir = Utils3.flattenVec3(Camera.main.entity.forward);
        let p = Game.player.getPosition().clone().add(dir.mulScalar(5));
        return p;
    },

}

var Camera = {}
var myTemplates = {}
var smw = {
    prefabs : {},
}; 
// Super math world specific global vars



//console.log("GAME JS LOADING");

async function LoadScene(){
    const mainCam = new pc.Entity("MainCamera");
    mainCam.addComponent("camera", {
        layers: [pc.LAYERID_SKYBOX, pc.LAYERID_WORLD, pc.LAYERID_UI ],
        priority:2,
        clearColorBuffer:false,
        farClip:1500,
    });
    Camera.main = mainCam.camera;

    // ADd text to camera.
    const localPos = new pc.Vec3(0,-0.75,-3);
    const camText = Utils.AddText({text:"playerName",parent:mainCam,localPos:localPos,scale:0.05});
    Game.playerNameElement = camText.element;


    pc.app.root.addChild(mainCam);


     const skyboxCam = new pc.Entity("SkyboxCam");
    skyboxCam.addComponent("camera", {
        layers:[pc.LAYERID_SKYBOX],
        priority:-1
        })
    mainCam.addChild(skyboxCam);
    Camera.skybox = skyboxCam;

     
   
   // Parent the camera to it
    Game.player  = new pc.Entity("Player");
    pc.app.root.addChild(Game.player);
     let pivot = new pc.Entity("pivot");
     Game.pivot = pivot;
    pc.app.root.addChild(pivot);
    pivot.reparent(Game.player);

 


    pc.app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);

    // Set the gravity for our rigid bodies
    pc.app.systems.rigidbody.gravity.set(0, -20, 0);
    // create a few materials for our objects

    // make our scene prettier by adding a directional light
    const light = new pc.Entity();
    light.addComponent("light", {
        type: "directional",
        color: new pc.Color(1, 1, 1),
        castShadows: true,
    });
    light.setLocalEulerAngles(45, 30, 0);

       
    await CreateTemplates();

       // Player graphics
    Game.playerGraphics = new pc.Entity("gfx");
    Game.playerGraphics.addComponent('model', { type: 'box' });
    Game.playerGraphics.addComponent("render", { type: "box", material: gray, });
    Game.player.addChild(Game.playerGraphics);

   

    // Player camera
    Camera.main.entity.reparent(pivot);
    Camera.main.entity.addComponent('audiolistener');
   Camera.main.entity.translate(0, 1, 9);
    Camera.main.entity.lookAt(0, 2, 0);

 
    Game.player.addComponent('script');
    Game.player.script.create('thirdPersonController',{
        attributes:{
            pivot:Game.pivot,
            playerGraphics:Game.playerGraphics,
            camera:Camera.main.entity,
        }
    });
   Game.player.addComponent("collision",{type:'sphere'}); // Without , this defaults to a 1x1x1 box shape



    let rb = Game.player.addComponent("rigidbody",{
            type:pc.BODYTYPE_DYNAMIC,
            angularFactor:pc.Vec3.ZERO,
            linearDamping: 0.8,
            }); 
        

    Game.player.rigidbody.teleport(pc.Vec3.ZERO); // starting pos
   
  // floor
   Utils.Cubec({position:new pc.Vec3(0,-1,0),scale:new pc.Vec3(20,1,20),rigidbody:true,color:pc.Color.GRAY});
  
  // walls
   Utils.Cubec({position:new pc.Vec3(10,-1,0),scale:new pc.Vec3(1,5,20),rigidbody:true,color:pc.Color.WHITE});
   Utils.Cubec({position:new pc.Vec3(-10,-1,0),scale:new pc.Vec3(1,5,20),rigidbody:true,color:pc.Color.WHITE});
   Utils.Cubec({position:new pc.Vec3(0,-1,10),scale:new pc.Vec3(20,5,1),rigidbody:true,color:pc.Color.WHITE});
   Utils.Cubec({position:new pc.Vec3(0,-1,-10),scale:new pc.Vec3(20,5,1),rigidbody:true,color:pc.Color.WHITE});
   

    Network.Init(Game.playerNameElement,Game.player);
   Game.behaviorsToUpdate.push(Network);
    pc.app.on("update", function (dt) {
        Game.behaviorsToUpdate.forEach(x => x.update(dt)); 
    });




    // API
    /*
    WASD - move around
    
    Things the dM api can receive
    Move(_direction) (wasd)
    Turn(direction) (lr)

    Things the dm can send
    Collide({item:{identifier:id, description:text}})
    // UserInput({personality_shift:aggro})

   // subscribe to redis stream pub/sub? 
        

    */
    Game.skybox_city();
    // ENDD of Game setup

}

const red = createMaterial(new pc.Color(1,0,0));
const gray = createMaterial(new pc.Color(0.3, 0.3, 0.3));
const blue = createMaterial(new pc.Color(0.3, 0.3, 1));
const green = createMaterial(new pc.Color(0.3, 1, 0.3));
const white = createMaterial(pc.Color.WHITE );
const black = createMaterial(new pc.Color(00,00,00));
const assets = {
    // Animations : https://playcanvas.com/editor/scene/961236
    // Animations: https://forum.playcanvas.com/t/solved-how-do-you-programmatically-import-and-apply-animations-to-models-from-mixamo/15248/2

    skybox_city: new pc.Asset("skybox_city", "container", { url: "/static/assets/models/skybox_city.glb",    }),
    axis: new pc.Asset("axis", "container", { url: "/static/assets/models/axis.glb",    }),
    gothicChurchCeiling: new pc.Asset("gothicChurchCeiling", "container", { url: "/static/assets/models/gothic_church_ceiling.glb", }),
};

const getFlatObjectValues = obj => Object.values(obj).flatMap(val => (typeof val === 'object' && val.getFileUrl == undefined) ? getFlatObjectValues(val) : val); // flatten our assets so that individual assets inside "assets.sounds" are loaded in serial


const startTime = Date.now();
function printLoadTime(color,message){
    var loadTime = Date.now() - startTime; //window.performance.timing.domContentLoadedEventEnd- window.performance.timing.navigationStart;
    console.log("%c LOAD TIME: "+loadTime+" ( "+message+" )","color:"+color);
}
(()=>{ // load itself
    const assetListLoader = new pc.AssetListLoader(
        getFlatObjectValues(assets),
        pc.app.assets
    );
    printLoadTime('green',"game.js start load assets");
    assetListLoader.load(() => { 
        printLoadTime('red',"game.js assets done");
        LoadScene(); 

    }); 
})()

let cb = null;
$(document).on("keydown", function (e) {
    let ee = String.fromCharCode(e.which);
    let shiftKey = e.shiftKey
    if (ee == 'C'){
        let p = Game.droppedPosition;
        cb = NetworkNumberCube(p);
    }
    if (ee == 'Z'){
        let p = Game.droppedPosition;
        cb = myTemplates['NumberCube'].clone();
        pc.app.root.addChild(cb);
        cb.enabled=true;
        cb.moveTo(p);
        cb.script.numberInfo.setFraction(new Fraction(-1,1));
    }
    if (ee == 'X'){
        let p = Game.droppedPosition;
        cb = NumberSphere(p);
    }
    if (ee == 'M'){
        let p = Game.droppedPosition;
        cb = Game.multiblaster();
        cb.moveTo(p);
    }
    if (ee == 'B'){
        let p = Game.droppedPosition;
        cb = Game.bow(p);
    }
    if (ee == 'L'){
        let p=Game.droppedPosition.clone().add(pc.Vec3.UP);
        cb = Game.spikey();
        cb.moveTo(p);
    }
    if (ee == 'R'){
        Game.player.moveTo(Game.playerStartPos);
    }
    if (ee == 'V'){
        let p=Game.droppedPosition.clone().add(pc.Vec3.UP);
        cb = Game.sword(p);
    }
    if (ee == 'N'){
        let p=Game.droppedPosition.clone().add(pc.Vec3.UP);
        cb = Game.sheep(p);
    }
    if (ee == 'H'){
        let p2 = Game.droppedPosition2;
        console.log('h');
        cb = NumberHoop(p2.clone().add(new pc.Vec3(0,-.5,0)));
//        cb.translate(0,-2.2,0)
    }
    if (ee == 'J'){
        cb.rotate(new pc.Vec3(0,45,0)); console.log(cb.forward.trunc()+","+cb.right.trunc()+","+cb.up.trunc());
    }
    if (ee == 'T'){
        // Inverse transform test. Note rigidbody sync needed.
        let a = Cube(Game.droppedPosition2);
        let p = Game.droppedPosition2.clone().add(pc.Vec3.RIGHT);
        let b = Utils.Cubec(p,pc.Color.BLUE);
     //   let b = Cube(p);
        b.reparent(a);
        b.rigidbody.teleport(p);
         a.rigidbody.teleport(a.getPosition(),new pc.Vec3(0,45,0))
        b.rigidbody.syncEntityToBody();
        pc.app.root.addChild(a);
        cb=b;
    }
    if (ee == 'Y'){
        cb = CastleWall(Game.droppedPosition2);
    }

});


async function CreateTemplates(){
    const createTemplate = function (
        type,
        collisionOptions,
        template,
        rbType = "dynamic"
    ) {
        // add a render component (visible mesh)
        if (!template) {
            template = new pc.Entity();
            template.addComponent("render", {
                type: type,
            });
        }

        // ...a rigidbody component of type 'dynamic' so that it is simulated by the physics engine...
        template.addComponent("rigidbody", {
            type: rbType,
            mass: 50,
            restitution: 0.5,
        });

        // ... and a collision component
        template.addComponent("collision", collisionOptions);

        return template;
    };

    Game.templatize = function(asset,scale=1,extraFn=null){

        myTemplates[asset.name] = asset.resource.instantiateRenderEntity();
        myTemplates[asset.name].setLocalScale(pc.Vec3.ONE.clone().mulScalar(scale));
        myTemplates[asset.name].enabled = false;
        Game[asset.name] = function(p=pc.Vec3.ZERO){
            const clone = myTemplates[asset.name].clone();
            clone.name = asset.name;
            clone.enabled = true;
            pc.app.root.addChild(clone);
            clone.moveTo(p);
            if (typeof extraFn === 'function') extraFn(clone,asset);
            return clone;
        }
    }

    Game.templatize(assets.skybox_city,1);
    Game.templatize(assets.gothicChurchCeiling,10,(gothic,asset) => {Game.addCollider(gothic,asset,pc.RIGIDBODY_TYPE_KINEMATIC)});
    Game.templatize(assets.axis,.01,(axis) => { axis.setEulerAngles(0,0,0); axis.setPosition(0,12,0); });
    Game.axis();


}


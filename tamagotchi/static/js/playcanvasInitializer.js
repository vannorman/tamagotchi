const deviceType = 'webgl2';
var canvas;
var pcx
$(document).ready(function(){
    // from: https://playcanvas.github.io/#/physics/falling-shapes
    canvas = document.getElementById('application');
    LaunchGame(canvas);
});

function LaunchGame(canvas,deviceType,pcx,data={}) {
    pc.WasmModule.setConfig('DracoDecoderModule', {
            glueUrl: '/static/lib/draco/draco.wasm.js',
            wasmUrl: '/static/lib/draco/draco.wasm.wasm',
            fallbackUrl: '/static/lib/draco/draco.js'
        });

    pc.WasmModule.setConfig("Ammo", {
        glueUrl: "/static/lib/ammo/ammo.wasm.js",
        wasmUrl: "/static/lib/ammo/ammo.wasm.wasm",
        fallbackUrl: "/static/lib/ammo/ammo.js",
    });

    pc.WasmModule.getInstance("DracoDecoderModule", preload);

}
function preload(){
    pc.WasmModule.getInstance("Ammo", loadScene1); // THIS is what fires my game logic? WTF
    
}
const assets2 = {
};


function loadScene1() {
    const gfxOptions = {
        deviceTypes: [deviceType],
        glslangUrl: "/static/lib/glslang/glslang.js",
        twgslUrl: "/static/lib/twgsl/twgsl.js",
    };

    pc.createGraphicsDevice(canvas, gfxOptions).then((device) => {
        const createOptions = new pc.AppOptions();
        createOptions.graphicsDevice = device;

        const app = new pc.Application(canvas,{}); //AppBase(canvas);

        pc.app.keyboard = new pc.Keyboard(document.body)
        pc.app.mouse = new pc.Mouse(document.body);
        pc.app.elementInput = new pc.ElementInput(document.body);

//        app.init(createOptions);

        // Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);

        const assetListLoader = new pc.AssetListLoader(
            Object.values(assets2),
            app.assets
        );
        assetListLoader.load(() => {
            app.start();

            // set skybox - this DDS file was 'prefiltered' in the PlayCanvas Editor and then downloaded.
            ScriptManager.AppLoaded();


            // Portal4();
        });
    });
}


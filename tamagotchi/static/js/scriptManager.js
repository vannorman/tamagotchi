Object.defineProperty(window, "time", {
    get() {
        return Date.now().toString();
    }
});


var ScriptManager = {
    ScriptType : {
        Plain : "Plain",
        Playcanvas : "Playcanvas",
        Module : "Module"
    },
    dependencyScripts : [
        "/static/js/jquery-min.js",
//        "https://code.playcanvas.com/playcanvas-stable.min.js",
        "/static/lib/playcanvas-stable.min.js",
//        "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/socket.io/3.1.1/socket.io.min.js",
        "/static/js/playcanvasInitializer.js",
    ],
    modules : [
        // no node here
        //"/static/lib/exporters/core-exporter.mjs",
        //"/static/lib/exporters/gltf-exporter.mjs",

    ],
      playcanvasScripts : [
        "/static/js/collisionDetector.js",
        "/static/js/alwaysFaceCamera.js",
        "/static/js/thirdPersonController.js",
      ],
    gameScripts : [
        "/static/js/playerNameGenerator.js",
        "/static/js/playcanvasExtensions/extensions.js", 
        "/static/js/utils/extensions.js",
        "/static/js/utils/noise.js",
        "/static/js/utils/math.js",
        "/static/js/utils/jsonUtil.js",
        "/static/js/network.js",
        "/static/js/utils/util.js",
         "/static/js/game.js",  // Primary
        "/static/js/javascriptExtensions.js",
        "/static/js/main2.js", 
    ],
    Init(){
        this.LoadDependencyScripts();
        ScriptManager.loadNext();
    },
    LoadDependencyScripts(){
        ScriptManager.dependencyScripts.forEach(x => this.addScript(x,ScriptManager.ScriptType.Plain));
    },
    LoadPlaycanvasScripts(){
        ScriptManager.playcanvasScripts.forEach(x => this.addScript(x,ScriptManager.ScriptType.Playcanvas));
    },
    LoadModules(){
        ScriptManager.modules.forEach(x => this.addScript(x,ScriptManager.ScriptType.Module));
    },
    LoadGameScripts(){
        ScriptManager.gameScripts.forEach(x => this.addScript(x,ScriptManager.ScriptType.Plain));
    },
    queue: [],
    addScript: function(path,scriptType=ScriptManager.ScriptType.Plain) {
        this.queue.push({path:path,type:scriptType});
    },
    index : 0,
    loadNext: function() {
        if (this.queue.length > 0){
            let obj = this.queue.shift();
            //console.log("Script manager loading: "+(++this.index)+" "+obj.path.substr(obj.path.length - 15))
            if (obj.type == ScriptManager.ScriptType.Plain){
                var script = document.createElement('script');
                let scr = obj.path; 
                script.src = obj.path;
                script.onload = () => {
                    this.loadNext();
                };

                // Append the script to the body
                document.body.appendChild(script);

            } else if (obj.type == ScriptManager.ScriptType.Playcanvas){
                this.loadPlaycanvasScript(obj.path, function(){ScriptManager.loadNext();});
            } else if (obj.type == ScriptManager.ScriptType.Module){
                console.log("loadmod");
                this.loadModule(obj.path, function(){ScriptManager.loadNext();});

            }
        }
        
    },
    loadModule(url,callback) {
        console.log("hi?");
        var script = document.createElement('script');
        script.src = url;
        script.setAttribute("type","module");
        console.log(script);
        script.onload = () => {
            console.log("loaded: "+script.src);
            this.loadNext();
        };



    },
    loadPlaycanvasScript(url,callback) {
        return new Promise((resolve, reject) => {
          pc.app.assets.loadFromUrl(url, 'script', function(err, asset) {
            if (err) {
                // console.log("ERROR LOADING:"+url);
              reject(err);
            } else {
               // console.log("Script manager loaded: "+(++ScriptManager.index)+" "+url.substr(url.length - 15))
              resolve(asset);
              callback();
            }
          });
        });
      },
   async AppLoaded(){
        // console.log("App loaded at "+time.substr(time.length-4))
        ScriptManager.LoadPlaycanvasScripts();
        ScriptManager.LoadGameScripts();
        //ScriptManager.LoadModules();
        ScriptManager.loadNext();
        
        // All scripts have finished loading
        // console.log("App Scripts finished at "+time.substr(time.length-4))

        // Fire the "GameLoaded" event
        // console.log("Firing GameLoaded event.");
 

    },

}

ScriptManager.Init();

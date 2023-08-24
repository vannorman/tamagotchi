console.log("load network.js");
Network = {
    serverUrl :  'https://supermathworld.glitch.me/', // Glitch hosted server
    socketId : null,
    platerName : null,
    socket : null,
    instance : null,
    otherPlayers : {},
    Init(playerNameElement,playerEntity){
        Network.playerEntity = playerEntity; 
        // Flow:
        /*
            - Say hi to server with uuid
            - if (Does server know me? If yes, tell me my name and put it over my player
            - else (Was I new to server? If yes, tell server my fingerprint name and put it over my player
            - OK, now server keeps unique track of logged in players including me! Yay!
            - OK, now
            - Update function, ask server for names and positions of all things that aren't me, then create if needed then update pos and rot for each of them. 
            - Sooo...
                - We'll need a global dictionary of "things" so that we can label each thing that we tell the server about,
                - Then each client will also know which thing we're talking about due to its globally unique name. 
                - That way SERVER doesn't need to know anything about what's what, as long as all clients agree..
                - So do we have a global dict of things? Ummm..... we have ... Game.templatize .. hnmm
                - OK For now let's just do players as a cube! Hooray!
        */



        Network.socket = io.connect(this.serverUrl, {withCredentials: true});
        
        const data = { 
            visitorId : visitorId,
            playerName : PlayerNameGenerator.getRandomName(), // may be overwritten by server if visitorId exists on server

        };
        Network.socket.emit ('initialize',data); // let the server know we're here.
        
        // Bind network functions that we'll be able to receive 
        Network.socket.on ('initializePlayer', function (data) {
            Network.initializePlayer (data);
            playerNameElement.text = data.player.name;
        });

        Network.socket.on ('serverObjectsUpdate', function(data){ Network.ServerObjectsUpdate(data) });
        Network.socket.on ('serverPlayersUpdate', function(data){ Network.ServerPlayersUpdate(data) });
    }, initializePlayer(data){
        console.log(data)
    }, ServerObjectsUpdate(data){

    }, ServerPlayersUpdate(data){
//        console.log("server players update:"+JSON.stringify(data));
        data.players.forEach(x => {
            var pos = JsonUtil.JsonToVec3(x.position);
            if (x.visitorId == visitorId){
                //console.log("me found!");
            } else {
                if (Network.otherPlayers[x.visitorId] != null){
                    // Found this player that the server is telling us about, so update its pos. .. later
                } else {
                    // Didn't find player in our list, add it now.
                    
                    const obj = { position:JsonUtil.JsonToVec3(pos), entity : Network.createOtherPlayerEntity(x.name) };
                    Network.addOtherPlayerEntity(x.visitorId,obj);
                }
                // Check if moveto pos would telefrag me
                if (new pc.Vec3().distance(pos,Game.player.getPosition()) < 1.5){
                    pos = new pc.Vec3().add2(pos, pc.Vec3.UP);   // move other "ghost" player up so it doesn't telefrag
                }
                Network.otherPlayers[x.visitorId].entity.moveTo(pos);
//                console.log("moved "+x.visitorId+" to "+pos);

            }
        });
    }, addOtherPlayerEntity(key,obj){
        Network.otherPlayers[key] = obj;
    }, createOtherPlayerEntity(name){
       const other = Utils.Cubec(pc.Vec3.ZERO,Utils.RandomColor);
       const nameText = Utils.AddText({text:name,localPos:pc.Vec3.UP,scale:0.1,parent:other});
       nameText.addComponent('script');
       nameText.script.create('alwaysFaceCamera',{attributes:{reverse:true}});
       nameText.name="NameText";
       return other;
    }, update(dt){
        // Network.socket.emit ('updatePlayerByVisitorId',{visitorId:visitorId,position:Network.playerEntity.getPosition().trunc()}); // let the server know we're here.
        // Network.socket.emit ('requestServerPlayersUpdate'); // let the server know we're here.
    
    }, 

};


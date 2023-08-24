AudioManager = {
    sources : {},
    background : null,
    playBackground(args){
        const { source = null, volume = 1.0 } = args;
        if (this.background){
            this.background.destroy();
        }
        if (source == null) {
            console.log("Audio missing!"+JSON.stringify(source));
            return;
        }
        let aud = new pc.Entity("aud:"+source.name);
        pc.app.root.addChild(aud);
        aud.addComponent('sound');
        aud.sound.positional=false;
        aud.sound.addSlot('instancedSound:'+source.name, { 
            asset:source.id, 
            loop:true,
            autoPlay:true, 
            volume:volume, 
            pitch:1,
        });
        this.background = aud;
    },
    play(args){
        const {
            source = null,
            position = pc.Vec3.ZERO,
            pitch = 1,
            volume = 0.4,
            positional = false,
            loop = false} = args;

        if (source == null) {
            console.log("Audio missing!"+JSON.stringify(source));
            return;
        }
        let aud = new pc.Entity("aud:"+source.name);
        pc.app.root.addChild(aud);
        aud.setPosition(position);
        // add sound component
        aud.addComponent('sound');
        aud.sound.positional = positional;
        if (positional) aud.sound.distanceModel = pc.DISTANCE_EXPONENTIAL;
        aud.sound.addSlot('instancedSound:'+source.name, { 
            asset:source.id, 
            loop:loop,
            autoPlay:true, 
            volume:volume, 
            pitch:pitch,
        });
        let g = aud.getGuid();
        this.sources[g] = aud;
        setTimeout(function(){
            AudioManager.sources[g].destroy();  
            delete(AudioManager.sources[g])
        }, source.resource.buffer.duration * 1000);
    },
}


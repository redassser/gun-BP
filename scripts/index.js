import { world, MolangVariableMap } from "@minecraft/server";

const statLib = {
    "rr:g17": {
        semi: true,
        magSize: 17,
        maxDistance: 90, //blocks
        damage: 8, //half hearts
        intensity: 2
    },
    "rr:m4a1": {
        semi: false,
        magSize: 30,
        maxDistance: 300, //blocks
        damage: 6, //half hearts
        intensity: 4
    }
}

//world.afterEvents.itemStartUse()
world.afterEvents.itemUse.subscribe((e) => {
    trigger(e);
})
world.afterEvents.playerInteractWithEntity.subscribe((e) => {
    trigger({source:e.player,itemStack:e.itemStack})
})
function trigger(e) {
    if (!e.itemStack || !e.itemStack.hasTag("rr:gun")) return;
    const ammo = e.itemStack.getComponent("minecraft:durability");
    const opts = statLib[e.itemStack.typeId];
    if (ammo.maxDurability - ammo.damage > 0) { // Ammo
        //e.itemStack.triggerEvent("rr:takedamage")
        fire(e, opts);
    } else { //No ammo
        misfire(e)
    }
}
function fire(e, opts) {
    //Calculate Hits
    const playerhead = e.source.getHeadLocation(), playerview = e.source.getViewDirection();
    playerhead.y += 0.1; 
    const blk = e.source.dimension.getBlockFromRay(playerhead, playerview, { maxDistance: opts.maxDistance });
    const wet = e.source.dimension.getBlockFromRay(playerhead, playerview, { maxDistance: opts.maxDistance, includeLiquidBlocks: true });
    const ent = e.source.dimension.getEntitiesFromRay(playerhead, playerview, { maxDistance: opts.maxDistance })[1];
    if (wet&&wet.block.typeId === "minecraft:water"){
        let wetBlock = wet.block.location;
        let block = blk.block.location;
        let deltay = playerhead.y-(wetBlock.y + 0.6);
        let deltax = (playerview.x/playerview.y)*deltay;
        let deltaz = (playerview.z/playerview.y)*deltay;
        let wetLoc = { x: playerhead.x-deltax, y: wetBlock.y + 0.6, z: playerhead.z-deltaz };
        const vars = new MolangVariableMap();
        vars.setVector3("variable.direction", {x: 0, y: 1, z: 0});
        e.source.dimension.spawnParticle("rr:ripple", wetLoc, vars);
    }
    if (!blk && !ent) return; // Miss
    else if (ent && (!blk || !blk.distance || ent.distance <= blk.distance) && !ent.entity.hasComponent("minecraft:item")) {
        ent.entity.applyDamage(opts.damage, { cause: "entityAttack", damagingEntity: e.source });
        //player.dimension.spawnParticle("rr:blood", ent.entity.getHeadLocation());
    } else if (blk && (!ent || ent.distance > blk.distance)) {
        let newLoc = blk.block.location;
        if (!blk.block.dimension.getBlock(newLoc)) return;
        let face = { x: 0, y: 0, z: 0 };
        let dir;
        newLoc.x += blk.faceLocation.x; newLoc.y += blk.faceLocation.y; newLoc.z += blk.faceLocation.z;
        const vars = new MolangVariableMap();
        switch (blk.face) {
            case "East": face.x = 1; dir = "x"; break;
            case "West": face.x = -1; dir = "x"; break;
            case "Up": face.y = 1; dir = "y"; break;
            case "Down": face.y = -1; dir = "y"; break;
            case "South": face.z = 1; dir = "x"; break;
            case "North": face.z = -1; dir = "x"; break;
        }
        vars.setVector3("variable.direction", face);
        vars.setFloat("variable.intensity", opts.intensity);
        vars.setVector3("variable.playerlook", playerview);

        e.source.dimension.spawnParticle("rr:bullet", playerhead, vars);
        e.source.dimension.spawnParticle("rr:bulletexp", newLoc, vars);
        e.source.dimension.spawnParticle("rr:bullethole"+dir, newLoc, vars);
        e.source.dimension.spawnParticle("rr:bulletspray", newLoc, vars);
    }
}
function misfire(e) {
    e.source.sendMessage("misf")
}
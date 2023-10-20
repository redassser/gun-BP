import { world, MolangVariableMap } from "@minecraft/server";

const statLib = {
    "rr:g17": {
        semi: true,
        magSize: 17,
        maxDistance: 40, //blocks
        damage: 8, //half hearts
        intensity: 2
    },
    "rr:m1a1": {
        semi: false,
        magSize: 17,
        maxDistance: 40, //blocks
        damage: 8, //half hearts
        intensity: 2
    }
}
const list = (function () {return Object.keys(statLib)})();

//world.afterEvents.itemStartUse()
world.afterEvents.itemUse.subscribe((e) => {
    if (!list.includes(e.itemStack.typeId)) return;
    const player = e.source;
    const opts = statLib[e.itemStack.typeId];
    const ent = player.getEntitiesFromViewDirection({ maxDistance: opts.maxDistance })[0];
    const blk = player.getBlockFromViewDirection({ maxDistance: opts.maxDistance });
    if (!blk && !ent) { player.sendMessage("mis"); } // TOTAL MISS!!
    else if (ent && (!blk || !blk.distance || ent.distance <= blk.distance) && !ent.entity.hasComponent("minecraft:item")) { ent.entity.applyDamage(opts.damage, { cause: "entityAttack", damagingEntity: player }) } 
    else if (blk && (!ent || ent.distance > blk.distance)) {
        let newLoc = blk.block.location;
        newLoc.x += blk.faceLocation.x; newLoc.y += blk.faceLocation.y; newLoc.z += blk.faceLocation.z;
        const vars = new MolangVariableMap();
        switch (blk.face) {
            case "Down": vars.setVector3("variable.direction", { x: 0, y: -1, z: 0 }); break;
            case "East": vars.setVector3("variable.direction", { x: 1, y: 0, z: 0 }); break;
            case "North": vars.setVector3("variable.direction", { x: 0, y: 0, z: -1 }); break;
            case "South": vars.setVector3("variable.direction", { x: 0, y: 0, z: 1 }); break;
            case "Up": vars.setVector3("variable.direction", { x: 0, y: 1, z: 0 }); break;
            case "West": vars.setVector3("variable.direction", { x: -1, y: 0, z: 0 }); break;
        }
        player.dimension.spawnParticle("rr:bullethole", newLoc);
        vars.setFloat("variable.intensity", opts.intensity)
        player.dimension.spawnParticle("rr:bulletspray", newLoc, vars);
    }
})
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
        maxDistance: 4000, //blocks
        damage: 8, //half hearts
        intensity: 4
    }
}
const list = (function () {return Object.keys(statLib)})();

//world.afterEvents.itemStartUse()
world.afterEvents.itemUse.subscribe((e) => {
    if (!list.includes(e.itemStack.typeId)) return;
    const player = e.source;
    const opts = statLib[e.itemStack.typeId];
    const playerhead = player.getHeadLocation();
    playerhead.y += 0.1;
    const blk = player.dimension.getBlockFromRay(playerhead, player.getViewDirection(), { maxDistance: opts.maxDistance });
    const ent = player.getEntitiesFromViewDirection({ maxDistance: opts.maxDistance })[0];
    
    if (!blk && !ent) { player.sendMessage("mis"); } // TOTAL MISS!!
    else if (ent && (!blk || !blk.distance || ent.distance <= blk.distance) && !ent.entity.hasComponent("minecraft:item")) {
        ent.entity.applyDamage(opts.damage, { cause: "entityAttack", damagingEntity: player });
        //player.dimension.spawnParticle("rr:blood", ent.entity.getHeadLocation());
    } else if (blk && (!ent || ent.distance > blk.distance)) {
        let newLoc = blk.block.location;
        let face = { x: 0, y: 0, z: 0 };
        newLoc.x += blk.faceLocation.x; newLoc.y += blk.faceLocation.y; newLoc.z += blk.faceLocation.z;
        const vars = new MolangVariableMap();
        switch (blk.face) {
            case "East": face.x = 1; newLoc.x += .01; break;
            case "West": face.x = -1; newLoc.x -= .01; break;
            case "Up": face.y = 1; newLoc.y += .01; break;
            case "Down": face.y = -1; newLoc.y -= .01; break;
            case "South": face.z = 1; newLoc.z += .01; break;
            case "North": face.z = -1; newLoc.z -= .01; break;
        }
        vars.setVector3("variable.direction", face);
        vars.setFloat("variable.intensity", opts.intensity)

        player.dimension.spawnParticle("rr:bulletexp", newLoc, vars);
        player.dimension.spawnParticle("rr:bullethole", newLoc);
        player.dimension.spawnParticle("rr:bulletspray", newLoc, vars);
    }
})
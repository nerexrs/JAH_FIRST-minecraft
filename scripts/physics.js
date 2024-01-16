import * as THREE from "three";

export class Physics {
	constructor() {}
	/**JAH FIRST
	 * Moves the physics simulation forward in time by 'dt'
	 * @param {number} dt
	 * @param {Player} player
	 * @param {World} World
	 */
	update(dt, player, world) {
		this.detectCollisions(player, world);
	}
	/**JAH FIRST
	 * @param {Player} player
	 * @param {World} World
	 */
	detectCollisions(player, world) {
		const candidates = this.broadPhase(player, world);
		const collisions = this.narrowPhase(candidates, player);

		if (collisions.length > 0) {
			this.resolveCollisions(collisions);
		}
	}
	/**JAH FIRST
	 * Performs a rough search against the world to return all
	 * possible blocks the player may be colliding with
	 * @param {Player} player
	 * @param {World} World
	 * @returns {[]}
	 */
	broadPhase(player, world) {
		const candidates = [];
		//JAH FIRST - Get the extents of the player
		const extents = {
			x: {
				min: Math.floor(player.position.x - player.radius),
				max: Math.ceil(player.position.x + player.radius),
			},
			y: {
				min: Math.floor(player.position.y - player.radius),
				max: Math.ceil(player.position.y),
			},
			z: {
				min: Math.floor(player.position.z - player.radius),
				max: Math.ceil(player.position.z + player.radius),
			},
		};
		// Loop through all blocks next to the block the center of the player is in
		// If they aren't empty, then they are a possible collision candidate
		for (let x = minX; x <= maxX; x++) {
			for (let y = minY; y <= maxY; y++) {
				for (let z = minZ; z <= maxZ; z++) {
					const blockId = world.getBlock(x, y, z)?.id;
					if (blockId && blockId !== blocks.empty.id) {
						const block = { x, y, z };
						candidates.push(block);
						this.addCollisionHelper(block);
					}
				}
			}
		}

		//console.log(`Broadphase Candidates: ${candidates.length}`);
		return candidates;
	}

	/**
	 * Narrows down the blocks found in the broad-phase to the set
	 * of blocks the player is actually colliding with
	 * @param {{ id: number, instanceId: number }[]} candidates
	 * @returns
	 */
	narrowPhase(candidates, player) {}
}

//JAH
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";
import { RNG } from "./rng.js";
import { blocks, resources } from "./blocks.js";

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial();

export class World extends THREE.Group {
	/**
	 * @type {{
	 * id: numer,
	 * instanceId: number
	 * }[][][]}
	 */
	data = [];
	params = {
		seed: 0,
		terrain: {
			scale: 30,
			magnitude: 0.5,
			offset: 0.2,
		},
	};

	constructor(size = { width: 64, height: 32 }) {
		super();
		this.size = size;
	}
	generate() {
		const rng = new RNG(this.params.seed);
		this.initializeTerrain();
		this.generateResources(rng);
		this.generateTerrain(rng);
		this.generateMeshes();
	}
	/**
	 * JAH FIRST
	 * initializing the world terrain data
	 */

	initializeTerrain() {
		this.data = [];
		for (let x = 0; x < this.size.width; x++) {
			const slice = [];
			//JAH FIRST - enredado pero lo entendí
			//JAH FIRST - x = 1 y ahí z hace las veces del size el ciclo
			//JAH FIRST - Termina z y de ahí x=2 y se repite, por eso es un cuadro exacto de bloques
			for (let y = 0; y < this.size.height; y++) {
				const row = [];
				for (let z = 0; z < this.size.width; z++) {
					// block.position.set(x, y, z);
					// this.add(block);
					row.push({
						id: blocks.empty.id,
						instanceId: null,
					});
				}
				slice.push(row);
			}
			this.data.push(slice);
		}
	}
	/**JAH FIRST
	 * Generates the resources (coal, stone, etc.) for the world
	 */
	generateResources(rng) {
		const simplex = new SimplexNoise(rng);
		resources.forEach((resource) => {
			for (let x = 0; x < this.size.width; x++) {
				for (let y = 0; y < this.size.height; y++) {
					for (let z = 0; z < this.size.width; z++) {
						const value = simplex.noise3d(
							x / resource.scale.x,
							y / resource.scale.y,
							z / resource.scale.z
						);
						if (value > resource.scarcity) {
							this.setBlockId(x, y, z, resource.id);
						}
					}
				}
			}
		});
	}
	/**
	 * JAH FIRST
	 * Generates the world terrain data
	 */

	generateTerrain(rng) {
		const simplex = new SimplexNoise(rng);
		for (let x = 0; x < this.size.width; x++) {
			for (let z = 0; z < this.size.width; z++) {
				// Compute noise value at this x-z location
				const value = simplex.noise(
					x / this.params.terrain.scale,
					z / this.params.terrain.scale
				);
				// Scale noise based on the magnitude/ offset
				const scaledNoise =
					this.params.terrain.offset + this.params.terrain.magnitude * value;
				// Compute final height of terrain at this location
				let height = Math.floor(this.size.height * scaledNoise);
				// Clamp between 0 and max height
				height = Math.max(0, Math.min(height, this.size.height - 1));
				// Fill in everything below
				for (let y = 0; y < this.size.height; y++) {
					if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
						this.setBlockId(x, y, z, blocks.dirt.id);
						// Fill in everything below with dirt
					} else if (y === height) {
						this.setBlockId(x, y, z, blocks.grass.id);
						// Clear everything above
					} else if (y > height) {
						this.setBlockId(x, y, z, blocks.empty.id);
					}
				}
			}
		}
	}

	generateMeshes() {
		this.clear();
		const maxCount = this.size.width * this.size.width * this.size.height;
		//JAH FIRST - el cuadrado del ancho multiplicado por el alto da el número de cubos.
		//JAH FIRST - esto supongo que es porque en el eje de la altura hay una base y una superficie
		//JAH FIRST - que representaría ese ancho
		// Create lookup table of InstancedMesh's with the block id being the key
		const meshes = {};
		Object.values(blocks)
			.filter((blockType) => blockType.id !== blocks.empty.id)
			.forEach((blockType) => {
				const mesh = new THREE.InstancedMesh(
					geometry,
					blockType.material,
					maxCount
				);
				mesh.name = blockType.name;
				mesh.count = 0;
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				meshes[blockType.id] = mesh;
			});

		const matrix = new THREE.Matrix4();
		for (let x = 0; x < this.size.width; x++) {
			//JAH FIRST - enredado pero lo entendí
			//JAH FIRST - x = 1 y ahí z hace las veces del size el ciclo
			//JAH FIRST - Termina z y de ahí x=2 y se repite, por eso es un cuadro exacto de bloques
			for (let y = 0; y < this.size.height; y++) {
				for (let z = 0; z < this.size.width; z++) {
					const blockId = this.getBlock(x, y, z).id;

					if (blockId === blocks.empty.id) continue;

					const mesh = meshes[blockId];
					const instanceId = mesh.count;
					if (!this.isBlockObscured(x, y, z)) {
						matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
						mesh.setMatrixAt(instanceId, matrix);
						this.setBlockInstanceId(x, y, z, instanceId);
						mesh.count++;
					}
				}
			}
		}
		this.add(...Object.values(meshes));
	}

	/**
	 * JAH FIRST - the block data is the block id(type of block)
	 * Gets the block data at (x, y, z)
	 * JAH FIRST - the instance ID is the mesh instance at
	 * JAH FIRST - that particular set of  coordinates, block data is the block id, the type
	 * JAH FIRST - and the instance id wich is the mesh instance in a coordinate
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @returns {{id: number, instanceId: number}}
	 */
	getBlock(x, y, z) {
		if (this.inBounds(x, y, z)) {
			return this.data[x][y][z];
		} else {
			return null;
		}
	}

	/**
	 * Sets the block id for the block at (x, y, z)
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} id
	 */
	setBlockId(x, y, z, id) {
		if (this.inBounds(x, y, z)) {
			this.data[x][y][z].id = id;
		}
	}

	/**
	 * Sets the block instance id for the block at (x, y, z)
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} instanceId
	 */
	setBlockInstanceId(x, y, z, instanceId) {
		if (this.inBounds(x, y, z)) {
			this.data[x][y][z].instanceId = instanceId;
		}
	}

	/**
	 * JAH FIRST - mira si las coordenadas están dentro de
	 * JAH FIRST - los limites de nuestro data ray, si está
	 * JAH FIRST - por fuera de los limites lo marca como falso
	 * JAH FIRST - esto nos previene de setear una coordenada fuera de los limites
	 * Checks if the (x, y, z) coordinates are within bounds,
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @returns {boolean}
	 */
	inBounds(x, y, z) {
		if (
			x >= 0 &&
			x < this.size.width &&
			y >= 0 &&
			y < this.size.height &&
			z >= 0 &&
			z < this.size.width
		) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Returns true if this block is completely hidden by other blocks
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @returns {boolean}
	 */
	isBlockObscured(x, y, z) {
		const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
		const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
		const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
		const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
		const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
		const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

		// If any of the block's sides is exposed, it is not obscured
		if (
			up === blocks.empty.id ||
			down === blocks.empty.id ||
			left === blocks.empty.id ||
			right === blocks.empty.id ||
			forward === blocks.empty.id ||
			back === blocks.empty.id
		) {
			return false;
		} else {
			return true;
		}
	}
}

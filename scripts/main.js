//JAH FIRST
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { World } from "./world.js";
import { setupUI } from "./ui";
import { Player } from "./player.js";
import { Physics } from "./physics";

const stats = new Stats();
document.body.append(stats.dom);
//JAH FIRST - Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//JAH FIRST - Camera setup
const orbitCamera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight
);
orbitCamera.position.set(-20, 20, -20);

//JAH FIRST - controls
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

//JAH FIRST - Scene setup
const scene = new THREE.Scene();
const player = new Player(scene);
const physics = new Physics(scene);
const world = new World();
world.generate();
scene.add(world);

//JAH FIRST - setupLights
function setupLights() {
	const sun = new THREE.DirectionalLight();
	sun.position.set(50, 50, 50);
	sun.castShadow = true;

	// Set the size of the sun's shadow box
	sun.shadow.camera.left = -40;
	sun.shadow.camera.right = 40;
	sun.shadow.camera.top = 40;
	sun.shadow.camera.bottom = -40;
	sun.shadow.camera.near = 0.1;
	sun.shadow.camera.far = 200;
	sun.shadow.mapSize = new THREE.Vector2(512, 512);
	sun.shadow.bias = -0.001;

	scene.add(sun);

	const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
	// scene.add(shadowHelper);
	const ambient = new THREE.AmbientLight();
	ambient.intensity = 0.1;
	scene.add(ambient);
}

//JAH FIRST - Render loop
let previousTime = performance.now();
function animate() {
	let currentTime = performance.now();
	let dt = (currentTime - previousTime) / 1000;

	physics.update(dt, player, world);
	requestAnimationFrame(animate);
	player.applyInputs(dt);
	// Renderiza la escena
	renderer.render(
		scene,
		player.controls.isLocked ? player.camera : orbitCamera
	);
	stats.update();

	previousTime = currentTime;
}

//JAH FIRST - resize
window.addEventListener("resize", () => {
	//JAH FIRST - update camera ratio, what is looking
	orbitCamera.aspect = window.innerWidth / window.innerHeight;
	//JAH FIRST - como hicimos un cambio en la camara
	//JAH FIRST - toca llamar a este metodo para cambiar la matriz de proyección
	//JAH FIRST - si no lo pones lo que va a suceder
	//JAH FIRST - es que en el resize se va a estirar
	//JAH FIRST - el modelo 3d, poner los()xq son metodos
	orbitCamera.updateProjectionMatrix();
	player.aspect = window.innerWidth / window.innerHeight;
	player.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
setupUI(world, player, physics);
animate();

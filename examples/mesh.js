import * as THREE from "three";
import * as GEOLIB from "geolib";

import { MapControls } from "three/examples/jsm/controls/OrbitControls";

//global variables
let scene;
let camera;
let renderer;
let controls;
const material = new THREE.MeshPhongMaterial({
	color: 0x00ff00,
	transparent: true,
	opacity: 0.25,
});
// var material2 = new THREE.MeshLambertMaterial({
// 	color: 0x0000ff,
// 	transparent: true,
// 	opacity: 0.5,
// });

let ground; //global ground

function initialize() {
	//local variables
	const container = document.getElementById("container");

	//initialize threejs scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);

	//initialize threejs camera
	camera = new THREE.PerspectiveCamera(
		25,
		window.innerWidth / window.innerHeight,
		1,
		100,
	);

	camera.position.set(10, 5, 5);

	//initialize lights
	// const light1 = new THREE.AmbientLight(0xfafafa, 0.25);
	let light0 = new THREE.AmbientLight(0xfafafa, 0.25);

	let light1 = new THREE.PointLight(0xfafafa, 0.4);
	light1.position.set(200, 90, 40);

	let light2 = new THREE.PointLight(0xfafafa, 0.4);
	light2.position.set(200, 90, -40);

	scene.add(light0);
	scene.add(light1);
	scene.add(light2);

	//initialize helpers
	// const lightHelper0 = new THREE.PointLightHelper(light0);
	// const lightHelper1 = new THREE.PointLightHelper(light1);
	// const lightHelper2 = new THREE.PointLightHelper(light2);
	// scene.add(lightHelper0, lightHelper1, lightHelper2);

	const gridHelper = new THREE.GridHelper(
		100,
		100,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);

	const grid = new THREE.GridHelper();

	scene.add(gridHelper);

	//initialize geometry
	// const geometry = new THREE.BoxGeometry(1, 1, 1);
	// const material = new THREE.MeshPhongMaterial({
	// 	color: 0xffffff,
	// });
	// const mesh = new THREE.Mesh(geometry, material);
	// scene.add(mesh);

	//initialize renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	container.appendChild(renderer.domElement);

	//initialize controls
	controls = new MapControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.screenSpacePanning = false;
	controls.maxDistance = 800;

	controls.update();

	//initialize resize
	window.addEventListener("resize", resize, false);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	controls.update();
}

function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function createGround() {
	const shape = new THREE.Shape();
	// camera.position.set(new THREE.Vector3(1, 1, 1));
	shape.moveTo(0, 0);
	shape.lineTo(0, 100);
	shape.lineTo(100, 100);
	shape.lineTo(100, 0);
	// shape.lineTo(0, 0);

	// shape.moveTo(3.7256676, 0);
	// shape.lineTo(3.7257336, 0);
	// shape.lineTo(1, 1);
	// shape.lineTo(0, 1);
	// shape.lineTo(0, 0);

	// shape.moveTo(3.7256676, 51.0442347);
	// shape.lineTo(3.7257336, 51.044234);
	// shape.lineTo(3.7257315, 51.0441559);
	// shape.lineTo(3.7256655, 51.0441566);
	// shape.lineTo(3.7256676, 51.0442347);

	// shape.moveTo(3.7256676, 0);
	// shape.lineTo(3.7257336, 0);
	// shape.lineTo(3.7257315, 0);
	// shape.lineTo(3.7256655, 0);
	// shape.lineTo(3.7256676, 0);

	const geometry = new THREE.ShapeGeometry(shape);
	geometry.rotateX(Math.PI / 2);
	geometry.rotateZ(Math.PI);
	geometry.translate(50, 0.05, -50);

	// const mesh = new THREE.Mesh(geometry, material);
	ground = new THREE.Mesh(geometry, material);
	ground.name = "GROUND";
	// mesh.translateY(-51.0442347);
	// mesh.setRotationFromAxisAngle(-90);
	scene.add(ground);
}

function addLine() {
	const material2 = new THREE.LineBasicMaterial({
		color: 0xff0000,
	});

	const points = [];
	points.push(new THREE.Vector3(-10, 0, 0));
	points.push(new THREE.Vector3(0, 10, 0));
	points.push(new THREE.Vector3(10, 0, 0));

	const geometry = new THREE.BufferGeometry().setFromPoints(points);

	const line = new THREE.Line(geometry, material2);
	scene.add(line);
}
let started = false;
let line = null;

function addRaycaster() {
	const raycaster = new THREE.Raycaster(); //raycaster
	const mousePos = new THREE.Vector2(); //mouse pos
	const mouseMove = new THREE.Vector2(); //last mouse movement position
	let draggable; //last clicked object;

	window.addEventListener("click", (event) => {
		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
		mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
		// console.log(mousePos);

		raycaster.setFromCamera(mousePos, camera);
		let found = raycaster.intersectObjects(scene.children);
		// console.log(found.length);
		if (found.length > 0) {
			// console.log(1);
			found.forEach((ray) => {
				// console.log(ray);
				if (ray.object.name == "GROUND") {
					createLine(ray);
				}
			});
		}
	});
}

function createLine(coordinates) {
	console.log(coordinates.point);
	// coordinates.forEach((element) => {
	// 	// console.log(element.point);
	// 	console.log("CREATE-LINE-()");
	// 	console.log(element);
	// });

	// let line = new THREE.LineBasicMaterial({
	// 	color: 0xff0000,
	// });
}

initialize();
animate();
createGround();
// addLine();
addRaycaster();

import * as THREE from "three";
import * as GEOLIB from "geolib";

import { MapControls } from "three/examples/jsm/controls/OrbitControls";

//global variables
let scene;
let camera;
let renderer;
let controls;

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
	const lightHelper0 = new THREE.PointLightHelper(light0);
	const lightHelper1 = new THREE.PointLightHelper(light1);
	const lightHelper2 = new THREE.PointLightHelper(light2);

	const gridHelper = new THREE.GridHelper(
		100,
		100,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);

	const grid = new THREE.GridHelper();

	scene.add(lightHelper0, lightHelper1, lightHelper2);
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

function getData() {
	fetch("./data/ghent.geojson").then((res) => {
		res.json().then((data) => {
			// return data.features;
			// console.log(data.features[0].geometry.coordinates);
			loadBuildings(data.features);
		});
	});
}

function createMesh2() {
	const shape = new THREE.Shape();
	// camera.position.set(new THREE.Vector3(1, 1, 1));
	// shape.moveTo(0, 0);
	// shape.lineTo(0, 2.4);
	// shape.lineTo(4, 4);
	// shape.lineTo(2.4, 0);
	// shape.lineTo(0, 0);

	shape.moveTo(3.7256676, 0);
	shape.lineTo(3.7257336, 0);
	shape.lineTo(1, 1);
	shape.lineTo(0, 1);
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

	const mesh = new THREE.Mesh(geometry, material);
	// mesh.translateY(-51.0442347);
	// mesh.setRotationFromAxisAngle(-90);
	scene.add(mesh);
}

function createBuilding() {
	const shape = new THREE.Shape();

	shape.moveTo(3.7256676, 51.0442347);
	shape.lineTo(3.7257336, 51.044234);
	shape.lineTo(3.7257315, 51.0441559);
	shape.lineTo(3.7256655, 51.0441566);
	shape.lineTo(3.7256676, 51.0442347);

	const geometry = new THREE.ShapeGeometry(shape);

	const material = new THREE.MeshPhongMaterial({
		color: 0x00ff00,
	});

	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	// const extrudeSettings = {
	// 	steps: 1,
	// 	depth: 1,
	// 	bevelEnabled: false,
	// 	// bevelThickness: 1,
	// 	// bevelSize: 1,
	// 	// bevelOffset: 0,
	// 	// bevelSegments: 1,
	// };
	// const geometry2 = new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function normalizeCoordinates(objPosi, centerPosi) {
	// Get GPS distance
	let dis = GEOLIB.getDistance(objPosi, centerPosi);

	// Get bearing angle
	let bearing = GEOLIB.getRhumbLineBearing(objPosi, centerPosi);

	// Calculate X by centerPosi.x + distance * cos(rad)
	let x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

	// Calculate Y by centerPosi.y + distance * sin(rad)
	let y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);

	// Reverse X (it work)
	return [-x / 100, y / 100];
}

initialize();
animate();
createMesh2();

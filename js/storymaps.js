import * as THREE from "three";
import * as GEOLIB from "geolib";

import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

//global variables
let scene, camera, renderer, controls, iR, stats, color_buildings;

// const center = [3.720708, 51.052912]; //ghent
const center = [3.227183, 51.209651]; //bruges

function initialize(config) {
	if (!config) {
		config = {
			container: "container",
			color_background: 0x222222,
			color_buildings: 0x2a2a2a,
			grid: { primary: 0x555555, secondary: 0x333333 },
			debug: true,
		};
	}
	//initializes threeJS scene.
	//variables:
	color_buildings = config.color_buildings;
	//background_color is a hexadecimal value of the threejs scene's background
	//local variables
	const container = document.getElementById(config.container);

	//initialize threejs scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(config.color_background);

	//initialize threejs camera
	camera = new THREE.PerspectiveCamera(
		25,
		window.innerWidth / window.innerHeight,
		1,
		100,
	);
	camera.position.set(8, 4, 1);

	// //initialize group
	// iR = new THREE.Group();
	// iR = "Interactive Root";

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
		150,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);
	// scene.add(lightHelper0, lightHelper1, lightHelper2);
	scene.add(gridHelper);

	//initialize geometry
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshPhongMaterial({
		color: 0x00ff00,
	});
	const mesh = new THREE.Mesh(geometry, material);
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
	// controls.update(); //runs in animate()

	//initialize resize
	window.addEventListener("resize", resize, false);

	stats = new Stats();
	container.appendChild(stats.dom);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	controls.update();
	stats.update();
}

function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadData() {
	fetch("./data/bruges.geojson").then((res) => {
		res.json().then((data) => {
			// return data.features;
			// console.log(data.features[0].geometry.coordinates);
			loadBuildings(data.features);
		});
	});
}

function loadBuildings(data) {
	data.forEach((element) => {
		if (element.properties.building) {
			addBuilding(
				element.geometry.coordinates,
				element.properties["building:levels"],
				element.properties,
			);
			// console.log("bla");
		}
	});
	// console.log(data);
	// for (let i = 0; i < 1; i++) {
	// 	console.log(data[i]);
	// 	// if (data.properties) {
	// 	// 	console.log("bla");
	// 	// }
	// }
}

function addBuilding(coordinates, height = 1, info) {
	//a building's coordinates are an array of an array of coordinates, with the latter being a polygon.
	//buildings can have multiple polygons.
	//so you need nested for each -> one per polygon and one for all points in the polygon
	// console.log(coordinates);
	// coordinates.forEach((element) => {});
	// let arrayOfBuildings;
	// let counter = 0;

	generateBuilding(coordinates);
}

function generateBuilding(coordinates) {
	//single building with multiple polygons
	// arrayOfPolygons["group" + counter] = new THREE.Group();

	coordinates.forEach((polygon, index) => {
		let shape = new THREE.Shape(); //only a single polygon?

		polygon.forEach((coordinates, index) => {
			let coords = normalizeCoordinates(coordinates, center);
			if (index == 0) {
				shape.moveTo(coords[0], coords[1]);
			} else {
				shape.lineTo(coords[0], coords[1]);
			}
			// console.log(coordinates);
			// shape.moveTo(coordinates[0], coordinates[1]);
		});
		let height = 1;
		let geometry = new THREE.ExtrudeBufferGeometry(shape, {
			curveSegments: 1,
			depth: 0.05 * height,
			bevelEnabled: false,
		});

		geometry.rotateX(Math.PI / 2);
		geometry.rotateZ(Math.PI);

		// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const material = new THREE.MeshPhongMaterial({
			color: color_buildings,
		});
		const mesh = new THREE.Mesh(geometry, material);
		// console.log(mesh);
		scene.add(mesh);
		// console.log("end of polygon");
		// arrayOfPolygons["group" + counter].add(shape);
		// element[0];
	});
}

function normalizeCoordinates(objectPosition, centerPosition) {
	// Get GPS distance
	let dis = GEOLIB.getDistance(objectPosition, centerPosition);

	// Get bearing angle
	let bearing = GEOLIB.getRhumbLineBearing(objectPosition, centerPosition);

	// Calculate X by centerPosi.x + distance * cos(rad)
	let x = centerPosition[0] + dis * Math.cos((bearing * Math.PI) / 180);

	// Calculate Y by centerPosi.y + distance * sin(rad)
	let y = centerPosition[1] + dis * Math.sin((bearing * Math.PI) / 180);

	// Reverse X (it work)
	return [-x / 100, y / 100];
}

export { initialize, animate, loadData };

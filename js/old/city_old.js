import * as THREE from "three";
import * as GEOLIB from "geolib";
// import { resize } from "./helpers";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
// import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

import Stats from "three/examples/jsm/libs/stats.module";

//configuration and setup variables
let color_buildings;
// let config; //local config

//general threejs variables
let scene, camera, renderer, controls, stats;

//storymap specific variables
// let city_mesh, building_mesh, helper;
const center = [3.227183, 51.209651]; //bruges || [3.720708, 51.052912]; //ghent

// const raycaster = new THREE.Raycaster();
// const pointer = new THREE.Vector2();

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

	//RAYCASTING
	// const geometryHelper = new THREE.ConeGeometry(20, 100, 3);
	// geometryHelper.translate(0, 50, 0);
	// geometryHelper.rotateX(Math.PI / 2);
	// helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
	// scene.add(helper);
	// container.addEventListener("pointermove", onPointerMove);

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

	//const gridHelper
	let grid = new THREE.GridHelper(
		100,
		150,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);
	scene.add(grid);

	//axis
	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	//initialize geometry
	// const geometry = new THREE.BoxGeometry(1, 1, 1);
	// const material = new THREE.MeshPhongMaterial({
	// 	color: 0x00ff00,
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
	// controls.update(); //runs in animate()

	//initialize resize
	window.addEventListener("resize", resize, false);

	stats = new Stats();
	container.appendChild(stats.dom);
}

function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	controls.update();
	stats.update();
}

async function generateCity() {
	// LOAD GEOJSON DATA
	let data = await loadGeoJsonAsync();
	// console.log(data);

	// LOADBUILDINGS
	//foreach building, call the addBuilding function
	data.forEach((element) => {
		if (element.properties.building) {
			create3dObject(element);
			// addBuilding(
			// 	element.geometry.coordinates,
			// 	element.properties["building:levels"],
			// 	element.properties,
			// );
			// console.log("bla");
		}
	});
}

async function loadGeoJsonAsync() {
	return await fetch("./data/bruges.geojson").then((response) => {
		return response.json().then((data) => {
			return data.features;
		});
	});
}

function create3dObject(data) {
	let coordinates = data.geometry.coordinates;
	let building_levels = data.properties["building:levels"] || 1; //if building:levels property exists use it, otherwise use 1
	let properties = data.properties;

	if (properties.building) {
		//if data is a building property (if it's a building)
		generateBuilding(coordinates, building_levels);
	}
}

function generateBuilding(coordinates, height = 1) {
	//single building with multiple polygons
	let buildingGeometry = new THREE.BufferGeometry();
	// arrayOfPolygons["group" + counter] = new THREE.Group();

	//for each of the coordinate groups
	coordinates.forEach((polygon, index) => {
		//generate shape
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

		// let height = 1;
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

		mesh.updateMatrix();
		// buildingGeometry.merge(mesh);

		// console.log(mesh);
		scene.add(mesh);

		// console.log("end of polygon");
		// arrayOfPolygons["group" + counter].add(shape);
		// element[0];
	});
}

function generateRoads(coordinates) {}

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

export { initialize, animate, generateCity as generate };

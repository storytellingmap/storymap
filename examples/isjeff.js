//Data complied from OpenStreetMap: https://www.openstreetmap.org/

// isjeff.com
// 2020.06.13
// By Jeff Wu

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js";
import * as GEOLIB from "geolib";
import Stats from "three/examples/jsm/libs/stats.module";
import { MapControls } from "https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/controls/OrbitControls.js";

var scene, renderer, camera, controls, stats;
var MAT_BUILDING;
// const center = [-3.188822, 55.943686];
// const center = [3.720708, 51.052912];
const center = [3.227183, 51.209651];
var iR;

//const api = "https://lavrenov.io/geojson.txt"
const api =
	"https://gistcdn.githack.com/isjeffcom/a611e99aa888534f67cc2f6273a8d594/raw/9dbb086197c344c860217826c59d8a70d33dcb54/gistfile1.txt";

Awake();

// When user resize window
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
	if (scene) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
}

onWindowResize();

function Awake() {
	// console.log("scene below:");
	// console.log(scene);
	let cont = document.getElementById("container");

	// Init scene
	scene = new THREE.Scene();

	scene.background = new THREE.Color(0x222222);

	// Init Camera
	camera = new THREE.PerspectiveCamera(
		25,
		window.clientWidth / window.clientHeight,
		1,
		100,
	);
	camera.position.set(8, 4, 0);

	// Init group
	iR = new THREE.Group();
	iR.name = "Interactive Root";
	scene.add(iR);

	// Init Light
	let light0 = new THREE.AmbientLight(0xfafafa, 0.25);

	let light1 = new THREE.PointLight(0xfafafa, 0.4);
	light1.position.set(200, 90, 40);

	let light2 = new THREE.PointLight(0xfafafa, 0.4);
	light2.position.set(200, 90, -40);

	scene.add(light0);
	scene.add(light1);
	scene.add(light2);

	const lightHelper0 = new THREE.PointLightHelper(light0);

	let gridHelper = new THREE.GridHelper(
		60,
		160,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);
	scene.add(lightHelper0, gridHelper);

	// let geometry = new THREE.BoxGeometry(1,1,1)
	// let material = new THREE.MeshBasicMaterial({color: 0x00ff00})
	// let mesh = new THREE.Mesh(geometry, material)
	// this.scene.add(mesh)

	// Init renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	cont.appendChild(renderer.domElement);

	//stats
	stats = new Stats();
	cont.appendChild(stats.dom);

	//mapcontrols
	controls = new MapControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.screenSpacePanning = false;
	controls.maxDistance = 800;

	controls.update();

	MAT_BUILDING = new THREE.MeshPhongMaterial();

	Update();

	GetGeoJson();
}

function Update() {
	requestAnimationFrame(Update);

	renderer.render(scene, camera);
	controls.update();
	stats.update();
}

// function GetGeoJson() {
// 	fetch(api).then((res) => {
// 		res.json().then((data) => {
// 			console.log(data);
// 			LoadBuildings(data);
// 		});
// 	});
// }

function GetGeoJson() {
	fetch("./data/bruges.geojson").then((res) => {
		res.json().then((data) => {
			// return data.features;
			// console.log(data.features[0].geometry.coordinates);
			// console.log(data);
			LoadBuildings(data);
		});
	});
}

function LoadBuildings(data) {
	let features = data.features;
	// console.log(features);

	for (let i = 0; i < features.length; i++) {
		let fel = features[i];
		if (!fel["properties"]) return;

		if (fel.properties["building"]) {
			addBuilding(
				fel.geometry.coordinates,
				fel.properties,
				fel.properties["building:levels"],
			);
		}
	}
}

function addBuilding(data, info, height = 1) {
	height = height ? height : 1;

	for (let i = 0; i < data.length; i++) {
		let el = data[i];
		//console.log(el);

		let shape = genShape(el, center);
		let geometry = genGeometry(shape, {
			curveSegments: 3,
			depth: 0.1 * height,
			bevelEnabled: false,
		});

		geometry.rotateX(Math.PI / 2);
		geometry.rotateZ(Math.PI);

		let mesh = new THREE.Mesh(geometry, MAT_BUILDING);
		scene.add(mesh);
	}
}

function genShape(points, center) {
	let shape = new THREE.Shape();

	for (let i = 0; i < points.length; i++) {
		let elp = points[i];
		elp = GPSRelativePosition(elp, center);

		if (i == 0) {
			shape.moveTo(elp[0], elp[1]);
		} else {
			shape.lineTo(elp[0], elp[1]);
		}
	}

	return shape;
}

function genGeometry(shape, settings) {
	let geometry = new THREE.ExtrudeBufferGeometry(shape, settings);
	geometry.computeBoundingBox();

	return geometry;
}

function GPSRelativePosition(objPosi, centerPosi) {
	// Get GPS distance
	let dis = GEOLIB.getDistance(objPosi, centerPosi);

	// Get bearing angle
	let bearing = GEOLIB.getRhumbLineBearing(objPosi, centerPosi);

	// Calculate X by centerPosi.x + distance * cos(rad)
	let x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

	// Calculate Y by centerPosi.y + distance * sin(rad)
	let y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);

	// Reverse X (it work)
	// console.log([-x / 100, y / 100]);
	return [-x / 100, y / 100];
}

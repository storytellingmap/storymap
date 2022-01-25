//Data complied from OpenStreetMap: https://www.openstreetmap.org/

// isjeff.com
// 2020.06.13
// By Jeff Wu

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js";
import * as GEOLIB from "geolib";

import { MapControls } from "https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/controls/OrbitControls.js";

import { BufferGeometryUtils } from "https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/utils/BufferGeometryUtils.js";

var scene, renderer, camera, controls;
var MAT_BUILDING, MAT_ROAD;
const center = [-3.188822, 55.943686];
var iR;
var iR_Road;
var iR_Line;

const FLAG_ROAD_ANI = true;
var Animated_Line_Speed = 0.004;
var Animated_Line_Distances = [];
var geos_building = [];
var collider_building = [];
var raycaster = null;

const api =
	"https://gistcdn.githack.com/isjeffcom/b40d625e7b67170f0b2dd0203e980893/raw/4a5df10aeb3f3928c1158977620798d0153de6ac/gistfile1.txt";

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

// NOT WORKING WELL IN JSFIDDLE, TEST IN YOUR LOCAL MECHINE
// NOT WORKING WELL IN JSFIDDLE, TEST IN YOUR LOCAL MECHINE
// NOT WORKING WELL IN JSFIDDLE, TEST IN YOUR LOCAL MECHINE

document.getElementById("container").addEventListener("click", (evt) => {
	let mouse = {
		x: (evt.clientX / window.innerWidth) * 2 - 1,
		y: -(evt.clientY / window.innerHeight) * 2 + 1,
	};

	let hitted = FireRaycaster(mouse);
	console.log(hitted);
	if (hitted["info"]) {
		console.log(hitted.info);
	} else {
		console.log(hitted);
	}
});

function Awake() {
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
	iR_Road = new THREE.Group();
	iR_Road.name = "Roads";
	iR_Line = new THREE.Group();
	iR_Line.name = "Animated Line on Roads";
	scene.add(iR);
	scene.add(iR_Road);
	scene.add(iR_Line);

	// Init Raycaster
	raycaster = new THREE.Raycaster();

	// Init Light
	let light0 = new THREE.AmbientLight(0xfafafa, 0.25);

	let light1 = new THREE.PointLight(0xfafafa, 0.4);
	light1.position.set(200, 90, 40);

	let light2 = new THREE.PointLight(0xfafafa, 0.4);
	light2.position.set(200, 90, -40);

	scene.add(light0);
	scene.add(light1);
	scene.add(light2);

	let gridHelper = new THREE.GridHelper(
		60,
		160,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);
	scene.add(gridHelper);

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

	if (FLAG_ROAD_ANI) UpdateAniLines();
}

function GetGeoJson() {
	fetch(api).then((res) => {
		res.json().then((data) => {
			LoadBuildings(data);
		});
	});
}

function LoadBuildings(data) {
	let features = data.features;

	MAT_BUILDING = new THREE.MeshPhongMaterial();
	MAT_ROAD = new THREE.LineBasicMaterial({ color: 0x1b4686 });

	for (let i = 0; i < features.length; i++) {
		let fel = features[i];
		if (!fel["properties"]) return;

		let info = fel.properties;

		if (info["building"]) {
			addBuilding(
				fel.geometry.coordinates,
				info,
				info["building:levels"],
			);
		} else if (info["highway"]) {
			if (
				fel.geometry.type == "LineString" &&
				info["highway"] != "pedestrian" &&
				info["highway"] != "footway" &&
				info["highway"] != "path"
			) {
				addRoad(fel.geometry.coordinates, info);
			}
		}
	}

	let mergeGeometry =
		BufferGeometryUtils.mergeBufferGeometries(geos_building);
	let mesh = new THREE.Mesh(mergeGeometry, MAT_BUILDING);
	iR.add(mesh);
}

function addBuilding(data, info, height = 1) {
	height = height ? height : 1;

	let shape, geometry;
	let holes = [];

	for (let i = 0; i < data.length; i++) {
		let el = data[i];

		if (i == 0) {
			shape = genShape(el, center);
		} else {
			holes.push(genShape(el, center));
		}
	}

	for (let i = 0; i < holes.length; i++) {
		shape.holes.push(holes[i]);
	}

	geometry = genGeometry(shape, {
		curveSegments: 1,
		depth: 0.05 * height,
		bevelEnabled: false,
	});

	geometry.rotateX(Math.PI / 2);
	geometry.rotateZ(Math.PI);

	geos_building.push(geometry);

	let helper = genHelper(geometry);
	if (helper) {
		helper.name = info["name"] ? info["name"] : "Building";
		helper.info = info;
		//this.iR.add(helper)
		collider_building.push(helper);
	}
}

function addRoad(d, info) {
	// Init points array
	let points = [];

	// Loop for all nodes
	for (let i = 0; i < d.length; i++) {
		if (!d[0][1]) return;

		let el = d[i];

		//Just in case
		if (!el[0] || !el[1]) return;

		let elp = [el[0], el[1]];

		//convert position from the center position
		elp = GPSRelativePosition([elp[0], elp[1]], center);

		// Draw Line
		points.push(new THREE.Vector3(elp[0], 0.5, elp[1]));
	}

	let geometry = new THREE.BufferGeometry().setFromPoints(points);

	// Adjust geometry rotation
	geometry.rotateZ(Math.PI);

	let line = new THREE.Line(geometry, MAT_ROAD);
	line.info = info;
	line.computeLineDistances();

	iR_Road.add(line);
	line.position.set(line.position.x, 0.5, line.position.z);

	if (FLAG_ROAD_ANI) {
		// Length of the line
		let lineLength =
			geometry.attributes.lineDistance.array[
				geometry.attributes.lineDistance.count - 1
			];

		if (lineLength > 0.8) {
			let aniLine = addAnimatedLine(geometry, lineLength);
			iR_Line.add(aniLine);
		}
	}
}

function addAnimatedLine(geometry, length) {
	let animatedLine = new THREE.Line(
		geometry,
		new THREE.LineDashedMaterial({ color: 0x00ffff }),
	);
	animatedLine.material.transparent = true;
	animatedLine.position.y = 0.5;
	animatedLine.material.dashSize = 0;
	animatedLine.material.gapSize = 1000;

	Animated_Line_Distances.push(length);

	return animatedLine;
}

function UpdateAniLines() {
	// If no animated line than do nothing
	if (iR_Line.children.length <= 0) return;

	for (let i = 0; i < iR_Line.children.length; i++) {
		let line = iR_Line.children[i];

		let dash = parseInt(line.material.dashSize);
		let length = parseInt(Animated_Line_Distances[i]);

		if (dash > length) {
			//console.log("b")
			line.material.dashSize = 0;
			line.material.opacity = 1;
		} else {
			//console.log("a")
			line.material.dashSize += Animated_Line_Speed;
			line.material.opacity =
				line.material.opacity > 0 ? line.material.opacity - 0.002 : 0;
		}
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

function genHelper(geometry) {
	if (!geometry.boundingBox) {
		geometry.computeBoundingBox();
	}

	let box3 = geometry.boundingBox;
	if (!isFinite(box3.max.x)) {
		return false;
	}

	let helper = new THREE.Box3Helper(box3, 0xffff00);
	helper.updateMatrixWorld();
	return helper;
}

function FireRaycaster(pointer) {
	raycaster.setFromCamera(pointer, camera);

	let intersects = raycaster.intersectObjects(collider_building, true);
	//console.log(intersects)
	if (intersects.length > 0) {
		let selectedObject = intersects[0].object;
		return selectedObject;
	} else {
		return false;
	}
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
	return [-x / 100, y / 100];
}

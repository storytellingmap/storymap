import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import * as GeometryUtils from "three/examples/jsm/utils/GeometryUtils.js";
import { Vector3 } from "three";

//global variables
// let scene;
// let camera;
// let renderer;
// let controls;

let line, renderer, scene, camera, camera2, controls;
let line1;
let matLine, matLineBasic, matLineDashed;

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

async function loadPath() {
	return await fetch("./data/path.json").then((response) => {
		return response.json().then((data) => {
			let v3array = [];
			data.forEach((el) => {
				v3array.push(new Vector3(el[0], el[1], el[2]));
			});
			return v3array;
		});
	});
}

async function drawSpline() {
	let data = await loadPath();

	const curve = new THREE.CatmullRomCurve3(data);
	const points = curve.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);

	const material = new THREE.LineDashedMaterial({
		color: 0xffffff,
		linewidth: 1,
		scale: 1,
		dashSize: 1, // to be updated in the render loop
		gapSize: 1e10, // a big number, so only one dash is rendered
	});

	const curveObject = new THREE.Line(geometry, material);

	scene.add(curveObject);
}

initialize();
animate();
drawSpline();

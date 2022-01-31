import * as THREE from "three";

import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import * as GeometryUtils from "three/examples/jsm/utils/GeometryUtils.js";

let line, renderer, scene, camera, controls;
let line1;
let matLine, matLineBasic, matLineDashed;
let gui;

// viewport
let insetWidth;
let insetHeight;

init();
animate();

function init() {
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setClearColor(0x000000, 0.0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(
		35,
		window.innerWidth / window.innerHeight,
		1,
		100,
	);
	camera.position.set(8, 5, 2);

	controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 10;
	controls.maxDistance = 500;

	// Position and THREE.Color Data

	const positions = [];

	const spline = new THREE.CatmullRomCurve3([
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(1, 0, 1),
		new THREE.Vector3(2, 2, 2),
	]);

	const points = [
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(1, 0, 1),
		new THREE.Vector3(2, 2, 2),
	];

	const divisions = Math.round(12 * points.length);
	const point = new THREE.Vector3();
	const color = new THREE.Color();

	for (let i = 0, l = divisions; i < l; i++) {
		const t = i / l;

		spline.getPoint(t, point);
		positions.push(point.x, point.y, point.z);
	}

	const geometry = new LineGeometry();
	geometry.setPositions(positions);

	matLine = new LineMaterial({
		color: 0xffffff,
		linewidth: 5, // in world units with size attenuation, pixels otherwise
		// vertexColors: true,

		//resolution:  // to be set by renderer, eventually
		dashed: true,
		dashSize: 3.6,
		gapSize: 1e10,
		alphaToCoverage: true,
	});

	line = new Line2(geometry, matLine);
	line.computeLineDistances();
	line.scale.set(1, 1, 1);
	scene.add(line);

	camera.lookAt(new THREE.Vector3(1, 0, 1));

	//

	window.addEventListener("resize", onWindowResize);
	onWindowResize();

	// initGui();

	const gridHelper = new THREE.GridHelper(
		100,
		100,
		new THREE.Color(0x555555),
		new THREE.Color(0x333333),
	);

	const grid = new THREE.GridHelper();

	scene.add(gridHelper);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);

	// main scene

	renderer.setClearColor(0x000000, 0);

	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

	// renderer will set this eventually
	matLine.resolution.set(window.innerWidth, window.innerHeight); // resolution of the viewport

	renderer.render(scene, camera);

	// inset scene

	renderer.setClearColor(0x222222, 1);

	renderer.clearDepth(); // important!

	renderer.setScissorTest(true);

	renderer.setScissor(20, 20, insetWidth, insetHeight);

	renderer.setViewport(20, 20, insetWidth, insetHeight);

	// renderer will set this eventually
	matLine.resolution.set(insetWidth, insetHeight); // resolution of the inset viewport
	renderer.setScissorTest(false);
}

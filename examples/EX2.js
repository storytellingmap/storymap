import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

var mesh, renderer, scene, camera, controls;

var fraction = 0;
var lineLength;

var DATA = [
	[3.103574514389038, 0.00009999999747378752, -0.40523770451545715],
	[3.103574514389038, 0.00009999999747378752, -0.40523770451545715],
	[2.620455503463745, 0.00009999999747378752, -0.0015328213339671493],
	[2.6032416820526123, 0.00009999999747378752, -0.03317208215594292],
	[2.467907428741455, 0.00009999999747378752, 0.056894220411777496],
	[2.0482280254364014, 0.00009999999747378752, 0.1813172847032547],
	[1.912331461906433, 0.00009999999747378752, 0.07994545251131058],
	[1.6747093200683594, 0.00009999999747378752, 0.2732137143611908],
	[1.315534234046936, 0.00009999999747378752, 0.5550733804702759],
	[1.0274174213409424, 0.00009999999747378752, 0.7359716296195984],
	[0.9111981391906738, 0.00009999999747378752, 0.6797205805778503],
	[0.758967399597168, 0.00009999999747378752, 0.7555446624755859],
	[0.7788753509521484, 0.00009999999747378752, 0.8531396389007568],
	[0.4937813878059387, 0.00009999999747378752, 0.960040807723999],
	[0.43259039521217346, 0.00009999999747378752, 0.8343294858932495],
];

init();
animate();

function init() {
	// info
	var info = document.createElement("div");
	info.style.position = "absolute";
	info.style.top = "30px";
	info.style.width = "100%";
	info.style.textAlign = "center";
	info.style.color = "#fff";
	info.style.fontWeight = "bold";
	info.style.backgroundColor = "transparent";
	info.style.zIndex = "1";
	info.style.fontFamily = "Monospace";
	info.innerHTML = "Drag mouse to rotate camera; scroll to zoom";
	document.body.appendChild(info);

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// scene
	scene = new THREE.Scene();

	// camera
	camera = new THREE.PerspectiveCamera(
		40,
		window.innerWidth / window.innerHeight,
		1,
		10000,
	);
	camera.position.set(20, 20, 20);

	// controls
	// controls = new THREE.OrbitControls(camera, renderer.domElement);
	// controls.minDistance = 10;
	// controls.maxDistance = 100;

	// points
	// var box = new THREE.BoxGeometry(10, 10, 10, 4, 4, 4);
	var points = DATA;
	// console.log(points);
	// geometry
	var geometry = new THREE.BufferGeometry();

	// attributes
	let numPoints = points.length;
	// console.log(numPoints);
	var positions = new Float32Array(numPoints * 3); // 3 vertices per point
	// var colors = new Float32Array(numPoints * 3); // 3 channels per point
	var lineDistances = new Float32Array(numPoints * 1); // 1 value per point

	// geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute($.lineArray, 3),
	);

	lineLength = lineDistances[numPoints - 1];

	// material
	var material = new THREE.LineDashedMaterial({
		vertexColors: THREE.VertexColors,
		dashSize: 1, // to be updated in the render loop
		gapSize: 1e10, // a big number, so only one dash is rendered
	});

	// line
	line = new THREE.Line(geometry, material);
	scene.add(line);
}

function animate() {
	requestAnimationFrame(animate);

	fraction = (fraction + 0.001) % 1;

	line.material.dashSize = fraction * lineLength;

	renderer.render(scene, camera);
}

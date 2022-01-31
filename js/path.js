import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";

let ground;
//ground plane against which you'll raycast.
function createGround(size = 100) {
	const shape = new THREE.Shape();

	shape.moveTo(0, 0);
	shape.lineTo(0, size);
	shape.lineTo(size, size);
	shape.lineTo(size, 0);

	const geometry = new THREE.ShapeGeometry(shape);
	geometry.rotateX(Math.PI / 2);
	geometry.rotateZ(Math.PI);
	let half = size / 2;
	geometry.translate(half, 0.0001, -half); //why is threejs so retarded. why is it xzy

	// const mesh = new THREE.Mesh(geometry, material);
	ground = new THREE.Mesh(geometry, $.material_ground);
	ground.name = "GROUND";
	// mesh.translateY(-51.0442347);
	// mesh.setRotationFromAxisAngle(-90);
	$.scene.add(ground);
}

function initializeEventListeners() {
	scrollPercentage();
	keyPress();

	function scrollPercentage() {
		//initialize scrollPercentage text
		document.getElementById("scrollProgress").innerText =
			"Scroll Progress : 00.00";

		document.addEventListener("scroll", getScrollPercentage, false);

		function getScrollPercentage() {
			$.scrollpercentage =
				((document.documentElement.scrollTop ||
					document.body.scrollTop) /
					((document.documentElement.scrollHeight ||
						document.body.scrollHeight) -
						document.documentElement.clientHeight)) *
				100;
			document.getElementById("scrollProgress").innerText =
				"Scroll Progress : " + $.scrollpercentage.toFixed(2);
		}

		function showScrollPercentage() {}
	}

	function keyPress() {
		document.addEventListener("keyup", onKeyUp, false);

		function onKeyUp(event) {
			if (event.key == "s") {
				console.log("start drawing path");
				window.addEventListener("click", addRaycaster, false);
				window.addEventListener("mousemove", onMouseMove, false);
			}
			if (event.key == "f") {
				console.log("finish and save path.");
				window.removeEventListener("click", addRaycaster, false);
				// window.removeEventListener("mousemove", onMouseMove, false);
				savePath();
			}
		}
	}
}

function initializeDynamicLine() {
	let geometry = new THREE.BufferGeometry();
	let max_points = 600;
	$.lineArray = new Float32Array(max_points * 3); //3 verts (xyz) per point

	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute($.lineArray, 3),
	);

	let material = new THREE.LineBasicMaterial({
		color: 0xff0000,
		linewidth: 2,
	});

	$.line = new THREE.Line(geometry, material);
	$.scene.add($.line);

	// document.addEventListener("mousemove", onMouseMove, false);
	// document.addEventListener("mousedown", onMouseDown, false);
}

function addRaycaster(event) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	$.mouseposition.x = (event.clientX / window.innerWidth) * 2 - 1;
	$.mouseposition.y = -(event.clientY / window.innerHeight) * 2 + 1;
	// console.log(mousePos);

	$.raycaster.setFromCamera($.mouseposition, $.camera);
	let found = $.raycaster.intersectObjects($.scene.children);
	// console.log(found.length);
	if (found.length > 0) {
		// console.log(1);
		found.forEach((ray) => {
			// console.log(ray);
			if (ray.object.name == "GROUND") {
				// placeBox(ray.point);
				// createLine(ray.point);
				if ($.lineClickCounter === 0) {
					addPoint(ray.point); //hack to add to identical points.
				}
				addPoint(ray.point);
			}
		});
	}

	// add point
	function addPoint(mouse) {
		$.lineArray[$.lineClickCounter * 3 + 0] = mouse.x;
		$.lineArray[$.lineClickCounter * 3 + 1] = mouse.y;
		$.lineArray[$.lineClickCounter * 3 + 2] = mouse.z;
		$.lineClickCounter++;
		$.line.geometry.setDrawRange(0, $.lineClickCounter);
		updateLine(mouse);
	}
	// update line
	function updateLine(mouse) {
		$.lineArray[$.lineClickCounter * 3 + 0] = mouse.x;
		$.lineArray[$.lineClickCounter * 3 + 1] = mouse.y;
		$.lineArray[$.lineClickCounter * 3 + 2] = mouse.z;
		$.line.geometry.attributes.position.needsUpdate = true;
	}
}

function savePath() {
	let data = [];

	for (let index = 0; index < $.lineClickCounter; index++) {
		let obj = [
			$.lineArray[index * 3 + 0],
			$.lineArray[index * 3 + 1],
			$.lineArray[index * 3 + 2],
		];
		data.push(obj);
	}

	let pathData = JSON.stringify(data);

	download(pathData, "path.json", "text/plain");

	function download(content, fileName, contentType) {
		var a = document.createElement("a");
		var file = new Blob([content], { type: contentType });
		a.href = URL.createObjectURL(file);
		a.download = fileName;
		a.click();
	}
}

function onMouseMove(event) {
	castRay(event);
	if ($.lineClickCounter !== 0) {
		updateLine($.mouseposition);
	}
}

function castRay() {
	const raycaster = new THREE.Raycaster(); //raycaster
	const mousePos = new THREE.Vector2(); //mouse pos
	const mouseMove = new THREE.Vector2(); //last mouse movement position

	mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
	mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
	// console.log(mousePos);

	raycaster.setFromCamera(mousePos, $.camera);
	let found = raycaster.intersectObjects($.scene.children);
	// console.log(found.length);
	if (found.length > 0) {
		// console.log(1);
		found.forEach((ray) => {
			// console.log(ray);
			if (ray.object.name == "GROUND") {
				// console.log(ray.point);
				// placeBox(ray.point);
				// createLine(ray.point);
				$.mouseposition = ray.point;
			}
		});
	}
}

function updateLine(mouse) {
	$.lineArray[$.lineClickCounter * 3 - 3] = mouse.x;
	$.lineArray[$.lineClickCounter * 3 - 2] = mouse.y;
	$.lineArray[$.lineClickCounter * 3 - 1] = mouse.z;
	$.line.geometry.attributes.position.needsUpdate = true;
}

//main function
function generatePath() {
	createGround(50);
	initializeEventListeners();
	initializeDynamicLine();
}

export { generatePath };

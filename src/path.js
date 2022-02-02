import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";
import { Vector3 } from "three";

//globals
let sphereMarker;

function initializeMarker() {
	const geometry = new THREE.SphereGeometry(0.025);
	const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	sphereMarker = new THREE.Mesh(geometry, material);
	sphereMarker.visible = false;
	$.scene.add(sphereMarker);
}

function initializeEventListeners() {
	// window.addEventListener("mousemove", onMouseMove, false);

	let drag = false;
	document.addEventListener("mousedown", () => (drag = false));

	document.addEventListener("mousemove", () => {
		castRay();
		if ($.hit == true) {
			updateLine($.mouseposition);
		} else {
			$.line.geometry.setDrawRange(0, $.lineClickCounter);
		}
		drag = true;
	});

	document.addEventListener("click", () => {
		if (!drag && $.hit == true) {
			addPoint($.mouseposition);
			$.lineClickMax = $.lineClickCounter;
		}
	});

	document.addEventListener("keyup", onKeyUp, false);

	function onKeyUp(event) {
		if (event.key == "s") {
			savePath();
		}
		if (event.key == "r") {
			//reset line
			$.lineClickCounter = 0;
			$.scene.remove($.line);
			initializeDynamicLine();
		}
		if (event.key === "z") {
			if ($.lineClickCounter != 0) {
				// updateLine(new THREE.Vector3(0, 0, 0));
				$.lineClickCounter = $.lineClickCounter - 1;
				$.line.geometry.setDrawRange(0, $.lineClickCounter);
			}
		}
		if (event.key === "x") {
			if ($.lineClickCounter < $.lineClickMax) {
				$.lineClickCounter = $.lineClickCounter + 1;
				$.line.geometry.setDrawRange(0, $.lineClickCounter);
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
	$.line.geometry.setDrawRange(0, 0);
	$.line.frustumCulled = false;
	$.line.name = "USERPATH";
	$.scene.add($.line);
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
	//update mouseposition & sphere position
	castRay(event);
}

function castRay() {
	const raycaster = new THREE.Raycaster(); //raycaster
	const mousePos = new THREE.Vector2(); //mouse pos
	const mouseMove = new THREE.Vector2(); //last mouse movement position

	mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
	mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mousePos, $.camera);
	raycaster.layers.set(1);
	raycaster.params.Line.threshold = 0.01;

	let intersects = [];
	raycaster.intersectObjects($.scene.children, false, intersects);

	if (intersects.length > 0) {
		sphereMarker.position.copy(intersects[0].point);
		sphereMarker.visible = true;
		$.mouseposition = intersects[0].point;
		$.hit = true;
	} else {
		sphereMarker.visible = false;
		$.hit = false;
	}
}

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
	$.line.geometry.setDrawRange(0, $.lineClickCounter + 1);
}

//main function
function generatePath() {
	initializeMarker();
	initializeEventListeners();
	initializeDynamicLine();
}

export { generatePath };

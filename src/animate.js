import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
// import * as GEOLIB from "geolib";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

const animationScripts = [];
let LINEPOINTCOUNT = 0;
let STARTPOINT = 3;

async function animatePath() {
	let data = await loadPath();

	LINEPOINTCOUNT = data.length;
	// console.log(LINEPOINTCOUNT);
	//data for drawLine()
	$.lineArray = new Float32Array(data.length * 3);
	$.lineArrayBackup = new Float32Array(data.length * 3);

	data.forEach((element, index) => {
		$.lineArray[index * 3 + 0] = element[0];
		$.lineArray[index * 3 + 1] = element[1];
		$.lineArray[index * 3 + 2] = element[2];

		$.lineArrayBackup[index * 3 + 0] = element[0];
		$.lineArrayBackup[index * 3 + 1] = element[1];
		$.lineArrayBackup[index * 3 + 2] = element[2];
	});

	//data for drawSpline();
	let lineArrayVector3 = [];
	data.forEach((el) => {
		lineArrayVector3.push(new THREE.Vector3(el[0], el[1], el[2]));
	});
	// drawSpline(lineArrayVector3);

	drawLine();

	initializeEventListeners();
	animate();
}

async function loadPath() {
	return await fetch("./data/path.json").then((response) => {
		return response.json().then((data) => {
			return data;
		});
	});
}

//CAMERA PATH
async function drawSpline(data) {
	// let data = await loadPath();

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

	$.scene.add(curveObject);
}

//ANIMATED PATH
function drawLine() {
	let geometry = new THREE.BufferGeometry();

	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute($.lineArray, 3),
	);

	let material = new THREE.LineBasicMaterial({
		color: 0xff0000,
		linewidth: 1,
	});

	$.line = new THREE.Line(geometry, material);
	$.line.geometry.setDrawRange(0, 2);
	$.scene.add($.line);
}

function drawTube() {
	const extrudeSettings = {
		steps: 2,
		depth: 16,
		bevelEnabled: true,
		bevelThickness: 1,
		bevelSize: 1,
		bevelOffset: 0,
		bevelSegments: 1,
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function initializeEventListeners() {
	scrollPercentage();

	function scrollPercentage() {
		//initialize scrollPercentage text
		// getScrollPercentage();
		// document.getElementById("scrollProgress").innerText =
		// 	"Scroll Progress : " + $.scrollpercentage.toFixed(2);

		document.addEventListener("scroll", getScrollPercentage, false);

		function getScrollPercentage() {
			$.scrollpercentage =
				((document.documentElement.scrollTop ||
					document.body.scrollTop) /
					((document.documentElement.scrollHeight ||
						document.body.scrollHeight) -
						document.documentElement.clientHeight)) *
				100;
			// document.getElementById("scrollProgress").innerText =
			// 	"Scroll Progress : " + $.scrollpercentage.toFixed(2);
		}

		function showScrollPercentage() {}
	}
}

function animate() {
	requestAnimationFrame(animate);
	playScrollAnimations();

	$.camera.lookAt($.cameraLookAtPos);
	// $.camera.position.set($.cameraLookAtPos.x - 1, 2, $.cameraLookAtPos.z - 1);
}

function playScrollAnimations() {
	animationScripts.forEach((a) => {
		if ($.scrollpercentage >= a.start && $.scrollpercentage < a.end) {
			a.func();
		}
	});
}

//add an animation that moves the cube through first 40 percent of scroll
//DRAW PATH ANIMATION
animationScripts.push({
	start: 15,
	end: 99,
	func: () => {
		let x = 1 / LINEPOINTCOUNT;
		let linePercent = scalePercent(15, 99) / x;
		let lineInt = parseInt(linePercent);
		let lineFloat = linePercent - lineInt;
		// console.log(lineFloat);

		$.line.geometry.setDrawRange(0, linePercent);
		updateLine(lineInt, lineFloat);
	},
});

animationScripts.push({
	start: 1,
	end: 20,
	func: () => {
		$.cameraPos.x = $.cameraPos.x = 0.1;

		// $.camera.position.set($.cameraPos.x, $.cameraPos.y, $.cameraPos.z);
	},
});

function updateLine(index, percentage) {
	let a = new THREE.Vector3(
		$.lineArrayBackup[index * 3 - 3],
		$.lineArrayBackup[index * 3 - 2],
		$.lineArrayBackup[index * 3 - 1],
	);

	let b = new THREE.Vector3(
		$.lineArrayBackup[(index + 1) * 3 - 3],
		$.lineArrayBackup[(index + 1) * 3 - 2],
		$.lineArrayBackup[(index + 1) * 3 - 1],
	);

	$.cameraLookAtPos = new THREE.Vector3().lerpVectors(a, b, percentage);

	$.lineArray[index * 3 - 3] = $.cameraLookAtPos.x;
	$.lineArray[index * 3 - 2] = $.cameraLookAtPos.y;
	$.lineArray[index * 3 - 1] = $.cameraLookAtPos.z;

	$.lineArray[(index - 1) * 3 - 3] = $.lineArrayBackup[index * 3 - 3];
	$.lineArray[(index - 1) * 3 - 2] = $.lineArrayBackup[index * 3 - 2];
	$.lineArray[(index - 1) * 3 - 1] = $.lineArrayBackup[index * 3 - 1];

	$.line.geometry.attributes.position.needsUpdate = true;

	// $.lineArray = $.lineArrayBackup;

	// for (let i = 0; i < index - 1; i++) {
	// 	$.lineArray[index * 3 - 3] = $.lineArrayBackup[index * 3 - 3];
	// 	$.lineArray[index * 3 - 2] = $.lineArrayBackup[index * 3 - 2];
	// 	$.lineArray[index * 3 - 1] = $.lineArrayBackup[index * 3 - 1];
	// }

	// for (let i = index; i < LINEPOINTCOUNT; i++) {
	// 	$.lineArray[index * 3 - 3] = $.lineArrayBackup[index * 3 - 3];
	// 	$.lineArray[index * 3 - 2] = $.lineArrayBackup[index * 3 - 2];
	// 	$.lineArray[index * 3 - 1] = $.lineArrayBackup[index * 3 - 1];
	// }

	// $.lineArray[(index - 1) * 3 - 3] = $.lineArrayBackup[(index - 1) * 3 - 3];
	// $.lineArray[(index - 1) * 3 - 2] = $.lineArrayBackup[(index - 1) * 3 - 2];
	// $.lineArray[(index - 1) * 3 - 1] = $.lineArrayBackup[(index - 1) * 3 - 1];

	// $.lineArray[(index + 1) * 3 - 3] = $.lineArrayBackup[(index + 1) * 3 - 3];
	// $.lineArray[(index + 1) * 3 - 2] = $.lineArrayBackup[(index + 1) * 3 - 2];
	// $.lineArray[(index + 1) * 3 - 1] = $.lineArrayBackup[(index + 1) * 3 - 1];
}

// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
	let x = ($.scrollpercentage - start) / (end - start);
	// return x * 100.01;
	return x;
}

export { animatePath };

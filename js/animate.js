import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

const animationScripts = [];
// let drawRange = 0;

async function animatePath() {
	// let data = await loadPath();

	// // $.lineArray = new Float32Array(data.length * 3);

	// // // let drawRange = 0;
	// data.forEach((element, index) => {
	// 	$.lineArray[index * 3 + 0] = element[0];
	// 	$.lineArray[index * 3 + 1] = element[1];
	// 	$.lineArray[index * 3 + 2] = element[2];
	// 	// drawRange += 1;
	// });

	drawPath();

	initializeEventListeners();
	// animate();
}

async function loadPath() {
	return await fetch($.config.path).then((response) => {
		return response.json().then((data) => {
			return data;
		});
	});
}

function drawPath() {
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

	let matLine = new LineMaterial({
		color: 0xffffff,
		linewidth: 5, // in world units with size attenuation, pixels otherwise
		// vertexColors: true,

		//resolution:  // to be set by renderer, eventually
		dashed: true,
		dashSize: 3.6,
		gapSize: 1e10,
		alphaToCoverage: true,
	});

	let line = new Line2(geometry, matLine);
	line.computeLineDistances();
	line.scale.set(1, 1, 1);
	$.scene.add(line);
}

function initializeEventListeners() {
	scrollPercentage();

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
}

function animate() {
	requestAnimationFrame(animate);
	playScrollAnimations();
}

function playScrollAnimations() {
	animationScripts.forEach((a) => {
		if ($.scrollpercentage >= a.start && $.scrollpercentage < a.end) {
			a.func();
		}
	});
}

//add an animation that moves the cube through first 40 percent of scroll
animationScripts.push({
	start: 5,
	end: 40,
	func: () => {
		// fraction = (fraction + 0.001) % 1;
		// $.line.material.dashSize = fraction * lineLength;
	},
});

function lerp(x, y, a) {
	return (1 - a) * x + a * y;
}

// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
	return ($.scrollpercentage - start) / (end - start);
}

export { animatePath };

import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";

const animationScripts = [];

async function animatePath() {
	let data = await loadPath();
	$.lineArray = new Float32Array(600 * 3);

	let drawRange = 0;
	// console.log(data);
	data.forEach((element, index) => {
		$.lineArray[index * 3 + 0] = element[0];
		$.lineArray[index * 3 + 1] = element[1];
		$.lineArray[index * 3 + 2] = element[2];
		drawRange += 1;
	});

	drawPath(drawRange);

	initializeEventListeners();
	animate();
}

async function loadPath() {
	return await fetch($.config.path).then((response) => {
		return response.json().then((data) => {
			return data;
		});
	});
}

function drawPath(drawRange) {
	let geometry = new THREE.BufferGeometry();

	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute($.lineArray, 3),
	);

	// let material = new THREE.LineBasicMaterial({
	// 	color: 0xff0000,
	// 	linewidth: 5,
	// 	transparent: true,
	// 	opacity: 1,
	// });

	let material = new THREE.LineDashedMaterial({
		color: 0xff0000,
		vertexColors: 0x00ff00,
		dashSize: 0.5,
		gapSize: 0.5,
	});

	geometry.computeLineDistances();

	$.line = new THREE.Line(geometry, material);
	$.line.computeLineDistances();
	// $.line.geometry.setDrawRange(0, drawRange); //HEWEIFHWGIHRIWFGJWDIFJWEIJ
	$.scene.add($.line);
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
// animationScripts.push({
// 	start: 5,
// 	end: 40,
// 	func: () => {
// 		let drawCount = (drawCount + 1) % MAX_POINTS;
// 		$.line.geometry.setDrawRange(0, drawCount);
// 	},
// });

function lerp(x, y, a) {
	return (1 - a) * x + a * y;
}

// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
	return ($.scrollpercentage - start) / (end - start);
}

export { animatePath };

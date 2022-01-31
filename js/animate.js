import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
// import * as GEOLIB from "geolib";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

const animationScripts = [];

async function animatePath() {
	let data = await loadPath();

	$.lineArray = new Float32Array(data.length * 3);
	data.forEach((element, index) => {
		$.lineArray[index * 3 + 0] = element[0];
		$.lineArray[index * 3 + 1] = element[1];
		$.lineArray[index * 3 + 2] = element[2];
	});

	// drawSpline();
	// drawLine2();
	initializeEventListeners();
	animate();
}

async function loadPath() {
	return await fetch("./data/path.json").then((response) => {
		return response.json().then((data) => {
			let v3array = [];
			data.forEach((el) => {
				v3array.push(new THREE.Vector3(el[0], el[1], el[2]));
			});
			return v3array;
		});
	});
}

//CAMERA PATH
async function drawSpline() {
	let data = await loadPath();

	const curve = new THREE.CatmullRomCurve3([data[0], data[1], data[2]]);
	const points = curve.getPoints(50);

	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	// geometry.positions.push(data[3]);
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
async function drawLine() {}

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
	start: 1,
	end: 6,
	func: () => {
		console.log(scalePercent(1, 6));
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

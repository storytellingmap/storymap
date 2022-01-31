import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";

const animationScripts = [];

async function animatePath() {
	let data = await loadPath();

	console.log($.lineArray);
	drawPath(data);

	// initializeEventListeners();
	// animate();
}

function drawPath(data) {
	let parent, tubeGeometry, mesh;
	const spline = new THREE.Curve();
	const spline = new THREE.CatmullRomCurve3($.lineArray);

	const material = new THREE.MeshLambertMaterial({ color: 0xff00ff });

	const wireframeMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		opacity: 0.3,
		wireframe: true,
		transparent: true,
	});

	const params = {
		scale: 0.1,
		extrusionSegments: 1,
		tubularSegments: 1,
		radiusSegments: 2,
		closed: false,
		animationView: false,
		lookAhead: false,
		cameraHelper: false,
	};

	const sampleClosedSpline = new THREE.CatmullRomCurve3([
		new THREE.Vector3(0, -40, -40),
		new THREE.Vector3(0, 40, -40),
		new THREE.Vector3(0, 140, -40),
		new THREE.Vector3(0, 40, 40),
		// new THREE.Vector3(0, -40, 40),
	]);

	let pathBase = new THREE.CatmullRomCurve3($.lineArray);
	tubeGeometry = new THREE.TubeGeometry(
		sampleClosedSpline,
		params.extrusionSegments,
		params.tubularSegments,
		params.radiusSegments,
		params.closed,
	);

	// addGeometry(tubeGeometry);

	mesh = new THREE.Mesh(tubeGeometry, material);
	const wireframe = new THREE.Mesh(tubeGeometry, wireframeMaterial);
	mesh.add(wireframe);
	mesh.scale.set(params.scale, params.scale, params.scale);

	parent = new THREE.Object3D();
	parent.add(mesh);

	$.scene.add(parent);
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

async function loadPath() {
	return await fetch($.config.path).then((response) => {
		return response.json().then((data) => {
			//populate $.linearray
			$.lineArray = [];
			data.forEach((vector) => {
				// console.log(vector);
				$.lineArray.push(
					new THREE.Vector3(vector[0], vector[1], vector[2]),
				);
			});
			//return data
			return data;
		});
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

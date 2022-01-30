import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";

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

	let material = new THREE.LineBasicMaterial({
		color: 0xff0000,
		linewidth: 5,
	});

	$.line = new THREE.Line(geometry, material);
	$.line.geometry.setDrawRange(0, drawRange);
	$.scene.add($.line);
}

export { animatePath };

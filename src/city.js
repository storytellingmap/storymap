import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

async function loadGeoJsonAsync() {
	return await fetch($.config.data).then((response) => {
		return response.json().then((data) => {
			return data.features;
		});
	});
}

async function generateCity(buildings = true, roads = true, water = true) {
	// LOAD GEOJSON DATA
	let data = await loadGeoJsonAsync();
	// console.log(data);

	// LOADBUILDINGS
	//foreach building, call the addBuilding function
	data.forEach((element) => {
		create3dObject(element);
		// if (element.properties.building) {
		// 	generateBuildings();
		// 	// create3dObject(element);
		// 	// addBuilding(
		// 	// 	element.geometry.coordinates,
		// 	// 	element.properties["building:levels"],
		// 	// 	element.properties,
		// 	// );
		// 	// console.log("bla");
		// }
	});

	// console.log($.buildingArray.length);
	spawnBuildings();
	spawnWater();
}

function spawnBuildings() {
	let mergedGeometry = mergeBufferGeometries($.buildingArray);

	const material = new THREE.MeshPhongMaterial({
		color: $.config.color_buildings,
	});
	const mesh = new THREE.Mesh(mergedGeometry, material);
	mesh.name = "BUILDINGS";
	mesh.updateMatrix();
	// buildingGeometry.merge(mesh);

	// console.log(mesh);
	$.scene.add(mesh);
}

function spawnWater() {
	let mergedGeometry = mergeBufferGeometries($.waterArray);

	const material = new THREE.MeshPhongMaterial({
		color: 0x0000ff,
	});
	const mesh = new THREE.Mesh(mergedGeometry, material);
	mesh.name = "WATER";
	mesh.updateMatrix();
	// buildingGeometry.merge(mesh);
	mesh.position.y -= 0.01;
	// console.log(mesh);
	$.scene.add(mesh);
}

function create3dObject(data) {
	let coordinates = data.geometry.coordinates;
	let properties = data.properties;

	if (properties.building) {
		//if data is a building property (if it's a building)
		let building_levels = data.properties["building:levels"] || 1; //if building:levels property exists use it, otherwise use 1

		$.buildingArray.push(generateBuildings(coordinates, building_levels));
		// generateBuildingV2(coordinates, building_levels);
	} else if (properties.highway && data.geometry.type != "Point") {
		generateRoads(coordinates, properties);
	} else if (properties.natural) {
		$.waterArray.push(generateWater(coordinates, properties));
	}
}

function generateBuildings(coordinates, height = 1) {
	//each geojson "object" has multiple arrays of coordinates.
	//the first array is the main (outer) building shape
	//the second & third & .. are the "holes" in the building
	let buildingShape, buildingGeometry; //main building
	// let buildingHoles = []; //holes to punch out shape

	coordinates.forEach((points, index) => {
		//for each building do:
		if (index == 0) {
			//create main building shape
			buildingShape = generateShape(points);
		} else {
			//create shape of holes in building
			buildingShape.holes.push(generateShape(points));
			// buildingHoles.push(generateShape(points));
		}
	});

	buildingGeometry = generateGeometry(buildingShape, height);
	return buildingGeometry;
}

function generateRoads(coordinates, properties) {
	// console.log(1);
	let points = [];

	coordinates.forEach((coordinates) => {
		let coords = normalizeCoordinates(coordinates, $.config.citycenter);
		points.push(new THREE.Vector3(coords[0], 0.002, coords[1]));
		// console.log(points);
		// if (element[0][1]) return;
		// if (!element[0] || !element[1]) return;
		// else {
		// }
		// console.log(element);
	});

	if (points.length > 1) {
		let geometry = new THREE.BufferGeometry().setFromPoints(points);
		geometry.rotateZ(Math.PI);
		// return geometry;
		let line = new THREE.Line(geometry, $.material_road);
		// line.ExtrudeBufferGeometry();
		$.scene.add(line);
		// console.log("end of road");
		//V2
		// let geometry = new LineGeometry();
		// geometry.setPositions(points);
		// line = new Line2(geometry, $.material_road2);
		// scene.add(line);
	}
}

function generateWater(coordinates, properties) {
	//each geojson "object" has multiple arrays of coordinates.
	//the first array is the main (outer) building shape
	//the second & third & .. are the "holes" in the building
	let waterShape, waterGeometry; //main building
	// let buildingHoles = []; //holes to punch out shape

	coordinates.forEach((points, index) => {
		//for each building do:
		if (index == 0) {
			//create main building shape
			waterShape = generateShape(points);
		} else {
			//create shape of holes in building
			waterShape.holes.push(generateShape(points));
			// buildingHoles.push(generateShape(points));
		}
	});

	waterGeometry = generateGeometry(waterShape, 0.001);
	return waterGeometry;
}

//GENERICS
function generateShape(polygon) {
	let shape = new THREE.Shape(); //only a single polygon?

	polygon.forEach((coordinates, index) => {
		let coords = normalizeCoordinates(coordinates, $.config.citycenter);
		if (index == 0) {
			shape.moveTo(coords[0], coords[1]);
		} else {
			shape.lineTo(coords[0], coords[1]);
		}

		// console.log(coordinates);
		// shape.moveTo(coordinates[0], coordinates[1]);
	});

	return shape;
}

function generateGeometry(shape, height) {
	// let height = 1;
	let geometry = new THREE.ExtrudeBufferGeometry(shape, {
		curveSegments: 1,
		depth: 0.05 * height,
		bevelEnabled: false,
	});

	geometry.rotateX(Math.PI / 2);
	geometry.rotateZ(Math.PI);
	return geometry;
	// // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	// const material = new THREE.MeshPhongMaterial({
	// 	color: $.config.color_buildings,
	// });
	// const mesh = new THREE.Mesh(geometry, material);

	// mesh.updateMatrix();
	// // buildingGeometry.merge(mesh);

	// // console.log(mesh);
	// return mesh;
	// $.scene.add(mesh);
}

function generatePath(polygon) {
	let path = new THREE.Path();
	// path.lineTo()

	polygon.forEach((coordinates, index) => {
		let coords = normalizeCoordinates(coordinates, $.config.citycenter);
		if (index == 0) {
			path.moveTo(coords[0], coords[1]);
		} else {
			path.lineTo(coords[0], coords[1]);
		}

		// console.log(coordinates);
		// shape.moveTo(coordinates[0], coordinates[1]);
	});

	return path;
}

function normalizeCoordinates(objectPosition, centerPosition) {
	// Get GPS distance
	let dis = GEOLIB.getDistance(objectPosition, centerPosition);

	// Get bearing angle
	let bearing = GEOLIB.getRhumbLineBearing(objectPosition, centerPosition);

	// Calculate X by centerPosi.x + distance * cos(rad)
	let x = centerPosition[0] + dis * Math.cos((bearing * Math.PI) / 180);

	// Calculate Y by centerPosi.y + distance * sin(rad)
	let y = centerPosition[1] + dis * Math.sin((bearing * Math.PI) / 180);

	// Reverse X (it work)
	return [-x / 100, y / 100];
}

export { generateCity };

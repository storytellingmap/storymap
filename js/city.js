import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";
import { BufferGeometryUtils as BGU } from "three/examples/jsm/utils/BufferGeometryUtils";

async function loadGeoJsonAsync() {
	return await fetch($.config.data).then((response) => {
		return response.json().then((data) => {
			return data.features;
		});
	});
}

async function generateCity() {
	// LOAD GEOJSON DATA
	let data = await loadGeoJsonAsync();
	// console.log(data);

	// LOADBUILDINGS
	//foreach building, call the addBuilding function
	data.forEach((element) => {
		create3dObject(element);
		// if (element.properties.building) {
		// 	create3dObject(element);
		// 	// addBuilding(
		// 	// 	element.geometry.coordinates,
		// 	// 	element.properties["building:levels"],
		// 	// 	element.properties,
		// 	// );
		// 	// console.log("bla");
		// }
	});
}

function create3dObject(data) {
	let coordinates = data.geometry.coordinates;
	let properties = data.properties;

	if (properties.building) {
		//if data is a building property (if it's a building)
		let building_levels = data.properties["building:levels"] || 1; //if building:levels property exists use it, otherwise use 1

		// $.buildingArray = generateBuildingV2(coordinates, building_levels);
		generateBuildings(coordinates, building_levels);
	}
}

function generateBuildingV1(coordinates, height = 1) {
	//each geojson "object" has multiple arrays of coordinates.
	//the first array is the main (outer) building shape
	//the second & third & .. are the "holes" in the building

	//single building with multiple polygons
	let buildingGeometry = new THREE.BufferGeometry();
	// arrayOfPolygons["group" + counter] = new THREE.Group();

	//for each of the coordinate groups
	coordinates.forEach((polygon, index) => {
		//generate shape
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

		// let height = 1;
		let geometry = new THREE.ExtrudeBufferGeometry(shape, {
			curveSegments: 1,
			depth: 0.05 * height,
			bevelEnabled: false,
		});

		geometry.rotateX(Math.PI / 2);
		geometry.rotateZ(Math.PI);

		// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const material = new THREE.MeshPhongMaterial({
			color: $.config.color_buildings,
		});
		const mesh = new THREE.Mesh(geometry, material);

		mesh.updateMatrix();
		// buildingGeometry.merge(mesh);

		// console.log(mesh);
		$.scene.add(mesh);

		// console.log("end of polygon");
		// arrayOfPolygons["group" + counter].add(shape);
		// element[0];
	});
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

		// console.log(buildingShape.holes);
		// buildingHoles.forEach((hole) => {
		// 	//for each "hole", punch it into the shape
		// 	buildingShape.holes.push(hole);
		// });
	});

	buildingGeometry = generateGeometry(buildingShape, height);

	const material = new THREE.MeshPhongMaterial({
		color: $.config.color_buildings,
	});
	const mesh = new THREE.Mesh(buildingGeometry, material);

	mesh.updateMatrix();
	// buildingGeometry.merge(mesh);

	// console.log(mesh);
	$.scene.add(mesh);
}

function generateRoads(coordinates) {}

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

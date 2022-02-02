import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
// import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

async function loadGeoJsonAsync() {
	return await fetch($.config.data).then((response) => {
		return response.json().then((data) => {
			return data.features;
		});
	});
}

function create3dObjects(data) {
	let coordinates = data.geometry.coordinates;
	let properties = data.properties;

	if (properties.building) {
		//if data is a building property (if it's a building)
		let building_levels = data.properties["building:levels"] || 1; //if building:levels property exists use it, otherwise use 1
		$.buildingArray.push(generateBuilding(coordinates, building_levels));
	} else if (properties.highway && data.geometry.type != "Point") {
		let road = generateRoad(coordinates, properties);
		if (road != undefined) {
			$.roadArray.push(road);
		}
	} else if (properties.natural) {
		$.waterArray.push(generateWater(coordinates, properties));
	} else if (properties.leisure) {
		//test green
		$.greenArray.push(generateGreen(coordinates));
	}
}

// GENERATE SHAPE AND FILL UP ARRAYS
function generateBuilding(coordinates, height = 1) {
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

function generateRoad(coordinates, properties, height = 0) {
	// console.log(1);
	let points = [];

	//check if multi-point road, not a point.
	if (coordinates.length > 1) {
		coordinates.forEach((coordinates) => {
			let coords = normalizeCoordinates(coordinates, $.config.citycenter);
			// points.push(new THREE.Vector3(coords[0], height, coords[1])); //old way
			points.push(coords[0], height, coords[1]);
		});

		// NEW WAY
		let geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(points, 3),
		);

		//OLD WAY
		// let geometry = new THREE.BufferGeometry().setFromPoints(points);
		geometry.rotateZ(Math.PI);
		return geometry;
	} else {
		return undefined;
	}
}

function generateWater(coordinates, properties, height = 0.007) {
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

	waterGeometry = generateGeometry(waterShape, height);
	return waterGeometry;
}

function generateGreen(coordinates, height = 0) {
	//each geojson "object" has multiple arrays of coordinates.
	//the first array is the main (outer) building shape
	//the second & third & .. are the "holes" in the building
	let greenShape, greenGeometry; //main building
	// let buildingHoles = []; //holes to punch out shape

	coordinates.forEach((points, index) => {
		//for each building do:
		if (index == 0) {
			//create main building shape
			greenShape = generateShape(points);
		} else {
			//create shape of holes in building
			greenShape.holes.push(generateShape(points));
			// buildingHoles.push(generateShape(points));
		}
	});

	greenGeometry = generateGeometry(greenShape, height);
	return greenGeometry;
}

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

//SPAWN GENERATED OBJECTS
function spawnBuildings() {
	let mergedGeometry = mergeBufferGeometries($.buildingArray);

	const material = new THREE.MeshPhongMaterial({
		color: $.config.color_buildings,
	});
	const mesh = new THREE.Mesh(mergedGeometry, material);
	mesh.name = "BUILDINGS";
	mesh.updateMatrix();
	// buildingGeometry.merge(mesh);
	mesh.layers.set(0);
	mesh.frustumCulled = false;
	// console.log(mesh);
	$.scene.add(mesh);
}

function spawnRoads() {
	$.roadArray.forEach((road, index) => {
		let line = new THREE.Line(road, $.material_road);
		line.name = "ROAD" + index;
		line.layers.set(1);
		line.frustumCulled = false;
		$.scene.add(line);
	});

	// for (let index = 0; index < 50; index++) {
	// 	console.log($.roadArray[index]);
	// }
}

function spawnWater() {
	let mergedGeometry = mergeBufferGeometries($.waterArray);

	const mesh = new THREE.Mesh(mergedGeometry, $.material_water);
	mesh.name = "WATER";
	mesh.updateMatrix();

	mesh.position.y -= 0.01;
	mesh.layers.set(0);
	mesh.frustumCulled = false;
	$.scene.add(mesh);
}

function spawnGreen() {
	let mergedGeometry = mergeBufferGeometries($.greenArray);

	const mesh = new THREE.Mesh(mergedGeometry, $.material_green);
	mesh.name = "GREEN";
	mesh.updateMatrix();

	mesh.position.y -= 0.01;
	mesh.layers.set(0);
	mesh.frustumCulled = false;
	$.scene.add(mesh);
}

//GENERAL FUNCTION
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

//main function
async function generateCity(
	config = { buildings: true, roads: true, water: true, green: true },
) {
	// LOAD GEOJSON DATA
	let data = await loadGeoJsonAsync();
	// console.log(data);

	//generate shapes, meshes and lines
	data.forEach((element) => {
		create3dObjects(element, config);
	});

	spawnBuildings();
	spawnRoads();
	spawnWater();
	spawnGreen();
	// if (config.buildings) {
	// 	spawnBuildings();
	// }
	// if (config.roads) {
	// 	spawnRoads();
	// }
	// if (config.water) {
	// 	spawnWater();
	// }
	// if (config.green) {
	// 	spawnGreen();
	// }
}

export { generateCity };

function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
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

function onPointerMove(event) {
	pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
	raycaster.setFromCamera(pointer, camera);

	// See if the ray from the camera into the world hits one of our meshes
	const intersects = raycaster.intersectObject(grid);

	// Toggle rotation bool for meshes that we clicked
	if (intersects.length > 0) {
		helper.position.set(0, 0, 0);
		helper.lookAt(intersects[0].face.normal);

		helper.position.copy(intersects[0].point);
	}
}

function loadData() {
	return fetch("./data/bruges.geojson").then((res) => {
		res.json().then((data) => {
			// console.log(data.features[0].geometry.coordinates);
			// loadBuildings(data.features);
			console.log(data.features);
		});
	});
}

function loadBuildings(data) {
	data.forEach((element) => {
		if (element.properties.building) {
			addBuilding(
				element.geometry.coordinates,
				element.properties["building:levels"],
				element.properties,
			);
			// console.log("bla");
		}
	});
	// console.log(data);
	// for (let i = 0; i < 1; i++) {
	// 	console.log(data[i]);
	// 	// if (data.properties) {
	// 	// 	console.log("bla");
	// 	// }
	// }
}

function addBuilding(coordinates, height = 1, info) {
	//a building's coordinates are an array of an array of coordinates, with the latter being a polygon.
	//buildings can have multiple polygons.
	//so you need nested for each -> one per polygon and one for all points in the polygon
	// console.log(coordinates);
	// coordinates.forEach((element) => {});
	// let arrayOfBuildings;
	// let counter = 0;

	generateBuilding(coordinates);
}

export { resize, normalizeCoordinates };

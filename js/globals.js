import * as THREE from "three";

export const GLOBAL = {
	scene: null,
	camera: null,
	renderer: null,
	controls: null,
	stats: null,
	buildingArray: [],
	config: {
		debug: true,
		data: "./data/bruges-small.geojson",
		container: "container",
		citycenter: [3.227183, 51.209651],
		color_background: 0x222222,
		color_buildings: 0xfafafa,
		grid: { primary: 0x555555, secondary: 0x333333 },
		color_ground: 0x00ff00,
		opacity_ground: 0.25,
	},
	material_ground: new THREE.MeshPhongMaterial({
		color: 0x00ff00,
		transparent: true,
		opacity: 0.25,
	}),
};

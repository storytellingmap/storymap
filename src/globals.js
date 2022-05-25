import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

export const GLOBAL = {
	container: null,
	containerSize: new THREE.Vector2(),

	scene: null,

	camera: null,
	cameraLookAtPos: new THREE.Vector3(13, 0, 6),
	cameraLookStartPos: [13, 0, 6],
	cameraStartPos: new THREE.Vector3(10, 10, 6),
	cameraPos: new THREE.Vector3(10, 10, 6),
	cameraPath: null,

	renderer: null,
	controls: null,
	stats: null,

	buildingArray: [],
	roadArray: [],
	waterArray: [],
	greenArray: [],

	scrollpercentage: 0,
	line: null,
	lineArray: [],
	lineArrayBackup: [],
	lineClickCounter: 0,
	lineClickMax: 0,
	mouseposition: new THREE.Vector3(),
	raycaster: new THREE.Raycaster(),
	hit: false,

	config: {
		debug: true,
		data: "/node_modules/storymap/sample/bruges.geojson",
		path: "/node_modules/storymap/sample/path.json",
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
	material_road: new THREE.LineBasicMaterial({
		color: 0x000000,
		transparent: true,
		linewidth: 1,
		opacity: 0.25,
	}),
	material_water: new THREE.MeshPhongMaterial({
		color: 0x42a5f5,
		transparent: false,
		opacity: 1,
	}),
	material_green: new THREE.MeshPhongMaterial({
		color: 0x81c784,
		transparent: false,
		opacity: 1,
	}),
};

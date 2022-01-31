import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

export const GLOBAL = {
	scene: null,
	camera: null,
	cameraLookAtPos: new THREE.Vector3(0, 0, 0),
	cameraPos: new THREE.Vector3(8, 2, 1),
	renderer: null,
	controls: null,
	stats: null,
	buildingArray: [],
	roadArray: [],
	waterArray: [],

	scrollpercentage: 0,
	line: null,
	lineArray: [],
	lineArrayBackup: [],
	lineClickCounter: 0,
	mouseposition: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),

	config: {
		debug: true,
		data: "./data/bruges-small.geojson",
		path: "./data/path.json",
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
		color: 0x00ff00,
		transparent: false,
		linewidth: 10,
		opacity: 1,
	}),
	material_road2: new LineMaterial({
		color: 0xffffff,
		linewidth: 5, // in world units with size attenuation, pixels otherwise
		vertexColors: true,
		//resolution:  // to be set by renderer, eventually
		dashed: false,
		alphaToCoverage: false,
	}),
};

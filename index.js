import { GLOBAL as global } from "./src/globals";
import { initialize, animate } from "./src/initialize";
import { generateCity } from "./src/city";
import { generatePath } from "./src/path";
import { animatePath } from "./src/animate";

async function setup(
	config = {
		mode: "setup",
		buildings: true,
		roads: true,
		water: true,
		green: true,
	},
) {
	initialize(); //create threejs scene, populate global variables
	animate(); //animation loop
	generateCity(config.buildings, config.roads, config.water, config.green); //create 3D city from geojson data
	generatePath(); //create menu/code to draw a path in the city
}

async function start(
	config = {
		buildings: true,
		roads: true,
		water: true,
		green: true,
	},
) {
	initialize(); //create threejs scene, populate global variables
	animate();
	generateCity(config);
	animatePath(); //animates the created path from setup
}

export { setup, start, global };

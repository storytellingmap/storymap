import { GLOBAL as global } from "./src/globals";
import { initialize, animate } from "./src/initialize";
import { generateCity } from "./src/city";
import { generatePath } from "./src/path";
import { animatePath } from "./src/animate";

function setup() {
	initialize(); //create threejs scene, populate global variables
	animate(); //animation loop
	generateCity(); //create 3D city from geojson data
	generatePath(); //create menu/code to draw a path in the city
}

function start() {
	initialize(); //create threejs scene, populate global variables
	animate();
	generateCity();
	animatePath(); //animates the created path from setup
}

export { setup, start, global };

import { GLOBAL as global } from "./js/globals";
import { initialize, animate } from "./js/initialize";
import { generateCity } from "./js/city";
import { generatePath } from "./js/path";
import { animatePath } from "./js/animate";

// initialize(); //create threejs scene, populate global variables
// animate();
// generateCity();
// generateCity();
// generatePath();
// animatePath();

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

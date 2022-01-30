import { GLOBAL as global } from "./globals";
import { initialize, animate } from "./initialize";
import { generateCity } from "./city";
import { generatePath } from "./path";
import { animatePath } from "./animate";

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

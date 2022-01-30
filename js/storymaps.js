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

function setup(config = null) {
	initialize(); //create threejs scene, populate global variables
	animate();
	generateCity();
	generatePath();
}

function start(config = null) {
	initialize(); //create threejs scene, populate global variables
	animate();
	generateCity();
	animatePath();
}

export { setup, start, global };

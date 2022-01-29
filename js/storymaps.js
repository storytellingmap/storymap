import { GLOBAL as global } from "./globals";
import { initialize, animate } from "./initialize";
import { generateCity } from "./city";

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
}

function start(config = null) {
	initialize(); //create threejs scene, populate global variables
	animate();
	generateCity();
}

export { setup, start, global };

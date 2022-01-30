// import * as storymaps from "./js/storymaps";
// // import * as storypath from "./js/storypath";

// const config = {
// 	container: "container",
// 	color_background: 0x222222,
// 	color_buildings: 0xfafafa,
// 	debug: true,
// 	data: "./data/bruges.geojson",
// };

// storymaps.initialize(config);
// storymaps.animate();
// // storymaps.loadData();
// storymaps.generate();

//HOW TO DO IT
import * as storymaps from "./js/storymaps";

// storymaps.global.config = {
// 	data: "./data/bruges-small.geojson",
// 	container: "container",
// 	color_background: 0x222222,
// 	color_buildings: 0xfafafa,
// 	grid: { primary: 0x555555, secondary: 0x333333 },
// 	debug: true,
// 	citycenter: [3.227183, 51.209651],
// };

storymaps.global.config = {
	debug: true,
	data: "./data/bruges-complete.geojson",
	container: "container",
	citycenter: [3.227183, 51.209651],
	color_background: 0x222222,
	color_buildings: 0xfafafa,
	grid: { primary: 0x555555, secondary: 0x333333 },
	color_ground: 0x00ff00,
	opacity_ground: 0.25,
};

storymaps.setup();
// storymaps.initialize(config);
// storymaps.configure();
// storymaps.start();

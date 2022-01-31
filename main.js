import * as storymaps from "./js/storymaps";

storymaps.global.config = {
	debug: true,
	data: "./data/bruges-complete.geojson",
	path: "./data/path.json",
	container: "container",
	citycenter: [3.227183, 51.209651],
	color_background: 0x222222,
	color_buildings: 0xfafafa,
	grid: { primary: 0x555555, secondary: 0x333333 },
	color_ground: 0x00ff00,
	opacity_ground: 0.25,
};

// storymaps.setup();
storymaps.start();

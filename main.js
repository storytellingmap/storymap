import * as storymaps from "./js/storymaps";

const config = {
	container: "container",
	color_background: 0x222222,
	color_buildings: 0xfafafa,
	debug: true,
};

storymaps.initialize(config);
storymaps.animate();
// storymaps.loadData();
storymaps.generate();

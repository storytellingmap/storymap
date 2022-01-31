import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { Vector3 } from "three";

/*
create threejs scene, populate global variables
*/
function initialize() {
	//initializes threeJS scene.
	//variables:
	// color_buildings = config.color_buildings;
	//background_color is a hexadecimal value of the threejs scene's background

	//local variables
	const container = document.getElementById($.config.container);

	//initialize threejs scene
	$.scene = new THREE.Scene();
	$.scene.background = new THREE.Color($.config.color_background);

	//initialize threejs camera
	$.camera = new THREE.PerspectiveCamera(
		25,
		window.innerWidth / window.innerHeight,
		0.1,
		2000,
	);
	// $.camera.position.set(8, 2, 1);
	$.camera.position.set($.cameraPos.x, $.cameraPos.y, $.cameraPos.z);

	//RAYCASTING
	// const geometryHelper = new THREE.ConeGeometry(20, 100, 3);
	// geometryHelper.translate(0, 50, 0);
	// geometryHelper.rotateX(Math.PI / 2);
	// helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
	// scene.add(helper);
	// container.addEventListener("pointermove", onPointerMove);

	// //initialize group
	// iR = new THREE.Group();
	// iR = "Interactive Root";

	//initialize lights
	// const light1 = new THREE.AmbientLight(0xfafafa, 0.25);
	let light0 = new THREE.AmbientLight(0xfafafa, 0.25);

	let light1 = new THREE.PointLight(0xfafafa, 0.4);
	light1.position.set(200, 90, 40);

	let light2 = new THREE.PointLight(0xfafafa, 0.4);
	light2.position.set(200, 90, -40);

	$.scene.add(light0);
	$.scene.add(light1);
	$.scene.add(light2);

	//initialize renderer
	$.renderer = new THREE.WebGLRenderer({ antialias: true });
	$.renderer.setPixelRatio(window.devicePixelRatio);
	$.renderer.setSize(window.innerWidth, window.innerHeight);

	container.appendChild($.renderer.domElement);

	//initialize resize
	window.addEventListener("resize", resize, false);

	//initialize helpers
	if ($.config.debug == true) {
		// const lightHelper0 = new THREE.PointLightHelper(light0);
		// const lightHelper1 = new THREE.PointLightHelper(light1);
		// const lightHelper2 = new THREE.PointLightHelper(light2);
		// $.scene.add(lightHelper0, lightHelper1, lightHelper2);

		//const gridHelper
		let grid = new THREE.GridHelper(
			100,
			150,
			new THREE.Color(0x555555),
			new THREE.Color(0x333333),
		);
		$.scene.add(grid);

		//axis
		// const axesHelper = new THREE.AxesHelper(5);
		// $.scene.add(axesHelper);

		//FPS COUNTER
		$.stats = new Stats();
		container.appendChild($.stats.dom);

		//initialize controls
		$.controls = new MapControls($.camera, $.renderer.domElement);
		$.controls.enableDamping = true;
		$.controls.dampingFactor = 0.25;
		$.controls.screenSpacePanning = false;
		$.controls.maxDistance = 800;
		// controls.update(); //runs in animate()
	}
}

function resize() {
	$.camera.aspect = window.innerWidth / window.innerHeight;
	$.camera.updateProjectionMatrix();
	$.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	$.renderer.render($.scene, $.camera);
	$.controls.update();

	if ($.config.debug == true) {
		$.stats.update();
	}
}

export { initialize, animate };

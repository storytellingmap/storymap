import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

function initialize(mode) {
	//initializes threeJS scene.
	$.container = document.getElementById($.config.container);
	$.containerSize.x = container.clientWidth;
	$.containerSize.y = container.clientHeight;

	//initialize threejs scene
	$.scene = new THREE.Scene();
	$.scene.background = new THREE.Color($.config.color_background);

	//initialize threejs camera
	$.camera = new THREE.PerspectiveCamera(
		25,
		$.containerSize.x / $.containerSize.y,
		0.1,
		2000,
	);

	if (mode == "setup") {
		$.camera.position.set(8, 2, 1);
		$.camera.lookAt(0, 0, 0);
	} else {
		$.camera.position.set($.cameraPos.x, $.cameraPos.y, $.cameraPos.z);
		$.camera.lookAt(
			$.cameraLookStartPos.x,
			$.cameraLookStartPos.y,
			$.cameraLookStartPos.z,
		);
	}

	$.camera.layers.enable(0); //everything
	$.camera.layers.enable(1); //roads

	//initialize lights
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
	$.renderer.setSize($.containerSize.x, $.containerSize.y);

	container.appendChild($.renderer.domElement);

	//initialize resize
	window.addEventListener("resize", resize, false);

	//initialize helpers
	if ($.config.debug == true) {
		// const lightHelper0 = new THREE.PointLightHelper(light0);
		// const lightHelper1 = new THREE.PointLightHelper(light1);
		// const lightHelper2 = new THREE.PointLightHelper(light2);
		// $.scene.add(lightHelper0, lightHelper1, lightHelper2);

		//axis
		// const axesHelper = new THREE.AxesHelper(5);
		// $.scene.add(axesHelper);

		//FPS COUNTER
		$.stats = new Stats();
		container.appendChild($.stats.dom);
		// console.log();

		//initialize controls
		$.controls = new MapControls($.camera, $.renderer.domElement);
		$.controls.enableDamping = true;
		$.controls.dampingFactor = 0.25;
		$.controls.screenSpacePanning = false;
		$.controls.maxDistance = 800;
		// controls.update(); //runs in animate()
	} else {
		//const gridHelper
		let grid = new THREE.GridHelper(
			100,
			150,
			new THREE.Color(0x555555),
			new THREE.Color(0x333333),
		);
		grid.layers.set(0);
		$.scene.add(grid);
	}
}

function resize() {
	$.container = document.getElementById($.config.container);
	$.containerSize.x = container.clientWidth;
	$.containerSize.y = container.clientHeight;

	$.camera.aspect = $.containerSize.x / $.containerSize.y;
	$.camera.updateProjectionMatrix();
	$.renderer.setSize($.containerSize.x, $.containerSize.y);
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

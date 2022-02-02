function cameraMoveToStart(percentage) {
	let float = 5;

	let location = new THREE.Vector3(
		$.lineArrayBackup[1 * 3 - 3] + float,
		$.lineArrayBackup[1 * 3 - 2] + float,
		$.lineArrayBackup[1 * 3 - 1] + float,
	);

	$.cameraPos = new THREE.Vector3().lerpVectors(
		$.cameraPos,
		location,
		percentage,
	);
	$.camera.position.set($.cameraPos.x, 2, $.cameraPos.z);

	// $.camera.position.x = camPos.x;
	// $.camera.position.y = camPos.y;
	// $.camera.position.z = camPos.z;
}

function cameraFollowCurve(percentage) {
	let camPos = $.cameraPath.getPoint(percentage);
	// let camRot = $.cameraPath.getTangent(percentage);

	$.camera.position.set(camPos);
	// $.camera.position.x = camPos.x;
	// // $.camera.position.y = camPos.y;
	// $.camera.position.z = camPos.z;

	// $.camera.rotation.x = camRot.x;
	// $.camera.rotation.y = camRot.y;
	// $.camera.rotation.z = camRot.z;
}

animationScripts.push({
	start: 1,
	end: 100,
	func: () => {
		let percentage = scalePercent(1, 100);

		// console.log(percent);
		// cameraFollowCurve(percent);
		// $.camera.lookAt($.cameraLookAtPos);

		// let float = 0;
		// let location = new THREE.Vector3(
		// 	$.lineArrayBackup[1 * 3 - 3] + float,
		// 	$.lineArrayBackup[1 * 3 - 2] + float,
		// 	$.lineArrayBackup[1 * 3 - 1] + float,
		// );

		// $.cameraPos = new THREE.Vector3().lerpVectors(
		// 	$.cameraLookAtPos,
		// 	location,
		// 	percentage,
		// );
		// console.log($.cameraPos);
		// $.camera.position.set($.cameraPos.x, 2, $.cameraPos.z);
	},
});

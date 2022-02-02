// function createPathThingIDK() {
// 	if (!drag) {
// 		window.addEventListener("click", addRaycaster, false);
// 	} else {
// 		window.removeEventListener("click", addRaycaster, false);
// 	}
// }
// scrollPercentage();
// keyPress();

function scrollPercentage() {
	//initialize scrollPercentage text
	document.getElementById("scrollProgress").innerText =
		"Scroll Progress : 00.00";

	document.addEventListener("scroll", getScrollPercentage, false);

	function getScrollPercentage() {
		$.scrollpercentage =
			((document.documentElement.scrollTop || document.body.scrollTop) /
				((document.documentElement.scrollHeight ||
					document.body.scrollHeight) -
					document.documentElement.clientHeight)) *
			100;
		document.getElementById("scrollProgress").innerText =
			"Scroll Progress : " + $.scrollpercentage.toFixed(2);
	}

	function showScrollPercentage() {}
}

function keyPress() {
	document.addEventListener("keyup", onKeyUp, false);

	function onKeyUp(event) {
		if (event.key == "s") {
			console.log("start drawing path");
			window.addEventListener("click", addRaycaster, false);
			// window.addEventListener("mousemove", onMouseMove, false);
		}
		if (event.key == "f") {
			console.log("finish and save path.");
			window.removeEventListener("click", addRaycaster, false);
			// window.removeEventListener("mousemove", onMouseMove, false);
			savePath();
		}
	}
}

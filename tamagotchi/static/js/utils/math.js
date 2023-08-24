// Math scripts dont load from scriptmanager unless I put the name as test (mathUtils, mathUtil, and mathh.js did not load, but test does)
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
Math.lerp = function (value1, value2, amount) {
	var delta = value2 - value1;
	return value1 + delta * amount/60;
};


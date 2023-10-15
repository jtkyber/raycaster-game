export function degToRad(deg) {
	return deg * (Math.PI / 180);
}

export function radToDeg(rad) {
	return rad * (180 / Math.PI);
}

export function getIntersection(x, y, r, theta, x1, y1, x2, y2, p4) {
	const x3 = x;
	const y3 = y;
	let x4;
	let y4;
	let uMax = Infinity;

	if (p4?.x && p4?.y) {
		x4 = p4.x;
		y4 = p4.y;
		uMax = 1;
	} else {
		x4 = x + r * Math.cos(theta);
		y4 = y + r * Math.sin(theta);
	}

	const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

	if (denom == 0) {
		return;
	}

	const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
	const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denom;

	if (t > 0 && t < 1 && u > 0 && u <= uMax) {
		const px = x3 + u * (x4 - x3);
		const py = y3 + u * (y4 - y3);
		return [px, py];
	} else {
		return;
	}
}

export function convertDeg0To360(deg) {
	return ((deg % 360) + 360) % 360;
}

export function getPerpCoords(playerX, playerY, x, y, halfLen) {
	const slope = (x - playerY) / (y - playerX);
	const perpSlope = -(1 / slope);
	const angle = Math.atan(perpSlope);
	const x1 = x + halfLen * Math.cos(angle);
	const y1 = y + halfLen * Math.sin(angle);
	const x2 = x - halfLen * Math.cos(angle);
	const y2 = y - halfLen * Math.sin(angle);
	return [x1, y1, x2, y2];
}

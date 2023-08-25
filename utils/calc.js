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

	if (t >= 0 && t <= 1 && u >= 0 && u <= uMax) {
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

export function convertRad0To2PI(rad) {
	return rad % 2;
}

// getIntersectionOfTile = (x, y, col, row, theta) => {
// 	const x1 = col * this.TILE_SIZE;
// 	const y1 = row * this.TILE_SIZE;

// 	const x2 = x1 + this.TILE_SIZE;
// 	const y2 = y1;

// 	const x3 = x2;
// 	const y3 = y1 + this.TILE_SIZE;

// 	const x4 = x1;
// 	const y4 = y3;

// 	// const theta2 = this.fPlayerY - y / this.fPlayerX - x;
// 	const ang = Math.atan(this.fPlayerY - y / this.fPlayerX - x);
// 	if (theta >= this.RAD270 && theta < this.RAD360) {
// 		// Check bottom left corner
// 		const angToBotLeft = Math.atan(this.fPlayerY - y4 / this.fPlayerX - x4);
// 		// console.log(1, ang, angToBotLeft);
// 		if (ang < angToBotLeft) {
// 			// console.log('left');
// 		} else {
// 			console.log('bottom');
// 		}
// 	} else if (theta >= this.RAD0 && theta < this.RAD90) {
// 		// Check top left corner
// 		const angToTopLeft = this.fPlayerY - y1 / this.fPlayerX - x1;
// 		// console.log(2, angToTopLeft, theta2);
// 	} else if (theta >= this.RAD90 && theta < this.RAD180) {
// 		// Check top right corner
// 		const angToTopRight = this.fPlayerY - y2 / this.fPlayerX - x2;
// 		// console.log(3, angToTopRight, theta2);
// 	} else if (theta >= this.RAD180 && theta < this.RAD270) {
// 		// Check bottom right corner
// 		const angToBotRight = this.fPlayerY - y3 / this.fPlayerX - x3;
// 		// console.log(4, angToBotRight, theta2);
// 	}
// };

// const STEP_SIZE = this.TILE_SIZE / 2;
// Diag dist of map
// const MAX_DIST_TO_CHECK = Math.sqrt(this.MAP_WIDTH * this.MAP_WIDTH + this.MAP_HEIGHT * this.MAP_HEIGHT);

// const xStep = STEP_SIZE * Math.cos(adjustedAngle);
// const yStep = STEP_SIZE * Math.sin(adjustedAngle);

// let x = this.fPlayerX + xStep;
// let y = this.fPlayerY + yStep;

// // Increment along ray until collision
// while (x > 0 && x < this.MAP_WIDTH && y > 0 && y < this.MAP_HEIGHT) {
// 	const col = Math.floor(x / this.TILE_SIZE);
// 	const row = Math.floor(y / this.TILE_SIZE);
// 	const tileIndex = row * this.MAP_COLS + col;

// 	this.debugCtx.fillStyle = `rgba(0,255,0,1)`;
// 	this.debugCtx.beginPath();
// 	this.debugCtx.ellipse(x, y, 2, 2, 0, 0, 2 * Math.PI);
// 	this.debugCtx.fill();

// 	if (this.map1[tileIndex] > 0) {
// 		this.getIntersectionOfTile(x, y, col, row, adjustedAngle);
// 		continue rayLoop;
// 	}
// 	x += xStep;
// 	y += yStep;
// }

// if (theta >= this.RAD270 && theta < this.RAD360 && (side === 0 || side === 1)) {
// 	// Ray pointing NE
// 	if (rayIndex === 0) console.log(side, this.RAD270, this.RAD360, theta);
// 	continue tileLoop;
// } else if (theta >= this.RAD0 && theta < this.RAD90 && (side === 1 || side === 2)) {
// 	// Ray pointing SE
// 	if (rayIndex === 0) console.log(side, theta);
// 	continue tileLoop;
// } else if (theta >= this.RAD90 && theta < this.RAD180 && (side === 2 || side === 3)) {
// 	// Ray pointing SW
// 	continue tileLoop;
// } else if (theta >= this.RAD180 && theta < this.RAD270 && (side === 0 || side === 3)) {
// 	// Ray pointing NW
// 	continue tileLoop;
// }

import { degToRad, getIntersection } from '../utils/calc.js';
import { map1 } from './maps.js';

class GameWindow {
	constructor() {
		this.canvas = document.getElementById('canvas');
		this.canvasWidth = this.canvas.width;
		this.canvasHeight = this.canvas.height;
		this.ctx = this.canvas.getContext('2d', { alpha: false });

		this.offscreenCanvas = document.createElement('canvas');
		this.offscreenCanvas.width = canvas.width;
		this.offscreenCanvas.height = canvas.height;
		this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d');
		this.offscreenCanvasPixels = this.offscreenCanvasContext.getImageData(
			0,
			0,
			this.canvasWidth,
			this.canvasWidth
		);

		this.fWall1TextureBuffer;
		this.fWall1TexturePixels;

		this.fFloorTextureBuffer;
		this.fFloorTexturePixels;

		this.fCeilingTextureBuffer;
		this.fCeilingTexturePixels;

		this.bytesPerPixel = 4;

		this.frameRate = 30;
		this.speedMultiplier = this.frameRate / 60;
		this.frameCount = 0;
		this.framesCounted = 0;
		this.animationFrameId = null;
		this.now = 0;
		this.then = 0;
		this.elapsed = 0;

		this.TILE_SIZE = 64;
		this.WALL_HEIGHT = 64;
		this.MAP_COLS = 32;
		this.MAP_ROWS = 32;
		this.MAP_WIDTH = this.TILE_SIZE * this.MAP_COLS;
		this.MAP_HEIGHT = this.TILE_SIZE * this.MAP_ROWS;

		this.map1 = map1;

		this.debugCanvas = document.getElementById('debugCanvas');
		this.debugCanvas.width = this.MAP_WIDTH;
		this.debugCanvas.height = this.MAP_HEIGHT;
		this.debugCanvasWidth = this.debugCanvas.width;
		this.debugCanvasHeight = this.debugCanvas.height;
		this.debugCtx = this.debugCanvas.getContext('2d', { alpha: false });

		this.PROJECTIONPLANEWIDTH = this.canvasWidth;
		this.PROJECTIONPLANEHEIGHT = this.canvasHeight;

		this.fProjectionPlaneYCenter = this.PROJECTIONPLANEHEIGHT / 2;

		this.fPlayerX = 100;
		this.fPlayerY = 100;
		this.fPlayerAngle = 20;
		this.fPlayerFov = 60;
		this.fPlayerHeight = this.TILE_SIZE / 2;
		this.fPlayerSpeed = 5 / this.speedMultiplier;
		this.fPlayerDistanceToProjectionPlane = Math.floor(
			this.PROJECTIONPLANEWIDTH / 2 / Math.tan(degToRad(this.fPlayerFov) / 2)
		);

		this.fKeyForward = false;
		this.fKeyBack = false;
		this.fKeyLeft = false;
		this.fKeyRight = false;

		this.fRotationDir = '';

		this.fWallTextureCanvas;
		this.fWallTexturePixels;

		this.fFishTable = new Float32Array(this.PROJECTIONPLANEWIDTH);

		this.RAD0 = 0;
		this.RAD90 = (3 * Math.PI) / 2;
		this.RAD180 = Math.PI;
		this.RAD270 = Math.PI / 2;
		this.RAD360 = 2 * Math.PI;

		this.rayAngles = null;
		this.rayLengths = null;
		this.tileCollisionsX = null;
		this.tileCollisionsY = null;
		this.tileTypes = null;
		this.tileDirs = null;

		this.extraRay = {
			angle: 0,
			length: 0,
			tileCollisionX: 0,
			tileCollisionY: 0,
			tileDir: 0,
		};

		this.texturePaths = ['../public/wall1.png', '../public/floor.png', '../public/ceiling.png'];
		this.textures = {};

		this.userIsInTab = false;

		this.DEBUG = false;
	}

	getSourceIndex = (x, y, textureBuffer) => {
		const tileRow = Math.floor(x % this.TILE_SIZE);
		const tileCol = Math.floor(y % this.TILE_SIZE);
		return tileRow * textureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;
	};

	drawFillRectangle = (x, y, width, height, red, green, blue, alpha) => {
		const bytesPerPixel = 4;
		const targetIndex = bytesPerPixel * this.offscreenCanvasPixels.width * y + bytesPerPixel * x;
		for (let h = 0; h < height; h++) {
			for (let w = 0; w < width; w++) {
				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
				targetIndex += bytesPerPixel;
			}
			targetIndex += bytesPerPixel * (this.offscreenCanvasPixels.width - width);
		}
	};

	drawCeiling = (wallTop, castColumn, rayAng) => {
		let targetIndex =
			wallTop * (this.offscreenCanvasPixels.width * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		for (let row = wallTop; row >= 0; row--) {
			const ratio = (this.WALL_HEIGHT - this.fPlayerHeight) / (this.fProjectionPlaneYCenter - row);

			const diagDist = Math.floor(
				this.fPlayerDistanceToProjectionPlane * ratio * this.fFishTable[castColumn]
			);

			let xEnd = Math.floor(diagDist * Math.cos(rayAng));
			let yEnd = Math.floor(diagDist * Math.sin(rayAng));

			xEnd += this.fPlayerX;
			yEnd += this.fPlayerY;

			const cellX = Math.floor(xEnd / this.TILE_SIZE);
			const cellY = Math.floor(yEnd / this.TILE_SIZE);

			if (cellX < this.MAP_WIDTH && cellY < this.MAP_HEIGHT && cellX >= 0 && cellY >= 0) {
				const sourceIndex = this.getSourceIndex(xEnd, yEnd, this.fFloorTextureBuffer);

				const brighnessLevel = 200 / diagDist;
				const red = Math.floor(this.fCeilingTexturePixels[sourceIndex] * brighnessLevel);
				const green = Math.floor(this.fCeilingTexturePixels[sourceIndex + 1] * brighnessLevel);
				const blue = Math.floor(this.fCeilingTexturePixels[sourceIndex + 2] * brighnessLevel);
				const alpha = Math.floor(this.fCeilingTexturePixels[sourceIndex + 3]);

				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;

				targetIndex -= this.bytesPerPixel * this.offscreenCanvasPixels.width;
			}
		}
	};

	drawFloor = (wallBottom, castColumn, rayAng) => {
		let targetIndex =
			wallBottom * (this.offscreenCanvasPixels.width * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		for (let row = wallBottom; row < this.PROJECTIONPLANEHEIGHT; row++) {
			const ratio = this.fPlayerHeight / (row - this.fProjectionPlaneYCenter);

			const diagDist = Math.floor(
				this.fPlayerDistanceToProjectionPlane * ratio * this.fFishTable[castColumn]
			);

			let xEnd = Math.floor(diagDist * Math.cos(rayAng));
			let yEnd = Math.floor(diagDist * Math.sin(rayAng));

			xEnd += this.fPlayerX;
			yEnd += this.fPlayerY;

			const cellX = Math.floor(xEnd / this.TILE_SIZE);
			const cellY = Math.floor(yEnd / this.TILE_SIZE);

			if (cellX < this.MAP_WIDTH && cellY < this.MAP_HEIGHT && cellX >= 0 && cellY >= 0) {
				const sourceIndex = this.getSourceIndex(xEnd, yEnd, this.fFloorTextureBuffer);

				const brighnessLevel = 200 / diagDist;
				const red = Math.floor(this.fFloorTexturePixels[sourceIndex] * brighnessLevel);
				const green = Math.floor(this.fFloorTexturePixels[sourceIndex + 1] * brighnessLevel);
				const blue = Math.floor(this.fFloorTexturePixels[sourceIndex + 2] * brighnessLevel);
				const alpha = Math.floor(this.fFloorTexturePixels[sourceIndex + 3]);

				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;

				targetIndex += this.bytesPerPixel * this.offscreenCanvasPixels.width;
			}
		}
	};

	drawWallSliceRectangleTinted = (
		x,
		rectTop,
		height,
		xOffset,
		brighnessLevel,
		textureBuffer,
		texturePixels
	) => {
		x = Math.floor(x);
		rectTop = Math.floor(rectTop);
		xOffset = Math.floor(xOffset);

		let sourceIndex = this.bytesPerPixel * xOffset;
		const lastSourceIndex = sourceIndex + textureBuffer.width * textureBuffer.height * this.bytesPerPixel;

		let targetIndex =
			this.offscreenCanvasPixels.width * this.bytesPerPixel * rectTop + this.bytesPerPixel * x;

		let heightToDraw = height;

		if (rectTop + heightToDraw > this.offscreenCanvasPixels.height)
			heightToDraw = this.offscreenCanvasPixels.height - rectTop;

		let yError = 0;

		if (heightToDraw < 0) return;

		while (true) {
			yError += height;

			const red = Math.floor(texturePixels[sourceIndex] * brighnessLevel);
			const green = Math.floor(texturePixels[sourceIndex + 1] * brighnessLevel);
			const blue = Math.floor(texturePixels[sourceIndex + 2] * brighnessLevel);
			const alpha = Math.floor(texturePixels[sourceIndex + 3]);

			while (yError >= textureBuffer.width) {
				yError -= textureBuffer.width;
				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
				targetIndex += this.bytesPerPixel * this.offscreenCanvasPixels.width;

				heightToDraw--;
				if (heightToDraw < 1) return;
			}

			sourceIndex += this.bytesPerPixel * textureBuffer.width;
			if (sourceIndex > lastSourceIndex) sourceIndex = lastSourceIndex;
		}
	};

	draw3dWalls = () => {
		let wallX = 0;

		for (let i = 0; i < this.rayLengths.length; i++) {
			let dist = this.rayLengths[i] / this.fFishTable[i];

			const wallHeight = (this.TILE_SIZE / dist) * this.fPlayerDistanceToProjectionPlane;
			const wallWidth = this.PROJECTIONPLANEWIDTH / this.rayAngles.length;
			const wallBottom = this.PROJECTIONPLANEHEIGHT / 2 + wallHeight * 0.5;
			const wallTop = this.PROJECTIONPLANEHEIGHT - wallBottom;

			let adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			if (adjustedAngle < 0) adjustedAngle += 2 * Math.PI;

			this.drawFloor(Math.floor(wallBottom), i, adjustedAngle);
			this.drawCeiling(Math.floor(wallTop), i, adjustedAngle);

			let offset =
				this.tileDirs?.[i] === 0 || this.tileDirs?.[i] === 2
					? this.tileCollisionsX[i] % this.TILE_SIZE
					: this.tileCollisionsY[i] % this.TILE_SIZE;

			let offset2;

			if (i === this.rayLengths.length - 1) {
				offset2 =
					this.extraRay.tileDir === 0 || this.extraRay.tileDir === 2
						? this.extraRay.tileCollisionX % this.TILE_SIZE
						: this.extraRay.tileCollisionY % this.TILE_SIZE;
			} else {
				offset2 =
					this.tileDirs?.[i + 1] === 0 || this.tileDirs?.[i + 1] === 2
						? this.tileCollisionsX[i + 1] % this.TILE_SIZE
						: this.tileCollisionsY[i + 1] % this.TILE_SIZE;
			}

			if (this.tileDirs?.[i] === 0 || this.tileDirs?.[i] === 1) {
				offset = this.TILE_SIZE - offset;
				offset2 = this.TILE_SIZE - offset2;
			}

			let textureBuffer = this.fWall1TextureBuffer;
			let texturePixels = this.fWall1TexturePixels;
			let brighnessLevel = 160 / dist;

			dist = Math.floor(dist);
			if (brighnessLevel > 1.5) brighnessLevel = 1.5;

			if (this.tileDirs?.[i] === 1 || this.tileDirs?.[i] === 3) {
				brighnessLevel = brighnessLevel * 0.8;
			}

			this.drawWallSliceRectangleTinted(
				i,
				wallTop,
				wallHeight + 1,
				offset,
				brighnessLevel,
				textureBuffer,
				texturePixels
			);

			wallX += wallWidth;
		}
	};

	draw2dWalls = () => {
		let count = 0;
		for (let i = 0; i < this.MAP_ROWS; i++) {
			for (let j = 0; j < this.MAP_COLS; j++) {
				const tile = this.map1[i * this.MAP_COLS + j];

				switch (tile) {
					case 0:
						break;
					case 1:
						this.debugCtx.fillStyle = 'rgb(100, 100, 100)';
						this.debugCtx.beginPath();
						this.debugCtx.fillRect(j * this.TILE_SIZE, i * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
						break;
					case 2:
						this.debugCtx.fillStyle = 'rgb(100, 100, 100)';
						this.debugCtx.beginPath();
						this.debugCtx.fillRect(j * this.TILE_SIZE, i * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
						break;
				}
				count++;
			}
		}
	};

	getIntersectionOfTile = (row, col, theta) => {
		const x1 = col * this.TILE_SIZE;
		const y1 = row * this.TILE_SIZE;

		const x2 = x1 + this.TILE_SIZE;
		const y2 = y1;

		const x3 = x2;
		const y3 = y1 + this.TILE_SIZE;

		const x4 = x1;
		const y4 = y3;

		let record = Infinity;
		let closest = null;
		let dir = 0;

		let tX1 = 0;
		let tY1 = 0;
		let tX2 = 0;
		let tY2 = 0;

		for (let side = 0; side < 4; side++) {
			switch (side) {
				case 0:
					tX1 = x1;
					tY1 = y1;
					tX2 = x2;
					tY2 = y2;
					break;
				case 1:
					tX1 = x2;
					tY1 = y2;
					tX2 = x3;
					tY2 = y3;
					break;
				case 2:
					tX1 = x3;
					tY1 = y3;
					tX2 = x4;
					tY2 = y4;
					break;
				case 3:
					tX1 = x4;
					tY1 = y4;
					tX2 = x1;
					tY2 = y1;
					break;
			}

			const intersection = getIntersection(this.fPlayerX, this.fPlayerY, 1, theta, tX1, tY1, tX2, tY2);
			if (intersection?.[0]) {
				const dx = Math.abs(this.fPlayerX - intersection[0]);
				const dy = Math.abs(this.fPlayerY - intersection[1]);
				const d = Math.sqrt(dx * dx + dy * dy);
				record = Math.min(d, record);
				if (d <= record) {
					record = d;
					closest = intersection;
					dir = side;
				}
			}
		}

		return {
			record,
			closest,
			dir,
		};
	};

	raycaster = () => {
		let tileTypeTemp = 0;
		let tileSideDirTemp = 0;

		for (let i = 0; i < this.rayAngles.length + 1; i++) {
			let adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			if (adjustedAngle < 0) adjustedAngle += 2 * Math.PI;

			if (i === this.rayAngles.length) {
				adjustedAngle = this.extraRay.angle + degToRad(this.fPlayerAngle);
			} else {
				adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			}

			let closest = null;
			let record = Infinity;
			for (let row = 0; row < this.MAP_ROWS; row++) {
				for (let col = 0; col < this.MAP_COLS; col++) {
					const tile = this.map1[row * this.MAP_COLS + col];
					if (tile === 0) continue;

					const tileIntersection = this.getIntersectionOfTile(row, col, adjustedAngle);

					if (tileIntersection.record < record) {
						record = tileIntersection.record;
						closest = tileIntersection.closest;

						tileTypeTemp = tile;
						tileSideDirTemp = tileIntersection.dir;
					}
				}
			}

			if (closest) {
				this.debugCtx.strokeStyle =
					i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
				this.debugCtx.beginPath();
				this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
				this.debugCtx.lineTo(closest[0], closest[1]);
				this.debugCtx.lineWidth = 1;
				this.debugCtx.stroke();

				if (i === this.rayAngles.length) {
					this.extraRay.length = record;
					this.extraRay.tileCollisionX = closest[0];
					this.extraRay.tileCollisionY = closest[1];
					this.extraRay.tileDir = tileSideDirTemp;
				} else {
					this.rayLengths[i] = record;
					this.tileCollisionsX[i] = closest[0];
					this.tileCollisionsY[i] = closest[1];
					this.tileTypes[i] = tileTypeTemp;
					this.tileDirs[i] = tileSideDirTemp;
				}
			} else {
				if (i === this.rayAngles.length) this.rayLengths[i] = Infinity;
				else this.extraRay.length = Infinity;
			}
		}
	};

	drawFps = () => {
		const fontSize = this.PROJECTIONPLANEHEIGHT / 24;
		this.ctx.font = `${fontSize}px arial`;
		this.ctx.fillStyle = this.framesCounted < this.frameRate ? 'red' : 'green';
		this.ctx.fillText(this.framesCounted, 10, fontSize);
	};

	rotate = () => {
		if (this.fRotationDir === 'left') {
			this.fPlayerAngle -= 4;
		} else if (this.fRotationDir === 'right') {
			this.fPlayerAngle += 4;
		}
	};

	move = () => {
		this.rotate();

		const ang = degToRad(this.fPlayerAngle + 90);
		const moveX = this.fPlayerSpeed * Math.cos(Math.PI / 2 - ang);
		const moveY = this.fPlayerSpeed * Math.cos(ang);

		const angStrafe = ang + Math.PI / 2;
		const strafeX = (this.fPlayerSpeed * Math.cos(Math.PI / 2 - angStrafe)) / 2;
		const strafeY = (this.fPlayerSpeed * Math.cos(angStrafe)) / 2;

		if (this.fKeyForward) {
			this.fPlayerX += moveX;
			this.fPlayerY -= moveY;
		} else if (this.fKeyBack) {
			this.fPlayerX -= moveX;
			this.fPlayerY += moveY;
		}

		if (this.fKeyLeft) {
			this.fPlayerX -= strafeX;
			this.fPlayerY += strafeY;
		} else if (this.fKeyRight) {
			this.fPlayerX += strafeX;
			this.fPlayerY -= strafeY;
		}
	};

	update = () => {
		this.animationFrameId = requestAnimationFrame(this.update);
		this.now = Date.now();
		this.elapsed = this.now - this.then;

		if (this.elapsed > 1000 / this.frameRate) {
			if (this.frameCount === 0) {
				setTimeout(() => {
					this.framesCounted = this.frameCount;
					this.frameCount = 0;
				}, 1000);
			}

			this.frameCount += 1;
			this.then = this.now - (this.elapsed % (1000 / this.frameRate));

			this.offscreenCanvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
			this.debugCtx.clearRect(0, 0, this.debugCanvasWidth, this.debugCanvasHeight);
			this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
			this.move();
			this.draw2dWalls();
			this.raycaster();
			this.draw3dWalls();
			this.ctx.putImageData(this.offscreenCanvasPixels, 0, 0);

			this.debugCtx.fillStyle = `rgba(0,255,0,1)`;
			this.debugCtx.beginPath();
			this.debugCtx.ellipse(this.fPlayerX, this.fPlayerY, 4, 4, 0, 0, 2 * Math.PI);
			this.debugCtx.fill();

			this.drawFps();
		}
	};

	setAngles = () => {
		const rayInc = this.fPlayerFov / this.PROJECTIONPLANEWIDTH;
		let ang = 0;
		const rayCount = this.PROJECTIONPLANEWIDTH;
		this.rayAngles = new Float32Array(rayCount);
		this.rayLengths = new Float32Array(rayCount);
		this.tileCollisionsX = new Float32Array(rayCount);
		this.tileCollisionsY = new Float32Array(rayCount);
		this.tileTypes = new Float32Array(rayCount);
		this.tileDirs = new Float32Array(rayCount);

		for (let i = 0; i < this.rayAngles.length; i++) {
			this.rayAngles[i] = degToRad(ang - this.fPlayerFov / 2);
			ang += rayInc;
		}

		for (let i = -this.PROJECTIONPLANEWIDTH / 2; i < this.PROJECTIONPLANEWIDTH / 2; i++) {
			const radian = (i * Math.PI) / (this.PROJECTIONPLANEWIDTH * 3);
			this.fFishTable[i + this.PROJECTIONPLANEWIDTH / 2] = 1 / Math.cos(radian);
		}

		this.extraRay.angle = (ang - this.fPlayerFov / 2) * (Math.PI / 180);
	};

	onWallTextureLoaded = () => {
		this.fWall1TextureBuffer = document.createElement('canvas');
		this.fWall1TextureBuffer.width = this.textures.wall1.width;
		this.fWall1TextureBuffer.height = this.textures.wall1.height;
		this.fWall1TextureBuffer.getContext('2d').drawImage(this.textures.wall1, 0, 0);

		const imgData = this.fWall1TextureBuffer
			.getContext('2d')
			.getImageData(0, 0, this.fWall1TextureBuffer.width, this.fWall1TextureBuffer.height);
		this.fWall1TexturePixels = imgData.data;
	};

	onCeilingTextureLoaded = () => {
		this.fCeilingTextureBuffer = document.createElement('canvas');
		this.fCeilingTextureBuffer.width = this.textures.ceiling.width;
		this.fCeilingTextureBuffer.height = this.textures.ceiling.height;
		this.fCeilingTextureBuffer.getContext('2d').drawImage(this.textures.ceiling, 0, 0);

		const imgData = this.fCeilingTextureBuffer
			.getContext('2d')
			.getImageData(0, 0, this.fCeilingTextureBuffer.width, this.fCeilingTextureBuffer.height);
		this.fCeilingTexturePixels = imgData.data;
	};

	onFloorTextureLoaded = () => {
		this.fFloorTextureBuffer = document.createElement('canvas');
		this.fFloorTextureBuffer.width = this.textures.floor.width;
		this.fFloorTextureBuffer.height = this.textures.floor.height;
		this.fFloorTextureBuffer.getContext('2d').drawImage(this.textures.floor, 0, 0);

		const imgData = this.fFloorTextureBuffer
			.getContext('2d')
			.getImageData(0, 0, this.fFloorTextureBuffer.width, this.fFloorTextureBuffer.height);
		this.fFloorTexturePixels = imgData.data;
	};

	preloadTextures = async () => {
		const preloadImages = () => {
			const promises = this.texturePaths.map(path => {
				return new Promise((resolve, reject) => {
					const name = path.split('/').pop()?.split('.')[0];
					const image = new Image();

					image.src = path;
					image.onload = () => {
						resolve([name, image]);
					};
					image.onerror = () => reject(`Image failed to load: ${path}`);
				});
			});
			return Promise.all(promises);
		};

		const imgArraytemp = await preloadImages();
		this.textures = Object.fromEntries(imgArraytemp);

		this.onWallTextureLoaded();
		this.onCeilingTextureLoaded();
		this.onFloorTextureLoaded();
	};

	init = async () => {
		await this.preloadTextures();
		this.setAngles();

		if (!this.DEBUG) {
			this.canvas.classList.add('fullscreen');
			this.debugCanvas.remove();
		}

		document.addEventListener('click', e => {
			if (!this.userIsInTab && !this.DEBUG) {
				this.userIsInTab = true;

				this.canvas.requestPointerLock =
					this.canvas.requestPointerLock ||
					this.canvas.mozRequestPointerLock ||
					this.canvas.webkitRequestPointerLock;
				this.canvas.requestPointerLock({
					unadjustedMovement: true,
				});
			}
		});

		document.addEventListener('mousemove', e => {
			if (!this.DEBUG) {
				this.fPlayerAngle += e.movementX / 20;
			}
		});

		document.addEventListener('keydown', e => {
			if (e.code === 'KeyW') {
				this.fKeyForward = true;
				this.fKeyBack = false;
			} else if (e.code === 'KeyS') {
				this.fKeyBack = true;
				this.fKeyForward = false;
			}

			if (e.code === 'KeyA') {
				if (this.DEBUG) this.fRotationDir = 'left';
				else {
					this.fKeyLeft = true;
					this.fKeyRight = false;
				}
			} else if (e.code === 'KeyD') {
				if (this.DEBUG) this.fRotationDir = 'right';
				else {
					this.fKeyRight = true;
					this.fKeyLeft = false;
				}
			}
		});

		document.addEventListener('keyup', e => {
			if (e.code === 'KeyW') {
				this.fKeyForward = false;
			} else if (e.code === 'KeyS') {
				this.fKeyBack = false;
			}

			if (e.code === 'KeyA') {
				if (this.DEBUG) this.fRotationDir = '';
				else this.fKeyLeft = false;
			} else if (e.code === 'KeyD') {
				if (this.DEBUG) this.fRotationDir = '';
				else this.fKeyRight = false;
			}
		});

		this.animationFrameId = requestAnimationFrame(this.update);
	};
}

const gameWindow = new GameWindow();
gameWindow.init();

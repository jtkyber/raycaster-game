import { degToRad, getIntersection } from '../utils/calc.js';
import maps from './maps.js';

class GameWindow {
	constructor() {
		this.canvas = document.getElementById('canvas');
		this.canvasWidth = this.canvas.width;
		this.canvasHeight = this.canvas.height;
		this.ctx = this.canvas.getContext('2d', { alpha: false });

		this.offscreenCanvas = document.createElement('canvas');
		this.offscreenCanvas.width = canvas.width;
		this.offscreenCanvas.height = canvas.height;
		this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d', { alpha: false });
		this.offscreenCanvasPixels = this.offscreenCanvasContext.getImageData(
			0,
			0,
			this.canvasWidth,
			this.canvasWidth
		);

		this.fWall1TextureBufferList;
		this.fWall1TexturePixelsList;

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

		this.texturePaths = [
			// Walls
			'src/assets/wall1.png',
			'src/assets/wall2.png',
			// Floors
			'src/assets/floor1.png',
			'src/assets/floor2.png',
			// Ceilings
			'src/assets/ceiling1.png',
			'src/assets/ceiling2.png',
		];
		this.textures = {};

		this.TILE_SIZE = 64;
		this.WALL_HEIGHT = 64;

		this.mapCols = maps[0].map[0].length;
		this.mapRows = maps[0].map.length;
		this.mapWidth = this.TILE_SIZE * this.mapCols;
		this.mapHeight = this.TILE_SIZE * this.mapRows;

		this.map = maps[0].map;
		// [mapNum, playerX, playerY]
		this.mapDataToSet = [0, 100, 100];

		this.debugCanvas;
		this.debugCanvasWidth;
		this.debugCanvasHeight;
		this.debugCtx;

		this.PROJECTIONPLANEWIDTH = this.canvasWidth;
		this.PROJECTIONPLANEHEIGHT = this.canvasHeight;

		this.fProjectionPlaneYCenter = this.PROJECTIONPLANEHEIGHT / 2;

		this.fPlayerX = this.mapDataToSet[1];
		this.fPlayerY = this.mapDataToSet[2];
		this.fPlayerAngle = 20;
		this.fPlayerFov = 60;
		this.fPlayerHeight = this.TILE_SIZE / 2;
		this.fPlayerSpeed = 4 / this.speedMultiplier;
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

			if (cellX < this.mapWidth && cellY < this.mapHeight && cellX >= 0 && cellY >= 0) {
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

			if (cellX < this.mapWidth && cellY < this.mapHeight && cellX >= 0 && cellY >= 0) {
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
			// console.log(this.fWall1TextureBufferList);

			let textureBuffer = this.fWall1TextureBufferList[this.tileTypes?.[i] - 1];
			let texturePixels = this.fWall1TexturePixelsList[this.tileTypes?.[i] - 1];

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
		for (let i = 0; i < this.mapRows; i++) {
			for (let j = 0; j < this.mapCols; j++) {
				const tile = this.map[i * this.mapCols + j];

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
			for (let row = 0; row < this.mapRows; row++) {
				for (let col = 0; col < this.mapCols; col++) {
					const tile = this.map[row * this.mapCols + col];
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
				if (this.DEBUG) {
					this.debugCtx.strokeStyle =
						i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
					this.debugCtx.beginPath();
					this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
					this.debugCtx.lineTo(closest[0], closest[1]);
					this.debugCtx.lineWidth = 1;
					this.debugCtx.stroke();
				}

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

	onWallTextureLoaded = imgNames => {
		this.fWall1TextureBufferList = new Array(imgNames.length);
		this.fWall1TexturePixelsList = new Array(imgNames.length);
		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fWall1TextureBufferList[i] = document.createElement('canvas');
			this.fWall1TextureBufferList[i].width = img.width;
			this.fWall1TextureBufferList[i].height = img.height;
			this.fWall1TextureBufferList[i].getContext('2d', { alpha: false }).drawImage(img, 0, 0);

			const imgData = this.fWall1TextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fWall1TextureBufferList[i].width, this.fWall1TextureBufferList[i].height);
			this.fWall1TexturePixelsList[i] = imgData.data;
		}
	};

	onCeilingTextureLoaded = imgName => {
		const img = this.textures[imgName];
		this.fCeilingTextureBuffer = document.createElement('canvas');
		this.fCeilingTextureBuffer.width = img.width;
		this.fCeilingTextureBuffer.height = img.height;
		this.fCeilingTextureBuffer.getContext('2d', { alpha: false }).drawImage(img, 0, 0);

		const imgData = this.fCeilingTextureBuffer
			.getContext('2d', { alpha: false })
			.getImageData(0, 0, this.fCeilingTextureBuffer.width, this.fCeilingTextureBuffer.height);
		this.fCeilingTexturePixels = imgData.data;
	};

	onFloorTextureLoaded = imgName => {
		const img = this.textures[imgName];
		this.fFloorTextureBuffer = document.createElement('canvas');
		this.fFloorTextureBuffer.width = img.width;
		this.fFloorTextureBuffer.height = img.height;
		this.fFloorTextureBuffer.getContext('2d', { alpha: false }).drawImage(img, 0, 0);

		const imgData = this.fFloorTextureBuffer
			.getContext('2d', { alpha: false })
			.getImageData(0, 0, this.fFloorTextureBuffer.width, this.fFloorTextureBuffer.height);
		this.fFloorTexturePixels = imgData.data;
	};

	setNewMapData = () => {
		const i = this.mapDataToSet[0];
		this.onWallTextureLoaded(maps[i].wallTextures);
		this.onCeilingTextureLoaded(maps[i].ceilingTexture);
		this.onFloorTextureLoaded(maps[i].floorTexture);
		this.map = new Uint8Array(maps[i].map.flat());
		this.mapCols = maps[i].map[0].length;
		this.mapRows = maps[i].map.length;
		this.mapWidth = this.TILE_SIZE * this.mapCols;
		this.mapHeight = this.TILE_SIZE * this.mapRows;
		this.fPlayerX = this.mapDataToSet[1];
		this.fPlayerY = this.mapDataToSet[2];

		if (this.DEBUG && this.debugCanvas) {
			this.debugCanvas.width = this.mapWidth;
			this.debugCanvas.height = this.mapHeight;
			this.debugCanvasWidth = this.debugCanvas.width;
			this.debugCanvasHeight = this.debugCanvas.height;
			this.debugCtx = this.debugCanvas.getContext('2d', { alpha: false });

			this.debugCanvas.style.aspectRatio = this.debugCanvasWidth / this.debugCanvasHeight;
		}
	};

	drawFps = () => {
		const fontSize = this.PROJECTIONPLANEHEIGHT / 28;
		const xOffset = this.PROJECTIONPLANEWIDTH / 90;
		const yOffset = this.PROJECTIONPLANEHEIGHT / 90;

		this.ctx.font = `600 ${fontSize}px arial`;
		this.ctx.fontWeight = 800;
		this.ctx.fillStyle = this.framesCounted < this.frameRate ? 'red' : 'green';
		this.ctx.shadowColor = 'black';
		this.ctx.shadowBlur = 4;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(this.framesCounted, xOffset, yOffset);
		this.ctx.shadowBlur = 0;
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
			if (this.DEBUG && this.debugCtx)
				this.debugCtx.clearRect(0, 0, this.debugCanvasWidth, this.debugCanvasHeight);
			this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

			if (this.mapDataToSet[0]) {
				this.setNewMapData();
				this.mapDataToSet = [];
			}

			this.move();
			if (this.DEBUG) this.draw2dWalls();
			this.raycaster();
			this.draw3dWalls();
			this.ctx.putImageData(this.offscreenCanvasPixels, 0, 0);

			if (this.DEBUG && this.debugCtx) {
				this.debugCtx.fillStyle = `rgba(0,255,0,1)`;
				this.debugCtx.beginPath();
				this.debugCtx.ellipse(this.fPlayerX, this.fPlayerY, 4, 4, 0, 0, 2 * Math.PI);
				this.debugCtx.fill();
			}

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

	preloadTextures = async img => {
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

		this.setNewMapData();
	};

	init = async () => {
		await this.preloadTextures();
		this.setAngles();

		if (!this.DEBUG) {
			this.canvas.classList.add('fullscreen');
		} else {
			const container = document.querySelector('.container');
			const newCanvas = document.createElement('canvas');
			newCanvas.id = 'debugCanvas';
			this.debugCanvas = newCanvas;
			this.debugCanvas.width = this.mapWidth;
			this.debugCanvas.height = this.mapHeight;
			this.debugCanvasWidth = this.debugCanvas.width;
			this.debugCanvasHeight = this.debugCanvas.height;
			this.debugCtx = this.debugCanvas.getContext('2d', { alpha: false });
			container.appendChild(newCanvas);
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

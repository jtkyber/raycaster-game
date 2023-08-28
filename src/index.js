import { convertDeg0To360, degToRad, getIntersection, radToDeg } from '../utils/calc.js';
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
		// this.frameRate = 0.1;
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
			'src/assets/doubleDoor.png',
			'src/assets/doubleDoor2.png',
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
		this.mapDataToSet = [0, 100, 150];

		this.debugCanvas;
		this.debugCanvasWidth;
		this.debugCanvasHeight;
		this.debugCtx;

		this.PROJECTIONPLANEWIDTH = this.canvasWidth;
		this.PROJECTIONPLANEHEIGHT = this.canvasHeight;

		this.fProjectionPlaneYCenter = this.PROJECTIONPLANEHEIGHT / 2;

		this.fPlayerX = this.mapDataToSet[1];
		this.fPlayerY = this.mapDataToSet[2];
		this.fPlayerAngle = 350;
		this.fPlayerMoveDir = 0;
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

		// this.portalTileIndeces = [39, 409];
		// this.portalTileSides = [3, 0];
		// this.portalTileIndeces = [36, null];
		this.portalTileIndeces = [36, 409];
		this.portalTileSides = [3, 0];
		// this.portalTileIndeces = [181, 353];
		// this.portalTileSides = [0, 3];

		this.totalPortalRayLengths = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutXVals = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutYVals = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutCollisionsX = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutCollisionsY = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutTypes = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutDirs = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutAngs = new Float32Array(this.PROJECTIONPLANEWIDTH);

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

	drawCeiling = (wallTop, castColumn, rayAng, wallTopPortal, rayAngPortal) => {
		let targetIndex =
			wallTop * (this.offscreenCanvasPixels.width * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		let targetIndexPortal =
			wallTopPortal * (this.offscreenCanvasPixels.width * this.bytesPerPixel) +
			this.bytesPerPixel * castColumn;

		for (let row = wallTopPortal || wallTop; row >= 0; row--) {
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

			//----------------------------------------------------------------------------------

			let xEndPortal;
			let yEndPortal;
			let cellXPortal;
			let cellYPortal;

			if (wallTopPortal) {
				xEndPortal = Math.floor(diagDist * Math.cos(rayAngPortal));
				yEndPortal = Math.floor(diagDist * Math.sin(rayAngPortal));

				xEndPortal += this.portalOutXVals[castColumn] - this.rayLengths[castColumn] * Math.cos(rayAngPortal);
				yEndPortal += this.portalOutYVals[castColumn] - this.rayLengths[castColumn] * Math.sin(rayAngPortal);

				cellXPortal = Math.floor(xEndPortal / this.TILE_SIZE);
				cellYPortal = Math.floor(yEndPortal / this.TILE_SIZE);
			}

			if (wallTopPortal && row > wallTop) {
				if (
					true ||
					(cellXPortal < this.mapCols && cellYPortal < this.mapRows && cellXPortal >= 0 && cellYPortal >= 0)
				) {
					const tileRow = Math.floor(xEndPortal % this.TILE_SIZE);
					const tileCol = Math.floor(yEndPortal % this.TILE_SIZE);

					const sourceIndex =
						tileRow * this.fCeilingTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

					const brighnessLevel = 200 / diagDist;
					const red = Math.floor(this.fCeilingTexturePixels[sourceIndex] * brighnessLevel);
					const green = Math.floor(this.fCeilingTexturePixels[sourceIndex + 1] * brighnessLevel);
					const blue = Math.floor(this.fCeilingTexturePixels[sourceIndex + 2] * brighnessLevel);
					const alpha = Math.floor(this.fCeilingTexturePixels[sourceIndex + 3]);

					this.offscreenCanvasPixels.data[targetIndexPortal] = red;
					this.offscreenCanvasPixels.data[targetIndexPortal + 1] = green;
					this.offscreenCanvasPixels.data[targetIndexPortal + 2] = blue;
					this.offscreenCanvasPixels.data[targetIndexPortal + 3] = alpha;

					targetIndexPortal -= this.bytesPerPixel * this.offscreenCanvasPixels.width;
				}
			} else if (cellX < this.mapWidth && cellY < this.mapHeight && cellX >= 0 && cellY >= 0) {
				const tileRow = Math.floor(xEnd % this.TILE_SIZE);
				const tileCol = Math.floor(yEnd % this.TILE_SIZE);

				const sourceIndex =
					tileRow * this.fCeilingTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

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

	drawFloor = (wallBottom, castColumn, rayAng, wallBottomPortal, rayAngPortal) => {
		let targetIndex =
			wallBottom * (this.offscreenCanvasPixels.width * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		let targetIndexPortal =
			wallBottomPortal * (this.offscreenCanvasPixels.width * this.bytesPerPixel) +
			this.bytesPerPixel * castColumn;

		for (let row = wallBottomPortal || wallBottom; row < this.PROJECTIONPLANEHEIGHT; row++) {
			const ratio = this.fPlayerHeight / (row - this.fProjectionPlaneYCenter);

			let diagDist = Math.floor(this.fPlayerDistanceToProjectionPlane * ratio * this.fFishTable[castColumn]);

			let xEnd = Math.floor(diagDist * Math.cos(rayAng));
			let yEnd = Math.floor(diagDist * Math.sin(rayAng));

			xEnd += this.fPlayerX;
			yEnd += this.fPlayerY;

			let cellX = Math.floor(xEnd / this.TILE_SIZE);
			let cellY = Math.floor(yEnd / this.TILE_SIZE);

			//-------------------------------------------------------------------------

			let xEndPortal;
			let yEndPortal;
			let cellXPortal;
			let cellYPortal;

			if (wallBottomPortal) {
				xEndPortal = Math.floor(diagDist * Math.cos(rayAngPortal));
				yEndPortal = Math.floor(diagDist * Math.sin(rayAngPortal));

				xEndPortal += this.portalOutXVals[castColumn] - this.rayLengths[castColumn] * Math.cos(rayAngPortal);
				yEndPortal += this.portalOutYVals[castColumn] - this.rayLengths[castColumn] * Math.sin(rayAngPortal);

				cellXPortal = Math.floor(xEndPortal / this.TILE_SIZE);
				cellYPortal = Math.floor(yEndPortal / this.TILE_SIZE);
			}

			if (wallBottomPortal && row < wallBottom) {
				if (
					cellXPortal < this.mapCols &&
					cellYPortal < this.mapRows &&
					cellXPortal >= 0 &&
					cellYPortal >= 0
				) {
					const tileRow = Math.floor(xEndPortal % this.TILE_SIZE);
					const tileCol = Math.floor(yEndPortal % this.TILE_SIZE);

					const sourceIndex =
						tileRow * this.fFloorTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

					const brighnessLevel = 200 / diagDist;
					const red = Math.floor(this.fFloorTexturePixels[sourceIndex] * brighnessLevel);
					const green = Math.floor(this.fFloorTexturePixels[sourceIndex + 1] * brighnessLevel);
					const blue = Math.floor(this.fFloorTexturePixels[sourceIndex + 2] * brighnessLevel);
					const alpha = Math.floor(this.fFloorTexturePixels[sourceIndex + 3]);

					this.offscreenCanvasPixels.data[targetIndexPortal] = red;
					this.offscreenCanvasPixels.data[targetIndexPortal + 1] = green;
					this.offscreenCanvasPixels.data[targetIndexPortal + 2] = blue;
					this.offscreenCanvasPixels.data[targetIndexPortal + 3] = alpha;

					targetIndexPortal += this.bytesPerPixel * this.offscreenCanvasPixels.width;
				}
			} else if (cellX < this.mapCols && cellY < this.mapRows && cellX >= 0 && cellY >= 0) {
				const tileRow = Math.floor(xEnd % this.TILE_SIZE);
				const tileCol = Math.floor(yEnd % this.TILE_SIZE);

				const sourceIndex =
					tileRow * this.fFloorTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

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
		// Regular ray
		rectTop,
		height,
		xOffset,
		brighnessLevel,
		textureBuffer,
		texturePixels,
		// Portal ray
		rectTopPortal,
		heightPortal,
		xOffsetPortal,
		brighnessLevelPortal,
		textureBufferPortal,
		texturePixelsPortal,
		portalNum
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

		if (heightToDraw < 0) return;

		//----------------------------------------------------------------------

		let sourceIndexPortal = null;
		let lastSourceIndexPortal = null;
		let targetIndexPortal = null;
		let heightToDrawPortal = null;

		if (rectTopPortal) {
			rectTopPortal = Math.floor(rectTopPortal);
			xOffsetPortal = Math.floor(xOffsetPortal);

			sourceIndexPortal = this.bytesPerPixel * xOffsetPortal;
			lastSourceIndexPortal =
				sourceIndexPortal + textureBufferPortal.width * textureBufferPortal.height * this.bytesPerPixel;

			targetIndexPortal =
				this.offscreenCanvasPixels.width * this.bytesPerPixel * rectTopPortal + this.bytesPerPixel * x;

			heightToDrawPortal = heightPortal;

			if (rectTopPortal + heightToDrawPortal > this.offscreenCanvasPixels.height)
				heightToDrawPortal = this.offscreenCanvasPixels.height - rectTopPortal;

			if (heightToDrawPortal < 0) return;
		}

		let yError = 0;

		if (sourceIndexPortal !== null) {
			loop1: while (true) {
				yError += heightPortal;
				const red = Math.floor(texturePixelsPortal[sourceIndexPortal] * brighnessLevelPortal);
				const green = Math.floor(texturePixelsPortal[sourceIndexPortal + 1] * brighnessLevelPortal);
				const blue = Math.floor(texturePixelsPortal[sourceIndexPortal + 2] * brighnessLevelPortal);
				const alpha = Math.floor(texturePixelsPortal[sourceIndexPortal + 3]);

				while (yError >= textureBufferPortal.width) {
					yError -= textureBufferPortal.width;
					this.offscreenCanvasPixels.data[targetIndexPortal] = red;
					this.offscreenCanvasPixels.data[targetIndexPortal + 1] = green;
					this.offscreenCanvasPixels.data[targetIndexPortal + 2] = blue;
					this.offscreenCanvasPixels.data[targetIndexPortal + 3] = alpha;
					targetIndexPortal += this.bytesPerPixel * this.offscreenCanvasPixels.width;

					heightToDrawPortal--;
					if (heightToDrawPortal < 1) {
						break loop1;
					}
				}

				sourceIndexPortal += this.bytesPerPixel * textureBufferPortal.width;
				if (sourceIndexPortal > lastSourceIndexPortal) sourceIndexPortal = lastSourceIndexPortal;
			}
			yError = 0;
		}

		const circleCenter = this.TILE_SIZE / 2;
		const dx = circleCenter - xOffset;
		const radiusY = circleCenter - 2;
		const radiusX = radiusY - 6;
		const effectRadiusY = radiusY + 2;
		const effectRadiusX = radiusX + 2;
		const effectRed = portalNum === 0 ? 0 : 255;
		const effectGreen = portalNum === 0 ? 70 : 70;
		const effectBlue = portalNum === 0 ? 255 : 0;

		while (true) {
			yError += height;
			const red = Math.floor(texturePixels[sourceIndex] * brighnessLevel);
			const green = Math.floor(texturePixels[sourceIndex + 1] * brighnessLevel);
			const blue = Math.floor(texturePixels[sourceIndex + 2] * brighnessLevel);
			const alpha = Math.floor(texturePixels[sourceIndex + 3]);

			const yOffset = sourceIndex / (this.bytesPerPixel * textureBuffer.width);
			const dy = circleCenter - yOffset;
			const inEllipse = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
			const inEffectEllipse =
				(dx * dx) / (effectRadiusX * effectRadiusX) + (dy * dy) / (effectRadiusY * effectRadiusY) <= 1;

			while (yError >= textureBuffer.width) {
				yError -= textureBuffer.width;
				if (sourceIndexPortal && !inEllipse) {
					if (inEffectEllipse) {
						this.offscreenCanvasPixels.data[targetIndex] = effectRed * brighnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 1] = effectGreen * brighnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 2] = effectBlue * brighnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
					} else {
						this.offscreenCanvasPixels.data[targetIndex] = red;
						this.offscreenCanvasPixels.data[targetIndex + 1] = green;
						this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
						this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
					}
				} else if (!sourceIndexPortal && portalNum !== null) {
					if (inEffectEllipse) {
						this.offscreenCanvasPixels.data[targetIndex] = effectRed * brighnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 1] = effectGreen * brighnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 2] = effectBlue * brighnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
					} else {
						this.offscreenCanvasPixels.data[targetIndex] = red;
						this.offscreenCanvasPixels.data[targetIndex + 1] = green;
						this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
						this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
					}
				} else if (!sourceIndexPortal) {
					this.offscreenCanvasPixels.data[targetIndex] = red;
					this.offscreenCanvasPixels.data[targetIndex + 1] = green;
					this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
					this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
				}
				targetIndex += this.bytesPerPixel * this.offscreenCanvasPixels.width;

				heightToDraw--;
				if (heightToDraw < 1) return;
			}

			sourceIndex += this.bytesPerPixel * textureBuffer.width;
			if (sourceIndex > lastSourceIndex) sourceIndex = lastSourceIndex;
		}
	};

	draw3dWalls = () => {
		for (let i = 0; i < this.rayLengths.length; i++) {
			let dist = this.rayLengths[i] / this.fFishTable[i];

			// For possible portal ray --------------------------------------
			let totalPortalRayDist =
				this.totalPortalRayLengths[i] < Infinity ? this.totalPortalRayLengths[i] / this.fFishTable[i] : null;
			let portalWallHeight = null;
			let portalWallBottom = null;
			let portalWallTop = 0;
			let portalWallOffset = 0;
			let portalTextureBuffer = null;
			let portalTexturePixels = null;
			let portalBrightness = 0;
			let portalNum = null;

			if (totalPortalRayDist) {
				if (this.portalTileSides[0] === this.tileDirs[i]) portalNum = 0;
				else if (this.portalTileSides[1] === this.tileDirs[i]) portalNum = 1;

				portalWallHeight = (this.TILE_SIZE / totalPortalRayDist) * this.fPlayerDistanceToProjectionPlane;
				portalWallBottom = this.PROJECTIONPLANEHEIGHT / 2 + portalWallHeight * 0.5;
				portalWallTop = this.PROJECTIONPLANEHEIGHT - portalWallBottom;

				portalWallOffset =
					this.portalOutDirs?.[i] === 0 || this.portalOutDirs?.[i] === 2
						? this.portalOutCollisionsX[i] % this.TILE_SIZE
						: this.portalOutCollisionsY[i] % this.TILE_SIZE;

				if (this.portalOutDirs?.[i] === 0 || this.portalOutDirs?.[i] === 1)
					portalWallOffset = this.TILE_SIZE - portalWallOffset;

				portalTextureBuffer = this.fWall1TextureBufferList[this.portalOutTypes?.[i] - 1];
				portalTexturePixels = this.fWall1TexturePixelsList[this.portalOutTypes?.[i] - 1];

				portalBrightness = 160 / totalPortalRayDist;

				totalPortalRayDist = Math.floor(totalPortalRayDist);

				if (portalBrightness > 1.2) portalBrightness = 1.2;

				if (this.portalOutDirs?.[i] === 1 || this.portalOutDirs?.[i] === 3) {
					portalBrightness = portalBrightness * 0.8;
				}
			} else {
				const tileCol = Math.floor(this.tileCollisionsX[i] / this.TILE_SIZE);
				const tileRow = Math.floor(this.tileCollisionsY[i] / this.TILE_SIZE);
				const tileIndex = tileRow * this.mapCols + tileCol;

				if (this.portalTileIndeces[0] === tileIndex && this.portalTileSides[0] === this.tileDirs[i])
					portalNum = 0;
				else if (this.portalTileIndeces[1] === tileIndex && this.portalTileSides[1] === this.tileDirs[i])
					portalNum = 1;
			}
			// ---------------------------------------------------------------

			const wallHeight = (this.TILE_SIZE / dist) * this.fPlayerDistanceToProjectionPlane;
			const wallBottom = this.PROJECTIONPLANEHEIGHT / 2 + wallHeight * 0.5;
			const wallTop = this.PROJECTIONPLANEHEIGHT - wallBottom;

			let adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			if (adjustedAngle < 0) adjustedAngle += 2 * Math.PI;

			this.drawFloor(
				Math.floor(wallBottom),
				i,
				adjustedAngle,
				Math.floor(portalWallBottom),
				this.portalOutAngs[i]
			);
			this.drawCeiling(
				Math.floor(wallTop),
				i,
				adjustedAngle,
				Math.floor(portalWallTop),
				this.portalOutAngs[i]
			);

			let offset =
				this.tileDirs?.[i] === 0 || this.tileDirs?.[i] === 2
					? this.tileCollisionsX[i] % this.TILE_SIZE
					: this.tileCollisionsY[i] % this.TILE_SIZE;

			if (this.tileDirs?.[i] === 0 || this.tileDirs?.[i] === 1) offset = this.TILE_SIZE - offset;

			let textureBuffer = this.fWall1TextureBufferList[this.tileTypes?.[i] - 1];
			let texturePixels = this.fWall1TexturePixelsList[this.tileTypes?.[i] - 1];

			let brighnessLevel = 160 / dist;

			dist = Math.floor(dist);
			if (brighnessLevel > 1.2) brighnessLevel = 1.2;

			if (this.tileDirs?.[i] === 1 || this.tileDirs?.[i] === 3) {
				brighnessLevel = brighnessLevel * 0.8;
			}

			this.drawWallSliceRectangleTinted(
				i,
				// Regular Ray
				wallTop,
				wallHeight + 1,
				offset,
				brighnessLevel,
				textureBuffer,
				texturePixels,
				// Portal Ray
				portalWallTop,
				portalWallHeight + 1,
				portalWallOffset,
				portalBrightness,
				portalTextureBuffer,
				portalTexturePixels,
				portalNum
			);
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

	getIntersectionOfTile = (x, y, row, col, theta) => {
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

			const intersection = getIntersection(x, y, 1, theta, tX1, tY1, tX2, tY2);
			if (intersection?.[0]) {
				const dx = Math.abs(x - intersection[0]);
				const dy = Math.abs(y - intersection[1]);
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

	setRayFromPortal = (
		i,
		portalIntersectInX,
		portalIntersectInY,
		portalIndexOut,
		portalTileSideOut,
		portalTileSideIn,
		rayInAng
	) => {
		if (portalIndexOut) {
			let offset;

			switch (portalTileSideIn) {
				case 0:
					offset = this.TILE_SIZE - (portalIntersectInX % this.TILE_SIZE);
					break;
				case 1:
					offset = this.TILE_SIZE - (portalIntersectInY % this.TILE_SIZE);
					break;
				case 2:
					offset = portalIntersectInX % this.TILE_SIZE;
					break;
				case 3:
					offset = portalIntersectInY % this.TILE_SIZE;
					break;
			}

			const xStart = this.TILE_SIZE * (portalIndexOut % this.mapCols) - 1;
			const yStart = this.TILE_SIZE * Math.floor(portalIndexOut / this.mapCols);

			switch (portalTileSideOut) {
				case 0:
					this.portalOutXVals[i] = xStart + offset;
					this.portalOutYVals[i] = yStart;
					break;
				case 1:
					this.portalOutXVals[i] = xStart + this.TILE_SIZE;
					this.portalOutYVals[i] = yStart + offset;
					break;
				case 2:
					this.portalOutXVals[i] = xStart + this.TILE_SIZE - offset;
					this.portalOutYVals[i] = yStart + this.TILE_SIZE;
					break;
				case 3:
					this.portalOutXVals[i] = xStart;
					this.portalOutYVals[i] = yStart + this.TILE_SIZE - offset;
					break;
			}

			if (
				(portalTileSideOut === 1 || portalTileSideOut === 3) &&
				this.portalOutXVals[i] % this.TILE_SIZE !== 0
			) {
				this.portalOutXVals[i] += 1;
			} else if (
				(portalTileSideOut === 0 || portalTileSideOut === 2) &&
				this.portalOutYVals[i] % this.TILE_SIZE !== 0
			) {
				this.portalOutYVals[i] += 1;
			}

			const tileSideDiff = portalTileSideIn - portalTileSideOut;
			const tileSideDiffSign = tileSideDiff >= 0 ? 1 : -1;
			let rayOutAng;

			if (tileSideDiff === 0) rayOutAng = rayInAng + Math.PI;
			else if (Math.abs(tileSideDiff) === 1) {
				rayOutAng = rayInAng + (Math.PI / 2) * tileSideDiffSign;
			} else if (Math.abs(tileSideDiff) === 2) {
				rayOutAng = rayInAng;
			} else if (Math.abs(tileSideDiff) === 3) {
				rayOutAng = rayInAng - (Math.PI / 2) * tileSideDiffSign;
			}

			let portal2RayRecord = Infinity;
			let portal2RayClosest = null;
			let tileTypeTemp = 0;
			let tileSideDirTemp = 0;

			for (let row = 0; row < this.mapRows; row++) {
				for (let col = 0; col < this.mapCols; col++) {
					const tile = this.map[row * this.mapCols + col];
					if (tile === 0) continue;

					const tileIntersection = this.getIntersectionOfTile(
						this.portalOutXVals[i],
						this.portalOutYVals[i],
						row,
						col,
						rayOutAng
					);

					if (tileIntersection.record < portal2RayRecord) {
						portal2RayRecord = tileIntersection.record;
						portal2RayClosest = tileIntersection.closest;

						tileTypeTemp = tile;
						tileSideDirTemp = tileIntersection.dir;
					}
				}
			}

			if (portal2RayClosest) {
				this.totalPortalRayLengths[i] = this.rayLengths[i] + portal2RayRecord;
				this.portalOutCollisionsX[i] = portal2RayClosest[0];
				this.portalOutCollisionsY[i] = portal2RayClosest[1];
				this.portalOutTypes[i] = tileTypeTemp;
				this.portalOutDirs[i] = tileSideDirTemp;
				this.portalOutAngs[i] = rayOutAng;

				if (this.DEBUG) {
					this.debugCtx.fillStyle = 'blue';
					this.debugCtx.beginPath();
					this.debugCtx.ellipse(portalIntersectInX, portalIntersectInY, 3, 3, 0, 0, 2 * Math.PI);
					this.debugCtx.fill();

					this.debugCtx.fillStyle = 'orangeRed';
					this.debugCtx.beginPath();
					this.debugCtx.ellipse(this.portalOutXVals[i], this.portalOutYVals[i], 3, 3, 0, 0, 2 * Math.PI);
					this.debugCtx.fill();

					this.debugCtx.strokeStyle =
						i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
					this.debugCtx.beginPath();
					this.debugCtx.moveTo(this.portalOutXVals[i], this.portalOutYVals[i]);
					this.debugCtx.lineTo(portal2RayClosest[0], portal2RayClosest[1]);
					this.debugCtx.lineWidth = 1;
					this.debugCtx.stroke();
				}
			} else this.totalPortalRayLengths[i] = Infinity;
		}
	};

	raycaster = () => {
		let tileTypeTemp = 0;
		let tileSideDirTemp = 0;

		for (let i = 0; i < this.rayAngles.length; i++) {
			let adjustedAngle;
			adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);

			let closest = null;
			let record = Infinity;

			let tileIndex = null;
			for (let row = 0; row < this.mapRows; row++) {
				for (let col = 0; col < this.mapCols; col++) {
					const tile = this.map[row * this.mapCols + col];
					if (tile === 0) continue;

					const tileIntersection = this.getIntersectionOfTile(
						this.fPlayerX,
						this.fPlayerY,
						row,
						col,
						adjustedAngle
					);

					if (tileIntersection.record < record) {
						tileIndex = row * this.mapCols + col;
						record = tileIntersection.record;
						closest = tileIntersection.closest;

						tileTypeTemp = tile;
						tileSideDirTemp = tileIntersection.dir;
					}
				}
			}

			if (closest) {
				this.rayLengths[i] = record;
				this.tileCollisionsX[i] = closest[0];
				this.tileCollisionsY[i] = closest[1];
				this.tileTypes[i] = tileTypeTemp;
				this.tileDirs[i] = tileSideDirTemp;

				if (this.portalTileIndeces?.[0] === tileIndex && this.portalTileSides?.[0] === tileSideDirTemp) {
					this.setRayFromPortal(
						i,
						closest[0],
						closest[1],
						this.portalTileIndeces?.[1],
						this.portalTileSides[1],
						tileSideDirTemp,
						adjustedAngle
					);
				} else if (
					this.portalTileIndeces?.[1] === tileIndex &&
					this.portalTileSides?.[1] === tileSideDirTemp
				) {
					this.setRayFromPortal(
						i,
						closest[0],
						closest[1],
						this.portalTileIndeces?.[0],
						this.portalTileSides[0],
						tileSideDirTemp,
						adjustedAngle
					);
				} else this.totalPortalRayLengths[i] = Infinity;

				if (this.DEBUG) {
					this.debugCtx.strokeStyle =
						i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
					this.debugCtx.beginPath();
					this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
					this.debugCtx.lineTo(closest[0], closest[1]);
					this.debugCtx.lineWidth = 1;
					this.debugCtx.stroke();
				}
			} else this.rayLengths[i] = Infinity;
		}
	};

	rotate = () => {
		if (this.fRotationDir === 'left') {
			this.fPlayerAngle -= 4;
		} else if (this.fRotationDir === 'right') {
			this.fPlayerAngle += 4;
		}
	};

	setMoveDir = () => {
		if (this.fKeyForward && !this.fKeyRight && !this.fKeyLeft) {
			// forward
			this.fPlayerMoveDir = this.fPlayerAngle;
		} else if (this.fKeyBack && !this.fKeyRight && !this.fKeyLeft) {
			// backwards
			this.fPlayerMoveDir = this.fPlayerAngle + 180;
		} else if (this.fKeyRight && !this.fKeyForward && !this.fKeyBack) {
			// right
			this.fPlayerMoveDir = this.fPlayerAngle + 90;
		} else if (this.fKeyLeft && !this.fKeyForward && !this.fKeyBack) {
			// left
			this.fPlayerMoveDir = this.fPlayerAngle - 90;
		} else if (this.fKeyForward && this.fKeyRight) {
			// forward-right
			this.fPlayerMoveDir = this.fPlayerAngle + 45;
		} else if (this.fKeyForward && this.fKeyLeft) {
			// forward-left
			this.fPlayerMoveDir = this.fPlayerAngle - 45;
		} else if (this.fKeyBack && this.fKeyRight) {
			// backwards-right
			this.fPlayerMoveDir = this.fPlayerAngle + 135;
		} else if (this.fKeyBack && this.fKeyLeft) {
			// backwards-left
			this.fPlayerMoveDir = this.fPlayerAngle - 135;
		}
	};

	getXspeed = () => this.fPlayerSpeed * Math.cos(degToRad(this.fPlayerMoveDir));

	getYspeed = () => this.fPlayerSpeed * Math.sin(degToRad(this.fPlayerMoveDir));

	playerTooCloseToWall = (row, col) => {
		const minDist = (this.TILE_SIZE * Math.sqrt(2)) / 1.5;

		const tileMidX = col * this.TILE_SIZE + this.TILE_SIZE / 2;
		const tileMidY = row * this.TILE_SIZE + this.TILE_SIZE / 2;

		const dx = this.fPlayerX - tileMidX;
		const dy = this.fPlayerY - tileMidY;
		const d = Math.sqrt(dx * dx + dy * dy);

		if (d <= minDist) return [dx, dy];
		return;
	};

	handlePortalCollision = portalNum => {
		const portalNumOut = portalNum === 0 ? 1 : 0;
		const xStartOut = this.TILE_SIZE * (this.portalTileIndeces[portalNumOut] % this.mapCols);
		const yStartOut = this.TILE_SIZE * Math.floor(this.portalTileIndeces[portalNumOut] / this.mapCols);

		let offset;
		let newPlayerX = null;
		let newPlayerY = null;
		switch (this.portalTileSides[portalNum]) {
			case 0:
				offset = this.TILE_SIZE - (this.fPlayerX % this.TILE_SIZE);
				break;
			case 1:
				offset = this.TILE_SIZE - (this.fPlayerY % this.TILE_SIZE);
				break;
			case 2:
				offset = this.fPlayerX % this.TILE_SIZE;
				break;
			case 3:
				offset = this.fPlayerY % this.TILE_SIZE;
				break;
		}

		switch (this.portalTileSides[portalNumOut]) {
			case 0:
				newPlayerX = xStartOut + offset;
				newPlayerY = yStartOut;
				break;
			case 1:
				newPlayerX = xStartOut + this.TILE_SIZE;
				newPlayerY = yStartOut + offset;
				break;
			case 2:
				newPlayerX = xStartOut + this.TILE_SIZE - offset;
				newPlayerY = yStartOut + this.TILE_SIZE;
				break;
			case 3:
				newPlayerX = xStartOut;
				newPlayerY = yStartOut + this.TILE_SIZE - offset;
				break;
		}

		if (newPlayerX && newPlayerY) {
			this.fPlayerX = newPlayerX;
			this.fPlayerY = newPlayerY;

			const tileSideDiff = this.portalTileSides[portalNum] - this.portalTileSides[portalNumOut];
			const tileSideDiffSign = tileSideDiff >= 0 ? 1 : -1;
			let portalInAng = degToRad(this.fPlayerAngle);
			let portalOutAng;

			if (tileSideDiff === 0) portalOutAng = portalInAng + Math.PI;
			else if (Math.abs(tileSideDiff) === 1) {
				portalOutAng = portalInAng + (Math.PI / 2) * tileSideDiffSign;
			} else if (Math.abs(tileSideDiff) === 2) {
				portalOutAng = portalInAng;
			} else if (Math.abs(tileSideDiff) === 3) {
				portalOutAng = portalInAng - (Math.PI / 2) * tileSideDiffSign;
			}

			this.fPlayerAngle = radToDeg(portalOutAng);
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

		const playerTileCol = Math.floor(this.fPlayerX / this.TILE_SIZE);
		const playerTileRow = Math.floor(this.fPlayerY / this.TILE_SIZE);

		this.setMoveDir();
		const moveDir = convertDeg0To360(this.fPlayerMoveDir);
		let newPlayerX = null;
		let newPlayerY = null;

		if (this.fKeyForward || this.fKeyBack || this.fKeyLeft || this.fKeyRight) {
			for (let row = 0; row < this.mapRows; row++) {
				loop1: for (let col = 0; col < this.mapCols; col++) {
					const tileIndex = row * this.mapCols + col;
					const tile = this.map[tileIndex];
					if (tile === 0 || (row === playerTileRow && col === playerTileCol)) continue;

					if (Math.abs(col - playerTileCol) <= 1 && Math.abs(row - playerTileRow) <= 1) {
						const closeDistToTile = this.playerTooCloseToWall(row, col);

						if (closeDistToTile) {
							const angleToWallCenter = radToDeg(
								Math.atan2(Math.abs(closeDistToTile[1]), Math.abs(closeDistToTile[0]))
							);

							if (angleToWallCenter >= 0 && angleToWallCenter < 45) {
								// On left or right of wall
								const playerWallTileDiffCol = playerTileCol - col;
								if (playerWallTileDiffCol > 0 && (moveDir > 270 || moveDir < 90)) break loop1;
								else if (playerWallTileDiffCol < 0 && moveDir < 270 && moveDir > 90) break loop1;
								const intersectSide = playerWallTileDiffCol > 0 ? 1 : 3;
								if (tileIndex === this.portalTileIndeces[0]) {
									if (this.portalTileSides[0] === intersectSide) {
										this.handlePortalCollision(0);
										return;
									}
								} else if (tileIndex === this.portalTileIndeces[1]) {
									if (this.portalTileSides[1] === intersectSide) {
										this.handlePortalCollision(1);
										return;
									}
								}
								newPlayerY = this.fPlayerY + this.getYspeed();
							} else if (angleToWallCenter >= 45 && angleToWallCenter < 90) {
								// On top or bottom of wall
								const playerWallTileDiffRow = playerTileRow - row;
								if (playerWallTileDiffRow > 0 && moveDir > 0 && moveDir < 180) break loop1;
								else if (playerWallTileDiffRow < 0 && moveDir > 180 && moveDir < 360) break loop1;
								const intersectSide = playerWallTileDiffRow > 0 ? 2 : 0;
								if (tileIndex === this.portalTileIndeces[0]) {
									if (this.portalTileSides[0] === intersectSide) {
										this.handlePortalCollision(0);
										return;
									}
								} else if (tileIndex === this.portalTileIndeces[1]) {
									if (this.portalTileSides[1] === intersectSide) {
										this.handlePortalCollision(1);
										return;
									}
								}
								newPlayerX = this.fPlayerX + this.getXspeed();
							}
						}
					}
				}
			}

			if (newPlayerX && newPlayerY) return;
			else if (newPlayerX) {
				this.fPlayerX = newPlayerX;
				return;
			} else if (newPlayerY) {
				this.fPlayerY = newPlayerY;
				return;
			}
		}

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

		this.setMoveDir();
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

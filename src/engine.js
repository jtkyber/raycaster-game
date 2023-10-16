import { convertDeg0To360, degToRad, getIntersection, getPerpCoords, radToDeg } from '../utils/calc.js';
import maps from './maps.js';

export default class Engine {
	constructor() {
		this.canvas = document.getElementById('canvas');
		this.canvasWidth = this.canvas.width;
		this.canvasHeight = this.canvas.height;
		this.ctx = this.canvas.getContext('2d', { alpha: false });

		this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
		this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d', { alpha: false });
		this.offscreenCanvasPixels = this.offscreenCanvasContext.getImageData(
			0,
			0,
			this.canvasWidth,
			this.canvasHeight
		);

		this.fWallTextureBufferList;
		this.fWallTexturePixelsList;

		this.fPaintingTextureBufferList;
		this.fPaintingTexturePixelsList;
		this.fPaintingDetails;

		this.fFloorTextureBufferList;
		this.fFloorTexturePixelsList;

		this.fCeilingTextureBuffer;
		this.fCeilingTexturePixels;

		this.fObjectTextureBufferList;
		this.fObjectTexturePixelsList;

		this.objects;

		this.bytesPerPixel = 4;
		this.pi = Math.PI;

		this.texturePaths = [
			// Walls
			'src/assets/walls/wall1.png',
			'src/assets/walls/wall1Dark.png',
			'src/assets/walls/wall2.png',
			'src/assets/walls/wall2nice.png',
			'src/assets/walls/wall2job.png',
			'src/assets/walls/wall2Chipped.png',
			'src/assets/walls/wall3.png',
			'src/assets/walls/wall3nice.png',
			'src/assets/walls/wall3job.png',
			'src/assets/walls/doubleDoorClosed.png',
			'src/assets/walls/doubleDoorOpen.png',
			'src/assets/walls/doubleDoor2Closed.png',
			'src/assets/walls/doubleDoor2Open.png',
			// Floors
			'src/assets/floors/floor1.png',
			'src/assets/floors/floor2.png',
			'src/assets/floors/floor3.png',
			'src/assets/floors/floor4.png',
			'src/assets/floors/floor5.png',
			// Ceilings
			'src/assets/ceilings/ceiling1.png',
			'src/assets/ceilings/ceiling2.png',
			// Paintings
			'src/assets/paintings/painting1.png',
			'src/assets/paintings/painting2one.png',
			'src/assets/paintings/painting2two.png',
			'src/assets/paintings/painting3one.png',
			'src/assets/paintings/painting3two.png',
			'src/assets/paintings/painting4one.png',
			'src/assets/paintings/painting4two.png',
			'src/assets/paintings/painting5one.png',
			'src/assets/paintings/painting5two.png',
			'src/assets/paintings/painting6one.png',
			'src/assets/paintings/painting6two.png',
			'src/assets/paintings/painting7one.png',
			'src/assets/paintings/painting7two.png',
			'src/assets/paintings/painting8.png',
			'src/assets/paintings/painting9.png',
			'src/assets/paintings/painting10.png',
			'src/assets/paintings/painting11.png',
			'src/assets/paintings/painting12.png',
			'src/assets/paintings/painting13.png',
			'src/assets/paintings/painting14.png',
			'src/assets/paintings/painting15.png',
			// Objects
			'src/assets/objects/barrel.png',
		];
		this.textures = {};

		this.TILE_SIZE = 64;
		this.WALL_HEIGHT = 64;

		this.mapCols = maps[0].map[0].length;
		this.mapRows = maps[0].map.length;
		this.mapWidth = this.TILE_SIZE * this.mapCols;
		this.mapHeight = this.TILE_SIZE * this.mapRows;
		this.TILE_SIZE - 1;

		this.mapNum = 0;
		this.map = maps[this.mapNum].map;

		this.debugCanvas;
		this.debugCanvasWidth;
		this.debugCanvasHeight;
		this.debugCtx;

		this.PROJECTIONPLANEWIDTH = this.canvasWidth;
		this.PROJECTIONPLANEHEIGHT = this.canvasHeight;

		this.fProjectionPlaneYCenter = this.PROJECTIONPLANEHEIGHT / 2;

		this.fPlayerX = 100;
		this.fPlayerY = 100;
		this.fPlayerAngle = 10;
		this.fPlayerMoveDir = 0;
		this.fPlayerFov = 60;
		this.fPlayerHeight = this.TILE_SIZE / 2;
		this.fGameSpeed = 0;
		this.fPlayerMoveSpeed = 0;
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
		this.RAD90 = (3 * this.pi) / 2;
		this.RAD180 = this.pi;
		this.RAD270 = this.pi / 2;
		this.RAD360 = 2 * this.pi;

		this.rayLengths = new Uint16Array(this.PROJECTIONPLANEWIDTH);
		this.rayAngles = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.rayAngleQuadrants = new Uint8Array(this.PROJECTIONPLANEWIDTH);
		this.tileCollisionsX = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.tileCollisionsY = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.tileTypes = new Uint8Array(this.PROJECTIONPLANEWIDTH);
		this.tileSides = new Uint8Array(this.PROJECTIONPLANEWIDTH);
		this.tileIndeces = new Uint16Array(this.PROJECTIONPLANEWIDTH);

		this.objectRayLengths = new Uint16Array(this.PROJECTIONPLANEWIDTH);
		this.objectCollisionsX = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.objectCollisionsY = new Float32Array(this.PROJECTIONPLANEWIDTH);

		this.portalSizeMultipliers = new Float32Array(2).fill(1);
		this.portalTileSides = new Int8Array(2).fill(-1);
		this.portalTileIndeces = new Int16Array(2).fill(-1);
		this.portalColors = [
			[0, 101, 255],
			[255, 93, 0],
		];

		this.totalPortalRayLengths = new Uint16Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutXVals = new Uint16Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutYVals = new Uint16Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutCollisionsX = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutCollisionsY = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutAngs = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutTypes = new Uint8Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutSides = new Uint8Array(this.PROJECTIONPLANEWIDTH);
		this.portalOutIndeces = new Uint16Array(this.PROJECTIONPLANEWIDTH);

		this.userIsInTab = false;
		this.reticleOnWall = false;
		this.isJumping = false;
		this.jumpSpeedStart = 1.2;
		this.jumpSpeed = this.jumpSpeedStart;
		this.gravityValue = 0.035;

		this.isCrouching = false;
		this.isStanding = false;
		this.crouchAmt = 10;
		this.crouchSpeedStart = 0.4;
		this.crouchSpeed = this.crouchSpeedStart;
		this.crouchGravity = 0.007;
		this.standSpeedStart = 0.4;
		this.standSpeed = this.standSpeedStart;
		this.standGravity = 0.007;

		this.redTint = 0;
		this.greenTint = 0;
		this.blueTint = 0;

		this.levelTransition = false;
		this.levelTransitionFadeAmt = 0;
		this.doorMap = {};

		this.DEBUG = false;
		this.preventPageReloadDialog = false;
	}

	getSidesToCheck(quadrant) {
		switch (quadrant) {
			case 0:
				return [0, 3];
			case 1:
				return [0, 1];
			case 2:
				return [1, 2];
			case 3:
				return [2, 3];
		}
	}

	drawFillRectangle(x, y, width, height, red, green, blue, alpha) {
		const bytesPerPixel = 4;
		let targetIndex = bytesPerPixel * this.offscreenCanvasPixels.width * y + bytesPerPixel * x;
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
	}

	async drawCeiling(wallTop, castColumn, rayAng, wallTopPortal, rayAngPortal, portalNum) {
		let targetIndex =
			wallTop * (this.offscreenCanvasPixels.width * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		let targetIndexPortal =
			wallTopPortal * (this.offscreenCanvasPixels.width * this.bytesPerPixel) +
			this.bytesPerPixel * castColumn;

		for (let row = wallTopPortal || wallTop; row >= 0; row--) {
			const ratio = (this.WALL_HEIGHT - this.fPlayerHeight) / (this.fProjectionPlaneYCenter - row);

			const diagDist = ~~(this.fPlayerDistanceToProjectionPlane * ratio * this.fFishTable[castColumn]);

			let brightnessLevel = 100 / diagDist;
			if (brightnessLevel > 1.3) brightnessLevel = 1.3;

			let xEnd = ~~(diagDist * Math.cos(rayAng));
			let yEnd = ~~(diagDist * Math.sin(rayAng));

			xEnd += this.fPlayerX;
			yEnd += this.fPlayerY;

			const cellX = ~~(xEnd / this.TILE_SIZE);
			const cellY = ~~(yEnd / this.TILE_SIZE);

			//----------------------------------------------------------------------------------

			let xEndPortal;
			let yEndPortal;
			let cellXPortal;
			let cellYPortal;

			if (portalNum !== null && wallTopPortal && row > wallTop) {
				xEndPortal = ~~(diagDist * Math.cos(rayAngPortal));
				yEndPortal = ~~(diagDist * Math.sin(rayAngPortal));

				xEndPortal += this.portalOutXVals[castColumn] - this.rayLengths[castColumn] * Math.cos(rayAngPortal);
				yEndPortal += this.portalOutYVals[castColumn] - this.rayLengths[castColumn] * Math.sin(rayAngPortal);

				cellXPortal = ~~(xEndPortal / this.TILE_SIZE);
				cellYPortal = ~~(yEndPortal / this.TILE_SIZE);

				if (
					true ||
					(cellXPortal < this.mapCols && cellYPortal < this.mapRows && cellXPortal >= 0 && cellYPortal >= 0)
				) {
					const tileRow = xEndPortal & (this.TILE_SIZE - 1);
					const tileCol = yEndPortal & (this.TILE_SIZE - 1);

					const sourceIndex =
						tileRow * this.fCeilingTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

					const red = ~~(this.fCeilingTexturePixels[sourceIndex] * (brightnessLevel + this.redTint));
					const green = ~~(this.fCeilingTexturePixels[sourceIndex + 1] * (brightnessLevel + this.greenTint));
					const blue = ~~(this.fCeilingTexturePixels[sourceIndex + 2] * (brightnessLevel + this.blueTint));
					const alpha = ~~this.fCeilingTexturePixels[sourceIndex + 3];

					this.offscreenCanvasPixels.data[targetIndexPortal] = red + this.portalColors[portalNum][0] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 1] =
						green + this.portalColors[portalNum][1] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 2] =
						blue + this.portalColors[portalNum][2] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 3] = alpha;

					targetIndexPortal -= this.bytesPerPixel * this.offscreenCanvasPixels.width;
				}
			} else if (cellX < this.mapWidth && cellY < this.mapHeight && cellX >= 0 && cellY >= 0) {
				const tileRow = xEnd & (this.TILE_SIZE - 1);
				const tileCol = yEnd & (this.TILE_SIZE - 1);

				const sourceIndex =
					tileRow * this.fCeilingTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

				const red = ~~(this.fCeilingTexturePixels[sourceIndex] * (brightnessLevel + this.redTint));
				const green = ~~(this.fCeilingTexturePixels[sourceIndex + 1] * (brightnessLevel + this.greenTint));
				const blue = ~~(this.fCeilingTexturePixels[sourceIndex + 2] * (brightnessLevel + this.blueTint));
				const alpha = ~~this.fCeilingTexturePixels[sourceIndex + 3];

				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;

				targetIndex -= this.bytesPerPixel * this.offscreenCanvasPixels.width;
			}
		}
	}

	getFloorTypeIndexFromRowCol(row, col) {
		const tileIndex = row * this.mapCols + col;
		let type = this.map[tileIndex];
		if (type < 6) type = 6;
		return type - 6;
	}

	drawFloor(wallBottom, castColumn, rayAng, wallBottomPortal, rayAngPortal, portalNum) {
		let targetIndex =
			wallBottom * (this.offscreenCanvasPixels.width * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		let targetIndexPortal =
			wallBottomPortal * (this.offscreenCanvasPixels.width * this.bytesPerPixel) +
			this.bytesPerPixel * castColumn;

		let count = 0;
		for (let row = wallBottomPortal || wallBottom; row < this.PROJECTIONPLANEHEIGHT; row++) {
			const straightDistance =
				(this.fPlayerHeight / (row - this.fProjectionPlaneYCenter)) * this.fPlayerDistanceToProjectionPlane;

			const actualDistance = straightDistance * this.fFishTable[castColumn];

			const brightnessLevel = 120 / actualDistance;

			let xEnd = ~~(actualDistance * Math.cos(rayAng));
			let yEnd = ~~(actualDistance * Math.sin(rayAng));

			xEnd += this.fPlayerX;
			yEnd += this.fPlayerY;

			let cellX = ~~(xEnd / this.TILE_SIZE);
			let cellY = ~~(yEnd / this.TILE_SIZE);

			const fIndex = this.getFloorTypeIndexFromRowCol(cellY, cellX);

			//-------------------------------------------------------------------------

			let xEndPortal;
			let yEndPortal;
			let cellXPortal;
			let cellYPortal;

			if (portalNum !== null && wallBottomPortal && row < wallBottom) {
				xEndPortal = ~~(actualDistance * Math.cos(rayAngPortal));
				yEndPortal = ~~(actualDistance * Math.sin(rayAngPortal));

				xEndPortal += this.portalOutXVals[castColumn] - this.rayLengths[castColumn] * Math.cos(rayAngPortal);
				yEndPortal += this.portalOutYVals[castColumn] - this.rayLengths[castColumn] * Math.sin(rayAngPortal);

				cellXPortal = ~~(xEndPortal / this.TILE_SIZE);
				cellYPortal = ~~(yEndPortal / this.TILE_SIZE);
				const fIndexPortal = this.getFloorTypeIndexFromRowCol(cellYPortal, cellXPortal);

				if (
					cellXPortal < this.mapCols &&
					cellYPortal < this.mapRows &&
					cellXPortal >= 0 &&
					cellYPortal >= 0
				) {
					const tileRow = xEndPortal & (this.TILE_SIZE - 1);
					const tileCol = yEndPortal & (this.TILE_SIZE - 1);

					const sourceIndex =
						tileRow * this.fFloorTextureBufferList[fIndexPortal].width * this.bytesPerPixel +
						this.bytesPerPixel * tileCol;

					const red = ~~(
						this.fFloorTexturePixelsList[fIndexPortal][sourceIndex] *
						(brightnessLevel + this.redTint)
					);
					const green = ~~(
						this.fFloorTexturePixelsList[fIndexPortal][sourceIndex + 1] *
						(brightnessLevel + this.greenTint)
					);
					const blue = ~~(
						this.fFloorTexturePixelsList[fIndexPortal][sourceIndex + 2] *
						(brightnessLevel + this.blueTint)
					);
					const alpha = ~~this.fFloorTexturePixelsList[fIndexPortal][sourceIndex + 3];

					this.offscreenCanvasPixels.data[targetIndexPortal] = red + this.portalColors[portalNum][0] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 1] =
						green + this.portalColors[portalNum][1] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 2] =
						blue + this.portalColors[portalNum][2] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 3] = alpha;

					targetIndexPortal += this.bytesPerPixel * this.offscreenCanvasPixels.width;
				}
			} else if (cellX < this.mapCols && cellY < this.mapRows && cellX >= 0 && cellY >= 0) {
				const tileRow = xEnd & (this.TILE_SIZE - 1);
				const tileCol = yEnd & (this.TILE_SIZE - 1);

				const sourceIndex =
					tileRow * this.fFloorTextureBufferList[fIndex].width * this.bytesPerPixel +
					this.bytesPerPixel * tileCol;

				const red = ~~(this.fFloorTexturePixelsList[fIndex][sourceIndex] * (brightnessLevel + this.redTint));
				const green = ~~(
					this.fFloorTexturePixelsList[fIndex][sourceIndex + 1] *
					(brightnessLevel + this.greenTint)
				);
				const blue = ~~(
					this.fFloorTexturePixelsList[fIndex][sourceIndex + 2] *
					(brightnessLevel + this.blueTint)
				);
				const alpha = ~~this.fFloorTexturePixelsList[fIndex][sourceIndex + 3];

				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;

				targetIndex += this.bytesPerPixel * this.offscreenCanvasPixels.width;
			}
			count++;
		}
	}

	drawWallSliceRectangleTinted(
		x,
		// Regular ray
		rectTop,
		height,
		xOffset,
		brightnessLevel,
		textureBuffer,
		texturePixels,
		textureBufferPainting,
		texturePixelsPainting,
		textureBufferPaintingPortal,
		texturePixelsPaintingPortal,
		// Portal ray
		rectTopPortal,
		heightPortal,
		xOffsetPortal,
		brighnessLevelPortal,
		textureBufferPortal,
		texturePixelsPortal,
		portalNum
	) {
		rectTop = Math.floor(rectTop);
		// xOffset = ~~xOffset;

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
			// xOffsetPortal = ~~xOffsetPortal;

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

		let red;
		let green;
		let blue;
		let alpha;

		let yError = 0;
		let sourceRow;

		let paintingSourceTopPortal = null;
		let paintingSourceBottomPortal = null;
		let paintingSourceLeftPortal = null;
		let paintingSourceRightPortal = null;

		let sourceIndexPaintingPortal = null;

		let sourceRowPortal;

		//------------------------Draw Portal Walls & Paintings-------------------------

		if (sourceIndexPortal !== null && portalNum !== null) {
			// Open portal on column
			sourceRowPortal = ~~(sourceIndexPortal / (this.bytesPerPixel * textureBuffer.width));

			if (textureBufferPaintingPortal) {
				// Painting is present on column in portal
				paintingSourceTopPortal = textureBufferPortal.height / 2 - textureBufferPaintingPortal.height / 2;
				paintingSourceBottomPortal = textureBufferPortal.height / 2 + textureBufferPaintingPortal.height / 2;
				paintingSourceLeftPortal = textureBufferPortal.width / 2 - textureBufferPaintingPortal.width / 2;
				paintingSourceRightPortal = textureBufferPortal.width / 2 + textureBufferPaintingPortal.width / 2;

				sourceIndexPaintingPortal = this.bytesPerPixel * (xOffsetPortal - paintingSourceLeftPortal);
			}

			loop1: while (true) {
				yError += heightPortal;
				if (
					textureBufferPaintingPortal &&
					sourceRowPortal > paintingSourceTopPortal - 1 &&
					sourceRowPortal < paintingSourceBottomPortal &&
					xOffsetPortal > paintingSourceLeftPortal - 1 &&
					xOffsetPortal < paintingSourceRightPortal
				) {
					// Painting on column and within size of painting source
					red = ~~(
						texturePixelsPaintingPortal[sourceIndexPaintingPortal] *
						(brighnessLevelPortal + this.redTint)
					);
					green = ~~(
						texturePixelsPaintingPortal[sourceIndexPaintingPortal + 1] *
						(brighnessLevelPortal + this.greenTint)
					);
					blue = ~~(
						texturePixelsPaintingPortal[sourceIndexPaintingPortal + 2] *
						(brighnessLevelPortal + this.blueTint)
					);
					alpha = ~~texturePixelsPaintingPortal[sourceIndexPaintingPortal + 3];

					sourceIndexPaintingPortal += this.bytesPerPixel * textureBufferPaintingPortal.width;
				} else {
					// Just draw wall
					red = ~~(texturePixelsPortal[sourceIndexPortal] * (brighnessLevelPortal + this.redTint));
					green = ~~(texturePixelsPortal[sourceIndexPortal + 1] * (brighnessLevelPortal + this.greenTint));
					blue = ~~(texturePixelsPortal[sourceIndexPortal + 2] * (brighnessLevelPortal + this.blueTint));
					alpha = ~~texturePixelsPortal[sourceIndexPortal + 3];
				}

				while (yError >= textureBufferPortal.width) {
					yError -= textureBufferPortal.width;
					this.offscreenCanvasPixels.data[targetIndexPortal] = red + this.portalColors[portalNum][0] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 1] =
						green + this.portalColors[portalNum][1] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 2] =
						blue + this.portalColors[portalNum][2] * 0.2;
					this.offscreenCanvasPixels.data[targetIndexPortal + 3] = alpha;
					targetIndexPortal += this.bytesPerPixel * this.offscreenCanvasPixels.width;

					heightToDrawPortal--;
					if (heightToDrawPortal < 1) {
						break loop1;
					}
				}

				sourceIndexPortal += this.bytesPerPixel * textureBufferPortal.width;
				if (sourceIndexPortal > lastSourceIndexPortal) sourceIndexPortal = lastSourceIndexPortal;
				sourceRowPortal = ~~(sourceIndexPortal / (this.bytesPerPixel * textureBufferPortal.width));
			}
			yError = 0;
		}

		//--------------------------------------------------------------------------

		const circleCenter = this.TILE_SIZE / 2;
		const dx = circleCenter - xOffset;
		const radiusY = (circleCenter - 2) * (this.portalSizeMultipliers[portalNum] || 1);
		const radiusX = radiusY * 0.7;
		const effectRadiusY = radiusY + 2;
		const effectRadiusX = radiusX + 2;

		sourceRow = ~~(sourceIndex / (this.bytesPerPixel * textureBuffer.width));

		let paintingSourceTop = null;
		let paintingSourceBottom = null;
		let paintingSourceLeft = null;
		let paintingSourceRight = null;

		let sourceIndexPainting = null;

		let yOffset;
		let dy;
		let inEllipse;
		let inEffectEllipse;

		if (textureBufferPainting) {
			// Painting is present on column
			paintingSourceTop = textureBuffer.height / 2 - textureBufferPainting.height / 2;
			paintingSourceBottom = textureBuffer.height / 2 + textureBufferPainting.height / 2;
			paintingSourceLeft = textureBuffer.width / 2 - textureBufferPainting.width / 2;
			paintingSourceRight = textureBuffer.width / 2 + textureBufferPainting.width / 2;

			sourceIndexPainting = this.bytesPerPixel * (xOffset - paintingSourceLeft);
		}

		while (true) {
			yError += height;

			yOffset = sourceIndex / (this.bytesPerPixel * textureBuffer.width);
			dy = circleCenter - yOffset;
			inEllipse = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
			inEffectEllipse =
				(dx * dx) / (effectRadiusX * effectRadiusX) + (dy * dy) / (effectRadiusY * effectRadiusY) <= 1;

			if (
				textureBufferPainting &&
				sourceRow > paintingSourceTop - 1 &&
				sourceRow < paintingSourceBottom &&
				xOffset > paintingSourceLeft - 1 &&
				xOffset < paintingSourceRight
			) {
				// Painting on column and within size of painting source
				red = ~~(texturePixelsPainting[sourceIndexPainting] * (brightnessLevel + this.redTint));
				green = ~~(texturePixelsPainting[sourceIndexPainting + 1] * (brightnessLevel + this.greenTint));
				blue = ~~(texturePixelsPainting[sourceIndexPainting + 2] * (brightnessLevel + this.blueTint));
				alpha = ~~texturePixelsPainting[sourceIndexPainting + 3];

				sourceIndexPainting += this.bytesPerPixel * textureBufferPainting.width;
			} else {
				red = ~~(texturePixels[sourceIndex] * (brightnessLevel + this.redTint));
				green = ~~(texturePixels[sourceIndex + 1] * (brightnessLevel + this.greenTint));
				blue = ~~(texturePixels[sourceIndex + 2] * (brightnessLevel + this.blueTint));
				alpha = ~~texturePixels[sourceIndex + 3];
			}

			while (yError >= textureBuffer.width) {
				yError -= textureBuffer.width;
				if (sourceIndexPortal !== null && portalNum !== null && !inEllipse) {
					// Portal on column but source index is not within portal ellipse
					if (inEffectEllipse) {
						// source index is within portal effect ellipse but outside of portal ellipse
						this.offscreenCanvasPixels.data[targetIndex] = this.portalColors[portalNum][0] * brightnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 1] =
							this.portalColors[portalNum][1] * brightnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 2] =
							this.portalColors[portalNum][2] * brightnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
					} else {
						// Fill area outside of effect ellipse with wall texture
						this.offscreenCanvasPixels.data[targetIndex] = red;
						this.offscreenCanvasPixels.data[targetIndex + 1] = green;
						this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
						this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
					}
				} else if (!sourceIndexPortal && portalNum !== null) {
					// Closed portal
					if (inEffectEllipse) {
						// Use solid colors to fill inside of effect ellipse
						this.offscreenCanvasPixels.data[targetIndex] = this.portalColors[portalNum][0] * brightnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 1] =
							this.portalColors[portalNum][1] * brightnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 2] =
							this.portalColors[portalNum][2] * brightnessLevel;
						this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
					} else {
						// Fill area outside of effect ellipse with wall texture
						this.offscreenCanvasPixels.data[targetIndex] = red;
						this.offscreenCanvasPixels.data[targetIndex + 1] = green;
						this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
						this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
					}
				} else if (!sourceIndexPortal) {
					// No portal exists on column
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
			sourceRow = ~~(sourceIndex / (this.bytesPerPixel * textureBuffer.width));
		}
	}

	drawObjects(x) {}

	draw3d() {
		for (let i = 0; i < this.rayLengths.length; i++) {
			if (this.rayLengths[i] === 0) return;
			let dist = ~~(this.rayLengths[i] / this.fFishTable[i]);

			// Objects
			let objDist = null;
			if (this.objectRayLengths[i]) {
				objDist = this.objectRayLengths[i];
				// console.log(objDist);
			}

			// For possible portal ray --------------------------------------
			let totalPortalRayDist =
				this.totalPortalRayLengths[i] > 0 ? this.totalPortalRayLengths[i] / this.fFishTable[i] : null;
			let portalWallHeight = null;
			let portalWallBottom = null;
			let portalWallTop = null;
			let portalWallOffset = 0;
			let portalTextureBuffer = null;
			let portalTexturePixels = null;
			let portalBrightness = 0;
			let portalNum = null;
			let textureBufferPaintingPortal = null;
			let texturePixelsPaintingPortal = null;

			if (totalPortalRayDist) {
				loop: for (let j = 0; j < this.fPaintingDetails.length; j++) {
					const tileIndexPainting =
						this.fPaintingDetails[j].row * this.mapCols + this.fPaintingDetails[j].col;
					if (
						this.portalOutIndeces[i] === tileIndexPainting &&
						this.portalOutSides[i] === this.fPaintingDetails[j].side
					) {
						textureBufferPaintingPortal = this.fPaintingTextureBufferList[j];
						texturePixelsPaintingPortal = this.fPaintingTexturePixelsList[j];
						break loop;
					}
				}

				const ratio = this.fPlayerDistanceToProjectionPlane / totalPortalRayDist;
				const scale = (this.fPlayerDistanceToProjectionPlane * this.WALL_HEIGHT) / totalPortalRayDist;
				portalWallBottom = ratio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
				portalWallTop = portalWallBottom - scale;
				portalWallHeight = portalWallBottom - portalWallTop;

				portalWallOffset =
					this.portalOutSides?.[i] === 0 || this.portalOutSides?.[i] === 2
						? this.portalOutCollisionsX[i] & (this.TILE_SIZE - 1)
						: this.portalOutCollisionsY[i] & (this.TILE_SIZE - 1);

				if (this.portalOutSides?.[i] === 0 || this.portalOutSides?.[i] === 1)
					portalWallOffset = this.TILE_SIZE - portalWallOffset - 1;

				portalTextureBuffer = this.fWallTextureBufferList[this.portalOutTypes?.[i]];
				portalTexturePixels = this.fWallTexturePixelsList[this.portalOutTypes?.[i]];

				totalPortalRayDist = ~~totalPortalRayDist;
				portalBrightness = 110 / totalPortalRayDist;

				if (portalBrightness > 1.3) portalBrightness = 1.3;

				if (this.portalOutSides?.[i] === 1 || this.portalOutSides?.[i] === 3) {
					portalBrightness = portalBrightness * 0.8;
				}
			}

			if (this.portalTileIndeces[0] === this.tileIndeces[i] && this.portalTileSides[0] === this.tileSides[i])
				portalNum = 0;
			else if (
				this.portalTileIndeces[1] === this.tileIndeces[i] &&
				this.portalTileSides[1] === this.tileSides[i]
			)
				portalNum = 1;

			// ---------------------------------------------------------------

			const ratio = this.fPlayerDistanceToProjectionPlane / dist;
			const scale = (this.fPlayerDistanceToProjectionPlane * this.WALL_HEIGHT) / dist;
			const wallBottom = ratio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
			const wallTop = wallBottom - scale;
			const wallHeight = wallBottom - wallTop;

			let textureBufferPainting = null;
			let texturePixelsPainting = null;

			//-------------Add separate texture buffer/pixels for painting inside of portal--------------

			loop: for (let j = 0; j < this.fPaintingDetails.length; j++) {
				const tileIndexPainting = this.fPaintingDetails[j].row * this.mapCols + this.fPaintingDetails[j].col;
				if (
					tileIndexPainting === this.tileIndeces[i] &&
					this.fPaintingDetails[j].side === this.tileSides[i]
				) {
					textureBufferPainting = this.fPaintingTextureBufferList[j];
					texturePixelsPainting = this.fPaintingTexturePixelsList[j];
					break loop;
				}
			}

			// -------------------------------------------------------------------------------------------

			let adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			if (adjustedAngle < 0) adjustedAngle += 2 * this.pi;

			if (
				i === this.PROJECTIONPLANEWIDTH / 2 &&
				wallTop <= this.PROJECTIONPLANEHEIGHT / 2 &&
				wallBottom >= this.PROJECTIONPLANEHEIGHT / 2
			) {
				this.reticleOnWall = true;
			} else if (i === this.PROJECTIONPLANEWIDTH / 2) this.reticleOnWall = false;

			let offset =
				this.tileSides?.[i] === 0 || this.tileSides?.[i] === 2
					? this.tileCollisionsX[i] & (this.TILE_SIZE - 1)
					: this.tileCollisionsY[i] & (this.TILE_SIZE - 1);

			if (this.tileSides?.[i] === 0 || this.tileSides?.[i] === 1) offset = this.TILE_SIZE - offset - 1;

			let textureBuffer = this.fWallTextureBufferList[this.tileTypes?.[i]];
			let texturePixels = this.fWallTexturePixelsList[this.tileTypes?.[i]];

			// dist = ~~dist;

			let brightnessLevel = 110 / dist;
			if (brightnessLevel > 1.3) brightnessLevel = 1.3;
			if (this.tileSides?.[i] === 1 || this.tileSides?.[i] === 3) brightnessLevel = brightnessLevel * 0.8;

			this.drawFloor(
				Math.floor(wallBottom),
				i,
				adjustedAngle,
				Math.floor(portalWallBottom),
				this.portalOutAngs[i],
				portalNum
			);

			this.drawCeiling(
				Math.floor(wallTop),
				i,
				adjustedAngle,
				Math.floor(portalWallTop),
				this.portalOutAngs[i],
				portalNum
			);

			this.drawWallSliceRectangleTinted(
				i,
				// Regular Ray
				wallTop,
				wallHeight + 1,
				offset,
				brightnessLevel,
				textureBuffer,
				texturePixels,
				textureBufferPainting,
				texturePixelsPainting,
				textureBufferPaintingPortal,
				texturePixelsPaintingPortal,
				// Portal Ray
				portalWallTop,
				portalWallHeight + 1,
				portalWallOffset,
				portalBrightness,
				portalTextureBuffer,
				portalTexturePixels,
				portalNum
			);

			this.drawObjects();
		}
	}

	draw2d() {
		for (let i = 0; i < this.mapRows; i++) {
			for (let j = 0; j < this.mapCols; j++) {
				const tile = this.map[i * this.mapCols + j];

				this.debugCtx.fillStyle = `rgb(${(tile + 1) / 0.1}, ${(tile + 1) / 0.1}, ${(tile + 1) / 0.1})`;
				this.debugCtx.beginPath();
				this.debugCtx.fillRect(j * this.TILE_SIZE, i * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
			}
		}

		for (let i = 0; i < this.objects.length; i++) {
			this.debugCtx.fillStyle = `rgb(0, 100, 255)`;
			this.debugCtx.beginPath();
			this.debugCtx.ellipse(
				this.objects[i].x,
				this.objects[i].y,
				this.fObjectTextureBufferList[i].width / 2,
				this.fObjectTextureBufferList[i].width / 2,
				2 * this.pi,
				0,
				2 * this.pi
			);
			this.debugCtx.fill();
		}
	}

	getIntersectionOfTile(x, y, row, col, theta, sides = [0, 1, 2, 3]) {
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

		for (let i = 0; i < sides.length; i++) {
			switch (sides[i]) {
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
					dir = sides[i];
				}
			}
		}

		return {
			record,
			closest,
			dir,
		};
	}

	setRayFromPortal(
		i,
		portalIntersectInX,
		portalIntersectInY,
		portalIndexOut,
		portalTileSideOut,
		portalTileSideIn,
		rayInAng
	) {
		if (portalIndexOut >= 0) {
			let offset;

			switch (portalTileSideIn) {
				case 0:
					offset = this.TILE_SIZE - (portalIntersectInX & (this.TILE_SIZE - 1));
					break;
				case 1:
					offset = this.TILE_SIZE - (portalIntersectInY & (this.TILE_SIZE - 1));
					break;
				case 2:
					offset = portalIntersectInX & (this.TILE_SIZE - 1);
					break;
				case 3:
					offset = portalIntersectInY & (this.TILE_SIZE - 1);
					break;
			}

			const xStart = this.TILE_SIZE * (portalIndexOut % this.mapCols) - 1;
			const yStart = this.TILE_SIZE * ~~(portalIndexOut / this.mapCols);

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
				this.portalOutXVals[i] & (this.TILE_SIZE - 1 !== 0)
			) {
				this.portalOutXVals[i] += 1;
			} else if (
				(portalTileSideOut === 0 || portalTileSideOut === 2) &&
				this.portalOutYVals[i] & (this.TILE_SIZE - 1 !== 0)
			) {
				this.portalOutYVals[i] += 1;
			}

			let tileSideDiff = portalTileSideIn - portalTileSideOut;
			const tileSideDiffSign = tileSideDiff >= 0 ? 1 : -1;
			tileSideDiff = Math.abs(tileSideDiff);
			let rayOutAng;

			if (tileSideDiff === 0) rayOutAng = rayInAng + this.pi;
			else if (tileSideDiff === 1) {
				rayOutAng = rayInAng + (this.pi / 2) * tileSideDiffSign;
			} else if (tileSideDiff === 2) {
				rayOutAng = rayInAng;
			} else if (tileSideDiff === 3) {
				rayOutAng = rayInAng - (this.pi / 2) * tileSideDiffSign;
			}

			let portal2RayRecord = Infinity;
			let portal2RayClosest = null;
			let tileTypeTemp = 0;
			let tileSideDirTemp = 0;
			let tileIndexTemp = 0;

			for (let row = 0; row < this.mapRows; row++) {
				for (let col = 0; col < this.mapCols; col++) {
					const tile = this.map[row * this.mapCols + col];
					if (tile > 5) continue;

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
						tileIndexTemp = row * this.mapCols + col;
					}
				}
			}

			if (portal2RayClosest) {
				this.totalPortalRayLengths[i] = ~~(this.rayLengths[i] + portal2RayRecord);
				this.portalOutCollisionsX[i] = portal2RayClosest[0];
				this.portalOutCollisionsY[i] = portal2RayClosest[1];
				this.portalOutTypes[i] = tileTypeTemp;
				this.portalOutSides[i] = tileSideDirTemp;
				this.portalOutIndeces[i] = tileIndexTemp;
				this.portalOutAngs[i] = rayOutAng;

				if (this.DEBUG) {
					this.debugCtx.fillStyle = 'blue';
					this.debugCtx.beginPath();
					this.debugCtx.ellipse(portalIntersectInX, portalIntersectInY, 3, 3, 0, 0, 2 * this.pi);
					this.debugCtx.fill();

					this.debugCtx.fillStyle = 'orangeRed';
					this.debugCtx.beginPath();
					this.debugCtx.ellipse(this.portalOutXVals[i], this.portalOutYVals[i], 3, 3, 0, 0, 2 * this.pi);
					this.debugCtx.fill();

					this.debugCtx.strokeStyle =
						i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
					this.debugCtx.beginPath();
					this.debugCtx.moveTo(this.portalOutXVals[i], this.portalOutYVals[i]);
					this.debugCtx.lineTo(portal2RayClosest[0], portal2RayClosest[1]);
					this.debugCtx.lineWidth = 1;
					this.debugCtx.stroke();
				}
			} else this.totalPortalRayLengths[i] = 0;
		}
	}

	raycaster() {
		let tileTypeTemp = 0;
		let tileSideDirTemp = 0;

		for (let i = 0; i < this.rayAngles.length; i++) {
			let adjustedAngle;
			adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			if (adjustedAngle < 0) adjustedAngle += 2 * this.pi;

			this.rayAngleQuadrants[i] = Math.floor(adjustedAngle / (this.pi / 2));

			let sidesToCheck = [0, 1, 2, 3];
			if (this.rayAngleQuadrants[i] === 0) sidesToCheck = [0, 3];
			else if (this.rayAngleQuadrants[i] === 1) sidesToCheck = [0, 1];
			else if (this.rayAngleQuadrants[i] === 2) sidesToCheck = [1, 2];
			else if (this.rayAngleQuadrants[i] === 3) sidesToCheck = [2, 3];

			let closest = null;
			let record = Infinity;

			let tileIndex = 0;
			for (let row = 0; row < this.mapRows; row++) {
				for (let col = 0; col < this.mapCols; col++) {
					const tile = this.map[row * this.mapCols + col];
					if (tile > 5) continue;

					const tileIntersection = this.getIntersectionOfTile(
						this.fPlayerX,
						this.fPlayerY,
						row,
						col,
						adjustedAngle,
						sidesToCheck
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
				this.rayLengths[i] = ~~record;
				this.tileCollisionsX[i] = closest[0];
				this.tileCollisionsY[i] = closest[1];
				this.tileTypes[i] = tileTypeTemp;
				this.tileSides[i] = tileSideDirTemp;
				this.tileIndeces[i] = tileIndex;

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
				} else this.totalPortalRayLengths[i] = 0;

				if (this.DEBUG) {
					this.debugCtx.strokeStyle =
						i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
					this.debugCtx.beginPath();
					this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
					this.debugCtx.lineTo(closest[0], closest[1]);
					this.debugCtx.lineWidth = 1;
					this.debugCtx.stroke();
				}
			} else this.rayLengths[i] = 0;

			// Filter through objects for each ray
			for (let j = 0; j < this.objects.length; j++) {
				let objCoords;

				// Get perpendicular line coords
				const slope = (this.objects[j].y - this.fPlayerY) / (this.objects[j].x - this.fPlayerX);
				const perpSlope = -(1 / slope);
				const angle = Math.atan(perpSlope);
				const x1 = this.objects[j].x + (this.fObjectTextureBufferList[j].width / 2) * Math.cos(angle);
				const y1 = this.objects[j].y + (this.fObjectTextureBufferList[j].width / 2) * Math.sin(angle);
				const x2 = this.objects[j].x - (this.fObjectTextureBufferList[j].width / 2) * Math.cos(angle);
				const y2 = this.objects[j].y - (this.fObjectTextureBufferList[j].width / 2) * Math.sin(angle);
				objCoords = [x1, y1, x2, y2];

				const intersection = getIntersection(
					this.fPlayerX,
					this.fPlayerY,
					1,
					adjustedAngle,
					objCoords[0],
					objCoords[1],
					objCoords[2],
					objCoords[3]
				);

				if (intersection?.[0]) {
					const dx = Math.abs(this.fPlayerX - intersection[0]);
					const dy = Math.abs(this.fPlayerY - intersection[1]);
					const d = Math.sqrt(dx * dx + dy * dy);

					if (d < record) {
						this.objectRayLengths[j] = d;
						this.objectCollisionsX[j] = intersection[0];
						this.objectCollisionsY[j] = intersection[1];

						if (this.DEBUG) {
							this.debugCtx.strokeStyle = `rgba(0,100,255,0.3)`;
							this.debugCtx.beginPath();
							this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
							this.debugCtx.lineTo(intersection[0], intersection[1]);
							this.debugCtx.lineWidth = 1;
							this.debugCtx.stroke();
						}
					}
				}
			}
		}
	}

	rotate() {
		if (this.fRotationDir === 'left') {
			this.fPlayerAngle -= 4;
		} else if (this.fRotationDir === 'right') {
			this.fPlayerAngle += 4;
		}
	}

	setMoveDir() {
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
	}

	playerTooCloseToWall(row, col) {
		const minDist = (this.TILE_SIZE * Math.sqrt(2)) / 1.5;

		const tileMidX = col * this.TILE_SIZE + this.TILE_SIZE / 2;
		const tileMidY = row * this.TILE_SIZE + this.TILE_SIZE / 2;

		const dx = this.fPlayerX - tileMidX;
		const dy = this.fPlayerY - tileMidY;
		const d = Math.sqrt(dx * dx + dy * dy);

		if (d <= minDist) return [dx, dy];
		return;
	}

	handlePortalCollision(portalNum) {
		const portalNumOut = portalNum === 0 ? 1 : 0;
		const xStartOut = this.TILE_SIZE * (this.portalTileIndeces[portalNumOut] % this.mapCols);
		const yStartOut = this.TILE_SIZE * ~~(this.portalTileIndeces[portalNumOut] / this.mapCols);

		let offset;
		let newPlayerX = null;
		let newPlayerY = null;
		switch (this.portalTileSides[portalNum]) {
			case 0:
				offset = this.TILE_SIZE - (this.fPlayerX & (this.TILE_SIZE - 1));
				break;
			case 1:
				offset = this.TILE_SIZE - (this.fPlayerY & (this.TILE_SIZE - 1));
				break;
			case 2:
				offset = this.fPlayerX & (this.TILE_SIZE - 1);
				break;
			case 3:
				offset = this.fPlayerY & (this.TILE_SIZE - 1);
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

			if (tileSideDiff === 0) portalOutAng = portalInAng + this.pi;
			else if (Math.abs(tileSideDiff) === 1) {
				portalOutAng = portalInAng + (this.pi / 2) * tileSideDiffSign;
			} else if (Math.abs(tileSideDiff) === 2) {
				portalOutAng = portalInAng;
			} else if (Math.abs(tileSideDiff) === 3) {
				portalOutAng = portalInAng - (this.pi / 2) * tileSideDiffSign;
			}

			this.fPlayerAngle = radToDeg(portalOutAng);
		}
	}

	getXspeed = () => this.fPlayerMoveSpeed * Math.cos(degToRad(this.fPlayerMoveDir));

	getYspeed = () => this.fPlayerMoveSpeed * Math.sin(degToRad(this.fPlayerMoveDir));

	move() {
		if (this.levelTransition) return;
		this.rotate();

		const playerTileCol = ~~(this.fPlayerX / this.TILE_SIZE);
		const playerTileRow = ~~(this.fPlayerY / this.TILE_SIZE);

		this.setMoveDir();
		let moveDir = convertDeg0To360(this.fPlayerMoveDir);
		let newPlayerX = null;
		let newPlayerY = null;

		if (this.fKeyForward || this.fKeyBack || this.fKeyLeft || this.fKeyRight) {
			for (let row = 0; row < this.mapRows; row++) {
				loop1: for (let col = 0; col < this.mapCols; col++) {
					const tileIndex = row * this.mapCols + col;
					const tile = this.map[tileIndex];
					if (tile > 5 || (row === playerTileRow && col === playerTileCol)) continue;

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
								if (
									this.portalTileIndeces[1] >= 0 &&
									tileIndex === this.portalTileIndeces[0] &&
									this.portalTileSides[0] === intersectSide
								) {
									this.handlePortalCollision(0);
									return;
								} else if (
									this.portalTileIndeces[0] >= 0 &&
									tileIndex === this.portalTileIndeces[1] &&
									this.portalTileSides[1] === intersectSide
								) {
									this.handlePortalCollision(1);
									return;
								}
								newPlayerY = this.fPlayerY + this.getYspeed();
							} else if (angleToWallCenter >= 45 && angleToWallCenter < 90) {
								// On top or bottom of wall
								const playerWallTileDiffRow = playerTileRow - row;
								if (playerWallTileDiffRow > 0 && moveDir > 0 && moveDir < 180) break loop1;
								else if (playerWallTileDiffRow < 0 && moveDir > 180 && moveDir < 360) break loop1;

								const intersectSide = playerWallTileDiffRow > 0 ? 2 : 0;
								if (
									this.portalTileIndeces[1] >= 0 &&
									tileIndex === this.portalTileIndeces[0] &&
									this.portalTileSides[0] === intersectSide
								) {
									this.handlePortalCollision(0);
									return;
								} else if (
									this.portalTileIndeces[0] >= 0 &&
									tileIndex === this.portalTileIndeces[1] &&
									this.portalTileSides[1] === intersectSide
								) {
									this.handlePortalCollision(1);
									return;
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

		moveDir = degToRad(moveDir);

		if (this.fKeyForward || this.fKeyBack || this.fKeyLeft || this.fKeyRight) {
			this.fPlayerX += this.fPlayerMoveSpeed * Math.cos(moveDir);
			this.fPlayerY += this.fPlayerMoveSpeed * Math.sin(moveDir);
		}
	}

	onWallTextureLoaded(imgNames) {
		this.fWallTextureBufferList = new Array(imgNames.length);
		this.fWallTexturePixelsList = new Array(imgNames.length);
		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fWallTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fWallTextureBufferList[i].getContext('2d', { alpha: false }).drawImage(img, 0, 0);

			const imgData = this.fWallTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fWallTextureBufferList[i].width, this.fWallTextureBufferList[i].height);
			this.fWallTexturePixelsList[i] = imgData.data;
		}
	}

	onCeilingTextureLoaded(imgName) {
		const img = this.textures[imgName];
		this.fCeilingTextureBuffer = new OffscreenCanvas(img.width, img.height);
		this.fCeilingTextureBuffer.getContext('2d', { alpha: false }).drawImage(img, 0, 0);

		const imgData = this.fCeilingTextureBuffer
			.getContext('2d', { alpha: false })
			.getImageData(0, 0, this.fCeilingTextureBuffer.width, this.fCeilingTextureBuffer.height);
		this.fCeilingTexturePixels = imgData.data;
	}

	onFloorTextureLoaded(imgNames) {
		this.fFloorTextureBufferList = new Array(imgNames.length);
		this.fFloorTexturePixelsList = new Array(imgNames.length);
		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fFloorTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fFloorTextureBufferList[i].getContext('2d', { alpha: false }).drawImage(img, 0, 0);

			const imgData = this.fFloorTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fFloorTextureBufferList[i].width, this.fFloorTextureBufferList[i].height);
			this.fFloorTexturePixelsList[i] = imgData.data;
		}
	}

	onPaintingTexturesLoaded(imgNames) {
		this.fPaintingTextureBufferList = new Array(imgNames.length);
		this.fPaintingTexturePixelsList = new Array(imgNames.length);

		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fPaintingTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fPaintingTextureBufferList[i].getContext('2d', { alpha: false }).drawImage(img, 0, 0);

			const imgData = this.fPaintingTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(
					0,
					0,
					this.fPaintingTextureBufferList[i].width,
					this.fPaintingTextureBufferList[i].height
				);
			this.fPaintingTexturePixelsList[i] = imgData.data;
		}
	}

	onObjectTexturesLoaded(imgNames) {
		this.fObjectTextureBufferList = new Array(imgNames.length);
		this.fObjectTexturePixelsList = new Array(imgNames.length);

		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fObjectTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fObjectTextureBufferList[i].getContext('2d', { alpha: false }).drawImage(img, 0, 0);

			const imgData = this.fPaintingTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fObjectTextureBufferList[i].width, this.fObjectTextureBufferList[i].height);
			this.fObjectTexturePixelsList[i] = imgData.data;
		}
	}

	setNewMapData(i = this.mapNum) {
		this.onWallTextureLoaded(maps[i].wallTextures);
		this.onPaintingTexturesLoaded(maps[i].paintings);
		this.fPaintingDetails = maps[i].paintingDetails;

		this.onCeilingTextureLoaded(maps[i].ceilingTexture);
		this.onFloorTextureLoaded(maps[i].floorTextures);
		this.onObjectTexturesLoaded(maps[i].objects.map(obj => obj.type));
		this.objects = maps[i].objects;

		this.map = new Uint8Array(maps[i].map.flat());
		this.mapNum = i;
		this.doorMap = maps[i].doorMap;
		this.mapCols = maps[i].map[0].length;
		this.mapRows = maps[i].map.length;
		this.mapWidth = this.TILE_SIZE * this.mapCols;
		this.mapHeight = this.TILE_SIZE * this.mapRows;
		this.fPlayerX = this.fPlayerX;
		this.fPlayerY = this.fPlayerY;
		this.portalTileIndeces.fill(-1);

		if (this.DEBUG && this.debugCanvas) {
			this.debugCanvas.width = this.mapWidth;
			this.debugCanvas.height = this.mapHeight;
			this.debugCanvasWidth = this.debugCanvas.width;
			this.debugCanvasHeight = this.debugCanvas.height;
			this.debugCtx = this.debugCanvas.getContext('2d', { alpha: false });

			this.debugCanvas.style.aspectRatio = this.debugCanvasWidth / this.debugCanvasHeight;
		}
	}

	jump() {
		if (this.isCrouching || this.isStanding) return;
		this.fPlayerHeight += this.jumpSpeed * this.fGameSpeed;
		this.jumpSpeed -= this.gravityValue * this.fGameSpeed;

		if (this.fPlayerHeight <= this.TILE_SIZE / 2) {
			this.jumpSpeed = this.jumpSpeedStart;
			this.fPlayerHeight = this.TILE_SIZE / 2;
			this.isJumping = false;
		}
	}

	crouch() {
		if (this.isJumping || this.isStanding) return;
		this.fPlayerHeight -= this.crouchSpeed * this.fGameSpeed;
		this.crouchSpeed -= this.crouchGravity * this.fGameSpeed;

		if (this.fPlayerHeight <= this.TILE_SIZE / 2 - this.crouchAmt) {
			this.crouchSpeed = this.crouchSpeedStart;
			this.fPlayerHeight = this.TILE_SIZE / 2 - this.crouchAmt;
		}
	}

	stand() {
		if (this.isJumping || this.isCrouching) return;
		this.fPlayerHeight += this.crouchSpeed * this.fGameSpeed;
		this.crouchSpeed -= this.crouchGravity * this.fGameSpeed;

		if (this.fPlayerHeight >= this.TILE_SIZE / 2 || this.crouchSpeed <= 0) {
			this.crouchSpeed = this.crouchSpeedStart;
			this.fPlayerHeight = this.TILE_SIZE / 2;
			this.isStanding = false;
		}
	}

	fade() {
		if (this.levelTransition) {
			if (this.levelTransitionFadeAmt < 1) this.levelTransitionFadeAmt += 0.05;
			else this.levelTransition = false;
			this.ctx.fillStyle = `rgba(0, 0, 0, ${this.levelTransitionFadeAmt})`;
			this.ctx.fillRect(0, 0, this.PROJECTIONPLANEWIDTH, this.PROJECTIONPLANEHEIGHT);
		} else if (this.levelTransitionFadeAmt > 0) {
			this.levelTransitionFadeAmt -= 0.05;
			this.ctx.fillStyle = `rgba(0, 0, 0, ${this.levelTransitionFadeAmt})`;
			this.ctx.fillRect(0, 0, this.PROJECTIONPLANEWIDTH, this.PROJECTIONPLANEHEIGHT);
		}
	}

	update() {
		if (this.DEBUG && this.debugCtx)
			this.debugCtx.clearRect(0, 0, this.debugCanvasWidth, this.debugCanvasHeight);

		if (this.isJumping) this.jump();
		if (this.isCrouching) this.crouch();
		if (this.isStanding) this.stand();

		if (this.portalSizeMultipliers[0] < 1) {
			this.portalSizeMultipliers[0] += 0.02 * this.fGameSpeed;
			if (this.portalSizeMultipliers[0] >= 1) this.portalSizeMultipliers[0] = 1;
		}
		if (this.portalSizeMultipliers[1] < 1) {
			this.portalSizeMultipliers[1] += 0.02 * this.fGameSpeed;
			if (this.portalSizeMultipliers[1] >= 1) this.portalSizeMultipliers[1] = 1;
		}

		this.move();
		if (this.DEBUG) this.draw2d();
		this.raycaster();
		this.draw3d();

		if (this.DEBUG && this.debugCtx) {
			this.debugCtx.fillStyle = `rgba(0,255,0,1)`;
			this.debugCtx.beginPath();
			this.debugCtx.ellipse(this.fPlayerX, this.fPlayerY, 4, 4, 0, 0, 2 * this.pi);
			this.debugCtx.fill();
		}
	}

	setAngles() {
		const rayInc = this.fPlayerFov / this.PROJECTIONPLANEWIDTH;
		let ang = 0;

		for (let i = 0; i < this.rayAngles.length; i++) {
			this.rayAngles[i] = degToRad(ang - this.fPlayerFov / 2);
			ang += rayInc;
		}

		for (let i = -this.PROJECTIONPLANEWIDTH / 2; i < this.PROJECTIONPLANEWIDTH / 2; i++) {
			const radian = (i * this.pi) / (this.PROJECTIONPLANEWIDTH * 3);
			this.fFishTable[i + this.PROJECTIONPLANEWIDTH / 2] = 1 / Math.cos(radian);
		}
	}

	async preloadTextures() {
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
	}

	async init() {
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

		document.addEventListener(
			'pointerlockchange',
			() => {
				if (document.pointerLockElement === canvas) {
					this.userIsInTab = true;
				} else this.userIsInTab = false;
			},
			false
		);

		document.addEventListener('mousedown', () => {
			if (!this.userIsInTab && !this.DEBUG) {
				this.canvas.requestPointerLock =
					this.canvas.requestPointerLock ||
					this.canvas.mozRequestPointerLock ||
					this.canvas.webkitRequestPointerLock;

				const promise = this.canvas.requestPointerLock({ unadjustedMovement: true });

				if (!promise) {
					console.log('Disabling mouse acceleration is not supported');
					return this.canvas.requestPointerLock();
				}

				return promise
					.then(() => console.log('Pointer is locked'))
					.catch(err => {
						if (err.name === 'NotSupportedError') {
							return this.canvas.requestPointerLock();
						}
					});
			}
		});

		document.addEventListener('contextmenu', e => e.preventDefault());

		window.addEventListener('beforeunload', e => {
			if (this.preventPageReloadDialog) return;
			e.preventDefault();
			return (e.returnValue = 'Exit Tab?');
		});
	}
}

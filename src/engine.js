import { convertDeg0To360, degToRad, getIntersection, radToDeg } from '../utils/calc.js';
import { maps, texturePaths } from './maps.js';

export default class Engine {
	constructor(audio, db) {
		this.db = db;
		this.audio = audio;
		this.canvas = document.getElementById('canvas');
		this.canvasWidth = this.canvas.width;
		this.canvasHeight = this.canvas.height;
		this.ctx = this.canvas.getContext('2d', { alpha: true });

		this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
		this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d', { alpha: false });
		this.offscreenCanvasPixels = this.offscreenCanvasContext.getImageData(
			0,
			0,
			this.canvasWidth,
			this.canvasHeight
		);

		this.PROJECTIONPLANEWIDTH = this.canvasWidth;
		this.PROJECTIONPLANEHEIGHT = this.canvasHeight;

		this.mapLightValues = [null, null, null];
		this.mapLightRefs = [null, null, null];
		this.mapLightSides = [null, null, null];
		this.currentLightValues = null;
		this.currentLightRefs = null;
		this.currentThinWallLightSides = null;

		this.minBrightness = 0.12;
		this.maxBrightness = 1.3;

		this.fWallTextureBufferList;
		this.fWallTexturePixelsList;

		this.fPaintingTextureBufferList;
		this.fPaintingTexturePixelsList;
		this.fPaintingDetails;

		this.fFloorTextureBufferList;
		this.fFloorTexturePixelsList;

		this.fCeilingTextureBuffer;
		this.fCeilingTexturePixels;

		this.fSkyTextureBuffer;
		this.fSkyTexturePixels;

		this.fObjectTextureBufferList;
		this.fObjectTexturePixelsList;

		this.fThinWallTextureBufferList;
		this.fThinWallTexturePixelsList;

		this.fItemTextureBufferList;
		this.fItemTexturePixelsList;

		this.fLightTextureBufferList;
		this.fLightTexturePixelList;

		this.noCeilingIndeces;

		this.items = [];
		this.objects = [];
		this.lightSources = [];
		this.objectRefs = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectOffsets = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectRayLengths = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectCollisionsX = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectCollisionsY = new Array(this.PROJECTIONPLANEWIDTH);
		this.isItemRay = new Array(this.PROJECTIONPLANEWIDTH);
		this.isLightsourceRay = new Array(this.PROJECTIONPLANEWIDTH);

		this.minUseDist = 140;

		this.objectTargetIndecesForStrip = [];
		this.objectDistsForStrip = [];

		this.thinWalls = [];
		this.thinWallRefs = new Array(this.PROJECTIONPLANEWIDTH);
		this.thinWallOffsets = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.thinWallRayLengths = new Uint16Array(this.PROJECTIONPLANEWIDTH);
		this.thinWallCollisionsX = new Float32Array(this.PROJECTIONPLANEWIDTH);
		this.thinWallCollisionsY = new Float32Array(this.PROJECTIONPLANEWIDTH);

		this.activeThinWallId = null;

		this.bytesPerPixel = 4;
		this.pi = Math.PI;

		this.texturePaths = texturePaths;
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

		this.fProjectionPlaneYCenter = this.PROJECTIONPLANEHEIGHT / 2;

		this.fPlayerX = 100;
		this.fPlayerY = 100;
		this.fPlayerAngle = 10;
		this.fPlayerMoveDir = 0;
		this.fPlayerFov = 70;
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

		this.redTint = 1.2;
		this.greenTint = 1.1;
		this.blueTint = 1;

		this.levelTransition = false;
		this.levelTransitionFadeAmt = 0;
		this.doorMap = {};

		this.inventorySlotCols = 5;
		this.inventorySlotRows = 6;
		this.inventoryOpen = false;
		this.inventory = [
			{
				name: 'apple',
				slotIdStartCol: 0,
				slotIdStartRow: 0,
				slotCols: 1,
				slotRows: 1,
				category: 'food',
			},
			{
				name: 'bread',
				slotIdStartCol: 0,
				slotIdStartRow: 1,
				slotCols: 2,
				slotRows: 1,
				category: 'food',
			},
		];

		this.itemInUseIndex = null;

		this.timeOfLastFootstep = 10000;

		this.DEBUG = false;
		this.preventPageReloadDialog = false;
		this.consoleValues = [];
		this.lightingVersionNum = 3;
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
		let targetIndex = bytesPerPixel * this.canvasWidth * y + bytesPerPixel * x;
		for (let h = 0; h < height; h++) {
			for (let w = 0; w < width; w++) {
				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
				targetIndex += bytesPerPixel;
			}
			targetIndex += bytesPerPixel * (this.canvasWidth - width);
		}
	}

	drawSky(x, angle) {
		const xRatio = convertDeg0To360(radToDeg(angle)) / 360;
		const sourceCol = ~~(this.fSkyTextureBuffer.width * xRatio);
		let sourceIndex = ~~(
			this.fSkyTextureBuffer.height * (this.fSkyTextureBuffer.width * this.bytesPerPixel) +
			sourceCol * this.bytesPerPixel
		);
		for (let row = ~~this.fProjectionPlaneYCenter; row >= 0; row--) {
			if (row <= this.canvasHeight) {
				const targetIndex = row * (this.canvasWidth * this.bytesPerPixel) + this.bytesPerPixel * x;
				const red = this.fSkyTexturePixels[sourceIndex];
				const green = this.fSkyTexturePixels[sourceIndex + 1];
				const blue = this.fSkyTexturePixels[sourceIndex + 2];
				this.offscreenCanvasPixels.data[targetIndex] = red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
			}
			sourceIndex -= this.bytesPerPixel * this.fSkyTextureBuffer.width;
		}
	}

	drawCeiling(wallTop, castColumn, rayAng) {
		let targetIndex = wallTop * (this.canvasWidth * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		for (let row = wallTop; row >= 0; row--) {
			const ratio = (this.WALL_HEIGHT - this.fPlayerHeight) / (this.fProjectionPlaneYCenter - row);
			const diagDist = ~~(this.fPlayerDistanceToProjectionPlane * ratio * this.fFishTable[castColumn]);

			const xEnd = ~~(diagDist * Math.cos(rayAng) + this.fPlayerX);
			const yEnd = ~~(diagDist * Math.sin(rayAng) + this.fPlayerY);

			let brightnessLevel = this.currentLightValues?.[yEnd * this.mapWidth + xEnd] || this.minBrightness;
			if (brightnessLevel > this.maxBrightness) brightnessLevel = this.maxBrightness;

			const cellX = ~~(xEnd / this.TILE_SIZE);
			const cellY = ~~(yEnd / this.TILE_SIZE);
			const cellIndex = cellY * this.mapCols + cellX;

			if (
				this.fCeilingTextureBuffer &&
				cellX < this.mapCols &&
				cellY < this.mapRows &&
				cellX >= 0 &&
				cellY >= 0
			) {
				if (!this.noCeilingIndeces.includes(cellIndex)) {
					const tileRow = xEnd & (this.TILE_SIZE - 1);
					const tileCol = yEnd & (this.TILE_SIZE - 1);

					const sourceIndex =
						tileRow * this.fCeilingTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

					const red = this.fCeilingTexturePixels[sourceIndex] * (brightnessLevel * this.redTint);
					const green = this.fCeilingTexturePixels[sourceIndex + 1] * (brightnessLevel * this.greenTint);
					const blue = this.fCeilingTexturePixels[sourceIndex + 2] * (brightnessLevel * this.blueTint);

					this.offscreenCanvasPixels.data[targetIndex] = ~~red;
					this.offscreenCanvasPixels.data[targetIndex + 1] = ~~green;
					this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blue;
					this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
				}
				targetIndex -= this.bytesPerPixel * this.canvasWidth;
			}
		}
	}

	drawFloor(wallBottom, castColumn, rayAng) {
		let targetIndex = wallBottom * (this.canvasWidth * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		for (let row = wallBottom + 1; row <= this.PROJECTIONPLANEHEIGHT; row++) {
			const straightDistance =
				(this.fPlayerHeight / (row - this.fProjectionPlaneYCenter)) * this.fPlayerDistanceToProjectionPlane;

			const diagDist = straightDistance * this.fFishTable[castColumn];

			const xEnd = ~~(diagDist * Math.cos(rayAng) + this.fPlayerX);
			const yEnd = ~~(diagDist * Math.sin(rayAng) + this.fPlayerY);

			let brightnessLevel = this.currentLightValues?.[yEnd * this.mapWidth + xEnd] || this.minBrightness;
			if (brightnessLevel > this.maxBrightness) brightnessLevel = this.maxBrightness;

			let cellX = ~~(xEnd / this.TILE_SIZE);
			let cellY = ~~(yEnd / this.TILE_SIZE);

			let fIndex = 0;

			const tileIndex = cellY * this.mapCols + cellX;
			let type = this.map[tileIndex];
			if (type >= 6) fIndex = type - 6;

			if (cellX < this.mapCols && cellY < this.mapRows && cellX >= 0 && cellY >= 0) {
				const tileRow = xEnd & (this.TILE_SIZE - 1);
				const tileCol = yEnd & (this.TILE_SIZE - 1);

				const sourceIndex =
					tileRow * this.fFloorTextureBufferList[fIndex].width * this.bytesPerPixel +
					this.bytesPerPixel * tileCol;

				const red = this.fFloorTexturePixelsList[fIndex][sourceIndex] * (brightnessLevel * this.redTint);
				const green =
					this.fFloorTexturePixelsList[fIndex][sourceIndex + 1] * (brightnessLevel * this.greenTint);
				const blue =
					this.fFloorTexturePixelsList[fIndex][sourceIndex + 2] * (brightnessLevel * this.blueTint);

				this.offscreenCanvasPixels.data[targetIndex] = ~~red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = ~~green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = 255;

				targetIndex += this.bytesPerPixel * this.canvasWidth;
			}
		}
	}

	drawWallSliceRectangleTinted(
		x,
		rectTop,
		height,
		xOffset,
		brightnessLevel,
		textureBuffer,
		texturePixels,
		textureBufferPainting,
		texturePixelsPainting
	) {
		rectTop = Math.floor(rectTop);

		let sourceIndex = this.bytesPerPixel * xOffset;
		const lastSourceIndex = sourceIndex + textureBuffer.width * textureBuffer.height * this.bytesPerPixel;

		let targetIndex = this.canvasWidth * this.bytesPerPixel * rectTop + this.bytesPerPixel * x;

		let heightToDraw = height;

		if (rectTop + heightToDraw > this.canvasHeight) heightToDraw = this.canvasHeight - rectTop;

		if (heightToDraw < 0) return;

		let red;
		let green;
		let blue;
		let alpha;

		let yError = 0;
		let sourceRow;

		sourceRow = ~~(sourceIndex / (this.bytesPerPixel * textureBuffer.width));

		let paintingSourceTop = null;
		let paintingSourceBottom = null;
		let paintingSourceLeft = null;
		let paintingSourceRight = null;

		let sourceIndexPainting = null;

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
			if (texturePixelsPainting) alpha = texturePixelsPainting[sourceIndexPainting + 3];

			if (
				textureBufferPainting &&
				sourceRow > paintingSourceTop - 1 &&
				sourceRow < paintingSourceBottom &&
				xOffset > paintingSourceLeft - 1 &&
				xOffset < paintingSourceRight
			) {
				// Painting on column and within size of painting source
				if (alpha > 0) {
					red = texturePixelsPainting[sourceIndexPainting] * (brightnessLevel * this.redTint);
					green = texturePixelsPainting[sourceIndexPainting + 1] * (brightnessLevel * this.greenTint);
					blue = texturePixelsPainting[sourceIndexPainting + 2] * (brightnessLevel * this.blueTint);
				} else {
					red = texturePixels[sourceIndex] * (brightnessLevel * this.redTint);
					green = texturePixels[sourceIndex + 1] * (brightnessLevel * this.greenTint);
					blue = texturePixels[sourceIndex + 2] * (brightnessLevel * this.blueTint);
				}

				sourceIndexPainting += this.bytesPerPixel * textureBufferPainting.width;
			} else {
				red = texturePixels[sourceIndex] * (brightnessLevel * this.redTint);
				green = texturePixels[sourceIndex + 1] * (brightnessLevel * this.greenTint);
				blue = texturePixels[sourceIndex + 2] * (brightnessLevel * this.blueTint);
			}

			while (yError >= textureBuffer.height) {
				yError -= textureBuffer.height;
				this.offscreenCanvasPixels.data[targetIndex] = ~~red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = ~~green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
				targetIndex += this.bytesPerPixel * this.canvasWidth;

				heightToDraw--;
				if (heightToDraw < 1) return;
			}

			sourceIndex += this.bytesPerPixel * textureBuffer.width;
			if (sourceIndex > lastSourceIndex) sourceIndex = lastSourceIndex;
			sourceRow = ~~(sourceIndex / (this.bytesPerPixel * textureBuffer.width));
		}
	}

	drawObjectStrip(x, y, height, brightness, xOffset, textureBuffer, texturePixels, inReticle, dist) {
		if (textureBuffer == undefined) return;
		const bytesPerPixel = 4;

		let sourceIndex = bytesPerPixel * xOffset;
		const lastSourceIndex = sourceIndex + textureBuffer.width * textureBuffer.height * bytesPerPixel;

		let targetIndex = this.canvasWidth * bytesPerPixel * y + bytesPerPixel * x;

		let heightToDraw = height;

		if (y + heightToDraw > this.canvasHeight) heightToDraw = this.canvasHeight - y;

		let yError = 0;

		if (heightToDraw < 0) return;

		while (true) {
			yError += height;

			let red = texturePixels[sourceIndex] * brightness * this.redTint;
			let green = texturePixels[sourceIndex + 1] * brightness * this.greenTint;
			let blue = texturePixels[sourceIndex + 2] * brightness * this.blueTint;
			let alpha = texturePixels[sourceIndex + 3];
			if (inReticle) {
				red += 70;
				green += 70;
				blue += 70;
			}

			while (yError >= textureBuffer.height) {
				if (alpha > 0) {
					this.offscreenCanvasPixels.data[targetIndex] = ~~red;
					this.offscreenCanvasPixels.data[targetIndex + 1] = ~~green;
					this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blue;
					this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
					this.objectTargetIndecesForStrip.push(targetIndex);
					this.objectDistsForStrip.push(dist);
				}
				yError -= textureBuffer.height;
				targetIndex += bytesPerPixel * this.canvasWidth;

				heightToDraw--;
				if (heightToDraw < 1) return;
			}
			sourceIndex += bytesPerPixel * textureBuffer.width;
			if (sourceIndex > lastSourceIndex) sourceIndex = lastSourceIndex;
		}
	}

	drawThinWallStrip(x, y, height, brightness, thinWallRef, xOffset, dist) {
		if (this.fThinWallTextureBufferList[thinWallRef] == undefined) return;
		const bytesPerPixel = 4;

		let sourceIndex = bytesPerPixel * xOffset;
		const lastSourceIndex =
			sourceIndex +
			this.fThinWallTextureBufferList[thinWallRef].width *
				this.fThinWallTextureBufferList[thinWallRef].height *
				bytesPerPixel;

		let targetIndex = this.canvasWidth * bytesPerPixel * y + bytesPerPixel * x;

		let heightToDraw = height;

		if (y + heightToDraw > this.canvasHeight) heightToDraw = this.canvasHeight - y;

		let yError = 0;

		if (heightToDraw < 0) return;

		while (true) {
			yError += height;

			let red = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex] * brightness * this.redTint;
			let green = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex + 1] * brightness * this.greenTint;
			let blue = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex + 2] * brightness * this.blueTint;
			let alpha = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex + 3];

			while (yError >= this.fThinWallTextureBufferList[thinWallRef].height) {
				yError -= this.fThinWallTextureBufferList[thinWallRef].height;
				if (
					!this.objectTargetIndecesForStrip.includes(targetIndex) ||
					this.objectDistsForStrip[this.objectTargetIndecesForStrip.indexOf(targetIndex)] > dist
				) {
					// Blend pixel color values with transparent thin wall color values
					let redBlend;
					let greenBlend;
					let blueBlend;
					if (alpha > 0) {
						redBlend = (alpha / 255) * red + (1 - alpha / 255) * this.offscreenCanvasPixels.data[targetIndex];
						greenBlend =
							(alpha / 255) * green + (1 - alpha / 255) * this.offscreenCanvasPixels.data[targetIndex + 1];
						blueBlend =
							(alpha / 255) * blue + (1 - alpha / 255) * this.offscreenCanvasPixels.data[targetIndex + 2];

						this.offscreenCanvasPixels.data[targetIndex] = ~~redBlend;
						this.offscreenCanvasPixels.data[targetIndex + 1] = ~~greenBlend;
						this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blueBlend;
						this.offscreenCanvasPixels.data[targetIndex + 3] = 255;
					}
				}

				targetIndex += bytesPerPixel * this.canvasWidth;

				heightToDraw--;
				if (heightToDraw < 1) return;
			}
			sourceIndex += bytesPerPixel * this.fThinWallTextureBufferList[thinWallRef].width;
			if (sourceIndex > lastSourceIndex) sourceIndex = lastSourceIndex;
		}
	}

	draw3d() {
		for (let i = 0; i < this.items.length; i++) {
			// Get perpendicular line coords
			const deltaY = this.items[i].y - this.fPlayerY;
			const deltaX = this.items[i].x - this.fPlayerX;
			const slope = deltaY / deltaX;
			const perpSlope = -(1 / slope);
			const angle = Math.atan(perpSlope);
			let x1;
			let y1;
			let x2;
			let y2;
			x1 = this.items[i].x - (this.fItemTextureBufferList[i].width / 2) * Math.cos(angle);
			y1 = this.items[i].y - (this.fItemTextureBufferList[i].width / 2) * Math.sin(angle);
			x2 = this.items[i].x + (this.fItemTextureBufferList[i].width / 2) * Math.cos(angle);
			y2 = this.items[i].y + (this.fItemTextureBufferList[i].width / 2) * Math.sin(angle);

			const intersection = getIntersection(
				this.fPlayerX,
				this.fPlayerY,
				1,
				degToRad(this.fPlayerAngle),
				x1,
				y1,
				x2,
				y2
			);

			if (intersection?.[0]) {
				const dx = Math.abs(this.fPlayerX - intersection[0]);
				const dy = Math.abs(this.fPlayerY - intersection[1]);
				const d = Math.sqrt(dx * dx + dy * dy);

				if (d <= this.minUseDist) this.items[i].inReticle = true;
				else this.items[i].inReticle = false;
			} else this.items[i].inReticle = false;
		}

		for (let i = 0; i < this.rayLengths.length; i++) {
			if (this.rayLengths[i] === 0) return;
			let dist = this.rayLengths[i] / this.fFishTable[i];

			const ratio = this.fPlayerDistanceToProjectionPlane / dist;
			const scale = (this.fPlayerDistanceToProjectionPlane * this.WALL_HEIGHT) / dist;
			const wallBottom = ratio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
			const wallTop = wallBottom - scale;
			const wallHeight = wallBottom - wallTop;

			let textureBufferPainting = null;
			let texturePixelsPainting = null;

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

			let brightnessLevel =
				this.currentLightValues?.[~~this.tileCollisionsY[i] * this.mapWidth + ~~this.tileCollisionsX[i]];
			if (brightnessLevel > this.maxBrightness) brightnessLevel = this.maxBrightness;
			if (!brightnessLevel || brightnessLevel < this.minBrightness) brightnessLevel = this.minBrightness;
			if (this.tileSides?.[i] === 1 || this.tileSides?.[i] === 3) brightnessLevel *= 0.85;

			if (this?.fSkyTextureBuffer) this.drawSky(i, adjustedAngle);

			this.drawFloor(Math.floor(wallBottom), i, adjustedAngle);

			this.drawCeiling(Math.floor(wallTop), i, adjustedAngle);

			this.drawWallSliceRectangleTinted(
				i,
				wallTop,
				wallHeight + 1,
				offset,
				brightnessLevel,
				textureBuffer,
				texturePixels,
				textureBufferPainting,
				texturePixelsPainting
			);

			this.objectTargetIndecesForStrip = [];
			this.objectDistsForStrip = [];
			// Objects
			for (let j = 0; j < this.objectRayLengths[i].length; j++) {
				let textureBuffer;
				let texturePixels;

				let objDist =
					this.objectRayLengths[i][j] > 0 ? this.objectRayLengths[i][j] / this.fFishTable[i] : null;

				if (objDist) {
					let objRatio;
					let objScale;
					let objBottom;
					let objTop;
					let objHeight;
					if (this.isItemRay[i][j]) {
						textureBuffer = this.fItemTextureBufferList[this.objectRefs[i][j]];
						texturePixels = this.fItemTexturePixelsList[this.objectRefs[i][j]];
					} else if (this.isLightsourceRay[i][j]) {
						textureBuffer = this.fLightTextureBufferList[this.objectRefs[i][j]];
						texturePixels = this.fLightTexturePixelsList[this.objectRefs[i][j]];
					} else {
						textureBuffer = this.fObjectTextureBufferList[this.objectRefs[i][j]];
						texturePixels = this.fObjectTexturePixelsList[this.objectRefs[i][j]];
					}

					objRatio = this.fPlayerDistanceToProjectionPlane / objDist;
					objScale = (this.fPlayerDistanceToProjectionPlane * textureBuffer.height) / objDist;
					objBottom = objRatio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
					objTop = objBottom - objScale;
					objHeight = objBottom - objTop;

					if (this.isLightsourceRay[i][j]) {
						switch (this.lightSources[this.objectRefs[i][j]]?.surface) {
							case 'wall':
								objScale =
									(this.fPlayerDistanceToProjectionPlane *
										(this.WALL_HEIGHT / 2 + textureBuffer.height / 2)) /
									objDist;
								break;
							case 'ceiling':
								objScale = (this.fPlayerDistanceToProjectionPlane * this.WALL_HEIGHT) / objDist;
								break;
						}
						objTop = objBottom - objScale;
					}

					if (
						this.isItemRay[i][j] &&
						this.items[this.objectRefs[i][j]].inReticle &&
						objTop <= this.canvasHeight / 2 &&
						objBottom >= this.canvasHeight / 2
					) {
						this.items[this.objectRefs[i][j]].inReticle = true;
					} else if (this.isItemRay[i][j]) this.items[this.objectRefs[i][j]].inReticle = false;

					let objBrightnessLevel =
						this.currentLightValues?.[
							~~this.objectCollisionsY[i][j] * this.mapWidth + ~~this.objectCollisionsX[i][j]
						] || this.minBrightness;
					if (objBrightnessLevel > this.maxBrightness) objBrightnessLevel = this.maxBrightness;

					this.drawObjectStrip(
						i,
						Math.floor(objTop),
						objHeight,
						objBrightnessLevel,
						this.objectOffsets[i][j],
						textureBuffer,
						texturePixels,
						this.isItemRay[i][j] ? this.items[this.objectRefs[i][j]].inReticle : false,
						objDist
					);
				}
			}

			let thinWallDist =
				this.thinWallRayLengths[i] > 0 ? this.thinWallRayLengths[i] / this.fFishTable[i] : null;

			if (thinWallDist) {
				let thinWallBrightnessLevel =
					this.currentLightValues?.[
						~~this.thinWallCollisionsY[i] * this.mapWidth + ~~this.thinWallCollisionsX[i]
					] || this.minBrightness;
				if (thinWallBrightnessLevel > this.maxBrightness) thinWallBrightnessLevel = this.maxBrightness;

				const thinWallRatio = this.fPlayerDistanceToProjectionPlane / thinWallDist;
				const thinWallScale = (this.fPlayerDistanceToProjectionPlane * this.WALL_HEIGHT) / thinWallDist;
				const thinWallBottom = thinWallRatio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
				const thinWallTop = thinWallBottom - thinWallScale;
				let thinWallHeight = thinWallBottom - thinWallTop;

				if (
					i === this.PROJECTIONPLANEWIDTH / 2 &&
					thinWallTop <= this.PROJECTIONPLANEHEIGHT / 2 &&
					thinWallBottom >= this.PROJECTIONPLANEHEIGHT / 2
				) {
					this.reticleOnWall = true;
				} else if (i === this.PROJECTIONPLANEWIDTH / 2) this.reticleOnWall = false;

				this.drawThinWallStrip(
					i,
					Math.floor(thinWallTop),
					thinWallHeight,
					thinWallBrightnessLevel,
					this.thinWallRefs[i],
					this.thinWallOffsets[i],
					thinWallDist
				);
			}
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

		for (let i = 0; i < this.items.length; i++) {
			this.debugCtx.fillStyle = `rgb(0, 255, 0)`;
			this.debugCtx.beginPath();
			this.debugCtx.ellipse(
				this.items[i].x,
				this.items[i].y,
				this.fItemTextureBufferList[i].width / 2,
				this.fItemTextureBufferList[i].width / 2,
				2 * this.pi,
				0,
				2 * this.pi
			);
			this.debugCtx.fill();
		}

		for (let i = 0; i < this.thinWalls.length; i++) {
			const wall = this.thinWalls[i];

			this.debugCtx.strokeStyle = `rgb(255, 0, 255)`;
			this.debugCtx.lineWidth = 10;
			this.debugCtx.beginPath();
			this.debugCtx.moveTo(wall.xStart, wall.yStart);
			this.debugCtx.lineTo(wall.xEnd, wall.yEnd);
			this.debugCtx.stroke();
		}
	}

	getIntersectionOfTile(x, y, row, col, theta, sides = [0, 1, 2, 3], p4 = null) {
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

			const intersection = getIntersection(x, y, 1, theta, tX1, tY1, tX2, tY2, p4);
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

	raycaster() {
		let tileTypeTemp = 0;
		let tileSideDirTemp = 0;

		for (let i = 0; i < this.rayAngles.length; i++) {
			let adjustedAngle;
			adjustedAngle = this.rayAngles[i] + degToRad(this.fPlayerAngle);
			if (adjustedAngle < 0) adjustedAngle += 2 * this.pi;

			let closest = null;
			let record = Infinity;
			let thinWallRecord = Infinity;
			let thinWallClosest = null;

			// Filter through thin walls for each ray --------------------------------------------------------
			this.thinWallRayLengths[i] = 0;
			this.thinWallCollisionsX[i] = 0;
			this.thinWallCollisionsY[i] = 0;
			this.thinWallRefs[i] = 0;
			this.thinWallOffsets[i] = 0;

			for (let j = 0; j < this.thinWalls.length; j++) {
				const intersection = getIntersection(
					this.fPlayerX,
					this.fPlayerY,
					1,
					adjustedAngle,
					this.thinWalls[j].xStart,
					this.thinWalls[j].yStart,
					this.thinWalls[j].xEnd,
					this.thinWalls[j].yEnd
				);

				if (intersection?.[0]) {
					const dx = Math.abs(this.fPlayerX - intersection[0]);
					const dy = Math.abs(this.fPlayerY - intersection[1]);
					const d = Math.sqrt(dx * dx + dy * dy);

					if (d < thinWallRecord) {
						thinWallRecord = d;
						thinWallClosest = intersection;
						this.thinWallRayLengths[i] = d;
						this.thinWallCollisionsX[i] = intersection[0];
						this.thinWallCollisionsY[i] = intersection[1];
						this.thinWallRefs[i] = j;
						this.thinWallOffsets[i] = ~~Math.sqrt(
							(intersection[0] - this.thinWalls[j].xStart) * (intersection[0] - this.thinWalls[j].xStart) +
								(intersection[1] - this.thinWalls[j].yStart) * (intersection[1] - this.thinWalls[j].yStart)
						);
					}
				}
			}

			//-------------------------------------------------------------------------------------------

			this.rayAngleQuadrants[i] = Math.floor(adjustedAngle / (this.pi / 2));

			let sidesToCheck = [0, 1, 2, 3];
			if (this.rayAngleQuadrants[i] === 0) sidesToCheck = [0, 3];
			else if (this.rayAngleQuadrants[i] === 1) sidesToCheck = [0, 1];
			else if (this.rayAngleQuadrants[i] === 2) sidesToCheck = [1, 2];
			else if (this.rayAngleQuadrants[i] === 3) sidesToCheck = [2, 3];

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
						record = tileIntersection.record;
						closest = tileIntersection.closest;
						tileIndex = row * this.mapCols + col;
						tileTypeTemp = tile;
						tileSideDirTemp = tileIntersection.dir;

						if (record < thinWallRecord) this.thinWallRayLengths[i] = 0;
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
			} else this.rayLengths[i] = 0;

			// Draw rays on debug canvas ----------------------------------------------------------------
			if (this.DEBUG) {
				if (record < thinWallRecord) {
					this.debugCtx.strokeStyle =
						i === this.rayAngles.length ? `rgba(0,255,0,0.7)` : `rgba(255,255,255,0.3)`;
					this.debugCtx.beginPath();
					this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
					this.debugCtx.lineTo(closest[0], closest[1]);
					this.debugCtx.lineWidth = 1;
					this.debugCtx.stroke();
				} else {
					if (this.DEBUG) {
						this.debugCtx.strokeStyle = `rgba(255,0,255,0.3)`;
						this.debugCtx.beginPath();
						this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
						this.debugCtx.lineTo(thinWallClosest[0], thinWallClosest[1]);
						this.debugCtx.lineWidth = 1;
						this.debugCtx.stroke();
					}
				}
			}

			// Filter through objects and items for each ray -----------------------------------------------------------
			this.objectRayLengths[i] = [];
			this.objectCollisionsX[i] = [];
			this.objectCollisionsY[i] = [];
			this.objectRefs[i] = [];
			this.objectOffsets[i] = [];
			this.isItemRay[i] = [];
			this.isLightsourceRay[i] = [];

			const rayObjData = [
				{
					rayLength: 0,
					collisionX: 0,
					collisionY: 0,
					ref: 0,
					offset: 0,
					isItemRay: 0,
					isLightsourceRay: 0,
				},
			];

			for (let j = 0; j < this.objects.length + this.items.length + this.lightSources.length; j++) {
				let object;
				let textureBuffer;
				let ref;
				let isItem = false;
				let isLightsource = false;
				if (j < this.objects.length) {
					object = this.objects[j];
					textureBuffer = this.fObjectTextureBufferList[j];
					ref = j;
				} else if (j >= this.objects.length && j < this.objects.length + this.items.length) {
					ref = j - this.objects.length;
					object = this.items[ref];
					textureBuffer = this.fItemTextureBufferList[ref];
					isItem = true;
				} else {
					ref = j - this.objects.length - this.items.length;
					object = this.lightSources[ref];
					textureBuffer = this.fLightTextureBufferList[ref];
					isLightsource = true;
				}
				// Get perpendicular line coords
				const deltaY = object.y - this.fPlayerY;
				const deltaX = object.x - this.fPlayerX;
				const slope = deltaY / deltaX;
				const perpSlope = -(1 / slope);
				const angle = Math.atan(perpSlope);
				const angle2 = Math.atan2(deltaY, deltaX);
				let x1;
				let y1;
				let x2;
				let y2;
				if (angle2 < 0) {
					x1 = object.x - (textureBuffer.width / 2) * Math.cos(angle);
					y1 = object.y - (textureBuffer.width / 2) * Math.sin(angle);
					x2 = object.x + (textureBuffer.width / 2) * Math.cos(angle);
					y2 = object.y + (textureBuffer.width / 2) * Math.sin(angle);
				} else {
					x1 = object.x + (textureBuffer.width / 2) * Math.cos(angle);
					y1 = object.y + (textureBuffer.width / 2) * Math.sin(angle);
					x2 = object.x - (textureBuffer.width / 2) * Math.cos(angle);
					y2 = object.y - (textureBuffer.width / 2) * Math.sin(angle);
				}

				const intersection = getIntersection(this.fPlayerX, this.fPlayerY, 1, adjustedAngle, x1, y1, x2, y2);

				if (intersection?.[0]) {
					const dx = Math.abs(this.fPlayerX - intersection[0]);
					const dy = Math.abs(this.fPlayerY - intersection[1]);
					const d = Math.sqrt(dx * dx + dy * dy);

					if (d < record) {
						rayObjData.push({
							rayLength: ~~d,
							collisionX: intersection[0],
							collisionY: intersection[1],
							ref: ref,
							offset: ~~Math.sqrt(
								(intersection[0] - x1) * (intersection[0] - x1) +
									(intersection[1] - y1) * (intersection[1] - y1)
							),
							isItemRay: isItem ? 1 : 0,
							isLightsourceRay: isLightsource ? 1 : 0,
						});

						if (this.DEBUG && d < thinWallRecord) {
							this.debugCtx.strokeStyle = isItem ? `rgba(0,255,0,0.3)` : `rgba(0,100,255,0.3)`;
							this.debugCtx.beginPath();
							this.debugCtx.moveTo(this.fPlayerX, this.fPlayerY);
							this.debugCtx.lineTo(intersection[0], intersection[1]);
							this.debugCtx.lineWidth = 1;
							this.debugCtx.stroke();
						}
					}
				}
			}

			rayObjData.sort((a, b) => b.rayLength - a.rayLength);

			for (let j = 0; j < rayObjData.length; j++) {
				this.objectRayLengths[i].push(rayObjData[j].rayLength);
				this.objectCollisionsX[i].push(rayObjData[j].collisionX);
				this.objectCollisionsY[i].push(rayObjData[j].collisionY);
				this.objectRefs[i].push(rayObjData[j].ref);
				this.objectOffsets[i].push(rayObjData[j].offset);
				this.isItemRay[i].push(rayObjData[j].isItemRay);
				this.isLightsourceRay[i].push(rayObjData[j].isLightsourceRay);
			}
			// if (this.isLightsourceRay[i]) console.log(this.lightSources[0]);
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

	playerTooCloseToWall(row, col, minDist) {
		const tileMidX = col * this.TILE_SIZE + this.TILE_SIZE / 2;
		const tileMidY = row * this.TILE_SIZE + this.TILE_SIZE / 2;

		const dx = this.fPlayerX - tileMidX;
		const dy = this.fPlayerY - tileMidY;
		const d = Math.sqrt(dx * dx + dy * dy);

		if (d <= minDist) return [dx, dy];
		return;
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

		const minDist = (this.TILE_SIZE * Math.sqrt(2)) / 1.5;
		if (this.fKeyForward || this.fKeyBack || this.fKeyLeft || this.fKeyRight) {
			if (!this.isJumping && Date.now() - this.timeOfLastFootstep > (this.isCrouching ? 1000 : 500)) {
				const footstepNum = ~~(Math.random() * (5 - 1) + 1);
				this.audio.playSound(`footstep${footstepNum}`, this.fPlayerX, this.fPlayerY, false);
				this.timeOfLastFootstep = Date.now();
			}
			for (let i = 0; i < this.thinWalls.length; i++) {
				const intersection = getIntersection(
					this.fPlayerX,
					this.fPlayerY,
					1,
					degToRad(moveDir),
					this.thinWalls[i].xStart,
					this.thinWalls[i].yStart,
					this.thinWalls[i].xEnd,
					this.thinWalls[i].yEnd
				);

				if (intersection?.[0]) {
					const dx = this.fPlayerX - intersection[0];
					const dy = this.fPlayerY - intersection[1];
					const d = Math.sqrt(dx * dx + dy * dy);

					if (d <= minDist && !(this.thinWalls[i].vaultable && this.isJumping)) return;
				}
			}

			for (let row = 0; row < this.mapRows; row++) {
				loop1: for (let col = 0; col < this.mapCols; col++) {
					const tileIndex = row * this.mapCols + col;
					const tile = this.map[tileIndex];
					if (tile > 5 || (row === playerTileRow && col === playerTileCol)) continue;

					if (Math.abs(col - playerTileCol) <= 1 && Math.abs(row - playerTileRow) <= 1) {
						const closeDistToTile = this.playerTooCloseToWall(row, col, minDist);

						if (closeDistToTile) {
							const angleToWallCenter = radToDeg(
								Math.atan2(Math.abs(closeDistToTile[1]), Math.abs(closeDistToTile[0]))
							);

							if (angleToWallCenter >= 0 && angleToWallCenter < 45) {
								// On left or right of wall
								const playerWallTileDiffCol = playerTileCol - col;
								if (playerWallTileDiffCol > 0 && (moveDir > 270 || moveDir < 90)) break loop1;
								else if (playerWallTileDiffCol < 0 && moveDir < 270 && moveDir > 90) break loop1;

								newPlayerY = this.fPlayerY + this.getYspeed();
							} else if (angleToWallCenter >= 45 && angleToWallCenter < 90) {
								// On top or bottom of wall
								const playerWallTileDiffRow = playerTileRow - row;
								if (playerWallTileDiffRow > 0 && moveDir > 0 && moveDir < 180) break loop1;
								else if (playerWallTileDiffRow < 0 && moveDir > 180 && moveDir < 360) break loop1;

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

	onSkyTextureLoaded(imgName) {
		const img = this.textures[imgName];
		this.fSkyTextureBuffer = new OffscreenCanvas(img.width, img.height);
		this.fSkyTextureBuffer.getContext('2d', { alpha: false }).drawImage(img, 0, 0);

		const imgData = this.fSkyTextureBuffer
			.getContext('2d', { alpha: false })
			.getImageData(0, 0, this.fSkyTextureBuffer.width, this.fSkyTextureBuffer.height);
		this.fSkyTexturePixels = imgData.data;
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
			this.fPaintingTextureBufferList[i].getContext('2d', { alpha: true }).drawImage(img, 0, 0);

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
			this.fObjectTextureBufferList[i].getContext('2d', { alpha: true }).drawImage(img, 0, 0);

			const imgData = this.fObjectTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fObjectTextureBufferList[i].width, this.fObjectTextureBufferList[i].height);
			this.fObjectTexturePixelsList[i] = imgData.data;
		}
	}

	onThinWallTexturesLoaded(imgNames) {
		this.fThinWallTextureBufferList = new Array(imgNames.length);
		this.fThinWallTexturePixelsList = new Array(imgNames.length);

		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fThinWallTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fThinWallTextureBufferList[i].getContext('2d', { alpha: true }).drawImage(img, 0, 0);

			const imgData = this.fThinWallTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(
					0,
					0,
					this.fThinWallTextureBufferList[i].width,
					this.fThinWallTextureBufferList[i].height
				);
			this.fThinWallTexturePixelsList[i] = imgData.data;
		}
	}

	onItemTexturesLoaded(imgNames) {
		this.fItemTextureBufferList = new Array(imgNames.length);
		this.fItemTexturePixelsList = new Array(imgNames.length);

		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fItemTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fItemTextureBufferList[i].getContext('2d', { alpha: true }).drawImage(img, 0, 0);

			const imgData = this.fItemTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fItemTextureBufferList[i].width, this.fItemTextureBufferList[i].height);
			this.fItemTexturePixelsList[i] = imgData.data;
		}
	}

	onLightTexturesLoaded(imgNames) {
		this.fLightTextureBufferList = new Array(imgNames.length);
		this.fLightTexturePixelsList = new Array(imgNames.length);

		for (let i = 0; i < imgNames.length; i++) {
			const img = this.textures[imgNames[i]];
			this.fLightTextureBufferList[i] = new OffscreenCanvas(img.width, img.height);
			this.fLightTextureBufferList[i].getContext('2d', { alpha: true }).drawImage(img, 0, 0);

			const imgData = this.fLightTextureBufferList[i]
				.getContext('2d', { alpha: false })
				.getImageData(0, 0, this.fLightTextureBufferList[i].width, this.fLightTextureBufferList[i].height);
			this.fLightTexturePixelsList[i] = imgData.data;
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
			if (this.levelTransitionFadeAmt < 1) this.levelTransitionFadeAmt += this.fGameSpeed / 80;
			else this.levelTransition = false;
			this.ctx.fillStyle = `rgba(0, 0, 0, ${this.levelTransitionFadeAmt})`;
			this.ctx.fillRect(0, 0, this.PROJECTIONPLANEWIDTH, this.PROJECTIONPLANEHEIGHT);
		} else if (this.levelTransitionFadeAmt > 0) {
			this.levelTransitionFadeAmt -= this.fGameSpeed / 80;
			this.ctx.fillStyle = `rgba(0, 0, 0, ${this.levelTransitionFadeAmt})`;
			this.ctx.fillRect(0, 0, this.PROJECTIONPLANEWIDTH, this.PROJECTIONPLANEHEIGHT);
		}
	}

	operateThinWall(i) {
		const thinWall = this.thinWalls[i];
		const slideSpeed = this.fGameSpeed / 2.5;
		const stopGap = 8;

		if (thinWall.xEnd - thinWall.xStart !== 0) {
			const length = Math.abs(thinWall.xEnd - thinWall.xStart);
			const moveDir = thinWall.xEnd > thinWall.xStart ? 1 : -1;

			if (!thinWall.isOpen) {
				this.thinWalls[i].xStart -= slideSpeed * moveDir;
				this.thinWalls[i].xEnd -= slideSpeed * moveDir;
				if (Math.abs(this.thinWalls[i].xStart - this.thinWalls[i].xStartOriginal) >= length - stopGap) {
					this.activeThinWallId = null;
					this.thinWalls[i].isOpen = true;
					this.thinWalls[i].xStart = this.thinWalls[i].xStartOriginal - (length - stopGap) * moveDir;
				}
			} else {
				this.thinWalls[i].xStart += slideSpeed * moveDir;
				this.thinWalls[i].xEnd += slideSpeed * moveDir;
				if (Math.abs(this.thinWalls[i].xEnd - this.thinWalls[i].xStartOriginal) >= length) {
					this.activeThinWallId = null;
					this.thinWalls[i].isOpen = false;
					this.thinWalls[i].xStart = this.thinWalls[i].xStartOriginal;
				}
			}
		} else {
			const length = Math.abs(thinWall.yEnd - thinWall.yStart);
			const moveDir = thinWall.yEnd > thinWall.yStart ? 1 : -1;

			if (!thinWall.isOpen) {
				this.thinWalls[i].yStart -= slideSpeed * moveDir;
				this.thinWalls[i].yEnd -= slideSpeed * moveDir;
				if (Math.abs(this.thinWalls[i].yStart - this.thinWalls[i].yStartOriginal) >= length - stopGap) {
					this.activeThinWallId = null;
					this.thinWalls[i].isOpen = true;
					this.thinWalls[i].yStart = this.thinWalls[i].yStartOriginal - (length - stopGap) * moveDir;
				}
			} else {
				this.thinWalls[i].yStart += slideSpeed * moveDir;
				this.thinWalls[i].yEnd += slideSpeed * moveDir;
				if (Math.abs(this.thinWalls[i].yEnd - this.thinWalls[i].yStartOriginal) >= length) {
					this.activeThinWallId = null;
					this.thinWalls[i].isOpen = false;
					this.thinWalls[i].yStart = this.thinWalls[i].yStartOriginal;
				}
			}
		}
	}

	update() {
		if (this.DEBUG && this.debugCtx)
			this.debugCtx.clearRect(0, 0, this.debugCanvasWidth, this.debugCanvasHeight);

		if (this.isJumping) this.jump();
		if (this.isCrouching) this.crouch();
		if (this.isStanding) this.stand();
		if (this.activeThinWallId !== null) this.operateThinWall(this.activeThinWallId);

		this.move();
		this.audio.updateSoundPositions(this.fPlayerAngle, this.fPlayerX, this.fPlayerY);

		if (this.DEBUG) this.draw2d();
		this.raycaster();
		this.draw3d();

		if (this.DEBUG && this.debugCtx) {
			this.debugCtx.fillStyle = `rgba(255,255,255,1)`;
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
		const promises = this.texturePaths.map(path => {
			return new Promise((resolve, reject) => {
				const name = path.split('/').pop()?.split('.')[0];
				const image = new Image();

				image.src = path;
				image.onload = () => resolve([name, image]);
				image.onerror = () => reject(`Image failed to load: ${path}`);
			});
		});

		const imgArraytemp = await Promise.all(promises);
		this.textures = Object.fromEntries(imgArraytemp);
	}

	lockPointer() {
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
	}

	resetTextures() {
		this.fCeilingTextureBuffer = undefined;
		this.fCeilingTexturePixels = undefined;
		this.fFloorTextureBufferList = undefined;
		this.fFloorTexturePixelsList = undefined;
		this.fWallTextureBufferList = undefined;
		this.fWallTexturePixelsList = undefined;
		this.fSkyTextureBuffer = undefined;
		this.fSkyTexturePixels = undefined;
		this.fPaintingTextureBufferList = undefined;
		this.fPaintingTexturePixelsList = undefined;
		this.fThinWallTextureBufferList = undefined;
		this.fThinWallTexturePixelsList = undefined;
		this.fObjectTextureBufferList = undefined;
		this.fObjectTexturePixelsList = undefined;
		this.fItemTextureBufferList = [];
		this.fItemTexturePixelsList = [];
		this.fLightTextureBufferList = undefined;
		this.fLightTexturePixelsList = undefined;
	}

	setNewMapData(i = this.mapNum) {
		this.resetTextures();
		this.audio.init(i);
		this.currentLightValues = this.mapLightValues[i];
		this.currentLightRefs = this.mapLightRefs[i];
		this.noCeilingIndeces = maps[i].noCeilingIndeces;

		this.onWallTextureLoaded(maps[i].wallTextures);
		this.onPaintingTexturesLoaded(maps[i].paintings);
		this.fPaintingDetails = maps[i].paintingDetails;

		if (maps[i].ceilingTexture) this.onCeilingTextureLoaded(maps[i].ceilingTexture);
		if (maps[i].skyTexture) this.onSkyTextureLoaded(maps[i].skyTexture);
		this.onFloorTextureLoaded(maps[i].floorTextures);

		if (maps[i]?.lightSources?.length) {
			this.onLightTexturesLoaded(maps[i].lightSources.map(light => light.texture));
			this.lightSources = maps[i].lightSources;
			for (let i = 0; i < this.lightSources.length; i++) {
				const textureWidth = this.textures[this.lightSources[i].texture].width;
				switch (this.lightSources[i].side) {
					case 0:
						this.lightSources[i].x = this.lightSources[i].col * this.TILE_SIZE + this.TILE_SIZE / 2;
						this.lightSources[i].y = this.lightSources[i].row * this.TILE_SIZE - textureWidth / 2;
						break;
					case 1:
						this.lightSources[i].x =
							this.lightSources[i].col * this.TILE_SIZE + this.TILE_SIZE + textureWidth / 2;
						this.lightSources[i].y = this.lightSources[i].row * this.TILE_SIZE + this.TILE_SIZE / 2;
						break;
					case 2:
						this.lightSources[i].x = this.lightSources[i].col * this.TILE_SIZE + this.TILE_SIZE / 2;
						this.lightSources[i].y =
							this.lightSources[i].row * this.TILE_SIZE + this.TILE_SIZE + textureWidth / 2;
						break;
					case 3:
						this.lightSources[i].x = this.lightSources[i].col * this.TILE_SIZE - textureWidth / 2;
						this.lightSources[i].y = this.lightSources[i].row * this.TILE_SIZE + this.TILE_SIZE / 2;
						break;
					default:
						this.lightSources[i].x = this.lightSources[i].col * this.TILE_SIZE + this.TILE_SIZE / 2;
						this.lightSources[i].y = this.lightSources[i].row * this.TILE_SIZE + this.TILE_SIZE / 2;
				}
			}
		} else this.lightSources = [];

		if (maps[i]?.items?.length) {
			this.onItemTexturesLoaded(maps[i].items.map(item => item.name));
			this.items = maps[i].items;
		} else this.items = [];

		if (maps[i]?.objects?.length) {
			this.onObjectTexturesLoaded(maps[i].objects.map(obj => obj.name));
			this.objects = maps[i].objects;
		} else this.objects = [];

		if (maps[i]?.thinWalls?.length) {
			this.onThinWallTexturesLoaded(maps[i].thinWalls.map(wall => wall.texture));
			this.thinWalls = maps[i].thinWalls.map(wall => {
				let xStartTemp = wall.colStart * this.TILE_SIZE;
				let yStartTemp = wall.rowStart * this.TILE_SIZE;
				let xEndTemp = wall.colEnd * this.TILE_SIZE;
				let yEndTemp = wall.rowEnd * this.TILE_SIZE;

				if (yStartTemp < yEndTemp) {
					xStartTemp += this.TILE_SIZE / 2;
					xEndTemp += this.TILE_SIZE / 2;
				} else if (yEndTemp < yStartTemp) {
					xStartTemp += this.TILE_SIZE / 2;
					xEndTemp += this.TILE_SIZE / 2;
				} else if (xStartTemp < xEndTemp) {
					yStartTemp += this.TILE_SIZE / 2;
					yEndTemp += this.TILE_SIZE / 2;
				} else if (xEndTemp < xStartTemp) {
					yStartTemp += this.TILE_SIZE / 2;
					yEndTemp += this.TILE_SIZE / 2;
				}

				return {
					texture: wall.texture,
					xStartOriginal: xStartTemp,
					yStartOriginal: yStartTemp,
					xStart: xStartTemp,
					yStart: yStartTemp,
					xEnd: xEndTemp,
					yEnd: yEndTemp,
					isOpen: wall.isOpen,
					sounds: wall.sounds,
					function: wall.function,
					transparent: wall.transparent,
					vaultable: wall.vaultable,
				};
			});
		} else this.thinWalls = [];

		this.map = new Uint8Array(maps[i].map.flat());
		this.mapNum = i;
		this.doorMap = maps[i].doorMap;
		this.mapCols = maps[i].map[0].length;
		this.mapRows = maps[i].map.length;
		this.mapWidth = this.TILE_SIZE * this.mapCols;
		this.mapHeight = this.TILE_SIZE * this.mapRows;
		this.fPlayerX = this.fPlayerX;
		this.fPlayerY = this.fPlayerY;

		if (this.DEBUG && this.debugCanvas) {
			this.debugCanvas.width = this.mapWidth;
			this.debugCanvas.height = this.mapHeight;
			this.debugCanvasWidth = this.debugCanvas.width;
			this.debugCanvasHeight = this.debugCanvas.height;
			this.debugCtx = this.debugCanvas.getContext('2d', { alpha: false });

			this.debugCanvas.style.aspectRatio = this.debugCanvasWidth / this.debugCanvasHeight;
		}

		for (let j = 0; j < this.objects.length; j++) {
			const obj = this.objects[j];
			if (obj?.sounds?.length) {
				obj.sounds.forEach(sound => {
					if (this.audio.sounds[sound + j]?.loop()) {
						this.audio.playSound(sound, obj.x, obj.y, true, j);
					}
				});
			}
		}

		for (let j = 0; j < this.lightSources.length; j++) {
			const light = this.lightSources[j];
			if (light?.sounds?.length) {
				light.sounds.forEach(sound => {
					if (this.audio.sounds[sound + j]?.loop()) {
						this.audio.playSound(sound, light.x, light.y, true, j);
					}
				});
			}
		}
	}

	calculateLightValues() {
		return new Promise((resolve, reject) => {
			const total = maps.reduce(
				(acc, value) => acc + value.lightSources.length * value.map[0].length * this.TILE_SIZE,
				0
			);
			let progress = 0;

			const lightingVersionTransaction = this.db.transaction('lightingVersion');
			const lightingVersionObjectStore = lightingVersionTransaction.objectStore('lightingVersion');
			const lightingVersionGetRequest = lightingVersionObjectStore.get(0);

			lightingVersionGetRequest.onsuccess = () => {
				let mapsCompleted = 0;

				if (lightingVersionGetRequest?.result === this.lightingVersionNum) {
					for (let i = 0; i < maps.length; i++) {
						const transaction = this.db.transaction('lighting');
						const objectStore = transaction.objectStore('lighting');
						const getRequest = objectStore.get(i);

						getRequest.onsuccess = () => {
							this.mapLightValues[i] = getRequest.result?.mapLightValues || null;
							this.mapLightRefs[i] = getRequest.result?.mapLightRefs || null;
							this.mapLightSides[i] = getRequest.result?.mapLightSides || null;
							console.log(`Lighting for map ${i} has been retrieved`);
							mapsCompleted++;
							if (mapsCompleted === maps.length) resolve();
						};
						getRequest.onerror = () => {
							console.log(`Unable to retrieve lighting for map ${i}`);
							reject();
						};
					}
				} else {
					(function mapLoop(i = 0) {
						if (i < maps.length) {
							if (!maps[i].lightSources.length) {
								this.mapLightValues[i] = null;
								this.mapLightRefs[i] = null;
								this.mapLightSides[i] = null;
								console.log(`Lighting for map ${i} has been retrieved`);
								mapsCompleted++;
								if (mapsCompleted === maps.length) resolve();
							} else {
								document.querySelector('.loadingContainer').style.display = 'flex';
								console.log(`Processing lighting for map ${i}`);
								const curLevel = maps[i];
								const curMap = curLevel.map;
								const mapCols = curMap[0].length;
								const mapRows = curMap.length;
								const mapWidth = mapCols * this.TILE_SIZE;
								const mapHeight = mapRows * this.TILE_SIZE;

								this.mapLightValues[i] = new Float32Array(mapWidth * mapHeight).fill(this.minBrightness);
								this.mapLightRefs[i] = new Uint8Array(mapWidth * mapHeight);
								this.mapLightSides[i] = new Int8Array(mapWidth * mapHeight).fill(-1);

								(function lightSourceLoop(j = 0) {
									if (j < curLevel.lightSources.length) {
										const light = curLevel.lightSources[j];
										const textureWidth = this.textures[light.texture].width;
										const sourceCol = light.col;
										const sourceRow = light.row;
										let lightX;
										let lightY;

										switch (light.side) {
											case 0:
												lightX = sourceCol * this.TILE_SIZE + this.TILE_SIZE / 2;
												lightY = sourceRow * this.TILE_SIZE - textureWidth / 2;
												break;
											case 1:
												lightX = sourceCol * this.TILE_SIZE + this.TILE_SIZE + textureWidth / 2;
												lightY = sourceRow * this.TILE_SIZE + this.TILE_SIZE / 2;
												break;
											case 2:
												lightX = sourceCol * this.TILE_SIZE + this.TILE_SIZE / 2;
												lightY = sourceRow * this.TILE_SIZE + this.TILE_SIZE + textureWidth / 2;
												break;
											case 3:
												lightX = sourceCol * this.TILE_SIZE - textureWidth / 2;
												lightY = sourceRow * this.TILE_SIZE + this.TILE_SIZE / 2;
												break;
											default:
												lightX = sourceCol * this.TILE_SIZE + this.TILE_SIZE / 2;
												lightY = sourceRow * this.TILE_SIZE + this.TILE_SIZE / 2;
										}

										(function xLoop(x = 0) {
											if (x < mapWidth) {
												setTimeout(() => {
													document.querySelector('.loadingFill').style.width = `${~~(
														(progress / total) *
														100
													)}%`;
													document.querySelector('.loadingValue').innerText = `${~~(
														(progress / total) *
														100
													)}%`;

													if (x >= this.TILE_SIZE && x <= mapWidth - this.TILE_SIZE) {
														loop1: for (let y = 0; y < mapHeight; y++) {
															if (y < this.TILE_SIZE || y > mapHeight - this.TILE_SIZE) continue loop1;
															for (let row = 0; row < mapRows; row++) {
																loop2: for (let col = 0; col < mapCols; col++) {
																	const tile = curMap[row][col];
																	if (tile > 5) continue loop2;

																	const x1 = col * this.TILE_SIZE;
																	const y1 = row * this.TILE_SIZE;

																	const x2 = x1 + this.TILE_SIZE;
																	const y2 = y1;

																	const x3 = x2;
																	const y3 = y1 + this.TILE_SIZE;

																	const x4 = x1;
																	const y4 = y3;

																	if (x > x1 && x < x2 && y > y1 && y < y3) continue loop1;
																	if (
																		Math.abs(x1 + this.TILE_SIZE / 2 - x) > Math.abs(lightX - x) &&
																		Math.abs(y1 + this.TILE_SIZE / 2 - y) > Math.abs(lightY - y)
																	) {
																		continue loop2;
																	}

																	let tX1 = 0;
																	let tY1 = 0;
																	let tX2 = 0;
																	let tY2 = 0;

																	let sidesIntersected = 0;
																	let sharesCornerWithTile = false;
																	for (let i = 0; i < 4; i++) {
																		switch (i) {
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

																		const denom = (tX1 - tX2) * (y - lightY) - (tY1 - tY2) * (x - lightX);

																		if (denom !== 0) {
																			const t = ((tX1 - x) * (y - lightY) - (tY1 - y) * (x - lightX)) / denom;
																			const u = ((tX1 - x) * (tY1 - tY2) - (tY1 - y) * (tX1 - tX2)) / denom;

																			if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
																				if (
																					!sharesCornerWithTile &&
																					((x === tX1 && y === tY1) || (x === tX2 && y === tY2))
																				) {
																					sharesCornerWithTile = true;
																					sidesIntersected++;
																				} else if (!((x === tX1 && y === tY1) || (x === tX2 && y === tY2)))
																					sidesIntersected++;
																			}
																			if (sidesIntersected > 1) continue loop1;
																		}
																	}
																}
															}

															loop3: for (let k = 0; k < curLevel?.thinWalls?.length; k++) {
																if (curLevel.thinWalls[k].transparent) continue loop3;
																let xStart = curLevel.thinWalls[k].colStart * this.TILE_SIZE;
																let yStart = curLevel.thinWalls[k].rowStart * this.TILE_SIZE;
																let xEnd = curLevel.thinWalls[k].colEnd * this.TILE_SIZE;
																let yEnd = curLevel.thinWalls[k].rowEnd * this.TILE_SIZE;

																if (yStart < yEnd) {
																	xStart += this.TILE_SIZE / 2;
																	xEnd += this.TILE_SIZE / 2;
																} else if (yEnd < yStart) {
																	xStart += this.TILE_SIZE / 2;
																	xEnd += this.TILE_SIZE / 2;
																} else if (xStart < xEnd) {
																	yStart += this.TILE_SIZE / 2;
																	yEnd += this.TILE_SIZE / 2;
																} else if (xEnd < xStart) {
																	yStart += this.TILE_SIZE / 2;
																	yEnd += this.TILE_SIZE / 2;
																}
																if (
																	(y === yStart &&
																		x >= Math.min(xStart, xEnd) &&
																		x <= Math.max(xStart, xEnd)) ||
																	(x === xStart && y >= Math.min(yStart, yEnd) && y <= Math.max(yStart, yEnd))
																) {
																	if (xStart === xEnd) {
																		if (x - lightX > 0) {
																			this.mapLightSides[i][y * mapWidth + x] = parseInt(
																				'' + this.mapLightSides[i][y * mapWidth + x] + 1
																			);
																		} else
																			this.mapLightSides[i][y * mapWidth + x] = parseInt(
																				'' + this.mapLightSides[i][y * mapWidth + x] + 3
																			);
																	} else {
																		if (y - lightY > 0) {
																			this.mapLightSides[i][y * mapWidth + x] = parseInt(
																				'' + this.mapLightSides[i][y * mapWidth + x] + 2
																			);
																		} else
																			this.mapLightSides[i][y * mapWidth + x] = parseInt(
																				'' + this.mapLightSides[i][y * mapWidth + x] + 0
																			);
																	}

																	continue loop3;
																}

																const denom = (xStart - xEnd) * (y - lightY) - (yStart - yEnd) * (x - lightX);

																if (denom !== 0) {
																	const t =
																		((xStart - x) * (y - lightY) - (yStart - y) * (x - lightX)) / denom;
																	const u =
																		((xStart - x) * (yStart - yEnd) - (yStart - y) * (xStart - xEnd)) / denom;

																	if (t >= 0 && t <= 1 && u >= 0 && u <= 1) continue loop1;
																}
															}

															const d =
																Math.sqrt((x - lightX) * (x - lightX) + (y - lightY) * (y - lightY)) || 0.001;
															let s = d / light.strength / 1500;
															if (s > 1) s = 1;
															const maxIntensity = 1;
															const falloffRate = 40;
															this.mapLightValues[i][y * mapWidth + x] +=
																maxIntensity * (((1 - s * s) * (1 - s * s)) / (1 + falloffRate * (s * s)));
															this.mapLightRefs[i][y * mapWidth + x] = j;
														}
													}

													if (j === curLevel.lightSources.length - 1 && x === mapWidth - 1) {
														const transaction = this.db.transaction('lighting', 'readwrite');
														const objectStore = transaction.objectStore('lighting');
														const request = objectStore.put(
															{
																mapLightValues: this.mapLightValues[i],
																mapLightRefs: this.mapLightRefs[i],
																mapLightSides: this.mapLightSides[i],
															},
															i
														);

														request.onsuccess = () => {
															console.log(`Lighting calculations complete for map ${i} - added to database`);
															mapsCompleted++;

															if (mapsCompleted === maps.length) {
																const lightingVersionTransaction = this.db.transaction(
																	'lightingVersion',
																	'readwrite'
																);
																const lightingVersionObjectStore =
																	lightingVersionTransaction.objectStore('lightingVersion');

																const lightingVersionRequest = lightingVersionObjectStore.put(
																	this.lightingVersionNum,
																	0
																);

																lightingVersionRequest.onsuccess = () => {
																	console.log(`Lighting updated to version ${this.lightingVersionNum}`);
																};
																lightingVersionRequest.onerror = () => {
																	console.log(
																		`Unable to update lighting to version ${this.lightingVersionNum}`
																	);
																	reject();
																};
																resolve();
															}
														};
														request.onerror = () => {
															console.log(`Unable to add lighting calculations to database for map ${i}`);
															reject();
														};
													}
													progress++;
													xLoop.bind(this)(x + 1);
												}, 1);
											}
										}).bind(this)();
										lightSourceLoop.bind(this)(j + 1);
									}
								}).bind(this)();
							}
							mapLoop.bind(this)(i + 1);
						}
					}).bind(this)();
				}
			};
		});
	}

	async init() {
		await this.preloadTextures();
		await this.calculateLightValues();
		this.setNewMapData();
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
			this.lockPointer();
		});

		document.addEventListener('contextmenu', e => e.preventDefault());

		window.addEventListener('beforeunload', e => {
			if (this.preventPageReloadDialog) return;
			e.preventDefault();
			return (e.returnValue = 'Exit Tab?');
		});
	}
}

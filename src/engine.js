import { convertDeg0To360, degToRad, getIntersection, radToDeg } from '../utils/calc.js';
import { maps, texturePaths } from './maps.js';

export default class Engine {
	constructor() {
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

		this.fThinWallTextureBufferList;
		this.fThinWallTexturePixelsList;

		this.fItemTextureBufferList;
		this.fItemTexturePixelList;

		this.items = [];
		this.objects = [];
		this.objectRefs = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectOffsets = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectRayLengths = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectCollisionsX = new Array(this.PROJECTIONPLANEWIDTH);
		this.objectCollisionsY = new Array(this.PROJECTIONPLANEWIDTH);
		this.isItemRay = new Array(this.PROJECTIONPLANEWIDTH);

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

		this.inventorySlotCols = 6;
		this.inventorySlotRows = 8;
		this.inventoryOpen = false;
		this.inventory = [
			{
				name: 'apple',
				slotIdStartCol: 0,
				slotIdStartRow: 0,
				slotCols: 1,
				slotRows: 1,
			},
			{
				name: 'redbull',
				slotIdStartCol: 3,
				slotIdStartRow: 0,
				slotCols: 1,
				slotRows: 2,
			},
		];
		/*
			{
				itemId: number
				name: string
				slotIdStartX: number
				slotIdStartY: number
				slotsW: number,
				slotsH: number,
			}
		*/

		this.DEBUG = false;
		this.preventPageReloadDialog = false;
		this.consoleValues = [];
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

	drawCeiling(wallTop, castColumn, rayAng) {
		let targetIndex = wallTop * (this.canvasWidth * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		for (let row = wallTop; row >= 0; row--) {
			const ratio = (this.WALL_HEIGHT - this.fPlayerHeight) / (this.fProjectionPlaneYCenter - row);

			const diagDist = ~~(this.fPlayerDistanceToProjectionPlane * ratio * this.fFishTable[castColumn]);

			let brightnessLevel = 100 / diagDist;
			if (brightnessLevel > 1.3) brightnessLevel = 1.3;

			let xEnd = diagDist * Math.cos(rayAng);
			let yEnd = diagDist * Math.sin(rayAng);

			xEnd = ~~(xEnd + this.fPlayerX);
			yEnd = ~~(yEnd + this.fPlayerY);

			const cellX = ~~(xEnd / this.TILE_SIZE);
			const cellY = ~~(yEnd / this.TILE_SIZE);

			if (cellX < this.mapWidth && cellY < this.mapHeight && cellX >= 0 && cellY >= 0) {
				const tileRow = xEnd & (this.TILE_SIZE - 1);
				const tileCol = yEnd & (this.TILE_SIZE - 1);

				const sourceIndex =
					tileRow * this.fCeilingTextureBuffer.width * this.bytesPerPixel + this.bytesPerPixel * tileCol;

				const red = this.fCeilingTexturePixels[sourceIndex] * (brightnessLevel + this.redTint);
				const green = this.fCeilingTexturePixels[sourceIndex + 1] * (brightnessLevel + this.greenTint);
				const blue = this.fCeilingTexturePixels[sourceIndex + 2] * (brightnessLevel + this.blueTint);

				this.offscreenCanvasPixels.data[targetIndex] = ~~red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = ~~green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = 255;

				targetIndex -= this.bytesPerPixel * this.canvasWidth;
			}
		}
	}

	drawFloor(wallBottom, castColumn, rayAng) {
		let targetIndex = wallBottom * (this.canvasWidth * this.bytesPerPixel) + this.bytesPerPixel * castColumn;

		let count = 0;
		for (let row = wallBottom; row < this.PROJECTIONPLANEHEIGHT; row++) {
			const straightDistance =
				(this.fPlayerHeight / (row - this.fProjectionPlaneYCenter)) * this.fPlayerDistanceToProjectionPlane;

			const actualDistance = straightDistance * this.fFishTable[castColumn];

			const brightnessLevel = 120 / actualDistance;

			let xEnd = actualDistance * Math.cos(rayAng);
			let yEnd = actualDistance * Math.sin(rayAng);

			xEnd = ~~(xEnd + this.fPlayerX);
			yEnd = ~~(yEnd + this.fPlayerY);

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

				const red = this.fFloorTexturePixelsList[fIndex][sourceIndex] * (brightnessLevel + this.redTint);
				const green =
					this.fFloorTexturePixelsList[fIndex][sourceIndex + 1] * (brightnessLevel + this.greenTint);
				const blue =
					this.fFloorTexturePixelsList[fIndex][sourceIndex + 2] * (brightnessLevel + this.blueTint);

				this.offscreenCanvasPixels.data[targetIndex] = ~~red;
				this.offscreenCanvasPixels.data[targetIndex + 1] = ~~green;
				this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blue;
				this.offscreenCanvasPixels.data[targetIndex + 3] = 255;

				targetIndex += this.bytesPerPixel * this.canvasWidth;
			}
			count++;
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

			if (
				textureBufferPainting &&
				sourceRow > paintingSourceTop - 1 &&
				sourceRow < paintingSourceBottom &&
				xOffset > paintingSourceLeft - 1 &&
				xOffset < paintingSourceRight
			) {
				// Painting on column and within size of painting source
				red = texturePixelsPainting[sourceIndexPainting] * (brightnessLevel + this.redTint);
				green = texturePixelsPainting[sourceIndexPainting + 1] * (brightnessLevel + this.greenTint);
				blue = texturePixelsPainting[sourceIndexPainting + 2] * (brightnessLevel + this.blueTint);

				sourceIndexPainting += this.bytesPerPixel * textureBufferPainting.width;
			} else {
				red = texturePixels[sourceIndex] * (brightnessLevel + this.redTint);
				green = texturePixels[sourceIndex + 1] * (brightnessLevel + this.greenTint);
				blue = texturePixels[sourceIndex + 2] * (brightnessLevel + this.blueTint);
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

	drawObjectStrip(x, y, height, brightness, xOffset, textureBuffer, texturePixels, inReticle) {
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

			let red = texturePixels[sourceIndex] * brightness;
			let green = texturePixels[sourceIndex + 1] * brightness;
			let blue = texturePixels[sourceIndex + 2] * brightness;
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

	drawThinWallStrip(x, y, height, brightness, thinWallRef, xOffset, cuttoffHeight) {
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

			const red = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex] * brightness;
			const green = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex + 1] * brightness;
			const blue = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex + 2] * brightness;
			const alpha = this.fThinWallTexturePixelsList[thinWallRef][sourceIndex + 3];

			while (yError >= this.fThinWallTextureBufferList[thinWallRef].height) {
				// Blend pixel color values with transparent thin wall color values
				let redBlend;
				let greenBlend;
				let blueBlend;
				if (alpha < 255) {
					redBlend = (alpha / 255) * red + (1 - alpha / 255) * this.offscreenCanvasPixels.data[targetIndex];
					greenBlend =
						(alpha / 255) * green + (1 - alpha / 255) * this.offscreenCanvasPixels.data[targetIndex + 1];
					blueBlend =
						(alpha / 255) * blue + (1 - alpha / 255) * this.offscreenCanvasPixels.data[targetIndex + 2];
				}

				yError -= this.fThinWallTextureBufferList[thinWallRef].height;
				this.offscreenCanvasPixels.data[targetIndex] = ~~redBlend;
				this.offscreenCanvasPixels.data[targetIndex + 1] = ~~greenBlend;
				this.offscreenCanvasPixels.data[targetIndex + 2] = ~~blueBlend;
				this.offscreenCanvasPixels.data[targetIndex + 3] = 255;

				targetIndex += bytesPerPixel * this.canvasWidth;

				heightToDraw--;
				if (heightToDraw < 1) return;
				if (heightToDraw < cuttoffHeight) return;
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

				if (d <= 120) this.items[i].inReticle = true;
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

			let brightnessLevel = 110 / ~~dist;
			if (brightnessLevel > 1.3) brightnessLevel = 1.3;
			if (this.tileSides?.[i] === 1 || this.tileSides?.[i] === 3) brightnessLevel = brightnessLevel * 0.8;

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

			let highestObjectTop = this.canvasHeight;
			let highestObjectTopDist = Infinity;

			// Objects
			for (let j = 0; j < this.objectRayLengths[i].length; j++) {
				let textureBuffer;
				let texturePixels;
				if (this.isItemRay[i][j]) {
					textureBuffer = this.fItemTextureBufferList[this.objectRefs[i][j]];
					texturePixels = this.fItemTexturePixelsList[this.objectRefs[i][j]];
				} else {
					textureBuffer = this.fObjectTextureBufferList[this.objectRefs[i][j]];
					texturePixels = this.fObjectTexturePixelsList[this.objectRefs[i][j]];
				}

				let objDist =
					this.objectRayLengths[i][j] > 0 ? this.objectRayLengths[i][j] / this.fFishTable[i] : null;

				if (objDist) {
					let objBrightnessLevel = 110 / ~~objDist;
					if (objBrightnessLevel > 1.3) objBrightnessLevel = 1.3;

					const objRatio = this.fPlayerDistanceToProjectionPlane / objDist;
					const objScale = (this.fPlayerDistanceToProjectionPlane * textureBuffer.height) / objDist;
					const objBottom = objRatio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
					const objTop = objBottom - objScale;
					const objHeight = objBottom - objTop;
					if (objTop < highestObjectTop) {
						highestObjectTop = objTop;
						highestObjectTopDist = objDist;
					}

					if (
						this.isItemRay[i][j] &&
						this.items[this.objectRefs[i][j]].inReticle &&
						objTop <= this.canvasHeight / 2 &&
						objBottom >= this.canvasHeight / 2
					) {
						this.items[this.objectRefs[i][j]].inReticle = true;
					} else if (this.isItemRay[i][j]) this.items[this.objectRefs[i][j]].inReticle = false;

					this.drawObjectStrip(
						i,
						Math.floor(objTop),
						objHeight,
						objBrightnessLevel,
						this.objectOffsets[i][j],
						textureBuffer,
						texturePixels,
						this.isItemRay[i][j] ? this.items[this.objectRefs[i][j]].inReticle : false
					);
				}
			}

			let thinWallDist =
				this.thinWallRayLengths[i] > 0 ? this.thinWallRayLengths[i] / this.fFishTable[i] : null;

			if (thinWallDist) {
				let thinWallBrightnessLevel = 110 / ~~thinWallDist;
				if (thinWallBrightnessLevel > 1.3) thinWallBrightnessLevel = 1.3;

				const thinWallRatio = this.fPlayerDistanceToProjectionPlane / thinWallDist;
				const thinWallScale = (this.fPlayerDistanceToProjectionPlane * this.WALL_HEIGHT) / thinWallDist;
				const thinWallBottom = thinWallRatio * this.fPlayerHeight + this.fProjectionPlaneYCenter;
				const thinWallTop = thinWallBottom - thinWallScale;
				let thinWallHeight = thinWallBottom - thinWallTop;

				let cuttoffHeight = 1;
				if (thinWallBottom - highestObjectTop > 0 && thinWallDist >= highestObjectTopDist)
					cuttoffHeight = thinWallBottom - highestObjectTop;

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
					cuttoffHeight
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

			const rayObjData = [
				{
					rayLength: 0,
					collisionX: 0,
					collisionY: 0,
					ref: 0,
					offset: 0,
					isItemRay: 0,
				},
			];

			for (let j = 0; j < this.objects.length + this.items.length; j++) {
				let object;
				let textureBuffer;
				let ref;
				let isItem = false;
				if (j < this.objects.length) {
					object = this.objects[j];
					textureBuffer = this.fObjectTextureBufferList[j];
					ref = j;
				} else {
					ref = j - this.objects.length;
					object = this.items[ref];
					textureBuffer = this.fItemTextureBufferList[ref];
					isItem = true;
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
						});

						if (this.DEBUG && d < thinWallRecord) {
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

			rayObjData.sort((a, b) => b.rayLength - a.rayLength);

			for (let j = 0; j < rayObjData.length; j++) {
				this.objectRayLengths[i].push(rayObjData[j].rayLength);
				this.objectCollisionsX[i].push(rayObjData[j].collisionX);
				this.objectCollisionsY[i].push(rayObjData[j].collisionY);
				this.objectRefs[i].push(rayObjData[j].ref);
				this.objectOffsets[i].push(rayObjData[j].offset);
				this.isItemRay[i].push(rayObjData[j].isItemRay);
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

					if (d <= minDist) return;
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

	setNewMapData(i = this.mapNum) {
		this.onWallTextureLoaded(maps[i].wallTextures);
		this.onPaintingTexturesLoaded(maps[i].paintings);
		this.fPaintingDetails = maps[i].paintingDetails;

		this.onCeilingTextureLoaded(maps[i].ceilingTexture);
		this.onFloorTextureLoaded(maps[i].floorTextures);

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
		const slideSpeed = this.fGameSpeed / 2;

		if (thinWall.xEnd - thinWall.xStart !== 0) {
			const length = Math.abs(thinWall.xEnd - thinWall.xStart);
			const moveDir = thinWall.xEnd > thinWall.xStart ? 1 : -1;

			if (!thinWall.isOpen) {
				this.thinWalls[i].xStart -= slideSpeed * moveDir;
				this.thinWalls[i].xEnd -= slideSpeed * moveDir;
				if (Math.abs(this.thinWalls[i].xStart - this.thinWalls[i].xStartOriginal) >= length - 14) {
					this.activeThinWallId = null;
					this.thinWalls[i].isOpen = true;
					this.thinWalls[i].xStart = this.thinWalls[i].xStartOriginal - (length - 14) * moveDir;
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
				if (Math.abs(this.thinWalls[i].yStart - this.thinWalls[i].yStartOriginal) >= length - 14) {
					this.activeThinWallId = null;
					this.thinWalls[i].isOpen = true;
					this.thinWalls[i].yStart = this.thinWalls[i].yStartOriginal - (length - 14) * moveDir;
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

		if (!this.inventoryOpen) this.move();
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
			if (!this.inventoryOpen) this.lockPointer();
		});

		document.addEventListener('contextmenu', e => e.preventDefault());

		window.addEventListener('beforeunload', e => {
			if (this.preventPageReloadDialog) return;
			e.preventDefault();
			return (e.returnValue = 'Exit Tab?');
		});
	}
}

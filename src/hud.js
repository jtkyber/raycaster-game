export default class Hud {
	constructor(engine, audio, db) {
		this.db = db;
		this.audio = audio;
		this.engine = engine;
		this.ctx = engine.ctx;
		this.canvasWidth = engine.canvasWidth;
		this.canvasHeight = engine.canvasHeight;
		this.canvasPixels = engine.ctx.getImageData(0, 0, engine.canvasWidth, engine.canvasWidth);
		this.showFps = true;
		this.framesCounted = 0;
		this.cursorX = this.canvasWidth / 2;
		this.cursorY = this.canvasHeight / 2;
		this.inventorySlotSize = ~~(this.canvasWidth / 20);
		this.inventoryIndexSelected = null;
		this.itemCanBePlaced = false;
		this.itemOutsideOfInventory = false;
		this.itemPlacementCol = 0;
		this.itemPlacementRow = 0;
	}

	drawCursor() {
		if (this.inventoryIndexSelected !== null) return;
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'rgb(0, 0, 0)';
		this.ctx.fillStyle = 'rgb(255, 255, 255)';
		this.ctx.beginPath();
		this.ctx.ellipse(
			this.cursorX,
			this.cursorY,
			this.canvasHeight / 200,
			this.canvasHeight / 200,
			2 * Math.PI,
			0,
			2 * Math.PI
		);
		this.ctx.stroke();
		this.ctx.fill();
	}

	drawFillRectangle(x, y, width, height, red, green, blue, alpha) {
		const bytesPerPixel = 4;
		let targetIndex = bytesPerPixel * this.engine.offscreenCanvasPixels.width * y + bytesPerPixel * x;
		for (let h = 0; h < height; h++) {
			for (let w = 0; w < width; w++) {
				this.engine.offscreenCanvasPixels.data[targetIndex] = red;
				this.engine.offscreenCanvasPixels.data[targetIndex + 1] = green;
				this.engine.offscreenCanvasPixels.data[targetIndex + 2] = blue;
				this.engine.offscreenCanvasPixels.data[targetIndex + 3] = alpha;
				targetIndex += bytesPerPixel;
			}
			targetIndex += bytesPerPixel * (this.engine.offscreenCanvasPixels.width - width);
		}
	}

	setItemSelected() {
		const inventory = this.engine.inventory;
		const inventoryW = this.engine.inventorySlotCols * this.inventorySlotSize;
		const inventoryH = this.engine.inventorySlotRows * this.inventorySlotSize;

		const inventoryStartX = this.canvasWidth / 2 - inventoryW / 2;
		const inventoryStartY = this.canvasHeight / 2 - inventoryH / 2;
		if (
			this.cursorX < inventoryStartX ||
			this.cursorX > inventoryStartX + inventoryW ||
			this.cursorY < inventoryStartY ||
			this.cursorY > inventoryStartY + inventoryH
		) {
			return;
		}

		for (let i = 0; i < inventory.length; i++) {
			const xStart = inventoryStartX + inventory[i].slotIdStartCol * this.inventorySlotSize;
			const yStart = inventoryStartY + inventory[i].slotIdStartRow * this.inventorySlotSize;
			const xEnd = xStart + inventory[i].slotCols * this.inventorySlotSize;
			const yEnd = yStart + inventory[i].slotRows * this.inventorySlotSize;

			if (this.cursorX >= xStart && this.cursorX <= xEnd && this.cursorY >= yStart && this.cursorY <= yEnd) {
				this.inventoryIndexSelected = i;
			}
		}
	}

	drawSelectedInventoryItem() {
		const inventory = this.engine.inventory;
		const item = inventory[this.inventoryIndexSelected];
		const img = this.engine.textures[item.name];

		const inventoryW = this.engine.inventorySlotCols * this.inventorySlotSize;
		const inventoryH = this.engine.inventorySlotRows * this.inventorySlotSize;
		const inventoryStartX = this.canvasWidth / 2 - inventoryW / 2;
		const inventoryStartY = this.canvasHeight / 2 - inventoryH / 2;

		const slotCols = item.slotCols;
		const slotRows = item.slotRows;
		const scaleFactor = Math.min(
			(this.inventorySlotSize * slotCols) / img.width,
			(this.inventorySlotSize * slotRows) / img.height
		);
		const newW = img.width * scaleFactor - 4;
		const newH = img.height * scaleFactor - 4;

		const colStartNew = Math.round((this.cursorX - inventoryStartX - newW / 2) / this.inventorySlotSize);
		const rowStartNew = Math.round((this.cursorY - inventoryStartY - newH / 2) / this.inventorySlotSize);
		const colEndNew = colStartNew + (item.slotCols - 1);
		const rowEndNew = rowStartNew + (item.slotRows - 1);

		let spaceFound = true;
		for (let i = 0; i < inventory.length; i++) {
			const endCol = inventory[i].slotIdStartCol + (inventory[i].slotCols - 1);
			const endRow = inventory[i].slotIdStartRow + (inventory[i].slotRows - 1);

			if (
				i !== this.inventoryIndexSelected &&
				colStartNew <= endCol &&
				colEndNew >= inventory[i].slotIdStartCol &&
				rowStartNew <= endRow &&
				rowEndNew >= inventory[i].slotIdStartRow
			) {
				spaceFound = false;
			}
		}

		const slotX = colStartNew * this.inventorySlotSize + inventoryStartX;
		const slotY = rowStartNew * this.inventorySlotSize + inventoryStartY;
		const slotXEnd = colEndNew * this.inventorySlotSize + inventoryStartX;
		const slotYEnd = rowEndNew * this.inventorySlotSize + inventoryStartY;

		this.itemCanBePlaced = false;
		if (spaceFound) {
			if (
				slotX >= inventoryStartX &&
				slotXEnd <= inventoryStartX + (inventoryW - this.inventorySlotSize) &&
				slotY >= inventoryStartY &&
				slotYEnd <= inventoryStartY + (inventoryH - this.inventorySlotSize)
			) {
				this.itemPlacementCol = colStartNew;
				this.itemPlacementRow = rowStartNew;
				this.itemCanBePlaced = true;
				this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
				this.ctx.beginPath();
				this.ctx.fillRect(slotX, slotY, this.inventorySlotSize * slotCols, this.inventorySlotSize * slotRows);
			} else {
				this.itemOutsideOfInventory = true;

				this.ctx.font = `400 8px arial`;
				this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
				this.ctx.textAlign = 'center';
				this.ctx.textBaseline = 'center';
				this.ctx.fillText('Drop', this.cursorX, this.cursorY - newH / 2 - 10);
			}
		}

		this.ctx.beginPath();
		this.ctx.drawImage(img, this.cursorX - newW / 2, this.cursorY - newH / 2, newW, newH);
	}

	placeSelectedInventoryItem() {
		if (this.itemCanBePlaced) {
			this.engine.inventory[this.inventoryIndexSelected].slotIdStartCol = this.itemPlacementCol;
			this.engine.inventory[this.inventoryIndexSelected].slotIdStartRow = this.itemPlacementRow;
			this.itemCanBePlaced = false;
		} else if (this.itemOutsideOfInventory) {
			this.itemOutsideOfInventory = false;
			this.engine.items.push({
				name: this.engine.inventory[this.inventoryIndexSelected].name,
				x: this.engine.fPlayerX,
				y: this.engine.fPlayerY,
				category: this.engine.inventory[this.inventoryIndexSelected].category,
				inReticle: this.engine.inventory[this.inventoryIndexSelected].inReticle,
				inventoryCols: this.engine.inventory[this.inventoryIndexSelected].slotCols,
				inventoryRows: this.engine.inventory[this.inventoryIndexSelected].slotRows,
			});

			const img = this.engine.textures[this.engine.inventory[this.inventoryIndexSelected].name];
			this.engine.fItemTextureBufferList.push(new OffscreenCanvas(img.width, img.height));
			const lastIndex = this.engine.fItemTextureBufferList.length - 1;
			this.engine.fItemTextureBufferList[lastIndex].getContext('2d', { alpha: true }).drawImage(img, 0, 0);
			const imgData = this.engine.fItemTextureBufferList[lastIndex]
				.getContext('2d', { alpha: false })
				.getImageData(
					0,
					0,
					this.engine.fItemTextureBufferList[lastIndex].width,
					this.engine.fItemTextureBufferList[lastIndex].height
				);
			this.engine.fItemTexturePixelsList[lastIndex] = imgData.data;

			this.engine.inventory.splice(this.inventoryIndexSelected, 1);
		}
		this.inventoryIndexSelected = null;
	}

	drawInventory() {
		const inventory = this.engine.inventory;
		const ctx = this.ctx;
		const inventoryW = this.engine.inventorySlotCols * this.inventorySlotSize;
		const inventoryH = this.engine.inventorySlotRows * this.inventorySlotSize;
		const inventoryStartX = this.canvasWidth / 2 - inventoryW / 2;
		const inventoryStartY = this.canvasHeight / 2 - inventoryH / 2;

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.lineWidth = 1;
		ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
		ctx.beginPath();
		ctx.fillRect(inventoryStartX, inventoryStartY, inventoryW, inventoryH);
		for (let i = 0; i < this.engine.inventorySlotCols; i++) {
			for (let j = 0; j < this.engine.inventorySlotRows; j++) {
				ctx.beginPath();
				const slotX = i * this.inventorySlotSize + inventoryStartX;
				const slotY = j * this.inventorySlotSize + inventoryStartY;

				let slotFilled = false;
				for (let k = 0; k < inventory.length; k++) {
					if (k === this.inventoryIndexSelected) continue;
					if (inventory[k].slotIdStartCol === i && inventory[k].slotIdStartRow === j) {
						const img = this.engine.textures[inventory[k].name];

						const slotCols = inventory[k].slotCols;
						const slotRows = inventory[k].slotRows;
						const scaleFactor = Math.min(
							(this.inventorySlotSize * slotCols) / img.width,
							(this.inventorySlotSize * slotRows) / img.height
						);
						const newW = img.width * scaleFactor - 4;
						const newH = img.height * scaleFactor - 4;
						const x = slotX + (this.inventorySlotSize * slotCols) / 2 - newW / 2;
						const y = slotY + (this.inventorySlotSize * slotRows) / 2 - newH / 2;
						ctx.rect(slotX, slotY, this.inventorySlotSize * slotCols, this.inventorySlotSize * slotRows);
						ctx.stroke();
						ctx.drawImage(img, x, y, newW, newH);
						if (
							this.inventoryIndexSelected === null &&
							this.cursorX >= slotX &&
							this.cursorX <= slotX + this.inventorySlotSize * slotCols &&
							this.cursorY >= slotY &&
							this.cursorY <= slotY + this.inventorySlotSize * slotRows
						) {
							ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
							ctx.beginPath();
							ctx.fillRect(
								slotX,
								slotY,
								this.inventorySlotSize * slotCols,
								this.inventorySlotSize * slotRows
							);
						}
					}

					if (
						i >= inventory[k].slotIdStartCol &&
						i < inventory[k].slotIdStartCol + inventory[k].slotCols &&
						j >= inventory[k].slotIdStartRow &&
						j < inventory[k].slotIdStartRow + inventory[k].slotRows
					) {
						slotFilled = true;
					}
				}

				if (!slotFilled) {
					ctx.beginPath();
					ctx.rect(slotX, slotY, this.inventorySlotSize, this.inventorySlotSize);
					ctx.stroke();
				}
			}
		}

		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.rect(inventoryStartX, inventoryStartY, inventoryW, inventoryH);
		ctx.stroke();
	}

	drawEngineConsole(values) {
		const fontSize = this.canvasHeight / 34;
		const xOffset = this.canvasWidth / 90;
		const h = 10 * values.length;

		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		this.ctx.fillRect(0, this.canvasHeight - h - 2, this.canvasWidth, h + 2);

		for (let i = 0; i < values.length; i++) {
			const yOffset = this.canvasHeight - h + 10 * i;

			this.ctx.font = `500 ${fontSize}px arial`;
			this.ctx.fillStyle = 'white';
			this.ctx.strokeStyle = 'black';
			this.ctx.textAlign = 'left';
			this.ctx.textBaseline = 'top';
			this.ctx.fillText(`${i})   ${values[i]}`, xOffset, yOffset);
		}
	}

	drawReticle() {
		this.ctx.fillStyle = 'rgb(255, 255, 255)';
		this.ctx.beginPath();
		this.ctx.ellipse(
			~~(this.canvasWidth / 2),
			~~(this.canvasHeight / 2),
			this.canvasHeight / 300,
			this.canvasHeight / 300,
			2 * Math.PI,
			0,
			2 * Math.PI
		);
		this.ctx.fill();
	}

	drawFps() {
		if (!this.showFps) return;
		const fontSize = this.canvasHeight / 28;
		const xOffset = this.canvasWidth / 90;
		const yOffset = this.canvasHeight / 90;

		this.ctx.font = `600 ${fontSize}px arial`;
		this.ctx.fillStyle = this.framesCounted < 60 ? 'red' : 'green';
		this.ctx.strokeStyle = 'black';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(this.framesCounted, xOffset, yOffset);
	}
}

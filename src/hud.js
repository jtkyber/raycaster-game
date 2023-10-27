export default class Hud {
	constructor(engine) {
		this.engine = engine;
		this.ctx = engine.ctx;
		this.canvasWidth = engine.canvasWidth;
		this.canvasHeight = engine.canvasHeight;
		this.canvasPixels = engine.ctx.getImageData(0, 0, engine.canvasWidth, engine.canvasWidth);
		this.showFps = true;
		this.framesCounted = 0;
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

	drawInventory(clientX, clientY) {
		const inventory = this.engine.inventory;
		const ctx = this.ctx;
		const slotSize = ~~(this.canvasWidth / 20);
		const inventoryW = this.engine.inventorySlotCols * slotSize;
		const inventoryH = this.engine.inventorySlotRows * slotSize;
		const inventoryStartW = this.canvasWidth / 2 - inventoryW / 2;
		const inventoryStartH = this.canvasHeight / 2 - inventoryH / 2;

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.lineWidth = 1;
		ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
		ctx.beginPath();
		ctx.fillRect(inventoryStartW, inventoryStartH, inventoryW, inventoryH);
		for (let i = 0; i < this.engine.inventorySlotCols; i++) {
			for (let j = 0; j < this.engine.inventorySlotRows; j++) {
				ctx.beginPath();
				const slotX = i * slotSize + inventoryStartW;
				const slotY = j * slotSize + inventoryStartH;

				let slotFilled = false;
				for (let k = 0; k < inventory.length; k++) {
					if (inventory[k].slotIdStartCol === i && inventory[k].slotIdStartRow === j) {
						const img = this.engine.textures[inventory[k].name];

						const slotCols = inventory[k].slotCols;
						const slotRows = inventory[k].slotRows;
						const scaleFactor = Math.min(
							(slotSize * slotCols) / img.width,
							(slotSize * slotRows) / img.height
						);
						const newW = img.width * scaleFactor - 4;
						const newH = img.height * scaleFactor - 4;
						const x = slotX + (slotSize * slotCols) / 2 - newW / 2;
						const y = slotY + (slotSize * slotRows) / 2 - newH / 2;
						ctx.rect(slotX, slotY, slotSize * slotCols, slotSize * slotRows);
						ctx.stroke();
						ctx.drawImage(img, x, y, newW, newH);
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
					ctx.rect(slotX, slotY, slotSize, slotSize);
					ctx.stroke();
				}
			}
		}

		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.rect(inventoryStartW, inventoryStartH, inventoryW, inventoryH);
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

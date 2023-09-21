export default class Hud {
	constructor(engine) {
		this.engine = engine;
		this.ctx = engine.ctx;
		this.canvasWidth = engine.canvasWidth;
		this.canvasHeight = engine.canvasHeight;
		this.canvasPixels = engine.ctx.getImageData(0, 0, engine.canvasWidth, engine.canvasWidth);

		this.frameRate = 0;
		this.framesCounted = 0;
	}

	set _framesCounted(value) {
		this.framesCounted = value;
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

	drawReticle() {
		const thickness = 1;
		const length = 3;

		this.drawFillRectangle(
			this.canvasWidth / 2 - length + 1,
			this.canvasHeight / 2,
			length - 1,
			thickness,
			255,
			255,
			255,
			255
		);

		this.drawFillRectangle(
			this.canvasWidth / 2,
			this.canvasHeight / 2 - length + 1,
			thickness,
			length - 1,
			255,
			255,
			255,
			255
		);

		this.drawFillRectangle(
			this.canvasWidth / 2,
			this.canvasHeight / 2,
			length,
			thickness,
			255,
			255,
			255,
			255
		);

		this.drawFillRectangle(
			this.canvasWidth / 2,
			this.canvasHeight / 2,
			thickness,
			length,
			255,
			255,
			255,
			255
		);
	}

	drawFps() {
		const fontSize = this.canvasHeight / 28;
		const xOffset = this.canvasWidth / 90;
		const yOffset = this.canvasHeight / 90;

		this.ctx.font = `600 ${fontSize}px arial`;
		this.ctx.fillStyle = this.framesCounted < this.frameRate ? 'red' : 'green';
		this.ctx.strokeStyle = 'black';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(this.framesCounted, xOffset, yOffset);
	}
}
import Actions from './actions.js';
import Engine from './engine.js';
import Hud from './hud.js';

const engine = new Engine();
const hud = new Hud(engine);
const actions = new Actions(engine);

const fpsInterval = 1000 / 60;
let animationFrameId;
let deltaTime = 0;
let timestamp = 0;

const alterOffscreenCanvasPixels = () => {
	engine.update();
	engine.ctx.putImageData(engine.offscreenCanvasPixels, 0, 0);
};

const drawOntoCanvas = () => {
	hud.drawReticle();
	engine.fade();
	hud.drawFps();
	if (engine.inventoryOpen) {
		hud.drawInventory();
		if (hud.inventoryIndexSelected !== null) hud.drawSelectedInventoryItem();
	}

	if (engine.consoleValues.length) hud.drawEngineConsole(engine.consoleValues);
};

const gameLoop = () => {
	animationFrameId = requestAnimationFrame(gameLoop);
	timestamp = Date.now();

	if (engine.isCrouching) engine.fPlayerMoveSpeed *= 0.5;

	alterOffscreenCanvasPixels();
	drawOntoCanvas();
	actions.runNextFunction();

	if (engine.inventoryOpen) hud.drawCursor();
	else {
		hud.cursorX = engine.canvasWidth / 2;
		hud.cursorY = engine.canvasHeight / 2;
		hud.inventoryIndexSelected = null;
		hud.itemCanBePlaced = false;
		hud.itemOutsideOfInventory = false;
	}

	deltaTime = Date.now() - timestamp;

	engine.fGameSpeed = (deltaTime / fpsInterval) * 2.5;
	engine.fPlayerMoveSpeed = (deltaTime / fpsInterval) * 4;
};

const beginLoop = () => {
	gameLoop();

	setInterval(() => {
		hud.framesCounted = ~~(1000 / deltaTime);
	}, 100);
};

const setUp = async () => {
	await engine.init();
	await actions.init();

	hud.frameRate = 0;

	beginLoop();
};

setUp();

document.onmousemove = e => {
	if (engine.inventoryOpen && engine.userIsInTab) {
		const newX = hud.cursorX + e.movementX / 4;
		const newY = hud.cursorY + e.movementY / 4;

		if (newX >= 0 && newX <= engine.canvasWidth && newY >= 0 && newY <= engine.canvasHeight) {
			hud.cursorX += e.movementX / 3;
			hud.cursorY += e.movementY / 3;
		}
	}
};

document.onmousedown = e => {
	if (engine.inventoryOpen && engine.userIsInTab) {
		if (hud.inventoryIndexSelected === null) hud.setItemSelected();
	}
};

document.onmouseup = e => {
	if (engine.inventoryOpen && engine.userIsInTab) {
		if (hud.inventoryIndexSelected !== null) hud.placeSelectedInventoryItem();
	}
};

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
let clientX = 0;
let clientY = 0;

const alterOffscreenCanvasPixels = () => {
	engine.update();
	engine.ctx.putImageData(engine.offscreenCanvasPixels, 0, 0);
};

const drawOntoCanvas = () => {
	hud.drawReticle();
	engine.fade();
	hud.drawFps();
	if (engine.inventoryOpen) hud.drawInventory(clientX, clientY);
	if (engine.consoleValues.length) hud.drawEngineConsole(engine.consoleValues);
};

const gameLoop = () => {
	animationFrameId = requestAnimationFrame(gameLoop);
	timestamp = Date.now();

	if (engine.isCrouching) engine.fPlayerMoveSpeed *= 0.5;

	alterOffscreenCanvasPixels();
	drawOntoCanvas();

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
	if (!engine.inventoryOpen) return;
	clientX = e.clientX;
	clientY = e.clientY;
};

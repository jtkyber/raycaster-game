import Actions from './actions.js';
import Engine from './engine.js';
import Hud from './hud.js';

const engine = new Engine();
const actions = new Actions(engine);
const hud = new Hud(engine);

const fpsInterval = 1000 / 60;
let animationFrameId;
let deltaTime = 0;
let timestamp = 0;

const alterOffscreenCanvasPixels = () => {
	engine.update();
	hud.drawReticle();

	engine.ctx.putImageData(engine.offscreenCanvasPixels, 0, 0);
};

const drawOntoCanvas = () => {
	engine.fade();
	hud.drawFps();
	if (engine.consoleValues[0]) hud.drawEngineConsole(engine.consoleValues);
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
		hud._framesCounted = ~~(1000 / deltaTime);
	}, 100);
};

const setUp = async () => {
	await engine.init();
	await actions.init();

	hud.frameRate = 0;

	beginLoop();
};

setUp();

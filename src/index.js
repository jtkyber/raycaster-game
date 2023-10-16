import Actions from './actions.js';
import Engine from './engine.js';
import Hud from './hud.js';

const engine = new Engine();
const actions = new Actions(engine);
const hud = new Hud(engine);

const frameRate = 70;
const frameRateMultiplier = 60 / frameRate;
const fpsInterval = 1000 / frameRate;
let frameCount = 0;
let animationFrameId;
let now = 0;
let then = 0;
let elapsed = 0;
let deltaTime = 0;
let date = 0;

const alterOffscreenCanvasPixels = () => {
	engine.update();
	hud.drawReticle();

	engine.ctx.putImageData(engine.offscreenCanvasPixels, 0, 0);
};

const drawOntoCanvas = () => {
	engine.fade();
	hud.drawFps();
};

const gameLoop = () => {
	animationFrameId = requestAnimationFrame(gameLoop);
	now = Date.now();
	elapsed = now - then;

	if (elapsed > fpsInterval) {
		if (frameCount === 0) {
			setTimeout(() => {
				hud._framesCounted = frameCount;
				frameCount = 0;
			}, 1000);
		}
		then = now - (elapsed % fpsInterval);
		frameCount++;

		date = Date.now();

		if (engine.isCrouching) engine.fPlayerMoveSpeed *= 0.5;

		alterOffscreenCanvasPixels();

		drawOntoCanvas();

		deltaTime = Date.now() - date;
		engine.fGameSpeed = (deltaTime / 6) * frameRateMultiplier;
		engine.fPlayerMoveSpeed = (deltaTime / 4) * frameRateMultiplier;
	}
};

const beginLoop = () => {
	then = Date.now();
	gameLoop();
};

const setUp = async () => {
	await engine.init();
	await actions.init();

	hud.frameRate = frameRate;

	beginLoop();
};

setUp();

import { degToRad, getIntersection } from '../utils/calc.js';
import { maps } from './maps.js';

export default class Actions {
	constructor(engine) {
		this.engine = engine;
		this.minUseDist = 120;
		this.keysPressed = [];
	}

	openDoor(rowFound, colFound, tileIndex) {
		const engine = this.engine;
		engine.map[rowFound * engine.mapCols + colFound] = 2;
		engine.levelTransition = true;

		const newTileIndex = engine.doorMap[tileIndex].indexTo;
		const newTileSide = engine.doorMap[tileIndex].side;
		const newMapNum = engine.doorMap[tileIndex].mapTo;
		const newMapCols = maps[newMapNum].map[0].length;
		let x = engine.TILE_SIZE * (newTileIndex % newMapCols);
		let y = engine.TILE_SIZE * Math.floor(newTileIndex / newMapCols);
		let newPlayerAngle = 0;
		const offset = 20;

		switch (newTileSide) {
			case 0:
				x = x + engine.TILE_SIZE / 2;
				y = y - offset;
				newPlayerAngle = 270;
				break;
			case 1:
				x = x + engine.TILE_SIZE + offset;
				y = y + engine.TILE_SIZE / 2;
				newPlayerAngle = 0;
				break;
			case 2:
				x = x + engine.TILE_SIZE / 2;
				y = y + engine.TILE_SIZE + offset;
				newPlayerAngle = 90;
				break;
			case 3:
				x = x - engine.TILE_SIZE - offset;
				y = y + engine.TILE_SIZE / 2;
				newPlayerAngle = 180;
				break;
		}

		const interval = setInterval(() => {
			if (!engine.levelTransition) {
				engine.fPlayerX = x;
				engine.fPlayerY = y;
				engine.fPlayerAngle = newPlayerAngle;
				engine.setNewMapData(newMapNum);
				clearInterval(interval);
			}
		}, 50);
	}

	checkThinWalls() {
		const engine = this.engine;
		if (!engine.reticleOnWall) return;

		let record = Infinity;
		let thinWallIndex = null;

		for (let i = 0; i < engine.thinWalls.length; i++) {
			const intersection = getIntersection(
				engine.fPlayerX,
				engine.fPlayerY,
				1,
				degToRad(engine.fPlayerAngle),
				engine.thinWalls[i].xStart,
				engine.thinWalls[i].yStart,
				engine.thinWalls[i].xEnd,
				engine.thinWalls[i].yEnd
			);

			if (intersection?.[0]) {
				const dx = Math.abs(engine.fPlayerX - intersection[0]);
				const dy = Math.abs(engine.fPlayerY - intersection[1]);
				const d = Math.sqrt(dx * dx + dy * dy);
				record = Math.min(d, record);

				if (d <= record) {
					record = d;
					thinWallIndex = i;
				}
			}
		}

		if (record < this.minUseDist) {
			return {
				record: record,
				index: thinWallIndex,
			};
		}
	}

	checkDoors() {
		const engine = this.engine;
		if (!engine.reticleOnWall) return;
		let record = Infinity;
		let rowFound = null;
		let colFound = null;
		let tileIndex = null;

		let adjustedAngle = engine.fPlayerAngle;
		if (adjustedAngle < 0) adjustedAngle += 360;
		const playerQuadrant = Math.floor(adjustedAngle / 90);
		const sidesToCheck = engine.getSidesToCheck(playerQuadrant);

		for (let row = 0; row < engine.mapRows; row++) {
			for (let col = 0; col < engine.mapCols; col++) {
				const tile = engine.map[row * engine.mapCols + col];
				if (tile > 5) continue;

				const tileIntersection = engine.getIntersectionOfTile(
					engine.fPlayerX,
					engine.fPlayerY,
					row,
					col,
					degToRad(engine.fPlayerAngle),
					sidesToCheck
				);

				if (tileIntersection.record < record) {
					tileIndex = row * engine.mapCols + col;
					record = tileIntersection.record;
					rowFound = row;
					colFound = col;
				}
			}
		}

		if (engine.doorMap[tileIndex] && record < this.minUseDist) {
			return {
				record: record,
				rowFound: rowFound,
				colFound: colFound,
				tileIndex: tileIndex,
			};
		}
		return;
	}

	handleUseBtn() {
		let record = Infinity;
		let action = '';

		const doorData = this.checkDoors();
		if (doorData?.record < record) {
			record = doorData.record;
			action = 'openDoor';
		}

		const thinWallData = this.checkThinWalls();
		if (thinWallData?.record < record) {
			record = thinWallData.record;
			action = 'operateThinWall';
		}

		switch (action) {
			case 'openDoor':
				this.openDoor(doorData.rowFound, doorData.colFound, doorData.tileIndex);
				break;
			case 'operateThinWall':
				this.engine.activeThinWallId = thinWallData.index;
				break;
		}
	}

	init() {
		const engine = this.engine;
		document.addEventListener('mousedown', e => {
			if (!engine.userIsInTab || engine.DEBUG) return;
		});

		document.addEventListener('mousemove', e => {
			if (!engine.userIsInTab) return;
			if (!engine.DEBUG) {
				engine.fPlayerAngle += e.movementX / 20;
				engine.fProjectionPlaneYCenter -= e.movementY / 4;
				if (engine.fProjectionPlaneYCenter < -engine.PROJECTIONPLANEHEIGHT / 2) {
					engine.fProjectionPlaneYCenter = -engine.PROJECTIONPLANEHEIGHT / 2;
				} else if (
					engine.fProjectionPlaneYCenter >
					engine.PROJECTIONPLANEHEIGHT + engine.PROJECTIONPLANEHEIGHT / 2
				) {
					engine.fProjectionPlaneYCenter = engine.PROJECTIONPLANEHEIGHT + engine.PROJECTIONPLANEHEIGHT / 2;
				}
			}
		});

		document.addEventListener('keydown', e => {
			if (!this.keysPressed.includes(e.code)) {
				this.keysPressed.push(e.code);
				if (
					!(
						this.keysPressed.includes('ControlLeft') &&
						this.keysPressed.includes('ShiftLeft') &&
						this.keysPressed.includes('KeyI')
					)
				) {
					e.preventDefault();
				}
			}

			if (e.code === 'KeyW') {
				engine.fKeyForward = true;
				engine.fKeyBack = false;
			} else if (e.code === 'KeyS') {
				engine.fKeyBack = true;
				engine.fKeyForward = false;
			}

			if (e.code === 'KeyA') {
				if (engine.DEBUG) engine.fRotationDir = 'left';
				else {
					engine.fKeyLeft = true;
					engine.fKeyRight = false;
				}
			} else if (e.code === 'KeyD') {
				if (engine.DEBUG) engine.fRotationDir = 'right';
				else {
					engine.fKeyRight = true;
					engine.fKeyLeft = false;
				}
			}

			if (e.code === 'Space' && !engine.isJumping && !engine.isCrouching && !engine.isStanding) {
				engine.isJumping = true;
			}

			if (e.code === 'ShiftLeft' && !engine.isCrouching && !engine.isJumping && !engine.isStanding) {
				engine.isCrouching = true;
			}
		});

		document.addEventListener('keyup', e => {
			e.preventDefault();

			const index = this.keysPressed.indexOf(e.code);
			if (index > -1) this.keysPressed.splice(index, 1);

			if (e.code === 'Tab') {
				if (this.engine.inventoryOpen) {
					this.engine.inventoryOpen = false;
					this.engine.lockPointer();
				} else {
					this.engine.inventoryOpen = true;
					document.exitPointerLock();
				}

				this.engine.fKeyForward = false;
				this.engine.fKeyBack = false;
				this.engine.fKeyLeft = false;
				this.engine.fKeyRight = false;
			}

			if (!engine.userIsInTab && !engine.DEBUG) return;

			if (e.code === 'KeyW') {
				engine.fKeyForward = false;
			} else if (e.code === 'KeyS') {
				engine.fKeyBack = false;
			}

			if (e.code === 'KeyA') {
				if (engine.DEBUG) engine.fRotationDir = '';
				else engine.fKeyLeft = false;
			} else if (e.code === 'KeyD') {
				if (engine.DEBUG) engine.fRotationDir = '';
				else engine.fKeyRight = false;
			}

			if (e.code === 'ShiftLeft') {
				engine.isCrouching = false;
				engine.isStanding = true;
			}

			if (e.code === 'KeyE') {
				this.handleUseBtn();
			}
		});
	}
}

import { degToRad, getIntersection } from '../utils/calc.js';
import { maps } from './maps.js';

export default class Actions {
	constructor(engine) {
		this.engine = engine;
		this.minUseDist = 120;
		this.keysPressed = [];
		this.functionToRun = null;
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

	checkItems() {
		const engine = this.engine;
		let record = Infinity;
		let ItemIndex = null;

		for (let i = 0; i < engine.items.length; i++) {
			// Get perpendicular line coords
			const deltaY = engine.items[i].y - engine.fPlayerY;
			const deltaX = engine.items[i].x - engine.fPlayerX;
			const slope = deltaY / deltaX;
			const perpSlope = -(1 / slope);
			const angle = Math.atan(perpSlope);
			let x1;
			let y1;
			let x2;
			let y2;
			x1 = engine.items[i].x - (engine.fItemTextureBufferList[i].width / 2) * Math.cos(angle);
			y1 = engine.items[i].y - (engine.fItemTextureBufferList[i].width / 2) * Math.sin(angle);
			x2 = engine.items[i].x + (engine.fItemTextureBufferList[i].width / 2) * Math.cos(angle);
			y2 = engine.items[i].y + (engine.fItemTextureBufferList[i].width / 2) * Math.sin(angle);

			const intersection = getIntersection(
				engine.fPlayerX,
				engine.fPlayerY,
				1,
				degToRad(engine.fPlayerAngle),
				x1,
				y1,
				x2,
				y2
			);

			if (intersection?.[0]) {
				const dx = Math.abs(engine.fPlayerX - intersection[0]);
				const dy = Math.abs(engine.fPlayerY - intersection[1]);
				const d = Math.sqrt(dx * dx + dy * dy);

				if (d <= record && engine.items[i].inReticle) {
					record = Math.min(d, record);
					record = d;
					ItemIndex = i;
				}
			}
		}

		if (record < this.minUseDist) {
			return {
				record: record,
				index: ItemIndex,
			};
		}
	}

	findSpotForItem(newItemIndex) {
		const inventory = this.engine.inventory;
		const newItemCols = this.engine.items[newItemIndex].inventoryCols;
		const newItemRows = this.engine.items[newItemIndex].inventoryRows;

		for (let j = 0; j < this.engine.inventorySlotRows; j++) {
			loop: for (let i = 0; i < this.engine.inventorySlotCols; i++) {
				let spaceFound = true;
				const newItemEndCol = i + (newItemCols - 1);
				const newItemEndRow = j + (newItemRows - 1);

				if (
					newItemEndCol > this.engine.inventorySlotCols - 1 ||
					newItemEndRow > this.engine.inventorySlotRows - 1
				) {
					break loop;
				}

				for (let k = 0; k < inventory.length; k++) {
					const endCol = inventory[k].slotIdStartCol + (inventory[k].slotCols - 1);
					const endRow = inventory[k].slotIdStartRow + (inventory[k].slotRows - 1);

					if (
						i <= endCol &&
						newItemEndCol >= inventory[k].slotIdStartCol &&
						j <= endRow &&
						newItemEndRow >= inventory[k].slotIdStartRow
					) {
						spaceFound = false;
					}
				}

				if (spaceFound) {
					this.engine.inventory.push({
						name: this.engine.items[newItemIndex].name,
						slotIdStartCol: i,
						slotIdStartRow: j,
						slotCols: newItemCols,
						slotRows: newItemRows,
						category: this.engine.items[newItemIndex].category,
					});
					this.engine.items.splice(newItemIndex, 1);
					this.engine.fItemTextureBufferList.splice(newItemIndex, 1);
					this.engine.fItemTexturePixelsList.splice(newItemIndex, 1);
					return;
				}
			}
		}
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

		const itemData = this.checkItems();
		if (itemData?.record < record) {
			record = itemData.record;
			action = 'grabItem';
		}

		switch (action) {
			case 'openDoor':
				this.openDoor(doorData.rowFound, doorData.colFound, doorData.tileIndex);
				break;
			case 'operateThinWall':
				this.engine.activeThinWallId = thinWallData.index;
				break;
			case 'grabItem':
				this.findSpotForItem(itemData.index);
				break;
		}
	}

	runNextFunction() {
		if (!this.functionToRun) return;
		this.functionToRun();
		this.functionToRun = null;
	}

	init() {
		const engine = this.engine;
		document.addEventListener('mousedown', e => {
			if (!engine.userIsInTab || engine.DEBUG) return;
		});

		document.addEventListener('mousemove', e => {
			if (!engine.userIsInTab) return;
			if (!engine.DEBUG) {
				if (!engine.inventoryOpen) {
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
					) &&
					!this.keysPressed.includes('F5')
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
				if (this.engine.inventoryOpen) this.engine.inventoryOpen = false;
				else this.engine.inventoryOpen = true;

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
				this.functionToRun = this.handleUseBtn;
			}
		});
	}
}

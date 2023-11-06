import { convertDeg0To360, degToRad, radToDeg } from '../utils/calc.js';
import { maps } from './maps.js';

export default class Sound {
	constructor(db) {
		this.db = db;
		this.soundPaths = [
			'./src/audio/song.mp3',
			'./src/audio/test.mp3',
			'./src/audio/slidingDoorOpen.mp3',
			'./src/audio/slidingDoorClose.mp3',
			'./src/audio/footstep1.mp3',
			'./src/audio/footstep2.mp3',
			'./src/audio/footstep3.mp3',
			'./src/audio/footstep4.mp3',
			'./src/audio/footstep5.mp3',
			'./src/audio/itemPickup.mp3',
			'./src/audio/doorOpen.mp3',
			'./src/audio/knocking.mp3',
			'./src/audio/lightHum.mp3',
		];
		this.sounds = {};
		this.soundsPlaying = [];
	}

	updateSoundPositions(pAng, px, py) {
		for (let i = 0; i < this.soundsPlaying.length; i++) {
			const name = this.soundsPlaying[i].name;
			if (this.soundsPlaying[i].hasPanning) {
				const x = this.soundsPlaying[i].x;
				const y = this.soundsPlaying[i].y;
				const dx = Math.abs(px - x);
				const dy = Math.abs(py - y);
				const d = Math.sqrt(dx * dx + dy * dy);

				let playerAng = convertDeg0To360(pAng);
				let sourceAngle = radToDeg(Math.atan2(py - y, px - x)) + 180;

				let angleDiff = ((sourceAngle - playerAng + 180 + 360) % 360) - 180;

				let newX = d * Math.cos(Math.PI / 2 - degToRad(Math.abs(angleDiff)));
				if (angleDiff < 0) newX *= -1;
				newX;
				let newY = -30;
				let newZ = d;
				if (Math.abs(angleDiff) > 90) newZ = newZ + (newZ * Math.abs(angleDiff)) / 500;
				this.sounds[name].pos(newX, newY, newZ);
			}
		}
	}

	stopSound(name) {
		this.sounds[name].stop();
		for (let i = 0; i < this.soundsPlaying.length; i++) {
			if (this.soundsPlaying[name] === name) this.soundsPlaying.splice(i, 1);
		}
	}

	playSound(name, x, y, hasPanning, i = '') {
		this.sounds[name + i].play();
		this.soundsPlaying.push({
			name: name + i,
			x,
			y,
			hasPanning,
		});
	}

	init(i = 0) {
		Howler.unload();
		this.sounds = {};
		this.soundsPlaying = [];
		for (let j = 0; j < this.soundPaths.length; j++) {
			const name = this.soundPaths[j].split('/').pop()?.split('.')[0];
			let rate = 1;
			let html5 = false;
			let autoplay = false;
			let volume = 1;
			let loop = false;

			if (name.includes('footstep')) {
				volume = 1.1;
			} else if (name.includes('itemPickup')) {
				volume = 0.4;
			} else if (name.includes('doorOpen')) {
				volume = 0.5;
			} else continue;

			this.sounds[name] = new Howl({
				src: this.soundPaths[j],
				preload: true,
				html5: html5,
				autoplay: autoplay,
				loop: loop,
				volume: volume,
				rate: rate,
				maxDistance: 1000000,
				onend: () => {
					for (let k = 0; k < this.soundsPlaying.length; k++) {
						if (!loop && this.soundsPlaying[k].name === name) this.soundsPlaying.splice(k, 1);
					}
				},
			});
			this.sounds[name].pannerAttr({
				...this.sounds[name].pannerAttr(),
				distanceModel: 'exponential',
				rolloffFactor: 2,
				refDistance: 200,
			});
		}

		for (
			let j = 0;
			j < maps[i]?.objects.length + maps[i]?.thinWalls.length + maps[i]?.lightSources.length;
			j++
		) {
			let obj;
			let index;
			if (j < maps[i].objects.length) {
				index = j;
				obj = maps[i].objects[index];
			} else if (j < maps[i].objects.length + maps[i].thinWalls.length) {
				index = j - maps[i]?.objects.length;
				obj = maps[i].thinWalls[index];
			} else {
				index = j - maps[i]?.objects.length - maps[i]?.thinWalls.length;
				obj = maps[i].lightSources[index];
			}

			if (obj?.sounds) {
				obj.sounds.forEach(fileName => {
					const name = fileName + index;
					let rate = 1;
					let html5 = false;
					let autoplay = false;
					let volume = 1;
					let loop = false;

					switch (fileName) {
						case 'slidingDoorOpen':
							rate = 1.7;
							break;
						case 'slidingDoorClose':
							rate = 1.7;
							break;
						case 'song':
							loop = true;
							volume = 0.5;
							break;
						case 'knocking':
							loop = true;
							break;
						case 'lightHum':
							loop = true;
							volume = 0.1;
							break;
						default:
							break;
					}

					this.sounds[name] = new Howl({
						src: `./src/audio/${fileName}.mp3`,
						preload: true,
						html5: html5,
						autoplay: autoplay,
						loop: loop,
						volume: volume,
						rate: rate,
						maxDistance: 1000000,
						onend: () => {
							for (let k = 0; k < this.soundsPlaying.length; k++) {
								if (!loop && this.soundsPlaying[k].name === name) this.soundsPlaying.splice(k, 1);
							}
						},
					});
					this.sounds[name].pannerAttr({
						...this.sounds[name].pannerAttr(),
						distanceModel: 'exponential',
						rolloffFactor: 2,
						refDistance: 200,
					});
				});
			}
		}
	}
}

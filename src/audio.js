import { convertDeg0To360, degToRad, radToDeg } from '../utils/calc.js';

export default class Sound {
	constructor() {
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

	playSound(name, x, y, hasPanning) {
		this.sounds[name].play();
		this.soundsPlaying.push({
			name,
			x,
			y,
			hasPanning,
		});
	}

	init() {
		for (let i = 0; i < this.soundPaths.length; i++) {
			const name = this.soundPaths[i].split('/').pop()?.split('.')[0];
			let rate = 1;
			let html5 = false;
			let autoplay = false;
			let volume = 1;
			let loop = false;
			switch (name) {
				case 'slidingDoorOpen':
					rate = 2;
					break;
				case 'slidingDoorClose':
					rate = 2;
					break;
				case 'song':
					loop = true;
					volume = 0.5;
					break;
				case 'doorOpen':
					volume = 0.5;
					break;
				case 'itemPickup':
					volume = 0.5;
					break;
				case 'knocking':
					loop = true;
					break;
				default:
					break;
			}
			if (name.includes('footstep')) {
				volume = 1.5;
			}

			this.sounds[name] = new Howl({
				src: [this.soundPaths[i]],
				preload: true,
				html5: html5,
				autoplay: autoplay,
				loop: loop,
				volume: volume,
				rate: rate,
				maxDistance: 1000000,
				onend: () => {
					for (let i = 0; i < this.soundsPlaying.length; i++) {
						if (!loop && this.soundsPlaying[i].name === name) this.soundsPlaying.splice(i, 1);
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
	}
}

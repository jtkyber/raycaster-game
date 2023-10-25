// prettier-ignore
// Walls: 0 - 5
// Floors: 6 - 9
// Closed Door --> 1
// Open Door --> 2
// Portal-proof Block --> 3
const maps = [
    {
        // 24 x 23
        map: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 0, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 7, 7, 7, 7, 7, 7, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 0, 0, 6, 6, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [0, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0, 6, 0, 6, 6, 6, 7, 7, 7, 7, 7, 0, 7, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 0, 6, 6, 0, 6, 6, 6, 7, 7, 7, 7, 7, 0, 7, 0],
            [0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [4, 4, 4, 4, 4, 4, 4, 6, 4, 4, 4, 4, 4, 4, 4, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [4, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 4, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [4, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 4, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [4, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 4, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [1, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 4, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [4, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 4, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [4, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 4, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [4, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 4, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        thinWalls: [
            {
                texture: 'test',
                rowStart: 2,
                colStart: 15,
                rowEnd: 3,
                colEnd: 15,
                isOpen: false,
            },
        ],
        objects: [
            {
                type: 'barrel',
                x: 940,
                y: 80
            },
            {
                type: 'note',
                x: 936,
                y: 96
            },
            {
                type: 'barrel',
                x: 410,
                y: 820
            },
            {
                type: 'barrel',
                x: 546,
                y: 820
            },
            {
                type: 'table',
                x: 1370,
                y: 640
            },
            {
                type: 'table',
                x: 1370,
                y: 900
            },
            {
                type: 'table',
                x: 1370,
                y: 1160
            },
        ],
        wallTextures: ['wall1', 'doubleDoorClosed', 'doubleDoorOpen', 'wall1Dark', 'wall3'],
        doorMap: {
            432: {
                mapTo: 1,
                indexTo: 198,
                side: 1
            }
        },
        floorTextures: ['floor1', 'floor3', 'floor4', 'floor5'],
        ceilingTexture: 'ceiling1',
        paintings: ['painting3two', 'painting3one', 'painting1', 'painting4one', 'painting4two', 'painting2one', 'painting2two', 'painting5one', 'painting5two', 'painting6one', 'painting6two', 'painting7one', 'painting7two'],
        paintingDetails: [
            {
                row: 4,
                col: 6,
                side: 0
            },
            {
                row: 4,
                col: 7,
                side: 0
            },
            {
                row: 5,
                col: 0,
                side: 1
            },
            {
                row: 2,
                col: 22,
                side: 3
            },
            {
                row: 3,
                col: 22,
                side: 3
            },
            {
                row: 7,
                col: 21,
                side: 3
            },
            {
                row: 8,
                col: 21,
                side: 3
            },
            {
                row: 11,
                col: 21,
                side: 3
            },
            {
                row: 12,
                col: 21,
                side: 3
            },
            {
                row: 15,
                col: 21,
                side: 3
            },
            {
                row: 16,
                col: 21,
                side: 3
            },
            {
                row: 19,
                col: 21,
                side: 3
            },
            {
                row: 20,
                col: 21,
                side: 3
            }
        ]
    },
    {
        map: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 0, 0, 6, 0, 0, 0, 0, 6, 0, 0, 0, 0, 6, 0, 0, 0, 0, 6, 0, 0, 0, 0, 6, 0, 0, 6, 6, 6, 6, 6, 6, 0],
            [1, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 0, 0, 6, 0, 0, 0, 0, 6, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        objects: [
            {
                type: 'elmo',
                x: 1042,
                y: 86
            }
        ],
        wallTextures: ['wall1', 'doubleDoorClosed', 'doubleDoorOpen', 'wall1Dark'],
        doorMap: {
            198: {
                mapTo: 0,
                indexTo: 432,
                side: 1
            },
            413: {
                mapTo: 2,
                indexTo: 1,
                side: 2
            }
        },
        floorTextures: ['floor1'],
        ceilingTexture: 'ceiling1',
        paintings: ['painting1', 'painting8', 'painting9', 'painting10', 'painting11', 'painting12', 'painting13', 'painting14', 'painting15'],
        paintingDetails: [
            {
                row: 5,
                col: 5,
                side: 2
            },
            {
                row: 7,
                col: 10,
                side: 0
            },
            {
                row: 5,
                col: 15,
                side: 2
            },
            {
                row: 7,
                col: 20,
                side: 0
            },
            {
                row: 12,
                col: 3,
                side: 0
            },
            {
                row: 0,
                col: 8,
                side: 2
            },
            {
                row: 12,
                col: 13,
                side: 0
            },
            {
                row: 0,
                col: 18,
                side: 2
            },
            {
                row: 12,
                col: 22,
                side: 0
            },
        ]
    },
    {
        map: [
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        objects: [

        ],
        wallTextures: ['wall2', 'doubleDoor2Closed', 'doubleDoor2Open', 'wall2Chipped', 'wall2nice', 'wall2job'],
        doorMap: {
            1: {
                mapTo: 1,
                indexTo: 413,
                side: 0
            }
        },
        floorTextures: ['floor2'],
        ceilingTexture: 'ceiling2',
        paintings: [],
        paintingDetails: []
    }
]

export default maps;

// prettier-ignore
// Walls: 0 - 5
// Floors: 6 - 9
// Closed Door --> 1
// Open Door --> 2
export const maps = [
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
            [4, 3, 3, 3, 3, 3, 3, 6, 3, 3, 3, 3, 3, 3, 3, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [3, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 3, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [3, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 3, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [3, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 3, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [1, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 3, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [3, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 3, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [3, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 3, 0, 7, 7, 7, 7, 7, 0, 7, 0],
            [3, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 9, 8, 3, 0, 7, 7, 7, 7, 7, 7, 7, 0],
            [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        thinWalls: [
            {
                texture: 'test',
                rowStart: 2,
                colStart: 15,
                rowEnd: 3,
                colEnd: 15,
                isOpen: false,
                operation: 'door'
            },
            {
                texture: 'test2',
                rowStart: 11,
                colStart: 15,
                rowEnd: 13,
                colEnd: 15,
                isOpen: false,
            }
        ],
        items: [
            {
                name: 'apple',
                x: 500,
                y: 220,
                category: 'food',
                inReticle: false,
                inventoryCols: 1,
                inventoryRows: 1,
            },
            {
                name: 'note',
                x: 950,
                y: 90,
                category: 'note',
                inReticle: false,
                inventoryCols: 1,
                inventoryRows: 1,
            },
            {
                name: 'pickaxe',
                x: 1450,
                y: 80,
                category: 'tool',
                inReticle: false,
                inventoryCols: 2,
                inventoryRows: 3,
            },
            {
                name: 'bread',
                x: 700,
                y: 600,
                category: 'food',
                inReticle: false,
                inventoryCols: 2,
                inventoryRows: 1,
            },
            {
                name: 'pickaxe',
                x: 730,
                y: 530,
                category: 'tool',
                inReticle: false,
                inventoryCols: 2,
                inventoryRows: 3,
            },
            {
                name: 'bread',
                x: 750,
                y: 480,
                category: 'food',
                inReticle: false,
                inventoryCols: 2,
                inventoryRows: 1,
            },
            {
                name: 'bread',
                x: 710,
                y: 500,
                category: 'food',
                inReticle: false,
                inventoryCols: 2,
                inventoryRows: 1,
            },
            {
                name: 'bread',
                x: 100,
                y: 1380,
                category: 'food',
                inReticle: false,
                inventoryCols: 2,
                inventoryRows: 1,
            },
        ],
        objects: [
            {
                name: 'barrel',
                x: 1420,
                y: 100
            },
            {
                name: 'barrel',
                x: 1420,
                y: 280
            },
            {
                name: 'barrel',
                x: 940,
                y: 80
            },
            {
                name: 'table',
                x: 1370,
                y: 640
            },
            {
                name: 'table',
                x: 1370,
                y: 900
            },
            {
                name: 'table',
                x: 1370,
                y: 1160
            },
        ],
        wallTextures: ['wall1', 'doubleDoorClosed', 'doubleDoorOpen', 'wall3'],
        doorMap: {
            432: {
                mapTo: 1,
                indexTo: 198,
                side: 1
            }
        },
        floorTextures: ['floor1', 'floor3', 'floor4', 'floor5'],
        ceilingTexture: 'ceiling1',
        paintings: ['painting3two', 'painting3one', 'painting1', 'painting4one', 'painting4two', 'painting2one', 'painting2two', 'painting5one', 'painting5two', 'painting6one', 'painting6two', 'painting7one', 'painting7two', 'shield', 'shield'],
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
            },
            {
                row: 13,
                col: 6,
                side: 0
            },
            {
                row: 13,
                col: 8,
                side: 0
            }
        ]
    },
    {
        // 33 x 13
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
        thinWalls: [
            {
                texture: 'test',
                rowStart: 9,
                colStart: 20,
                rowEnd: 10,
                colEnd: 20,
                isOpen: false,
                operation: 'door'
            }
        ],
        objects: [
            {
                name: 'elmo',
                x: 1042,
                y: 86
            }
        ],
        wallTextures: ['wall1', 'doubleDoorClosed', 'doubleDoorOpen'],
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
        wallTextures: ['wall2', 'doubleDoor2Closed', 'doubleDoor2Open'],
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

export const texturePaths = [
	// Walls
	'src/assets/walls/wall1.png',
	'src/assets/walls/wall2.png',
	'src/assets/walls/wall3.png',
	'src/assets/walls/doubleDoorClosed.png',
	'src/assets/walls/doubleDoorOpen.png',
	'src/assets/walls/doubleDoor2Closed.png',
	'src/assets/walls/doubleDoor2Open.png',
	// Floors
	'src/assets/floors/floor1.png',
	'src/assets/floors/floor2.png',
	'src/assets/floors/floor3.png',
	'src/assets/floors/floor4.png',
	'src/assets/floors/floor5.png',
	// Ceilings
	'src/assets/ceilings/ceiling1.png',
	'src/assets/ceilings/ceiling2.png',
	// Paintings
	'src/assets/paintings/painting1.png',
	'src/assets/paintings/painting2one.png',
	'src/assets/paintings/painting2two.png',
	'src/assets/paintings/painting3one.png',
	'src/assets/paintings/painting3two.png',
	'src/assets/paintings/painting4one.png',
	'src/assets/paintings/painting4two.png',
	'src/assets/paintings/painting5one.png',
	'src/assets/paintings/painting5two.png',
	'src/assets/paintings/painting6one.png',
	'src/assets/paintings/painting6two.png',
	'src/assets/paintings/painting7one.png',
	'src/assets/paintings/painting7two.png',
	'src/assets/paintings/painting8.png',
	'src/assets/paintings/painting9.png',
	'src/assets/paintings/painting10.png',
	'src/assets/paintings/painting11.png',
	'src/assets/paintings/painting12.png',
	'src/assets/paintings/painting13.png',
	'src/assets/paintings/painting14.png',
	'src/assets/paintings/painting15.png',
	'src/assets/paintings/shield.png',
	// Objects
	'src/assets/objects/barrel.png',
	'src/assets/objects/redbull.png',
	'src/assets/objects/elmo.png',
	'src/assets/objects/table.png',
	// Thin Walls
	'src/assets/thinWalls/test.png',
	'src/assets/thinWalls/test2.png',
	// Items
	'src/assets/items/apple.png',
	'src/assets/items/pickaxe.png',
	'src/assets/items/note.png',
	'src/assets/items/redbull.png',
	'src/assets/items/bread.png',
];

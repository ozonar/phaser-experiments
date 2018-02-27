var windowWidth = 1280;
var windowHeight = 640;

var game = new Phaser.Game(windowWidth, windowHeight, Phaser.webGL, 'test', null, true, false);

var BasicGame = function (game) {
};

BasicGame.Boot = function (game) {
    // nothing here
};

var isoGroup, water = [];
// var buildingGroup = [];
var isDebug = false;
var cursors;
var size = 32;
var test = 0;

var slickUI;

var buildMode = false; // is player in build mode now
var buildingData = {};
var selectedTile = {};
var canPlaceable = true;

// json

var playerMoney = 10000;
var moneyCurrency = '$';

var playerGUI = {
    'money': null
};

var buildings = {
    'house': {
        'width': 3,
        'height': 4,
        'name': 'house',
        'cost': 5200
    },
    'bakery': {
        'width': 1,
        'height': 1,
        'name': 'bakery',
        'cost': 3000
    }
};

var menus = {};

BasicGame.Boot.prototype =
    {
        preload: function () {

            game.time.advancedTiming = true;
            game.debug.renderShadow = false;
            game.stage.disableVisibilityChange = true;

            game.plugins.add(new Phaser.Plugin.Isometric(game));

            slickUI = game.plugins.add(Phaser.Plugin.SlickUI);
            game.load.image('menu-button', 'data/assets/ui/menu.png');
            slickUI.load('data/assets/ui/kenney/kenney.json');

            // game.load.atlasJSONHash('tileset', 'data/assets/tileset.png', 'data/assets/tileset.json');
            this.load.tilemap('falcon', 'data/assets/tilemaps/falcon.json', null, Phaser.Tilemap.TILED_JSON);
            // this.load.image("tileset tiled", 'data/assets/tilemaps/tileset_tiled.png');
            game.load.spritesheet("tileset tiled", "data/assets/tilemaps/tileset_tiled.png", 64, 64, 24);
            game.load.spritesheet("houses", "data/assets/tilemaps/houses.png", 320, 320, 1);

            game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);
            game.iso.anchor.setTo(0.5, 0.2);
        },

        create: function () {
            debugOnCreate(true);

            this.loadMap();
            this.loadCursors();
            loadMenu();
            // buildMenu();

        },
        update: function () {

            this.updateWater();
            this.updateMoverment();
            this.game.iso.unproject(this.game.input.activePointer.position, this.cursorPos);


            if (buildMode !== false) {
                this.selectTiles(buildMode.x, buildMode.y);
            }

        },
        render: function () {
            debugRender(isDebug);
            // game.debug.cameraInfo(game.camera, 32, 32);
        },



        updatePlayerGUIData: function () {
            // playerGUI.money.remove();
            playerGUI.moneyText.value = playerMoney + moneyCurrency;
            // playerGUI.money.add(new SlickUI.Element.Text(0,0, playerMoney + moneyCurrency)).center();
        },

        loadMap: function () {

            this.groundGroup = this.game.add.group();
            this.buildingsGroup = this.game.add.group();

            this.map = this.game.add.tilemap('falcon');
            this.map.addTilesetImage("tileset tiled", "tileset tiled");
            console.log('::', this.map);

            var backgroundLayer = this.map.layers[0].data;
            var buildingsLayer = this.map.layers[1].data;

            var backgroundTiles = getTilesFromTilemap(backgroundLayer);
            // var buildingsTiles = getTilesFromTilemap(buildingsLayer);

            var backgroundWidth = backgroundLayer.length;
            var backgroundHeight = backgroundLayer[0].length;


            game.world.setBounds(440, 70, 2048, 2048);

            // var tileProperties = this.map.tilesets[0].tileProperties;
            // console.log(':7:', this.map.tilesets[0].tileProperties);

            var i = 0, tile;
            for (var iy = 0; iy <= backgroundWidth - 1; iy++) {
                for (var ix = 0; ix <= backgroundHeight - 1; ix++) {

                    var x = (ix + 1) * size;
                    var y = (iy + 1) * size;
                    var currentTile = backgroundTiles[iy][ix];

                    if (typeof(currentTile) === 'undefined') {
                        continue;
                    }

                    var tileTop = currentTile === 14 ? 0 : game.rnd.pick([2, 3, 4, 5]);

                    tile = game.add.isoSprite(
                        x,
                        y,
                        tileTop,
                        'tileset tiled',
                        currentTile - 1,
                        this.groundGroup
                    );

                    tile.tileX = ix;
                    tile.tileY = iy;

                    tile.anchor.set(0.5, 1);
                    tile.smoothed = false;
                    tile.initialZ = tileTop;
                    // tile.body.moves = false;

                    // Up tile for wood
                    if (currentTile === 20 + 1) {
                        tile.isoZ += 4;
                        tile.initialZ += 4;

                        // Put tile under bridge
                        var waterUnderBridge = this.game.add.isoSprite(x, y, 0, 'tileset tiled', 14, this.groundGroup);
                        waterUnderBridge.anchor.set(0.5, 1);
                        waterUnderBridge.initialZ = -4;
                        water.push(waterUnderBridge);
                    }
                    // For other
                    if (currentTile < 14 + 1) {
                        tile.scale.x = game.rnd.pick([-1, 1]);
                    }
                    // For water
                    if (currentTile === 14 + 1) {
                        water.push(tile);
                    }
                    i++;
                }
            }



            i = 0;
            for (iy = 0; iy <= backgroundWidth - 1; iy++) {
                for (ix = 0; ix <= backgroundHeight - 1; ix++) {


                    currentTile = buildingsLayer[iy][ix];

                    if (typeof(currentTile) === 'undefined' || currentTile.index === -1) {
                        continue;
                    }

                    x = (ix + 1 + 2) * size;
                    y = (iy + 1 - 2) * size;

                    tileTop = 7;

                    tile = game.add.isoSprite(
                        x,
                        y,
                        tileTop,
                        'houses',
                        currentTile - 1,
                        this.buildingsGroup
                    );

                    tile.tileX = ix;
                    tile.tileY = iy;

                    tile.anchor.set(0.5, 1);
                    tile.smoothed = false;
                    tile.initialZ = tileTop;

                    i++;
                }
            }





            this.game.iso.simpleSort(this.groundGroup);
        },
        loadCursors: function () {
            this.cursorPos = new Phaser.Plugin.Isometric.Point3();
            cursors = {
                up: game.input.keyboard.addKey(Phaser.Keyboard.UP),
                down: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
                left: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
                right: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),

                w: game.input.keyboard.addKey(Phaser.Keyboard.W),
                s: game.input.keyboard.addKey(Phaser.Keyboard.S),
                a: game.input.keyboard.addKey(Phaser.Keyboard.A),
                d: game.input.keyboard.addKey(Phaser.Keyboard.D)
            };
        },
        updateWater: function () {
            water.forEach(function (w) {
                w.isoZ = (-2 * Math.sin((game.time.now + (w.isoX * 7)) * 0.004)) + (-1 * Math.sin((game.time.now + (w.isoY * 8)) * 0.005));
                w.alpha = Phaser.Math.clamp(1 + (w.isoZ * 0.1), 0.2, 1);
            });
        },
        updateMoverment: function () {

            this.mouseMoverment();
            this.keyboardMoverment();

        },

        mouseMoverment: function () {
            if (game.input.activePointer.rightButton.isDown)
            {
                if (buildMode) {
                    this.cancelBuildMode();
                }
            }

            if (game.input.activePointer.leftButton.isDown)
            {
                if (buildMode) {
                    this.paintBuilding();
                } else {

                    var sizeAndHalfSize = 2*size;
                    // var sizeAndHalfSize = 5.5*size;
                    var cursorCenterX = this.cursorPos.x + sizeAndHalfSize;
                    var cursorCenterY = this.cursorPos.y + sizeAndHalfSize;

                    this.buildingsGroup.forEach(function (building) {
                        if (building.isoBounds.containsXY(cursorCenterX, cursorCenterY)) {
                            console.log(':house:');
                        }
                    });
                }
            }


        },

        paintBuilding: function () {

            if (playerMoney < buildingData.cost) {
                return false;
            }

            if (!canPlaceable) {
                return false;
            }

            playerMoney -= buildingData.cost;
            this.updatePlayerGUIData();

            var x = (selectedTile.x + 1 + 2 - 14) * size;
            var y = (selectedTile.y + 1 - 2 - 3.5) * size;


            game.add.isoSprite(
                x,
                y,
                7,
                'houses',
                0 - 1,
                this.buildingsGroup
            );

            this.cancelBuildMode();
        },

        cancelBuildMode: function () {
            buildMode = false;
            this.deselectTiles();
        },

        keyboardMoverment: function () {
            if (cursors.up.isDown || cursors.w.isDown) {
                game.camera.y -= 4;
                // test++;
                // console.log('::',test);
            }
            else if (cursors.down.isDown || cursors.s.isDown) {
                game.camera.y += 4;
                // test--;
                // console.log('::',test);
            }

            if (cursors.left.isDown || cursors.a.isDown) {
                game.camera.x -= 4;
            }
            else if (cursors.right.isDown || cursors.d.isDown) {
                game.camera.x += 4;
            }

        },

        selectTiles: function (height, width) {
            var self = this;
            canPlaceable = true;
            // Loop through all tiles
            this.groundGroup.forEach(function (tile) {

                var inBounds = self.selectedArea(height, width, tile);

                var waterIncludes = false;
                this.water.forEach(function (value) {
                    if (value.z === tile.z) {
                        waterIncludes = true;
                        if (inBounds) {
                            canPlaceable = false;
                        }
                    }
                });

                if (!tile.selected && inBounds && !waterIncludes) {
                    // If it does, do a little animation and tint change.

                    tile.selected = true;
                    if (!tile.inPath) {
                        tile.tint = 0x86bfda;
                    }
                    self.game.add.tween(tile).to({isoZ: tile.initialZ + 6}, 200, Phaser.Easing.Quadratic.InOut, true);
                }
                else if (tile.selected && !inBounds) {
                    // console.log('::',tile); edsf;
                    // If not, revert back to how it was.
                    tile.selected = false;
                    if (!tile.inPath) {
                        tile.tint = 0xffffff;
                    }
                    self.game.add.tween(tile).to({isoZ: tile.initialZ + 0}, 200, Phaser.Easing.Quadratic.InOut, true);
                }

            });

            return canPlaceable;
        },
        
        deselectTiles: function () {
            var self = this;
            this.groundGroup.forEach(function (tile) {
                if (tile.selected) {
                    tile.selected = false;
                        tile.tint = 0xffffff;
                    self.game.add.tween(tile).to({isoZ: tile.initialZ + 0}, 200, Phaser.Easing.Quadratic.InOut, true);
                }

            });
        },
        
        selectedArea: function (width, height, tile) {

            var sizeAndHalfSize = size + size / 2;
            var cursorOffsetX = (width * size) / 5;
            var cursorOffsetY = (height * size) / 5;
            var cursorCenterX = this.cursorPos.x + sizeAndHalfSize - cursorOffsetX;
            var cursorCenterY = this.cursorPos.y + sizeAndHalfSize - cursorOffsetY;

            var inBounds = false;

            for (var ix = 0; ix <= width - 1; ix++) {
                for (var iy = 0; iy <= height - 1; iy++) {
                    var xOffset = ix * size;
                    var yOffset = iy * size;

                    // console.log('::',size, yOffset);asd
                    if (tile.isoBounds.containsXY(cursorCenterX + xOffset, cursorCenterY + yOffset)) {
                        inBounds = true;

                        if (ix === 0 && iy === 0) {
                            selectedTile = {'x': tile.tileX, 'y': tile.tileY}
                        }
                    }
                }
            }

            return inBounds;
        }
    };

function getTilesFromTilemap(backgroundLayer) {
    var tilesBefore = [];

    var backgroundWidth = backgroundLayer.length;
    var backgroundHeight = backgroundLayer[0].length;

    for (var jj = 0; jj !== backgroundWidth; jj++) {
        tilesBefore[jj] = [];
        for (var ii = 0; ii !== backgroundHeight; ii++) {
            tilesBefore [jj][ii] = backgroundLayer[jj][ii].index;
        }
    }

    return tilesBefore;
}

function debugOnCreate(enabled) {
    if (enabled) {
        // we won't really be using IsoArcade physics,
        // but I've enabled it anyway so the debug bodies can be seen
        isoGroup = game.add.group();
        isoGroup.enableBody = true;
        isoGroup.physicsBodyType = Phaser.Plugin.Isometric.ISOARCADE;
    }
}

function debugRender(enabled) {
    game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");

    if (enabled) {
        isoGroup.forEach(function (tile) {
            game.debug.body(tile, 'rgba(189, 221, 235, 0.6)', false);
        });
    }
}


game.state.add('Boot', BasicGame.Boot);
game.state.start('Boot');
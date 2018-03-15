var windowWidth = 1280;
var windowHeight = 640;

var game = new Phaser.Game(windowWidth, windowHeight, Phaser.webGL, 'test', null, true, false);

var BasicGame = function (game) {
};

BasicGame.Boot = function (game) {
    // nothing here
};

var isoGroup, water = [];

var groundGroup = [];
var buildingsGroup = [];

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

var playerMoney = 100000;
var moneyCurrency = '$';

var playerGUI = {
    'money': null
};

var BOT_ONE = 1;
var BOT_TWO = 2;

var bunny;

var buildings = {
    'factory': {
        'width': 3,
        'height': 4,
        'name': 'factory',
        'cost': 5200,
        'type': 1
    },
    'test': {
        'width': 3,
        'height': 5,
        'name': 'test',
        'cost': 1,
        'type': 2
    },
    'house': {
        'width': 5,
        'height': 3,
        'name': 'house',
        'cost': 3000,
        'type': 3
    },
    'tavern': {
        'width': 4,
        'height': 6,
        'name': 'tavern',
        'cost': 12000,
        'type': 4
    }
};

var menus = {};

BasicGame.Boot.prototype =
    {
        preload: function () {

            game.time.advancedTiming = true;
            // game.debug.renderShadow = false;
            game.stage.disableVisibilityChange = true;

            game.plugins.add(new Phaser.Plugin.Isometric(game));

            slickUI = game.plugins.add(Phaser.Plugin.SlickUI);
            game.load.image('menu-button', 'data/assets/ui/menu.png');
            game.load.image('fullscreen-button', 'data/assets/ui/fullscreen.png');
            slickUI.load('data/assets/ui/kenney/kenney.json');

            this.load.tilemap('falcon', 'data/assets/tilemaps/falcon.json', null, Phaser.Tilemap.TILED_JSON);
            game.load.spritesheet("tileset tiled", "data/assets/tilemaps/tileset_tiled.png", 64, 64, 24);
            game.load.spritesheet("houses", "data/assets/tilemaps/houses.png", 320, 320, 4);

            game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);
            game.iso.anchor.setTo(0.5, 0.2);
        },

        create: function () {
            debugOnCreate(false);

            game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL; // EXACT_FIT; NO_SCALE;

            loadMap();
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

            if (bunny) {
                game.debug.spriteInputInfo(bunny, 32, 32);
                game.debug.geom(bunny.input._tempPoint, 'rgba(255,255,0,1)');
                game.debug.spriteBounds(bunny);
            }
        },


        updatePlayerGUIData: function () {
            // playerGUI.money.remove();
            playerGUI.moneyText.value = playerMoney + moneyCurrency;
            // playerGUI.money.add(new SlickUI.Element.Text(0,0, playerMoney + moneyCurrency)).center();
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
            // var self = this;

            // game.input.mouse.mouseWheelCallback = mouseWheel;function mouseWheel(event) {   console.log(game.input.mouse.wheelDelta);}

            if (game.input.activePointer.rightButton.isDown) {

                this.paintTile(); // TODO debug

                if (buildMode) {
                    this.cancelBuildMode();
                }
            }

            if (game.input.activePointer.leftButton.isDown) {
                if (buildMode) {
                    this.paintBuilding();
                } else {

                    // var sizeAndHalfSize = 2*size;
                    var cursorCenterX = this.cursorPos.x;
                    var cursorCenterY = this.cursorPos.y;

                    buildingsGroup.forEach(function (building) {
                        if (building.isoBounds.containsXY(cursorCenterX, cursorCenterY)) {
                            console.log(':house:', building);
                            // game.camera.focusOnXY(building.x, building.y);
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

            var x = (selectedTile.x) * size;
            var y = (selectedTile.y) * size;

            this.createBuilding(x, y, 7, buildingData.type);

            this.cancelBuildMode();
            this.game.iso.simpleSort(buildingsGroup);
        },

        paintTile: function () {

            // var x = (selectedTile.x) * size;
            // var y = (selectedTile.y) * size;
            var x = (this.cursorPos.x) ;
            var y = (this.cursorPos.y) ;

            // var tile = game.add.isoSprite(
            //     x,
            //     y,
            //     7,
            //     'houses',
            //     buildingData.type - 1,
            //     this.buildingsGroup
            // );

            bunny = game.add.sprite(x, y, 'houses', - 1);
            bunny.anchor.set(0.5, 1);

            bunny.inputEnabled = true;
            bunny.input.pixelPerfectOver = true;
            bunny.input.useHandCursor = true;

            // bunny = tile;

            console.log('::', bunny);

            // this.game.iso.simpleSort(this.buildingsGroup);

            // var tile = game.add.isoSprite(
            //     x,
            //     y,
            //     0,
            //     'tileset tiled',
            //     1 - 1,
            //     this.groundGroup
            // );
            // tile.autoCull = true;
            // tile.anchor.set(0.5, 1);
        },

        cancelBuildMode: function () {
            buildMode = false;
            this.deselectAllTiles();
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
            groundGroup.forEach(function (tile) {

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

        deselectAllTiles: function () {
            var self = this;
            groundGroup.forEach(function (tile) {
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

                        if (ix === width - 1 && iy === height - 1) {
                            selectedTile = {'x': tile.tileX + 1, 'y': tile.tileY + 1}
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
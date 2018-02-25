/// <reference path="phaser.js" />

// using canvas here just because it runs faster for the body debug stuff
var game = new Phaser.Game(1280, 640, Phaser.webGL, 'test', null, true, false);

var BasicGame = function (game) {
};

BasicGame.Boot = function (game) {
    // nothing here
};

var isoGroup, water = [];
var isDebug = false;
var cursors;
var size = 32;

var test = 0;

BasicGame.Boot.prototype =
    {
        preload: function () {

            game.time.advancedTiming = true;
            game.debug.renderShadow = false;
            game.stage.disableVisibilityChange = true;

            game.plugins.add(new Phaser.Plugin.Isometric(game));

            // game.load.atlasJSONHash('tileset', 'data/assets/tileset.png', 'data/assets/tileset.json');

            this.load.tilemap('falcon', 'data/assets/tilemaps/falcon.json', null, Phaser.Tilemap.TILED_JSON);
            // this.load.image("tileset tiled", 'data/assets/tilemaps/tileset_tiled.png');
            game.load.spritesheet("tileset tiled", "data/assets/tilemaps/tileset_tiled.png", 64, 64, 24);

            game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);
            game.iso.anchor.setTo(0.5, 0.2);
        },
        create: function () {
            debugOnCreate(true);
            this.groundGroup = this.game.add.group();
            this.cursorPos = new Phaser.Plugin.Isometric.Point3();

            this.map = this.game.add.tilemap('falcon');
            this.map.addTilesetImage("tileset tiled", "tileset tiled");
            console.log('::', this.map);

            // var tileProperties = this.map.tilesets[0].tileProperties;
            // console.log(':7:', this.map.tilesets[0].tileProperties);

            var backgroundLayer = this.map.layers[0].data;
            var tiles = getTilesFromTilemap(backgroundLayer);

            var backgroundWidth = backgroundLayer.length;
            var backgroundHeight = backgroundLayer[0].length;


            game.world.setBounds(440, 70, 2048, 1024);

            console.log(':tiles:', tiles);

            cursors = game.input.keyboard.createCursorKeys();
            this.game.input.keyboard.addKeyCapture([
                Phaser.Keyboard.LEFT,
                Phaser.Keyboard.RIGHT,
                Phaser.Keyboard.UP,
                Phaser.Keyboard.DOWN,
                Phaser.Keyboard.SPACEBAR
            ]);

            var i = 0, tile;
            for (var iy = 0; iy <= backgroundWidth - 1; iy++) {
                for (var ix = 0; ix <= backgroundHeight - 1; ix++) {

                    var x = (ix + 1) * size;
                    var y = (iy + 1) * size;
                    var currentTile = tiles[iy][ix];

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
            this.game.iso.simpleSort(this.groundGroup);
        },
        update: function () {

            this.updateWater();
            this.updateMoverment();
            this.game.iso.unproject(this.game.input.activePointer.position, this.cursorPos);
            this.selectTiles();


        },
        render: function () {
            debugRender(isDebug);
            // game.debug.cameraInfo(game.camera, 32, 32);
        },
        updateWater: function () {
            water.forEach(function (w) {
                w.isoZ = (-2 * Math.sin((game.time.now + (w.isoX * 7)) * 0.004)) + (-1 * Math.sin((game.time.now + (w.isoY * 8)) * 0.005));
                w.alpha = Phaser.Math.clamp(1 + (w.isoZ * 0.1), 0.2, 1);
            });
        },
        updateMoverment: function () {
            if (cursors.up.isDown) {
                game.camera.y -= 4;
                // test++;
                // console.log('::',test);
            }
            else if (cursors.down.isDown) {
                game.camera.y += 4;
                // test--;
                // console.log('::',test);
            }

            if (cursors.left.isDown) {
                game.camera.x -= 4;
            }
            else if (cursors.right.isDown) {
                game.camera.x += 4;
            }
        },

        selectTiles: function () {
            var self = this;
            // Loop through all tiles
            this.groundGroup.forEach(function (tile) {
                // var x = tile.isoX / this.size;
                // var y = tile.isoY / this.size;

                var inBounds = self.selectedArea(3, 4, tile);

                // var sizeAndHalfSize = this.size + this.size / 2;
                // var cursorCenterX = self.cursorPos.x + sizeAndHalfSize;
                // var cursorCenterY = self.cursorPos.y + sizeAndHalfSize;
                //
                // var inBounds = tile.isoBounds.containsXY(cursorCenterX, cursorCenterY);
                //
                // if (!inBounds) {
                //     inBounds = tile.isoBounds.containsXY(cursorCenterX + this.size, cursorCenterY);
                // }


                var waterIncludes = false;
                this.water.forEach(function (value) {
                    if (value.z === tile.z) {
                        waterIncludes = true;
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

                // if (!self.finding && self.game.input.activePointer.isDown && inBounds) {
                //     // Start path finding
                //     self.finding = true;
                //     var dp = self.dudePosition();
                //     self.easystar.findPath(dp.x, dp.y, x, y, self.processPath.bind(self));
                //     self.easystar.calculate();
                // }
            });
        },
        selectedArea: function (width, height, tile) {

            var sizeAndHalfSize = size + size / 2;
            var cursorOffsetX = ((width) * size) /5;
            var cursorOffsetY = ((height) * size) /5;
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
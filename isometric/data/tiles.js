/// <reference path="phaser.js" />

// using canvas here just because it runs faster for the body debug stuff
var game = new Phaser.Game(800, 400, Phaser.CANVAS, 'test', null, true, false);

var BasicGame = function (game) {
};

BasicGame.Boot = function (game) {
    // nothing here
};

var isoGroup, water = [];

BasicGame.Boot.prototype =
    {
        preload: function () {

            game.time.advancedTiming = true;
            game.debug.renderShadow = false;
            game.stage.disableVisibilityChange = true;

            game.plugins.add(new Phaser.Plugin.Isometric(game));

            game.load.atlasJSONHash('tileset', 'data/assets/tileset.png', 'data/assets/tileset.json');

            this.load.tilemap('falcon', 'data/assets/tilemaps/falcon.json', null, Phaser.Tilemap.TILED_JSON);
            // this.load.tilemap('level1', 'data/assets/tilemaps/level1.json', null, Phaser.Tilemap.TILED_JSON);

            // this.load.image("tileset tiled", 'data/assets/tilemaps/tileset_tiled.png');
            game.load.spritesheet("tileset tiled", "data/assets/tilemaps/tileset_tiled.png", 64, 64, 24);

            game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);
            game.iso.anchor.setTo(0.5, 0.1);
        },
        create: function () {
            // we won't really be using IsoArcade physics, but I've enabled it anyway so the debug bodies can be seen
            // isoGroup = game.add.group();
            // isoGroup.enableBody = true;
            // isoGroup.physicsBodyType = Phaser.Plugin.Isometric.ISOARCADE;

            this.map = this.game.add.tilemap('falcon');
            this.map.addTilesetImage("tileset tiled", "tileset tiled");
            // this.map2 = this.game.add.tilemap('level1');

            console.log('::', this.map);

            // var tileProperties = this.map.tilesets[0].tileProperties;
            // console.log(':7:', this.map.tilesets[0].tileProperties);

            var backgroundLayer = this.map.layers[0].data;
            var tiles = getTilesFromTilemap(backgroundLayer);

            var backgroundWidth = backgroundLayer.length;
            var backgroundHeight = backgroundLayer[0].length;

            var size = 32;

            console.log(':tiles:',tiles);

            var i = 0, tile;
            for (var iy = 0; iy <= backgroundHeight-1; iy++) {
                for (var ix = 0; ix <= backgroundWidth-1; ix++) {
            // for (var y = size; y <= game.physics.isoArcade.bounds.frontY - size; y += size) {
            //     for (var x = size; x <= game.physics.isoArcade.bounds.frontX - size - size; x += size) {

                    var x = (ix+1)*size+20;
                    var y = (iy+1)*size+20;
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
                        currentTile-1,
                        isoGroup
                    );

                    tile.anchor.set(0.5, 1);
                    tile.smoothed = false;
                    // tile.body.moves = false;

                    // Up tile for wood
                    if (currentTile === 20+1) {
                        tile.isoZ += 6;
                    }
                    // For other
                    if (currentTile < 14+1) {
                        tile.scale.x = game.rnd.pick([-1, 1]);
                    }
                    // For water
                    if (currentTile === 14+1) {
                        water.push(tile);
                    }
                    i++;
                }
            }
        },
        update: function () {
            water.forEach(function (w) {
                w.isoZ = (-2 * Math.sin((game.time.now + (w.isoX * 7)) * 0.004)) + (-1 * Math.sin((game.time.now + (w.isoY * 8)) * 0.005));
                w.alpha = Phaser.Math.clamp(1 + (w.isoZ * 0.1), 0.2, 1);
            });
        },
        render: function () {
            // isoGroup.forEach(function (tile) {
            //     game.debug.body(tile, 'rgba(189, 221, 235, 0.6)', false);
            // });
            game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
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
            // tilesBefore.push(backgroundLayer[jj][ii].index);
        }
    }

    return tilesBefore;
}

game.state.add('Boot', BasicGame.Boot);
game.state.start('Boot');
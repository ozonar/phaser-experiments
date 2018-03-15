function loadMap() {

    groundGroup = this.game.add.group();
    buildingsGroup = this.game.add.group();

    this.map = this.game.add.tilemap('falcon');
    // this.map.addTilesetImage("tileset tiled", "tileset tiled");
    console.log('::', this.map);

    var backgroundLayer = this.map.layers[0].data;
    var buildingsLayer = this.map.layers[1].data;

    var backgroundTiles = getTilesFromTilemap(backgroundLayer);
    // var buildingsTiles = getTilesFromTilemap(buildingsLayer);

    var backgroundWidth = backgroundLayer.length;
    var backgroundHeight = backgroundLayer[0].length;

    game.world.setBounds(0, 150, 2048, 2048);

    // var tileProperties = this.map.tilesets[0].tileProperties;
    console.log(':7:', this.map.tilesets[0].tileProperties);

    var tileProperties = this.map.tilesets[0].tileProperties;

    /** Creating tiles */
    var i = 0, tile;
    for (var iy = 0; iy <= backgroundWidth - 1; iy++) {
        for (var ix = 0; ix <= backgroundHeight - 1; ix++) {

            // var x = (ix + 1) * size;
            // var y = (iy + 1) * size;
            var currentTile = backgroundTiles[iy][ix];

            if (typeof(currentTile) === 'undefined') {
                continue;
            }

            var tileTop = currentTile === 14 ? 0 : game.rnd.pick([2, 3, 4, 5]);

            var params = [];
            var tileParams = [];
            if (tileParams = this.map.tilesets[0].tileProperties[currentTile-1]) {
                params.tileParams = tileParams
            } else {
                params.tileParams = [];
            }



            tile = createSprite(ix, iy, tileTop, currentTile, params);

            i++;
        }
    }


    /** Creating buildings */
    i = 0;
    for (iy = 0; iy <= backgroundWidth - 1; iy++) {
        for (ix = 0; ix <= backgroundHeight - 1; ix++) {


            currentTile = buildingsLayer[iy][ix];

            if (typeof(currentTile) === 'undefined' || currentTile.index === -1) {
                continue;
            }

            var x = (ix + 1 + 2) * size;
            var y = (iy + 1 - 2) * size;

            var params = {'owner': PLAYER_BOT_ONE};
            tile = createBuilding(x, y, 7, currentTile, params);
            tile.tileX = ix;
            tile.tileY = iy;

            i++;
        }
    }

    game.camera.x = ((backgroundWidth * size) - (windowWidth / 3)) / 2 - 200;
    game.camera.y = ((backgroundHeight * size) - (windowHeight / 3)) / 2 + 200;

    this.game.iso.simpleSort(groundGroup);
}

function createSprite(ix, iy, z, type, params) {

    var x = (ix + 1) * size;
    var y = (iy + 1) * size;


    var tile = game.add.isoSprite(
        x,
        y,
        z,
        'tileset tiled',
        type - 1,
        groundGroup
    );

    tile.tileX = ix;
    tile.tileY = iy;

    tile.anchor.set(0.5, 1);
    tile.smoothed = false;
    tile.initialZ = z;
    // tile.body.moves = false;

    if (params.tileParams) {
        for (var currParam in params.tileParams) {
            // console.log(':1:', currParam, params.tileParams[currParam]);

            if (currParam === 'noBuilding') {
                tile.noBuilding = 1;
            }
        }
    }
    // Up tile for wood
    if (type === 20 + 1) {
        tile.isoZ += 4;
        tile.initialZ += 4;

        // Put tile under bridge
        var waterUnderBridge = this.game.add.isoSprite(x, y, 0, 'tileset tiled', 14, groundGroup);
        waterUnderBridge.anchor.set(0.5, 1);
        waterUnderBridge.initialZ = -4;
        water.push(waterUnderBridge);
    }
    // For other
    if (type < 14 + 1) {
        tile.scale.x = game.rnd.pick([-1, 1]);
    }
    // For water
    if (type === 14 + 1) {
        water.push(tile);
    }
    return type;
}

 function createBuilding(x, y, z, type, params) {
    var tile = game.add.isoSprite(
        x,
        y,
        z,
        'houses',
        type - 1,
        buildingsGroup
    );
    tile.anchor.set(0.5, 1);

    tile.smoothed = false;
    tile.initialZ = z;

    tile.inputEnabled = true;
    tile.input.pixelPerfectOver = true;
    tile.input.useHandCursor = true;


    if (params['owner'] ) {
        tile.owner = PLAYER_BOT_ONE;
    }

    tile.events.onInputDown.add(function(r) {
        if (r.input.pointerOver()) {
            console.log('::', r);
            // the pointer is over the object's opaque area and is down
        }});

    return tile;
}

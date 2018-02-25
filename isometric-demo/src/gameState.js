'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tileset = require('assets/sprites/tileset.png');

var _tileset2 = _interopRequireDefault(_tileset);

var _tileset3 = require('assets/sprites/tileset.json');

var _tileset4 = _interopRequireDefault(_tileset3);

var _char = require('assets/sprites/char.png');

var _char2 = _interopRequireDefault(_char);

var _char3 = require('assets/sprites/char.json');

var _char4 = _interopRequireDefault(_char3);

var _object = require('assets/sprites/object.png');

var _object2 = _interopRequireDefault(_object);

var _object3 = require('assets/sprites/object.json');

var _object4 = _interopRequireDefault(_object3);

var _easystarjs = require('easystarjs');

var _easystarjs2 = _interopRequireDefault(_easystarjs);

var _map = require('map');

var _map2 = _interopRequireDefault(_map);

var _dude = require('dude');

var _dude2 = _interopRequireDefault(_dude);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var State = function (_Phaser$State) {
    _inherits(State, _Phaser$State);

    function State() {
        _classCallCheck(this, State);

        return _possibleConstructorReturn(this, (State.__proto__ || Object.getPrototypeOf(State)).apply(this, arguments));
    }

    _createClass(State, [{
        key: 'preload',
        value: function preload() {
            this.game.time.advancedTiming = true;
            this.game.debug.renderShadow = false;
            this.game.stage.disableVisibilityChange = true;

            this.game.plugins.add(new Phaser.Plugin.Isometric(this.game));

            this.game.load.atlasJSONHash('tileset', _tileset2.default, null, _tileset4.default);
            this.game.load.atlasJSONHash('char', _char2.default, null, _char4.default);
            this.game.load.atlasJSONHash('object', _object2.default, null, _object4.default);

            this.game.world.setBounds(0, 0, 2048, 2048);
            this.game.iso.anchor.setTo(0.5, 0.5);
        }
    }, {
        key: 'create',
        value: function create() {
            this.groundGroup = this.game.add.group();
            this.objectGroup = this.game.add.group();
            this.water = [];
            this.cursorPos = new Phaser.Plugin.Isometric.Point3();
            this.easystar = new _easystarjs2.default.js(); // eslint-disable-line new-cap
            this.finding = false;

            this.easystar.setGrid(_map2.default.walkable);
            this.easystar.setAcceptableTiles([1]);
            // this.easystar.enableDiagonals();
            // this.easystar.disableCornerCutting();

            // Generate ground
            for (var y = 0; y < _map2.default.ground.length; y += 1) {
                for (var x = 0; x < _map2.default.ground[y].length; x += 1) {
                    var tile = this.game.add.isoSprite(State.size * x, State.size * y, 0, 'tileset', _map2.default.groundNames[_map2.default.ground[y][x]], this.groundGroup);

                    // Anchor is bottom middle
                    tile.anchor.set(0.5, 1 - (tile.height - tile.width / 2) / tile.height);
                    tile.scale.x = _map2.default.direction[y][x];
                    tile.initialZ = 0;

                    if (_map2.default.ground[y][x] === 0) {
                        // Add to water tiles
                        tile.initialZ = -4;
                        this.water.push(tile);
                    }

                    if (_map2.default.ground[y][x] === 4) {
                        // Make bridge higher
                        tile.isoZ += 4;
                        tile.initialZ += 4;

                        // Put tile under bridge
                        var waterUnderBridge = this.game.add.isoSprite(State.size * x, State.size * y, 0, 'tileset', _map2.default.groundNames[0], this.groundGroup);
                        waterUnderBridge.anchor.set(0.5, 1);
                        waterUnderBridge.initialZ = -4;
                        this.water.push(waterUnderBridge);
                    }
                }
            }

            // Generate objects
            for (var _y = 0; _y < _map2.default.object.length; _y += 1) {
                for (var _x = 0; _x < _map2.default.object[_y].length; _x += 1) {
                    if (_map2.default.object[_y][_x] !== 0) {
                        var _tile = this.game.add.isoSprite(State.size * _x, State.size * _y, 0, 'object', _map2.default.objectNames[_map2.default.object[_y][_x]], this.objectGroup);

                        // Anchor is bottom middle
                        _tile.anchor.set(0.5, 1);
                        _tile.initialZ = 0;
                    }
                }
            }

            this.game.iso.simpleSort(this.groundGroup);

            // Create dude
            this.dude = new _dude2.default(this.game, State.startPosition);
            this.objectGroup.add(this.dude.sprite);
            this.game.camera.follow(this.dude.sprite);
        }
    }, {
        key: 'update',
        value: function update() {
            var self = this;

            // Update the cursor position.
            //
            // It's important to understand that screen-to-isometric projection means
            // you have to specify a z position manually, as this cannot be easily
            // determined from the 2D pointer position without extra trickery.
            //
            // By default, the z position is 0 if not set.
            this.game.iso.unproject(this.game.input.activePointer.position, this.cursorPos);

            // Loop through all tiles
            this.groundGroup.forEach(function (tile) {
                var x = tile.isoX / State.size;
                var y = tile.isoY / State.size;
                var inBounds = tile.isoBounds.containsXY(self.cursorPos.x, self.cursorPos.y);

                // Test to see if the 3D position from above intersects
                // with the automatically generated IsoSprite tile bounds.
                if (!tile.selected && inBounds && !self.water.includes(tile)) {
                    // If it does, do a little animation and tint change.
                    tile.selected = true;
                    if (!tile.inPath) {
                        tile.tint = 0x86bfda;
                    }
                    self.game.add.tween(tile).to({ isoZ: tile.initialZ + 4 }, 200, Phaser.Easing.Quadratic.InOut, true);
                } else if (tile.selected && !inBounds) {
                    // If not, revert back to how it was.
                    tile.selected = false;
                    if (!tile.inPath) {
                        tile.tint = 0xffffff;
                    }
                    self.game.add.tween(tile).to({ isoZ: tile.initialZ + 0 }, 200, Phaser.Easing.Quadratic.InOut, true);
                }

                if (!self.finding && self.game.input.activePointer.isDown && inBounds) {
                    // Start path finding
                    self.finding = true;
                    var dp = self.dudePosition();
                    self.easystar.findPath(dp.x, dp.y, x, y, self.processPath.bind(self));
                    self.easystar.calculate();
                }
            });

            this.water.forEach(function (w) {
                var waterTile = w;
                waterTile.isoZ = waterTile.initialZ + -2 * Math.sin((self.game.time.now + waterTile.isoX * 7) * 0.004) + -1 * Math.sin((self.game.time.now + waterTile.isoY * 8) * 0.005);
                waterTile.alpha = Phaser.Math.clamp(1 + waterTile.isoZ * 0.1, 0.2, 1);
            });

            if (this.isMoving) {
                this.move();
            }

            this.game.iso.simpleSort(this.objectGroup);
        }
    }, {
        key: 'render',
        value: function render() {
            this.game.debug.text(this.game.time.fps || '--', 2, 14, '#a7aebe');
            this.game.debug.cameraInfo(this.game.camera, 2, 32, '#a7aebe');
        }
    }, {
        key: 'processPath',
        value: function processPath(path) {
            this.finding = false;
            if (!path || path.length === 0) {
                return;
            }

            // Keep moving if already moving towards same direction;
            if (this.isMoving && this.pathIndex < this.path.length && path.length > 1 && this.path[this.pathIndex].x === path[1].x && this.path[this.pathIndex].y === path[1].y) {
                this.pathIndex = 1;
            } else {
                this.pathIndex = 0;
            }

            this.isMoving = true;

            // Loop tiles
            this.groundGroup.forEach(function (t) {
                var tile = t;
                if (tile.inPath) {
                    // Clear tint from previous path
                    tile.tint = 0xffffff;
                }
                var x = tile.isoX / State.size;
                var y = tile.isoY / State.size;
                var inPath = path.some(function (point) {
                    return point.x === x && point.y === y;
                });
                if (inPath) {
                    tile.tint = 0xaa3333;
                    tile.inPath = true;
                } else {
                    tile.inPath = false;
                }
            });
            this.path = path;
        }
    }, {
        key: 'dudePosition',
        value: function dudePosition() {
            return {
                x: Math.round(this.dude.x / State.size + 0.5),
                y: Math.round(this.dude.y / State.size + 0.5)
            };
        }
    }, {
        key: 'move',
        value: function move() {
            if (!this.path || this.pathIndex === this.path.length) {
                // No path or finished moving
                this.isMoving = false;
                this.path = null;
                this.dude.stop();
                return;
            }
            var target = this.path[this.pathIndex];
            var x = this.dude.x + State.size / 2 - target.x * State.size;
            var y = this.dude.y + State.size / 2 - target.y * State.size;
            if (x === 0 && y === 0) {
                // Reached next tile
                this.pathIndex += 1;
            } else if (x < 0 && y === 0) {
                this.dude.x += 1;
                this.dude.play('walkFrontLeft');
            } else if (x > 0 && y === 0) {
                this.dude.x -= 1;
                this.dude.play('walkBackLeft');
            } else if (x === 0 && y < 0) {
                this.dude.y += 1;
                this.dude.play('walkFrontRight');
            } else if (x === 0 && y > 0) {
                this.dude.y -= 1;
                this.dude.play('walkBackRight');
            }
        }
    }], [{
        key: 'size',
        get: function get() {
            return 36;
        }
    }, {
        key: 'startPosition',
        get: function get() {
            return {
                x: State.size * (11 - 0.5),
                y: State.size * (11 - 0.5)
            };
        }
    }]);

    return State;
}(Phaser.State);

exports.default = State;
var Config = {
    'squareSide': 42,
    'keyState': {
        'up': true,
        'down': true,
        'left': true,
        'right': true
    },
    'windowSize': {
        'width': 504,
        'height': 504
    },
    'textSpeed': 150,
    'animationSpeed': 150,
};

var Map = {
    width: 12,
    height: 12,
    tiles: [],
    fog: [],
    nextSign: null,
    wall: ["wall", {
        'sprite': 'tileWall',
        'events': []
    }]
};

var setupMap = function() {
    // Fill the map with a two-dimensional array of tiles. Pre-populate

    for (x = 0; x < Map.width; x++) {
        var tileRow = [];
        var fogRow = [];

        for (y = 0; y < Map.height; y++) {
            var tile = _.sample(_.pairs(TileTypes));

            if (_.random(1,100) > 80) {
                tile = ["wall", {
                    'sprite': 'tileWall',
                    'events': []
                }];
            }

            var choice = _.random(80)
            if (choice < 5) {
                var tile = ['coffee', TileTypes['coffee']];
            }
            else if (choice < 7) {
                var tile = ['espresso', TileTypes['espresso']];
            }
            else if (choice < 12) {
                var tile = ['sale', TileTypes['sale']];
            }
            else if (choice < 15) {
                var tile = ['taxes', TileTypes['taxes']];   
            }
            else {
                var tile = ['street', TileTypes['street']];      
            }

            var sprite = game.add.sprite(x * Config.squareSide, y * Config.squareSide, tile[1].sprite);
            var tileFog = game.add.sprite(x * Config.squareSide, y * Config.squareSide, 'tileFog');

            tileRow.push({
                type: tile[0],
                sprite: sprite
            });

            fogRow.push(tileFog);
        }

        Map.tiles.push(tileRow);
        Map.fog.push(fogRow);
    }

    Map.nextSign = game.add.sprite((x - 1) * Config.squareSide, (y - 1) * Config.squareSide, 'sign');
};


var main = {
    preload: function() {
        // This function will be executed at the beginning
        // That's where we load the game's assets

        game.load.image('player', 'img/player.png');
        Tile.preload(game);
    },

    create: function() {
        // This function is called after the preload function
        // Here we set up the game, display sprites, etc.

        setupMap();

        this.cursors = game.input.keyboard.createCursorKeys();
        this.player = game.add.sprite(0, 0, 'player');
        State.changeTile(0, 0, 'street');
        State.changeTile(Map.width - 1, Map.height - 1, 'street');
        State.changeLocation(0,0);
    },

    update: function() {
        // This function is called 60 times per second
        // It contains the game's logic

            if ( State.keysLocked ) return

            if (this.cursors.right.isUp) {
                if (!Config.keyState.right) {
                    Config.keyState.right = true;
                }
            }

            if (this.cursors.left.isUp) {
                if (!Config.keyState.left) {
                    Config.keyState.left = true;
                }
            }

            if (this.cursors.up.isUp) {
                if (!Config.keyState.up) {
                    Config.keyState.up = true;
                }
            }

            if (this.cursors.down.isUp) {
                if (!Config.keyState.down) {
                    Config.keyState.down = true;
                }
            }

            if (this.cursors.right.isDown) {
                State.keysLocked = false;
                if (Config.keyState.right) {
                    Config.keyState.right = false;
                    State.changeLocation(1,0);
                    return;
                }
            }

            if (this.cursors.left.isDown) {
                State.keysLocked = false;
                if (Config.keyState.left) {
                    Config.keyState.left = false;
                    State.changeLocation(-1,0);
                    return;
                }
            }
            if (this.cursors.up.isDown) {
                State.keysLocked = false;
                if (Config.keyState.up) {
                    Config.keyState.up = false;
                    State.changeLocation(0,-1);
                    return;
                }
            }
            if (this.cursors.down.isDown) {
                State.keysLocked = false;
                if (Config.keyState.down) {
                    Config.keyState.down = false;
                    State.changeLocation(0,1);
                    return;
                }
            }
    },
};

var Messages = {
    notEnoughMoney: "You can't afford it!",
    notEnoughCaffeine: "You're out of caffeine!",
};


var State = {

    money: 100,
    caffeine: 10,
    playerX: 0,
    playerY: 0,
    level: 1,
    keysLocked: false,

    errors: [],

    turn: function() {

        if ( State.caffeine == 0 ) {
            UI.gameOver()
        }

        State.changeCaffeine(-1)

    },

    changeMoney: function(mod) {
        if (this.errors.length) {
            return;
        }

        if (this.money + mod < 0) {
            this.errors.push(Messages.notEnoughMoney);
        } else {
            this.money += mod;
        }
    },

    changeCaffeine: function(mod) {
        if (this.errors.length) {
            return;
        }

        if (this.caffeine + mod < 0) {
            this.errors.push(Messages.notEnoughCaffeine);
        } else {
            this.caffeine += mod;
        }
    },

    changeTile: function(x, y, tiletype) {
        Map.tiles[x][y].sprite.kill();

        var tile = TileTypes[tiletype];
        Map.tiles[x][y].type = tiletype;
        Map.tiles[x][y].sprite = game.add.sprite(x * Config.squareSide, y * Config.squareSide, tile.sprite);

        main.player.bringToTop();
    },

    changeLocation: function(modx, mody) {
        // if Map.tiles[baseX][baseY]

        if (this.errors.length) {
            return;
        }

        newX = main.player.position.x + Config.squareSide*modx;
        newY = main.player.position.y + Config.squareSide*mody;
        tileX = newX / Config.squareSide;
        tileY = newY / Config.squareSide;
        moved = false;

        moved = (modx && newX > -1 && newX < Config.windowSize.width) || (mody && newY > -1 && newY < Config.windowSize.height);
        var unfog = function(baseX, baseY) {
            if (Map.fog[baseX] !== undefined) {
                if (Map.fog[baseX][baseY] !== undefined) {
                    tween = game.add.tween(Map.fog[baseX][baseY]).to( { alpha: 0 }, Config.animationSpeed, Phaser.Easing.Linear.None, true, 0, 0, false)
                    tween.onComplete.add(function(){
                        Map.fog[baseX][baseY].destroy();
                    }, this);
                }
            }
        };

        var lookForNextLevel = function() {
            if (newX === (Config.windowSize.height - Config.squareSide) &&
                newY === (Config.windowSize.width - Config.squareSide)) {
                    // TODO: tween this?
                    Map.tiles = [];
                    Map.fog = [];

                    Map.nextSign.destroy();

                    setupMap();

                    main.player = game.add.sprite(0, 0, 'player');
                    State.changeLocation(-11, -11);
                    State.playerX = 0
                    State.playerY = 0

                    State.level = State.level + 1;
                    State.changeLocation(0,0);
                    UI.update();
            }
        }

        var setupTileEvent = function() {
            return Event.create( _.sample(TileTypes[Map.tiles[State.playerX][State.playerY].type].events) );
        }

        _.each([tileX - 1, tileX, tileX + 1], function(element, index, list) {
            var cx = element;
            _.each([tileY - 1, tileY, tileY + 1], function(element, index, list) {
                var cy = element;
                unfog(cx, cy);
            });
        });


        if (moved) {

            State.keysLocked = true;

            if (modx) {
                tween = game.add.tween(main.player).to( { x: newX }, Config.animationSpeed, Phaser.Easing.Linear.None, true, 0, 0, false)
                tween.onComplete.add(function(){
                    State.keysLocked = false;
                    lookForNextLevel()
                    setupTileEvent()
                    State.turn();
                }, this);    
                State.playerX += modx;
            }

            if (mody) {
                tween = game.add.tween(main.player).to( { y: newY }, Config.animationSpeed, Phaser.Easing.Linear.None, true, 0, 0, false)
                tween.onComplete.add(function(){
                    if (modx) return;
                    State.keysLocked = false;
                    lookForNextLevel()
                    setupTileEvent()
                    State.turn();
                }, this);  
                State.playerY += mody;
            }

        }
    }
};

var Event = {

    events: {
        coffee: {
            name: "Coffee shop",
            run: function(event) {
                State.changeMoney(-2);
                State.changeCaffeine(3);
                State.changeTile(event.x, event.y, "closed");
                return "Bought a coffee! -$2 , +3 caffeine";
            }
        },
        espresso: {
            name: "Espresso shop",
            run: function(event) {
                State.changeMoney(-8);
                State.changeCaffeine(10);
                State.changeTile(event.x, event.y, "closed");
                return "Bought an espresso! -$8 , +10 caffeine";
            }
        },
        sale: {
            name: "Sale",
            run: function(event) {
                var money = _.random(50,500)
                var caffeine = Math.floor(money / 50)
                State.changeMoney(money);
                State.changeCaffeine(-caffeine);
                State.changeTile(event.x, event.y, "street");
                return "Made a sale! +$"+ money +" , -"+ caffeine +" caffeine";
            }
        },
        taxes: {
            name: "Taxes",
            run: function(event) {
                var money = Math.floor(_.random(5,10) * State.money / 100)
                State.changeMoney(-money);
                State.changeTile(event.x, event.y, "street");
                return "You have to pay tax! -$"+ money;
            }
        },
        street: {
            name: "Street",
            run: function() { return false; }
        },
        closed: {
            name: "Shop",
            run: function() { return "We're closed!"; }
        },
    },

    create: function(name) {
        var ev = this.events[name];
        if (!ev) { return false; }

        var msg = ev.run({ x:State.playerX, y:State.playerY, eventName:name });

        UI.update();

        var err = [];

        if (State.errors.length) {
            _.each(State.errors, function(i, e) {
                UI.message(i, 'error', ev.name);
                err.push(i);
                State.errors.pop(i);
            });
            return err;
        }

        if (msg) {
            UI.message(msg, '', ev.name);
        }
    },

};

var Tile = {

    sprites: {
        tileStreet: "img/tile-street.png",
        tileCoffee: "img/tile-coffee1.png",
        tileEspresso: "img/tile-coffee2.png",
        tileBuilding: "img/tile-building.png",
        tileClosed: "img/tile-closed.png",
        tileMoney: "img/tile-cash.png",
        tileTaxes: "img/tile-taxes.png",
        tileFog: "img/tile-fog.png",
        tileWall: "img/tile-wall.png",
        sign: "img/sign.png"
    },

    preload: function(game) {
        _.each(this.sprites, function(i, e) {
            game.load.image(e, i);
        });
    }

};


var TileTypes = {
    'street': {
        'sprite': 'tileStreet',
        'events': ['street']
    },
    'coffee': {
        'sprite': 'tileCoffee',
        'events': ['coffee']
    },
    'closed': {
        'sprite': 'tileClosed',
        'events': ['closed']
    },
    'espresso': {
        'sprite': 'tileEspresso',
        'events': ['espresso']
    },
    'taxes': {
        'sprite': 'tileTaxes',
        'events': ['taxes']
    },
    'sale': {
        'sprite': 'tileMoney',
        'events': ['sale']
    }
};

var UI = {

    message: function(msg, type, title) {

        var li = $('<li></li>').text(msg);
        if (title) {
            li.prepend('<span>'+ title +'</span>')
        }
        if (type) {
            li.addClass(type);
        }
        $('#messages ul').prepend(li);
        li.slideUp(0).slideDown(Config.textSpeed);
    },

    gameOver: function() {
        $('#gameOver').fadeIn()
        $('#scoreValue').text(State.level * State.money)
        State.keysLocked = true
    },

    update: function() {
        Effects.updateValue('#moneyValue', State.money)
        Effects.updateValue('#caffeineValue', State.caffeine)
        Effects.updateValue('#levelValue', State.level)
    },

    updateFast: function() {
        $('#moneyValue').text(State.money);
        $('#caffeineValue').text(State.caffeine);
        $('#levelValue').text(State.level);
    }

}

var game = new Phaser.Game(Config.windowSize.width, Config.windowSize.height, Phaser.AUTO, 'coffee');

$(function() {

    game.state.add('main', main);
    game.state.start('main');
    UI.updateFast();

});

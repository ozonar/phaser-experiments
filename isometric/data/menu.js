function buildMenu() {


    var buttonGroup = [];
    // Build list
    var startY = 40;
    for (var building in buildings) {
        (function() {
            var buildingValues = buildings[building];

            buttonGroup.push({
                id: buildingValues.name,
                    text: "Build " + buildingValues.name + ' | ' + buildingValues.cost + moneyCurrency,
                font: {
                size : '20px',
                    family: 'Calibri'
            },
                component: 'Button',
                position: {x: 0, y: startY},
                width: 240,
                height: 40,
                type: 'buildings',
                click: function () {
                    console.log('::');
                }

            });
            startY += 50;

        })();
    }

    var guiObj = {
        id: 'main',
        component: 'Window',
        header: { id: 'ttl', skin: 'blueheader', position: { x: 0, y: 0 }, height: 40, text: 'Title' },
        draggable: true,
        padding: 4,
        position: { x: 50, y: 0 },
        width: 600,
        height: 550,


        layout: [1, 3],
        children: buttonGroup

    };

    EZGUI.renderer = Phaser.webGL;

    //load EZGUI themes here you can pass multiple themes
    EZGUI.Theme.load(['data/assets/ui/kenney-theme/kenney-theme.json'], function () {
        //create the gui
        var guiContainer = EZGUI.create(guiObj, 'kenney');

        cpn = EZGUI.components;
        for (component in EZGUI.components) {
        // EZGUI.components.each(function (component) {
            var button = EZGUI.components[component];
            if (button && button.settings.type && button.settings.type === 'buildings') {
                button.on('click', function (event) {
                    console.log('clicked', event);
                });
            }
        }

        // EZGUI.components.bakery.on('click', function (event) {
        //     console.log('clicked', event);
        // });
    });

}

function loadMenu () {
    var button, panel, menuButton;
    /** @namespace SlickUI.Element */

    // Paint panel and text
    slickUI.add(panel = new SlickUI.Element.Panel(game.width - 256, 8, 250, game.height - 16));
    panel.add(new SlickUI.Element.Text(10,0, "Build")).centerHorizontally().text.alpha = 0.5;

    // Build list
    var startY = 40;
    for (var building in buildings) {
        (function() {
            var buildingValues = buildings[building];

            panel.add(button = new SlickUI.Element.Button(0, startY, 240, 40)).events.onInputUp.add(function () {

                if (buildingValues.cost > playerMoney) {
                    return false;
                }

                buildMode = {'x': buildingValues.width, 'y': buildingValues.height};
                panel.visible = false;
                menuButton.visible = true;
                buildingData = buildingValues;
            });
            button.add(new SlickUI.Element.Text(0,0, "Build " + buildingValues.name + '| ' + buildingValues.cost + moneyCurrency)).center();

            startY += 50;
        })();
    }

    // Paint close button
    panel.add(button = new SlickUI.Element.Button(0,game.height - 76, 240, 40)).events.onInputUp.add(function () {
        buildMode = false;
        panel.visible = false;
        menuButton.visible = true;
    });
    button.add(new SlickUI.Element.Text(0,0, "Close")).center();

    panel.visible = false;
    var basePosition = panel.x;

    // Money button
    slickUI.add(playerGUI.money = new SlickUI.Element.Panel(185, 8, 140, 40));
    playerGUI.money.add(playerGUI.moneyText = new SlickUI.Element.Text(0,0, playerMoney + moneyCurrency)).center();

    // Fullscreen button
    slickUI.add(menuButton = new SlickUI.Element.DisplayObject(game.width - 91, 8, game.make.sprite(0, 0, 'fullscreen-button')));
    menuButton.inputEnabled = true;
    menuButton.input.useHandCursor = true;
    menuButton.events.onInputDown.add(function () {
        if (game.scale.isFullScreen) {
            game.scale.stopFullScreen();
        } else {
            game.scale.startFullScreen(false);
        }
    }, this);


    // Menu button
    slickUI.add(menuButton = new SlickUI.Element.DisplayObject(game.width - 45, 8, game.make.sprite(0, 0, 'menu-button')));
    menuButton.inputEnabled = true;
    menuButton.input.useHandCursor = true;
    menuButton.events.onInputDown.add(function () {
        if(panel.visible) {
            return;
        }
        panel.visible = true;
        panel.x = basePosition + 156;
        game.add.tween(panel).to( {x: basePosition}, 500, Phaser.Easing.Exponential.Out, true).onComplete.add(function () {
            menuButton.visible = false;
        });
        slickUI.container.displayGroup.bringToTop(panel.container.displayGroup);
    }, this);

    //
    button.events.onInputUp.add(function () {
        game.add.tween(panel).to( {x: basePosition + 156}, 500, Phaser.Easing.Exponential.Out, true).onComplete.add(function () {
            panel.visible = false;
            panel.x -= 156;
        });
        menuButton.visible = true;
    });

    menus.menuButton = menuButton;
}
function init(val) {

    // Automata
    var automata = new Automata(document.getElementById('automata' + (val || '')), {
        size: {
            height: 100,
            width: 350
        },
        step: 3
    });

    // Layer
    var layer = automata.addCellularLayer('layer-0'),
        random = [],
        i, j;

    for (i = 0; i < automata.getSize().width; i++) {
        for (j = 0; j < automata.getSize().height; j++) {
            if (Math.round(Math.random())) {
                random.push({
                    position: {
                        x: i,
                        y: j   
                    }
                });
            }
        }
    }

    layer.addCells(random);

    automata.repaint();

    document.getElementById('automata-next').onclick = function() {
        automata.next();
        automata.repaint();
    }

    document.getElementById('automata-start').onclick = function() {
        if (automata.isStarted()) {
            automata.pause();
        } else {
            automata.start();
        }
    }

    console.log(automata);

    // if (!val) {
    //     init('-2')
    // }
}


function nextGrid() {
    log('next');
    if (grid && !grid.isStarted()) {
        grid.next();
    }
}

function _init() {
    var canvas = document.getElementById("canvas"),
        step = document.getElementById("grid-step"),
        height = document.getElementById("grid-height"),
        width = document.getElementById("grid-width"),
        showGrid = document.getElementById("grid-show-grid"),
        randomFillColor = document.getElementById("grid-random-fill-color");

    // Log
    logEl = document.getElementById("log");

    // ShowGrid
    showGrid.addEventListener('change', function() {
        log('showGrid(' + showGrid.checked + ')');
        grid.setShowGrid(showGrid.checked);
    });

    // RandomFillColor
    randomFillColor.addEventListener('change', function() {
        if (randomFillColor.checked) {
            grid.fillColorFn = getRandomColor;
        } else {
            grid.fillColorFn = getBlackColor;
        }
        grid.repaint();
    })

    // gridStep
    height.addEventListener('change', function() {
        log('setHeight(' + height.value + ')');
        grid.setHeight(parseInt(height.value));
    });

    // gridStep
    width.addEventListener('change', function() {
        log('setWidth(' + width.value + ')');
        grid.setWidth(parseInt(width.value));
    });

    // gridStep
    step.addEventListener('change', function() {
        log('setStep(' + step.value + ')');
        grid.setStep(parseInt(step.value));
    });

    // Grid
    grid = new Grid({
        step: parseInt(step.value),
        height: parseInt(height.value),
        width: parseInt(width.value),
        fillColorFn: getRandomColor,
        showGrid: showGrid.checked,
        canvas: canvas
    });

    grid.on('celldown', function(cell, event) {
        log('cell(' + cell.x + ', ' + cell.y + ').setStatus(' + !cell.status + ')');
        cell.invert();
        grid.repaint();
    });

    grid.on('cellenter', function(cell, event) {
        if (event.which && !cell.status) {
            cell.invert();
            grid.repaint();
        }
    });

    loadPatterns();
}

function getBlackColor() {
    return '#000000';
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function createPatternButtonEl(name) {
    var ptnEl = document.getElementById('patterns'),
        divEl = document.createElement('div'),
        btnEl = document.createElement('button');

    ptnEl.appendChild(divEl);
    divEl.appendChild(btnEl);
    btnEl.innerHTML = name;
    btnEl.onclick = function() {
        setGridPattern(name);
    }

    return btnEl;
}

function loadPatterns() {
    var name;

    for (name in patterns) {
        createPatternButtonEl(name)
    }
}

function startGrid(button) {
    if (grid) {
        if (grid.isStarted()) {
            log('pause');
            grid.stop();
            button.innerHTML = 'Resume';
        } else {
            log('resume');
            grid.start();
            // grid.recording();
            button.innerHTML = 'Pause';
        }
    }
}

// function nextGrid() {
//     log('next');
//     if (grid && !grid.isStarted()) {
//         grid.next();
//     }
// }

function clearGrid() {
    log('clear');
    if (grid) {
        grid.clear();
    }
}

function randomPattern() {
    log('random');
    if (grid) {
        grid.random();
    }
}

function moveGridLeft() {
    log('move left')
    if (grid) {
        grid.move(-1, 0);
    }
}

function moveGridRight() {
    log('move right')
    if (grid) {
        grid.move(1, 0);
    }
}

function moveGridUp() {
    log('move up')
    if (grid) {
        grid.move(0, -1);
    }
}

function moveGridDown() {
    log('move down')
    if (grid) {
        grid.move(0, 1);
    }
}

function logPattern() {
    log('log pattern into the console');
    if (grid) {
        console.log(grid.getPattern());
    }
}

function setGridPattern(name) {
    log('set "' + name + '" pattern')
    if (grid) {
        grid.setPattern(patterns[name]);
    }
}

function savePattern() {
    log('save pattern');
    if (grid) {
        var name = prompt('Nom du pattern'),
            pattern = grid.getPattern();

        // Empty
        if (name === null) {
            return;
        }

        // Button
        if (!patterns[name]) {

            // Button
            createPatternButtonEl(name);
        }

        // Register
        patterns[name] = pattern;
    }
}

function log(text) {
    document.getElementById("log").innerHTML += '<div class="line">' + text + '</div>';
}

function init() {

    // Automata
    var automata = new Automata(document.getElementById('automata'), {
        started: false,
        height: 100,
        width: 100,
        step: 10
    });

    // Layer
    var layer = automata.addCellularLayer({
        id: 'layer-0',
        color: 'black',
        patterns: {
            'clock': function() {
                return clockPattern;
            },
            'galaxy': function() {
                return galaxyPattern
            },
            'spacefiller': function() {
                return spacefillerPattern
            },
            'pulsar': function() {
                return pulsarPattern
            },
            'gosperplaneurgun': function() {
                return gosperPlaneurGunPattern;
            },
            'random': function() {
                var random = [],
                    i, j;

                for (i = 0; i < automata.getSize().width; i++) {
                    for (j = 0; j < automata.getSize().height; j++) {
                        if (Math.round(Math.random())) {
                            random.push({
                                x: i,
                                y: j
                            });
                        }
                    }
                }

                // Load
                return random;
            }
        },
        colors: {
            'black': function() {
                return '#00000099';
            },
            'green': function() {
                return '#00990099';
            },
            'random': function() {
                return 'rgb(' + Math.floor(Math.random() * 255) + ', ' + Math.floor(Math.random() * 255) + ', ' + Math.floor(Math.random() * 255) + ')';
            },
            'v-gradient': function(cell) {
                var height = cell.getLayer().getAutomata().getOption('height'),
                    gradient = cell.getOption('y') / height;

                return 'rgba(0, 0, 0, ' + gradient + ')';
            },
            'h-gradient': function(cell) {
                var width = cell.getLayer().getAutomata().getOption('width'),
                    gradient = cell.getOption('x') / width;

                return 'rgba(0, 0, 0, ' + gradient + ')';
            }
        }
    });

    // Width
    automata.bind('width', {
        scope: document.getElementById('automata-width'),
        set: function(width) {
            log('change width to ' + width);
            this.value = width;
        },
        get: function() {
            return this.value;
        }
    });

    // Height
    automata.bind('height', {
        scope: document.getElementById('automata-height'),
        set: function(height) {
            log('change height to ' + height);
            this.value = height;
        },
        get: function() {
            return this.value;
        }
    });

    // Step
    automata.bind('step', {
        scope: document.getElementById('automata-step'),
        set: function(step) {
            log('change step to ' + step);
            this.value = step;
        },
        get: function() {
            return this.value;
        }
    });

    // Started
    automata.bind('started', {
        scope: document.getElementById('automata-started'),
        set: function(checked) {
            this.checked = checked;
        },
        get: function() {
            return this.checked;
        }
    });

    // Layer
    layer.bind('pattern', {
        scope: document.getElementById('automata-pattern'),
        set: function(value)  {
            if (value) {
                log('change pattern to ' + value);
            }
            this.value = value;
        },
        get: function(value) {
            return this.value
        }
    });

    // Layer
    layer.bind('color', {
        scope: document.getElementById('automata-color'),
        set: function(value)  {
            log('change color to ' + value);
            this.value = value;
        },
        get: function(value) {
            return this.value
        }
    });

    // Repaint
    automata.repaint();
}

function log(text) {
    document.getElementById("log").innerHTML += '<div class="line">' + text + '</div>';
}

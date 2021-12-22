function init() {

    // Automata
    var automata = new Automata.Automata(document.getElementById('automata'), {
        started: false,
        delay: 100,
        height: 100,
        width: 100,
        step: 10
    });

    // Layer
    automata.addCellularLayer({
        id: 'layer-0',
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
        pattern: 'random',
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
        },
        color: 'random'
    });

    // Width
    automata.bind('delay', {
        element: document.getElementById('automata-delay'),
        set: function(delay) {
            this.value = delay;
        },
        get: function() {
            return this.value;
        }
    });

    // Width
    automata.bind('width', {
        element: document.getElementById('automata-width'),
        set: function(width) {
            this.value = width;
        },
        get: function() {
            return this.value;
        }
    });

    // Height
    automata.bind('height', {
        element: document.getElementById('automata-height'),
        set: function(height) {
            this.value = height;
        },
        get: function() {
            return this.value;
        }
    });

    // Step
    automata.bind('step', {
        element: document.getElementById('automata-step'),
        set: function(step) {
            this.value = step;
        },
        get: function() {
            return this.value;
        }
    });

    // Layer
    automata.getLayer('layer-0').bind('pattern', {
        element: document.getElementById('automata-pattern'),
        set: function(value)  {
            this.value = value;
        },
        get: function(value) {
            return this.value
        }
    });

    // Layer
    automata.getLayer('layer-0').bind('color', {
        element: document.getElementById('automata-color'),
        set: function(value)  {
            this.value = value;
        },
        get: function(value) {
            return this.value
        }
    });

    // Play
    document.getElementById('automata-play').addEventListener('click', function() {
        automata.setOption('started', !automata.getOption('started'));
        this.innerHTML = automata.getOption('started') ? 'Stop' : 'Play';
    });

    // Next
    document.getElementById('automata-next').addEventListener('click', function() {
        automata.next();
        automata.repaint();
    });

    // Clear
    document.getElementById('automata-clear').addEventListener('click', function() {
        automata.getLayer('layer-0').clear();
        automata.repaint();
    });

    // // Pattern
    // automata.getLayer('layer-0').setOption('pattern', 'random');

    // Repaint
    automata.repaint();
}
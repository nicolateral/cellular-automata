class MObject {
   
    #options = {};
    #events = {};
    #binds = {};

    constructor(options) {
        this.setOptions(options);
    }

    bind(name, config) {
        var self = this;

        // Create
        if (!this.#binds[name]) {
            this.#binds[name] = [];
        }

        // Register
        this.#binds[name].push(config);
        
        // Listen bind
        config.scope.addEventListener('change', function() {
            self.setOption(name, config.get.call(config.scope));
        });
        
        // Set the bind
        config.set.call(config.scope, this.getOption(name));
    }

    on(name, listener) {
        if (!this.#events[name]) {
            this.#events[name] = [];
        }
        this.#events[name].push(listener);
    }

    fireEvent(name, args) {
        if (this.#events[name]) {
            this.#events[name].forEach(function(listener) {
                listener.fn.apply(listener.scope || this, args);
            }, this);
        }
    }

    fireBind(name, value) {
        if (this.#binds[name]) {
            this.#binds[name].forEach(function(listener) {
                listener.set.call(listener.scope || this, value);
            }, this);
        }
    }

    getOption(name, solution) {
        return this.#options[name] || solution;
    }

    getOptions() {
        return this.#options;
    }

    setOption(name, value) {
        if (this.#options[name] !== value) {
            this.#options[name] = value;
            this.fireBind(name, value);
            this.fireEvent(name + 'change', [value]);
        }
    }

    setOptions(options) {
        var name;

        for (name in options) {
            this.setOption(name, options[name]);
        }
    }
}

class Automata extends MObject {

    #last = null;
    #layers = [];
    #element = null;
    #painted = false;
    
    constructor(element, options) {
        
        // Super
        super(options);

        // Events
        this.on('widthchange', {
            fn: this.updateWidth,
            scope: this
        });
        this.on('heightchange', {
            fn: this.updateHeight,
            scope: this
        });
        this.on('stepchange', {
            fn: this.updateStep,
            scope: this
        });
        this.on('startedchange', {
            fn: this.updateStarted,
            scope: this
        });

        // Element
        this.#element = element;

        // Layers : background
        this.addLayer(new BackgroundLayer(this, {
            id: 'background'
        }));

        // Layers : info
        this.addLayer(new InfoLayer(this, {
            id: 'info'
        })).getCanvas().style.zIndex = 10;
    }
    
    getElement() {
        return this.#element;
    }

    addLayer(layer) {
        this.#layers.push(layer);
        layer.resize();
        return layer;
    }

    addCellularLayer(options) {
        return this.addLayer(new CellularLayer(this, options));
    }
    
    getLayers() {
        return this.#layers;
    }

    getStep(step) {
        return this.getOption('step');
    }

    getHeight() {
        return this.getOption('height');
    }

    getWidth() {
        return this.getOption('width');
    }

    getSize() {
        return {
            height: this.getHeight(),
            width: this.getWidth()
        };
    }

    updateStep() {
        this.getLayers().forEach(function(layer) {
            layer.resize();
        });
        if (this.isPainted()) {
            this.repaint();
        }
    }

    updateHeight() {
        this.getLayers().forEach(function(layer) {
            layer.resize();
        });
        if (this.isPainted()) {
            this.repaint();
        }
    }

    updateWidth() {
        this.getLayers().forEach(function(layer) {
            layer.resize();
        });
        if (this.isPainted()) {
            this.repaint();
        }
    }

    updateStarted(value) {
        if (value) {
            this.start();
        }
    }

    next() {
        this.getLayers().forEach(function(layer) {
            layer.next();
        });
    }

    repaint() {
        
        // Flag
        this.#painted = true;

        // Layers
        this.getLayers().forEach(function(layer) {
            layer.repaint();
        });

        // Event
        this.fireEvent('repaint');
    }

    start() {
        var self = this,
            now = Date.now();

        // FPS
        if (this.#last) {
            this.#layers[1].setFPS(Math.round(1000 / (now - this.#last)));
        }

        // Last
        this.#last = now;

        // Next
        this.next();

        // Repaint
        this.repaint();
        
        // Request next frame
        requestAnimationFrame(function() {
            if (self.getOption('started')) {
                self.start();
            }
        });
    }

    isPainted() {
        return this.#painted;
    }
}

class Layer extends MObject {
    
    #dirty = true;
    #canvas = null;
    #automata = null;

    constructor(automata, options) {

        // Super
        super(options);

        // Automata
        this.#automata = automata;

        // Element
        this.createElement();
    }

    createElement() {
        this.#canvas = document.createElement('canvas');
        this.#canvas.id = this.getId();
        this.#canvas.style.position = 'absolute';
        this.getAutomata().getElement().appendChild(this.#canvas);
    }

    getAutomata() {
        return this.#automata;
    }

    getCanvas() {
        return this.#canvas;
    }

    getContext(type) {
        return this.getCanvas().getContext(type);
    }

    getId() {
        return this.getOption('id');
    }

    isDirty() {
        return this.#dirty;
    }

    setDirty(dirty) {
        this.#dirty = dirty;
    }

    resize() {
        var automata = this.getAutomata(),
            size = automata.getSize(),
            step = automata.getStep();
        
        this.#canvas.height = size.height * step;
        this.#canvas.width = size.width * step;

        this.setDirty(true);
    }

    clear() {
        var context = this.getContext('2d'),
            automata = this.getAutomata(),
            size = automata.getSize(),
            step = automata.getStep();
            
        // Context
        context.clearRect(0, 0, size.width * step, size.height * step);
    }

    next() {

    }

    repaint() {

        // Dirty
        if (!this.isDirty()) {
            return;
        }
        
        // Clear
        this.clear();

        // Redraw
        this.redraw(this.getContext('2d'));

        // Dirty
        this.setDirty(false);
    }

    redraw(context) {

    }
}

class BackgroundLayer extends Layer {

    redraw(context) {
        var automata = this.getAutomata(),
            size = automata.getSize(),
            step = automata.getStep(),
            index;

        // Begin
        context.beginPath();

        // Style
        context.strokeStyle = '#F0F0F0';

        // Vertical lines
        for (index = 1; index < size.width; index++) {
            context.moveTo(index * step, 0);
            context.lineTo(index * step, size.height * step);
            context.stroke();
        }

        // Horizontal lines
        for (index = 1; index < size.height; index++) {
            context.moveTo(0, index * step);
            context.lineTo(size.width * step, index * step);
            context.stroke();
        }

        // End
        context.closePath();
    }
}

class InfoLayer extends Layer {
    
    #fps = 0;

    setFPS(fps) {
        if (this.#fps !== fps) {
            this.setDirty(true);
        }
        this.#fps = fps;
    }

    redraw(context) {

        // Repaint
        context.clearRect(5, 5, 80, 20);
        context.fillStyle = '#FFFFFFDD';
        context.fillRect(5, 5, 40, 20);
        context.fillStyle = '#000000';
        context.fillText(this.#fps + ' FPS', 10, 20);
    }
}

class CellularLayer extends Layer {

    #cells = [];
    #array = [];

    #defaultColors = {
        'black': function() {
            return '#000000';
        }
    };

    constructor(automata, options) {

        // Super
        super(automata, options);

        // Events
        this.on('colorchange', {
            fn: this.updateColor,
            scope: this
        });
        this.on('patternchange', {
            fn: this.updatePattern,
            scope: this
        });
    }

    resize() {
        super.resize();
        this.createCells(true);
    }

    createCells(recover) {
        var automata = this.getAutomata(),
            size = automata.getSize(),
            x, y;

        var cells = [],
            array = [];

        for (x = 0; x < size.width; x++) {
            cells[x] = [];
            for (y = 0; y < size.height; y++) {
                cells[x][y] = new Cell(this, {
                    x: x,
                    y: y
                });
                if (recover === true) {
                    cells[x][y].setAlive(this.isAliveAt(x, y))
                }
            }
        }

        this.#cells = cells;
        this.#array = array;

        for (x = 0; x < size.width; x++) {
            for (y = 0; y < size.height; y++) {
                this.#cells[x][y].addNeighbor(this.getCellAt(x-1, y-1));
                this.#cells[x][y].addNeighbor(this.getCellAt(x, y-1));
                this.#cells[x][y].addNeighbor(this.getCellAt(x+1, y-1));
                this.#cells[x][y].addNeighbor(this.getCellAt(x+1, y));
                this.#cells[x][y].addNeighbor(this.getCellAt(x+1, y+1));
                this.#cells[x][y].addNeighbor(this.getCellAt(x, y+1));
                this.#cells[x][y].addNeighbor(this.getCellAt(x-1, y+1));
                this.#cells[x][y].addNeighbor(this.getCellAt(x-1, y));
                this.#array.push(this.#cells[x][y]);
            }
        }
    }

    isAliveAt(x, y) {
        var cell = this.getCellAt(x, y);
        if (cell) {
            return cell.isAlive();
        }
        return false;
    }

    getCellAt(x, y) {
        if (!this.#cells[x]) {
            return;
        }
        return this.#cells[x][y];
    }

    getColorCode(cell) {
        return this.getOption('colors', this.#defaultColors)[this.getOption('color', 'black')](cell);
    }

    load(data) {
        data.forEach(function(value) {
            this.#cells[value.x][value.y].setAlive(true);
        }, this);
        this.setDirty(true);
    }

    next() {
        this.#array.forEach(function(cell) {
            cell.next();
        });
        this.setDirty(true);
    }

    redraw(context) {
        var automata = this.getAutomata(),
            step = automata.getStep();

        this.#array.forEach(function(cell) {
            cell.redraw(context, step);
        });
    }

    updateColor() {
        this.setDirty(true);
        this.getAutomata().repaint();
    }

    updatePattern(name) {
        var patterns = this.getOption('patterns'),
            data = patterns[name]();

        // Clear
        this.createCells();

        // Load
        this.load(data);

        // Repaint
        this.getAutomata().repaint();
    }
}

class Cell extends MObject {
    
    #layer = null;
    #neighbors = [];
    #current = false;
    #next = false;

    constructor(layer, options) {

        // Parent
        super(options);

        // Layer
        this.#layer = layer;
    }

    addNeighbor(neighbor) {
        if (neighbor) {
            this.#neighbors.push(neighbor);
        }
    }

    getLayer() {
        return this.#layer;
    }

    setAlive(alive) {
        this.#next = alive;
    }

    isAlive() {
        return this.#current;
    }

    next() {
        var count = 0;

        this.#neighbors.forEach(function(neighbor) {
            if (neighbor.isAlive()) {
                count += 1;
            }
        });

        if (!this.isAlive()) {
            if (count === 3) {
                this.#next = true;
            }
        } else {
            if (!(count === 2 || count === 3)) {
                this.#next = false;
            }
        }
    }

    redraw(context, step) {
        this.#current = this.#next;
        if (this.#current) {
            context.fillStyle = this.#layer.getColorCode(this);
            context.fillRect(this.getOption('x') * step, this.getOption('y') * step, step, step);
        }
    }
}
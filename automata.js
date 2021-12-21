class Object {

    #events = {};

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
            });
        }
    }
}

class Automata extends Object {

    #last = null;
    #layers = [];
    #options = {};
    #element = null;
    #started = false;
    
    constructor(element, options) {
        super();
        this.#element = element;
        this.#options = options;
        this.#layers.push(new BackgroundLayer('background', this));
        this.#layers.push(new InfoLayer('info', this));
        this.#layers[1].getCanvas().style.zIndex = 10;
    }
    
    getElement() {
        return this.#element;
    }

    addCellularLayer(id) {
        var layer = new CellularLayer(id, this);
        this.#layers.push(layer);
        return layer;
    }
    
    getLayers() {
        return this.#layers;
    }

    getStep(step) {
        return this.#options.step;
    }

    getSize(size) {
        return this.#options.size;
    }

    setStep(step) {
        this.#options.step = step;
        this.getLayers().forEach(function(layer) {
            layer.resize();
        });
    }

    setSize(size) {
        this.#options.size = size;
        this.getLayers().forEach(function(layer) {
            layer.resize();
        });
    }

    next() {
        this.getLayers().forEach(function(layer) {
            layer.next();
        });
    }

    repaint() {
        this.getLayers().forEach(function(layer) {
            layer.repaint();
        });
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

        // Start
        this.#started = true;

        // Next & Repaint
        this.next();
        this.repaint();
        
        // Request next frame
        requestAnimationFrame(function() {
            if (self.#started) {
                self.start();
            }
        });
    }

    pause() {
        this.#started = false;
    }

    isStarted() {
        return this.#started;
    }
}

class Layer {
    
    #id = null;
    #dirty = true;
    #canvas = null;
    #automata = null;

    constructor(id, automata) {
        this.#id = id;
        this.#automata = automata;
        this.createElement();
        this.resize();
    }

    createElement() {
        this.#canvas = document.createElement('canvas');
        this.#canvas.id = this.#id;
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

    // repaint() {
        
    //     // Dirty
    //     if (!this.#dirty) {
    //         return;
    //     }

    //     var context = this.getContext('2d');
        
    //     // Clear
    //     this.clear();

    //     // Redraw
    //     this.redraw(this.getContext('2d'));

    //     // Dirty
    //     this.#dirty = false;
    // }

    repaint() {
        
        // Dirty
        if (!this.#dirty) {
            return;
        }

        var canvas = document.createElement('canvas'),
            context;

        // Size
        canvas.height = this.#canvas.height,
        canvas.width = this.#canvas.width

        // Context
        context = canvas.getContext('2d');

        // Clear
        this.clear();

        // Redraw
        this.redraw(context);

        // Buffer
        this.getContext('2d').drawImage(canvas, 0, 0);

        // Dirty
        this.#dirty = false;
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
    
    // #dirty = false;
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

    #index = null;
    #showOffset = false;

    constructor(id, automata) {
        super(id, automata)
        this.#index = new Index();
    }

    addCells(cells) {
        cells.forEach(function(cell) {
            this.#index.add(new Cell(cell));
        }, this);
    }

    next() {
        var index = this.#index,
            offset = this.#index.getOffset();
        
        // Dirty
        this.setDirty(true);

        // Indexes
        this.#index = new Index();

        // Rules
        offset.getArray().forEach(function(value) {
            var exist = index.getAt(value.x, value.y);
            if (!exist) {
                if (value.neighbors.length === 3) {
                    this.#index.add(new Cell({
                        position: value
                    }));
                }
            } else {
                if (value.neighbors.length === 2 || value.neighbors.length === 3) {
                    this.#index.add(exist);
                }
            }
        }, this);
    }

    redraw(context) {
        var automata = this.getAutomata(),
            step = automata.getStep();
      
        // Color
        context.fillStyle = '#000000';

        // Index
        this.#index.getArray().forEach(function(cell) {
            cell.redraw(context, step);
        });

        // ShowOffset
        if (this.#showOffset) {
            this.#index.getOffset().getArray().forEach(function(value) {
                context.fillStyle = '#00FF0022';
                context.fillRect(value.x * step, value.y * step, step, step);
            });
        }
    }
}

class Index {

    #offset = null;
    #limit = null;
    #array = [];
    #index = [];

    add(value) {
        var x = value.x,
            y = value.y;

        if (!this.#index[x]) {
            this.#index[x] = [];
        }
        if (!this.#index[x][y]) {
            this.#array.push(value);
            this.#index[x][y] = value;
        }
    }
    getAt(x, y) {
        if (!this.#index[x]) {
            return undefined;
        }
        return this.#index[x][y];
    }
    getArray() {
        return this.#array;
    }
    getLimit() {
        if (this.#limit) {
            return this.#limit;
        }
        this.#array.forEach(function(value) {
            var x = value.x,
                y = value.y;

            if (!this.#limit) {
                this.#limit = {
                    x: [x, x],
                    y: [y, y]
                };
            } else {
                if (x < this.#limit.x[0]) {
                    this.#limit.x[0] = x;
                }
                if (x > this.#limit.x[1]) {
                    this.#limit.x[1] = x;
                }
                if (y < this.#limit.y[0]) {
                    this.#limit.y[0] = y;
                }
                if (y > this.#limit.y[1]) {
                    this.#limit.y[1] = y;
                }
            }
        },  this);

        return this.#limit;
    }
    clear() {
        this.#offset = null;
        this.#limit = null;
        this.#array = [];
        this.#index = [];
    }
    getNeighbors(x, y) {
        var neighbors = [],
            value;

        if (value = this.getAt(x - 1, y - 1)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x, y - 1)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x + 1, y - 1)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x + 1, y)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x + 1, y + 1)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x, y + 1)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x - 1, y + 1)) {
            neighbors.push(value);
        }
        if (value = this.getAt(x - 1, y)) {
            neighbors.push(value);
        }

        return neighbors;
    }
    getOffset() {
        if (this.#offset) {
            return this.#offset;
        }

        this.#offset = new Index();

        this.#array.forEach(function(value) {
            this.#offset.add({
                x: value.x,
                y: value.y,
                neighbors: this.getNeighbors(value.x, value.y)
            });
            this.#offset.add({
                x: value.x - 1,
                y: value.y - 1,
                neighbors: this.getNeighbors(value.x - 1, value.y - 1)
            });
            this.#offset.add({
                x: value.x,
                y: value.y - 1,
                neighbors: this.getNeighbors(value.x, value.y - 1)
            }); 
            this.#offset.add({
                x: value.x + 1,
                y: value.y - 1,
                neighbors: this.getNeighbors(value.x + 1, value.y - 1)
            }); 
            this.#offset.add({
                x: value.x + 1,
                y: value.y,
                neighbors: this.getNeighbors(value.x + 1, value.y)
            }); 
            this.#offset.add({
                x: value.x + 1,
                y: value.y + 1,
                neighbors: this.getNeighbors(value.x + 1, value.y + 1)
            }); 
            this.#offset.add({
                x: value.x,
                y: value.y + 1,
                neighbors: this.getNeighbors(value.x, value.y + 1)
            }); 
            this.#offset.add({
                x: value.x - 1,
                y: value.y + 1,
                neighbors: this.getNeighbors(value.x - 1, value.y + 1)
            }); 
            this.#offset.add({
                x: value.x - 1,
                y: value.y,
                neighbors: this.getNeighbors(value.x - 1, value.y)
            }); 
        }, this);

        return this.#offset;
    }
}

class Cell {
    
    #options = {};

    constructor(options) {
        this.#options = options;
    }

    get x() {
        return this.#options.position.x;
    }

    get y() {
        return this.#options.position.y;
    }

    clear(context, step) {
        context.clearRect(this.x * step, this.y * step, step, step);
    }

    redraw(context, step) {
        context.fillRect(this.x * step, this.y * step, step, step);
    }
}
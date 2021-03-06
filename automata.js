/**
 *  Namespace 
 */
var Automata = {
    
    /**
     * This is the default cell state provider that implements 
     * [the original rules]{@link https://en.wikipedia.org/wiki/Conway's_Game_of_Life} of John von Conway.
     * 
     * @example 
     * DefaultCellStateProvider = {
     * 
     *     // Return the next state
     *     getNextState(cell) {
     *         var count = 0,
     *             state;
     * 
     *         // Count each neighbors of state === 1
     *         cell.getNeighbors().forEach(function(neighbor) {
     *             if (neighbor.getState() === 1) {
     *                 count += 1;
     *             }
     *         });
     * 
     *         // Here is the rule
     *         if (cell.getState() === 0) {
     *             if (count === 3) {
     *                 return 1;
     *             }
     *         } else {
     *             if (!(count === 2 || count === 3)) {
     *                 return 0;
     *             }
     *         }
     * 
     *         // Return
     *         return cell.getState();
     *     },
     * 
     *     // Return the color
     *     getColor(state) {
     *         return state === 1 ? 'rgba(0, 0, 0, 0.7)' : 'rgb(255, 255, 255)';
     *     }
     * };
     * @constant DefaultCellStateProvider
     * 
     */
    DefaultCellStateProvider: {

        /**
         * @see {Automata.CellStateProvider#getNextState}
         */
        getNextState(cell) {
            var count = 0,
                state;
    
            // Count each neighbors of state === 1
            cell.getNeighbors().forEach(function(neighbor) {
                if (neighbor.getState() === 1) {
                    count += 1;
                }
            });
    
            // Here is the rule
            if (cell.getState() === 0) {
                if (count === 3) {
                    return 1;
                }
            } else {
                if (!(count === 2 || count === 3)) {
                    return 0;
                }
            }
    
            // Return
            return cell.getState();
        },
        
        /**
         * @see {Automata.CellStateProvider#getColor}
         */
        getColor(state) {
            return state === 1 ? 'rgba(0, 0, 0, 0.7)' : 'transparent';
        }
    }
};

/**
 * Automata.Object is an utility class that provides :
 * <ul>
 * <li>events system</li>
 * </ul>
 * This class is used by other classes like Automata.Automata or Automata.Layer
 * @example
 * 
 * // Create a derived class of Automata.Object
 * class MyObject extends Automata.Object {
 *      constructor(options) {
 *          super(options);
 *      }
 *      setHeight(height) {
 *          this.#height = height;
 *          this.fireEvent('heightchange', [this, height]);
 *      }
 * }
 * 
 * // Create an instance of MyObject
 * const myInstance = new MyObject()
 * 
 * // Listen to the heightchange event
 * myInstance.listen('heightchange', {
 *      fn: function(height) {
 *          console.log('height has been changed to ' + height);
 *      }
 * 
 * });
 * 
 * // Set the option height to 250 will fire the
 * // 'heightchange' event and call callbacks functions.
 * myInstance.setHeight(500);
 */
Automata.Object = class {

    #events = {};

    /**
     * Automata.Object constructor
     * @param {Object} options The options of the class
     */
    constructor(options) {
    }

    /**
     * Listen to an event
     * @param {String} name The event name
     * @param {Object} config The listener configuration
     * @param {String} config.id The id of the listener (usefull to mute)
     * @param {Function} config.fn The callback function
     * @param {*} config.scope The callback scope
     */
    listen(name, config) {
        if (!this.#events[name]) {
            this.#events[name] = [];
        }
        this.#events[name].push(config);
    }

    /**
     * Mute an event
     * @param {*} name The event name
     * @param {*} id The id of the listener
     */
    mute(name, id) {
        if (!this.#events[name]) {
            return;
        }
        var index;
        for (index = this.#events[name].length - 1; index >= 0; index--) {
            if (this.#events[name][index].id === id) {
                this.#events[name].splice(index, 1);
            }
        }
    }

    /**
     * Fire an event
     * @param {String} name The event name
     * @param {Array} args An array of the arguments that will be passed to the callbacks functions
     */
    fireEvent(name, args) {
        if (this.#events[name]) {
            this.#events[name].forEach(function(listener) {
                listener.fn.apply(listener.scope || this, args);
            }, this);
        }
    }
}

/**
 * Automata.Automata represents the automata view.<br>
 * @example
 * // Instanciate new Automata
 * const automata = new Automata.Automata(document.getElementById('automata'), {
 *      delay: 100,
 *      height: 10,
 *      width: 10,
 *      step: 10
 * });
 * 
 * // Add CellularLayer
 * automata.addCellularLayer({
 *     id: 'layer-0'
 * });
 * 
 * // Load cells
 * automata.getLayer('layer-0').load([{
 *      x: 5,
 *      y: 4,
 *      state: 1
 * }, {
 *      x: 5,
 *      y: 5,
 *      state: 1
 * }, {
 *      x: 5,
 *      y: 6,
 *      state: 1
 * }]);
 * 
 * // Start
 * automata.start();
 */
Automata.Automata = class extends Automata.Object {

    #delay = 10;
    #height = 10;
    #step = 10;
    #width = 10;

    #last = null;
    #layers = [];
    #element = null;
    #started = false;
    
    /**
     * Automata.Automata constructor
     * @param {HTMLElement} element The element where the automata will be rendered
     * @param {Object} options The options
     * @param {Number} options.delay The delay (in ms) between each automata repaint
     * @param {Number} options.height The number of vertical cells 
     * @param {Number} options.width The number of horizontal cells
     * @param {Number} options.step The cell size (in px)
     */
    constructor(element, options) {
        
        // Super
        super(options);

        // Options
        if (options) {
            if (options.delay !== undefined) {
                this.setDelay(options.delay);
            }
            if (options.height !== undefined) {
                this.setHeight(options.height);
            }
            if (options.step !== undefined) {
                this.setStep(options.step);
            }
            if (options.width !== undefined) {
                this.setWidth(options.width);
            }
        }

        // Element
        this.#element = element;

        // Layers : background
        this.addLayer(new Automata.BackgroundLayer(this, {
            id: 'background'
        }));

        // Layers : info
        this.addLayer(new Automata.InfoLayer(this, {
            id: 'info'
        })).getCanvas().style.zIndex = 10;
        
        // Layers : event
        this.addLayer(new Automata.Layer(this, {
            id: 'event'
        })).getCanvas().style.zIndex = 20;

        // InitEventLayer
        this.#initEventLayer();
    }

    /**
     * Init the event layer
     * @private
     */
    #initEventLayer() {
        this.getLayer('event').getCanvas().addEventListener('mousedown', this.#onMouseDown.bind(this));
    }

    /**
     * Returns the x value of the event
     * @param {MouseEvent} event The MouseEvent
     * @returns The x value
     * @private
     */
    #getEventX(event) {
        return event.layerX;
    }

    /**
     * Returns the y value of the event
     * @param {MouseEvent} event The MouseEvent
     * @returns The y value
     * @private
     */
    #getEventY(event) {
        return event.layerY;
    }

    /**
     * Listener for event layer 'mousedown'
     * @param {MouseEvent} event The MouseEvent
     * @private
     */
    #onMouseDown(event) {
        this.propagateEvent('mousedown', {
            x: this.#getEventX(event),
            y: this.#getEventY(event)
        });
    }

    /**
     * Resize the layers
     * @private
     */
    #reziseLayers() {
        this.getLayers().forEach(function(layer) {
            layer.resize();
        });
    }

    /**
     * Request en animation frame to the browser
     * @private
     */
    #requestAnimationFrame() {
        var self = this;

        requestAnimationFrame(function() {
            self.next();
            self.repaint();
        });
    }

    /**
     * Propagate an avent throught the layers
     * @param {*} name The event name
     * @param {*} value The event value
     * @private
     */
    propagateEvent(name, value) {
        this.getLayers().forEach(function(layer) {
            layer.propagateEvent(name, value);
        });
    }
    
    /**
     * Returns the Automata HTMLElement
     * @returns {HTMLElement} The Automata HTMLElement
     */
    getElement() {
        return this.#element;
    }

    /**
     * Add a layer to the Automata
     * @param {Automata.Layer} layer The layer to add
     * @returns {Automata.Layer} The layer that have been added
     */
    addLayer(layer) {
        this.#layers.push(layer);
        layer.resize();
        return layer;
    }

    /**
     * Shorthand function to Automata.addLayer
     * @param {Object} options The layer options
     * @see {Automata.Automata#addLayer}
     * @returns {Automata.CellularLayer} The layer that have been added
     */
    addCellularLayer(options) {
        return this.addLayer(new Automata.CellularLayer(this, options));
    }

    /**
     * Returns a layer by its id. It returns null if the layer is not found.
     * @param {String} id The layer id
     * @returns {Automata.Layer} The layer that have been found
     */
    getLayer(id) {
        var layers = this.#layers,
            index;

        for (index = 0; index < layers.length; index++) {
            if (layers[index].getId() === id) {
                return layers[index];
            }
        }

        return null;
    }
    
    /**
     * Returns the automata delay
     * @returns {Number} The automata delay
     */
    getDelay() {
        return this.#delay;
    }

    /**
     * Returns the automata height
     * @returns {Number} The automata height
     */
    getHeight() {
        return this.#height;
    }

    /**
     * Returns the Automata's layers
     * @returns {Array.<Automata.Layer>} The Automata's layers
     */
    getLayers() {
        return this.#layers;
    }

    /**
     * Returns the automata step
     * @returns {Number} The automata step
     */
    getStep() {
        return this.#step;
    }

    /**
     * Returns the automata width
     * @returns {Number} The automata width
     */
    getWidth() {
        return this.#width;
    }

    /**
     * Set the delay (in millisecond)
     * @param {Number} delay The delay
     */
    setDelay(delay) {
        this.#delay = delay;
    }

    /**
     * Set the height (number of cell)
     * @param {Number} height The height
     */
    setHeight(height) {
        this.#height = height;
        this.#reziseLayers();
    }

    /**
     * Set the step (number of pixel)
     * @param {Number} step The step
     */
    setStep(step) {
        this.#step = step;
        this.#reziseLayers();
    }

    /**
     * Set the width (number of cell)
     * @param {Number} width The width
     */
    setWidth(width) {
        this.#width = width;
        this.#reziseLayers();
    }

    /**
     * Set the running state of the automata
     * @param {Boolean} started The running state
     */
    setStarted(started) {
        var wasStarted = this.isStarted();
        this.#started = started;
        if (started && !wasStarted) {
            this.repaint();
        }
    }

    /**
     * Returns the running state of the automata
     * @returns {Boolean} The running state
     */
    isStarted() {
        return this.#started;
    }

    /**
     * Pause the automata (shorthand for setStarted(false))
     */
    pause() {
        this.setStarted(false);
    }

    /**
     * Start the automata (shorthand for setStarted(true))
     */
    start() {
        this.setStarted(true);
    }

    /**
     * Ask the Automata to determine its next state
     */
    next() {
        this.getLayers().forEach(function(layer) {
            layer.next();
        });
    }

    /**
     * Ask the Automata to repaint. 
     * If the automata is started, it will repaint until it is paused
     */
    repaint() {
        var self = this,
            now = Date.now(),
            delay = this.getDelay();

        // Started
        if (this.isStarted()) {

            // FPS
            if (this.#last) {
                this.getLayer('info').setFPS(Math.round(1000 / (now - this.#last)));
            }

            // Last
            this.#last = now;
        } else {
            this.getLayer('info').setFPS(0);
        }

        // Layers
        this.getLayers().forEach(function(layer) {
            layer.repaint();
        });

        // Request next frame
        if (this.isStarted()) {
            if (delay) {
                setTimeout(function() {
                    self.#requestAnimationFrame();
                }, delay);
            } else {
                self.#requestAnimationFrame();
            }
        }
    }
}

/**
 * Automata.Layer is an utilty class that represent a layer in the automata.<br>
 * Child classes should implements "redraw" function.
 */
Automata.Layer = class extends Automata.Object {
    
    #id = null;
    #autoClear = true;
    #dirty = true;
    #canvas = null;
    #automata = null;

    /**
     * Automata.Layer constructor
     * @param {Automata.Automata} automata The automata
     * @param {Object} options The options
     * @param {String} options.id The layer id
     */
    constructor(automata, options) {

        // Super
        super(options);

        // Options
        if (options) {
            if (options.id) {
                this.setId(options.id);
            }
        }

        // Automata
        this.#automata = automata;

        // Element
        this.#createElement();
    }

    /**
     * Create the canvas element
     * @private
     */
    #createElement() {
        this.#canvas = document.createElement('canvas');
        this.#canvas.id = this.getId();
        this.#canvas.style.position = 'absolute';
        this.getAutomata().getElement().appendChild(this.#canvas);
    }

    /**
     * Template class called by the Automata when an avent is fired
     * @param {*} name The event name
     * @param {*} value The event value
     * @see {Automata.Automata#propagateEvent}
     * @private
     */
    propagateEvent (name, value) {
        
    }

    /**
     * Resize the layer, it will be adapted according to the canvas width and height
     * @private
     */
    resize() {
        var automata = this.getAutomata(),
            step = automata.getStep(),
            height = automata.getHeight() * step,
            width = automata.getWidth() * step;
        
        this.#canvas.height = height;
        this.#canvas.width = width;

        if (width < automata.getElement().offsetWidth) {
            this.#canvas.style.left = Math.round((automata.getElement().offsetWidth - width) / 2) + automata.getElement().offsetLeft;
        } else {
            this.#canvas.style.left = 0;
        }
        if (height < automata.getElement().offsetHeight) {
            this.#canvas.style.top = Math.round((automata.getElement().offsetHeight - height) / 2) + automata.getElement().offsetTop;
        } else {
            this.#canvas.style.top = 0;
        }

        this.setDirty(true);
    }
    
    /**
     * Set auto clear
     * @param {Boolean} autoClear The auto clear
     */
    setAutoClear(autoClear) {
        this.#autoClear = autoClear;
    }

    /**
     * Returns the Layer's Automata
     * @returns {Automata.Automata} The layer's automata
     */
    getAutomata() {
        return this.#automata;
    }

    /**
     * Returns the Layer's canvas
     * @returns {HTMLCanvasElement} The layer's canvas
     */
    getCanvas() {
        return this.#canvas;
    }

    /**
     * Returns the Layer's canvas rendering context
     * @param {String} type The canvas rendering context type
     * @returns {RenderingContext} The canvas rendering context
     */
    getContext(type) {
        return this.getCanvas().getContext(type);
    }

    /**
     * Returns the layer id
     * @returns {Number} The layer id
     */
    getId() {
        return this.#id;
    }

    /**
     * Returns the layer dirty state
     * @returns {Boolean} The layer dirty state
     */
    isDirty() {
        return this.#dirty;
    }

    /**
     * Set the dirty state of the layer. A layer will be redrawn only
     * if it is dirty
     * @param {Boolean} dirty The layer dirty state
     */
    setDirty(dirty) {
        this.#dirty = dirty;
    }

    /**
     * Set the id of the Lyaer
     * @param {String} id The id
     */
    setId(id) {
        this.#id = id;
    }

    /**
     * Ask the Layer to determine its next state
     * @see {Automata.Automata#next}
     */
    next() {

    }

    /**
     * Ask the Layer to repaint. A layer will be repainted only if it is dirty
     * @see {Automata.Automata#repaint}
     * @see {Automata.Layer#setDirty}
     */
    repaint() {

        // Dirty
        if (!this.isDirty()) {
            return;
        }

        // Variables
        var context = this.getContext('2d'),
            automata = this.getAutomata(),
            step = automata.getStep();

        // Clear
        if (this.#autoClear) {
            context.clearRect(0, 0, automata.getWidth() * step, automata.getHeight() * step);
        }

        // Redraw
        this.redraw(this.getContext('2d'));

        // Dirty
        this.setDirty(false);
    }

    /**
     * Template function that have to be implemented by subclasses
     * @param {RenderingContext} context The canvas rendering context
     */
    redraw(context) {

    }
}

/**
 * Automata.BackgroundLayer is a subclass of Automata.Layer.<br>
 * It is used by Automata.Automata to draw a grid in background
 * @private
 */
Automata.BackgroundLayer = class extends Automata.Layer {

    /**
     * Redraw the layer
     * @param {RenderingContext} context The canvas rendering context
     * @see {Automata.Layer#redraw}
     */
    redraw(context) {
        var automata = this.getAutomata(),
            height = automata.getHeight(),
            width = automata.getWidth(),
            step = automata.getStep(),
            index;

        // Begin
        context.beginPath();

        // Style
        context.strokeStyle = '#F0F0F0';

        // Vertical lines
        for (index = 1; index < width; index++) {
            context.moveTo(index * step, 0);
            context.lineTo(index * step, height * step);
            context.stroke();
        }

        // Horizontal lines
        for (index = 1; index < height; index++) {
            context.moveTo(0, index * step);
            context.lineTo(width * step, index * step);
            context.stroke();
        }

        // End
        context.closePath();
    }
}

/**
 * Automata.Info is a subclass of Automata.Layer.<br>
 * It is used by Automata.Automata to draw info in background (FPS ...)
 * @private
 */
Automata.InfoLayer = class extends Automata.Layer {
    
    #fps = 0;

    /**
     * Set the FPS state
     * @param {Number} fps The fps state
     */
    setFPS(fps) {
        if (this.#fps !== fps) {
            this.setDirty(true);
        }
        this.#fps = fps;
    }

    /**
     * Redraw the layer
     * @param {RenderingContext} context The canvas rendering context
     * @see {Automata.Layer#redraw}
     */
    redraw(context) {

        // Repaint
        context.clearRect(5, 5, 80, 40);
        context.fillStyle = '#FFFFFFDD';
        context.fillRect(5, 5, 60, 40);
        context.fillStyle = '#000000';
        context.fillText('FPS: ' + this.#fps, 10, 20);
        context.fillText('Height: ' + this.getAutomata().getHeight(), 10, 30);
        context.fillText('Width: ' + this.getAutomata().getWidth(), 10, 40);
    }
}

/**
 * Interface for classes that represent a rule.
 * @see {DefaultCellStateProvider}
 * @interface
 */
Automata.CellStateProvider = class {

    /**
     * Return the next state of a cell
     * @param {Automata.Cell} cell The cell
     * @returns The state
     */
     getNextState(cell) {
        throw new Error('not implemented');
    }

    /**
     * Returns the color from a state
     * @param {Number} state The state
     * @returns The color
     */
    getColor(state) {
        throw new Error('not implemented');
    }
};


/**
 * Automata.CellularLayer is a subclass of Automata.Layer.
 * @fires Automata.CellularLayer#cellmousedown
 */
Automata.CellularLayer = class extends Automata.Layer {

    /**
     * CellMouseDown event.
     *
     * @event Automata.CellularLayer#cellmousedown
     * @property {Automata.CellularLayer} layer The layer
     * @property {Automata.Cell} cell The cell
     * @property {MouseEvent} event The event
     */

    #cells = [];
    #array = [];
    #cellStateProvider = null;

    /**
     * The Automata.CellularLayer constructor
     * @param {Automata.Automata} automata The automata
     * @param {Object} options The options
     */
    constructor(automata, options) {

        // Super
        super(automata, options);

        // Options
        if (options) {
            if (options.cellStateProvider) {
                this.setCellStateProvider(options.cellStateProvider);
            }
        }

        // AutoClear
        this.setAutoClear(false);
    }

    /**
     * Recreate the #cell and #array catalog according to the automata size
     * @param {Boolean} recover True to recover the previous cell state
     * @private
     */
    #createCells(recover) {
        var automata = this.getAutomata(),
            height = automata.getHeight(),
            width = automata.getWidth(),
            x, y;

        var cells = [],
            array = [];

        for (x = 0; x < width; x++) {
            cells[x] = [];
            for (y = 0; y < height; y++) {
                cells[x][y] = new Automata.Cell(this, x, y);
                if (recover === true) {
                    cells[x][y].setState(this.getCellStateAt(x, y) || 0);
                }
            }
        }

        this.#cells = cells;
        this.#array = array;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
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

    /**
     * Resize the layer. It recreates the cells.
     * @private
     */
    resize() {
        super.resize();
        this.#createCells(true);
    }

    /**
     * Clear the layer. It set all the cells as dead.
     * @private
     */
    clear() {
        this.#array.forEach(function(cell) {
            cell.setState(0);
        });
        this.setDirty(true);
    }

    /**
     * Set the cell state provider
     * @param {Automata.CellStateProvider} cellStateProvider 
     */
    setCellStateProvider(cellStateProvider) {
        this.#cellStateProvider = cellStateProvider;
    }

    /**
     * Manages to propagate event throught the cells
     * @param {*} name The event name
     * @param {*} value The event value
     * @see {Automata.Automata#propagateEvent}
     * @private
     */
    propagateEvent(name, value) {
        var x = Math.floor(value.x / this.getAutomata().getStep()),
            y = Math.floor(value.y / this.getAutomata().getStep()),
            cell = this.getCellAt(x, y);


        // Event
        this.fireEvent('cell' + name, [this, cell, value]);
    }

    /**
     * Returns the cells
     * @returns {Array.<Automata.Cell>} the cells
     */
    getArray() {
        return this.#array;
    }

    /**
     * Returns the cell state option at coordinates. It returns false if there is no 
     * cell at the coordinates
     * @param {Number} x The x coordinate 
     * @param {Number} y The y coordinate 
     * @returns {Boolean} The cell state option at coordinate
     */
    getCellStateAt(x, y) {
        var cell = this.getCellAt(x, y);
        if (cell) {
            return cell.getState();
        }
        return null;
    }

    /**
     * Returns the cell at the coordinates. It returns null if there is no cell
     * at the coordinates
     * @param {Number} x The x coordinate 
     * @param {Number} y The y coordinate 
     * @returns {Automata.Cell} The cell or null if there is no cell
     */
    getCellAt(x, y) {
        if (!this.#cells[x]) {
            return;
        }
        return this.#cells[x][y];
    }

    /**
     * Load coordininates and set the cell state. The layer is marked 
     * as dirty. The Automate have to be repainted to see the result.
     * @param {Array.<Object>} coordinates
     */
    load(coordinates) {
        coordinates.forEach(function(coordinate) {
            this.#cells[coordinate.x][coordinate.y].setState(coordinate.state || 1);
        }, this);
        this.setDirty(true);
    }

    /**
     * Ask the Layer to determine its next state
     * @see {Automata.Automata#next}
     */
    next() {
        var cellStateProvider = this.#cellStateProvider || Automata.DefaultCellStateProvider;

        this.#array.forEach(function(cell) {
            cell.setNextState(cellStateProvider.getNextState(cell));
        });

        this.setDirty(true);
    }

    /**
     * Redraw the layer
     * @param {RenderingContext} context The canvas rendering context
     * @see {Automata.Layer#redraw}
     */
    redraw(context) {
        var cellStateProvider = this.#cellStateProvider || Automata.DefaultCellStateProvider,
            automata = this.getAutomata(),
            step = automata.getStep();

        // Draw each cells
        this.#array.forEach(function(cell) {
            if (cell.isDirty()) {
                var state = cell.applyNextState();

                // If the cell next state is not 0
                // then we draw the cell with its color
                if (state === 0) {
                    context.clearRect(cell.getX() * step, cell.getY() * step, step, step);
                } else {
                    context.fillStyle = cellStateProvider.getColor(state);
                    context.fillRect(cell.getX() * step, cell.getY() * step, step, step);
                }
            }
        });
    }
}

/**
 * Automata.Cell represents a cell in Automata.CellularLayer.<br>
 * Developpers should not instanciate this class.
 */
Automata.Cell = class extends Automata.Object {
    
    #x = null;
    #y = null;
    #state = 0;
    #nextState = null;
    #layer = null;
    #neighbors = [];

    /**
     * Automata.Cell constructor
     * @param {Automata.CellularLayer} layer The parent cellular layer
     * @param {Object} options The options
     * @param {Number} options.x The x coordinate
     * @param {Number} options.y The y coordinate
     */
    constructor(layer, x, y, options) {

        // Parent
        super(options);

        // Layer
        this.#layer = layer;

        // Coords
        this.#x = x;
        this.#y = y;

        // Options
        if (options) {
            if (options.state) {
                this.setState(options.state);
            }
        }
    }

    /**
     * Add a neighbor to the neighbors list
     * @param {Automata.Cell} neighbor 
     * @private
     */
    addNeighbor(neighbor) {
        if (neighbor) {
            this.#neighbors.push(neighbor);
        }
    }

    /**
     * Returns the parent CellularLayer
     * @returns {Automata.CellularLayer} The CellularLayer
     */
    getLayer() {
        return this.#layer;
    }

    /**
     * Returns the Cell next state
     * @returns {Number} The Cell next state
     */
    getNextState() {
        return this.#nextState;
    }

    /**
     * Returns the Cell state
     * @returns {Number} The Cell state
     */
    getState() {
        return this.#state;
    }

    /**
     * Returns the Cell x 
     * @returns {Number} The Cell x 
     */
    getX() {
        return this.#x;
    }

    /**
     * Returns the Cell y 
     * @returns {Number} The Cell y 
     */
    getY() {
        return this.#y;
    }

    /**
     * Return the neighbors
     * @returns {Array.<Automata.Cell>} The neighbors
     */
    getNeighbors() {
        return this.#neighbors;
    }
    
    /**
     * Set the next state
     * @param {Number} state The next state
     */
    setNextState(nextState) {
        this.#nextState = nextState;
    }

    /**
     * Set the state
     * @param {Number} state The state
     */
    setState(state) {
        this.#nextState = null;
        this.#state = state;
    }

    /**
     * Returns true if the cell is dirty
     * @returns {Boolean} The dirty state
     */
    isDirty() {
        return this.#nextState !== this.#state;
    }

    /**
     * Set the nextState as current state
     * @returns the new state
     */
    applyNextState() {
        if (this.#nextState !== null) {
            this.#state = this.#nextState;
        }
        return this.#state;
    }
}
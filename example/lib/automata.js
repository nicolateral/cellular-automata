var Automata = {};

/**
 * Automata.Object is an utility class that provides :
 * <ul>
 * <li>options and options binding to HTMLElement system</li>
 * <li>events system</li>
 * </ul>
 * This class is used by other classes like Automata.Automata or Automata.Layer
 * 
 * @example
 * 
 * // Create a derived class of Automata.Object
 * class MyObject extends Automata.Object {
 *      constructor(options) {
 * 
 *          // Calling superclass
 *          super(options);
 * 
 *          // Listening to the name option
 *          this.listen('namechange', {
 *              fn: function(newValue) {
 *                  console.log('new value: ' + newValue);
 *              },
 *              scope: this
 *          });
 *      }
 * }
 * 
 * // Create an instance of MyObject, setting a name
 * // option with a default value "foo".
 * const myInstance = new MyObject({
 *      name: 'foo';
 * })
 * 
 * // Listen to the name option
 * myInstance.listen('namechange', {
 *      fn: function(newValue) {
 *          console.log('another listener');
 *      }
 * });
 * 
 * // Set the option name to 'bar' will fire the
 * // event 'namechange' and call two callbacks functions.
 * myInstance.setOption('name', 'bar');
 */
Automata.Object = class {

    #options = {};
    #events = {};
    #binds = {};

    /**
     * Automata.Object constructor
     * @param {Object} options The options of the class
     */
    constructor(options) {
        this.setOptions(options);
    }

    /**
     * Bind an HTMLElement to an option of the object.<br>The bind will listen the the HTMLElement "change" 
     * event. For each "change", the object option will be reset using the value of the HTMLElement.
     * @param {String} name The option name
     * @param {Object} config The bind configuration
     * @param {HTMLElement} config.element The HTMLElement to bind on option
     * @param {Function} config.set This function is called when the option value changes in order to reset the HTMLElement
     * @param {Function} config.get This function is called when HTMLElement fires a "change" event in order to reset the object option
     */
    bind(name, config) {
        var self = this;

        // Create
        if (!this.#binds[name]) {
            this.#binds[name] = [];
        }

        // Register
        this.#binds[name].push(config);
        
        // HTMLElement to option
        config.element.addEventListener('change', function() {
            self.setOption(name, config.get.call(config.element));
        });
        
        // Option to HTMLElement (first call)
        config.set.call(config.element, this.getOption(name));
    }

    /**
     * Fire a bind
     * @param {String} name The option name
     * @param {*} value The options value
     */
    fireBind(name, value) {
        if (this.#binds[name]) {
            this.#binds[name].forEach(function(listener) {
                listener.set.call(listener.scope || this, value);
            }, this);
        }
    }

    /**
     * Listen to an event
     * @param {String} name The event name
     * @param {Object} config The listener configuration
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

    /**
     * Returns an option value
     * @param {String} name The option name
     * @returns {*} The value of the option
     */
    getOption(name) {
        return this.#options[name];
    }

    /**
     * Returns the options
     * @returns {Object} The options
     */
    getOptions() {
        return this.#options;
    }

    /**
     * Set an option. If the option has changed, it fire the associated binds and an event named event + 'change' (ex: widthchange)
     * @param {String} name The option name
     * @param {*} value The value
     */
    setOption(name, value) {
        if (this.#options[name] !== value) {
            this.#options[name] = value;
            this.fireBind(name, value);
            this.fireEvent(name + 'change', [value]);
        }
    }

    /**
     * Set a list of options.
     * @see {Automata.Object#setOption}
     * @param {*} options 
     */
    setOptions(options) {
        var name;

        for (name in options) {
            this.setOption(name, options[name]);
        }
    }
}

/**
 * Automata.Automata represents the automata view.<br>
 * It takes an HTMLElement that will be used to render.
 * @example
 * const myAutomata = new Automata.Automata(document.getElementById('automata'), {
 *      started: false,
 *      delay: 100,
 *      height: 100,
 *      width: 100,
 *      step: 10
 * });
 * 
 * myAutomata.setOption('started', true);
 */
Automata.Automata = class extends Automata.Object {

    #last = null;
    #layers = [];
    #element = null;
    #painted = false;
    
    /**
     * Automata.Automata constructor
     * @param {HTMLElement} element The element where the automata will be rendered
     * @param {Object} options The options
     * @param {Boolean} options.started True to start the automata
     * @param {Number} options.delay The delay (in ms) between each automata repaint
     * @param {Number} options.height The number of vertical cells 
     * @param {Number} options.width The number of horizontal cells
     * @param {Number} options.step The cell size (in px)
     */
    constructor(element, options) {
        
        // Super
        super(options);

        // Events
        this.listen('widthchange', {
            fn: this.#updateWidth,
            scope: this
        });
        this.listen('heightchange', {
            fn: this.#updateHeight,
            scope: this
        });
        this.listen('stepchange', {
            fn: this.#updateStep,
            scope: this
        });
        this.listen('startedchange', {
            fn: this.#updateStarted,
            scope: this
        });

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
     * Called after step option change. This repaint the Automata.
     * @private
     */
    #updateStep() {
        this.#reziseLayers()
        if (this.isPainted()) {
            this.repaint();
        }
    }

    /**
     * Called after height option change. This repaint the Automata.
     * @private
     */
    #updateHeight() {
        this.#reziseLayers()
        if (this.isPainted()) {
            this.repaint();
        }
    }

    /**
     * Called after width option change. This repaint the Automata.
     * @private
     */
    #updateWidth() {
        this.#reziseLayers()
        if (this.isPainted()) {
            this.repaint();
        }
    }

    /**
     * Called after started option change. This repaint the Automata.
     * @private
     */
    #updateStarted(value) {
        if (value) {
            this.repaint();
        }
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
     * Returns the Automata's layers
     * @returns {Array.<Automata.Layer>} The Automata's layers
     */
    getLayers() {
        return this.#layers;
    }

    /**
     * Returns the automata step option
     * @returns {Number} The automata step option
     */
    getStep() {
        return this.getOption('step');
    }

    /**
     * Returns the automata height option
     * @returns {Number} The automata height option
     */
    getHeight() {
        return this.getOption('height');
    }

    /**
     * Returns the automata width option
     * @returns {Number} The automata width option
     */
    getWidth() {
        return this.getOption('width');
    }

    /**
     * Returns the automata width and height option in an object
     * @returns {Object} The automata size
     */
    getSize() {
        return {
            height: this.getHeight(),
            width: this.getWidth()
        };
    }

    /**
     * Returns true if the Automata is painted
     * @returns {Boolean} The automata painted state
     */
    isPainted() {
        return this.#painted;
    }

    /**
     * Ask the Automata to determine its next state.
     * @example
     * const myAutomata = new Automata.Automata(document.getElementById('automata'), {
     *      started: false,
     *      delay: 100,
     *      height: 100,
     *      width: 100,
     *      step: 10
     * });
     * 
     * // Ask the automata to determine it's next state
     * myAutomata.next();
     * 
     * // Ask the automata to repaint
     * myAutomata.repaint();
     */
    next() {
        this.getLayers().forEach(function(layer) {
            layer.next();
        });
    }

    /**
     * Ask the Automata to repaint. If the automata options 'started' is true, it will repaint indefinitely while the 'started' option is set to false;
     */
    repaint() {
        var self = this,
            now = Date.now(),
            delay = this.getOption('delay');

        // Started
        if (this.getOption('started')) {

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

        // Flag
        this.#painted = true;
        
        // Request next frame
        if (self.getOption('started')) {
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
            this.#canvas.style.left = Math.round((automata.getElement().offsetWidth - width) / 2);
        } else {
            this.#canvas.style.left = 0;
        }
        if (height < automata.getElement().offsetHeight) {
            this.#canvas.style.top = Math.round((automata.getElement().offsetHeight - height) / 2);
        } else {
            this.#canvas.style.top = 0;
        }

        this.setDirty(true);
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
     * Returns the layer id option
     * @returns {Number} The layer id option
     */
    getId() {
        return this.getOption('id');
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
     * Returns the layer dirty state
     * @returns {Boolean} The layer dirty state
     */
    isDirty() {
        return this.#dirty;
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
            size = automata.getSize(),
            step = automata.getStep();

        // Clear
        context.clearRect(0, 0, size.width * step, size.height * step);

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
        context.clearRect(5, 5, 80, 20);
        context.fillStyle = '#FFFFFFDD';
        context.fillRect(5, 5, 40, 20);
        context.fillStyle = '#000000';
        context.fillText(this.#fps + ' FPS', 10, 20);
    }
}

/**
 * Automata.CellularLayer is a subclass of Automata.Layer.<br>
 * Developper should instanciate this class to draw an automata.
 * @example
 * const myAutomata = new Automata.Automata(document.getElementById('automata'), {
 *      started: false,
 *      delay: 100,
 *      height: 100,
 *      width: 100,
 *      step: 10
 * });
 * 
 * // Add a layer
 * automata.addLayer(new Automata.CellularLayer(automata, {
 *      id: 'layer-0',
 *      patterns: {
 *          'france-flag': function() {
 *              returns [{
 *                  x: 1, 
 *                  y: 1
 *              }, {
 *                  x: 2, 
 *                  y: 1
 *              }, {
 *                  x: 3, 
 *                  y: 3
 *              }];
 *          }
 *      },
 *      pattern: 'france-flag',
 *      colors: {
 *          'france-flag': function(cell) {
 *              if (cell.getX() === 1) {
 *                  return 'blue';
 *              }
 *              if (cell.getX() === 2) {
 *                  return 'white';
 *              }
 *              if (cell.getX() === 3) {
 *                  return 'red';
 *              }
 *              return 'transparent';
 *          }
 *      },
 *      color: 'france-flag';
 * }));
 * 
 * // Ask the automata to repaint
 * myAutomata.repaint();
 */
Automata.CellularLayer = class extends Automata.Layer {

    #cells = [];
    #array = [];

    /**
     * The Automata.CellularLayer constructor
     * @param {Automata.Automata} automata The automata
     * @param {Object} options The options
     * @param {Object} options.patterns A map of String<Function> that the layer will use as a pattern catalog
     * @param {String} options.pattern The default pattern
     * @param {Object} options.colors A map of String<Function> that the layer will use as a color catalog.
     * @param {String} options.color The default color
     */
    constructor(automata, options) {

        // Super
        super(automata, options);

        // Events
        this.listen('colorchange', {
            fn: this.#updateColor,
            scope: this
        });

        this.listen('patternchange', {
            fn: this.#updatePattern,
            scope: this
        });

        // Color
        if (this.getOption('color')) {
            this.#updateColor(this.getOption('color'));
        }

        // Pattern
        if (this.getOption('pattern')) {
            this.#updatePattern(this.getOption('pattern'));
        }
    }

    /**
     * Recreate the #cell and #array catalog according to the automata size
     * @param {Boolean} recover True to recover the previous cell state
     * @private
     */
    #createCells(recover) {
        var automata = this.getAutomata(),
            size = automata.getSize(),
            x, y;

        var cells = [],
            array = [];

        for (x = 0; x < size.width; x++) {
            cells[x] = [];
            for (y = 0; y < size.height; y++) {
                cells[x][y] = new Automata.Cell(this, {
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

    /**
     * Called after color option change. This repaint the Automata.
     * @private
     */
    #updateColor() {
        this.setDirty(true);
        this.getAutomata().repaint();
    }

    /**
     * Called after pattern option change. This repaint the Automata.
     * @private
     */
    #updatePattern(name) {
        var patterns = this.getOption('patterns'),
            data = patterns[name]();

        // Clear
        this.#createCells();

        // Load
        this.load(data);

        // Repaint
        this.getAutomata().repaint();
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
            cell.setAlive(false);
        });
        this.setDirty(true);
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
            y = Math.floor(value.y / this.getAutomata().getStep());

        this.getCellAt(x, y).invert();

        this.setDirty(true);

        this.getAutomata().repaint();

        this.#array.forEach(function(cell) {
            cell.propagateEvent(name, value);
        });
    }

    /**
     * Returns the cell alive option at coordinates. It returns false if there is no 
     * cell at the coordinates
     * @param {Number} x The x coordinate 
     * @param {Number} y The y coordinate 
     * @returns {Boolean} The cell alive option at coordinate
     */
    isAliveAt(x, y) {
        var cell = this.getCellAt(x, y);
        if (cell) {
            return cell.isAlive();
        }
        return false;
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
     * Returns the color code of the cell
     * @param {Automata.Cell} cell The ceell
     * @returns {String} The color code of the cell
     */
    getColorCode(cell) {
        return this.getOption('colors')[this.getOption('color')](cell);
    }

    /**
     * Load coordininates and set the cell as alive. The layer is marked 
     * as dirty. The Automate have to be repainted to see the result.
     * @param {Array.<Object>} coordinates The coordinates (ex: [{x: 1, y: 1}])
     */
    load(coordinates) {
        coordinates.forEach(function(coordinate) {
            this.#cells[coordinate.x][coordinate.y].setAlive(true);
        }, this);
        this.setDirty(true);
    }

    /**
     * Ask the Layer to determine its next state
     * @see {Automata.Automata#next}
     */
    next() {
        this.#array.forEach(function(cell) {
            cell.next();
        });
        this.setDirty(true);
    }

    /**
     * Redraw the layer
     * @param {RenderingContext} context The canvas rendering context
     * @see {Automata.Layer#redraw}
     */
    redraw(context) {
        var automata = this.getAutomata(),
            step = automata.getStep();

        this.#array.forEach(function(cell) {
            cell.redraw(context, step);
        });
    }
}

/**
 * Automata.Cell represents a cell in Automata.CellularLayer.<br>
 * Developpers should not instanciate this class but can use it to
 * draw specific shapes on the Automata.CellularLayer.
 */
Automata.Cell = class extends Automata.Object {
    
    #layer = null;
    #neighbors = [];
    #current = false;
    #next = false;

    /**
     * Automata.Cell constructor
     * @param {Automata.CellularLayer} layer The parent cellular layer
     * @param {Object} options The options
     * @param {Number} options.x The x coordinate
     * @param {Number} options.y The y coordinate
     */
    constructor(layer, options) {

        // Parent
        super(options);

        // Layer
        this.#layer = layer;
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
     * Ask the Cell to determine its next state
     * @private
     */
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

    /**
     * Ask the Cell to redraw
     * @param {RenderingContext} context the rendering context
     * @param {Number} step The automata state
     * @private
     */
    redraw(context, step) {
        this.#current = this.#next;
        if (this.#current) {
            context.fillStyle = this.#layer.getColorCode(this);
            context.fillRect(this.getX() * step, this.getY() * step, step, step);
        }
    }

    /**
     * Propagate event
     * @param {Event} name The event name
     * @param {*} value The event value
     * @private
     */
    propagateEvent(name, value) {
        // TODO : stuffs if its necessary ...
    }

    /**
     * Returns the parent CellularLayer
     * @returns {Automata.CellularLayer} The CellularLayer
     */
    getLayer() {
        return this.#layer;
    }

    /**
     * Returns the Cell x option
     * @returns {Number} The Cell x option
     */
    getX() {
        return this.getOption('x');
    }

    /**
     * Returns the Cell y option
     * @returns {Number} The Cell y option
     */
    getY() {
        return this.getOption('y');
    }

    /**
     * Set the alive state of the Cell
     * @param {Boolean} alive the alive state
     */
    setAlive(alive) {
        this.#current = alive;
        this.#next = alive;
    }

    /**
     * Returns the alive state of the Cell
     * @returns {Boolean} the alive stae
     */
    isAlive() {
        return this.#current;
    }

    /**
     * Invert the alive state of the Cell
     */
    invert() {
        this.setAlive(!this.isAlive());
    }
}
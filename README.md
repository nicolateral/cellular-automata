# Cellular-Automata
A javascript library for cellular automata.

## Features
Cellular Automata JS Library provides :
- Flexible height, width and cell size
- Repaint delay
- Play, Pause, Next
- Layer system
    - System layers
        - BackgroundLayer (grid)
        - InfoLayer (FPS ...)
    - Extensible CellularLayer
- Event system (ex: on cell mouse down)
- Configurable rules
    - Multiple cell state
    - Multiple cell color

## Usage
```html
<html>
    <script type="text/javascript" src="automata.js"></script>
    <body>
        <div id="automata">
        </div>
    </body>
    <script>
        // Instanciate new Automata
        const automata = new Automata.Automata(document.getElementById('automata'), {
            delay: 100,
            height: 10,
            width: 10,
            step: 10
        });

        // Add CellularLayer
        automata.addCellularLayer({
            id: 'layer-0'
        });

        // Load cells
        automata.getLayer('layer-0').load([{
            x: 5,
            y: 4,
            state: 1
        }, {
            x: 5,
            y: 5,
            state: 1
        }, {
            x: 5,
            y: 6,
            state: 1
        }]);

        automata.start();
    </script>
</html>
```
## Example

### Simple automata
![alt text](https://github.com/nicolateral/cellular-automata/blob/master/docs/resource/simple_automata.png?raw=true)

### Complex automata
![alt text](https://github.com/nicolateral/cellular-automata/blob/master/docs/resource/complex_automata.png?raw=true)

### Live examples
See expamples [here](https://nicolateral.github.io/cellular-automata/index.html)

## Documentation
See full documentation [here](https://nicolateral.github.io/cellular-automata/jsdoc/index.html)
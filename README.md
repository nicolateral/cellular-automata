# Cellular-Automata
A javascript library for create cellular automata.

## Overview
Create simple or complexe interactive cellular automata in a webpage.

### Simple automata
![alt text](https://github.com/nicolateral/cellular-automata/blob/master/docs/resource/simple_automata.png?raw=true)

### Complex automata
![alt text](https://github.com/nicolateral/cellular-automata/blob/master/docs/resource/complex_automata.png?raw=true)

## Usage
```html
<html>
    <script type="text/javascript" src="automata.js"></script>
    <body>
        <div id="automata">
        </div>
    </body>
    <script>

        // Creates the automata
        const automata = new Automata.Automata(document.getElementById('automata'), {
            started: false,
            delay: 100,
            height: 5,
            width: 5,
            step: 10
        });

        
        // Add a cellular layer
        automata.addCellularLayer({
            id: 'layer-0',
            color: 'red',
            colors: {
                'red': function() {
                    return '#FF0000';
                }
            }
        });

        // Draw 
        automata.getLayer('layer-0').load([{
            x: 1,
            y: 3
        }, {
            x: 2,
            y: 3
        }, {
            x: 3,
            y: 3
        }]);

        // Start
        automata.setOption('started', true);
    </script>
</html>
```
## Example
See expample [here](https://nicolateral.github.io/cellular-automata/index.html)

## Documentation
See full documentation [here](https://nicolateral.github.io/cellular-automata/jsdoc/index.html)
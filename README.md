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
        const automata = new Automata.Automata(document.getElementById('automata'), {
            started: false,
            delay: 100,
            height: 10,
            width: 10,
            step: 10
        });
        
        // Add a layer
        automata.addLayer(new Automata.CellularLayer(automata, {
            id: 'layer-0',
            patterns: {
                'france-flag': function() {
                    return [{
                        x: 4, 
                        y: 5
                    }, {
                        x: 5, 
                        y: 5
                    }, {
                        x: 6, 
                        y: 5
                    }];
                }
            },
            pattern: 'france-flag',
            colors: {
                'france-flag': function(cell) {
                    if (cell.getX() === 4) {
                        return 'blue';
                    }
                    if (cell.getX() === 5) {
                        return 'white';
                    }
                    if (cell.getX() === 6) {
                        return 'red';
                    }
                    return 'transparent';
                }
            },
            color: 'france-flag',
            rules: {
                'static': function(cell) {
                    return cell.isAlive();
                },
                'invert': function(cell) {
                    return !cell.isAlive();
                }
            },
            rule: 'invert'
        }));
        
        automata.setOption('started', true);
    </script>
</html>
```
## Example
See expample [here](https://nicolateral.github.io/cellular-automata/index.html)

## Documentation
See full documentation [here](https://nicolateral.github.io/cellular-automata/jsdoc/index.html)
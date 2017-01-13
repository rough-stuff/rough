# Rough.js

This is a light weight [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) based library that lets you draw in a _sketchy_, _hand-drawn-like_, style.
The library defines primitives to draw lines, curves, arcs, polygons, circles, and ellipses. It also supports drawing [SVG paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

This project was inspired by [Handy](http://www.gicentre.net/handy/), a java based library for [Processing](https://processing.org/).
Rough.js borrows some core algorithms from Handy, but it is _not a JS port_ for processing.js.

## Releases

The latest Rough.js release (beta version 0.1): [Download](./builds/rough.zip)

## How to use Rough.js

### Setup

Import rough.js

```html
<script type="text/javascript" src="https://roughjs.com/rough.min.js"></script>
```

Initialize a **RoughCanvas** object by passing in the canvas node and the size of the canvas. 
Following code snippet draws a 

``` javascript
var rough = new RoughCanvas(document.getElementById('myCanvas'), 400, 200);
rough.rectangle(10, 10, 200, 200); // x, y, width, height
```

### Drawing lines and shapes
``` javascript
rough.circle(80, 120, 50); // centerX, centerY, radius
rough.ellipse(300, 100, 150, 80); // centerX, centerY, radiusX, radiusY
rough.line(80, 120, 300, 100); // x1, y1, x2, y2
```

### Filling

``` javascript
rough.fill = "red";
rough.circle(50, 50, 40);
rough.rectangle(120,15,80,80);

var c2 = rough.circle(50, 150, 40);
c2.fill = "rgb(10,150,10)";
c2.fillWeight = 3;

var r2 = rough.rectangle(120,105,80,80);
r2.fillStyle = "solid";
r2.fill = "rgba(255,0,200,0.2)";

var r3 = rough.rectangle(220,15,80,80);
r3.hachureAngle = 60;
r3.hachureGap = 8;
```

### Sketching style

``` javascript
var r1 = rough.rectangle(15,15,80,80);
r1.roughness = 0.5;
r1.fill = "red";
var r2 = rough.rectangle(120,15,80,80);
r2.roughness = 2.8;
r2.fill = "blue";
var r3 = rough.rectangle(220,15,80,80);
r3.bowing = 15;
r3.stroke = "green"
r3.strokeWidth = 3;
```

### Arcs and Curves

### SVG Paths

### Dynamic shapes

## API


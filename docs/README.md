# Rough.js

This is a light weight, stand-alone [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) based library that lets you draw in a _sketchy_, _hand-drawn-like_, style.
The library defines primitives to draw lines, curves, arcs, polygons, circles, and ellipses. It also supports drawing [SVG paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

![Rough.js sample](https://roughjs.com/images/cap_demo.png)

## Credits

This project was inspired by [Handy](http://www.gicentre.net/handy/), a java based library for [Processing](https://processing.org/).
Rough.js borrows some core algorithms from Handy, but it is _not a JS port_ for processing.js.

## Releases

The latest Rough.js release (beta version 0.1): [Download](https://roughjs.com/builds/rough.zip)

## Examples

<table>
  <tr valign="top">
    <td width="25%">Simple Showcase<br><a href="https://bl.ocks.org/pshihn/96d0a885e77b065150f14cd5604427c9"><img width="133" src="https://bl.ocks.org/pshihn/raw/96d0a885e77b065150f14cd5604427c9/thumbnail.png"></a></td>

    <td width="25%">Sketchy Progress Bar<br><a href="https://bl.ocks.org/pshihn/921e6ab841a401ef02f96fcd03778a80"><img width="133" src="https://bl.ocks.org/pshihn/raw/921e6ab841a401ef02f96fcd03778a80/386951f4e25ec4c98a24a240458ea81a7e9143c1/thumbnail.png"></a></td>

    <td width="25%">Sketchy Bar Charts<br><a href="https://bl.ocks.org/pshihn/6aa0eb200962e0a8beabfbb340e29cdc"><img width="133" src="https://bl.ocks.org/pshihn/raw/6aa0eb200962e0a8beabfbb340e29cdc/5b9ee73de3d20161527b85ccac17760fc88fb9ae/thumbnail.png"></a></td>

    <td width="25%">Sketchy Pie Chart<br><a href="https://bl.ocks.org/pshihn/eae2a2dc6a6b3dfe56bdfdf8e3a334c4"><img width="133" src="https://bl.ocks.org/pshihn/raw/eae2a2dc6a6b3dfe56bdfdf8e3a334c4/8de4d756b297869773771ff3696839c977e5bde7/thumbnail.png"></a></td>

  </tr>
</table>

[More Examples...](https://github.com/pshihn/rough/wiki/Examples)

## API

[Rough.js API](https://github.com/pshihn/rough/wiki)


## How to use Rough.js

### Setup

Import rough.js

```html
<script type="text/javascript" src="https://roughjs.com/builds/rough.min.js"></script>
```

Initialize a **RoughCanvas** object by passing in the canvas node and the size of the canvas. 
Following code snippet draws a rectangle.

![Rough.js rectangle](https://roughjs.com/images/cap_rect.png)

``` javascript
var rough = new RoughCanvas(document.getElementById('myCanvas'), 400, 200);
rough.rectangle(10, 10, 200, 200); // x, y, width, height
```

### Drawing lines and ellipses

![Rough.js ellipses](https://roughjs.com/images/cap_ellipse.png)

``` javascript
rough.circle(80, 120, 50); // centerX, centerY, radius
rough.ellipse(300, 100, 150, 80); // centerX, centerY, radiusX, radiusY
rough.line(80, 120, 300, 100); // x1, y1, x2, y2
```

### Filling

![Rough.js fill examples](https://roughjs.com/images/cap_fill.png)

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

![Rough.js styles examples](https://roughjs.com/images/cap_styles.png)

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

![Rough.js arc](https://roughjs.com/images/cap_arc.png)

``` javascript
// arc(centerX, centerY, radiusX, radiusY, startAngle, endAngle, closePath)
var arc1 = rough.arc(200, 100, 200, 180, -Math.PI + (Math.PI / 3), -Math.PI / 2, true);
arc1.fill = "red";
rough.arc(200, 100, 200, 180, -Math.PI, -0.75 * Math.PI, true);
var openArc = rough.arc(200, 100, 150, 130, -0.2 * Math.PI, 0.6 * Math.PI, false);
openArc.strokeWidth = 10;
```

![Rough.js curve](https://roughjs.com/images/cap_curve.png)

``` javascript
var curve = rough.curve([[10, 10], [150, 65], [180, 165], [300, 20], [400, 200]]);
```

### SVG Paths

![Rough.js svg](https://roughjs.com/images/cap_svg.png)

``` javascript
var path = rough.path("M213.1,6.7c-32.4-14.4-73.7,0-88.1,30.6C110.6,4.9,67.5-9.5,36.9,6.7C2.8,22.9-13.4,62.4,13.5,110.9 C33.3,145.1,67.5,170.3,125,217c59.3-46.7,93.5-71.9,111.5-106.1C263.4,64.2,247.2,22.9,213.1,6.7z");
path.fill = "#424242";
path.hachureAngle = 90;
```

### Dynamic shapes

![Rough.js animating rectangle](https://roughjs.com/images/rect_animation.gif)

``` javascript
var rect = rough.rectangle(10,10,20,100);
var increaseWidth = function() {
  if (rect.width < 300) {
    rect.width = rect.width + 10;
    setTimeout(increaseWidth, 100);
  }
};
setTimeout(increaseWidth, 100);
```


## API

[Rough.js API](https://github.com/pshihn/rough/wiki)

## License

[MIT License](https://roughjs.com/LICENSE.txt)

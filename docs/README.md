# Rough.js

This is a light weight [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) based library that lets you draw in a _sketchy_, _hand-drawn-like_, style.
The library defines primitives to draw lines, curves, arcs, polygons, circles, and ellipses. It also supports drawing [SVG paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

This project was inspired by [Handy](http://www.gicentre.net/handy/), a java based library for [Processing](https://processing.org/).
Rough.js borrows some core algorithms from Handy, but it is _not a JS port_ for processing.js.

## Releases

The latest Rough.js release (beta version 0.1): [Download](./rough.zip)


# How to use Rough.js
## Setup
Initialize a **RoughCanvas** object by passing in the canvas node and the size of the canvas. 
Following code snippet draws a rectangle.
```html
<script src="dist/rough.min.js"></script>
<canvas id="myCanvas"></canvas>
```
```javascript
var rough = new RoughCanvas(document.getElementById('myCanvas'), 500, 500);
rough.rectangle(10, 10, 200, 200);
```
## Drawing lines and shapes

## Filling

## Sketching style

## Arcs and Curves

## SVG Paths

## Dynamic shapes

# API


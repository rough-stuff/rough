![Rough.js sample](https://roughjs.com/images/cap_demo.png)

# Rough.js

<b>[roughjs.com](https://roughjs.com)</b>

<b>Rough.js</b> is a light weight, stand-alone [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) based library that lets you draw in a _sketchy_, _hand-drawn-like_, style.
The library defines primitives to draw lines, curves, arcs, polygons, circles, and ellipses. It also supports drawing [SVG paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

## Install

The latest Rough.js can be downloaded from the [dist folder](https://github.com/pshihn/rough/tree/master/dist).

or from npm:

```
npm install --save roughjs
```

## Usage

```js
const rough = new RoughCanvas(document.getElementById('canvas'), 800, 800);
rough.rectangle(5, 5, 90, 90);
rough.circle(80, 170, 50);
rough.ellipse(300, 100, 150, 80);
rough.line(80, 170, 300, 100);
```

and check out more examples at [roughjs.com](https://roughjs.com).

## API & Documentation

Check out the website: [roughjs.com](https://roughjs.com)

and

[Full Rough.js API](https://github.com/pshihn/rough/wiki)


## Credits

This project was inspired by [Handy](http://www.gicentre.net/handy/), a java based library for [Processing](https://processing.org/).
Rough.js borrows some core algorithms from Handy, but it is _not a JS port_ for processing.js.


## License
[MIT License](https://github.com/pshihn/rough/blob/master/LICENSE) (c) [Preet Shihn](https://twitter.com/preetster)
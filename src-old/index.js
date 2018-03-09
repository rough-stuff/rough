import { RoughDrawable } from './drawable';
import { RoughArc } from './arc';
import { RoughCircle } from './circle';
import { RoughCurve } from './curve';
import { RoughEllipse } from './ellipse';
import { RoughLine } from './line';
import { RoughLinearPath } from './linear-path';
import { RoughPath } from './path';
import { RoughPolygon } from './polygon';
import { RoughRectangle } from './rectangle';

export default class RoughCanvas {
  constructor(canvas, width, height) {
    this._canvas = canvas;
    this.width = width || canvas.width;
    this.height = height || canvas.height;
    canvas.width = this.width;
    canvas.height = this.height;
    this._objects = [];
    this._drawRequested = false;

    this.roughness = 1;
    this.bowing = 1;

    this.stroke = "#000";
    this.strokeWidth = 1;

    this.fill = null;
    this.fillStyle = "hachure";
    this.fillWeight = -1;
    this.hachureAngle = -41;
    this.hachureGap = -1;

    this.maxRandomnessOffset = 2;
  }

  add(drawable) {
    if (drawable instanceof RoughDrawable) {
      if (drawable.attached) {
        return;
      }
      this._objects.push(drawable);
      drawable.attach(this, this._objects.length - 1);
      this.requestDraw();
    } else {
      console.warn("Ignoring canvas add - the object is not drawable", drawable);
    }
  }

  remove(drawable) {
    if (drawable instanceof RoughDrawable) {
      if (drawable.attached) {
        this._objects.splice(drawable.z, 1);
        drawable.detach();
        this.requestDraw();
      }
    } else {
      console.warn("Ignoring canvas remove - the object is not drawable", drawable);
    }
  }

  clear() {
    if (this._objects && this._objects.length) {
      this._objects.forEach(function (d) {
        d.detach();
      });
    }
    this._objects = [];
    this.requestDraw();
  }

  requestDraw() {
    if (!this._drawRequested) {
      this._drawRequested = true;
      window.requestAnimationFrame(() => {
        this._drawRequested = false;
        this._draw();
      });
    }
  }

  _draw() {
    const ctx = this._canvas.getContext("2d");
    ctx.clearRect(0, 0, this.width, this.height);
    for (var i = 0; i < this._objects.length; i++) {
      try {
        this._objects[i].draw(ctx);
      } catch (ex) {
        console.error(ex);
      }
    }
  }

  getHiddenCanvas() {
    if (!this._hiddenCanvas) {
      var div = document.createElement("div");
      div.setAttribute("id", "roughHiddenCanvas");
      div.style.overflow = "hidden";
      div.style.position = "absolute";
      div.style.left = "-1px";
      div.style.top = "-1px";
      div.style.width = "0px";
      div.style.height = "0px";
      div.style.opacity = 0;
      div.style.pointerEvents = "none";
      document.body.appendChild(div);
      this._hiddenCanvas = document.createElement("canvas");
      div.appendChild(this._hiddenCanvas);
    }
    var hc = this._hiddenCanvas;
    hc.width = this.width;
    hc.height = this.height;
    const ctx = hc.getContext("2d");
    ctx.clearRect(0, 0, this.width, this.height);
    return hc;
  }

  arc(x, y, width, height, start, stop, closed) {
    var d = new RoughArc(x, y, width, height, start, stop, closed);
    this.add(d);
    return d;
  }

  circle(x, y, radius) {
    var d = new RoughCircle(x, y, radius);
    this.add(d);
    return d;
  }

  ellipse(x, y, width, height) {
    var d = new RoughEllipse(x, y, width, height);
    this.add(d);
    return d;
  }

  curve(points) {
    var d = new RoughCurve(points);
    this.add(d);
    return d;
  }

  line(x1, y1, x2, y2) {
    var d = new RoughLine(x1, y1, x2, y2);
    this.add(d);
    return d;
  }

  rectangle(x, y, width, height) {
    var d = new RoughRectangle(x, y, width, height);
    this.add(d);
    return d;
  }

  linearPath(points) {
    var d = new RoughLinearPath(points);
    this.add(d);
    return d;
  }

  polygon(points) {
    var d = new RoughPolygon(points);
    this.add(d);
    return d;
  }

  path(d) {
    var p = new RoughPath(d);
    this.add(p);
    return p;
  }
}
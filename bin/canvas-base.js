const hasDocument = typeof document !== 'undefined';
export class RoughCanvasBase {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }
    draw(drawable) {
        const sets = drawable.sets || [];
        const o = drawable.options || this.getDefaultOptions();
        const ctx = this.ctx;
        for (const drawing of sets) {
            switch (drawing.type) {
                case 'path':
                    ctx.save();
                    ctx.strokeStyle = o.stroke;
                    ctx.lineWidth = o.strokeWidth;
                    this._drawToContext(ctx, drawing);
                    ctx.restore();
                    break;
                case 'fillPath':
                    ctx.save();
                    ctx.fillStyle = o.fill || '';
                    this._drawToContext(ctx, drawing);
                    ctx.restore();
                    break;
                case 'fillSketch':
                    this.fillSketch(ctx, drawing, o);
                    break;
                case 'path2Dfill': {
                    this.ctx.save();
                    this.ctx.fillStyle = o.fill || '';
                    const p2d = new Path2D(drawing.path);
                    this.ctx.fill(p2d);
                    this.ctx.restore();
                    break;
                }
                case 'path2Dpattern': {
                    const doc = this.canvas.ownerDocument || (hasDocument && document);
                    if (doc) {
                        const size = drawing.size;
                        const hcanvas = doc.createElement('canvas');
                        const hcontext = hcanvas.getContext('2d');
                        const bbox = this.computeBBox(drawing.path);
                        if (bbox && (bbox.width || bbox.height)) {
                            hcanvas.width = this.canvas.width;
                            hcanvas.height = this.canvas.height;
                            hcontext.translate(bbox.x || 0, bbox.y || 0);
                        }
                        else {
                            hcanvas.width = size[0];
                            hcanvas.height = size[1];
                        }
                        this.fillSketch(hcontext, drawing, o);
                        this.ctx.save();
                        this.ctx.fillStyle = this.ctx.createPattern(hcanvas, 'repeat');
                        const p2d = new Path2D(drawing.path);
                        this.ctx.fill(p2d);
                        this.ctx.restore();
                    }
                    else {
                        console.error('Cannot render path2Dpattern. No defs/document defined.');
                    }
                    break;
                }
            }
        }
    }
    computeBBox(d) {
        if (hasDocument) {
            try {
                const ns = 'http://www.w3.org/2000/svg';
                const svg = document.createElementNS(ns, 'svg');
                svg.setAttribute('width', '0');
                svg.setAttribute('height', '0');
                const pathNode = self.document.createElementNS(ns, 'path');
                pathNode.setAttribute('d', d);
                svg.appendChild(pathNode);
                document.body.appendChild(svg);
                const bbox = pathNode.getBBox();
                document.body.removeChild(svg);
                return bbox;
            }
            catch (err) { }
        }
        return null;
    }
    fillSketch(ctx, drawing, o) {
        let fweight = o.fillWeight;
        if (fweight < 0) {
            fweight = o.strokeWidth / 2;
        }
        ctx.save();
        ctx.strokeStyle = o.fill || '';
        ctx.lineWidth = fweight;
        this._drawToContext(ctx, drawing);
        ctx.restore();
    }
    _drawToContext(ctx, drawing) {
        ctx.beginPath();
        for (const item of drawing.ops) {
            const data = item.data;
            switch (item.op) {
                case 'move':
                    ctx.moveTo(data[0], data[1]);
                    break;
                case 'bcurveTo':
                    ctx.bezierCurveTo(data[0], data[1], data[2], data[3], data[4], data[5]);
                    break;
                case 'qcurveTo':
                    ctx.quadraticCurveTo(data[0], data[1], data[2], data[3]);
                    break;
                case 'lineTo':
                    ctx.lineTo(data[0], data[1]);
                    break;
            }
        }
        if (drawing.type === 'fillPath') {
            ctx.fill();
        }
        else {
            ctx.stroke();
        }
    }
}

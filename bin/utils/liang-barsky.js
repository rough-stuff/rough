export function clip(p1, p2, box) {
    const xmin = box.x;
    const xmax = box.x + box.width;
    const ymin = box.y;
    const ymax = box.y + box.height;
    let t0 = 0;
    let t1 = 1;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[0];
    let p = 0;
    let q = 0;
    let r = 0;
    for (let edge = 0; edge < 4; edge++) {
        if (edge === 0) {
            p = -dx;
            q = -(xmin - p1[0]);
        }
        if (edge === 1) {
            p = dx;
            q = (xmax - p1[0]);
        }
        if (edge === 2) {
            p = -dy;
            q = -(ymin - p1[1]);
        }
        if (edge === 3) {
            p = dy;
            q = (ymax - p1[1]);
        }
        r = q / p;
        if (p === 0 && q < 0) {
            return null;
        }
        if (p < 0) {
            if (r > t1)
                return null;
            else if (r > t0)
                t0 = r;
        }
        else if (p > 0) {
            if (r < t0)
                return null;
            else if (r < t1)
                t1 = r;
        }
    }
    return [
        [p1[0] + t0 * dx, p1[1] + t0 * dy],
        [p1[0] + t1 * dx, p1[1] + t1 * dy]
    ];
}

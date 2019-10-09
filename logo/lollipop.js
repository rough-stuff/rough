const makeLollipop = () => {
  let lollipop = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lollipop.setAttribute("width", "200");
  lollipop.setAttribute("height", "200");
  lollipop.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  document.body.appendChild(lollipop);
  const rc = rough.svg(lollipop);

  let outerBox = rc.rectangle(0, 0, 200, 200, {
    stroke: "red",
    fill: "#ffe8e8",
    fillStyle: "solid",
    strokeWidth: 5
  }); // x, y, width, height -- outer box
  let border = rc.rectangle(0, 0, 200, 200, {
    stroke: "red",
    strokeWidth: 5
  }); // x, y, width, height -- outer box
  let circle = rc.ellipse(88, 74, 124, 124, {
    stroke: "black",
    strokeWidth: 3,
    fill: "#ff0000",
    fillStyle: "zigzag",
    hachureGap: 11
  }); // x, y, width, height -- outer box
  let circleBack = rc.ellipse(88, 74, 124, 124, {
    stroke: "black",
    strokeWidth: 1,
    fill: "white",
    fillStyle: "solid",
    hachureGap: 11,
    curveStepCount: 6
  }); // x, y, width, height -- outer box

  let handle = rc.path("M30 198 L 66 127 L 74 133 L 50 198 Z", {
    fill: "white",
    fillStyle: "zigzag",
    stroke: "black",
    hachureAngle: 60, // angle of hachure,
    strokeWidth: 2,
    fillWeight: 3, // thicker lines for hachure
    hachureGap: 4
  });

  lollipop.appendChild(outerBox);
  lollipop.appendChild(handle);
  lollipop.appendChild(circleBack);
  lollipop.appendChild(circle);
  lollipop.appendChild(border);
};

makeLollipop();

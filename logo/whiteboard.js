const makeWhiteboard = () => {
  let whiteboard = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  // svg.setAttribute("style", "border: 1px solid black");
  whiteboard.setAttribute("width", "200");
  whiteboard.setAttribute("height", "200");
  whiteboard.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  document.body.appendChild(whiteboard);

  const rc = rough.svg(whiteboard);
  let outerBox = rc.rectangle(0, 0, 200, 200, {
    stroke: "blue",
    fill: "#fff3ff",
    fillStyle: "solid",
    strokeWidth: 6
  }); // x, y, width, height -- outer box
  let circle = rc.ellipse(73, 74, 110, 110, {
    stroke: "blue",
    strokeWidth: 2,
    fill: "rgba(255,0,255,0.4)"
  }); // x, y, width, height -- outer box
  let innerBox = rc.rectangle(112, 112, 87, 87, {
    roughness: 1.5,
    strokeWidth: 6,
    fill: "pink",
    stroke: "blue"
  }); // x, y, width, height -- outer box

  let triangle = rc.path("M0 162 L 66 127 L 66 198 Z", {
    fill: "pink",
    stroke: "blue",
    hachureAngle: 60, // angle of hachure,
    strokeWidth: 2,
    fillWeight: 3 // thicker lines for hachure
  });

  whiteboard.appendChild(outerBox);
  whiteboard.appendChild(circle);
  whiteboard.appendChild(innerBox);

  whiteboard.appendChild(triangle);
};

makeWhiteboard();

const makeRoughLogo = () => {
  let roughLogo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  roughLogo.setAttribute("width", "200");
  roughLogo.setAttribute("height", "200");
  roughLogo.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink"
  );
  roughLogo.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  document.body.appendChild(roughLogo);

  const rc = rough.svg(roughLogo);
  const pink = "rgba(255,0,255,0.4)";

  // The frame of the logo
  let outerBox = rc.rectangle(0, 0, 200, 200, {
    stroke: "blue",
    fill: "#fff3ff",
    fillStyle: "solid",
    strokeWidth: 6
  });

  let innerBox = rc.rectangle(0, 0, 60, 198, {
    roughness: 1.5,
    strokeWidth: 5,
    fill: pink,
    stroke: "blue",
    hachureAngle: 92,
    roughness: 1,
    fillWeight: 3,
    hachureGap: 15
  });

  const circleSize = [102, 70, 128, 128];
  // A backdrop to keep the solid background
  let circleBackdrop = rc.ellipse(...circleSize, {
    stroke: "blue",
    strokeWidth: 2,
    roughness: 1,
    fill: "white",
    fillStyle: "solid"
  }); // x, y, width, height
  let circle = rc.ellipse(...circleSize, {
    stroke: "blue",
    roughness: 1.5,
    strokeWidth: 4,
    fill: pink,
    fillStyle: "zigzag"
  }); // x, y, width, height

  let triangle = rc.path("M60 128 L 200 146 L 148 198 Z", {
    fill: pink,
    fillStyle: "dots",
    stroke: "blue",
    hachureAngle: 45,
    strokeWidth: 2.4,
    fillWeight: 3,
    roughness: 2.5,
    hachureGap: 5
  });

  roughLogo.appendChild(outerBox);
  roughLogo.appendChild(triangle);
  roughLogo.appendChild(innerBox);
  roughLogo.appendChild(circleBackdrop);
  roughLogo.appendChild(circle);
};

makeRoughLogo();

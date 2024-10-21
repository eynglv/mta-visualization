# Put it All Together

```js
import * as d3 from "npm:d3";
const ridershipData = FileAttachment("./data/julyRidershipData.json").json();
const geoJson = FileAttachment("./data/boroughBoundaries.json").json();
const mtaColorData = FileAttachment("./data/mtaColors.json").json();
const image = FileAttachment("./data/MTA_NYC_logo.png").image();
```

```js
import scatterplot from "./components/scatterplot.js";
import voronoiStippling from "./components/voronoiStippling.js";
import animated from "./components/animated.js";

const height = Math.round((width * image.height) / image.width);

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;

const context = canvas.getContext("2d");
context.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);

const { data: rgba } = context.getImageData(0, 0, width, height);
const data = new Float64Array(width * height);
for (let i = 0, n = rgba.length / 4; i < n; ++i) {
  data[i] = Math.max(0, 1 - rgba[i * 4] / 254);
}
data.width = width;
data.height = height;

const totalRidership = ridershipData.reduce(
  (accumulator, currValue) => accumulator + +currValue.ridership,
  0
);

const n = totalRidership;

const formattedData = {};
ridershipData.forEach((station) => {
  const ridership = parseFloat(station.ridership);
  const lines = station.station_lines;
  const primaryLine = lines[0];

  if (formattedData[primaryLine]) {
    formattedData[primaryLine] += ridership;
  } else {
    formattedData[primaryLine] = ridership;
  }
});

const pointsData = {
  data: {
    data,
    width,
    height,
    n,
  },
};

display(animated(ridershipData, geoJson, mtaColorData, image, pointsData));
```

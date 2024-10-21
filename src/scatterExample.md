# Just Getting It On The Page

```js
import * as d3 from "npm:d3";
const data = FileAttachment("./data/julyRidershipData.json").json();
const geoJson = FileAttachment("./data/boroughBoundaries.json").json();
const mtaColorData = FileAttachment("./data/mtaColors.json").json();
```

```js
import scatterplot from "./components/scatterplot.js";

display(scatterplot(data, geoJson, mtaColorData));
display(data);
```

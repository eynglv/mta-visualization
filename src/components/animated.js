import * as d3 from 'npm:d3';

function autoBox() {
    document.body.appendChild(this);
    const { x, y, width, height } = this.getBBox();
    document.body.removeChild(this);
    return [x, y, width, height];
}


const scatterplot = (data, geoJson, mtaColors) => {
    const totalRidership = data.reduce((accumulator, currValue) => accumulator + +currValue.ridership, 0);

    let colorScale = mtaColors.reduce((accumulator, color) => {
        const line = color.service
        if (line.includes(",")) {
            line.split(",").forEach((letter) => {
                accumulator[letter] = color.hex_color
            })
        } else if (line === 'Staten Island Railway') {
            accumulator['SIR'] = color.hex_color
        } else {
            accumulator[line] = color.hex_color
        }
        accumulator['110 St'] = '#02943a'
        return accumulator
    }, {})


    const svg = d3.create("svg").attr("class", "scatterplot");

    // Map of New York
    let projection = d3.geoEquirectangular()
    let geoGenerator = d3.geoPath().projection(projection)
    let nonStaten = geoJson.features.filter((feature) => (feature.properties.boro_name !== 'Staten Island'))
    let map = svg.append("g").selectAll("path").data(nonStaten).join('path').attr('d', geoGenerator).attr("fill", "white");
    ;

    // Clusters
    let clusterRadius;
    svg.selectAll("g").data(data).enter().append("g").each(function (d) {
        const g = d3.select(this)
        const ridership = +d.ridership
        for (let i = 0; i < ridership; i++) {
            clusterRadius = Math.random() * 0.09
            const angle = (i / ridership) * 2 * Math.PI;
            const offsetX = Math.cos(angle) * clusterRadius;
            const offsetY = Math.sin(angle) * clusterRadius;

            g.append("circle")
                .attr("cx", projection([d.longitude, d.latitude])[0] + offsetX)
                .attr("cy", projection([d.longitude, d.latitude])[1] + offsetY)
                .attr("r", 0.002)
                .attr("tranform", d => `translate(5, 1)`)
                .attr("fill", d => {
                    if (colorScale[d.station_lines[0]]) {
                        return colorScale[d.station_lines[0]]
                    } else {
                        console.log(d)
                    }
                    return "white"
                })
        }
    })

    return svg.attr("viewBox", autoBox).node();
}

const script = () => {
    const blob = new Blob([`
  importScripts("https://cdn.jsdelivr.net/npm/d3-delaunay@6.0.4/dist/d3-delaunay.min.js");

  
  onmessage = event => {
    const {data: {data, width, height, n}} = event;
    const points = new Float64Array(n * 2);
    const c = new Float64Array(n * 2);
    const s = new Float64Array(n);
  
    // Initialize the points using rejection sampling.
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < 30; ++j) {
        const x = points[i * 2] = Math.floor(Math.random() * width);
        const y = points[i * 2 + 1] = Math.floor(Math.random() * height);
        if (Math.random() < data[y * width + x]) break;
      }
    }
  
    const delaunay = new d3.Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
  
    for (let k = 0; k < 90; ++k) {
  
      // Compute the weighted centroid for each Voronoi cell.
      c.fill(0);
      s.fill(0);
      for (let y = 0, i = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const w = data[y * width + x];
          i = delaunay.find(x + 0.5, y + 0.5, i);
          s[i] += w;
          c[i * 2] += w * (x + 0.5);
          c[i * 2 + 1] += w * (y + 0.5);
        }
      }
  
      // Relax the diagram by moving points to the weighted centroid.
      // Wiggle the points a little bit so they don’t get stuck.
      const w = Math.pow(k + 1, -0.8) * 10;
      for (let i = 0; i < n; ++i) {
        const x0 = points[i * 2], y0 = points[i * 2 + 1];
        const x1 = s[i] ? c[i * 2] / s[i] : x0, y1 = s[i] ? c[i * 2 + 1] / s[i] : y0;
        points[i * 2] = x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * w;
        points[i * 2 + 1] = y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * w;
      }
  
      postMessage({ points: Array.from(points), voronoiPoints: Array.from(delaunay.points) });
      voronoi.update();
    }
  
    close();
  };
  `], { type: "text/javascript" });

    const scriptURL = URL.createObjectURL(blob);
    const cleanup = () => {
        URL.revokeObjectURL(scriptURL);  // Free up the object URL
    };
    return { scriptURL, cleanup };
}

const voronoiStippling = (formattedData, mtaColors, pointsData) => {
    let colorScale = mtaColors.reduce((accumulator, color) => {
        const line = color.service
        if (line.includes(",")) {
            line.split(",").forEach((letter) => {
                accumulator[letter] = color.hex_color
            })
        } else if (line === 'Staten Island Railway') {
            accumulator['SIR'] = color.hex_color
        } else {
            accumulator[line] = color.hex_color
        }
        accumulator['110 St'] = '#02943a'
        return accumulator
    }, {})

    const { data: { width, height, data, n } } = pointsData
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    const { scriptURL, cleanup } = script(); // Call the function to get the script URL

    const worker = new Worker(scriptURL);

    const totalRidership = n
    const createRidershipGradient = (context, x0, y0, x1, y1) => {
        const gradient = context.createLinearGradient(x0, y0, x1, y1)
        let accumulatedRatio = 0;

        Object.keys(formattedData).forEach(line => {
            const ridership = formattedData[line];
            const color = colorScale[line];
            const ratio = ridership / totalRidership;

            // Add color stop proportional to ridership
            if (ratio) {
                gradient.addColorStop(accumulatedRatio, color);
                accumulatedRatio += ratio;
                gradient.addColorStop(accumulatedRatio, color);
            }
        });

        return gradient;
    }

    const messaged = ({ data: { points, voronoiPoints } }) => {
        context.fillStyle = "#fff";
        context.fillRect(0, 0, width, height);
        context.beginPath();
        for (let i = 0, n = points.length; i < n; i += 2) {
            const j = i / 2
            const x = points[i], y = points[i + 1];
            context.moveTo(x + 1.5, y);
            context.arc(x, y, 1.5, 0, 2 * Math.PI);
        }
        const gradient = createRidershipGradient(context, 0, 0, width, height);
        context.fillStyle = gradient;
        context.fill();

    };



    worker.addEventListener("message", messaged);
    worker.postMessage({ data, width, height, n });

    // cleanup();
    // worker.terminate();

    return context.canvas;
}

const animated = (ridershipData, geoJson, mtaColorData, image, pointsData) => {
    const initial = scatterplot(ridershipData, geoJson, mtaColorData)
    // const t = d3.transition().duration(2000).attrTween("cx", function (d, i) {
    //     const voronoiPoint = voronoiPoints[i];  // Get the Voronoi target position
    //     const interpolateX = d3.interpolate(d.cx, voronoiPoint[0]);
    //     return function (t) { return interpolateX(t); };
    // })
    // d3.selectAll("svg").transition(t)


    // return initial
}

const updateTransition = (voronoiPoints) => {

}

export default animated;
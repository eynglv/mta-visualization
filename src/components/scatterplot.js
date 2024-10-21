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
    let map = svg.append("g").selectAll("path").data(nonStaten).join('path').attr('d', geoGenerator).attr("fill", "gray");
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

export default scatterplot;
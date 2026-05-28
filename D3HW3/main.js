// Steam Hardware Survey interactive chart
//
// Important notes:
// If you double-click index.html, browsers usually block d3.csv("steam_brands.csv").
// To avoid that problem, this page uses a file input + FileReader.

// ---------- Basic chart setup ----------

const width = 850;
const height = 450;

const margin = {
    top: 45,
    right: 120,
    bottom: 45,
    left: 60
};

// These are the columns in steam_brands.csv.
// Each category has a title and the lines that should be drawn.
const chartOptions = {
    cpu: {
        title: "CPU brand share among Steam users",
        lines: [
            { column: "cpu_intel", name: "Intel CPU", color: "#0071c5" },
            { column: "cpu_amd", name: "AMD CPU", color: "#ed1c24" }
        ]
    },
    gpu: {
        title: "GPU brand share among Steam users",
        lines: [
            { column: "gpu_nvidia", name: "Nvidia GPU", color: "#76b900" },
            { column: "gpu_amd", name: "AMD GPU", color: "#ed1c24" },
            { column: "gpu_intel", name: "Intel GPU", color: "#0071c5" }
        ]
    }
};

// Store the CSV data here after the user uploads it.
let data = [];

// Store the current interaction choices here.
let selectedCategory = "cpu";
let selectedStartYear = 2014;

// Date parser for values like 2014-01-01.
const parseDate = d3.timeParse("%Y-%m-%d");

// ---------- Create SVG and reusable D3 pieces ----------

const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

const title = svg.append("text")
    .attr("class", "chart-title")
    .attr("x", margin.left)
    .attr("y", 25);

const xScale = d3.scaleTime()
    .range([margin.left, width - margin.right]);

const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top]);

const xAxisGroup = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`);

const yAxisGroup = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left}, 0)`);

const lineGroup = svg.append("g");
const labelGroup = svg.append("g");

// This function converts data points into an SVG path.
const lineGenerator = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

// ---------- Load CSV from file input ----------

d3.select("#csvFile").on("change", function (event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function (readerEvent) {
        const csvText = readerEvent.target.result;

        // d3.csvParse turns CSV text into an array of objects.
        data = d3.csvParse(csvText, row => {
            return {
                date: parseDate(row.date),
                cpu_intel: +row.cpu_intel,
                cpu_amd: +row.cpu_amd,
                gpu_nvidia: +row.gpu_nvidia,
                gpu_amd: +row.gpu_amd,
                gpu_intel: +row.gpu_intel
            };
        });

        d3.select("#status").text("CSV loaded. Use the controls to update the chart.");

        // Turn on the controls after the data exists.
        d3.select("#categorySelect").property("disabled", false);
        d3.select("#yearSlider").property("disabled", false);
        d3.select("#resetButton").property("disabled", false);

        drawChart();
    };

    reader.readAsText(file);
});

// ---------- Interaction event listeners ----------

d3.select("#categorySelect").on("change", function () {
    selectedCategory = this.value;
    drawChart();
});

d3.select("#yearSlider").on("input", function () {
    selectedStartYear = +this.value;
    d3.select("#yearLabel").text(selectedStartYear);
    drawChart();
});

d3.select("#resetButton").on("click", function () {
    selectedCategory = "cpu";
    selectedStartYear = 2014;

    d3.select("#categorySelect").property("value", selectedCategory);
    d3.select("#yearSlider").property("value", selectedStartYear);
    d3.select("#yearLabel").text(selectedStartYear);

    drawChart();
});

// ---------- Main drawing function ----------

function drawChart() {
    const option = chartOptions[selectedCategory];

    // Keep only rows at or after the selected year.
    let visibleData = data.filter(d => d.date.getFullYear() >= selectedStartYear);

    // The GPU columns have a few bad months where values are 0.
    // This removes those months so the line does not falsely drop to zero.
    if (selectedCategory === "gpu") {
        visibleData = visibleData.filter(d => d.gpu_nvidia !== 0 || d.gpu_amd !== 0);
    }

    // Update the x-axis to match the selected year range.
    xScale.domain(d3.extent(visibleData, d => d.date));

    const xAxis = d3.axisBottom(xScale)
        .ticks(7)
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d + "%");

    xAxisGroup
        .transition()
        .duration(600)
        .call(xAxis);

    yAxisGroup
        .transition()
        .duration(600)
        .call(yAxis);

    title.text(`${option.title} (${selectedStartYear}–2026)`);

    // Reshape the data from rows into line objects.
    // D3 likes this structure for multi-line charts.
    const lineData = option.lines.map(lineInfo => {
        return {
            name: lineInfo.name,
            color: lineInfo.color,
            values: visibleData.map(row => {
                return {
                    date: row.date,
                    value: row[lineInfo.column]
                };
            })
        };
    });

    // Draw/update the lines.
    const lines = lineGroup.selectAll(".line")
        .data(lineData, d => d.name);

    lines.exit()
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();

    lines.enter()
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke-width", 3)
        .attr("stroke", d => d.color)
        .attr("d", d => lineGenerator(d.values))
        .style("opacity", 0)
        .merge(lines)
        .transition()
        .duration(800)
        .attr("stroke", d => d.color)
        .attr("d", d => lineGenerator(d.values))
        .style("opacity", 1);

    // Draw & update labels at the end of each line.
    const labels = labelGroup.selectAll(".line-label")
        .data(lineData, d => d.name);

    labels.exit()
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();

    labels.enter()
        .append("text")
        .attr("class", "line-label")
        .style("opacity", 0)
        .merge(labels)
        .transition()
        .duration(800)
        .attr("x", d => {
            const lastPoint = d.values[d.values.length - 1];
            return xScale(lastPoint.date) + 8;
        })
        .attr("y", d => {
            const lastPoint = d.values[d.values.length - 1];
            return yScale(lastPoint.value) + 4;
        })
        .attr("fill", d => d.color)
        .text(d => d.name)
        .style("opacity", 1);
}

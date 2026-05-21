/*
    D3 HW2 main chart file

    This file:
    1. Loads data from an external CSV file with d3.csv().
    2. Creates a multi-line chart using d3.line().
    3. Uses SVG text for the title, subtitle, axis label, and line labels.
    4. Uses CSS for styling.
*/

    // The chart is wrapped in a function so it can redraw when the browser window changes size.
function drawChart() {
        // Clear the old chart before redrawing.
    d3.select("#chart").selectAll("*").remove();

        // Measure the chart container so the SVG can fit the available width.
    const container = d3.select("#chart");
    const containerWidth = container.node().getBoundingClientRect().width;

        // Margins reserve room for SVG text, axes, and line labels.
    const margin = { top: 88, right: 130, bottom: 64, left: 68 };
    const width = containerWidth;
    const height = 620;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

        // Create the SVG canvas.
    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Multi-line chart showing Steam CPU and GPU brand share over time.");

        // A translated group lets us draw the chart inside the margins.
    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Tooltip div is HTML, not SVG, because it is easier to position and style.
    const tooltip = d3.select("body")
        .selectAll(".tooltip")
        .data([null])
        .join("div")
        .attr("class", "tooltip");

        // Load the local CSV.
        // The CSV should be in the same folder as index.html, main.js, and style.css.
    d3.csv("./steam_brands.csv").then(rawData => {
            // Parse dates and convert string percentages into numbers.
        const parseDate = d3.timeParse("%Y-%m-%d");

        const data = rawData.map(d => ({
            date: parseDate(d.date),
            cpu_intel: +d.cpu_intel,
            cpu_amd: +d.cpu_amd,
            gpu_nvidia: +d.gpu_nvidia,
            gpu_amd: +d.gpu_amd,
            gpu_intel: +d.gpu_intel
        }));

            // Each object describes one line.
            // The key matches a column name in the CSV.
        const series = [
            { key: "cpu_intel", label: "CPU · Intel", type: "CPU", color: "#006494" },
            { key: "cpu_amd", label: "CPU · AMD", type: "CPU", color: "#A84B2F" },
            { key: "gpu_nvidia", label: "GPU · NVIDIA", type: "GPU", color: "#20808D" },
            { key: "gpu_amd", label: "GPU · AMD", type: "GPU", color: "#DA7101" },
            { key: "gpu_intel", label: "GPU · Intel", type: "GPU", color: "#7A39BB" }
        ];

            // Convert the wide CSV into long-form data.
            // D3 line charts are easier to draw when each line has its own array of values.
        const lineData = series.map(s => ({
            ...s,
            values: data.map(d => ({
                date: d.date,
                value: d[s.key]
            })).filter(d => !Number.isNaN(d.value))
        }));

            // X scale maps dates to horizontal positions.
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, innerWidth]);

            // Y scale maps percentages to vertical positions.
        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([innerHeight, 0]);

            // Color scale assigns each line a consistent color.
        const color = d3.scaleOrdinal()
            .domain(series.map(d => d.label))
            .range(series.map(d => d.color));

            // d3.line() converts each series of date/value points into an SVG path.
        const line = d3.line()
            .defined(d => d.value !== null && !Number.isNaN(d.value))
            .x(d => x(d.date))
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX);

            // Horizontal gridlines make it easier to estimate percentages.
        chart.append("g")
            .attr("class", "grid")
            .call(
                d3.axisLeft(y)
                    .ticks(5)
                    .tickSize(-innerWidth)
                    .tickFormat("")
            );

            // X axis at bottom.
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(
                d3.axisBottom(x)
                    .ticks(d3.timeYear.every(2))
                    .tickFormat(d3.timeFormat("%Y"))
            );

            // Y axis at left.
        chart.append("g")
            .attr("class", "axis")
            .call(
                d3.axisLeft(y)
                    .ticks(5)
                    .tickFormat(d => `${d}%`)
            );

            // Draw one path per brand.
        chart.selectAll(".line")
            .data(lineData)
            .join("path")
            .attr("class", "line")
            .attr("d", d => line(d.values))
            .attr("stroke", d => color(d.label))
            .attr("stroke-width", d => d.type === "CPU" ? 3.2 : 2.6)
            .attr("opacity", d => d.type === "CPU" ? 0.95 : 0.86);

            // Add invisible circles at each data point to support tooltip interaction.
        chart.selectAll(".point-group")
            .data(lineData)
            .join("g")
            .attr("class", "point-group")
            .attr("fill", d => color(d.label))
            .selectAll("circle")
            .data(d => d.values.map(v => ({
                ...v,
                label: d.label,
                color: color(d.label)
            })))
            .join("circle")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.value))
            .attr("r", 3)
            .attr("opacity", 0)
            .on("mouseenter", function(event, d) {
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("r", 5);

                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.label}</strong>
                        ${d3.timeFormat("%B %Y")(d.date)}<br>
                        ${d.value.toFixed(1)}% of surveyed systems
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", `${event.clientX + 14}px`)
                    .style("top", `${event.clientY + 14}px`);
            })
            .on("mouseleave", function() {
                d3.select(this)
                    .attr("opacity", 0)
                    .attr("r", 3);

                tooltip.style("opacity", 0);
            });

            // Direct line labels are easier to read than a separate legend.
        chart.selectAll(".line-label")
            .data(lineData)
            .join("text")
            .attr("class", "line-label")
            .attr("x", d => x(d.values[d.values.length - 1].date) + 8)
            .attr("y", d => y(d.values[d.values.length - 1].value))
            .attr("dy", "0.32em")
            .attr("fill", d => color(d.label))
            .text(d => d.label);

            // SVG text: chart title.
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", margin.left)
            .attr("y", 34)
            .text("CPU and GPU brand share among Steam Windows users");

            // SVG text: chart subtitle.
        svg.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", margin.left)
            .attr("y", 58)
            .text("CPU vendor is reported directly; GPU brand is estimated by grouping video card model names.");

            // SVG text: y-axis label.
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left)
            .attr("y", height - 16)
            .text("Monthly share of surveyed systems (%)");
    });
}

    // Initial chart draw.
drawChart();

    // Redraw chart on resize.
    // The timeout prevents too many redraws while resizing the browser.
let resizeTimer;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawChart, 200);
});
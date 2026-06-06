
// Margins follow the usual D3 convention: the inner "plot" area sits inside
// these margins so axes/labels
const margin = { top: 30, right: 120, bottom: 45, left: 55 };
const width  = 860 - margin.left - margin.right;
const height = 460 - margin.top  - margin.bottom;

// Brand colors chosen to read instantly: Intel blue, AMD red
const COLOR = { intel: "#0a6cb8", amd: "#d62828" };

// 2. Create the SVG canvas 
const svg = d3.select("#chart")
  .append("svg")
    // viewBox + no fixed width lets the chart scale responsively via CSS
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("role", "img")
    .attr("aria-label", "Diverging area chart of Intel vs AMD CPU share among Steam gamers, 2014 to 2026");

// The plot group is shifted in by the left/top margins (D3 convention).
const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 3. Load the cleaned CSV
// d3.csv returns a Promise, so the chart is drawn inside .then().
d3.csv("cpu_market_share.csv", d => ({
  date:  d3.timeParse("%Y-%m-%d")(d.date),
  intel: +d.intel,
  amd:   +d.amd
})).then(draw);

//4. Main draw
function draw(data) {

  // Scales
  // x: time scale spanning the full date range
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  // y: share 0–100%. Drawn so 0% is at the BOTTOM and 100% at the TOP.
  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  // area generators
  // AMD fills from the baseline (0%) UP to its share -> grows from the bottom.
  const amdArea = d3.area()
    .x(d => x(d.date))
    .y0(y(0))
    .y1(d => y(d.amd))
    .curve(d3.curveMonotoneX);

  // Intel fills from the TOP (100%) DOWN to where AMD ends (i.e. its share).
  // y0 = top of canvas, y1 = the dividing line at AMD's share value.
  const intelArea = d3.area()
    .x(d => x(d.date))
    .y0(y(100))
    .y1(d => y(d.amd))
    .curve(d3.curveMonotoneX);

  // The dividing "frontline" between the two armies.
  const frontline = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.amd))
    .curve(d3.curveMonotoneX);

  // Draw the two areas
  g.append("path").datum(data).attr("class", "area-intel").attr("fill", COLOR.intel).attr("d", intelArea);
  g.append("path").datum(data).attr("class", "area-amd").attr("fill", COLOR.amd).attr("d", amdArea);

  // The white frontline makes the moving boundary the visual hero.
  g.append("path").datum(data).attr("class", "frontline").attr("d", frontline);

  // axis
  // x axis: show a tick every 2 years for a clean, readable timeline
  g.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(2)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));

  // y axis: percentages, light ticks
  g.append("g")
    .attr("class", "axis y-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%").tickSizeOuter(0));

  // Direct labels
    const last = data[data.length - 1];
  g.append("text").attr("class", "brand-label brand-intel")
    .attr("x", width + 8).attr("y", y(100 - last.intel / 2))
    .html("INTEL");
  g.append("text").attr("class", "brand-sub")
    .attr("x", width + 8).attr("y", y(100 - last.intel / 2) + 18)
    .text(`${last.intel.toFixed(0)}%`);

  g.append("text").attr("class", "brand-label brand-amd")
    .attr("x", width + 8).attr("y", y(last.amd / 2))
    .html("AMD");
  g.append("text").attr("class", "brand-sub")
    .attr("x", width + 8).attr("y", y(last.amd / 2) + 18)
    .text(`${last.amd.toFixed(0)}%`);

  const lowPoint = data.reduce((m, d) => (d.amd < m.amd ? d : m), data[0]);
  const annoX = x(lowPoint.date);
  const annoY = y(lowPoint.amd);

  const calloutY = annoY - 175;     
  const anno = g.append("g").attr("class", "annotation");
  anno.append("line")               
    .attr("x1", annoX).attr("x2", annoX)
    .attr("y1", annoY - 8).attr("y2", calloutY + 6);
  anno.append("circle")             
    .attr("cx", annoX).attr("cy", annoY).attr("r", 4);
  anno.append("text")               // two-line callout, drawn on the blue band
    .attr("x", annoX + 8).attr("y", calloutY)
    .selectAll("tspan")
    .data(["AMD bottoms out near 8% (late 2017)", "— just as the first Ryzen chips arrive"])
    .join("tspan")
      .attr("x", annoX + 8)
      .attr("dy", (d, i) => i === 0 ? 0 : 16)
      .attr("class", (d, i) => i === 0 ? "anno-title" : "anno-detail")
      .text(d => d);

  // Interaction here is in service of the narrative: it lets a reader
  // do the reading, exact monthly numbers.

  const focusLine = g.append("line").attr("class", "focus-line").style("opacity", 0)
    .attr("y1", 0).attr("y2", height);
  const focusDot = g.append("circle").attr("class", "focus-dot").attr("r", 4).style("opacity", 0);

  const tooltip = d3.select("#chart").append("div").attr("class", "tooltip").style("opacity", 0);

  // bisector finds the data point nearest the mouse along the x (time) axis
  const bisect = d3.bisector(d => d.date).left;

  // a transparent overlay captures mouse movement across the whole plot
  g.append("rect")
    .attr("class", "overlay")
    .attr("width", width).attr("height", height)
    .style("fill", "none").style("pointer-events", "all")
    .on("mouseenter", () => {
      focusLine.style("opacity", 1); focusDot.style("opacity", 1);
      tooltip.style("opacity", 1);
    })
    .on("mousemove", function (event) {
      // map pixel -> date, then find the closest month in the data
      const mx = d3.pointer(event, this)[0];
      const x0 = x.invert(mx);
      let i = bisect(data, x0);
      const d0 = data[Math.max(0, i - 1)], d1 = data[Math.min(data.length - 1, i)];
      const d = (!d0) ? d1 : (!d1) ? d0 : (x0 - d0.date > d1.date - x0 ? d1 : d0);

      const px = x(d.date), py = y(d.amd);
      focusLine.attr("x1", px).attr("x2", px);
      focusDot.attr("cx", px).attr("cy", py);

      tooltip.html(
        `<div class="tt-date">${d3.timeFormat("%b %Y")(d.date)}</div>` +
        `<div class="tt-row"><span class="sw" style="background:${COLOR.intel}"></span>Intel <b>${d.intel.toFixed(1)}%</b></div>` +
        `<div class="tt-row"><span class="sw" style="background:${COLOR.amd}"></span>AMD <b>${d.amd.toFixed(1)}%</b></div>`
      )
      // position tooltip near cursor but keep it inside the figure
      .style("left", (margin.left + px + 14) + "px")
      .style("top",  (margin.top + py - 10) + "px");
    })
    .on("mouseleave", () => {
      focusLine.style("opacity", 0); focusDot.style("opacity", 0);
      tooltip.style("opacity", 0);
    });
}

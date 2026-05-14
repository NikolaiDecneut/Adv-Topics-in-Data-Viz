// Set the chart size and margins.
const width = 800;
const height = 500;
const margin = { top: 40, right: 30, bottom: 90, left: 80 };

// Create the SVG container.
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Load the external CSV file.
d3.csv("apex_players.csv").then(function(data) {

  // Convert player values from text to numbers.
  data.forEach(function(d) {
    d.avg_players = +d.avg_players;
  });

  // Create the x and y scales.
  const x = d3.scaleBand()
    .domain(data.map(function(d) { return d.month; }))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return d.avg_players; })])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Draw the bars.
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.month); })
    .attr("y", function(d) { return y(d.avg_players); })
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - margin.bottom - y(d.avg_players); })
    .attr("fill", "#ff4655");

  // Add the x-axis.
  svg.append("g")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  // Add the y-axis.
  svg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y));

  // Add a y-axis label.
  svg.append("text")
    .attr("x", -260)
    .attr("y", 25)
    .attr("transform", "rotate(-90)")
    .text("Average Steam Players");
});

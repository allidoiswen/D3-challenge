// Define variables
let svgWidth = 800;
let svgHeight = 500;

let margin = {
    top : 20,
    right : 40,
    bottom : 100,
    left : 40
}

let width = svgWidth - margin.left - margin.right;
let height = svgHeight - margin.top - margin.bottom;

// Create an SVG tag in HTML
let svg = d3.select("#scatter")
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);

// Create a g tab in svg
var chartGroup = svg.append("g");

// Move the g group to a desired location
chartGroup.attr("transform", `translate(${margin.left}, ${margin.top})`);

// Init Param for x-axis data
var chosenXAxis = "poverty";

// function used for updating x-scale var upon click on axis label
function xScale(data, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenXAxis]) * 0.8,
      d3.max(data, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

var chosenYAxis = "healthcare";
// function used for updating y-scale var upon click on axis label
function yScale(data, chosenYAxis) {
  // create scales
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenYAxis]) * 0.5,
      d3.max(data, d => d[chosenYAxis]) * 1.1
    ])
    .range([height, 0]);

  return yLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderXAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

function renderYAxes(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

// new state abbr
function renderStateAbbr(abbrGroup, newXScale, chosenXAxis) {

  abbrGroup.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[chosenXAxis]));

  return abbrGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  var xlabel;
  var ylabel = "Healthcare (%)";

  switch (chosenXAxis) {
    case "poverty" : xlabel = "In Poverty (%)";
    break;

    case "age" : xlabel = "Age (Median)";
    break;

    case "income" : xlabel = "Household Income (Median)";
    break;
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function(d) {return (`${d.abbr}<br>${xlabel}:${d[chosenXAxis]} <br> ${ylabel}:${d.healthcare}`);});

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

d3.csv("assets/data/data.csv").then(function(data) {

  // Convert Strings to Numbers
  data.forEach(function(data){
    data.poverty    = +data.poverty;
    data.age        = +data.age;
    data.income     = +data.income;
    data.obesity    = +data.obesity;
    data.smokes     = +data.smokes;
    data.healthcare = +data.healthcare;
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(data, chosenXAxis);

  // Create y scale function
  var yLinearScale = yScale(data, chosenYAxis);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  var yAxis = chartGroup.append("g").call(leftAxis);

  // append state abbr by adding another g tag to host them
  var abbrGroup = chartGroup.append("g").selectAll("text")
  .data(data)
  .enter()
    .append("text")
    .classed("stateAbbr", true)
    .attr("x",  d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d.healthcare))
    .attr("dx", "-.60em")
    .attr("dy", ".35em")
    .text(d => d.abbr);

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(data)
    .enter()
      .append("circle")
      .attr("cx", d => xLinearScale(d[chosenXAxis]))
      .attr("cy", d => yLinearScale(d.healthcare))
      .attr("r", 10)
      .attr("fill", "blue")
      .attr("opacity", ".5");


  // Create group for THREE x-axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("In Poverty (%)");

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age (Median)");

  var incomeLabel = labelsGroup.append("text")
  .attr("x", 0)
  .attr("y", 60)
  .attr("value", "income") // value to grab for event listener
  .classed("inactive", true)
  .text("Household Income (Median)");


  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Lacks Healthcare (%)");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

// x axis labels event listener
labelsGroup.selectAll("text").on("click", function() {
  // get value of selection
  var value = d3.select(this).attr("value");
  if (value !== chosenXAxis) {
    // replaces chosenXAxis with value
    chosenXAxis = value;

    console.log(chosenXAxis)

    // functions here found above csv import
    // updates x scale for new data
    xLinearScale = xScale(data, chosenXAxis);
    yLinearScale = yScale(data, chosenYAxis);

    // updates axis with transition
    xAxis = renderXAxes(xLinearScale, xAxis);
    yAxis = renderYAxes(yLinearScale, yAxis);

    // updates circles with new x values
    circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

    // updates circles's state abbr with new x values
    abbrGroup = renderStateAbbr(abbrGroup, xLinearScale, chosenXAxis);

    // updates tooltips with new info
    circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

    // changes classes to change bold text
    if (chosenXAxis === "age") {
      ageLabel
        .classed("active", true)
        .classed("inactive", false);
      povertyLabel
        .classed("active", false)
        .classed("inactive", true);
      incomeLabel
      .classed("active", false)
      .classed("inactive", true);
    }
    else if (chosenXAxis === "income"){
      ageLabel
        .classed("active", false)
        .classed("inactive", true);
      povertyLabel
        .classed("active", false)
        .classed("inactive", true);
      incomeLabel
      .classed("active", true)
      .classed("inactive", false);
    }
    else {
      ageLabel
        .classed("active", false)
        .classed("inactive", true);
      povertyLabel
        .classed("active", true)
        .classed("inactive", false);
      incomeLabel
      .classed("active", false)
      .classed("inactive", true);
    }
  }
});

}).catch(function(error) {return console.log(error);});

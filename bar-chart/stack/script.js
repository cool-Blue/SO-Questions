var width  = 600,
    height = 200,
    padding = { left:50, right:200, top:20, bottom:30},
    xRangeWidth = width - padding.left - padding.right,
    yRangeWidth = height - padding.top - padding.bottom;

var dataSet;
var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + [padding.left, padding.top] + ")");

var dataSet1 = [
      { name: "PC" ,
        sales: [    { year:2005, profit: 3000 },
                    { year:2006, profit: 1300 },
                    { year:2007, profit: 3700 },
                    { year:2008, profit: 4900 },
                    { year:2009, profit: 700 }] },
      { name: "SmartPhone" ,
        sales: [    { year:2005, profit: 2000 },
                    { year:2006, profit: 4000 },
                    { year:2007, profit: 1810 },
                    { year:2008, profit: 6540 },
                    { year:2009, profit: 2820 }] },
      { name: "Software" ,
        sales: [    { year:2005, profit: 1100 },
                    { year:2006, profit: 1700 },
                    { year:2007, profit: 1680 },
                    { year:2008, profit: 4000 },
                    { year:2009, profit: 4900 }] }
    ],
    // experiment to demonstrate unsupported data structure //////////////////////////////
    dataset2 = dataSet1.map(function(d){
      return {
        name: d.name,
        sales: d.sales.reduce(function(s, o) {
          return (s[o.year] = o.profit, s)
        },{})
      }
    }),
    _stack = d3.layout.stack()
      .values(layer)
      .x(function(d){ return d.year; })
      .y(function(d){ return d.profit; }),
    dataRaw = _stack(dataset2).map(function(d){
      return {
        name: d.name,
        sales: layer(d)
      }
    });

function layer(d){
  return Object.keys(d.sales).map(function(y){
    return {profit: d.sales[y],year:y}
  });
}
// end experiment /////////////////////////////////////////////////////////////////////

var offsetSelect = d3.ui.select({
      before: "svg",
      style: {position: "absolute", left: width - padding.right + 15 + "px", top: yRangeWidth + "px"},
      onUpdate: function() {
        update(dataSet1)
      },
      data    : ["wiggle", "zero", "expand", "silhouette"]
    }),
    orderSelect = d3.ui.select({
      before: "svg",
      style: {position: "absolute", left: width - padding.right + 15 + "px", top: yRangeWidth - 20 + "px"},
      onUpdate: function() {
        update(dataSet1)
      },
      data    : ["inside-out", "default", "reverse"]
    }),
    stack = d3.layout.stack()
      .values(function(d){ return d.sales; })
      .x(function(d){ return d.year; })
      .y(function(d){ return d.profit; })
      .out(function out(d, y0, y) {
        d.p0 = y0;
        d.y = y;
      }
    );

// apply a transform to map screen space to cartesian space
// this removes all confusion and mess when plotting data!
var plotArea = svg.append("g")
  .attr(transplot(yRangeWidth))
  .attr("class", "plotArea");
// x Axis
var xPadding = {inner: 0.1, outer: 0.3},
  xScale = d3.scale.ordinal()
      .rangeBands([0, xRangeWidth], xPadding.inner, xPadding.outer),
    xAxis = d3Axis()
      .scale(xScale)
      .orient("bottom"),
    gX    = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + yRangeWidth  + ")");
// y Axis
var yAxisScale = d3.scale.linear()
      .range([yRangeWidth, 0]),
    yAxis = d3Axis()
      .scale(yAxisScale)
      .orient("left"),
    gY    = svg.append("g")
      .attr("class", "y axis")
      .style("pointer-events", "none");

var yScale = d3.scale.linear()
  .range([0, yRangeWidth]);

var color = d3.scale.category10();

function update(dataSet) {

  var data = stack.offset(offsetSelect.value())
        .order(orderSelect.value())(dataSet),
      maxProfit = d3.max(data,function(d) {
        return d3.max(d.sales, function(s) {
          return s.profit + s.p0
        })
      });

  function yDomain(){return [0, offsetSelect.value() == "expand" ? 1 : maxProfit]}

  xScale.domain(data[0].sales.map(stack.x()));
  yAxisScale.domain(yDomain());
  yScale.domain(yAxisScale.domain());

  var series = plotArea.selectAll(".series")
    .data(data);
  series.enter()
    .append("g")
    .attr("class", "series");
  series.style("fill", function(d, i) {
    return color(i);
  });
  series.exit().remove();

  var s = xScale.rangeBand(),
      w = s - xPadding.inner,
      points    = series.selectAll("rect")
        .data(function(d) {
          return d.sales;
        }),
      newPoints = points.enter()
        .append("rect")
        .attr("width", w)
        .on("mouseover", function(d) {
          var rect = d3.select(this), selectedYear = d.year;
          // if the plot is not normalised, offset the axis to align with the selected group
          if(offsetSelect.value() != "expand") {
            var pMin = d3.min(data,function(d) {
              return d3.min(d.sales.filter(function(p) {
                return p.year == selectedYear
              }), function(s) {
                return s.p0
              })
            });
            yAxisScale.domain([-pMin, yDomain()[1] - pMin]);
            gY.transition().call(yAxis).attr("transform", "translate(" + rect.attr("x") + ",0)");
          }
          // manage the highlighting
          series.selectAll("rect")
            .transition()
            .attr({opacity: 0.5});
          rect
            .transition()
            .attr({opacity: 1});
          d3.selectAll(".x.axis .tick")
            .filter(function(d) {
              return d == selectedYear
            })
            .classed("highlight", true);
          // move the selected element to the front
          d3.select(this.parentNode)
            .moveToFront();
          gX.moveToFront();
          // add the value for the moused over item to the legend text and highlight it
          var g = d3.select(this.parentNode).selectAll(".label").select("text");
          g.classed("highlight", true);
          g.text(g.text() + ": " + d3.format(">8.0f")(d.profit));
          series
            .append("g")
            .attr("class", "tooltip")
            .attr("transform", "translate(" + [rect.attr("x"), rect.attr("y")] + ")")
            .append("text")
            .attr(transflip())
            .text(d3.format(">8.0f")(d.profit))
            .attr({x: "1em", y: -rect.attr("height")/2, dy: ".35em", opacity: 0})
            .transition().attr("opacity", 1)
            .style({fill: "black", "pointer-events": "none"})
        })
        .on("mouseout", function(d) {
          var year = d.year;
          d3.selectAll(".x.axis .tick")
            .filter(function(d) {
              return d == year
            })
            .classed("highlight", false);
          series.selectAll("rect")
            .transition()
            .attr({opacity: 1});
          var g = d3.select(this.parentNode).select("text");
          g.classed("highlight", false);
          g.text(g.text().split(":")[0])
          yAxisScale.domain(yDomain());
          yAxis.tickSize(6);
          gY.transition().call(yAxis).attr("transform", "translate(0,0)");
          series.selectAll(".tooltip")
            .transition()
            .attr({opacity: 0})
            .remove();
        });

  points.transition()
    .attr("x", function(d) {
      return xScale(d.year);
    })
    .attr("y", function(d) {
      return yScale(d.p0);
    })
    .attr("height", function(d) {
      return yScale(d.y);
    })
    .attr("stroke", "white");

  points.exit().remove;

  gX.transition().call(xAxis);
  gY.transition().call(yAxis);

  // Add the legend inside the series containers
  // The series legend is wrapped in another g so that the
  // plot transform can be reversed. Otherwise the text would be mirrored
  var labHeight = 40,
      labRadius = 10,
      label = series.selectAll(".label").data(function(d){return [d.name]}),
      newLabel = label.enter().append("g")
        .attr("class", "label")
        // reverse the transform (it is it's own inverse)
        .attr(transplot(yRangeWidth));
  label.exit().remove();

  // add the marker and the legend text to the normalised container
  // push the data (name) down to them
  var labelCircle = label.selectAll("circle").data(aID),
      // take a moment to get the series order delivered by stack
      orders = data.map(function(d) { // simplify the form
        return {name: d.name, base: d.sales[0].p0}
      }).map(function(d) {            // get a copy, sorted by p0
        return d
      }).sort(function(a, b){
        return a.base - b.base
      }).map(function(d) {            // convert to index permutations
        return data.map(function(p) {
          return p.name
        }).indexOf(d.name)
      }).reverse();                   // convert to screen y ordinate
  labelCircle.enter().append("circle");
  labelCircle.attr("cx", xRangeWidth + 20)
    .attr("cy", function(d, i, j) {
      return labHeight * orders[j];
    })
    .attr("r", labRadius);

  var labelText = label.selectAll("text").data(aID);
  labelText.enter().append("text");
  labelText.attr("x", xRangeWidth + 40)
    .attr("y", function(d, i, j) {
      return labHeight * orders[j];
    })
    .attr("dy", labRadius / 2)
    .text(function(d) {
      return d;
    });

  function aID(d){
    return [d];
  }
}

update(dataSet1);

d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

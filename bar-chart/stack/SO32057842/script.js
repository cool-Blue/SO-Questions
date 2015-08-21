var width  = 600,
    height = 200,
    padding = { left:50, right:200, top:30, bottom:30},
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
      style: {display: "block"},
      onUpdate: function() {
        update(dataSet1)
      },
      data    : ["zero", "wiggle", "expand", "silhouette"]
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
// this removes all confusion and mess from plotting data!
var plotArea = svg.append("g")
  .attr({"transform": "matrix(" + [1, 0, 0, -1, 0, yRangeWidth] + ")"})
  .attr("class", "plotArea");

var xScale = d3.scale.ordinal()
      .rangeBands([0, xRangeWidth],0.3),
    xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("bottom"),
    gX    = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + yRangeWidth  + ")");

var yAxisScale = d3.scale.linear()
      .range([yRangeWidth, 0]),
    yAxis = d3.svg.axis()
      .scale(yAxisScale)
      .orient("left"),
    gY    = svg.append("g")
      .attr("class", "y axis");

var yScale = d3.scale.linear()
  .range([0, yRangeWidth]);

var color = d3.scale.category10();

function update(dataSet) {

  var offsetType = offsetSelect.value(),
    data = stack.offset(offsetType)(dataSet),
      maxProfit = d3.max(data,function(d) {
        return d3.max(d.sales, function(s) {
          return s.profit + s.p0
        })
      });

  xScale.domain(data[0].sales.map(function(d){ return d.year; }));
  yAxisScale.domain([0, offsetType == "expand" ? 1 : maxProfit]);
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


  var points    = series.selectAll("rect")
        .data(function(d) {
          return d.sales;
        }),
      newPoints = points.enter()
        .append("rect")
        .attr("width", 60)
        .on("mouseover", function(d, i) {
          var rect = d3.select(this), selectedYear = d.year;
          series.selectAll("rect")
            .attr({"stroke": "white", "stroke-width": "initial"});
          rect
            .attr("stroke-width", 3)
            .attr("stroke", "black");
          d3.selectAll(".x.axis .tick")
            .filter(function(d) {
              return d == selectedYear
            })
            .classed("highlight", true);
          var g = d3.select(this.parentNode).selectAll(".label").select("text");
          g.classed("highlight", true);
          g.text(g.text() + ": " + d3.format(">8.0f")(d.profit))
          console.log(g.datum().name);
          d3.select(this.parentNode)
            .moveToFront();
          gX.moveToFront();
        })
        .on("click", function() {
          alert(d3.select(this.parentNode).select("text").datum().name);
        })
        .on("mouseout", function(d) {
          var year = d.year;
          d3.selectAll(".x.axis .tick")
            .filter(function(d) {
              return d == year
            })
            .classed("highlight", false);
          series.selectAll("rect")
            .attr({"stroke": "white", "stroke-width": "initial"});
          var g = d3.select(this.parentNode).select("text");
          g.classed("highlight", false);
          g.text(g.text().split(":")[0])
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

  var labHeight = 50,
      labRadius = 10,
      label = series.selectAll(".label").data(function(d){return [d.name]}),
      newLabel = label.enter().append("g")
        .attr("class", "label")
        // reverse the transform (it is it's own inverse)
        .attr({"transform": "matrix(" + [1, 0, 0, -1, 0, yRangeWidth] + ")"});
	label.exit().remove();

  var labelCircle = label.selectAll("circle").data(aID);
	labelCircle.enter().append("circle");
	labelCircle.attr("cx", xRangeWidth + 20)
		.attr("cy", function(d, i, j) {
			return labHeight * j;
		})
		.attr("r", labRadius);

  var labelText = label.selectAll("text").data(aID);
	labelText.enter().append("text");
	labelText.attr("x", xRangeWidth + 40)
		.attr("y", function(d, i, j) {
			return labHeight * j;
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

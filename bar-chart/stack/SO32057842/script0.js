var width  = 600;
var height = 200;
var dataSet;
var svg = d3.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

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
];

var stack = d3.layout.stack()
	.values(function(d){ return d.sales; })
	.x(function(d){ return d.year; })
	.y(function(d){ return d.profit; });
var data = stack(dataSet1);

var padding = { left:50, right:200, top:30, bottom:30 };

var xRangeWidth = width - padding.left - padding.right;

var xScale = d3.scale.ordinal()
	.domain(data[0].sales.map(function(d){ return d.year; }))
	.rangeBands([0, xRangeWidth],0.3);

var maxProfit = d3.max(data,function(d){
	return d3.max(d.sales, function(s){
		return s.y + s.y0
	})
});

var yRangeWidth = height - padding.top - padding.bottom;

var yScale = d3.scale.linear()
	.domain([0, maxProfit])
	.range([0, yRangeWidth]);

var color = d3.scale.category10();

var groups = svg.selectAll("g")
	.data(data)
	.enter()
	.append("g")
	.style("fill",function(d,i){ return color(i); });

var rects = groups.selectAll("rect")
	.data(function(d){ return d.sales; })
	.enter()
	.append("rect")
	.attr("x",function(d){ return xScale(d.year); })
	.attr("y",function(d){ return yRangeWidth - yScale( d.y0 + d.y ); })
	.attr("width",60)
	.attr("height",function(d){ return yScale(d.y); })
	.attr("transform","translate(" + padding.left + "," + padding.top + ")")
	.attr("stroke","white")
	.on("mouseover", function (d, i) {
		var rect = d3.select(this), selectedYear = d.year;
		groups.selectAll("rect")
			.attr({"stroke":"white", "stroke-width": "initial"});
		rect
			.attr("stroke-width", 3)
			.attr("stroke", "black");
		d3.selectAll(".x.axis .tick")
			.filter(function(d){return d == selectedYear})
			.classed("highlight", true);
		var g = d3.select(this.parentNode).select("text");
		g.classed("highlight", true);
		g.text(g.text() + ": " + d3.format(">8.0f")(d.y))
		/////////////////////////////////////////////////
		console.log(g.datum().name);
		/////////////////////////////////////////////////
		d3.select(this.parentNode)
			.moveToFront();
		gX.moveToFront();
	})
	.on("click", function(){
		alert(d3.select(this.parentNode).select("text").datum().name);
	})
	.on("mouseout", function (d) {
		var year = d.year;
		d3.selectAll(".x.axis .tick")
			.filter(function(d){return d == year})
			.classed("highlight", false);
		groups.selectAll("rect")
			.attr({"stroke":"white", "stroke-width": "initial"});
		var g = d3.select(this.parentNode).select("text");
		g.classed("highlight", false);
		g.text(g.text().split(":")[0])
	});

var xAxis = d3.svg.axis()
	.scale(xScale)
	.orient("bottom");

yScale.range([yRangeWidth, 0]);

var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left"),

		gX = svg.append("g")
			.attr("class","x axis")
			.attr("transform","translate(" + padding.left + "," + (height - padding.bottom) +  ")")
			.call(xAxis);

svg.append("g")
	.attr("class","y axis")
	.attr("transform","translate(" + padding.left + "," + (height - padding.bottom - yRangeWidth) +  ")")
	.call(yAxis);

var labHeight = 50;
var labRadius = 10;

var labelCircle = groups.append("circle")
	.attr("cx",width - padding.right*0.9)
	.attr("cy",function(d,i){ return padding.top * 2 + labHeight * i; })
	.attr("r",labRadius);

var labelText = groups.append("text")
	.attr("x",width - padding.right*0.8)
	.attr("y",function(d,i){ return padding.top * 2 + labHeight * i; })
	.attr("dy",labRadius/2)
	.text(function(d){ return d.name; });

d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
	});
};
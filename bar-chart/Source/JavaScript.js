function main () {
	console.clear();
	var margin ={ top : 20, right : 20, bottom: 30, left : 40, },
			width = 960 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom;

	var x0 = d3.scale.ordinal()
			.rangeRoundBands([0, width], 0.1);

	var x1 = d3.scale.ordinal();

	var y = d3.scale.linear()
			.range([height, 0]);

	var color = d3.scale.ordinal()
			.range(["#FD8C25", "#99ABC4"]);

	var xAxis = d3.svg.axis()
			.scale(x0)
			.orient("bottom");

	var year = 1979;

	var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.tickFormat(d3.format(".2s"));

	var svg = d3.select("body").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var request_data = d3.csv("http://www.sfu.ca/~gdwang/Sex.csv", function (error, data) {
		request_data = data;

		console.log('data returned')
		console.log('error: ' + error)

		d3.select("#sexYear").on("change", function () {
			update(+this.value);
		});

		update(year);

		// update the year
		function update(sexYear) {
			console.log(this.value);

			// adjust the text on the year slider
			d3.select("#sexYear-value").text(sexYear);
			d3.select("#sexYear").property("value", sexYear);

			var yearData = data.filter(function (element) { return element.YEAR == year });
			var ageNames = d3.keys(yearData[0]).filter(function (key) { return key !== "CAUSE"; });
			var ageNames = d3.keys(yearData[0]).filter(function (key) { return key !== "YEAR"; });
			console.log(yearData);
			yearData.forEach(function (d) {
				d.ages = ageNames.map(function (name) { return { name: name, value: +d[name] }; });
			});

			x0.domain(yearData.map(function (d) { return d.CAUSE; }));
			x1.domain(ageNames).rangeRoundBands([0, x0.rangeBand()]);
			y.domain([0, d3.max(yearData, function (d) { return d3.max(d.ages, function (d) { return d.value; }); })]);

			var cause = svg.selectAll(".CAUSE")
		 .data(yearData)
		 .enter().append("g")
		 .attr("class", "g")
		 .attr("transform", function (d) { return "translate(" + x0(d.CAUSE) + ",0)"; });

			cause.selectAll("rect")
			.data(function (d) { return d.ages; })
			.enter().append("rect")
			.attr("width", x1.rangeBand())
			.attr("x", function (d) { return x1(d.name); })
			.attr("y", function (d) { return y(d.value); })
			.attr("height", function (d) { return height - y(d.value); })
			.style("fill", function (d) { return color(d.name); });

		}

		//draw the bars
		svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

		svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Potential Years Lost");

	})
};
window.onload = main
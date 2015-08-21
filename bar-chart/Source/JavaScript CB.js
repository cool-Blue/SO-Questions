window.onload = function (){
	console.clear();
	var margin ={ top : 20, right : 20, bottom: 30, left : 40 },
			width = 960 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom,

			x0 = d3.scale.ordinal()
			.rangeRoundBands([0, width], 0.1),

			x1 = d3.scale.ordinal(),

			y = d3.scale.linear()
			.range([height, 0]),

			color = d3.scale.ordinal()
			.range(["#FD8C25", "#99ABC4"]),

			xAxis = d3.svg.axis()
			.scale(x0)
			.orient("bottom"),

			year = 1979,

			yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.tickFormat(d3.format(".2s")),

			svg = d3.select("body").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),

			request_data = d3.csv("http://www.sfu.ca/~gdwang/Sex.csv", function (error, data) {
				console.log('data returned')
				console.log('error: ' + error)

				d3.select("#sexYear").on("change", function () {
					update(+this.value, data);
				});
				d3.select("#sexYear").on("input", function () {
					update(+this.value, data);
				});

				update(year, data);

				//draw the axes
				svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis)
						.selectAll('text')
							.attr('transform', 'rotate(-15)')
							.style('text-anchor', 'end');

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

	// update the year
	function update(sexYear, data) {
		var notSeriesNames = ['CAUSE', 'YEAR']

		console.log('update ', sexYear);

		// adjust the text on the year slider
		d3.select("#sexYear-value").text(sexYear);
		d3.select("#sexYear").property("value", sexYear);


		var yearData = data.filter(function (element) { return element.YEAR == sexYear })


		var seriesNames = d3.keys(yearData[0]).filter(function (key) {
			return notSeriesNames.every(function (e, i, i) { return key != e })
		});
		//extract the selected keys (seriesNames) and put a series object on each datum 
		//consiting of the selected keys and their values
		yearData.forEach(function (d) {
			d.series = seriesNames.map(function (name) { return { name: name, value: +d[name] }; });
		});

		//compute the ordinal domain for the scale for the bar groups
		x0.domain(yearData.map(function (d) { return d.CAUSE; }));
		//compute the sub-scale for each bar group including padding between the bars
		x1.domain(seriesNames).rangeRoundBands([0, x0.rangeBand()], 0.025);
		//compute the  maximum of the maximum of each group and use it to determine the y axis domain
		y.domain([0, d3.max(yearData, function (d) {
			return d3.max(d.series, function (d) { return d.value; });
		})]);

	//Cause groups
		//UPDATE
		var causeUpdate = svg.selectAll(".CAUSE")
					.data(yearData),
		//ENTER ****native d3 SIDE EFFECT**** enter selection is added to update selection 
				causeEnter = causeUpdate.enter().append("g")
					.attr("class", "CAUSE")
					.attr("transform", function (d) { return "translate(" + x0(d.CAUSE) + ",0)"; }),
		//EXIT
				causeExit = causeUpdate.exit().remove(),

	//Series groups
		//UPDATE
				seriesUpdate = causeUpdate.selectAll("rect")
				.data(function (d) {
					return d.series;
				});
		//ENTER ****native d3 SIDE EFFECT**** enter selection is added to update selection 
		seriesUpdate.enter().append("rect")
		//UPDATE + ENTER
		seriesUpdate.attr("width", x1.rangeBand())
		.style("fill", function (d) {
			return color(d.name);
		})
		.transition()
			.attr("x", function (d) {
				return x1(d.name);
			})
		.attr("y", function (d) {
				return y(d.value);
			})
			.attr("height", function (d) {
				return height - y(d.value);
			})
		//EXIT
		seriesUpdate.exit().remove()
	}

};

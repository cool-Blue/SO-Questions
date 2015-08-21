window.onload = function (){
	console.clear();
	//var padding ={ top : 100, right : 50, bottom: 100, left : 40 },
	var bodyPadding = 100,
			highlightSVG = (function(bodyPadding) {
		return function (selection, attributes) {
			var g, refSVG = document.querySelector('body .chart').getBoundingClientRect(),
					clientRect = (selection[0].length == 1 ? //if SVG Element
															/^\[object SVG(G|SVG)Element]/g.test((g = selection.node()).toString()) ?
				g : g = selection[0].parentNode
													: g = selection[0].parentNode)
						.getBoundingClientRect(), box = {}, positioning = ['top', 'left', 'height', 'width', 'x', 'y']

			positioning.forEach(function (k, i, a) { box[k] = clientRect[k] })
			box.top -= bodyPadding;
			box.left -= bodyPadding;

			for (var attr in attributes) { box[attr] = attributes[attr] };

			console.log(refSVG);
			console.log(clientRect)
			d3.select('body .chart').append('rect')
			.attr(box);
			return selection;
		}
	})(bodyPadding),
			padding = { top: 50, right: 50, bottom: 100, left: 50 },
			width = 960 - padding.left - padding.right,
			height = 500 - padding.top - padding.bottom,

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

			outer = d3.select("body")
			.style('padding', bodyPadding +'px')
			.insert("svg", "label")
			.attr('class', 'chart')
			.attr('fill', 'black')
			.attr("width", width + padding.left + padding.right)
			.attr("height", height + padding.top + padding.bottom),
	//DEBUG////////////////////////////////////////////////////////////////////////////////

			//test = outer.call(highlightSVG, { fill: 'black', 'fill-opacity': 0.5 }),
			//svgBox = outer.append("rect")
			//	.attr('class', 'chart-g')
			//	.attr("transform", "translate(" + padding.left + "," + padding.top + ")")
			//	.attr('width', width)
			//	.attr('height', height),

	//DEBUG////////////////////////////////////////////////////////////////////////////////
			svg = outer.append("g")
				.attr('class', 'chart-g')
				.attr('fill', 'black')
				.attr("transform", "translate(" + padding.left + "," + padding.top + ")"),
			plotSuface = outer

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
				var xAxisSelection = svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis)
				xAxisSelection.selectAll('text')
							.attr('transform', 'rotate(-15)')
							.style('text-anchor', 'end')

				var yAxisSelection = svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
				yAxisSelection.append("text")
							.attr("transform", "rotate(-90)")
							.attr("y", 6)
							.attr("dy", ".71em")
							.style("text-anchor", "end")
							.text("Potential Years Lost")

				//DEBUG////////////////////////////////////////////////////////////////////////////////

				//xAxisSelection.call(highlightSVG, { fill: 'red', 'fill-opacity': 0.5, class : 'debugX' })

				//yAxisSelection.call(highlightSVG, { fill: 'green', 'fill-opacity': 0.5, class: 'debugY' })

				//d3.select('.chart-g').call(highlightSVG, { stroke: 'white', fill: 'none', class: 'svg-g' })
				//	.attr('fill', 'red')
				//	.attr('stroke', 'red')

				//DEBUG////////////////////////////////////////////////////////////////////////////////
			}) /*request_data*/

	// update the year
	function update(sexYear, data) {
		var notSeriesNames = ['CAUSE', 'YEAR', 'series']

		console.log('update ', sexYear);

		// adjust the text on the year slider
		d3.select("#sexYear-value").text(sexYear);
		d3.select("#sexYear").property("value", sexYear);


		var yearData = data.filter(function (element) { return element.YEAR == sexYear }),
				seriesNames = d3.keys(yearData[0]).filter(function (key) {
					return notSeriesNames.every(function (element, idnex, array) {
						return key != element
					})
				})
				seriesNames.seriesGroups = function (cat, values) {
					var that = this, values = values || this.data
					return values.map( function (d, index, array) {
						var extract = {}
						extract[cat] = d[cat]
						extract.series = []
						for (var i = 0; i < that.length; i++) {
							extract.series[i] = { name: that[i], value: +d[that[i]] }
						}
						return extract
					})
				}

		var dataExtract = seriesNames.seriesGroups('CAUSE', yearData)

		//compute the ordinal domain for the scale for the bar groups
		x0.domain(dataExtract.map(function (d) { return d.CAUSE; }));
		//compute the sub-scale for each bar group including padding between the bars
		x1.domain(seriesNames).rangeRoundBands([0, x0.rangeBand()], 0.025);
		//compute the  maximum of the maximum of each group and use it to determine the y axis domain
		y.domain([0, d3.max(dataExtract, function (d) {
			return d3.max(d.series, function (d) {
				return d.value;
			});
		})]);

		//Cause groups
		//UPDATE
		var causeUpdate = svg.selectAll(".CAUSE")
					.data(dataExtract),
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

	} /*update*/


};

function old () {

	
	d3.select('#svg-test')
			.on("mouseover", listener)
			.on("mouseout", listener)
	function listener(e) {
		e = e || d3.event;
		var source = e.currentTarget, l = arguments.callee
		console.log(e.type + ': ' + e.target.tagName + ' ---> ' + e.currentTarget.id)

		source.parentNode.appendChild(source)

	}
};
(function () {
	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};

	var svg = d3.select("svg");

	var data = d3.range(10);

	var circles = svg.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr({
				cx: function (d, i) { return d * 20 + 100 },
				cy: 100,
				r: 20,
				fill: "#aaa",
				stroke: "#000"
			})
			.on("mouseover", function () {
				var sel = d3.select(this);
				sel.moveToFront();
				var e = d3.event
				console.log(e.type + ': ' + e.target.tagName + ' ---> ' + e.currentTarget.id)
			});
})()
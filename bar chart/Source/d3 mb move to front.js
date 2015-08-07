(function () {
	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};

	var log = d3.select('#output'), counter = 0

	var svg = d3.select("body").append('svg');

	var data = d3.range(10);

	var circles = svg.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr({
				cx: function (d, i) { return d * 20 + 100 },
				cy: 100,
				r: 50,
				fill: "#aaa",
				stroke: "#000"
			})
			.on("mouseover", function () {
				var sel = d3.select(this);
				sel.moveToFront();
				logEvent();
			})
			.on("mouseout", logEvent);
	function logEvent() {
		var e = d3.event, node,
				message = counter++ + ' ' + e.type + ': ' + e.target.tagName + ' ---> ' + e.currentTarget.tagName
		console.log(message)
		node = log.html(log.html() + '<p class="' + e.type + '">' + message + '</p>').node();
		node.scrollTop = node.scrollHeight;
	}
})()
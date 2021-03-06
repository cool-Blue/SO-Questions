//debug panel/////////////////////////////////////////////////////////////////////////////
var update = d3.select("#update")
			.on("click", (function() {
				var dataSet = false;
				return function() {
					init(dataFiles[(dataSet = !dataSet, +dataSet)])
				}
			})()),
		keyingOptions = {key: mark_key, none: id},
		keying = d3.ui.select({
			base: "#inputDiv",
			data: [
				{text: "use key", value: "key"},
				{text: "no key", value: "none"}
			]
		}),
		alpha = d3.select("#alpha").text("waiting..."),
		dataFiles = ["data.json","data2.json"];
	elapsedTime = ElapsedTime("#panel")
		.message(function (id) {
			return 'fps : ' + d3.format(" >8.3f")(this.aveLap())
		});
	elapsedTime.consoleOn = false;
//////////////////////////////////////////////////////////////////////////////////

function refresh(error, data){
	var height = 300; width = 500;
	var instID = Date.now(),
			force = d3.layout.force()
				.size([width, height])
				.charge(-1000)
				.linkDistance(50)
				.nodes(data.nodes)
				.links(data.edges)
				.on("tick", (function(instID){
					return function (e) {
						elapsedTime.mark();
						alpha.text(d3.format(" >8.4f")(e.alpha) + "\tinstance: " + instID);
						lines.attr("x1", function(d) {
							return d.source.x;
						})
							.attr("y1", function(d) {
								return d.source.y;
							})
							.attr("x2", function(d) {
								return d.target.x;
							})
							.attr("y2", function(d) {
								return d.target.y;
							});

						circles.attr("cx", function(d) {
							return d.x;
						})
							.attr("cy", function(d) {
								return d.y;
							});
					}
				})(instID))
				.on("start", function(){
					elapsedTime.start()})
				.on("end", elapsedTime.stop)
				.start();

	force.nodes().forEach(mark(instID));
	force.links().forEach(mark(instID));
	function mark(brand) {
		return function(d) {
			d.marker = brand
		}
	}
	mark.key = keyingOptions[keying.value()];

	var svg = d3.select("body").selectAll("svg").data([data]);

	svg.enter().append("svg").attr({height: height, width: width});
	var links = svg.selectAll(".links")
				.data(linksData, mark.key),
			linksEnter = links.enter()
				.insert("g", d3.select("#nodes") ? "#nodes" : null)
				.attr("class", "links"),
			lines = linksEnter.insert("line")
				.attr({stroke: "#ccc", "stroke-width": 3});

	var nodes = svg.selectAll("#nodes")
				.data(nodesData),
			nodesEnter = nodes.enter().append("g").attr("id", "nodes"),
			node = nodes.selectAll(".node")
				.data(id, mark.key),
			circles = node.enter().append("g").attr("class", "node").call(force.drag)
				.append("circle")
				.attr({"r": function(d){return d.size}, fill: "#ccc"});

	links.exit().remove();

	node.exit().remove();
	//force.start();

	function nodesData(d){
		return [d.nodes];
	}
	function linksData(d){
		return d.edges;
	}

};

function id(d){return d;}
function mark_key(d, i) {
	return (d.source ? (d.source + d.target) : d.name) + d.marker + i;
};

function init(data){
	d3.json(data, refresh);
}
init(dataFiles[0]);

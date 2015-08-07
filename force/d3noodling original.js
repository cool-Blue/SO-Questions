// based on: http://bl.ocks.org/mfolnovic/6269308
// which was based on: http://bl.ocks.org/mbostock/1153292
// see also: https://jsfiddle.net/nrabinowitz/VYaGg/

function max_weight_node(ar) {
	// d3.js may already have this. It's clunky but gets what I want.
	var node, max = 0;
	for (x in ar) {
		if (ar[x].weight > max) {
			max = ar[x].weight;
			node = ar[x];
		}
	}
	return node;
}

var node_colors = {
	"Person": "#339",
	"Site": "#933",
	"Place": "#933",
	"Document": "#f00",
	"Date": "#393",
	"Occupation": "#606",
	"Transaction": "#ff9525"
}

d3.json("force-directed-edges.json", function (error, data) {
	if (error) return console.warn(error);
	nodes = data.nodes,
	links = data.links,
	predicates = data.predicates,
	json = JSON.stringify(data, undefined, 2);

	for (n in nodes) { // don't want to require incoming data to have links array for each node
		nodes[n].links = []
	}

	links.forEach(function (link) {
		// kept the 'Or' check, in case we're building the nodes only from the links
		link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
		link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });

		// To do any dijkstra searching, we'll need adjacency lists: node.links. (easier than I thought)
		link.source.links.push(link);
		link.target.links.push(link);
	});

	nodes = d3.values(nodes);

	showme();
});

var width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

var height = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

var w = width,
		h = height;

var svg = d3.select("#viz").append("svg:svg")
		.attr("width", w)
		.attr("height", h);

function addedge() {
	links.push({ "source": nodes[2], "target": nodes[4], "type": "is_a_tenant_of" });
	force.start();
	showme();
}

function showme() {
	force = d3.layout.force()
			.nodes(nodes)
			.links(links)
			.size([w, h])
			.linkDistance(function (link) {
				var wt = link.target.weight;
				return wt > 2 ? wt * 10 : 60;
			})
			.charge(-600)
			.gravity(.01)
			.friction(.75)
			//.theta(0)
			.on("tick", tick)
			.start();

	svg
	.append("svg:defs")
		.selectAll("marker")
		.data(predicates)
		.enter().append("svg:marker")
			.attr("id", String)
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 30)
			.attr("refY", 0)
			.attr("markerWidth", 4)
			.attr("markerHeight", 4)
			.attr("orient", "auto")
		.append("svg:path")
			.attr("d", "M0,-5L10,0L0,5");

	path = svg
		.append("svg:g")
		.selectAll("path")
		.data(links);

	path.enter().append("svg:path")
			.attr("id", function (d) { return d.source.index + "_" + d.target.index; })
			.attr("class", function (d) { return "link " + d.type; })
			.attr("marker-end", function (d) { return "url(#" + d.type + ")"; });

	path.exit().remove();

	var path_label = svg
		.append("svg:g")
		.selectAll(".path_label")
		.data(links)
		.enter().append("svg:text")
			.attr("class", "path_label")
			.append("svg:textPath")
				.attr("startOffset", "50%")
				.attr("text-anchor", "middle")
				.attr("xlink:href", function (d) { return "#" + d.source.index + "_" + d.target.index; })
				.style("fill", "#000")
				.style("font-family", "Arial")
				.text(function (d) { return d.type; });

	circle = svg
		.append("svg:g")
		.selectAll("circle")
		.data(nodes)
		.enter().append("svg:circle")
			.attr("class", "node")
			.attr("fill", function (d, i) {
				return node_colors[d.types[0]];
			})
			.attr("r", function (d) { return d.types.indexOf("Document") == 0 ? 24 : 12; })
			.attr("stroke", "#000")
			.on("click", clicked)
			.on("dblclick", dblclick)
			.on("contextmenu", cmdclick)
			.call(force.drag);

	text = svg
		.append("svg:g")
		.selectAll("g")
			.data(nodes)
		.enter()
		.append("svg:g")
			.attr("text-anchor", "middle");

	// A copy of the text with a thick white stroke for legibility.
	text.append("svg:text")
			.attr("x", 8)
			.attr("y", ".31em")
			.attr("class", "shadow")
			.text(function (d) { return d.name; });

	text.append("svg:text")
			.attr("x", 8)
			.attr("y", ".31em")
			.text(function (d) { return d.name; });

	// calling force.drag() here returns the drag _behavior_ on which to set a listener
	// node element event listeners
	force.drag().on("dragstart", function (d) {
		d3.selectAll(".dbox").style("z-index", 0);
		d3.select("#dbox" + d.index).style("z-index", 1);
	})
}

/*==================================================
 *  tick()
 *==================================================
 */
function tick() {
	path.attr("d", function (d) {
		return "M" + d.source.x + "," + d.source.y + "," + d.target.x + "," + d.target.y;
	});

	circle.attr("transform", function (d) {
		d3.select("#dbox" + d.index)
				.style({
					"top": Math.round(d.y) + 3 + "px",
					"left": Math.round(d.x) + 3 + "px"
				});
		return "translate(" + d.x + "," + d.y + ")";
	});

	text.attr("transform", function (d) {
		return "translate(" + d.x + "," + d.y + ")";
	});
}


/*==================================================
 *  UI event listeners
 *==================================================
 */

function clicked(d) {
	d.fixed = true; //make the node sticky
	d3.select(this)
	.attr('fill', '') // Un-sets the "explicit" fill (might need to be null instead of '')
	.classed("fixed", true); // should then accept fill from CSS
}

function dblclick(d) {
	d3.select(this).classed("fixed", d.fixed = false)
		.classed("dbox-showing", false)
		.attr("fill", function (d, i) {
			return node_colors[d.types[0]];
		});

	d3.select("#dbox" + d.index).remove();
}

function cmdclick(d) {
	var thisNode = d3.select(this);

	d3.event.preventDefault();
	if (!thisNode.classed("fixed") || !d3.select("#dbox" + d.index).empty()) return;

	d3.select("#control").text(d.text);

	data = []
	for (x in d) { data.push([x, d[x]]); } // an array of 2 element arrays

	var dbox_css = {
		"top": Math.round(d.y) + 3 + "px",
		"left": Math.round(d.x) + 3 + "px",
		"z-index": 0
	}

	var tr = d3.select("#viz")
			.append("div").attr("id", "dbox" + d.index)
			.style(dbox_css)
			.classed("dbox", true)
			.on("click", setzindex)
			.append("table").classed("plist", true).selectAll("tr")
			.data(data) // for each row we have an array of 2 elements
		.enter().append("tr");

	var td = tr.selectAll("td")
			.data(function (x) { return x; })   // the data available is an array of two elements, 
		.enter().append("td")                // so two td dom elements are appended
			.text(function (x) { return x; });  // and the text is set to those two elements

	thisNode.classed("dbox-showing", true);
}

// Click handler for dbox elements
function setzindex() {
	d3.selectAll(".dbox").style("z-index", 0);
	var pup = d3.select(this)
	pup.style("z-index", (pup.style("z-index", 0)) ? 1 : 2);
}






////////////////////////////////////////////////////////////







// 
//     // d3.nest will give me an array of objects whose keys are the weight,
//     // and whose values are an array of nodes of that weight
//     var nest = d3.nest()
//         .key(function(d) { return d.weight; })
//         .entries(force.nodes());
//     

// weight value of the node with greatest weight:
// Math.max.apply(Math, force.nodes().map(function(o){return o.weight;}))

// function node_by_value(fld, str){
//     for (x in nodes) { //works for my properties: arrays, but native properties might me naked values, eg. weight: 11
//         fld = nodes[x][fld]
//         
//         if ((typeof(fld) == "object") && !(fld.indexOf(str) == -1)) {
//             console.log(x, nodes[x].index);
//         } else {
//             console.log(x, nodes[x].index)
//         }
//     }
// }


// this works in the console, but the path is not visible.
// nds = force.nodes()
// walt = nds[4]
// robt = nds[2]
// links.push({"source": walt, "target": robt, "type": "is_a_tenant_of"});
// force.start()

// need some kind of function like this from http://bl.ocks.org/mbostock/1095795
// function start() {
//   link = link.data(force.links(), function(d) { return d.source.id + "-" + d.target.id; });
//   link.enter().insert("line", ".node").attr("class", "link");
//   link.exit().remove();
// 
//   node = node.data(force.nodes(), function(d) { return d.id;});
//   node.enter().append("circle").attr("class", function(d) { return "node " + d.id; }).attr("r", 8);
//   node.exit().remove();
// 
//   force.start();
// }
// OR: the update() function in http://bl.ocks.org/mbostock/3808218
// both implement the "general update pattern" in d3
// Like this: // so I'll have to join enter update and exit circle path path_labels and texts elements.
// function update(data) {
// 
//   // DATA JOIN
//   // Join new data with old elements, if any.
//   var text = svg.selectAll("text")
//       .data(data);
// 
//   // UPDATE
//   // Update old elements as needed.
//   text.attr("class", "update");
// 
//   // ENTER
//   // Create new elements as needed.
//   text.enter().append("text")
//       .attr("class", "enter")
//       .attr("x", function(d, i) { return i * 32; })
//       .attr("dy", ".35em");
// 
//   // ENTER + UPDATE
//   // Appending to the enter selection expands the update selection to include
//   // entering elements; so, operations on the update selection after appending to
//   // the enter selection will apply to both entering and updating nodes.
//   text.text(function(d) { return d; });
// 
//   // EXIT
//   // Remove old elements as needed.
//   text.exit().remove();
// }
// 
// // The initial display.
// update(alphabet);
// 
// // Grab a random sample of letters from the alphabet, in alphabetical order.
// setInterval(function() {
//   update(shuffle(alphabet)
//       .slice(0, Math.floor(Math.random() * 26))
//       .sort());
// }, 1500);

// This adds the link and appends a new g element with all the paths but they're none of them visible:
// nds = force.nodes()
// walt = nds[4]
// robt = nds[2]
// links.push({"source": walt, "target": robt, "type": "is_a_tenant_of"});
// 
// 21
// d3.select("svg").append("svg:g").selectAll("path")
//         .data(force.links())
//       .enter().append("svg:path")
//         .attr("id", function(d) { return d.source.index + "_" + d.target.index; })
//         .attr("class", function(d) { return "link " + d.type; })
//         .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
// [Array[21]]
// force.start()Z
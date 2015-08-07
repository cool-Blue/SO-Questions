// based on: http://bl.ocks.org/mfolnovic/6269308
// which was based on: http://bl.ocks.org/mbostock/1153292
// see also: https://jsfiddle.net/nrabinowitz/VYaGg/
// including 'Revised Code' from http://stackoverflow.com/a/29865544/2670182

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
	if (error) return console.warn(error)
	nodes = data.nodes,
	links = data.links,
	predicates = data.predicates,
	json = JSON.stringify(data, undefined, 2);

	for (n in nodes) { // don't want to require incoming data to have links array for each node
		nodes[n].links = []
	}

	links.forEach(function (link, i) {
		// kept the 'Or' check, in case we're building the nodes only from the links
		link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
		link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
		// To do any dijkstra searching, we'll need adjacency lists: node.links. (easier than I thought)
		link.source.links.push(link);
		link.target.links.push(link);
	});

	nodes = d3.values(nodes);
	reStart()
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
	var n;

	force.stop;
	links.push({
		source: n = randomMember(nodes),
		target: randomMember(nodes, n),
		type: randomMember(predicates)
	});
	force.start();
	showme();

	function randomMember(a, ex) {
		var e2, nullElement = new Object();
		do {
			e2 = a[Math.round(Math.random() * ((a.length ? a.length : Object.keys(a).length) - 1))]
		} while (e2 === (ex ? ex : nullElement))
		return e2
	}
}

function reStart() {
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
}
function showme() {
	//Marker Types  
	var defs = svg.selectAll("defs")
							.data(["defs"], function (d) { return d }).enter()
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
													.attr("d", "M0,-5L10,0L0,5"),
	//Link bag
					//UPDATE
					paths = svg.selectAll(".paths")
							.data(["paths_g"]);
	//ENTER
	paths.enter()
			.append("svg:g")
			.attr("class", "paths");

	//Links
	//UPDATE
	path = paths.selectAll("path")
			.data(links);
	//ENTER
	path.enter()
			.append("svg:path");
	//UPDATE+ENTER
	path
			.attr("indx", function (d, i) { return i })
			.attr("id", function (d) { return d.source.index + "_" + d.target.index; })
			.attr("class", function (d) { return "link " + d.type; })
			.attr("marker-end", function (d) { return "url(#" + d.type + ")"; });
	//EXIT          
	path.exit().remove();

	//Link labels bag
	//UPDATE
	var path_labels = svg.selectAll(".labels")
					.data(["labels_g"]);
	//ENTER
	path_labels.enter()
			.append("svg:g")
			.attr("class", "labels");

	//Link labels
	//UPDATE
	var path_label = path_labels.selectAll(".path_label")
							.data(links);
	//ENTER
	path_label.enter()
			.append("svg:text")
					.append("svg:textPath")
							.attr("startOffset", "50%")
							.attr("text-anchor", "middle")
							.style("fill", "#000")
							.style("font-family", "Arial");
	//UPDATE+ENTER
	path_label
			.attr("class", function (d, i) { return "path_label " + i })
		.selectAll('textPath')
			.attr("xlink:href", function (d) { return "#" + d.source.index + "_" + d.target.index; })
			.text(function (d) { return d.type; }),
	//EXIT
	path_label.exit().remove();

	//Nodes bag
	//UPDATE
	var circles = svg.selectAll(".circles")
							.data(["circles_g"]);
	//ENTER
	circles.enter()
			.append("svg:g")
			.attr("class", "circles");

	//Nodes
	//UPDATE
	circle = circles.selectAll(".nodes")
							.data(nodes);
	//ENTER
	circle.enter().append("svg:circle")
							.attr("class", function (d) { return "nodes " + d.index })
							.attr("stroke", "#000");
	//UPDATE+ENTER
	circle
			.on("click", clicked)
			.on("dblclick", dblclick)
			.on("contextmenu", cmdclick)
			.attr("fill", function (d, i) {
				console.log(i + " " + d.types[0] + " " + node_colors[d.types[0]])
				return node_colors[d.types[0]];
			})
			.attr("r", function (d) { return d.types.indexOf("Document") == 0 ? 24 : 12; })
			.call(force.drag);
	//EXIT
	circle.exit().remove();

	//Anchors bag
	//UPDATE
	var textBag = svg.selectAll(".anchors")
							.data(["anchors_g"]);
	//ENTER
	textBag.enter()
			.append("svg:g")
			.attr("class", "anchors"),

	//Anchors
	//UPDATE
	textUpdate = textBag.selectAll("g")
			.data(nodes, function (d) { return d.name; }),
	//ENTER
textEnter = textUpdate.enter()
.append("svg:g")
.attr("text-anchor", "middle")
.attr("class", function (d) { return "anchors " + d.index });

	// A copy of the text with a thick white stroke for legibility.
	textEnter.append("svg:text")
							.attr("x", 8)
							.attr("y", ".31em")
							.attr("class", "shadow")
							.text(function (d) { return d.name; });

	textEnter.append("svg:text")
							.attr("x", 8)
							.attr("y", ".31em")
							.text(function (d) { return d.name; });
	textUpdate.exit().remove();
	text = textUpdate;

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
		path.attr("d", function(d) {
				return "M" + d.source.x + "," + d.source.y + "," + d.target.x + "," + d.target.y;
		});

		circle.attr("transform", function(d) {
				d3.select("#dbox" + d.index)
						.style({
								"top": Math.round(d.y) + 3 + "px",
								"left": Math.round(d.x) + 3 + "px"
								});
				return "translate(" + d.x + "," + d.y + ")";
		});

		text.attr("transform", function(d) {
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
		.classed("fixed", true ); // should then accept fill from CSS
}

function dblclick(d) {
	d3.select(this).classed("fixed", d.fixed = false)
		.classed("dbox-showing", false)
		.attr("fill", function(d,i){
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
				.data(function(x) { return x; })   // the data available is an array of two elements, 
			.enter().append("td")                // so two td dom elements are appended
				.text(function(x) { return x; });  // and the text is set to those two elements
		
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
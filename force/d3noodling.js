// based on: http://bl.ocks.org/mfolnovic/6269308
// which was based on: http://bl.ocks.org/mbostock/1153292
// see also: https://jsfiddle.net/nrabinowitz/VYaGg/
// minimum delta with comments

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

//ADD//////////////////////////////////////////////////////////////////////////////////
	reStart()
///////////////////////////////////////////////////////////////////////////////////////

	showme();
});

var width = (window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth) * 0.8;

var height = (window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight) * 0.8;

var w = width,
		h = height;
var dragging = false,
		adding = null;

var force,
		path,
		path_label,
		circle,
		text;

var svg = d3.select("#viz").append("svg:svg")
		.attr("width", w)
		.attr("height", h);
function addedge() {
	elapsedTime.timestamp("addedge^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
	var n;
	/////////////////////////////////////////////////////////////////////////////////////
	//Problem
	//	d.x and d.y set to NaN after link is added
	//Cause:
	//	Case 1:
	//		a new version of force is created by reStart
	//		the old version is not GC'ed because it is referenced by the animation timer
	//		
	//Solution:
	//	re-start the transition (not resume!) after adding the links
	/////////////////////////////////////////////////////////////////////////////////////
//not neccessary to stop!//////////////////////////////////////////////////////////////
	force.stop();
///////////////////////////////////////////////////////////////////

	links.push(adding = {
		source: n = randomMember(nodes),
		target: randomMember(nodes, n),
		type: randomMember(predicates)
	});

	//elapsedTime.timestamp("flushing")
	//d3.timer.flush()
	//elapsedTime.timestamp("flushed")
	setTimeout(reStart, 100);
	force.start();
	//d3.timer.queue.clean(force.tick)	//don't need this because it wasn't stopped and re-started
	showme();
	//elapsedTime.stop()
	function randomMember(a, ex) {
		var e2, nullElement = new Object();
		do {
			e2 = a[Math.round(Math.random() * ((a.length ? a.length : Object.keys(a).length) - 1))]
		} while (e2 === (ex ? ex : nullElement))
		return e2
	}
}

//ADD//////////////////////////////////////////////////////////////////////////////////
function reStart() {
	elapsedTime.timestamp("reStart")

	force = d3.layout.force()
		.nodes(nodes)
		.links(links)
		.size([w, h])
		.linkDistance(function (link) {
			var wt = link.target.weight;
			return wt > 2 ? wt * 10 : 60;
		})
		.charge(-600)
		.gravity(0.1)
		.friction(0.75)
		//.theta(0)
		.on("tick", tick)
		.on("start", function () {
			elapsedTime.start()
		})
		.on("end", function () {
			//elapsedTime.stop()
		})
		.start()

	// calling force.drag() here returns the drag _behavior_ on which to set a listener
	// node element event listeners
	force
		.drag()
		.on("dragstart", function (d) {
			dragging = true;
			d3.selectAll(".dbox").style("z-index", 0);
			d3.select("#dbox" + d.index).style("z-index", 1);
		})
		.on("dragend", function (d) {
			dragging = false;
		});
}
///////////////////////////////////////////////////////////////////////////////////////

function showme() {
	elapsedTime.timestamp("showme")
	svg
	/////////////////////////////////////////////////////////////////////////////////////
	//Problem
	//	another defs element is added to the document every update
	//Solution:
	//	create a data join on defs 
	//	append the marker definitions on the resulting enter selection
	//	this will only be appeneded once
	/////////////////////////////////////////////////////////////////////////////////////

//ADD//////////////////////////////////////////////////////////////////////////////////
	.selectAll("defs")
	.data(["defs"], function (d) { return d }).enter()
///////////////////////////////////////////////////////////////////////////////////////

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

	/////////////////////////////////////////////////////////////////////////////////////
	//Problem
	//	another g element is added to the document every update
	//Solution:
	//	create a data join on the g and class it .paths 
	//	append the path g on the resulting enter selection
	//	this will only be appeneded once
	/////////////////////////////////////////////////////////////////////////////////////

//ADD//////////////////////////////////////////////////////////////////////////////////
	//Link bag
	//UPDATE
	paths = svg
		.selectAll(".paths")
		.data(["paths_g"]);
	//ENTER
	paths.enter()
///////////////////////////////////////////////////////////////////////////////////////

		.append("svg:g")

//ADD//////////////////////////////////////////////////////////////////////////////////
		.attr("class", "paths");
///////////////////////////////////////////////////////////////////////////////////////

	//Links
	//UPDATE
	path = paths	//Replace svg with paths///////////////////////////////////////////////
		.selectAll("path")
		.data(links);

	path.enter().append("svg:path")
		.attr("id", function (d) { return d.source.index + "_" + d.target.index; })
		.attr("class", function (d) { return "link " + d.type; })
		.attr("marker-end", function (d) { return "url(#" + d.type + ")"; });

	path.exit().remove();

	/////////////////////////////////////////////////////////////////////////////////////
	//Problem
	//	another g structure is added every update
	//Solution:
	//	create a data join on the g and class it .labels 
	//	append the labels g on the resulting enter selection
	//	this will only be appeneded once
	//	include .exit().remove() to be defensive
	//Note:
	//  don't chain .enter() on the object assigned to path_label
	//	.data(...) returns an update selection which includes enter() and exit() methods
	//	.enter() returns a standard selection which doesn't have a .exit() member
	//	this will be needed if links are removed or even if the node indexing changes
	/////////////////////////////////////////////////////////////////////////////////////

//ADD//////////////////////////////////////////////////////////////////////////////////
	//Link labels bag
	//UPDATE
	var path_labels = svg.selectAll(".labels")
		.data(["labels_g"]);
	//ENTER
	path_labels.enter()
///////////////////////////////////////////////////////////////////////////////////////

		.append("svg:g")

//ADD//////////////////////////////////////////////////////////////////////////////////
		.attr("class", "labels");
///////////////////////////////////////////////////////////////////////////////////////

	//Link labels
	//UPDATE
	path_label = path_labels
		.selectAll(".path_label")
		.data(links);
	//ENTER
	path_label
		.enter().append("svg:text")
			.attr("class", "path_label")
			.append("svg:textPath")
				.attr("startOffset", "50%")
				.attr("text-anchor", "middle")
				.attr("xlink:href", function (d) { return "#" + d.source.index + "_" + d.target.index; })
				.style("fill", "#000")
				.style("font-family", "Arial")
				.text(function (d) { return d.type; });

//ADD//////////////////////////////////////////////////////////////////////////////////
	path_label.exit().remove();
///////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////////////////////
	//Problem
	//	another g structure is added every update
	//Solution:
	//	create a data join on the g and class it .circles 
	//	append the labels g on the resulting enter selection
	//	this will only be appeneded once
	//	include .exit().remove() to be defensive
	/////////////////////////////////////////////////////////////////////////////////////

//ADD//////////////////////////////////////////////////////////////////////////////////
	//Nodes bag
	//UPDATE
	var circles = svg.selectAll(".circles")
				.data(["circles_g"]);
	//ENTER
	circles.enter()
///////////////////////////////////////////////////////////////////////////////////////

		.append("svg:g")

//ADD//////////////////////////////////////////////////////////////////////////////////
		.attr("class", "circles");
///////////////////////////////////////////////////////////////////////////////////////

	//Nodes
	//UPDATE
	circle = circles
		.selectAll(".node")	//select on class instead of tag name//////////////////////////
		.data(nodes);
	circle								//don't chain in order to keep the update selection////////////
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

//ADD//////////////////////////////////////////////////////////////////////////////////
	circle.exit().remove();
///////////////////////////////////////////////////////////////////////////////////////

//ADD//////////////////////////////////////////////////////////////////////////////////
	//Anchors bag
	//UPDATE
	var textBag = svg.selectAll(".anchors")
				.data(["anchors_g"]);
	//ENTER
	textBag.enter()
///////////////////////////////////////////////////////////////////////////////////////

		.append("svg:g")

//ADD//////////////////////////////////////////////////////////////////////////////////
		.attr("class", "anchors");

	//Anchors
	//UPDATE
	text = textBag
///////////////////////////////////////////////////////////////////////////////////////

		.selectAll(".anchor")
			.data(nodes, function (d) { return d.name});
	var textg = text										//don't chain in order to keep the update selection//////////
		.enter()
		.append("svg:g")
			.attr("class", "anchor")
			.attr("text-anchor", "middle");

//ADD//////////////////////////////////////////////////////////////////////////////////
	text.exit().remove;
///////////////////////////////////////////////////////////////////////////////////////

	// A copy of the text with a thick white stroke for legibility.
	textg.append("svg:text")
			.attr("x", 8)
			.attr("y", ".31em")
			.attr("class", "shadow")
			.text(function (d) { return d.name; });

	textg.append("svg:text")
			.attr("x", 8)
			.attr("y", ".31em")
			.attr("class", "dunKnow")
			.text(function (d) { return d.name; });

	elapsedTime.timestamp("\tend")
}

/*==================================================
 *  tick()
 *==================================================
 */
function tick(e) {
	elapsedTime.timestamp("tick local" + "\t\t\t\t\t\t" + elapsedTime.lap().lastLap
												+ "\tforce id: " + force.id)
	log.update(e.alpha)
	//console.log(elapsedTime.t() + "\t" + d3.format(",.6f")(e.alpha) + "\t"
	//					+ d3.format(",.1f")(force.charge()) + "\t"
	//					+ elapsedTime.lap().lastLap + "\t"
	//					+ elapsedTime.ticks);
	elapsedTime.mark()
	var rect = { H: height, W: width };

	circle.attr("transform", function (d) {
		var	_circ = { x: d.x, y: d.y, r: this.r.animVal.value },
				circ = containCircle(_circ, rect);
		d.x = circ.x; d.y = circ.y;
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

	path.attr("d", function (d) {
		return "M" + d.source.x + "," + d.source.y + "," + d.target.x + "," + d.target.y;
	});

	adding = null;	//this is for conditional breakpoints

	function containCircle(circ, rect) {
		var max = Math.max, min = Math.min;
		return {
			x: max(circ.r, min(rect.W - circ.r, circ.x)),
			y: max(circ.r, min(rect.H - circ.r, circ.y))
	}
	}
}


/*==================================================
 *  UI event listeners
 *==================================================
 */

function clicked(d) {
	d.fixed = true; //make the node sticky
	d3.select(this)
	.attr('fill', null) // Un-sets the "explicit" fill (might need to be null instead of '')
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



function OutputDiv(on, style, after) {
	function _OutputDiv(on, style, after) {
		var _sel = d3.select(on),
				defStyle = { margin: '50px 0 10px 10px', display: 'inline-block' };
		if (after) {
			_sel = _sel.insert('div', after)
		} else {
			_sel = _sel.append('div')
		}
		_sel = _sel.style(style ? style : defStyle).attr("id", "ouptDiv")
		this.selection = _sel
	}
	_OutputDiv.prototype.update = function (value) {
		this.selection.text(this.message(value))
		return this
	}
	_OutputDiv.prototype.message = function (value) {
		return value
	}
	return new _OutputDiv(on, style, after)
}
var log = OutputDiv(document.body, null, "script")
log.message = function (value) {
	return 'alpha: ' + d3.format(".3f")(value) + "\t charge: " + d3.format(",.1f")(force.charge())
}

var elapsedTime = OutputDiv(document.body)
elapsedTime.start = function () {
	this.startTime = window.performance.now()
	this.lapTime = this.startTime
	this.ticks = 0
	this.update(0)
	this.running = true
	return this
}
elapsedTime.lap = function () {
	if (this.running) {
		this.lastLap = d3.format(",.3f")((window.performance.now() - this.lapTime) / 1000)
		this.lapTime = window.performance.now()
	}
	return this
}
elapsedTime.t = function () {
	return d3.format(",.3f")((window.performance.now() - this.startTime) / 1000)
}
elapsedTime.mark = function (f) {
	if (this.running) {
		var _tMark = (window.performance.now() - this.startTime);
		if (!f) {
			this.ticks += 1
			this.update(_tMark / 1000)
		} else if (f.call) {
			f.call(this, _tMark)
		}
	} else {
		_tMark = 0
		//this.start()
	}
	return this
}
elapsedTime.message = function (value) {
	return 'time elapsed : ' + d3.format(",.3f")(value)
			+ ' sec\t'+ d3.format(",d")(this.ticks)
			+ '\ttimer count: ' + (force ? d3.timer.queue.includes(force.tick).length : 'undefined')
}
elapsedTime.stop = function (value) {
	this.running = false
	return this
}
elapsedTime.timestamp = function (message) {
	this.mark(function (t) {
		console.log(d3.format(",.6f")(t / 1000) + (message ? "\t" + message : ""))
	})
}



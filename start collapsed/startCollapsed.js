//Notes:
// Src: http://bl.ocks.org/mbostock/1093130
//Notes:
// * Each dom element is using 
//   children to store refs to expanded children
//   _children to store refs to collapsed children
//* It's using both a tree and a graph layout.

//root 
var g = {};

var startMode = new (function () {
	function _e() {
		return $("#startMode").get(0)
	};
	Object.defineProperties(this, {
		q0: {
			get: function () {
				return [g.q0, g.chargeTarget][_e().selectedIndex]
			}
		},
		emerge: {
			get: function () {
				return _e().value === "true"
			}
		},
		change: {
			set: function (l) {
				_e().addEventListener("change", l)
			}
		},
	});
})();

$(function startUp() {
	d3.json("startCollapsed.json",
		function (error, data) {
			if (error) { console.log(error.stack) }

			g.data = data;
			//if (g.force) {
				//the next tick will kill the animation timer for the force
				//just before that it will fire the end event
				//g.force
					//.on("end", function () {
					//	g.force = null;
					//})
					//.stop();
			//};
			g.width = 960;
			g.height = 500;
			g.linkTarget = 80;
			g.q0 = -.5;
			g.chargeTarget = -200;
			g.interpAlpha = function interpAlpha(x, alpha, t) {
				var alpha0 = 0.1, alphaF = 0.005;
				t = t || 1;
				return Math.max(x * (alpha0 - alpha) / (alpha0 - alphaF) / (1 - t), x)
			};
			g.interpQ = function (alpha, t) {
				return this.interpAlpha(this.chargeTarget,alpha, t)
			}

			//Create a sized SVG surface within viz:
			g.svg = d3.select("#viz");
			g.svg.select("svg").remove()
			g.svg = g.svg.append("svg")
			.attr("width", g.width)
			.attr("height", g.height);

			g.svg.selectAll(".link").remove(),
			g.svg.selectAll(".node").remove();
			g.force = null;

			//Create a graph layout engine:
			g.force = d3.layout.force()
					.linkDistance(g.linkTarget)
					.charge(startMode.q0)
					.gravity(0.05)
					.size([g.width, g.height])
			//that invokes the tick method to draw the elements in their new location:
					.on("tick", tick)
					.on("start", function () { elapsedTime.start() })
					.on("end", function () { elapsedTime.stop() });

			//var nodes = flatten(g.data);
			//nodes.forEach(function (d) {
			//	d._children = d.children;
			//	d.children = null;
			//});


			//Draw the graph:
			//Note that this method is invoked again
			//when clicking nodes:
			update();

			elapsedTime.timestamp()

			startMode.change = startUp;

			if (startMode.emerge) {
				var onTick = g.force.on("tick");

				elapsedTime.timestamp("about to stop")

				g.force
					//.on("tick", function (e) {
					//	elapsedTime.timestamp("tick\n")

					//	g.node.each((function () {
					//		var x0 = g.width / 2, y0 = g.height / 2;
					//		return function (d, i) {
					//			d.px = d.x = x0; d.py = d.y = y0;
					//		}
					//	})())

					//	elapsedTime.timestamp("about to start")
					//	g.force.start()
					//	elapsedTime.timestamp("started")

					//	g.force.on(e.type, onTick)
					//})
					.stop();

				elapsedTime.timestamp("stopped")
				elapsedTime.timestamp("about to flush")

				//run the current animation timer on g.force
				//this will cause the d3.timer to call force.tick with alpha = 0
				//which will return true because alpha is zero and this will delete
				//the animation timer call-back on g.force
				//d3.timer.flush();

				elapsedTime.timestamp("about to start")
				g.force.start()
				elapsedTime.timestamp("started")

				elapsedTime.timestamp("callback count\t" +
																d3.timer.queue.includes(g.force.tick).length);

				d3.timer.queue.clean(g.force.tick);

				elapsedTime.timestamp("callback count\t" +
																d3.timer.queue.includes(g.force.tick).length);

				//elapsedTime.timestamp("timer flushed")
				//setTimeout(function () {
				//	elapsedTime.timestamp("about to start")
				//	g.force.start()
				//	elapsedTime.timestamp("started")
				//}, 1000);


			};
		});
});


//invoked once at the start, 
//and again when from 'click' method
//which expands and collapses a node.

function update() {
	elapsedTime.start();
	//iterate through original nested data, and get one dimension array of nodes.
	var nodes = flatten(g.data);

	g.link = g.svg.selectAll(".link"),
	g.node = g.svg.selectAll(".node");

	//Each node extracted above has a children attribute.
	//from them, we can use a tree() layout function in order
	//to build a links selection.
	var links = d3.layout.tree().links(nodes);

	// pass both of those sets to the graph layout engine, and restart it
	g.force.nodes(nodes)
		.charge(startMode.q0)
		.links(links)
		.start();

	//-------------------
	// create a subselection, wiring up data, using a function to define 
	//how it's suppossed to know what is appended/updated/exited
	g.link = g.link.data(links, function (d) { return d.target.id; });

	//Get rid of old links:
	g.link.exit().remove();

	//Build new links by adding new svg lines:
	g.link
			.enter()
			.insert("line", ".node")
			.attr("class", "link");

	// create a subselection, wiring up data, using a function to define 
	//how it's suppossed to know what is appended/updated/exited
	g.node = g.node.data(nodes, function (d) { return d.id; });
	//Get rid of old nodes:  
	g.node.exit().remove();
	//-------------------
	//create new nodes by making groupd elements, that contain circls and text:
	var nodeEnter = g.node.enter()
			.append("g")
			.attr("class", "node")
			.on("click", click)
			.call(g.force.drag);
	//circle within the single node group:
	nodeEnter.append("circle")
			.attr("r", function (d) { return Math.sqrt(d.size) / 10 || 4.5; });
	//text within the single node group:
	nodeEnter.append("text")
			.attr("dy", ".35em")
			.text(function (d) {
				return d.name;
			});
	//All nodes, do the following:
	g.node.select("circle")
			.style("fill", color); //calls delegate
	//-------------------
}


// Invoked from 'update'.
// The original source data is not the usual nodes + edge list,
// but that's what's needed for the force layout engine. 
// So returns a list of all nodes under the root.
function flatten(data) {
	var nodes = [],
			i = 0;
	//count only children (not _children)
	//note that it doesn't count any descendents of collapsed _children 
	//rather elegant?
	function recurse(node) {
		if (node.children) node.children.forEach(recurse);
		if (!node.id) node.id = ++i;
		nodes.push(node);
	}
	recurse(data);

	//Done:
	return nodes;
}

//Invoked from 'update'
//Return the color of the node
//based on the children value of the 
//source data item: {name=..., children: {...}}
function color(d) {
	return d._children ? "#3182bd" // collapsed package
	:
	d.children ? "#c6dbef" // expanded package
	:
			"#fd8d3c"; // leaf node
}

// Toggle children on click by switching around values on _children and children.
function click(d) {
	if (d3.event.defaultPrevented) return; // ignore drag
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else {
		d.children = d._children;
		d._children = null;
	}
	//
	update();
}

//event handler for every time the force layout engine
//says to redraw everthing:
function tick(e) {
	log.update(e.alpha)
	console.log(elapsedTime.t() + "\t" + d3.format(",.6f")(e.alpha) + "\t"
						+ d3.format(",.1f")(g.force.charge()) + "\t"
						+ elapsedTime.lap().lastLap + "\t"
						+ elapsedTime.ticks);
	elapsedTime.mark()

	//redraw position of every link within the link set:
	g.link.attr("x1", function (d) {
		return d.source.x;
	})
			.attr("y1", function (d) {
				return d.source.y;
			})
			.attr("x2", function (d) {
				return d.target.x;
			})
			.attr("y2", function (d) {
				return d.target.y;
			});
	//same for the nodes, using a functor:
	g.node.attr("transform", function (d) {
		return "translate(" + d.x + "," + d.y + ")";
	});

	var  alpha = e.alpha;

	if (startMode.emerge) {
		var l;
		g.force
			//.linkDistance(interpAlpha(g.linkTarget, alpha, 0.8))
			//.linkStrength(interpAlpha(1, alpha, 0.8))
			.charge(l = g.interpQ(alpha, .8));
		//.charge(l = interpAlpha(g.chargeTarget, alpha, 0.8));
		g.force.start();
		//console.log(l)
		//g.force.stop();
		g.force.alpha(alpha); ///0.99*0.995);
	};
	//console.log(e.alpha + "\t" + alpha + "\t" + alpha.toFixed(3) + "\t" + l + "\t" + g.force.charge())
}

function interpAlpha(x, alpha, t) {
	var alpha0 = 0.1, alphaF = 0.005;
	t = t || 1;
	return x * (alpha0 - alpha) / (alpha0 - alphaF * t)
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
		_sel = _sel.style(style ? style : defStyle)
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
var log = OutputDiv(document.body)
log.message = function (value) {
	return 'alpha: ' + d3.format(".3f")(value) + "\t charge: " + d3.format(",.1f")(g.force.charge())
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
	} else {
		_tMark = 0
		//this.start()
	}
	if (!f) {
		this.ticks += 1
		this.update(_tMark / 1000)
	} else if (f.call) {
		f.call(this, _tMark)
	}
	return this
}
elapsedTime.message = function (value) {
	return 'time elapsed : ' + d3.format(",.3f")(value) + ' sec\t' + d3.format(",d")(this.ticks)
}
elapsedTime.stop = function (value) {
	this.running = false
	return this
}
elapsedTime.timestamp = function (message) {
	this.mark( function(t) {
		console.log(d3.format(",.6f")(t / 1000) + (message ? "\t" + message : ""))
	})
}

var data =

{
	name: "flare",
	children: [{
		name: "analytics",
		children: [{
			name: "cluster",
			children: [{
				name: "AgglomerativeCluster",
				size: 3938
			}, {
				name: "CommunityStructure",
				size: 3812
			}, {
				name: "HierarchicalCluster",
				size: 6714
			}, {
				name: "MergeEdge",
				size: 743
			}]
		}, {
			name: "graph",
			children: [{
				name: "BetweennessCentrality",
				size: 3534
			}, {
				name: "LinkDistance",
				size: 5731
			}, {
				name: "MaxFlowMinCut",
				size: 7840
			}, {
				name: "ShortestPaths",
				size: 5914
			}, {
				name: "SpanningTree",
				size: 3416
			}]
		}, {
			name: "optimization",
			children: [{
				name: "AspectRatioBanker",
				size: 7074
			}]
		}]
	}]
};

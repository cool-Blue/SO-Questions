//TODO construct link-node complex as a unit then transform together to the end position
// not working yet!
var line_diff = 0.5;  // increase from zero if you want space between the call/text lines
var mark_offset = 10; // how many percent of the mark lines in each end are not used for the relationship between incoming/outgoing?
var mark_size = 5;    // size of the mark on the line

var legendRectSize = 9; // 18
var legendSpacing = 4; // 4
var recordTypes = [];
var legend;

var text_links_data, call_links_data;

// colors for the different parts of the visualization
recordTypes.push({
	text : "call",
	color : "#438DCA"
});

recordTypes.push({
	text : "text",
	color : "#70C05A"
});

recordTypes.push({
	text : "balance",
	color : "#245A76"
});

// Function for grabbing a specific property from an array
pluck = function (ary, prop) {
	return ary.map(function (x) {
		return x[prop]
	});
}

// Sums an array
sum = function (ary) {
	return ary.reduce(function (a, b) {
		return a + b
	}, 0);
}

maxArray = function (ary) {
		return ary.reduce(function (a, b) {
			return Math.max(a, b)
		}, -Infinity);
	}

minArray = function (ary) {
	return ary.reduce(function (a, b) {
		return Math.min(a, b)
	}, Infinity);
}

var data_links;

var data_nodes;

var results = Papa.parse("links.csv", {
		header : true,
		download : true,
		dynamicTyping : true,
		delimiter : ",",
		skipEmptyLines : true,
		complete : function (results) {
			data_links = results.data;

			for (i = 0; i < data_links.length; i++) {
				total_interactions += data_links[i].inc_calls
															+ data_links[i].out_calls
															+ data_links[i].inc_texts
															+ data_links[i].out_texts;
				max_interactions = Math.max(max_interactions,
																		data_links[i].inc_calls
																		+ data_links[i].out_calls
																		+ data_links[i].inc_texts
																		+ data_links[i].out_texts)
			}

			//console.log(total_interactions);
			//console.log(max_interactions);

			linkedByIndex = {};

			data_links.forEach(function (d) {
				linkedByIndex[d.source + "," + d.target] = true;
				//linkedByIndex[d.source.index + "," + d.target.index] = true;
			});

			dataLoaded();
		}
	});

var results = Papa.parse("nodes.csv", {
		header : true,
		download : true,
		dynamicTyping : true,
		delimiter : ",",
		skipEmptyLines : true,
		complete : function (results) {
			data_nodes = results.data;
			data_nodes.forEach(function (d, i) {
				d.size = (i == 0)? 200 : 30
				d.fill = (d.no_network_info == 1)? "#dfdfdf": "#a8a8a8"
			});
			dataLoaded();
		}
	});

function node_radius(d) {
	return Math.pow(40.0 * ((d.index == 0) ? 200 : 30), 1 / 3);
}
function node_radius_data(d) {
	return Math.pow(40.0 * d.size, 1 / 3);
}

function dataLoaded() {
	if (typeof data_nodes === "undefined" || typeof data_links === "undefined") {
		console.log("Still loading " + (typeof data_nodes === "undefined" ? 'data_links' : 'data_nodes'))
	} else {
		CreateVisualizationFromData();
	}
}

function isConnectedToOtherThanMain(a) {
	var connected = false;
	for (i = 1; i < data_nodes.length; i++) {
		if (isConnected(a, data_nodes[i]) && a.index != i) {
			connected = true;
		}
	}
	return connected;
}

function isConnected(a, b) {
	return isConnectedAsTarget(a, b) || isConnectedAsSource(a, b) || a.index == b.index;
}

function isConnectedAsSource(a, b) {
	return linkedByIndex[a.index + "," + b.index];
}

function isConnectedAsTarget(a, b) {
	return linkedByIndex[b.index + "," + a.index];
}

function isEqual(a, b) {
	return a.index == b.index;
}


function tick(e) {

	log.update(e.alpha)
	eleapsedTime.mark()

	if (call_links_data.length > 0) {

		callLinkG
			.attr('transform', function (d, i) {
				return 'translate( ' + (d.source.x) + ' ' + (d.source.y)
								+ ') rotate(' + getAngle(d) * 180 / Math.PI + ' 0, 0)' 
			})
		callLink
			.attr('x1', 0)
			.attr('y1', function (d) { return line_shift(d, -1) })
			.attr('x2', function (d) { return getLength(d) })
			.attr('y2', function (d) { return line_shift(d, -1) })

		callLinkText
			.attr('x', function (d) {
				return getLength(d)/2
			})
			//.attr('transform', function (d, i) {
			//	return d.source.x > d.target.x ? 'scale(1 -1)' : 'scale(1 1)'
			//})
			.attr('y', function (d) { return d.source.x > d.target.x ?  -10 : -10 })

		callLink.each(function (d, i) {
			applyGradient(this, "call", d, i)
		});

	}

	if (text_links_data.length > 0) {

		textLink
		//CB
		.each(function (d) {
			d.lpsNeg1 = line_perpendicular_shift(d, -1);
			d.lrste = [];
			d.lrste.push(line_radius_shift_to_edge(d, 0));
			d.lrste.push(line_radius_shift_to_edge(d, 1));
		})
		//CB
		.attr("x1", function (d) {
			return d.source.x - d.lpsNeg1[0] + d.lrste[0][0];
		})
		.attr("y1", function (d) {
			return d.source.y - d.lpsNeg1[1] + d.lrste[0][1];
		})
		.attr("x2", function (d) {
			return d.target.x - d.lpsNeg1[0] + d.lrste[1][0];
		})
		.attr("y2", function (d) {
			return d.target.y - d.lpsNeg1[1] + d.lrste[1][1];
		});
		textLink.each(function (d, i) {
			applyGradient(this, "text", d, i)
		});

		node
		.attr("transform", function (d) {
			return "translate(" + d.x + "," + d.y + ")";
		});

			}
	
	if (force.alpha() < 0.05) {
		drawLegend()
		eleapsedTime.stop().mark()
	}
	defTags.update('linearGradient count: '
							+ defs.selectAll('linearGradient').size())
}

function getRandomInt() {
	return Math.floor(Math.random() * (100000 - 0));
}

function applyGradient(line, interaction_type, d, i) {

	var self = d3.select(line);

	var new_gradient_id = "lg" + interaction_type + d.source.index + d.target.index; // + getRandomInt();

	var fromSource = d.source.size < d.target.size
	var from = fromSource ? d.source : d.target;
	var to = fromSource ? d.target : d.source;
	if (interaction_type === 'call') {
		var from_px = fromSource ? { px: self.attr('x1'), py: self.attr('y1') } : getLength(d);
		var to_px = d.source.size < d.target.size ? d.target : d.source;
	}

	var mid_offset = 0;
	var standardColor = "";
	// calculte per unit incomming
	if (interaction_type == "call") {
		mid_offset = d.inc_calls / (d.inc_calls + d.out_calls);
		standardColor = "#438DCA";
	} else {
		mid_offset = d.inc_texts / (d.inc_texts + d.out_texts);
		standardColor = "#70C05A";
	}
	
	/* recordTypes_ID = pluck(recordTypes, 'text');
	whichRecordType = recordTypes_ID.indexOf(interaction_type);
	standardColor = recordTypes[whichRecordType].color;
 */
	mid_offset = mid_offset * 100;
	mid_offset = mid_offset * 0.6 + 20; // scale so it doesn't hit the ends

	lineLength = lineLengthCalculation(from.px, from.py, to.px, to.py);

	if (lineLength >= 0.1) {
		var mark_size_percent = (mark_size / lineLength) * 100,
				_offsetDiff = Math.round(mid_offset - mark_size_percent / 2) + "%",
				_offsetSum = Math.round(mid_offset + mark_size_percent / 2) + "%",

			defsUpdate = defs.selectAll("#" + new_gradient_id)
			.data([{
				x1: fromSource ? self.attr('x1') : self.attr('x2'),
				y1: fromSource ? self.attr('y1') : self.attr('y2'),
				x2: fromSource ? self.attr('x2') : self.attr('x1'),
				y2: fromSource ? self.attr('y2') : self.attr('y1')
		}]),

			defsEnter = defsUpdate.enter().append("linearGradient")
				.attr("id", new_gradient_id)
				.attr("gradientUnits", "userSpaceOnUse"),

			defsUpdateEnter = defsUpdate
				.attr("x1", function (d) { return d.x1 })
				.attr("y1", function (d) { return d.y1 })
				.attr("x2", function (d) { return d.x2 })
				.attr("y2", function (d) { return d.y2 }),

			stopsUpdate = defsUpdateEnter.selectAll("stop")
				.data([{
					offset: "0%",
					color: standardColor,
					opacity: "1"
				}, {
					offset: _offsetDiff,
					color: standardColor,
					opacity: "1"
				}, {
					offset: _offsetDiff,
					color: standardColor,
					opacity: "1"
				}, {
					offset: _offsetDiff,
					color: "#245A76",
					opacity: "1"
				}, {
					offset: _offsetSum,
					color: "#245A76",
					opacity: "1"
				}, {
					offset: _offsetSum,
					color: standardColor,
					opacity: "1"
				}, {
					offset: _offsetSum,
					color: standardColor,
					opacity: "1"
				}, {
					offset: "100%",
					color: standardColor,
					opacity: "1"
				}
				]),

				stopsEnter = stopsUpdate.enter().append("stop")

			stopsUpdateEnter = stopsUpdate
			.attr("offset", function (d) {
				return d.offset;
			})
			.attr("stop-color", function (d) {
				return d.color;
			})
			.attr("stop-opacity", function (d) {
				return d.opacity;
			})

		self.style("stroke", "url(#" + new_gradient_id + ")")
	}

	} /*applyGradient*/

var linkedByIndex;

var width = $(window).width();
var height = $(window).height();

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

var force;
var callLinkG, callLink, callLinkText;
var textLinkG, textLink;
var link;
var node;
var defs;
var marker;
var total_interactions = 0;
var max_interactions = 0;

function CreateVisualizationFromData() {

	function chargeForNode(d, i) {
		// main node
		if (i == 0) {
			return -25000;
		}
			// contains other links
		else if (isConnectedToOtherThanMain(d)) {
			return -2000;
		} else {
			return -1200;
		}
	}
	
	// initial placement of nodes prevents overlaps
	var xOffset = 10000,
			yOffset = -10000,
			central_x = width / 2,
			central_y = height / 2;
	
	data_nodes.forEach(function(d, i) {
		if (i != 0) {
			connected = isConnectedToOtherThanMain(d);
			data_nodes[i].x = connected ? central_x + xOffset : central_x - xOffset;
			data_nodes[i].y = connected ? central_y + yOffset : central_y - yOffset;
		}
		else {data_nodes[i].x = central_x; data_nodes[i].y = central_y;}})
	
	force = d3.layout.force()
		.nodes(data_nodes)
		.links(data_links)
		.charge(function (d, i) {
			return chargeForNode(d, i)
		})
		.friction(0.6) // 0.6
		.gravity(0.4) // 0.6
		.size([width, height])
		.start()	//initialise alpha
	log.update(force.alpha());
	force.stop();

	call_links_data = data_links.filter(function(d) {
		return (d.inc_calls + d.out_calls > 0)});
	text_links_data = data_links.filter(function(d) {
		return (d.inc_texts + d.out_texts > 0)});

	//UPDATE
	callLinkG = svg.selectAll(".call-line")
		.data(data_links) //call_links_data)
	//ENTER
	callLinkG.enter().append("g")
		.attr('class', 'call-line')

	callLinkText = callLinkG.selectAll('text')
		.data(function (d) {
			return (d.inc_calls + d.out_calls > 0) ? d : null
		})
		enter().append("text")
		.attr("dy", ".3em")
		.style("text-anchor", "middle")
		.style("font-size", "8px")
		.text(function (d) {
			return d.source.index == 0 ? "" : d.source.index + "," + d.target.index
		})
	callLink = callLinkG
		.append('line')
	//EXIT
	callLinkG.exit().remove;

	//UPDATE
	textLink = svg.selectAll(".text-line")
		.data(text_links_data)
	//ENTER
	textLink.enter().append("line")
		.attr('class', 'text-line');
	//EXIT
	textLink.exit().remove;

	//UPDATE
	node = svg.selectAll(".node")
		.data(data_nodes)
		//CB the g elements are not needed because there is only one element
		//in each node...
	//ENTER
	var nodeContainer = node.enter().append("g")
		.attr("class", "node")

		nodeContainer.append("circle")
			.attr("r", node_radius)
			.style("fill", function (d) {
				return (d.index == 0) ? "#ffffff" : d.fill;
			})
			.style("stroke", function (d) {
				return (d.index == 0) ? "#8C8C8C" : "#ffffff";
			})

		nodeContainer.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function (d, i) { return i })

	//EXIT
	node.exit().remove;

	if (defs) {	defs.remove()	}
	defs = svg.append("defs")

	marker = svg.selectAll('marker')
		.data([{refX: 6+7, refY: 2, markerWidth: 6, markerHeight: 4}])
	.enter().append("marker")
		.attr("id", "arrowhead")
		.attr("refX", function (d) { return d.refX })
		.attr("refY", function (d) { return d.refY })
		.attr("markerWidth", function (d) { return d.markerWidth })
		.attr("markerHeight", function (d) { return d.markerHeight })
		.attr("orient", "auto")
		.append("path")
			.attr("d", "M 0,0 V 4 L6,2 Z");

	if (text_links_data.length > 0) {
		//UPDATE + ENTER
		textLink
		.style("stroke-width", function stroke(d) {
			return text_width(d)
		})
	}

	if (call_links_data.length > 0) {
		//UPDATE + ENTER
		callLink
		.style("stroke-width", function stroke(d) {
			return call_width(d)
		})
	}

	force
	.on("tick", tick)
	.on("start", function () { eleapsedTime.start() })
	.on("end", function () { eleapsedTime.stop() })

}	/*CreateVisualizationFromData*/

d3.select(document).on('click', (function () {
	var _disp = d3.dispatch('stop_start')
	return function (e) {

		if (!_disp.on('stop_start') || _disp.on('stop_start') === force.stop) {
			if (!_disp.on('stop_start')) {
				_disp.on('stop_start', force.start)
			} else {
				_disp.on('stop_start', function () {
					//CreateVisualizationFromData();
					//force.start()
					force.alpha(0.5)
				})
			}
		} else {
			_disp.on('stop_start', force.stop)
		}
		_disp.stop_start()
	}
})())

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
	return 'alpha: ' + d3.format(".3f")(value)
}

var defTags = OutputDiv(document.body),
		eleapsedTime = OutputDiv(document.body)
		eleapsedTime.start = function () {
			this.startTime = window.performance.now()
			this.lapTime = this.startTime
			this.update(0)
			this.running = true
			return this
		}
		eleapsedTime.lap = function () {
			if (this.running) {
				this.update((window.performance.now() - this.lapTime) / 1000)
				this.lapTime = window.performance.now()
			}
			return this
		}
		eleapsedTime.mark = function () {
			if (this.running) {
				this.update((window.performance.now() - this.startTime) / 1000)
			}
			return this
		}
		eleapsedTime.message = function (value) {
			return 'time elapsed : ' + d3.format(".1f")(value) + ' sec'
		}
		eleapsedTime.stop = function (value) {
			this.running = false
			return this
		}

function drawLegend() {

	var node_px = pluck(data_nodes, 'px');
	var node_py = pluck(data_nodes, 'py');
	var nodeLayoutRight  = Math.max(maxArray(node_px));
	var nodeLayoutBottom = Math.max(maxArray(node_py));

	legend = svg.selectAll('.legend')
		.data(recordTypes)
		.enter()
		.append('g')
		.attr('class', 'legend')
		.attr('transform', function (d, i) {
			var rect_height = legendRectSize + legendSpacing;
			var offset = rect_height * (recordTypes.length-1);
			var horz = nodeLayoutRight + 15; /*  - 2*legendRectSize; */
			var vert = nodeLayoutBottom + (i * rect_height) - offset;
			return 'translate(' + horz + ',' + vert + ')';
		});

	legend.append('rect')
	.attr('width', legendRectSize)
	.attr('height', legendRectSize)
	.style('fill', function (d) {
		return d.color
	})
	.style('stroke', function (d) {
		return d.color
	});

	legend.append('text')
	.attr('x', legendRectSize + legendSpacing)
	.attr('y', legendRectSize - legendSpacing + 3)
	.text(function (d) {
		return d.text;
	})
	.style('fill', '#757575');

}

var line_width_factor = 10.0 // width for the widest line

function call_width(d) {
	return (d.inc_calls + d.out_calls) / max_interactions * line_width_factor;
}

function text_width(d) {
	return (d.inc_texts + d.out_texts) / max_interactions * line_width_factor;
}

function total_width(d) {
	return (d.inc_calls + d.out_calls + d.inc_texts + d.out_texts) / max_interactions * line_width_factor + line_diff;
}

function line_perpendicular_shift(d, direction) {
	theta = getAngle(d);
	theta_perpendicular = theta + (Math.PI / 2) * direction;

	lineWidthOfOppositeLine = direction == 1 ? text_width(d) : call_width(d);
	shift = lineWidthOfOppositeLine / 2;

	delta_x = (shift + line_diff) * Math.cos(theta_perpendicular)
	delta_y = (shift + line_diff) * Math.sin(theta_perpendicular)

	return [delta_x, delta_y]

}
function line_shift(d, direction) {

	lineWidthOfOppositeLine = direction == 1 ? text_width(d) : call_width(d);
	shift = lineWidthOfOppositeLine / 2;

	delta_y = (shift + line_diff)*direction

	return delta_y

}

function line_radius_shift_to_edge(d, which_node) { // which_node = 0 if source, = 1 if target
// adjust the end points of the links to the edge of the nodes
	theta = getAngle(d);
	theta = (which_node == 0) ? theta : theta + Math.PI; // reverse angle if target node
	radius = (which_node == 0) ? node_radius(d.source) : node_radius(d.target) // d.source and d.target refer directly to the nodes (not indices)
	radius -= 2; // add stroke width

	delta_x = radius * Math.cos(theta)
		delta_y = radius * Math.sin(theta)

		return [delta_x, delta_y]

}

function lineLengthCalculation(x, y, x0, y0) {
	return Math.sqrt((x -= x0) * x + (y -= y0) * y);
};

function getLength(d) {
	var x0 = d.source.x, y0 = d.source.y, x = d.target.x, y = d.target.y
	return Math.sqrt((x -= x0) * x + (y -= y0) * y);
}
function getAngle(d) {
	rel_x = d.target.x - d.source.x;
	rel_y = d.target.y - d.source.y;
	return theta = Math.atan2(rel_y, rel_x);
}

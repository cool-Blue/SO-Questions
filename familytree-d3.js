var familytree = (function () {
    var alreadyThere = false;
    var nodeCircles = {};
    var svg, link = {}, node = {};
    var force = d3.layout.force();
    var zoom;
    var width = 1200, height = 900;
    var initJSON, currentJSON;
    var container;
    var scale = 1;
    var trans = "0,0";

    return {
        cleanPresentation: function () {
					//nodeCircles = {};
					force.nodes([]);
					force.links([]);
					familytree.initializeGraph();
					//alreadyThere = false;
        },
        getAlreadyThere: function () {
            return alreadyThere;
        },
        createGraph: function (newJSON) {
            if (alreadyThere) {
                //nodeCircles = {};
                this.updateForce(this.generateObjects(currentJSON = JSON.parse(initJSON)));
                return;
            }
            initJSON = JSON.stringify(newJSON);
            this.updateForce(this.generateObjects(newJSON));
            currentJSON = newJSON;
            alreadyThere = true;
        },
        updateGraph: function (newJSON) {
            this.findDuplicatesAndSetEmpty(newJSON);
            this.deleteEmptyObjectsInJSON(newJSON);
            currentJSON = currentJSON.concat(newJSON);
            this.updateForce(this.generateObjects(currentJSON));
        },
        findDuplicatesAndSetEmpty: function (newJSON) {
            for (var i = 0; i < currentJSON.length; i++) {
                for (var o = 0; o < newJSON.length; o++) {
                    if ((currentJSON[i].source.ID == newJSON[o].source) && (currentJSON[i].target.ID == newJSON[o].target)
                        || (currentJSON[i].source.ID == newJSON[o].target) && (currentJSON[i].target.ID == newJSON[o].source)) {
                        newJSON[o] = {};
                    }
                }
            }
        },
        deleteEmptyObjectsInJSON: function (json) {
            for (var i = 0; i < json.length; i++) {
                var y = json[i].source;
                if (y === "null" || y === null || y === "" || typeof y === "undefined") {
                    json.splice(i, 1);
                    i--;
                }
            }
        },
        updateGraphByRemoveElement: function (clickedNode, index) {
            // remove links from or to clicked node
            var json4Splicing = currentJSON;
            for (var i = 0; i < json4Splicing.length; i++) {
                if (json4Splicing[i].source.ID == clickedNode.ID) {
                    json4Splicing[i] = {};
                } else if (json4Splicing[i].target.ID == clickedNode.ID) {
                    json4Splicing[i] = {};
                }
            }
            familytree.deleteEmptyObjectsInJSON(json4Splicing);
            familytree.deleteNode(force.nodes(), clickedNode);
            currentJSON = json4Splicing;
            familytree.updateForce(familytree.generateObjects(currentJSON));
        },
        deleteNode: function (allNodes, clickedNode) {
            allNodes.forEach(function (node) {
                if (node == clickedNode) {
                    force.links().forEach(function (link) {
                        if (node.ID == link.source.ID) {
                            link.target.linkCount--;
                        }
                        if (node.ID == link.target.ID) {
                            link.source.linkCount--;
                        }
                    });
                    node.linkCount = 0;
                }
            });
        },
        generateObjects: function (json) {
            json.forEach(function (link) {
                if (typeof(link.source) == "string") {
                    link.source = nodeCircles[link.source] || (
                        nodeCircles[link.source] = {
                            name: link.sourceName,
                            significance: link.sourceSign,
                            uniquename: link.sourceUName,
                            ID: link.source,
                            class: link.sourceClass,
                            relation: link.relation,
                            race: link.sourceRace,
                            linkCount: 0
                        }
                      );
                    link.source.linkCount++;
                }
                if (typeof(link.target) == "string") {
                    link.target = nodeCircles[link.target] || (
                        nodeCircles[link.target] = {
                          name: link.targetName,
                          significance: link.targetSign,
                          uniquename: link.targetUName,
                          ID: link.target,
                          class: link.targetClass,
                          relation: link.relation,
                          race: link.targetRace,
                          linkCount: 0}
                      );
                    link.target.linkCount++;
                }
            });
            return json;
        },
        updateForce: function (links) {
					updateData(links, force, nodeCircles)
				},
        initializeGraph: (function(){
					force
						.size([width, height])
						.gravity(.2)
						.charge(-400)
						.friction(0.9)
						.theta(0.9)
						.linkStrength(1)
						.distance(100)
						.on("tick", tick)
					return function () {
						svg = zoomableSVG({width: "100%", height: "100%"}, "#familytreecontentsvg", {extent: [0.4, 4], dblclk: null});

						svg.onZoom(zoomed);

						hookDrag(force.drag(), "dragstart.force", function(d) {
							//prevent dragging on the nodes from dragging the canvas
							var e = d3.event.sourceEvent;
							if(e.button != 2) {
								//left click only
								e.stopPropagation();
								d.fixed = e.shiftKey || e.touches && (e.touches.length > 1);
								familytree.click(d)
							}
						});
						hookDrag(force.drag(), "dragend.force", function(d) {
							//prevent dragging on the nodes from dragging the canvas
							var e = d3.event.sourceEvent;
							d.fixed = e.shiftKey || d.fixed;
						});

						var varsvgMarker = svg.selectAll("defs")
							.data([["end"]])
							.enter().append("defs")
							.selectAll("marker")
							.data(id)
							.enter();
						this.createMarker(varsvgMarker);

						container = svg.selectAll("#container").data([{nodes: [force.nodes()], links: [force.links()]}]);
						container.enter().append("g").attr("id", "container");

						var links = container.selectAll(".links").data(function(d){return d.links});
						links.enter().append("g").attr("class", "links");

						link = links.selectAll("line").data(id);
						link.enter().append("line")/*.attr("class", "link")*/;
						link.exit().remove();
						link.attr("class", function (d) {
							if (d.relation == "BEGETS") {
								return "linkBEGETS";
							}
							if (d.relation == "LOVES") {
								return "linkLOVES";
							}
							if (d.relation == "HASSIBLING") {
								return "linkHASSIBLING";
							}
						})
							.attr("marker-end", function (d) {
								if (d.relation == "BEGETS") {
									switch (d.targetSign) {
										case 1: return "url(#end1)"; break;
										case 2: return "url(#end2)"; break;
										case 3: return "url(#end3)"; break;
										case 4: return "url(#end4)"; break;
										case 5: return "url(#end5)"; break;
										case 6: return "url(#end6)"; break;
										case 7: return "url(#end7)"; break;
										case 8: return "url(#end8)"; break;
										case 9: return "url(#end9)"; break;
										default:
											return "url(#end1)";
									}
								}
							});

						var nodes = container.selectAll(".nodes").data(function(d){return d.nodes});
						nodes.enter().append("g").attr("class", "nodes");

						node = nodes.selectAll(".node").data(id);
						var newNode = node.enter().append("g").attr("class", "node");
						node.exit().remove();
						newNode.on("mouseover", this.mouseover)
							.on("mouseout", this.mouseout)
							//.on("click", function (d) {
							//    familytree.click(d);
							//})
							.on("dblclick", function (d) {
								familytree.dblclick(d);
							})
							.on('contextmenu', function (data, index) {
								d3.event.preventDefault();
								familytree.updateGraphByRemoveElement(data, index);
							})
							.call(force.drag);
						newNode
							.append("circle")
							.attr("class", "bgcircle");
						node.select("circle")
							.attr("r", function (d) {
								return Math.abs(familytree.posXY(d));
							})
							.style("fill", function (d) {
								return familytree.colourRace(d);
							})
							.style("stroke", function (d) {
								return familytree.colourRace(d);
							});
						newNode
							.append("svg:image")
							.attr("class", "circle");
						node.select("image")
							.attr("xlink:href", function (d) {
								return "/pics/arda/creature/" + d.uniquename + "_familytree.png";
							})
							.attr("x", function (d) {
								return familytree.posXY(d);
							})
							.attr("y", function (d) {
								return familytree.posXY(d);
							})
							.attr("width", function (d) {
								return familytree.sizeXY(d);
							})
							.attr("height", function (d) {
								return familytree.sizeXY(d);
							})
							.on("error", function () {
								d3.select(this).style("visibility", "hidden");
							});
						newNode
							.append("text")
							.attr("class", "nodetext");
						node.select("text")
							.attr("x", function (d) {
								return Math.abs(familytree.posXY(d) - 5);
							})
							.attr("y", 4)
							.text(function (d) {
								return d.name;
							});

						force
							.alpha(0.4)
							.start();

						function hookDrag(target, event, hook) {
							//hook force.drag behaviour
							var stdDragStart = target.on(event);
							target.on(event, function(d) {
								hook.call(this, d);
								stdDragStart.call(this, d);
							});
						}

						function zoomed(){
							var e = d3.event.sourceEvent,
									isWheel = e && ((e.type == "mousewheel") || (e.type == "wheel"));
							force.alpha(0.01);
							return isWheel ? zoomWheel.call(this) : zoomInst.call(this)
						}
						function zoomInst(){
							var t = d3.transform(container.attr("transform"));
							t.translate = d3.event.translate; t.scale = d3.event.scale;
							container.attr("transform", t.toString());
						}
						function zoomWheel(){
							var t = d3.transform(container.attr("transform"));
							t.translate = d3.event.translate; t.scale = d3.event.scale;
							container.transition().duration(450).attr("transform", t.toString());
						}

					}

					function tick() {
						link
							.attr("x1", function (d) {
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
						node
							.attr("transform", function (d) {
								return "translate(" + d.x + "," + d.y + ")";
							});
					}

				})(),
        createMarker: function (svg) {
            //http://stackoverflow.com/questions/15495762/linking-nodes-of-variable-radius-with-arrows
            var obj = [38,43,50,54,60,65,70,80,85];
            for (var i = 0; i < obj.length; i++) {
                svg.append("svg:marker")
                    .attr("id", "end" + (i + 1))
                    .attr("viewBox", "0 -5 10 10")
                    .attr("refX", obj[i])
                    .attr("refY", -0.05)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 6)
                    .attr("orient", "auto")
                    .append("svg:path")
                    .attr("d", "M0,-4L10,0L0,4");
            }
        },
        sizeXY: function (d) {
            return [10,24,28,32,36,40,44,48,52,10][d.significance || 0];
        },
        posXY: function (d) {
            return [-10, -12, -14, -16, -18, -20, -22, -24, -26, -10][d.significance || 0];
        },
        colourRace: function (d) {
            switch ((d.race)) {
                case "Ainu":
                    return "#000"; break;
                case "Arnorian":
                    return "#5D8AA8"; break;
                case "Balrog":
                    return "#000"; break;
                case "Dragon":
                    return "#900"; break;
                case "Dwarf":
                    return "#996515"; break;
                case "Elf":
                    return "#900020"; break;
                case "Ent":
                    return "#5b3"; break;
                case "Falmar/Falas Elf":
                    return "#0099CC"; break;
                case "God":
                    return "#fff"; break;
                case "Gondorian":
                    return "#393939"; break;
                case "Half-Elf":
                    return "#900020"; break;
                case "Hobbit":
                    return "#006600"; break;
                case "Maia":
                    return "#9A03B5"; break;
                case "Man":
                    return "#993D00"; break;
                case "Nando":
                    return "#355E3B"; break;
                case "Nazgûl":
                    return "#000"; break;
                case "Noldo":
                    return "#090A67"; break;
                case "Númenórean":
                    return "#007BA7"; break;
                case "Orc":
                    return "#736326"; break;
                case "Rohir":
                    return "#80461B"; break;
                case "Sinda":
                    return "#949494"; break;
                case "Spider":
                    return "#000"; break;
                case "Teleri":
                    return "#4B0101"; break;
                case "Tree":
                    return "#2b6"; break;
                case "Troll":
                    return "#000"; break;
                case "Vala":
                    return "#440D60"; break;
                case "Vanya":
                    return "#FFCC00"; break;
                case "Werewolf":
                    return "#000"; break;
                default:
                    return "#aaa"; break;
            }
        },
        mouseover: function () {
            d3.select(this).select("text").transition()
                .duration(750)
                .style("font-size", "15px")
                .style("fill", "black");
            d3.select(this).moveToFront();
        },
        mouseout: function () {
            d3.select(this).select("text").transition()
                .duration(750)
                .style("font-size", "8px")
                .style("fill", "#ccc");
        },
        click: function (d) {
            orientdb.getInfo4CreatureByRID(d.ID);
        },
        dblclick: function (d) {
            orientdb.getFamilytreeSingle(d.ID + "|" + d.class, false);
        }
    };
		function updateData(links, force, nodeCircles) {
			force.nodes(d3.values(nodeCircles).filter(function (d) {
				return d.linkCount;
			}));
			force.links(d3.values(links));
			familytree.initializeGraph();
		}
    function zoomableSVG (size, selector, z){
        //delivers an svg background with zoom/drag context in the selector element
        //if height or width is NaN, assume it is percentage and ignore margin
        var margin = size.margin || {top: 0, right: 0, bottom: 0, left: 0},
            percentW = isNaN(size.width), percentH = isNaN(size.height),
            w = percentW ? size.width : size.width - margin.left - margin.right,
            h = percentH ? size.height : size.height - margin.top - margin.bottom,
            zoomed = function(){return this},

            zoom = zoom || d3.behavior.zoom().scaleExtent(z && z.extent || [0.4, 4])
              .on("zoom", function(d, i, j){
                  zoomed.call(this, d, i, j);
              });

        var svg = d3.select(selector).selectAll("svg").data([["transform root"]]);
            svg.enter().append("svg");
            svg.attr({width: size.width, height: size.height});

        var g = svg.selectAll("#zoom").data(id),
            gEnter = g.enter().append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              .call(zoom)
              .attr({class: "outline", id: "zoom"}),
            surface = gEnter.append("rect")
              .attr({width: w, height: h, fill: "none"})
              .style({"pointer-events": "all"});
        if(z && (typeof z.dblclk != "undefined")) gEnter.on("dblclick.zoom", z.dblclk);

        g.h = h;
        g.w = w;
        g.onZoom = function(cb){zoomed = cb;};

        return g;
    }
})();
    function id(d){return d;};

d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};


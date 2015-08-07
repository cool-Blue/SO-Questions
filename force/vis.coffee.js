(function () {
	var $, DD3;

	DD3 = window.DD3 = {};

	$ = jQuery;



	// Other constructs
	DD3.Bubble_Force = (function () {
		function Bubble_Force(options) {
			if (!(this instanceof DD3.Bubble_Force)) {
				return new DD3.Bubble_Force(options);
			}
			if (typeof options.element === 'string') {
				this.el = $(document.getElementById(options.element));
			} else {
				this.el = $(options.element);
			}
			if (this.el === null || this.el.length === 0) {
				throw new Error("Graph placeholder not found.");
			}

			var div = this.el[0];
			var _THIS = this;

			Bubble_Force.prototype.width = options.width !== "undefined" && options.width !== null ? options.width : $(div).parent().width(),
			Bubble_Force.prototype.height = options.height !== "undefined" && options.height !== null ? options.height : 500;

			Bubble_Force.prototype.data = typeof options.data === "string" ? {} : options.data;

			Bubble_Force.prototype.generate = function () {
				var center = {
							x: this.width / 2,
							y: this.height / 2
						},
						year_centers = {
							"2008": {
								x: this.width / 3,
								y: this.height / 2
							},
							"2009": {
								x: this.width / 2,
								y: this.height / 2
							},
							"2010": {
								x: 2 * this.width / 3,
								y: this.height / 2
							}
						},
						layout_gravity = 0.1, //-0.01,
						damper = 0.1,
						vis = null,
						nodes = [],
						force = null,
						circles = null,
						fill_color = d3.scale.ordinal().domain(["low", "medium", "high"]).range(["#d84b2a", "#beccae", "#7aa25c"]),
						max_amount = d3.max(_THIS.data, function (d) {
							return parseInt(d.total_amount);
						}),
						radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85]);

				this.data.forEach(function (d, i, a) {
					var node = {
						id: d.id,
						radius: radius_scale(parseInt(d.total_amount)),
						value: d.total_amount,
						name: d.grant_title,
						org: d.organization,
						group: d.group,
						year: d.start_year,
						x: Math.random() * this.width,
						y: Math.random() * this.height
					};
					nodes.push(node);
				});

				nodes.deltaR = (function () {
					//returns the total absolute change in radius of all elements since the last call
					var prevRadii;
					return function () {
						if (prevRadii) {
							var norm = this.reduce(function (drp, d, i) {
								return drp + Math.abs( d.radius - prevRadii[i]);
							}, 0);
							prevRadii = this.map(function (d) { return  d.radius });
							return norm
						} else {
							prevRadii = this.map(function (d) { return  d.radius });
							return 100;
						}
					}
				})();

				nodes.sort(function (a, b) {
					return b.value - a.value;
				});

				console.log(nodes);

				vis = d3.select(div)
					.append("svg")
					.attr("width", this.width)
					.attr("height", this.height)
					.attr("id", "svg_vis");

				circles = vis.selectAll("circle")
					.data(nodes, function (d) {
						return d.id;
					})
					.enter().append("circle")
							.attr("r", 0)
							.attr("fill", function (d) {
									return fill_color(d.group);
							})
							.attr("stroke-width", 2)
							.attr("stroke",function (d) {
									console.log("circles entered");
									return d3.rgb(fill_color(d.group)).darker();
							})
							.attr("id", function (d) {
								return "bubble_" + d.id;
							});
				circles.transition()
					.duration(function (d) { return Math.random() * 300 })
					.delay( 300 )
					//.delay(function (d) { return Math.random() * 1000 })
					.attr("r", function (d) {
						return d.radius
					});

				function charge(d, i) {
					//make charge for each node a function of it's radius
					return -Math.pow(d.radius, 2.0)*Math.PI / 8;
				};

				function move_towards_center(alpha) {
					return (function () {
						return function (d) {
							console.log(d.x);
							d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
							console.log(d.x);
							return d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
						};
					});
				};

				var initialised = false;

				force = d3.layout.force()
					.nodes(nodes)
					.size([this.width, this.height])
					.gravity(layout_gravity)
					.charge(charge)
					.friction(0.9)
					.on("tick", function (e) {
						var alpha = e.alpha;

						circles
							.attr("cx", function (d, i) {
								//update the radius, in response to the transition, for the charge calc
								d.radius = parseInt(d3.select(this).attr("r"))
								return d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;;
							})
							.attr("cy", function (d) {
								return d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
							});

						if (nodes.deltaR()) {
							force.charge(charge);
							force.start();
						}

					});
				force.start() //x, y are correctly set when this line is commented out but then force layout is not displayed
				function display_group_all() {
					force.gravity(layout_gravity)
					 .charge(charge(d))
					 .friction(0.9)
					 .on("tick", (function () {
					 	return function (e) {

					 		return circles.each(move_towards_center(e.alpha))
													.attr("cx", function (d) {

														return d.x;
													})
													.attr("cy", function (d) {
														return d.y;
													});
					 	};
					 })());
					force.start();
				}
			} /*generate*/
			if (this.data && this.data.length) {
				this.generate();
			}
			else AJAX(options.data, this);

		}	/*Bubble_Force*/
		return Bubble_Force;

		function AJAX(uri, cons) {
			$.ajax({
				url: uri,
				type: 'GET',
				//dataType: 'json',
				async: false,
				error: function (jqXHR, textStatus, errorThrown) {
					alert(uri);
				}
			}).done(function (csvdata) {
				var data = d3.csv.parse(csvdata)
				cons.data = data;
				cons.generate();

			}).fail(function (jqXHR, textStatus, errorThrown) {
				alert(uri);
			});

		}
	})();

	var bf = new DD3.Bubble_Force({
		element: d3.select('body').append("div").attr("id", "viz").node(), data: "gates_money.csv",
		width: 900,
		height: 900
	});

}).call(this);

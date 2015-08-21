window.onload = function () {
	var dataset = [],
		i = 0;

	for (i = 0; i < 5; i++) {
		dataset.push(Math.round(Math.random() * 100));
	}

	d3.selection.prototype.moveToFront = function () {
		var type = d3.event.type, selection = this,
				e = selection.node()['__on' + type], c = e.$,
				l = selection.on(type)

		selection.on(type, null)

		selection = this.each(function () {
			this.parentNode.appendChild(this)
		});

		window.setTimeout(function () {
			console.log('**reset**' + '\t' + type + '\t' + selection.datum() )
			selection.on(type, l, c)
		}, 10)
		return selection

	};

	d3.selection.prototype.moveToFront2 = function () {
		var event = d3.event, type = event && event.type,
				l = event.currentTarget['__on' + type], c = l.$

		this.each(function () {
			var n = this

			n.removeEventListener(type, l, c)
			console.log('>>removed<<' + '\t' + type + '\t' + n.__data__)

			n = n.parentNode.appendChild(n)

			window.setTimeout(function () {
				console.log('<<added>>' + '\t' + type + '\t' + n.__data__)
				n.addEventListener(type, l, c)
			}, 10)
		});

		return this

	};
	d3.selection.prototype.moveToFront3 = function () {
		this.each(function () {
			this.parentNode.appendChild(this)
		})
		return this
	};
	d3.selection.prototype.moveToFront4 = function () {
		//from parent listener
		var event = d3.event, type = event && event.type,
				l = event.currentTarget['__on' + type], c = l && l.$
		if (!l) return this
		this.each(function () {
			var n = this

			n.removeEventListener(type, l, c)
			console.log('>>removed<<' + '\t' + type + '\t' + n.__data__)

			n = n.parentNode.appendChild(n)

			window.setTimeout(function () {
				console.log('<<added>>' + '\t' + type + '\t' + n.__data__)
				n.addEventListener(type, l, c)
			}, 10)
		});

		return this

	};

	var sampleSVG = d3.select("#viz")
			.append("svg")
			.attr('id', 'svg')
			.attr('stroke', 'black')
			.attr('style','outline:solid red 1px;')
			.attr("width", 1000)
			.attr("height", 200),
			//.on("mouseover", listener)
			//.on("mouseout", listener),

	circles = sampleSVG.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.style("stroke", "gray")
			.style("fill", "white")
			.attr("r", 40)
			.attr("cx", function (d, i) { return i * 80 + 50 })
			.attr("cy", 70)
			
	circles.on("mouseover", (function () {
		var prevNode, interlock = '__onmouseout';
				return function (d) {
					if (prevNode && !(prevNode === this)
							&& prevNode.__onmouseover.___active___) {
						console.log('***collision***\tmouseover\t' + d)
						prevNode[interlock] && prevNode[interlock]()
					}

					prevNode = this
					prevNode.__onmouseover.___active___ = true

					if (!activeTransition(this).length) {
						console.log('mouseover\t\t' + d)
						d3.select(this)
							.style("fill", "aliceblue")
							.attr("r", 50)
							.moveToFront2() 
					} else {
						console.log('******mouseOver active transition******')
					}
				}
			})())
			.on("mouseout", function (d) {
				var interlock = '__onmouseover';
				console.log('mouseout\t\t' + d);
				if (!activeTransition(this).length) {
					if (this[interlock]) {
						this[interlock].___active___ = false
					}
					d3.select(this)
						.style("fill", "white")
						.attr("r", 40);
				}
			})
			.on("mousedown", animateFirstStep)

	sampleSVG.selectAll("text")
			.data(dataset)
			.enter().append("text")
			.attr("x", function (d, i) { return i * 80 + 50 })
			.attr("y", 150)
			.attr("text-anchor", "center")
			.text(function (d) { return d })
			.style("stroke", "black")
			.style("color", "black");

	

	function animateFirstStep() {
		d3.select(this)
			.transition('phase1')
				.delay(0)
				.duration(1000)
				.attr("r", 10)
				.each("end", animateSecondStep);
	};

	function animateSecondStep() {
		d3.select(this)
			.transition('phase2')
				.duration(1000)
				.attr("r", 40);
	};
	
	//[].slice.call(document.querySelectorAll('circle')).forEach(function(e,i,a) {
	//	e.addEventListener('mouseout', function (e) {
	//		console.log('circle mouseout, target: ' + e.target.id)
	//	}, false)
	//})

	//document.getElementById('svg').addEventListener('mouseout', function (e) {
	//	console.log('svg mouseout, target: ' + e.target.id)
	//}, false)

	//document.getElementById('svg-test').addEventListener('mouseout', function (e) {
	//	console.log('svg-test mouseout, target: ' + e.target.id)
		//alert('svg-test mouseout, target: ' + e.target.id)
	//}, false)

	//document.getElementById('svg-test').addEventListener('mouseover', listener, false)
	//document.getElementById('svg-test').addEventListener('mouseout', listener, false)

	d3.select('#svg-test')
			.on("mouseover", function () {
				console.log('**************************svg-test mouseover')
			})
			.on("mouseout", function () {
				console.log('**************************svg-test mouseout')
			})
	function listener(e) {
		e = e || d3.event;
		var source = e.currentTarget, l = arguments.callee
		console.log(e.type + ': ' + e.target.tagName + ' ---> ' + e.currentTarget.id)
		source.removeEventListener(e.type, l, false)
		source.parentNode.appendChild(source)

		window.setTimeout(function () {
			source.addEventListener(e.type, l, false)
		}, 10)
	}
	function activeTransition(node) {

		return getTransitions(node).map(function (e, i, a) {
			return { name: e.name, active: e.transition.active }
		}).filter(function (e, i, a) {
			return e.active
		})

		function getTransitions(node, ns) {
			var pattern = new RegExp(ns ? '__transition_(' + ns + '.*?)__' : '__transition_(\\w+?)__', 'g'),
				matches, transitions = [], s = Object.keys(node).join("")
			//collect the transition keys if any
			while (matches = pattern.exec(s)) {
				transitions.push({ name: matches[1], transition: node[matches[0]] })
			}
			return transitions

		} /*getTransitions*/
	} /*activeTransition*/
}

//Start example: http://mbostock.github.io/d3/talk/20111018/area-gradient.html

function parseDate(unix_timestamp){return new Date(unix_timestamp*1000);}
var svg, m, w, h, x, y, xAxis, yAxis, area, line, gradient, margin, varData,
//parseDate = d3.time.format('%Y-%m-%d').parse,
format = d3.time.format('%Y')

function CreateSvg()
{
	margin = {top: 79, right: 80, bottom: 160, left: 79};
	//m = [79, 80, 160, 79];
    w = 1280 - margin.right - margin.left;
    h = 800 - margin.top - margin.bottom;
    
	//Scales. Note the inverted domain for the y-scale: bigger is up!
	x = d3.time.scale().range([0, w]);
    y = d3.scale.linear().range([h, 0]);
    xAxis = d3.svg.axis().scale(x).orient('bottom').tickPadding(6).tickFormat(d3.time.format('%Y/%m/%d %H:%M:%S')).ticks(30); //.tickSize(-h, 0)
    yAxis = d3.svg.axis().scale(y).orient('left').tickSize(w).tickPadding(6);

	area = d3.svg.area()
		.interpolate('step-after')
		.x(function(d) { return x(d.date); })
		.y0(y(0))
		.y1(function(d) { return y(d.value); });

	line = d3.svg.line()
		.interpolate('step-after')
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.value); });

	svg = d3.select('#ChartContainer').append('svg:svg')
		.attr('width', w + margin.right + margin.left)
		.attr('height', h + margin.top + margin.bottom)
		.append('svg:g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	gradient = svg.append('svg:defs').append('svg:linearGradient')
		.attr('id', 'gradient')
		.attr('x2', '0%')
		.attr('y2', '100%');

	gradient.append('svg:stop')
		.attr('offset', '40%')
		.attr('stop-color', '#f00')
		.attr('stop-opacity', .5);

	gradient.append('svg:stop')
		.attr('offset', '100%')
		.attr('stop-color', '#0f0')
		.attr('stop-opacity', 1);

	svg.append('svg:clipPath')
		.attr('id', 'clip')
		.append('svg:rect')
		.attr('x', x(0))
		.attr('y', y(1))
		.attr('width', x(1) - x(0))
		.attr('height', y(0) - y(1));

	svg.append('svg:g')
		.attr('class', 'y axis')
		.attr('transform', 'translate(' + w + ',0)');

	svg.append('svg:path')
		.attr('class', 'area')
		.attr('clip-path', 'url(#clip)')
		.style('fill', 'url(#gradient)');

	svg.append('svg:g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,' + h + ')');

	svg.append('svg:path')
		.attr('class', 'line')
		.attr('clip-path', 'url(#clip)');

	svg.append('svg:rect')
		.attr('class', 'pane')
		.attr('width', w)
		.attr('height', h)
		.call(d3.behavior.zoom().on('zoom', zoom));

	svg.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 0-margin.left)
		.attr('x', 0-(h/2))
		.attr('dy', '1em')
		.style('text-anchor', 'middle')
		.text('Noise (dB)');
		
	svg.append('text')
		.attr('y', w/2)
		.attr('x', h)
		.attr('dx', '1em')
		.style('text-anchor', 'middle')
		.text('Time');
}

function CreateData()
{
		//.csv() function is async!
		d3.csv('data-noise-example.csv', function(data)
		{
			data.forEach(function(d) {
				d.date = parseDate(d.date);
				d.value = +d.value;
			});

			//Adds two random data. ''Getting started experimentation code.'
			//data.reverse();
			data.push({date:parseDate(1433160989), value:Math.random() * 180});
			data.push({date:parseDate(1433160990), value:Math.random() * 180});
			data.push({date:parseDate(1433160991), value:179});
			data.push({date:parseDate(1433160992), value:1});
			//data.reverse();
		
			varData = data;
			ReDraw(varData);
		});
}

function ReDrawTest()
{
	varData.push({date:parseDate(1433160993), value:Math.random() * 180});
	varData.push({date:parseDate(1433160994), value:Math.random() * 180});
	ReDraw(varData);
}

function FirstDraw()
{
	CreateData();
	//ReDraw(varData);
}

function ReDraw(data)
{
		y.domain([0, 180]);
		x.domain([parseDate(1433160660), parseDate(1433160780)]);

		//Bind the data to our path elements
		svg.select('path.area').data([data]);
		svg.select('path.line').data([data]);

		var t = svg.select('g.x.axis').call(xAxis).selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');
		t.attr('transform', 'translate(-2,0)').attr('transform', 'rotate(-90)');
			
		svg.select('g.y.axis').call(yAxis);
		svg.select('path.area').attr('d', area);
		svg.select('path.line').attr('d', line); //.on('click', clickPath).on('mouseover', onMouseOverPath);
		//d3.select('#footer span').text('U.S. Commercial Flights, ' + x.domain().map(format).join('-'));
}

/*function clickPath(e){
	console.log('onclickPath', this);
	//console.log('onclickPath', this.attr("d")); 
	var coordinates = d3.mouse(this);
		console.log(coordinates[0],coordinates[1]);
}

function findData(x,y)
{
	var relY = Math.abs(height-y)/height;
	var valY = relY*(chartMaxY-chartMinY);
	return [valY,''];
}

function onMouseOverPath(e){
	var coordinates = d3.mouse(this);
	var x = coordinates[0];
	var y = coordinates[1];
	var coordValue =  'Coord.: x:' + x + ',y:' + y;
	$('#coordValue').text(coordValue);
	//Probably not the cleanest way, but that way gives result ...

	
	//console.log(svg.select('title'));
	//console.log(coordinates[0] + ',' +coordinates[1]);
	var retrievedData = findData(x,y);
	var noiseValue = 'Noise: '+ retrievedData[0]+','+retrievedData[1];
	$('#noiseValue').text(noiseValue);
	
	svg.append('svg:title').text(noiseValue + "\r\n" + coordValue);
	svg.select('title').text(noiseValue + "\r\n" + coordValue);
}

function onMouseOutPath(){alert('mouseOutPath');}
function click() {alert('onclick');}
function onMouseOver(){alert('mouseOver');}
function onMouseOut(){alert('mouseOut');}*/

function zoom() {
  d3.event.transform(x); //TODO d3.behavior.zoom should support extents
  ReDraw(varData);
}

$(document).ready(function() {
	CreateSvg();
	FirstDraw();
});
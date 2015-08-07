var w = 1280 - 80,
		h = 800 - 180;

// Load data
d3.json("demo.json", function (data) {

	//	make a temp object to use treemap behaviour
	var treemap = d3.layout.treemap()
			.sticky(true)
			.value(function (d) { return d.size; }),
	//	cache original data
			tempData = $.extend(true, {}, data),

	// Trim original data using temp data
			tempNodesData = treemap.nodes(tempData),
			total_value = tempNodesData[0].value,

			categories = tempNodesData
			.filter(function (d) { return d.depth == 1; }),

			n = 10; //This is the maximum number of leaves I want to have

	categories.forEach(function (vertex, i, categories) {
		var num_children = vertex.children.length,
				percentage_screen = num_children / total_value,
				max_leaves = Math.max(1, Math.floor(n * percentage_screen));

		data.children[i].children = vertex.children.slice(0,max_leaves)
	})

	// re-Declare treemap
	var treemap = d3.layout.treemap()
			.round(false)
			.size([w, h])
			.sticky(true)
			.value(function (d) { return d.size; }),

	// Here I try to get a list of the leaves       
			nodes = treemap.nodes(data)
						.filter(function(d) { return !d.children; });

	// This print statement prints 20, the original number of leaves
	alert('nodes.length: ' + nodes.length + '\n' + 'recursive_node_counter: ' + recursive_node_counter(data));
	d3.select('body').insert('div', 'script').attr('class', 'logWindow').style({'color': 'red;'})
	.html('nodes.length: ' + nodes.length + '</br>' + 'recursive_node_counter: ' + recursive_node_counter(data));

});

function recursive_node_counter(d){
	if('children' in d){
		var num_child = 0;
		
		d.children.forEach( function(child){
				num_child += recursive_node_counter(child);
		})
	return num_child;
} else {
						return 1
}
};

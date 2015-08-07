var w = 1280 - 80,
		h = 800 - 180;

// Load data
d3.json("demo.json", function(data) {   

	//	make a temp object to use treemap behaviour
	var treemap = d3.layout.treemap()
			.sticky(true)
			.value(function (d) { return d.size; }),
	//	cache original data
			tempData = $.extend(true, {}, data),

	// Trim data 
			categories = treemap.nodes(tempData)
			categories = categories.filter(function (d) { return d.depth == 1; }),

			n = 10, //This is the maximum number of leaves I want to have
			tempNodesData = treemap.nodes(tempData),
			total_value = tempNodesData[0].value;
	
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
			.value(function (d) { return d.size; });


	// Here I try to get a list of the leaves       
		var nodes = treemap.nodes(data)
						.filter(function(d) { return !d.children; });

// This print statement prints 20, the original number of leaves
console.log(nodes.length);
// But if I recursively count the number of leaves, I get the new smaller number, 10
console.log(recursive_node_counter(data));
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

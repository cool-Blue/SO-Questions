## Using D3 transitions as timers
This example animates a force directed graph by automating drag on multiple nodes.  Random target positions are generated with random transition times with zero delay between steps.  

This is implemented by transitioning the bound data and then positioning nodes in the force tick callback as usual.  The data is transitioned using d3 transitions on privately namespaced dummy nodes.

### Using a transition on dummy node as a timer

 1. Create a dummy node with an exclusive namespace (so it won't be rendered) and put a transition on it.
 1. Define getters for px and py on the chosen data element, to transparently hook up with the transition, by returning the fake cx and cy attributes of the dummy node while they are transitioning.
 1. Call dragstart on the selected node.
 1. On the end event of the transition, clean up by replacing the getters with the current value of the dummy node attributes.
 1. Wrap this structure in a d3 selection so that it can be generalised to an arbitrary subset of the nodes.
 1. Use the javascript Array.prototype.reduce method to chain an arbitrary number of transitions.
function searchNeighbors() {
    //initialize variables, would be input otherwise
    var explored = [false, false, false, false];
    var n1 = [1,1,4];
    var n2 = [1,2,3];
    var n3 = [1,2,3];
    var n4 = [4,2,2];
    var graph = [n1,n2,n3,n4];

    //begin graph search
    var stack = [];
    stack.push(graph[0]);
    explored[0] = true; 
    //keep going until everything is explored once
    while (stack.length > 0) {
        var node = stack.pop();
        //find the closest neighbor, should be someone to the left or right
        var min = Math.min.apply(null, node);
        console.log("Min "+min);

        //find the node with close to the same distance measurement
        var closestDist = -1;
        var closest = -1;
        var closestNeighborIndex = -1;
        for (var k = 0; k < graph.length; k++) {
            if (explored[k] == false) {
                neighbor = graph[k];
                for (var j = 0; j < neighbor.length; j++) {
                    //neighbor with a very close measurement is most likely to be the right neighbor node
                    var dist = Math.abs((neighbor[j]-min));
                    if (closestDist == -1) {
                        closestDist = dist;
                        console.log("Dist "+dist);
                        closest = j;
                        closestNeighborIndex = k;
                        console.log("close neighbor closest " + graph[closestNeighborIndex][closest]);
                    }
                    else if (dist < closestDist) {
                        closestDist = dist;
                        console.log("Dist "+dist);
                        closest = j;
                        closestNeighborIndex = k;
                        console.log("close neighbor closest " + graph[closestNeighborIndex][closest]);
                    }
                }
            }
        }
        console.log("close neighbor " + closestNeighborIndex);
        console.log("close neighbor closest " + graph[closestNeighborIndex][closest]);
        graph[closestNeighborIndex].splice(closest, 1);
        explored[closestNeighborIndex] = true;
        stack.push(graph[closestNeighborIndex]);
    }
}

searchNeighbors();
var piePieceMap = [];

function setupPiePieces(angles) {
    //copy the array for good measure
    //go through the array
    for (var i = 0; i < angles.length; i++) {
        var me = i;
        var toSort = [];
        for (var j = 0; j < angles.length; j++) {
            if (j != me) {
                var difference = angles[j] - angles[me];
                if (difference < 0) {
                    difference += 360;
                }
                toSort.push({ name: j, value: difference});
            }
        }
        toSort.sort(custom_compare).reverse();
        var array = toSort.slice(0);
        piePieceMap.push(array);
    }
}

function custom_compare (a,b) {
  return a.value - b.value;
}

function printPiePieceMap() {
    for (var i = 0; i < piePieceMap.length; i++) {
        console.log(i+": ");
        for (var j = 0; j < piePieceMap[i].length; j++) {
            console.log(piePieceMap[i][j].name+"   "+piePieceMap[i][j].value);
        }
    }
}

// console.log("Unit testing pie piece mapper");
// var angles = [143,68,350,328,208];
// setupPiePieces(angles);
// printPiePieceMap();

//to reference!
// SEND_TO_ID = piePieceMap[ID][PIE_PIECE].name;

function genConnectedDevices(idTable) {
    var array = [];

    var explored = [];
    if (idTable.length > 0) {
        for (var i = 0; i < idTable.length; i++) {
            var connectedComponent = [];
            var idStack = [];
            var iPhone = idTable[i];
            if (explored.indexOf(iPhone.id) == -1) {
                idStack.push(iPhone.id);
                explored.push(iPhone.id);
                while (idStack.length > 0) {
                    var currentId = idStack.pop();
                    //add the current id to the connected component
                    connectedComponent.push(currentId);

                    var iPhone = findiPhone(idTable, currentId);
                    // console.log(iPhone.see[1]);
                    for (var j = 0; j < iPhone.see.length; j++) {
                        if (explored.indexOf(iPhone.see[j]) == -1) {
                            // console.log(iPhone.see[j]);
                            idStack.push(iPhone.see[j]);
                            explored.push(iPhone.see[j]);
                        }
                    }
                }
            }
            if (connectedComponent.length > 0) {
                array.push(connectedComponent);
            }
        }
    }
    return array;
}

function findiPhone(idTable, id) {
    for (var i = idTable.length - 1; i >= 0; i--) {
        if (idTable[i].id == id) {
            return idTable[i];
        }
    }
    return {id: id, see:[]};
}

function printIdArray(array) {
    for (var i = 0; i < array.length; i++) {
        var list = array[i];
        console.log(list);
    }
}


//unit test for genConnectedDevices:
var idTable = [
    {id: 1, see:[2,3,4]},
    {id: 2, see:[1,3]},
    {id: 4, see:[6,7]},
    {id: 3, see:[4,7]},
];

printIdArray(genConnectedDevices(idTable));




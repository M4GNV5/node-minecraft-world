var fs = require("fs");
var nbt = require("./../src/nbt.js");

var data = {
    rootName: "nbt example",
    root: {string: "example value", byte: 42, short: 3112, int: 666, float: 3.1415, compound: {foo: "bar"}, byteArray: [1, 2, 3], list: [4, 5, 6]}
};
var schema = {
    string: 8,
    byte: 1,
    short: 2,
    int: 3,
    float: 5,
    compound: {foo: 8},
    byteArray: 7,
    list: [2],
}

nbt.write(data, schema, function(err, buff)
{
    if(err)
        throw err;

    fs.writeFileSync("./example.nbt", buff);

    console.log("have a look at example.nbt now using NBTExplorer etc.");
});

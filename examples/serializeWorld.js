var fs = require("fs");
var nbt = require("./../src/nbt.js");

nbt.read("./level_raw.dat", function(err, data)
{
    if(err)
    {
        console.log(err.toString());
        return;
    }

    data.root.Data.LevelName = "I WAS HERE";

    nbt.write(data, data.schema, function(err, buff)
    {
        fs.writeFileSync("./level.dat", buff);

        console.log("have a look at level.dat now using NBTExplorer etc. or copy it into a minecraft world folder and look at the world name ingame");
    });
});

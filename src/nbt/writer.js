var tags = require("./tags.js");

module.exports = function(data, schema, callback)
{
    new Writer(data, schema, callback);
};

function createWriter(bufferFunc, size)
{
    return function(value)
    {
        var buff = new Buffer(size);
        buff[bufferFunc](value, 0);
        this.buffer.push(buff);
    };
}

function schemaToType(schema)
{
    if(typeof schema == "number")
    {
        return schema;
    }
    else if(schema instanceof Array)
    {
        if(schema[0] === tags.indexOf("byte"))
            return tags.indexof("byteArray");
        else if(schema[0] === tags.indexOf("int"))
            return tags.indexof("intArray");
        else
            return tags.indexOf("list");
    }
    else if(typeof schema == "object")
    {
        return tags.indexOf("compound");
    }
}

var Writer = function(data, schema, cb)
{
    this.buffer = [];

    this.byte(10);
    this.string(data.rootName);
    this.compound(data.root, schema);

    var buff = Buffer.concat(this.buffer);

    if(schema.zipped)
    {
        zlib.gzip(buff, function(err, compressed)
        {
            cb(err, compressed);
        });
    }
    else
    {
        cb(undefined, buff);
    }
}

Writer.prototype.byte = createWriter("writeInt8", 1);
Writer.prototype.short = createWriter("writeInt16BE", 2);
Writer.prototype.int = createWriter("writeInt32BE", 4);
Writer.prototype.float = createWriter("writeFloatBE", 4);
Writer.prototype.double = createWriter("writeDoubleBE", 8);

Writer.prototype.end = function()
{
    this.byte(0);
}
Writer.prototype.long = function(val)
{
    this.int(val.left);
    this.int(val.right);
}
Writer.prototype.byteArray = function(val)
{
    this.int(val.length);
    for(var i = 0; i < val.length; i++)
    {
        this.byte(val[i]);
    }
}
Writer.prototype.string = function(val)
{
    this.short(val.length);
    this.buffer.push(new Buffer(val, "utf8"));
}
Writer.prototype.list = function(val, schema)
{
    var type = schemaToType(schema[0]);
    this.byte(type);
    this.int(val.length);
    for(var i = 0; i < val.length; i++)
    {
        this[tags[type]](val[i], schema[i]);
    }
}
Writer.prototype.compound = function(val, schema)
{
    for(var key in schema)
    {
        if(!val.hasOwnProperty(key))
            continue;

        var type = schemaToType(schema[key]);
        this.byte(type);
        this.string(key);
        this[tags[type]](val[key], schema[key]);
    }
    this.byte(tags.indexOf("end"));
}
Writer.prototype.intArray = function(val)
{
    this.int(val.length)
    for(var i = 0; i < val.length; i++)
    {
        this.int(val[i]);
    }
}

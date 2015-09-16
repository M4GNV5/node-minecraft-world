var fs = require("fs");
var zlib = require("zlib");
var Long = require("./long.js");
var tags = require("./tags.js");

module.exports = function(mixed, cb)
{
    if(mixed instanceof Buffer)
    {
        new Reader(mixed, cb);
    }
    else if(typeof mixed == "string")
    {
        fs.readFile(mixed, function(err, data)
        {
            if(err)
                cb(err);
            else
                new Reader(data, cb);
        });
    }
}

function createReader(bufferFunc, size)
{
    return function()
    {
        var value = this.buffer[bufferFunc](this.offset);
        this.offset += size;
        return value;
    };
}

var Reader = function(buff, cb)
{
    this.offset = 0;

    if(buff[0] == 0x1f && buff[1] == 0x8b)
    {
        var that = this;
        zlib.gunzip(buff, function(err, unzipped)
        {
            if(err)
                cb(err);
            else
                that.read(unzipped, cb);
        });
    }
    else
    {
        this.read(buff, cb);
    }
};

Reader.prototype.read = function(buffer, cb)
{
    this.buffer = buffer;

    var type = this.byte();

    if(type != tags.indexOf("compound"))
    {
        cb("Error: root tag of NBT structure must be compound");
        return;
    }

    var name = this.string();
    var result = {};
    result.root = this.compound();
    result.rootName = name;
    result.schema = result.root._schema || tags.indexOf("compound");
    delete result.root._schema;

    cb(undefined, result);
}

Reader.prototype.byte = createReader("readInt8", 1);
Reader.prototype.short = createReader("readInt16BE", 2);
Reader.prototype.int = createReader("readInt32BE", 4);
Reader.prototype.float = createReader("readFloatBE", 4);
Reader.prototype.double = createReader("readDoubleBE", 8);

Reader.prototype.end = function()
{
    throw "Unexpected tag end";
}
Reader.prototype.long = function()
{
    var left = this.int();
    var right = this.int();
    return new Long(left, right);
}
Reader.prototype.byteArray = function()
{
    var values = [];
    var length = this.int();
    for(var i = 0; i < length; i++)
    {
        values.push(this.byte());
    }
    return values;
}
Reader.prototype.string = function()
{
    var length = this.short();
    this.offset += length;
    return this.buffer.toString("utf8", this.offset - length, this.offset);
}
Reader.prototype.list = function()
{
    var values = [];
    var schema = [];

    var type = this.byte();
    var length = this.int();
    for(var i = 0; i < length; i++)
    {
        var val = this[tags[type]]();
        values.push(val);

        if(val._schema)
        {
            schema.push(val._schema);
            delete val._schema;
        }
        else
        {
            schema.push(type);
        }
    }

    if(length == 0)
        schema[0] = type;

    values._schema = schema;

    return values;
}
Reader.prototype.compound = function()
{
    var value = {};
    var schema = {};

    for(var type = this.byte(); type != tags.indexOf("end"); type = this.byte())
    {
        var name = this.string();
        var val = this[tags[type]]();

        value[name] = val;

        if(val._schema)
        {
            schema[name] = val._schema;
            delete val._schema;
        }
        else
        {
            schema[name] = type;
        }
    }

    value._schema = schema;

    return value;
}
Reader.prototype.intArray = function()
{
    var values = [];
    var length = this.int();
    for(var i = 0; i < length; i++)
    {
        values.push(this.int());
    }
    return values;
}

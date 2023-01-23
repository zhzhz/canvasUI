function newReader(file)
{
    let reader = {};
    let index = 0;

    reader.checkHeader = function ()
    {
        //直接掉过头部
        index += 33;
    }

    reader.readByte = function ()
    {
        //返回一个字节数据
        return file[index++];
    }

    reader.readBytes = function (n)
    {
        //返回多个字节数据
        let buffer = file.slice(index, index + n);
        index += n;
        return buffer;
    }

    reader.readUint64 = function ()
    {
        //返回8个字节数据
        let buffer = new ArrayBuffer(8);
        let dataview = new DataView(buffer);

        for (let i = 0; i < 8; i++)
        {
            dataview.setUint8(i, file[index++]);
        }

        return dataview.getBigUint64(0, true);
    }

    reader.readInt64 = function ()
    {
        //返回8个字节数据
        let buffer = new ArrayBuffer(8);
        let dataview = new DataView(buffer);

        for (let i = 0; i < 8; i++)
        {
            dataview.setInt8(i, file[index++]);
        }

        return dataview.getBigInt64(0, true);
    }

    reader.readUint32 = function ()
    {
        //返回8个字节数据
        let buffer = new ArrayBuffer(4);
        let dataview = new DataView(buffer);

        for (let i = 0; i < 4; i++)
        {
            dataview.setUint8(i, file[index++]);
        }

        let buf = dataview.getUint32(0, true);
        return buf;
    }

    function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    reader.readString = function ()
    {
        //返回字符串
        let size = reader.readByte();
        if (size == 0)
        {
            return "";
        }
            
        if (size == 0xff)
        {
            size = reader.readUint64();
        }
        let buf = ab2str(reader.readBytes(size - 1));
        return buf;
    }

    

    reader.readCode = function ()
    {
        //首先读取代码长度
        let codes = [];
        let length = reader.readUint32();
        for (let i = 0; i < length; i++)
        {
            codes.push(reader.readUint32());
        }
        
        return codes;
    }

    reader.readLuaInteger = function ()
    {
        return Number(reader.readInt64());
    }

    reader.readLuaNumber = function ()
    {
        return Number(reader.readInt64());
    }

    reader.readConstants = function ()
    {
        let length = reader.readUint32();
        let buf = [];

        for (let i = 0; i < length; i++)
        {
            buf.push(reader.readConstant());
        }

        return buf;
    }

    reader.readConstant = function ()
    {
        //读取常量表数据
        const TAG_NIL = 0x0;
        const TAG_BOOLEAN = 0x1;
        const TAG_NUMBER = 0x3;
        const TAG_INTEGER = 0x13;
        const TAG_SHORT_STR = 0x4;
        const TAG_LONG_STR = 0x14;

        switch (reader.readByte())
        {
            case TAG_NIL:
                return null;
                break;

            case TAG_BOOLEAN:
                return reader.readByte() != 0;
                break; 

            case TAG_NUMBER:
                return reader.readLuaNumber();
                break; 

            case TAG_INTEGER:
                return reader.readLuaInteger();
                break;

            case TAG_SHORT_STR:
                return reader.readString();
                break; 

            case TAG_LONG_STR:
                return reader.readString();
                break;

            default:
                throw "readConstants error";
        }
    }

    reader.readUpvalues = function ()
    {
        let upvalues = [];
        let length = reader.readUint32();

        for (let i = 0; i < length; i++)
        {
            upvalues.push(
            {
                Instack : reader.readByte(),
                Idx : reader.readByte()
            });
        }

        return upvalues;
    }

    reader.readProtos = function (parentSource)
    {
        let protos = [];
        let length = reader.readUint32();

        for (let i = 0; i < length; i++)
        {
            protos.push(reader.readProto(parentSource));
        }

        return protos;
    }

    reader.readLineInfo = function ()
    {
        let lineInfo = [];
        let length = reader.readUint32();

        for (let i = 0; i < length; i++)
        {
            lineInfo.push(reader.readUint32());
        }

        return lineInfo;
    }

    reader.readLocVars = function ()
    {
        let locVars = [];
        let length = reader.readUint32();

        for (let i = 0; i < length; i++)
        {
            locVars.push(
                {
                    VarName : reader.readString(),
                    StartPc : reader.readUint32(),
                    EndPc : reader.readUint32()
                }
            );
        }

        return locVars;
    }

    reader.readUpvalueNames = function ()
    {
        let names = [];
        let length = reader.readUint32();

        for (let i = 0; i < length; i++)
        {
            names.push(reader.readString());
        }

        return names;
    }

    reader.readProto = function (parentSource)
    {
        let source = reader.readString();
        if (source == "")
        {
            source = parentSource;
        }

        return {
            Source : source,
            LineDefined : reader.readUint32(),
            LastLineDefined : reader.readUint32(),
            NumParams : reader.readByte(),
            IsVararg : reader.readByte(),
            MaxStackSize : reader.readByte(),
            Code : reader.readCode(),
            Constants : reader.readConstants(),
            Upvalues : reader.readUpvalues(),
            Protos : reader.readProtos(source),
            LineInfo : reader.readLineInfo(),
            LocVars : reader.readLocVars(),
            UpvalueNames : reader.readUpvalueNames()
        };
    }

    return reader;
}

function unDump(file)
{
    let reader = newReader(file);

    reader.checkHeader();
    reader.readByte();

    return reader.readProto("");
}


//打印输出获得的信息
function list(proto)
{
    printCode(proto);
}

const OpArgN = 0;
const OpArgU = 1;
const OpArgR = 2;
const OpArgK = 3;

const IABC = 0;
const IABx = 1;
const IAsBx = 2;
const IAx = 3;


let opCodes = [];

const OP_GETTABUP = 0x6;
const OP_LOADK = 0x1;
const OP_CALL = 0x24;
const OP_RETURN = 0x26;
const OP_ADD = 0xd;
const OP_TEST = 0x22;
const OP_JMP = 0x1e;
const OP_CLOSURE = 0x2c;
const OP_SETTABUP = 0x08;
const OP_EQ = 0x1f;

const OP_LE = 0x21;
const OP_LT = 0x20;

const OP_LOADBOOL = 0x3;
const OP_MOVE = 0x0;

const OP_GETUPVAL = 0x05;

const OP_LOADNIL =  0x04;

const OP_GETTABLE = 0x07;

const OP_NEWTABLE = 0x0b;

const OP_SETTABLE = 0x0a;

const OP_SETLIST = 0x2b;

const OP_FORPREP = 0x28;

const OP_FORLOOP = 0x27;

const OP_TFORCALL = 0x29;
const OP_TFORLOOP = 0x2a;

const OP_SETUPVAL = 0x09;

const OP_SELF = 0x0c;

const OP_TESTSET = 0x23;


opCodes[OP_GETTABUP] = getOpInfo(0, 1, OpArgU, OpArgK, IABC, "GETTABUP", _getTabUp);
opCodes[OP_LOADK] = getOpInfo(0, 1, OpArgK, OpArgN, IABx, "LOADK", _loadK);
opCodes[OP_CALL] = getOpInfo(0, 1, OpArgU, OpArgU, IABC, "CALL", _call);
opCodes[OP_RETURN] = getOpInfo(0, 0, OpArgU, OpArgN, IABC, "RETURN", _return);
opCodes[OP_ADD] = getOpInfo(0, 1, OpArgK, OpArgK, IABC, "ADD", _add);
opCodes[OP_TEST] = getOpInfo(1, 0, OpArgN, OpArgU, IABC, "TEST", _test);
opCodes[OP_JMP] = getOpInfo(0, 0, OpArgR, OpArgN, IAsBx, "JMP", _jmp);
opCodes[OP_CLOSURE] = getOpInfo(0, 1, OpArgU, OpArgN, IABx, "CLOSURE", _closure);
opCodes[OP_SETTABUP] = getOpInfo(0, 0, OpArgK, OpArgK, IABC, "SETTABUP", _settabup);
opCodes[OP_EQ] = getOpInfo(1, 0, OpArgK, OpArgK, IABC, "EQ", _eq);

opCodes[OP_LOADBOOL] = getOpInfo(1, 0, OpArgU, OpArgU, IABC, "LOADBOOL", _loadBool);
opCodes[OP_MOVE] = getOpInfo(0, 1, OpArgR, OpArgN, IABC, "MOVE", _move);

opCodes[OP_GETUPVAL] = getOpInfo(0, 1, OpArgU, OpArgN, IABC, "GETUPVAL", _getUpval);

opCodes[OP_LOADNIL] = getOpInfo(0, 1, OpArgU, OpArgN, IABC, "LOADNIL", _loadNil);

opCodes[OP_GETTABLE] = getOpInfo(0, 1, OpArgR, OpArgK, IABC, "GETTABLE", _getTable);

opCodes[OP_NEWTABLE] = getOpInfo(0, 1, OpArgU, OpArgU, IABC, "NEWTABLE", _newTable);

opCodes[OP_SETTABLE] = getOpInfo(0, 0, OpArgK, OpArgK, IABC, "SETTABLE", _setTable);

opCodes[OP_SETLIST] = getOpInfo(0, 0, OpArgU, OpArgU, IABC, "SETLIST", _setlist);

opCodes[OP_FORPREP] = getOpInfo(0, 1, OpArgR, OpArgN, IAsBx, "FORPREP", _forprep);
opCodes[OP_FORLOOP] = getOpInfo(0, 1, OpArgR, OpArgN, IAsBx, "FORLOOP", _forloop);

opCodes[OP_FORLOOP] = getOpInfo(0, 1, OpArgR, OpArgN, IAsBx, "FORLOOP", _forloop);

opCodes[OP_LE] = getOpInfo(1, 0, OpArgK, OpArgK, IABC, "LE", _le);
opCodes[OP_LT] = getOpInfo(1, 0, OpArgK, OpArgK, IABC, "LT", _lt);

opCodes[OP_TFORCALL] = getOpInfo(0, 0, OpArgN, OpArgU, IABC, "TFORCALL", _tForCall);
opCodes[OP_TFORLOOP] = getOpInfo(0, 1, OpArgR, OpArgN, IAsBx, "TFORLOOP", _tForLoop);

opCodes[OP_SETUPVAL] = getOpInfo(0, 0, OpArgU, OpArgN, IABC, "SETUPVAL", _setUpVal);

opCodes[OP_SELF] = getOpInfo(0, 1, OpArgR, OpArgK, IABC, "SELF", _self);

opCodes[OP_TESTSET] = getOpInfo(1, 1, OpArgR, OpArgU, IABC, "TESTSET", _testSet);


const LUAI_MAXSTACK = 1000000;
const LUA_REGISTRYINDEX = -LUAI_MAXSTACK - 1000;

function luaUpvalueIndex(i)
{
    return LUA_REGISTRYINDEX - i;
}

function _pushFuncAndArgs(a, b, ls)
{
    if (b >= 1)
    {
        //ls.checkStack(b)
        for (let i = a; i < a+b; i++)
        {
            //console.log("_pushFuncAndArgs", ls.stack.slots[i]);
            ls.pushValue(i);//压入函数和函数参数
        }

        return b - 1;
    }
    else
    {
        throw "_pushFuncAndArgs error";
    }
}

function _popResults(a, c, ls)
{
    if (c == 1)
    {
        //无动作
    }
    else if (c > 1)
    {
        for (let i = a + c - 2; i >= a; i--)
        {
            ls.replace(i);
        }
    }
    else
    {
        throw "_popResults == 0 error";
    }
}

function _getTabUp(inst, ls)
{
    //console.log("_getTabUp");
    let i = inst.abc();

    let a = i.a + 1;
    let b = i.b + 1;
    let c = i.c;

    //console.log(a,b,c);

    ls.getRK(c);//得到key
    ls.getTable(luaUpvalueIndex(b));//得到全局表
    ls.replace(a);
}

function _loadK(inst, ls)
{
    let i = inst.abx();
    let a = i.a + 1;
    let bx = i.bx;

    ls.getConst(bx);
    ls.replace(a);
}

function _call(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    let nArgs = _pushFuncAndArgs(a, b, ls);
    //console.log("nArgs", nArgs);
    ls.call(nArgs, c-1);
    _popResults(a, c, ls);
}

function _return(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;

    if (b == 1)
    {
        //无返回值，什么也不做
    }
    else if (b > 1)
    {
        //有b-1个参数
        //ls.checkStack(b-1);
        for (let j = a; j <= a + b - 2; j++)
        {
            ls.pushValue(j);
        }
    }
    else
    {
        throw "_return error";
    }

    //关闭局部变量

}

const LUA_OPADD = 0;
const LUA_OPSUB = 1;

function _binaryArith(inst, ls, op)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    ls.getRK(b);
    ls.getRK(c);
    ls.arith(op);
    ls.replace(a);
}

function _add(inst, ls)
{
    _binaryArith(inst, ls, LUA_OPADD);
}

function _test(inst, ls)
{
    //console.log("_test");
    let i = inst.abc();

    let a = i.a + 1;
    let c = i.c;

    if (ls.toBoolean(a) != (c != 0))
    {
        ls.addPC(1);
    }
}

function _jmp(inst, ls)
{
    let i = inst.asbx();
    let a = i.a;
    let sbx = i.sbx;

    ls.addPC(sbx);
    if (a != 0)
    {
        ls.closeUpvalues(a);
    }
}

function _closure(inst, ls)
{
    //console.log("_closure");
    let i = inst.abx();

    let a = i.a + 1;
    let bx = i.bx;

    ls.loadProto(bx);
    ls.replace(a);
}

function _settabup(inst, ls)
{
    //console.log("_settabup");
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    ls.getRK(b);
    ls.getRK(c);
    ls.setTable_(luaUpvalueIndex(a));
}

const LUA_OPEQ = 0;//==
const LUA_OPLE = 1;//<=
const LUA_OPLT = 2;//<

function _eq(inst, ls)
{
    //console.log("_eq");
    _compare(inst, ls, LUA_OPEQ);
}

function _loadBool(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    ls.pushBoolean(b != 0);
    ls.replace(a);
    if (c != 0)
    {
        ls.addPC(1);
    }
}

function _move(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b + 1;
    
    ls.copy(b, a);
}

function _getUpval(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b + 1;
    
    ls.copy(luaUpvalueIndex(b), a);
}

function _loadNil(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;

    ls.pushNil();

    for (let j = a; j <= a+b; j++)
    {
        ls.copy(-1, j);
    }

    ls.pop(1);
}

function _getTable(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b + 1;
    let c = i.c;

    ls.getRK(c);
    ls.getTable(b);
    ls.replace(a);
}

function _newTable(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    ls.createTable(fb2int(b), fb2int(c));
    ls.replace(a);
}

function _setTable(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    ls.getRK(b);
    ls.getRK(c);
    ls.setTable_(a);
}

const LFIELDS_PER_FLUSH = 50;

function _setlist(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b;
    let c = i.c;

    if (c > 0)
    {
        c--;
    }
    else
    {
        throw "_setlist error";
    }

    let idx = c * LFIELDS_PER_FLUSH;

    for (let j = 1; j <= b; j++)
    {
        idx++;
        ls.pushValue(a + j);
        ls.setI(a, idx);
    }
}

function _forprep(inst, ls)
{
    let i = inst.asbx();
    let a = i.a + 1;
    let sbx = i.sbx;

    ls.pushValue(a);
    ls.pushValue(a + 2);
    ls.arith(LUA_OPSUB);
    ls.replace(a);

    ls.addPC(sbx);
}

function _forloop(inst, ls)
{
    let i = inst.asbx();
    let a = i.a + 1;
    let sbx = i.sbx;

    ls.pushValue(a+2);
    ls.pushValue(a);
    ls.arith(LUA_OPADD);
    ls.replace(a);

    if (ls.compare(a, a+1, LUA_OPLE))
    {
        ls.addPC(sbx);
        ls.copy(a, a+3);
    }
}

function _le(inst, ls)
{
    _compare(inst, ls, LUA_OPLE);
}

function _lt(inst, ls)
{
    _compare(inst, ls, LUA_OPLT);
}

function _tForCall(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let c = i.c;

    _pushFuncAndArgs(a, 3, ls);
    ls.call(2, c);
    _popResults(a+3, c+1, ls);
}

function _tForLoop(inst, ls)
{
    let i = inst.asbx();
    let a = i.a + 1;
    let sbx = i.sbx;

    if (!ls.isNil(a + 1))
    {
        ls.copy(a+1, a);
        ls.addPC(sbx);
    }
}

function _setUpVal(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b + 1;

    ls.copy(a, luaUpvalueIndex(b));
}

function _self(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b + 1;
    let c = i.c;

    ls.copy(b, a+1);
    ls.getRK(c);
    ls.getTable(b);
    ls.replace(a);
}

function _testSet(inst, ls)
{
    let i = inst.abc();
    let a = i.a + 1;
    let b = i.b + 1;
    let c = i.c;

    if (ls.toBoolean(b) == (c != 0))
    {
        ls.copy(b, a);
    }
    else
    {
        ls.addPC(1);
    }
}

function _compare(inst, ls, op)
{
    let i = inst.abc();

    let a = i.a;
    let b = i.b;
    let c = i.c;

    ls.getRK(b);
    ls.getRK(c);

    if (ls.compare(-2, -1, op) != (a != 0))
    {
        ls.addPC(1);
    }
    ls.pop(2);
}


function getOpInfo(testFlag, setAFlag, argBMode, argCMode, opMode, name, action)
{
    let i = {};
    i.testFlag = testFlag; 
    i.setAFlag = setAFlag;
    i.argBMode = argBMode;
    i.argCMode = argCMode;
    i.opMode = opMode;
    i.name = name;
    i.action = action;

    return i;
}
const MAXARG_Bx = (1<<18) - 1       // 262143
const MAXARG_sBx = MAXARG_Bx >> 1 // 131071

// 参数是4字节的指令
function inst(instruction)
{
    let inst = {};

    function opCode()
    {
        return instruction & 0x3F;
    }

    function ABC()
    {
        let a = instruction >> 6 & 0xFF;
        let c = instruction >> 14 & 0x1FF;
        let b = instruction >> 23 & 0x1FF;

        return {a,b,c};
    }

    function ABx()
    {
        let a = instruction >> 6 & 0xFF;
        let bx = (instruction >> 14) & 0x3FFFF;

        return {a,bx};
    }

    

    function AsBx()
    {
        let i = inst.abx();
        let a = i.a;
        //console.log("i.bx ", i.bx, MAXARG_sBx);
        let sbx = i.bx - MAXARG_sBx;
        return {a, sbx};
    }

    function execute(ls)
    {
        let action = opCodes[inst.opCode()].action;

        action(inst, ls);
    }

    inst.instruction = instruction;
    inst.opCode = opCode;
    inst.OpInfo = opCodes[opCode()];
    inst.abc = ABC;
    inst.abx = ABx;
    inst.asbx = AsBx;
    inst.execute = execute;

    return inst;
}

function printOperands(inst)
{
    let OpInfo = inst.OpInfo;
    let out = "";
    out += inst.OpInfo.name + " ";
    switch (OpInfo.opMode) {
        case IABC:
            
            let val = inst.abc();
            let a = val.a;
            let b = val.b;
            let c = val.c;

            out += a;
            

            if (OpInfo.argBMode != OpArgN)
            {
                if (b > 0xff)
                {
                    //console.log(" %d", -1-(b&0xff));
                    out += (" " + (-1-(b&0xff)));
                }
                else
                {
                    //console.log(" %d", b);
                    out += (" " + b);
                }

                //console.log(out);
            }

            if (OpInfo.argCMode != OpArgN)
            {
                if (c > 0xff)
                {
                    //console.log(" %d", -1-(c&0xff));
                    out += (" " + (-1-(c&0xff)));
                }
                else
                {
                    //console.log(" %d", c);
                    out += (" " + c);
                }
            }
            console.log(out);
            break;

        case IABx:
            let val_ = inst.abx();
            let a_ = val_.a;
            let bx = val_.bx;

            out += a_;
            //console.log(a_);

            if (OpInfo.argBMode == OpArgK)
            {
                //console.log(" %d", -1-bx);
                out += (" " + (-1-bx));
            }
            else if (OpInfo.argBMode == OpArgU)
            {
                //console.log(" %d", bx);
                out += (" " + bx);
            }
            console.log(out);
            break;

        case IAsBx:
            let va = inst.asbx();
            let aa = va.a;
            let sbx = va.sbx;

            console.log(out + aa + " " + sbx);
            break;
    
        default:
            break;
    }
}

function printCode(proto)
{
    for(let i = 0; i < proto.Code.length; i++)
    {
        let code = proto.Code[i];
        let inst_ = inst(code);

        //打印指令码参数
        printOperands(inst_);
    }
}

//////////////////////////////////////////////////
function newLuaStack(size, state)
{
    let t = {};

    t.slots = new Array(size);
    t.top = 0;
    t.prev = null;
    t.pc = 0;
    t.state = state;

    t.push = function(val)
    {
        if (t.top == t.slots.length)
        {
            throw "newLuaStack full";
        }
        //console.log("stack push value:", val);
        t.slots[t.top] = val;

        let obj;
        if (t.recordSlotsIdx2OpenuvObj && 
            (obj = t.recordSlotsIdx2OpenuvObj.get(t.top)) != undefined)
        {
            obj.val = val;
        }

        t.top++;
    }

    t.pop = function()
    {
        if (t.top < 1)
        {
            throw "newLuaStack empty";
        }

        t.top--;

        let val = t.slots[t.top];
        t.slots[t.top] = null;

        let obj;
        if (t.recordSlotsIdx2OpenuvObj && 
            (obj = t.recordSlotsIdx2OpenuvObj.get(t.top)) != undefined)
        {
            obj.val = null;
        }

        //console.log("stack pop value :", val);

        return val;
    }

    t.absIndex = function(idx)
    {
        if (idx >= 0 || idx <= LUA_REGISTRYINDEX)
        {
            return idx;
        }

        return idx + t.top + 1;
    };

    t.get = function(idx)
    {
        if (idx < LUA_REGISTRYINDEX)//访问的是upvalues
        {
            let uvIdx = LUA_REGISTRYINDEX - idx - 1;
            let c = t.closure;

            if (c == null || uvIdx >= c.upvals.length)
            {
                return null;
            }

            if (c.upvals[uvIdx].val != undefined)
            {
                return c.upvals[uvIdx].val;//注意load（）时候upvals要先赋值！！！
            }
            else
            {
                return c.upvals[uvIdx];
            } 
        }

        if (idx == LUA_REGISTRYINDEX)
        {
            return t.state.registry;
        }


        let absIndex_ = t.absIndex(idx);

        if (absIndex_ > 0 && absIndex_ <= t.top)
        {
            return t.slots[absIndex_-1];
        }
        else
        {
            return null;
        }
    };

    t.set = function(idx, val)
    {
        //LUA_REGISTRYINDEX相关
        if (idx < LUA_REGISTRYINDEX) 
        {   /* upvalues */
            let uvIdx = LUA_REGISTRYINDEX - idx - 1;

            let c = t.closure;

            if (c != null && uvIdx < c.upvals.length) 
            {
                //c.upvals[uvIdx] = {val};应该直接修改upvals，而不是指向新对象
                c.upvals[uvIdx].val = val;
            }

            return;
	    }

        if (idx == LUA_REGISTRYINDEX) 
        {
            t.state.registry = val;
            return
        }


        let absIdx = t.absIndex(idx);
        if (absIdx > 0 && absIdx <= t.top)
        {
            t.slots[absIdx-1] = val;

            let obj;
            if (t.recordSlotsIdx2OpenuvObj && 
                (obj = t.recordSlotsIdx2OpenuvObj.get(absIdx-1)) != undefined)
            {
                obj.val = val;
            }

            return;
        }

        throw "stack set error";
    };

    t.popN = function(n)
    {
        let vals = new Array(n);

        for (let i = n-1; i >= 0; i--)
        {
            vals[i] = t.pop();
        }

        return vals;
    };

    t.pushN = function(vals, n)
    {
        let len = vals.length;

        if (n < 0)
        {
            n = len;
        }

        for (let i = 0; i < n; i++)
        {
            if (i < len)
            {
                t.push(vals[i]);
            }
            else
            {
                t.push(null);
            }
        }
    };

    t.reverse = function(from, to)
    {
        let slots = t.slots;

        while(from < to)
        {
            let tmp;

            tmp = slots[from];
            slots[from] = slots[to];
            slots[to] = tmp;

            from++;
            to--;
        }
    }

    return t;
}

const LUA_RIDX_GLOBALS = 2;
const LUA_MINSTACK = 20;

//创建表格对象
function newLuaTable(nArr, nRec)
{
    let i = {};

    i.arr = new Array(nArr);
    i._map = new Map();

    i.keys = new Map();//支持for迭代器

    i.type = "LuaTable";
    i.metaTable = null;

    i.nextKey = function(key)
    {
        if (key == null || i.keys.size == 0)
        {
            //如果key为null，或者keys为0，执行这
            i.initKeys();//收集key之间的关系
        }

        if (i.keys.get(key) == undefined)
        {
            return null;
        }

        return i.keys.get(key);//返回key的下一个key
    }

    i.initKeys = function()
    {
        //收集key之间的关系
        let key = null;

        //收集数组
        for (let j = 0; j < i.arr.length; j++)
        {
            let v = i.arr[j];

            if (v != undefined || v != null)
            {
                i.keys.set(key, j+1);
                key = j + 1;
            }
        }

        //收集map
        for (let item of i._map.keys())
        {
            let v = i._map.get(item);

            if (v != undefined || v != null)
            {
                i.keys.set(key, item);
                key = item;
            }
        }
    }

    i.put = function (key, val)
    {
        if (typeof(key) === 'number')
        {
            if (key >= 1)
            {
                if (key <= nArr)
                {
                    i.arr[key-1] = val;//如果在数组的范围内，直接写
                    return;
                }

                if (key == i.arr.length + 1)
                {
                    //如果map中有该项，则删除，没有，也删除，不会有什么影响
                    i._map.delete(key);

                    i.arr.push(val);//如果大小比数组大1，加到数组的尾部
                }
            }
        }

        i._map.set(key, val);
    };

    i.get = function(key)
    {
         //如果key是整数，且在数组的范围内，则访问数组，反之访问map
        if (typeof(key) === 'number')
        {
            if (key >= 1 && key <= i.arr.length)
            {
                return i.arr[key - 1];
            }
        }

        return i._map.get(key);
    };


    i.hasMetafield = function(fieldName)
    {
        return (i.metaTable != null) && (i.metaTable.get(fieldName) != null || 
                                        i.metaTable.get(fieldName) != undefined); 
    }

    return i;
}

function newLuaClosure(proto)
{
    let c = {};
    c.proto = proto;

    //console.log("ls.loadProto",proto.Upvalues)

    //支持upvalues
    if (proto.Upvalues.length > 0)
    {   
        c.upvals = new Array(proto.Upvalues.length);
    }

    return c;
}

function newJsClosure(jsFunction, nUpvals)
{
    let c = {};
    c.jsFunction = jsFunction;

    //支持upvalues
    if (nUpvals > 0)
    {   
        c.upvals = new Array(nUpvals);
    }

    return c;
}

function convertToBoolean(val)
{
    if (val == null || val === false)
    {
        return false;
    }

    return true;
}

const LUA_TNIL = 0;
const LUA_TBOOLEAN = 1;
const LUA_TNUMBER = 2;
const LUA_TSTRING = 3;
const LUA_TTABLE = 4;
const LUA_TFUNCTION = 5;


function luaValue(val, type)
{
    let i = {};

    i.val = val;
    i.type = type;
    
    return i;
}

function newLuaState()
{
    let ls = {};
    ls.registry = newLuaTable(0, 0);
    ls.registry.put(LUA_RIDX_GLOBALS, newLuaTable(0, 0));
    ls.stack = null;

    ls.pop = function(n)
    {
        ls.stack.popN(n);
    };

    ls.compare = function(idx1, idx2, op)
    {
        let a = ls.stack.get(idx1);
        let b = ls.stack.get(idx2);

        //暂时只支持==和<=和<,>=,>
        if (op == LUA_OPEQ)
        {
            return (a == b);
        }
        else if (op == LUA_OPLE)
        {
            return (a <= b);
        }
        else if (op == LUA_OPLT)
        {
            return (a < b);
        }
        else
        {
            throw "ls.compare error";
        }
    };

    //将子函数载入栈中
    ls.loadProto = function(idx)
    {
        let subProto = ls.stack.closure.proto.Protos[idx];

        let closure = newLuaClosure(subProto);

        if (ls.stack.openuvs == undefined)
        {
            ls.stack.openuvs = new Map();
        }

        ls.stack.push(closure);

        //支持upvalue
        for (let i = 0; i < subProto.Upvalues.length; i++)
        {
            let uvIdx = subProto.Upvalues[i].Idx;

            if (subProto.Upvalues[i].Instack == 1)
            {
                let openuvObj;

                if ((openuvObj = ls.stack.openuvs.get(uvIdx)) != undefined)
                {
                    closure.upvals[i] = openuvObj;
                }
                else
                {
                    let openuvObj = {};

                    openuvObj.val = ls.stack.slots[uvIdx];

                    ls.stack.openuvs.set(uvIdx, openuvObj);

                    //让upvals指向openuv对象,这样修改openuvObj的val，upvals会跟着变
                    closure.upvals[i] = openuvObj;

                    //为了确保slots内容更新，我们的openuvObj对象也同步更新，需要记录一些数据
                    if (ls.stack.recordSlotsIdxs == undefined)
                    {
                        ls.stack.recordSlotsIdx2OpenuvObj = new Map();
                    }

                    ls.stack.recordSlotsIdx2OpenuvObj.set(uvIdx, openuvObj);
                }
                
            }
            else
            {
                closure.upvals[i] = ls.stack.closure.upvals[uvIdx];//都用val作为前缀
            }
        }
    };

    ls.addPC = function(n)
    {
        ls.stack.pc += n;
    };

    ls.toBoolean = function (idx)
    {
        let val = ls.stack.get(idx);

        if (val == undefined)
        {
            val = null;
        }
        
        return convertToBoolean(val);
    };

    ls.replace = function(idx)
    {
        let val = ls.stack.pop();
        ls.stack.set(idx, val);
    };

    ls.getTable_ = function(t, k, raw)
    {
        //将t的k键压入lua栈
        let v;

        if (t.val != undefined)
        {
            v = t.val.get(k);
        }
        else
        {
            v = t.get(k);
        }
        
        if (v == undefined)
        {
            v = null;
        }

        if (raw || v != null || !t.hasMetafield("__index"))
        {
            ls.stack.push(v);
            return;
        }

        if (!raw)
        {
            let mf;
            if ((mf = getMetaField(t, "__index", ls)) != null)
            {
                //继续访问元表
                if (mf.type == "LuaTable")
                {
                    return ls.getTable_(mf, k, false);//递归调用获得函数
                }
                else
                {
                    //如果是函数类型，直接调用这个函数
                    ls.stack.push(mf);
                    ls.stack.push(t);
                    ls.stack.push(k);

                    ls.call(2, 1);

                    let v = ls.stack.get(-1);

                    return v;
                }
            }
            
        }
        
    };

    ls.getTable = function(idx)
    {
        let t = ls.stack.get(idx);//需要修改get函数，使得能访问全局表
        
        let k = ls.stack.pop();
        
        return ls.getTable_(t, k, false);
    };

    ls.getConst = function (idx)
    {
        let c = ls.stack.closure.proto.Constants[idx];
        ls.stack.push(c);
    };

    ls.pushValue = function (idx)
    {
        let c = ls.stack.get(idx);
        ls.stack.push(c);
    };

    ls.getRK = function (rk)
    {
        if (rk > 0xff)
        {
            ls.getConst(rk & 0xff);//得到常量表内容
        }
        else
        {
            ls.pushValue(rk + 1);//得到寄存器内容
        }
    };
    

    ls.pushLuaStack = function (stack)
    {
        stack.prev = ls.stack;
        ls.stack = stack;
    };

    ls.popLuaStack = function ()
    {
        let stack = ls.stack;
        ls.stack = stack.prev;
        stack.prev = null;
    };

    ls.load = function(fileData, chunkName, mode)
    {
        //只支持载入虚拟机文件
        let proto;
        if (proto_ == null)
        {
            proto = unDump(fileData);
        }
        else
        {
            proto = proto_;
        }
        

        let c = newLuaClosure(proto);

        ls.stack.push(c);

        //设置upvals
        if (proto.Upvalues.length > 0)
        {
            let env = ls.registry.get(LUA_RIDX_GLOBALS);//得到全局表
            c.upvals[0] = {val:env};
        }

        return 0;
    };

    ls.setTable_ = function(idx)
    {
        let t = ls.stack.get(idx);
        let v = ls.stack.pop();
        let k = ls.stack.pop();

        ls.setTable(t, k, v, false);
    };

    //设置表格t的键k为值v
    ls.setTable = function(t, k, v, raw)
    {
        if (t.val != undefined)
        {
            t.val.put(k, v);
        }
        else
        {
            t.put(k, v);
        }
        
    };

    ls.pushJsFunction = function(jsFunction)
    {
        ls.stack.push(newJsClosure(jsFunction, 0));
    };

    ls.setGlobal = function(name)
    {
        let t = ls.registry.get(LUA_RIDX_GLOBALS);//得到全局表

        let v = ls.stack.pop();//弹出函数

        //console.log("set global :", name, v);
        ls.setTable(t, name, v, false);//设置全局表
    };

    //注册函数
    ls.register = function(name, jsFunction)
    {
        ls.pushJsFunction(jsFunction);
        ls.setGlobal(name);
    };

    //调用js函数
    ls.callJsClosure = function(nArgs, nResults, c)
    {
        let newStack = newLuaStack(nArgs + 20);
        newStack.closure = c;

        let args = ls.stack.popN(nArgs);
        newStack.pushN(args, nArgs);
        ls.stack.pop();

        ls.pushLuaStack(newStack);
        let r = c.jsFunction(ls);//运行js函数
        ls.popLuaStack();

        if (nResults != 0)
        {
            let results = newStack.popN(r);
            //ls.stack.check(results.length);
            ls.stack.pushN(results, nResults);
        }
    };

    //调用lua函数
    ls.callLuaClosure = function(nArgs, nResults, c)
    {
        let nRegs = c.proto.MaxStackSize;
        let nParams = c.proto.NumParams;//需要修改这个地方，不然会得到undefined

        let isVararg = c.proto.IsVararg == 1;

        let newStack = newLuaStack(nRegs + 20);//新建运行栈
        newStack.closure = c;

        ////////////////////////////////////////////////
        let funcAndArgs = ls.stack.popN(nArgs + 1);//弹出函数和参数
        funcAndArgs.splice(0, 1)//去除函数
        newStack.pushN(funcAndArgs, nParams);//压入参数

        newStack.top = nRegs;

        if (nArgs > nParams && isVararg)
        {
            throw "callLuaClosure error";
        }

        ls.pushLuaStack(newStack);
        ls.runLuaClosure();//运行函数
        ls.popLuaStack();

        if (nResults != 0)
        {
            //如果有返回值，将返回值复制到调用函数顶部
            let results = newStack.popN(newStack.top - nRegs);

            //ls.stack.check(results.length)检查调用栈是否够

            ls.stack.pushN(results, nResults);

        }
    };


    //调用js函数
    ls.fetch = function()
    {
        let i = ls.stack.closure.proto.Code[ls.stack.pc];
        ls.stack.pc++;

        return i;
    };
    

    const OP_RETURN = 0x26;
    //调用js函数
    ls.runLuaClosure = function()
    {
        while(1)
        {
            let code = ls.fetch();//得到要执行的指令
            let inst_ = inst(code);//解码指令

            inst_.execute(ls);//执行指令

            if (inst_.opCode() == OP_RETURN)//如果是return语句，退出执行
            {
                break;
            }
        }
    };

    ls.call = function(nArgs, nResults)
    {
        //弹出栈里元素--函数
        let c = ls.stack.get(-(nArgs + 1));

        //调用函数，有两种情况，js函数和lua函数
        if (c.proto)
        {
            ls.callLuaClosure(nArgs, nResults, c);
        }
        else
        {
            ls.callJsClosure(nArgs, nResults, c);
        }
    };

    ls.pushInteger = function(n)
    {
        ls.stack.push(n);
    };

    ls.pushBoolean = function(b)
    {
        ls.stack.push(b);
    };

    let operators = [];
    operators.push({metamethod:"__add",integerFunc:null,floatFunc:null});
    operators.push({metamethod:"__sub",integerFunc:null,floatFunc:null});

    function _arith(a, b, operator)
    {
        //如果是数字，直接计算
        if ((typeof(a) === 'number') && (typeof(b) === 'number'))
        {
            if (operator.metamethod == "__add")
            {
                return a + b;
            }
            else if (operator.metamethod == "__sub")
            {
                return a - b;
            }
        }

        //如果不是数字，返回null
        return null;
    }

    function getMetatable(val, ls)
    {
        if (val.type == "LuaTable")
        {
            return val.metaTable;
        }

        throw "getMetatable error";
    }

    function getMetaField(b, mmName, ls)
    {
        //只支持取表的元表
        if (b.type == "LuaTable")
        {
            let mt;
            if (mt = getMetatable(b, ls))
            {
                let mmFunc;
                if (mmFunc = mt.get(mmName))//调用表的get函数
                {
                    return mmFunc;
                } 

                return null;
            }
        }
        else
        {
            throw "getMetaField error";
        }

        return null;
    }

    function callMetaMethod(a, b, mmName, ls)
    {
        let mm;
        
        if ((mm = getMetaField(a, mmName, ls)) == null)
        {
            if ((mm = getMetaField(b, mmName, ls)) == null)
            {
                //如果在元表中找不到函数__add,或者__sub，则返回
                return {result:null, ok:false};
            }
        }

        //ls.stack.check(4);
        ls.stack.push(mm);//压入元方法
        ls.stack.push(a);
        ls.stack.push(b);
        ls.call(2, 1);//两个函数参数，一个返回值
        return {result: ls.stack.pop(), ok: true};//栈顶为计算结果
    }

    ls.arith = function(op)
    {
        //只处理加法和减法指令
        let a,b;
        b = ls.stack.pop();
        a = ls.stack.pop();

        let result;

        //如果是数字，直接计算返回
        let operator = operators[op];
        if (result = _arith(a, b, operator))
        {
            ls.stack.push(result);
            return;
        }

        //如果不是数，则调用元表的元方法计算
        let mm = operator.metamethod;

        let callResult = callMetaMethod(a, b, mm, ls);

        if (callResult.ok)
        {
            ls.stack.push(callResult.result);
            return;
        }

        throw "ls.arith error";
    };

    ls.copy = function(fromIdx, toIdx)
    {
        let val = ls.stack.get(fromIdx);
        ls.stack.set(toIdx, val);
    }

    ls.pushNil = function()
    {
        ls.stack.push(null);
    }

    ls.createTable = function(nArr, nRec)
    {
        let t = newLuaTable(nArr, nRec);
	    ls.stack.push(t);
    }

    ls.setI = function(idx, i)
    {
        let t = ls.stack.get(idx);
        let v = ls.stack.pop();
        ls.setTable(t, i, v);
    }

    ls.setTop = function(idx)
    {
        let newTop = ls.stack.absIndex(idx);

        if (newTop < 0)
        {
            throw "stack underflow!";
        }

        let n = ls.stack.top - newTop;

        if (n > 0)
        {
            for (let i = 0; i < n; i++)
            {
                ls.stack.pop();//弹出多余的
            }
        }
        else if (n < 0)
        {
            for (let i = 0; i > n; i--)
            {
                ls.stack.push(null);//压入null
            }
        }
    }

    ls.next = function(idx)
    {
        let table = ls.stack.get(idx);//得到表
        let key = ls.stack.pop();//得到表的key

        let nextKay;
        
        if ((nextKay = table.nextKey(key)) != null)
        {
            ls.stack.push(nextKay);//得到key
            ls.stack.push(table.get(nextKay));//得到value

            return true;
        }

        return false;
    }

    ls.isNil = function(idx)
    {
        return ls.stack.get(idx) == null;
    }


    function deepCopy(obj) 
    {
        var copy = Object.create(Object.getPrototypeOf(obj));

        var propNames = Object.getOwnPropertyNames(obj);
    
        propNames.forEach(function(name) 
        {
            var desc = Object.getOwnPropertyDescriptor(obj, name);
            Object.defineProperty(copy, name, desc);
        });
    
        return copy;
    }

    ls.closeUpvalues = function(a)
    {
        // let openuvs = ls.stack.openuvs;

        // for (let item of openuvs.keys())
        // {
        //     if (item >= a-1)
        //     {
        //         let openuvObj = openuvs.get(item);//openuv指向lua栈上的局部变量的深拷贝

        //         openuvObj.val = ls.stack.slots[item];//从slots中更新openuvObj的变量值

        //         openuvs.delete(item);
        //     }
        // }
    }

    ls.error = function()
    {
        let error = ls.stack.pop();
        throw error;
    }

    ls.getTop = function()
    {
        return ls.stack.top;
    }

    ls.rotate = function(idx, n)
    {
        let t = ls.stack.top - 1;
        let p = ls.stack.absIndex(idx) - 1;

        let m;

        if (n >= 0)
        {
            m = t - n;
        }
        else
        {
            m = p - n - 1;
        }

        ls.stack.reverse(p, m);
        ls.stack.reverse(m+1, t);
        ls.stack.reverse(p, t);
    }

    ls.insert = function(idx)
    {
        ls.rotate(idx, 1);
    }

    ls.pcall = function(nArgs, nResults, msgh)//2,-1,0
    {
        let caller = ls.stack;

        let status = LUA_ERRRUN;

        try 
        {
            ls.call(nArgs, nResults);//这个函数会将传给pcall的参数都出栈
        }
        catch(err)
        {
            //从发生错误，调用error的函数，退回到当前函数
            while(ls.stack != caller)
            {
                ls.popLuaStack();
            }

            ls.stack.push(err);//压入error函数的参数，当前栈中只有这个错误信息

            return status;
        }
        status = LUA_OK;

        return status;
    }

    function setMetaTable(val, mt, ls)
    {
        if (val.type == "LuaTable")
        {
            //如果是表，则设置专属元表
            val.metaTable = mt;
        }
        else
        {
            throw "setMetaTable unsupport";
        }
    }

    ls.setMetaTable = function(idx)
    {
        let val = ls.stack.get(idx);

        let mtVal = ls.stack.pop();

        if (mtVal == null)
        {
            setMetaTable(val, null, ls);
        }
        else if(mtVal.type == "LuaTable")
        {
            setMetaTable(val, mtVal, ls);
        }
        else
        {
            throw "table expected !";
        }
    }

    ls.pushLuaStack(newLuaStack(LUA_MINSTACK, ls));

    return ls;
}


//////////////////////////////////////////////////
const LUA_OK = 0;
const LUA_YIELD = 1;
const LUA_ERRRUN = 2;
const LUA_ERRSYNTAX = 3;
const LUA_ERRMEM = 4;
const LUA_ERRGCMM = 5;
const LUA_ERRERR = 6;
const LUA_ERRFILE = 7;


function print(ls)
{
    //得到传来的参数
    console.log("Jsprint:",ls.stack.pop());
    
    return 0;
}

function pairs(ls)
{
    ls.pushJsFunction(next);//next函数
    ls.pushValue(1);//表t
    ls.pushNil();//初始key
    return 3;
}

function error(ls)
{
    return ls.error();
}

function pcall(ls)
{
    let nArgs = ls.getTop() - 1;//获得函数参数个数
    let status = ls.pcall(nArgs, -1, 0);

    //在栈顶压入函数执行结果，true或者false
    ls.pushBoolean(status == LUA_OK);
    ls.insert(1);//将上面的true或者false设置为第一个返回值
    return ls.getTop();//返回参数个数由getTop函数结果决定
}

function next(ls)
{
    ls.setTop(2);//确保栈的大小是2，保证ls.next函数有两个参数

    if (ls.next(1))
    {
        return 2;//key和vaule已经在栈顶
    }
    else
    {
        ls.pushNil();//栈顶是null
        return 1;
    }
}

function setMetaTable(ls)
{
    ls.setMetaTable(1);
    return 1;
}

// function setValue(ls)
// {
//     //console.log("setValue()");

//     let val = ls.stack.pop();
//     let button = ls.stack.pop();

//     button.value[0] = val;

//     //如果是button类型，调用发送通信请求
//     if (button.type == "button")
//     {
//       //调用设备通信函数，进行通信
//       devWriteCommu(button, (data)=>{
//         let tmp;
//         if (tmp = jsonParse(data))
//         {
//             if(tmp.result == "ok")
//             {
//                 //console.log("脚本" + "成功");
//             }
//         }
//       });
//     }

//     return 0;
// }

function setValue(ls)
{
    let val = ls.stack.pop();
    let color = ls.stack.pop();

    console.log("setValue", val, color);

    if (color.type == "color")
    {
        color.color.color = val;
    }
}

let ls;
let fileData_;
let proto_ = null;

//运行lua文件
export function runLua()
{
    ls.load(fileData_, "any", "bt");

    try 
    {
        ls.call(0, 0);
    }
    catch (e)
    {
        console.log(e)
    }
    
}


///////////////////////////////////////////////////////////////////////////
//词法分析
const TOKEN_EOF = 0;//结束符
const TOKEN_KW_FUNCTION = 1;//function
const TOKEN_IDENTIFIER = 2;//标识符
const TOKEN_SEP_LPAREN = 3;//(
const TOKEN_SEP_RPAREN = 4;//)
const TOKEN_KW_IF = 5;//if
const TOKEN_OP_ADD = 6;//+
const TOKEN_OP_EQ = 7;//==
const TOKEN_NUMBER = 8;//数字
const TOKEN_KW_THEN = 9;//then
const TOKEN_SEP_COMMA = 10;//,
const TOKEN_KW_ELSE = 11;//else
const TOKEN_KW_END = 12;//end
const TOKEN_KW_RETURN = 13;//return

const TOKEN_OP_ASSIGN = 14;//=
const TOKEN_KW_LOCAL = 15;//local

const TOKEN_SEP_DOT = 16;//.

const TOKEN_SEP_LCURLY = 17;//{
const TOKEN_SEP_RCURLY = 18;//}
const TOKEN_SEP_LBRACK = 19;//[
const TOKEN_SEP_RBRACK = 20;//]

const TOKEN_STRING = 21;//"内容"或者'内容'

const TOKEN_KW_FOR = 22;//for
const TOKEN_KW_DO = 23;//do

const TOKEN_KW_WHILE = 24;//while
const TOKEN_OP_LE = 25;//<=
const TOKEN_OP_LT = 26;//<

const TOKEN_KW_IN = 27;//in

const TOKEN_KW_REPEAT = 28;//repeat
const TOKEN_KW_UNTIL = 29;//until
const TOKEN_OP_GE = 30;//>=
const TOKEN_OP_GT = 31;//>

const TOKEN_KW_BREAK = 32;//break

const TOKEN_SEP_COLON = 33;//:

const TOKEN_OP_OR = 34;//or

const TOKEN_KW_FALSE = 35;//false
const TOKEN_KW_NIL = 36;//nil
const TOKEN_KW_TRUE = 37;//true



let keywords = new Map();
keywords.set("function", TOKEN_KW_FUNCTION);
keywords.set("if", TOKEN_KW_IF);
keywords.set("then", TOKEN_KW_THEN);
keywords.set("else", TOKEN_KW_ELSE);
keywords.set("end", TOKEN_KW_END);
keywords.set("local", TOKEN_KW_LOCAL);

keywords.set("return", TOKEN_KW_RETURN);

keywords.set("for", TOKEN_KW_FOR);
keywords.set("do", TOKEN_KW_DO);

keywords.set("while", TOKEN_KW_WHILE);

keywords.set("in", TOKEN_KW_IN);

keywords.set("repeat", TOKEN_KW_REPEAT);
keywords.set("until", TOKEN_KW_UNTIL);

keywords.set("break", TOKEN_KW_BREAK);

keywords.set("or", TOKEN_OP_OR);
keywords.set("false", TOKEN_KW_FALSE);
keywords.set("nil", TOKEN_KW_NIL);
keywords.set("true", TOKEN_KW_TRUE);

function newLexer(chunk, chunkName)
{
    let i = {};
    let count = 0;
    let line = 1;

    i.chunk = chunk;
    i.chunkName = chunkName;
    i.line = line;//从第一行开始
    i.count = count;//指向chunk字符的指针

    i.nextTokenLine = 0;
    i.nextTokenKind = 0;
    i.nextToken_ = "";

    i.nextIdentifier = function()
    {
        return i.nextTokenOfKind(TOKEN_IDENTIFIER);
    }

    i.nextTokenOfKind = function(kind)
    {
        let token = i.nextToken();

        if (token.kind != kind)
        {
            throw "syntax error near " + token.kind + ' ' + kind;
        }

        return {line:token.line, token:token.token};
    }

    i.lookAhead = function()
    {
        //只查看，不改变line的值
        if (i.nextTokenLine > 0)
        {   
            return i.nextTokenKind;
        }

        let currentLine = i.line;
        let token = i.nextToken();

        i.line = currentLine;
        i.nextTokenLine = token.line;
        i.nextTokenKind = token.kind;
        i.nextToken_ = token.token;
        return token.kind;
    }

    i.isWhiteSpace = function(c)
    {
        switch (c) {
            case '\t':
                return true;
                break;
        
            default:
                break;
        }

        return false;
    }

    //跳过空白字符，如空格和换行符
    i.skipWhiteSpaces = function ()
    {
        while(1)
        {
            if (chunk[count] == ' ')
            {
                i.next(1);
            }
            else if (chunk[count] == '\r' && chunk[count + 1] == '\n')
            {
                i.next(2);
                line++;
            }
            else if (i.isWhiteSpace(chunk[count]))
            {
                i.next(1);
                break;
            }
            else
            {
                break;
            }
        }
    }

    i.next = function(n)
    {
        count += n;
    }

    i.isDigit = function(n)
    {
        return n >= '0' && n <= '9';
    }

    i.scanNumber = function(n)
    {
        //只支持整数
        let num;
        let countStart = count;

        while(chunk[count] >= '0' && chunk[count] <= '9')
        {
            i.next(1);
        }

        num = chunk.substring(countStart, count);

        return num;
    }

    i.isLetter = function(n)
    {
        return (n >= 'a' && n <= 'z') || (n >= 'A' && n <= 'Z');
    }

    i.scanIdentifier = function()
    {
        //返回扫描得到的标识符
        //只支持字母,下划线和数字表示的标识符
        let identifier;
        let countStart = count;

        while((chunk[count] >= 'a' && chunk[count] <= 'z') || 
        (chunk[count] >= 'A' && chunk[count] <= 'Z') || (chunk[count] == '_') ||
        (i.isDigit(chunk[count])))
        {
            i.next(1);
        }

        identifier = chunk.substring(countStart, count);
        //console.log(identifier);
        return identifier;
    }

    i.scanShortString = function()
    {
        let startL = chunk[count];

        i.next(1);

        let countStart = count;

        //读到'或者"结束
        while(chunk[count] != startL)
        {
            i.next(1);
        }

        let shortString = chunk.substring(countStart, count);
        i.next(1);//跳过结尾的符号'或者"
        console.log("shortString", shortString);
        return shortString;
    }

    //返回行号，token类型，token
    i.nextToken = function ()
    {
        if (i.nextTokenLine > 0)
        {
            let line = i.nextTokenLine;
            let kind = i.nextTokenKind;
            let token = i.nextToken_;

            i.line = i.nextTokenLine;
            i.nextTokenLine = 0;
            //console.log(4444);
            return {line, kind, token};
        }

        i.skipWhiteSpaces();

        //到达最后字符了，直接返回
        if (count == chunk.length)
        {
            return {line, kind:TOKEN_EOF, token:"EOF"};
        }

        switch (chunk[count]) {
            case '(':
                i.next(1);
                return {line, kind:TOKEN_SEP_LPAREN, token:"("};
            break;

            case ')':
                i.next(1);
                return {line, kind:TOKEN_SEP_RPAREN, token:")"};
            break;

            case '+':
                i.next(1);
                return {line, kind:TOKEN_OP_ADD, token:"+"};
            break;

            case '=':
                if ((count + 1 != chunk.length) && (chunk[count + 1] == '=')) 
                {
                    i.next(2);
                    return {line, kind:TOKEN_OP_EQ, token:"=="};
                } 
                else 
                {
                    i.next(1);
                    return {line, kind:TOKEN_OP_ASSIGN, token:"="};
                }

            break;

            case ',':
                i.next(1);
                return {line, kind:TOKEN_SEP_COMMA, token:","};
            break;

            case '.':
                i.next(1);
                return {line, kind:TOKEN_SEP_DOT, token:"."};
                break;

            case '{':
                i.next(1);
                return {line, kind:TOKEN_SEP_LCURLY, token:"{"};
                break;

            case '}':
                i.next(1);
                return {line, kind:TOKEN_SEP_RCURLY, token:"}"};
                break;

            case '[':
                i.next(1);
                return {line, kind:TOKEN_SEP_LBRACK, token:"["};
                break;

            case ']':
                i.next(1);
                return {line, kind:TOKEN_SEP_RBRACK, token:"]"};
                break;

            case '\'':
            case '"' :
                return {line, kind:TOKEN_STRING, token:i.scanShortString()}; ;
                break;

            case '<':
                if ((count + 1 != chunk.length) && (chunk[count + 1] == '=')) 
                {
                    i.next(2);
                    return {line, kind:TOKEN_OP_LE, token:"<="};
                } 
                else 
                {
                    i.next(1);
                    return {line, kind:TOKEN_OP_LT, token:"<"};
                }

                break;

            case '>':
                if ((count + 1 != chunk.length) && (chunk[count + 1] == '=')) 
                {
                    i.next(2);
                    return {line, kind:TOKEN_OP_GE, token:">="};
                } 
                else 
                {
                    i.next(1);
                    return {line, kind:TOKEN_OP_GT, token:">"};
                }
                break;

            case ':':
                i.next(1);
                return {line, kind:TOKEN_SEP_COLON, token:":"};
                break;

            default:
                break;
        }

        //判断是否是数字
        let c = i.chunk[count];

        if (i.isDigit(c))
        {
            let token = i.scanNumber();

            return {line, kind:TOKEN_NUMBER, token:token};
        }

        //判断是否是标识符或关键字
        if ((c == '_') || i.isLetter(c))
        {
            let token = i.scanIdentifier();
            //console.log("keywords[token]", keywords.get(token), token);

            if (keywords.get(token))
            {
                return {line, kind:keywords.get(token), token:token};
            }
            else
            {
                return {line, kind:TOKEN_IDENTIFIER, token:token};
            }
        }

        throw "unexpected symbol near" + c;
    };

    return i;
}
/////////////////////////////////
//语法分析

function newBlock(stats, retExps, lastLine)
{
    let i = {};
    
    i.stats = stats;
    i.retExps = retExps;
    i.lastLine = lastLine;

    return i;
}

function newIfStat(exps, blocks)
{
    let i = {};

    i.exps = exps;
    i.blocks = blocks;

    i.type = "IfStat";//for代码生成

    return i;
}

function newLocalValDeclStat(lastline, nameList, expList)
{
    let i = {};

    i.lastline = lastline;
    i.nameList = nameList;
    i.expList = expList;

    i.type = "LocalValDeclStat";//代码生成

    return i;
}


function binOpExp(line, op, exp1, exp2)
{
    let i = {};

    i.line = line;
    i.op = op;
    i.exp1 = exp1;
    i.exp2 = exp2;

    i.type = "BinopExp";

    return i;
}

//解析block
function parseBlock(lexer)
{
    return newBlock(parseStats(lexer),
                    parseRetExps(lexer),
                    lexer.line);
}

function isBlockEnd(tokenKind)
{
    console.log("tokenKind:" + tokenKind);
    switch (tokenKind) {
        case TOKEN_EOF:
        case TOKEN_KW_END:
        case TOKEN_KW_ELSE:
        case TOKEN_KW_RETURN:
        case TOKEN_KW_UNTIL:
            return true;
            break;
    
        default:
            break;
    }

    return false;
}

function trueExp(line)
{
    let i = {};

    i.line = line;

    i.type = "TrueExp";

    return i;
}

function integerExp(line, val)
{
    let i = {};

    i.line = line;
    i.val = val;

    i.type = "IntegerExp";

    return i;
}

function FloatExp(line, val)
{
    let i = {};
    
    i.line = line;
    i.val = val;

    i.type = "FloatExp";

    return i;
}

function parseNumberExp(lexer)
{
    function isInt(n) 
    {
        return typeof n === 'number' && n % 1 == 0;
    }

    let i = lexer.nextToken();
    let line = i.line;
    let token = i.token;

    let number = Number(token);

    if (isInt(number))
    {
        //是整数
        return integerExp(line, number);
    }
    else
    {
        //是浮点数
        return FloatExp(line, number);
    }
}

function tableConstructorExp(line, lastLine, keyExps, valExps)
{
    let i = {};

    i.type = "TableConstructorExp";

    i.line = line;
    i.lastLine = lastLine;
    i.keyExps = keyExps;
    i.valExps = valExps;

    return i;
}

function _isFieldSep(tokenKind)
{
    return tokenKind == TOKEN_SEP_COMMA;//如果是逗号，返回真
}

function _parseField(lexer)
{
    if (lexer.lookAhead() == TOKEN_SEP_LBRACK)//如果是[]
    {
        lexer.nextToken();//跳过[
        let k = parseExp(lexer);
        lexer.nextTokenOfKind(TOKEN_SEP_RBRACK);//确保是]
        lexer.nextTokenOfKind(TOKEN_OP_ASSIGN);//确保是=
        let v = parseExp(lexer);

        return {k, v};
    }

    let exp = parseExp(lexer);

    if (exp.type == "NameExp")
    {
        if (lexer.lookAhead() == TOKEN_OP_ASSIGN)
        {
            lexer.nextToken();//跳过=

            let k = stringExp(exp.line , exp.name);
            let v = parseExp(lexer);

            return {k, v};
        }
    }
    
    return {k:null, v:exp}; 
}

function _parseFildList(lexer)
{
    let ks = [], vs = [];
    if (lexer.lookAhead() != TOKEN_SEP_RCURLY)//不为空
    {
        let kv = _parseField(lexer);
        ks.push(kv.k);
        vs.push(kv.v);

        while(_isFieldSep(lexer.lookAhead()))//如果是，
        {
            lexer.nextToken();//跳过token
            if (lexer.lookAhead() != TOKEN_SEP_RCURLY)
            {
                let kv = _parseField(lexer);
                ks.push(kv.k);
                vs.push(kv.v);
            }
            else
            {
                break;
            }
        }
    }
    return {keyExps:ks, valExps:vs};
}

function parseTableConstructorExp(lexer)
{
    let line = lexer.line;
    lexer.nextTokenOfKind(TOKEN_SEP_LCURLY);//确保是{
    let exps = _parseFildList(lexer);
    lexer.nextTokenOfKind(TOKEN_SEP_RCURLY);//却表是}
    let lastLine = lexer.line;

    return tableConstructorExp(line, lastLine, exps.keyExps, exps.valExps);
}

function primary(lexer) 
{
    let token;

    switch (lexer.lookAhead()) 
    {
        case TOKEN_NUMBER:
            return parseNumberExp(lexer);//数字
            break;

        case TOKEN_SEP_LCURLY:
            return parseTableConstructorExp(lexer);
            break;

        case TOKEN_STRING:
            token = lexer.nextToken();
            return stringExp(token.line, token.token);
            break

        case TOKEN_KW_FUNCTION:
            lexer.nextToken();
            return parseFuncDefExp(lexer);
            break;

        case TOKEN_KW_FALSE:
            token = lexer.nextToken();
            return falseExp(token.line);
            break;

        case TOKEN_KW_TRUE:
            token = lexer.nextToken();
            return trueExp(token.line);
            break;

        case TOKEN_KW_NIL:
            token = lexer.nextToken();
            return nilExp(token.line);
            break;

        default:
            break;
    }

    return parsePrefixExp(lexer);//标识符
}

function factor(lexer) 
{
    let expr = primary(lexer);

    while (1) 
    {
        switch (lexer.lookAhead()) 
        {
            case TOKEN_OP_ADD:
                let i = lexer.nextToken();
                let line = i.line;
                let op = i.kind;

                expr = binOpExp(line, op, expr, primary(lexer));
                break;
        
            default:
                return expr;
        }
    }

    return expr;
}

function term(lexer) 
{
    let expr = factor(lexer);

    while (1) 
    {
        switch (lexer.lookAhead()) 
        {
            case TOKEN_OP_EQ:
            case TOKEN_OP_LE:
            case TOKEN_OP_LT:
            case TOKEN_OP_GE:
            case TOKEN_OP_GT:
                let i = lexer.nextToken();
                let line = i.line;
                let op = i.kind;

                expr = binOpExp(line, op, expr, factor(lexer));
                break;
        
            default:
                return expr;
        }
    }

    return expr;
}

function parseExp12(lexer)
{
    let expr = term(lexer);

    while (1) 
    {
        switch (lexer.lookAhead()) 
        {
            case TOKEN_OP_OR:
                let i = lexer.nextToken();
                let line = i.line;
                let op = i.kind;

                expr = binOpExp(line, op, expr, term(lexer));
                break;
        
            default:
                return expr;
        }
    }

    return expr;
}

//解析表达式
//暂时只支持加法,等于判断，表
function parseExp(lexer)
{
    return parseExp12(lexer);
}

//解析if语句
function parseIfstat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_IF);//确定开头是IF

    let exps = [];
    let blocks = [];

    exps.push(parseExp(lexer));
    
    //console.log("if cond:", exps[0]);

    lexer.nextTokenOfKind(TOKEN_KW_THEN);//确定表达式之后是THEN
    
    blocks.push(parseBlock(lexer));//解析满足if条件的语句
    //console.log("333", blocks);

    //处理else，我们先不支持elseif
    if (lexer.lookAhead() == TOKEN_KW_ELSE)
    {
        //console.log(3);
        lexer.nextToken();//跳过else

        exps.push(trueExp(lexer.line));//插入true表达式

        blocks.push(parseBlock(lexer));//解析满足else条件的语句
        //console.log(4);
    }

    lexer.nextTokenOfKind(TOKEN_KW_END);//确定以end结尾

    return newIfStat(exps, blocks);
}

function nameExp(line, name)
{
    let i = {};
    i.line = line;
    i.name = name;

    i.type = "NameExp";

    return i;
}

function funcCallExp(line, lastLine, prefixExp, nameExp, args)
{
    let i = {};

    i.line = line;
    i.lastLine = lastLine;
    i.prefixExp = prefixExp;
    i.nameExp = nameExp;
    i.args = args;

    i.type = "FuncCallExp";

    return i;
}

function parseExpList(lexer)
{
    let exps = [];

    exps.push(parseExp(lexer));

    while(lexer.lookAhead() == TOKEN_SEP_COMMA)//如果是逗号分隔
    {
        lexer.nextToken()//跳过逗号
        exps.push(parseExp(lexer));
    }

    return exps;
}

//解析函数参数
function _parseArgs(lexer)
{
    let args = [];

    switch (lexer.lookAhead()) {
        case TOKEN_SEP_LPAREN:
            lexer.nextToken();//跳过(

            if (lexer.lookAhead() != TOKEN_SEP_RPAREN)
            {
                //说明有参数
                args = parseExpList(lexer);
            }

            lexer.nextTokenOfKind(TOKEN_SEP_RPAREN);//必须以)结束
            break;
    
        default:
            break;
    }

    return args;
}

function _parseNameExp(lexer)
{
    if (lexer.lookAhead() == TOKEN_SEP_COLON)
    {
        lexer.nextToken();//跳过冒号

        let ident = lexer.nextIdentifier();

        return stringExp(ident.line, ident.token);
    }

    return null;
}

function _finishFuncCallExp(lexer, prefixExp)
{
    let nameExp = _parseNameExp(lexer);

    let line = lexer.line;

    let args = _parseArgs(lexer);

    let lastLine = lexer.line;

    return funcCallExp(line, lastLine, prefixExp, nameExp, args);
}

function _finishPrefixExp(lexer, exp)
{
    while(1)
    {
        switch (lexer.lookAhead()) {
            case TOKEN_SEP_LPAREN:
            case TOKEN_SEP_COLON://冒号，则为函数调用语句
                exp = _finishFuncCallExp(lexer, exp);
                break;
    
            case TOKEN_SEP_DOT:
                //console.log("TOKEN_SEP_DOT");
                lexer.nextToken();//跳过.
                let ident = lexer.nextIdentifier();
    
                let keyExp = stringExp(ident.line, ident.token);
                exp = tableAccessExp(ident.line, exp, keyExp);
                break;
    
            case TOKEN_SEP_LBRACK://[]
                lexer.nextToken();//跳过[
                let keyExp_ = parseExp(lexer);//解析表的key
                lexer.nextTokenOfKind(TOKEN_SEP_RBRACK);//确保是]
                exp = tableAccessExp(lexer.line, exp, keyExp_);
                break;
        
            default:
                return exp;
        }
    }
}

function parseParensExp(lexer)
{
    //console.log(1);
    lexer.nextTokenOfKind(TOKEN_SEP_LPAREN);
    //console.log(2);

    let exp = parseExp(lexer);

    lexer.nextTokenOfKind(TOKEN_SEP_RPAREN);

    return exp;
}

function parsePrefixExp(lexer)
{
    let exp;

    if (lexer.lookAhead() == TOKEN_IDENTIFIER)
    {
        let i = lexer.nextIdentifier();
        exp = nameExp(i.line, i.token);
    }
    else
    {
        exp = parseParensExp(lexer);//( )
    }

    return _finishPrefixExp(lexer, exp);
}

function _finishVarList(lexer, var0)
{
    let vars = [];
    vars.push(var0);

    while(lexer.lookAhead() == TOKEN_SEP_COMMA)
    {
        lexer.nextToken();//跳过逗号
        let exp = parsePrefixExp(lexer);
        vars.push(exp); 
    }

    return vars;
}

function parseAssignStat(lexer, var0)
{
    let varList = [];
    let expList = [];

    varList = _finishVarList(lexer, var0);
    lexer.nextTokenOfKind(TOKEN_OP_ASSIGN);//确保为=号
    expList = parseExpList(lexer);//解析表达式

    let lastLine = lexer.line;

    return assignStat(lastLine, varList, expList);
}

//函数调用和赋值语句
function parseAssignOrFuncCallStat(lexer)
{
    //暂时只支持函数调用
    let prefixExp = parsePrefixExp(lexer);

    //扩展支持赋值语句
    if (prefixExp.type == "FuncCallExp")
    {
        return prefixExp;
    }
    else
    {
        return parseAssignStat(lexer, prefixExp);
    }
}

function _parseFuncName(lexer)
{
    let identifier = lexer.nextIdentifier();
    let exp = nameExp(identifier.line, identifier.token);//函数名表达式

    let hasColon = false;

    while(lexer.lookAhead() == TOKEN_SEP_DOT)//当时点号时
    {
        lexer.nextToken();//跳过点号
        let ident = lexer.nextIdentifier();

        let idx = stringExp(ident.line, ident.token);//key是string类型

        exp = tableAccessExp(ident.line, exp, idx);
    }

    if (lexer.lookAhead() == TOKEN_SEP_COLON)//如果有冒号
    {
        lexer.nextToken();//跳过冒号
        let ident = lexer.nextIdentifier();

        let idx = stringExp(ident.line, ident.token);//key是string类型

        exp = tableAccessExp(ident.line, exp, idx);

        hasColon = true;
    }

    return {fnExp: exp, hasColon: hasColon};
}

function _parseParList(lexer)
{
    if (lexer.lookAhead() == TOKEN_SEP_RPAREN)
    {
        return {parList:[], isVararg:false};
    }
    else
    {
        let ident = lexer.nextIdentifier();
        let names = [];

        names.push(ident.token);

        //如果是逗号，说明还有参数，继续处理
        while(lexer.lookAhead() == TOKEN_SEP_COMMA)
        {
            lexer.nextToken()//跳过逗号
            if (lexer.lookAhead() == TOKEN_IDENTIFIER)
            {   
                //如果是标识符
                let ident = lexer.nextIdentifier();
                names.push(ident.token);
            }
            else
            {
                throw "_parseParList error";
            }
        }
        //console.log("names:", names);
        return {parList:names, isVararg:false}; 
    }
}

function funcDefExp(line, lastLine, parList, isVararg, block)
{
    let i = {};

    i.line = line;
    i.lastLine = lastLine;
    i.parList = parList;
    i.isVararg = isVararg;
    i.block = block;

    i.type = "FuncDefExp";

    return i;
}


function parseFuncDefExp(lexer)
{
    let line = lexer.line;
    lexer.nextTokenOfKind(TOKEN_SEP_LPAREN);//确保是(
    let list = _parseParList(lexer);//解析函数参数
    lexer.nextTokenOfKind(TOKEN_SEP_RPAREN);//确保是)

    let block = parseBlock(lexer);//解析函数体

    let last = lexer.nextTokenOfKind(TOKEN_KW_END);//确保是end

    return funcDefExp(line, last.line, list.parList, list.isVararg, block);
}

function assignStat(lastLine, varList, expList)
{
    let i = {};

    i.type = "AssignStat";

    i.lastLine = lastLine;
    i.varList = varList;
    i.expList = expList;

    return i;
}

//lua函数定义
function parseFuncDefStat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_FUNCTION);

    let fnName = _parseFuncName(lexer);//解析函数名
    let fdExp = parseFuncDefExp(lexer);//解析函数体

    if (fnName.hasColon)
    {
        //v:name(args)=>v.name(self, args)
        fdExp.parList.unshift("self");//给参数列表添加self关键字
    }

    let varList = [];
    varList.push(fnName.fnExp);

    let expList = [];
    expList.push(fdExp);

    return assignStat(fdExp.line, varList, expList);//生成赋值语句
}

function _finishLocalVarDeclStat(lexer)
{
    let ident = lexer.nextIdentifier();
    let nameList = [];
    nameList.push(ident.token);//只支持一个变量名

    let expList = [];

    if (lexer.lookAhead() == TOKEN_OP_ASSIGN)
    {
        lexer.nextToken();
        expList = parseExpList(lexer);//解析表达式
    }

    let lastLine = lexer.line;

    //console.log("_finishLocalVarDeclStat", nameList, expList);

    return newLocalValDeclStat(lastLine, nameList, expList);
}

function localFuncDefStat(name, exp)
{
    let i = {};

    i.type = "LocalFuncDefStat";

    i.name = name;
    i.exp = exp;

    return i;
}

function _finishLocalFuncDefStat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_FUNCTION);//确保是function开头

    let indent = lexer.nextIdentifier();
    
    let fdExp = parseFuncDefExp(lexer);
    
    return localFuncDefStat(indent.tokan, fdExp);
}

function parseLocalAssignOrFuncDefStat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_LOCAL);

    if (lexer.lookAhead() == TOKEN_KW_FUNCTION)
    {
        return _finishLocalFuncDefStat(lexer);
    }
    else
    {
        return _finishLocalVarDeclStat(lexer);
    }
}

function forNumStat(lineOfFor, doLine, varName, initExp, limitExp, stepExp, block)
{
    let i = {};

    i.type = "ForNumStat";

    i.lineOfFor = lineOfFor;
    i.doLine = doLine;
    i.varName = varName;
    i.initExp = initExp;
    i.limitExp = limitExp;
    i.stepExp = stepExp;
    i.block = block;

    return i;
}

function _finishForNumStat(lexer, lineOfFor, varName)
{
    lexer.nextTokenOfKind(TOKEN_OP_ASSIGN) //确保是=

    let initExp = parseExp(lexer);//变量的初值
	lexer.nextTokenOfKind(TOKEN_SEP_COMMA);//确保是,
	let limitExp = parseExp(lexer);//变量的终值

    let stepExp;

    if (lexer.lookAhead() == TOKEN_SEP_COMMA)
    {
        //如果还有','则为步距变量
        lexer.nextToken();//跳过','
        stepExp = parseExp(lexer);
    }
    else
    {
        stepExp = integerExp(lexer.line, 1);//步距默认为1
    }

    let doToken = lexer.nextTokenOfKind(TOKEN_KW_DO)//确保是do
    let block = parseBlock(lexer);
    lexer.nextTokenOfKind(TOKEN_KW_END)//确保是end

    return forNumStat(lineOfFor, doToken.line, varName, initExp, limitExp, stepExp, block);
}

function forInStat(line, nameList, expList, block)
{
    let i = {};

    i.type = "ForInStat";

    i.line = line;
    i.nameList = nameList;
    i.expList = expList;
    i.block = block;

    return i;
}

function _finishNameList(lexer, name0)
{
    let names = [];

    names.push(name0);

    while (lexer.lookAhead() == TOKEN_SEP_COMMA)
    {
        lexer.nextToken();//跳过','

        let ident = lexer.nextIdentifier();
        names.push(ident.token);
    }

    return names;
}

function _finishForInStat(lexer, name0)
{
    let nameList = _finishNameList(lexer, name0);//解析name列表

    lexer.nextTokenOfKind(TOKEN_KW_IN);//确保是关键字in

    let expList = parseExpList(lexer);//解析表达式列表

    let do_ = lexer.nextTokenOfKind(TOKEN_KW_DO);//确保是do

    let block = parseBlock(lexer);
    
    lexer.nextTokenOfKind(TOKEN_KW_END);//确保是end

    return forInStat(do_.line, nameList, expList, block);
}

function parseForStat(lexer)
{
    let forToken = lexer.nextTokenOfKind(TOKEN_KW_FOR);//确保是for开头
    let ident = lexer.nextIdentifier();//取出循环变量

    if (lexer.lookAhead() == TOKEN_OP_ASSIGN)//如果是等号
    {
        return _finishForNumStat(lexer, forToken.line, ident.token);
    }
    else
    {
        return _finishForInStat(lexer, ident.token);//处理通用for循环
    }
}

function whileStat(exp, block)
{
    let i = {};

    i.type = "WhileStat";

    i.exp = exp;
    i.block = block;

    return i;
}

function parseWhileStat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_WHILE);//确保是while
	let exp = parseExp(lexer);            //解析表达式
	lexer.nextTokenOfKind(TOKEN_KW_DO)    //确保是do
	let block = parseBlock(lexer)            //解析循环体
	lexer.nextTokenOfKind(TOKEN_KW_END)   //确保是end
	return whileStat(exp, block);
}

function repeatStat(block, exp)
{
    let i = {};

    i.type = "RepeatStat";

    i.block = block;
    i.exp = exp;

    return i;
}

function parseRepeatStat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_REPEAT);//确保是repeat
    let block = parseBlock(lexer);
    lexer.nextTokenOfKind(TOKEN_KW_UNTIL);//确保是until
    let exp = parseExp(lexer);
    return repeatStat(block, exp);
}

function breakStat(line)
{
    let i = {};

    i.type = "BreakStat";

    i.line = line;

    return i;
}

function parseBreakStat(lexer)
{
    lexer.nextTokenOfKind(TOKEN_KW_BREAK);//确保是break
	return breakStat(lexer.line);
}

//解析语句
function parseStat(lexer)
{
    switch (lexer.lookAhead()) 
    {
        case TOKEN_KW_IF:
            return parseIfstat(lexer);
            break;

        case TOKEN_KW_FUNCTION:
		    return parseFuncDefStat(lexer);

        case TOKEN_KW_LOCAL:
            return parseLocalAssignOrFuncDefStat(lexer); 
            break;

        case TOKEN_KW_FOR:
            return parseForStat(lexer);
            break;   

        case TOKEN_KW_WHILE:
            return parseWhileStat(lexer);
            break; 
            
        case TOKEN_KW_REPEAT:
            return parseRepeatStat(lexer);
            break;

        case TOKEN_KW_BREAK:
            return parseBreakStat(lexer); 
            break;

        default:
		return parseAssignOrFuncCallStat(lexer);
    }
}

//解析语句
function parseStats(lexer)
{
    let stats = [];
    while(!isBlockEnd(lexer.lookAhead()))
    {
        stats.push(parseStat(lexer));
    }
    //console.log(stats);
    return stats;
}

//解析返回语句
function parseRetExps(lexer)
{
    if (lexer.lookAhead() != TOKEN_KW_RETURN)
    {
        return null;
    }

    lexer.nextToken();//跳过return关键字


    switch (lexer.lookAhead()) {
        case TOKEN_EOF:
        case TOKEN_KW_ELSE:
        //case TOKEN_KW_ELSEIF:
        case TOKEN_KW_UNTIL:
        case TOKEN_KW_END:
            return [];
            break;

        default:
            let exps = parseExpList(lexer);
            return exps;
            break;
    } 
}


//////////////////////////
//代码生成

function newlLocVarInfo(name, prev, slot, captured, scopeLv)
{
    let i = {};

    i.name = name;
    i.prev = prev;
    i.slot = slot;

    i.captured = captured;

    i.scopeLv = scopeLv;

    return i;

}

function newUpvalInfo(localVarSlot, upvalIndex, index)
{
    let i = {};

    i.localVarSlot = localVarSlot;
    i.upvalIndex = upvalIndex;
    i.index = index;

    return i;
}

//辅助代码生成
function newFuncInfo(parent, fd)
{
    let i = {};
    i.usedRegs = 0;//初始寄存器
    i.insts = [];//存储指令的数组
    i.maxRegs = 0;

    i.subFuncs = [];//支持子函数

    //支持局部变量
    i.locVars = [];
    i.locNames = new Map();
    i.scopeLv = 0;

    //支持upvalues
    i.parent = parent;
    i.upvalues = new Map();

    //支持函数带参数
    i.numParams = fd.parList.length;

    //支持break语句
    i.breaks = [];

    i.addLocVar = function(name)
    {
        let newVar = newlLocVarInfo(name, i.locNames.get(name),
                                    i.allocReg(), false, i.scopeLv);
        i.locVars.push(newVar);

        i.locNames.set(name, newVar);

        return newVar.slot;
    }

    i.slotOfLocVar = function(name)
    {
        let j;

        if ((j = i.locNames.get(name)) != undefined)
        {
            return j.slot;
        }

        return -1;
    }

    //寄存器分配
    i.allocReg = function ()
    {
        i.usedRegs++;

        if (i.usedRegs >= 255)
        {
            throw "too many registers";
        }

        if (i.usedRegs > i.maxRegs)
        {
            i.maxRegs = i.usedRegs;
        }

        return i.usedRegs - 1;
    }

    //分配多个寄存器
    i.allocRegs = function(n)
    {
        if (n <= 0)
        {   
            throw "i.allocRegs n <= 0";
        }

        for (let j = 0; j < n; j++)
        {
            i.allocReg();
        }

        return i.usedRegs - n;
    }

    //释放一个寄存器
    i.freeReg = function()
    {
        i.usedRegs--;
    }

    //寄存器释放
    i.freeRegs = function(n)
    {
        for (let j = 0; j < n; j++)
        {
            i.freeReg();
        }
    }
    
    //常量表
    i.constants = new Map();

    //k为map的key，代表常量名
    i.indexOfConstant = function(k)
    {
        //如果常量名存在，返回常量索引
        let idx;
        if ((idx = i.constants.get(k)) != undefined)
        {
            return idx;
        }

        //如果键不存在，创建键值对
        idx = i.constants.size;

        i.constants.set(k, idx);

        console.log("i.constants:", i.constants);

        return idx;
    }

    //最终生成指令的函数
    i.emitABC = function(opcode, a, b, c)
    {
        let inst_ = b << 23 | c << 14 | a << 6 | opcode;
        i.insts.push(inst_);
    }

    i.emitABx = function(opcode, a, bx)
    {
        let inst_ = bx << 14 | a << 6 | opcode;
        i.insts.push(inst_);
    }

    i.emitAsBx = function(opcode, a, b)
    {
        let inst_ = (b + MAXARG_sBx) << 14 | a << 6 | opcode;
        i.insts.push(inst_);
    }

    i.emitAx = function(opcode, ax)
    {
        let inst_ = ax << 6 | opcode;
        i.insts.push(inst_);
    }

    //返回当前指令地址
    i.pc = function()
    {
        return i.insts.length - 1;
    }

    //修复jmp指令,跳转地址
    i.fixSbx = function(pc, sBx)
    {
        let inst_ = i.insts[pc];
        //console.log("old");
        //printOperands(inst(inst_));
        inst_ = inst_ & 0x3fff;
        inst_ = inst_ | ((sBx + MAXARG_sBx) << 14);
        //console.log("new jmp:");
        //printOperands(inst(inst_));
        i.insts[pc] = inst_;
    }

    //剩下的函数
    i.emitGetTabUp = function(a, b, varName)
    {
        let idx = i.indexOfConstant(varName);

        console.log("emitGetTabUp", varName, idx, i.constants);

        idx = idx | 0x100;

        i.emitABC(OP_GETTABUP, a, b, idx);
    }

    i.emitJmp = function(a, sBx)
    {
        i.emitAsBx(OP_JMP, a, sBx);
        return i.insts.length - 1;
    }

    i.emitLoadBool = function(a, b, c)
    {
        i.emitABC(OP_LOADBOOL, a, b, c);
    }
    
    i.emitBinaryOp = function(op, a, b, c)
    {
        if (op == TOKEN_OP_ADD)
        {
            i.emitABC(OP_ADD, a, b, c);
            return;
        }
        else if (op == TOKEN_OP_EQ)
        {
            i.emitABC(OP_EQ, 1, b, c);
        }
        else if (op == TOKEN_OP_LE)
        {
            i.emitABC(OP_LE, 1, b, c);
        }
        else if (op == TOKEN_OP_LT)
        {
            i.emitABC(OP_LT, 1, b, c);
        }
        else if (op == TOKEN_OP_GE)
        {
            i.emitABC(OP_LE, 1, c, b);
        }
        else if (op == TOKEN_OP_GT)
        {
            i.emitABC(OP_LT, 1, c, b);
        }

        i.emitJmp(0, 1);
        i.emitLoadBool(a, 0, 1);
        i.emitLoadBool(a, 1, 0);
    }

    i.emitLoadK = function(a, k)
    {
        let idx = i.indexOfConstant(k);

        if (idx < (1 << 18)) 
        {
            i.emitABx(OP_LOADK, a, idx)
        } 
        else 
        {
            throw "emitLoadK error";
        }
    }

    i.emitTest = function(a, c)
    {
        i.emitABC(OP_TEST, a, 0, c);
    }

    i.emitCall = function(a, nArgs, nRet)
    {
        i.emitABC(OP_CALL, a, nArgs+1, nRet+1);
    }

    i.emitReturn = function(a, n)
    {
        i.emitABC(OP_RETURN, a, n+1, 0);
    }

    i.emitClosure = function(a, bx)
    {
        i.emitABx(OP_CLOSURE, a, bx);
    }

    i.emitSetTabUp = function(a, b, c)
    {
        i.emitABC(OP_SETTABUP, a, b, c);
    }

    i.emitMove = function(a, b)
    {
        i.emitABC(OP_MOVE, a, b, 0);
    }

    i.emitLoadNil = function(a, n)
    {
        i.emitABC(OP_LOADNIL, a, n-1, 0);
    }

    i.emitGetTable = function(a, b, c)
    {
        i.emitABC(OP_GETTABLE, a, b, c);
    }

    i.emitNewTable = function(a, nArr, nRec)
    {
        i.emitABC(OP_NEWTABLE, a, int2fb(nArr), int2fb(nRec));
    }

    i.emitSetTable = function(a, b, c)
    {
        i.emitABC(OP_SETTABLE, a, b, c)
    }

    i.emitSetList = function(a, b, c)
    {
        i.emitABC(OP_SETLIST, a, b, c);
    }

    i.emitForPrep = function(a, sBx)
    {
        i.emitAsBx(OP_FORPREP, a, sBx);
        return i.insts.length - 1;
    }

    i.emitForLoop = function(a, sBx)
    {
        i.emitAsBx(OP_FORLOOP, a, sBx);
        return i.insts.length - 1;
    }

    i.emitTForCall = function(a, c)
    {
        i.emitABC(OP_TFORCALL, a, 0, c);
    }

    i.emitTForLoop = function(a, sbx)
    {
        i.emitAsBx(OP_TFORLOOP, a, sbx);
    }

    i.emitSetUpval = function(a, b)
    {
        i.emitABC(OP_SETUPVAL, a, b, 0);
    }

    i.emitSelf = function(a, b, c)
    {
        i.emitABC(OP_SELF, a, b, c);
    }

    i.emitTestSet = function(a, b, c)
    {
        i.emitABC(OP_TESTSET, a, b, c)
    }

    ////////////////////////////////
    //创建Upvalues
    i.getUpvalues = function()
    {
        let upvals = [];

        for (let item of i.upvalues.keys())
        {
            let slot;
            let upvalIndex = i.upvalues.get(item).upvalIndex;

            if ((slot = i.upvalues.get(item).localVarSlot) >= 0)//如果绑定的是父的局部变量
            {
                upvals.push({Instack:1, Idx:slot});
            }   
            else
            {
                upvals.push({Instack:0, Idx:upvalIndex});//如果绑定的是父的upvalue
            }
        }

        return upvals;
    }

    i.getConstants = function()
    {
        let consts = [];
        //从map中得到从0开始的值
        let current = 0;

        for (let j = 0; j < i.constants.size; j++)
        {
            for (let item of i.constants.keys())
            {
                if (i.constants.get(item) == current)
                {
                    consts.push(item);
                    current++;
                    break;
                }
                
            }
        }

        return consts;
    }

    i.toProtos = function(fis)
    {
        let protos = [];
        for (let j = 0; j < fis.length; j++)
        {
            protos.push(fis[j].toProto());
            let fi = fis[j];
            for (let k = 0; k < fi.insts.length; k++)
            {
                let code = fi.insts[k];
                let ii = inst(code)
                
                printOperands(ii);
            }
            
        }
        console.log("protos:", protos);
        return protos;
    }

    //从fi生成支持虚拟机运行的proto
    i.toProto = function()
    {
        return {
            Source : "",
            LineDefined : 0,
            LastLineDefined : 0,
            NumParams : i.numParams,//修改这，支持函数带参数
            IsVararg : 0,
            MaxStackSize : i.maxRegs,
            Code : i.insts,
            Constants : i.getConstants(),
            Upvalues : i.getUpvalues(),
            Protos : i.toProtos(i.subFuncs),
            LineInfo : [],
            LocVars : [],
            UpvalueNames : []
        };
    }

    i.indexOfUpval = function(name)
    {
        let upval;
        if ((upval = i.upvalues.get(name)) != undefined)
        {
            //如果变量名和upvalues绑定了，直接返回
            return upval.index;
        }

        if (i.parent != null)
        {
            //只有父fi不为null，可以执行这
            let locVar;
            if ((locVar = i.parent.locNames.get(name)) != undefined)
            {
                //如果这个变量是父的局部变量
                let idx = i.upvalues.size;
                i.upvalues.set(name, newUpvalInfo(locVar.slot, -1, idx));//绑定变量名和变量的lua栈值
                
                locVar.captured = true;//设置被捕获标志

                return idx;
            }

            //如果这个变量不是父的变量，可能是祖父的变量,会被父捕获
            let uvIdx;
            if ((uvIdx = i.parent.indexOfUpval(name)) >= 0)
            {
                let idx = i.upvalues.size;
                i.upvalues.set(name, newUpvalInfo(-1, uvIdx, idx));//记录父捕获的index

                return idx;
            }
        }

        return -1;
    }

    i.emitGetUpval = function(a, b)
    {
        i.emitABC(OP_GETUPVAL, a, b, 0);
    }

    i.enterScope = function(breakable)
    {
        i.scopeLv++;

        if (breakable)
        {
            i.breaks.push([]);
        }
        else
        {
            i.breaks.push(null);
        }
    }

    i.addBreakJmp = function(pc)
    {
        for (let j = i.scopeLv; j >= 0; j--)
        {
            if (i.breaks[j] != null)
            {
                i.breaks[j].push(pc);
                return;
            }
        }
        throw "break error";
    }

    i.exitScope = function()
    {
        let pendingBreakJmps = i.breaks[i.breaks.length-1];
        //这个数组中如果有值，则是addBreakJmp添加的

        i.breaks.pop();//去掉处理过的元素

        let a = 0;
        
        if (pendingBreakJmps != null)
        {
            for (let j = 0; j < pendingBreakJmps.length; j++)
            {
                let pc = pendingBreakJmps[j];

                let sbx = i.pc() - pc;//确定跳转到循环结束的长度

                let inst = ((sbx + MAXARG_sBx) << 14) | a << 6 | OP_JMP;
                
                i.insts[pc] = inst;
            }
        }
        
        //////////////////////////////////////////
        i.scopeLv--;
        for (let item of i.locNames.keys())
        {
            let locVar = i.locNames.get(item);

            if (locVar.scopeLv > i.scopeLv)
            {
                i.removeLocVar(locVar);
            }
        }
    }

    i.removeLocVar = function(locVar)
    {
        i.freeReg();//释放变量占用的寄存器
        if (locVar.prev == undefined)
        {
            i.locNames.delete(locVar.name);//删除这个变量
        }
        else if (locVar.prev.scope == locVar.scopeLv)
        {
            //如果当前作用域有多个同名局部变量，则全部释放
            i.removeLocVar(locVar.prev);
        }
        else
        {
            i.locNames.set(locVar.name, locVar.prev);//指向前作用域的变量
        }
    }

    i.getJmpArgA = function()
    {
        let hasCapturedLocVars = false;//假设没有局部变量被捕获
        let minSlotOfLocVars = i.maxRegs;//maxRegs为最大的局部变量lua栈索引

        //遍历所有变量名，找到被捕获的变量
        for (let item of i.locNames.keys())
        {
            let locVar = i.locNames.get(item);

            if (locVar.scopeLv == i.scopeLv)
            {
                for (let v = locVar;v != undefined && v.scopeLv == i.scopeLv; v = v.prev)//如果有多个同名变量
                {
                    if (v.captured)//如果其中有一个被捕获，则确定被捕获
                    {
                        hasCapturedLocVars = true;
                    }

                    if (v.slot < minSlotOfLocVars && v.name[0] != '(')
                    {
                        minSlotOfLocVars = v.slot;//寻找最小的slot，关闭尽量少的局部变量
                    }
                }
            }
        }

        if (hasCapturedLocVars)
        {
            return minSlotOfLocVars + 1;
        }
        else
        {
            return 0;//无局部变量需要关闭
        }
    }

    i.closeOpenUpvals = function()
    {
        let a = i.getJmpArgA();

        if (a > 0)
        {
            i.emitJmp(a, 0);
        } 
    }

    return i;
}

function cgRetStat(fi, retExps)
{
    let len = retExps.length;

    if (len == 0)
    {
        fi.closeOpenUpvals();
        fi.emitReturn(0, 0);
    }
    else if (len == 1)
    {
        //1个返回值
        let r = fi.allocReg();
        cgExp(fi, retExps[0], r, 1);//1代表如果是函数调用，有1个返回值
        fi.freeReg();
        fi.closeOpenUpvals();
        fi.emitReturn(r, len);//生成返回指令
    }

    //对于多个返回值
    for (let i = 0; i < len; i++)
    {
        let retExp = retExps[i];

        let r = fi.allocReg();

        cgExp(fi, retExp, r, 1);
    }

    fi.freeRegs(len);

    let a = fi.usedRegs;

    fi.emitReturn(a, len);//将多个参数都按个数全部压栈
}

function cgBinopExp(fi, node, a)
{
    let b;
    let c;

    switch (node.op) 
    {
        case TOKEN_OP_OR:
            b = fi.allocReg();
            cgExp(fi, node.exp1, b, 1);
            fi.freeReg();

            fi.emitTestSet(a, b, 1);

            let pcOfJmp = fi.emitJmp(0, 0);

            b = fi.allocReg();
            cgExp(fi, node.exp2, b, 1);
            fi.freeReg();

            fi.emitMove(a, b);
            fi.fixSbx(pcOfJmp, fi.pc()-pcOfJmp);
            break;

        default:
            b = fi.allocReg();
            cgExp(fi, node.exp1, b, 1);

            c = fi.allocReg();
            cgExp(fi, node.exp2, c, 1);

            fi.emitBinaryOp(node.op, a, b, c);

            fi.freeRegs(2);
            break;
    }
}

function tableAccessExp(lastLine, prefixExp, keyExp)
{
    let i = {};

    i.lastLine = lastLine;
    i.prefixExp = prefixExp;
    i.keyExp = keyExp;

    i.type = "TableAccessExp";

    return i;
}

function stringExp(line, str)
{
    let i = {};

    i.line = line;
    i.str = str;

    i.type = "StringExp";

    return i;
}

function falseExp(line)
{
    let i = {};

    i.line = line;

    i.type = "FalseExp";

    return i;
}


// function trueExp(line)
// {
//     let i = {};

//     i.line = line;

//     i.type = "TrueExp";

//     return i;
// }


function nilExp(line)
{
    let i = {};

    i.line = line;

    i.type = "NilExp";

    return i;
}

function cgNameExp(fi, node, a)
{
    let r;
    if ((r = fi.slotOfLocVar(node.name)) >= 0)
    {
        //局部变量
        fi.emitMove(a, r);
    }
    else if((r = fi.indexOfUpval(node.name)) >= 0)
    {
        //upvalues
        fi.emitGetUpval(a, r);
    }
    else
    {
        //全局变量 GETTABUP
        //先访问_ENV变量，使得main中捕获这个变量
        //r = fi.indexOfUpval("_ENV");
        //fi.emitGetTabUp(a, r, node.name);
        let taExp = tableAccessExp(0, nameExp(0, "_ENV"), 
                                    stringExp(0, node.name));

        cgTableAccessExp(fi, taExp, a);
    } 
}

function prepFuncCall(fi, node, a)
{
    //console.log("node:", node);
    let nArgs = node.args.length;

    cgExp(fi, node.prefixExp, a, 1);//加载函数

    if (node.nameExp != null)
    {
        let c = 0x100 + fi.indexOfConstant(node.nameExp.str);
        fi.emitSelf(a, a, c);

        fi.allocReg();//留给表格
    }

    for (let i = 0; i < nArgs; i++)
    {
        let arg = node.args[i];

        let tmp = fi.allocReg();

        cgExp(fi, arg, tmp, 1);//加载函数参数，1代表1个返回值
    }


    if (node.nameExp != null)
    {
        nArgs++;
    }

    fi.freeRegs(nArgs);

    return nArgs;
}

function cgFuncCallExp(fi, node, a, n)
{
    let nArgs = prepFuncCall(fi, node, a);
    fi.emitCall(a, nArgs, n);//生成call指令
}

//生成函数定义语句
function cgFuncDefExp(fi, node, a)
{
    console.log("cgFuncDefExp:", node);
    let subFi = newFuncInfo(fi, node);//生成子fi，最终用于生成子proto

    fi.subFuncs.push(subFi);

    for (let i = 0; i < node.parList.length; i++)
    {
        let par = node.parList[i];

        subFi.addLocVar(par);
    }

    cgBlock(subFi, node.block);//生成函数内部语句;

    //subFi.closeOpenUpvals();

    subFi.emitReturn(0, 0);//在block指令后添加return语句

    let bx = fi.subFuncs.length - 1;

    fi.emitClosure(a, bx);//生成closure语句
}

function cgTableAccessExp(fi, node, a)
{
    //新增指令GATTABLE
    let b = fi.allocReg();
    cgExp(fi, node.prefixExp, b, 1);//得到表

    let c = fi.allocReg();
    cgExp(fi, node.keyExp, c, 1);//得到表的键，用LoadK从常量表中加载

    fi.emitGetTable(a, b, c);
    fi.freeRegs(2);
}

function int2fb(x)
{
    let e = 0;

    if (x < 8)
    {
        return x;
    }

    while(x >= (8 << 4))
    {
        x = (x + 0xf) >> 4;
        e += 4;
    }

    while(x >= (8 << 1))
    {
        x = (x + 1) >> 1;
        e++;
    }

    return ((e + 1) << 3) | (x - 8);
}

function fb2int(x)
{
    if (x < 8)
    {
        return x;
    }
    else
    {
        return ((x & 7) + 8) << (((x & 0xff) >> 3) - 1);
    }
}

function cgTableConstructorExp(fi, node, a)
{
    let nArr = 0;
    for (let i = 0; i < node.keyExps.length; i++)
    {
        if (node.keyExps[i] == null)
        {
            nArr++;//计算有多少项要保存到数组中
        }
    }

    fi.emitNewTable(a, nArr, node.keyExps.length - nArr);//nArr保存到数组中，剩下用map实现

    let arrIdx = 0;

    for (let i = 0; i < node.keyExps.length; i++)
    {
        let keyExp = node.keyExps[i];//取出值,为stringExp类型
        let valExp = node.valExps[i];//取出值


        if (keyExp == null)
        {
            //只有value，没有key
            //保存在数组中
            arrIdx++;

            let tmp = fi.allocReg();
            cgExp(fi, valExp, tmp, 1);//表达式求值

            if (arrIdx % 50 == 0 || arrIdx == nArr) 
            {
                //如果大于50，每50次处理一次，如果小于50，按实际次数处理
				let n = arrIdx % 50;

				if (n == 0) 
                {
					n = 50;
				}

				fi.freeRegs(n);

				let c = (arrIdx-1)/50 + 1;

				fi.emitSetList(a, n, c);
			}
            continue;
        }

        //key:value类型
        let b = fi.allocReg();
        cgExp(fi, keyExp, b, 1);

        let c = fi.allocReg();
        cgExp(fi, valExp, c, 1);

        fi.freeRegs(2);

        fi.emitSetTable(a, b, c);
    }
}

//解析表达式
function cgExp(fi, exp, a, n)
{
    switch (exp.type) {
        case "IntegerExp":
            fi.emitLoadK(a, exp.val);
            break;

        case "FloatExp":
            fi.emitLoadK(a, exp.val);
            break;

        case "TrueExp":
            fi.emitLoadBool(a, 1, 0);
            break;

        case "BinopExp":
            cgBinopExp(fi, exp, a);
            break;

        case "NameExp":
            cgNameExp(fi, exp, a);
            break;

        case "FuncCallExp":
            cgFuncCallExp(fi, exp, a, n);
            break;

        case "StringExp":
            fi.emitLoadK(a, exp.str);
        break;

        case "TableAccessExp":
            cgTableAccessExp(fi, exp, a);
        break;

        case "FuncDefExp":
		    cgFuncDefExp(fi, exp, a);
            break;

        case "TableConstructorExp":
            cgTableConstructorExp(fi, exp, a);
            break;

        case "NilExp":
            fi.emitLoadNil(a, n);
            break;

        case "FalseExp":
            fi.emitLoadBool(a, 0, 0);
            break;

        case "TrueExp":
            fi.emitLoadBool(a, 1, 0)
            break;

        default:
            break;
    }
}

function cgIfStat(fi, node)
{
    let pcJmpToEnd = new Array(node.exps.length);//跳转到if语句结束处
    let pcJmpToNextExp = -1;

    for (let i = 0; i < node.exps.length; i++)
    {
        let exp = node.exps[i];

        if (pcJmpToNextExp >= 0)
        {
            //console.log("fixSbx", pcJmpToNextExp ,fi.pc() - pcJmpToNextExp);
            fi.fixSbx(pcJmpToNextExp, fi.pc() - pcJmpToNextExp);
        }

        let r = fi.allocReg();//分配lua寄存器

        cgExp(fi, exp, r, 1);//生成表达式相关语句

        fi.freeReg()//回收寄存器

        fi.emitTest(r, 0);//生成测试语句，测试表达式是否为真

        pcJmpToNextExp = fi.emitJmp(0, 0);//生成jmp语句

        fi.enterScope(false);
        cgBlock(fi, node.blocks[i]);
        fi.closeOpenUpvals();
        fi.exitScope();

        if (i < node.exps.length - 1)
        {
            pcJmpToEnd[i] = fi.emitJmp(0, 0)//执行完block语句后跳转到if语句结束处
        }
        else
        {
            pcJmpToEnd[i] = pcJmpToNextExp;
        }
    }

    for (let i = 0; i < pcJmpToEnd.length; i++)
    {
        let pc = pcJmpToEnd[i];

        fi.fixSbx(pc, fi.pc() - pc);
    }
}

//生成函数调用指令
function cgFuncCallStat(fi, node)
{
    let r = fi.allocReg();
    cgFuncCallExp(fi, node, r, 0);//0代表无返回值
    fi.freeReg();
}

function _cgAssignStat(expNum, returnNum, varStartNum, varEndNum, giveNull, fi, node)
{
    let func;

    let n = returnNum;

    let a;

    let oldRegs = fi.usedRegs;

    if (giveNull == false)
    {
        func = node.expList[expNum];
        
        a = fi.allocReg();
        cgExp(fi, func, a, n);//处理FuncDefExp类型，生成closure语句||
            //处理数字类型，生成loadk指令
        //再分配n-1个寄存器占用lua栈的位置，防止TableAccessExp覆盖
        if (n - 1 > 0)
        {
            fi.allocRegs(n - 1);
        }
    }
    else
    {
        //表达式不是函数调用，不够填充变量，需要人为创造null
        a = fi.allocRegs(n);
        fi.emitLoadNil(a, n);
    }

    a--;
    for (let i = varStartNum; i <= varEndNum; i++)
    {
        let var_ =  node.varList[i];

        a++;
        
        if (var_.type == "TableAccessExp")
        {
            //如果是表访问表达式
            let t = fi.allocReg();
            cgExp(fi, var_.prefixExp, t, 1);//得到表变量

            let k = fi.allocReg();
            cgExp(fi, var_.keyExp, k, 1);//得到键

            //设置表t的k键值为func的值
            fi.emitSetTable(t, k, a);
            fi.freeReg();
            fi.freeReg();
            
            continue;
        }

        let r;

        if (var_.type == "NameExp")
        {
            //如果是全局变量
            if (fi.slotOfLocVar(var_.name) < 0 && fi.indexOfUpval(var_.name) < 0)
            {
                ///////////////////////////////////////////////////////
                //常规全局变量
                // //手动调用，否则无法绑定全局表
                //fi.freeReg(); 
                let upvalueIdx = fi.indexOfUpval("_ENV");

                //生成settapup语句
                //查找var_在常量表的索引
                let index = fi.indexOfConstant(var_.name);
                index |= 0x100;//转换为常量表索引

                fi.emitSetTabUp(upvalueIdx, index, a);
                ///////////////////////////////////////////////////////
            }
            else if ((r = fi.slotOfLocVar(var_.name)) >= 0)
            {
                //局部变量
                //fi.freeReg(); 
                fi.emitMove(r, a);
            }
            else if((r = fi.indexOfUpval(var_.name)) >= 0)
            {
                //upvalues
                //fi.freeReg();
                //将值写给upval
                fi.emitSetUpval(a, r);
            }
        }
    }

    fi.usedRegs = oldRegs;
}

//赋值语句
function cgAssignStat(fi, node)
{   
    if (node.expList.length == 1)
    {
        _cgAssignStat(0, node.varList.length,
                     0, node.varList.length - 1, false, fi, node);
    }
    else
    {
        //多个表达式的情况，一个表达式一个表达式的处理
        //对于不是最后一个表达式，要求函数只返回一个变量
        //对于最后一个表达式，匹配剩下的所有变量
        if (node.varList.length >= node.expList.length)
        {
            //变量值大于等于表达式
            let cnt = 0;
            for(let i = 0; i < node.expList.length; i++)
            {
                if (i == node.expList.length - 1)
                {
                    //最后一个表达式
                    //如果是函数表达式
                    let exp = node.expList[i];
                    if (exp.type == "FuncCallExp")
                    {
                        _cgAssignStat(i, node.varList.length - cnt, 
                            cnt, node.varList.length - 1, false, fi, node);
                    }
                    else
                    {
                        _cgAssignStat(i, node.varList.length - cnt, 
                            cnt, cnt, false, fi, node);//将最后一个表达式写入变量中
                        
                        //如果还有多余的变量没有赋值
                        if (node.varList.length > node.expList.length)
                        {
                            //创建null，并写入
                            _cgAssignStat(i, node.varList.length - cnt, 
                                cnt + 1, node.varList.length - 1, true, fi, node);
                        }
                        
                    }
                }
                else
                {
                    _cgAssignStat(i, 1, cnt, cnt, false, fi, node);
                    cnt++;
                }
            }
        }
        else
        {
            //变量个数小于表达式个数
            //不去执行多余的表达式
            let cnt = 0;
            for(let i = 0; i < node.expList.length; i++)
            {
                if (cnt >= node.varList.length)
                {
                    let a = fi.allocReg();
                    cgExp(fi, node.expList[i], a, 1);
                    fi.freeReg();
                }
                else
                {
                    _cgAssignStat(i, 1, cnt, cnt, false, fi, node);
                }

                cnt++;
            }
        }
        
    }
}

function cgLocalVarDeclStat(fi, node)
{
    //现在支持多个变量了
    let nameLength = node.nameList.length;
    let expLength = node.expList.length;

    if (nameLength == expLength)
    {
        for (let i = 0; i < node.nameList.length; i++)
        {
            let exp = node.expList[i];
            let name = node.nameList[i];
    
            if (exp != undefined)
            {
                let a = fi.allocReg();
    
                cgExp(fi, exp, a, 1);//生成loadK指令载入数字2
    
                fi.freeReg();
            }
            else
            {
                //生成一条loadNil指令
                let a = fi.allocReg();
                fi.emitLoadNil(a, 1);
                fi.freeReg();
            }
        
            fi.addLocVar(name);//添加局部变量到局部变量表
        }
    }
    else if (nameLength > expLength)
    {
        //name长为3，exp长为1
        //求出exp的返回值并赋值给name
        let exp = node.expList[0];

        let a = fi.allocReg();//分配一个变量

        let n = nameLength - expLength + 1;//返回3个变量
        cgExp(fi, exp, a, n);

        fi.allocRegs(n-1);//再分配3-1=2个变量

        fi.freeRegs(n);

        for (let i = 0; i < node.nameList.length; i++)
        {
            let name = node.nameList[i];
            fi.addLocVar(name);
        }
    }
    else
    {
        throw "cgLocalVarDeclStat error";
    }
}

function cgForNumStat(fi, node)
{
    fi.enterScope(true);

    //创建三个local变量
    cgLocalVarDeclStat(fi, newLocalValDeclStat(0,["(for index)", "(for limit)", "(for step)"],
                                               [node.initExp, node.limitExp, node.stepExp]));
    
    fi.addLocVar(node.varName);//创建for循环变量i

    let a = fi.usedRegs - 4;//指向"(for index)"变量
	let pcForPrep = fi.emitForPrep(a, 0);

	cgBlock(fi, node.block);
	fi.closeOpenUpvals();
	let pcForLoop = fi.emitForLoop(a, 0);

	fi.fixSbx(pcForPrep, pcForLoop-pcForPrep-1);//从FORPREP指令跳转到FORLOOP指令
	fi.fixSbx(pcForLoop, pcForPrep-pcForLoop);//从FORLOOP指令跳转到FORPREP下一条指令

    fi.exitScope();
}

function cgWhileStat(fi, node)
{
    let pcBeforeExp = fi.pc();

    let r = fi.allocReg();
    cgExp(fi, node.exp, r, 1);//表达式求值
    fi.freeReg();

    fi.emitTest(r, 0);//测试表达式的值

    let pcJmpToEnd = fi.emitJmp(0, 0);//条件不满足跳转到while的下一条指令执行

    fi.enterScope(true);
    cgBlock(fi, node.block);
    fi.closeOpenUpvals();
    fi.emitJmp(0, pcBeforeExp-fi.pc()-1);//跳回到表达式求值语句，再次计算表达式的值

    fi.exitScope();

    fi.fixSbx(pcJmpToEnd, fi.pc()-pcJmpToEnd);//修正pcJmpToEnd，保证跳转到while的下一条语句
}

function cgForInStat(fi, node)
{
    fi.enterScope(true);

    cgLocalVarDeclStat(fi, newLocalValDeclStat(0,
		["(for generator)", "(for state)", "(for control)"],
		node.expList)
	);//定义三个局部变量，expList为一个函数表达式，返回三个变量

     for (let i = 0; i < node.nameList.length; i++)
     {
        let name = node.nameList[i];
        fi.addLocVar(name);//生成局部变量
     }

     let pcJmpToTFC = fi.emitJmp(0, 0);//跳转到TFORCALL指令处执行

     cgBlock(fi, node.block);

     fi.closeOpenUpvals();

     fi.fixSbx(pcJmpToTFC, fi.pc()-pcJmpToTFC);

     let rGenerator = fi.slotOfLocVar("(for generator)");
     fi.emitTForCall(rGenerator, node.nameList.length);//生成TFORCALL指令
     fi.emitTForLoop(rGenerator+2, pcJmpToTFC-fi.pc()-1);//生成TFORLOOP指令

     fi.exitScope();
}

function cgRepeatStat(fi, node)
{
    fi.enterScope(true);

    let pcBeforeBlock = fi.pc();//用来循坏跳回来

    cgBlock(fi, node.block);

    let r = fi.allocReg();
    cgExp(fi, node.exp, r, 1);
    fi.freeReg();

    fi.emitTest(r, 0);
    fi.emitJmp(0, pcBeforeBlock-fi.pc()-1);
    //fi.closeOpenUpvals();
    fi.exitScope();
}

function cgBreakStat(fi, node)
{
    let pc = fi.emitJmp(0, 0);
	fi.addBreakJmp(pc);
}

function cgLocalFuncDefStat(fi, node)
{
    let r = fi.addLocVar(node.name);

    cgFuncDefExp(fi, node.exp, r);
}

function cgStat(fi, stat)
{
    switch (stat.type) {
        case "IfStat":
            cgIfStat(fi, stat);
            break;

        case "AssignStat":
		    cgAssignStat(fi, stat);
            break;

        case "FuncCallExp":
            cgFuncCallStat(fi, stat);
            break;

        case "LocalValDeclStat":
            cgLocalVarDeclStat(fi, stat);
            break;

        case "ForNumStat":
            cgForNumStat(fi, stat);
            break;

        case "WhileStat":
            cgWhileStat(fi, stat);
            break;

        case "ForInStat":
            cgForInStat(fi, stat);
            break;

        case "RepeatStat":
            cgRepeatStat(fi, stat);
            break;

        case "BreakStat":
            cgBreakStat(fi, stat);
            break;

        case "LocalFuncDefStat":
            cgLocalFuncDefStat(fi, stat);
            break;

        default:
            throw "cgStat error";
            break;
    }
}

function cgBlock(fi, blockNode)
{
    for (let i = 0; i < blockNode.stats.length; i++)
    {
        let stat = blockNode.stats[i];
        cgStat(fi, stat);
    }

    if (blockNode.retExps != null)
    {
        cgRetStat(fi, blockNode.retExps);//解析return语句
    }
}
///////////////////////////////////////////////////////////////////////////

function luaMain()
{
    let file = lua.readfile("luac.out");

    file.then(fileData =>{
        // if (fileData != "")
        // {
        //     let proto = unDump(fileData);
    
        //     list(proto);
        // }

        ls = newLuaState();//创建state
        fileData_ = fileData;
        //ls.register("print", print);//注册print函数

        // let a = 1;
        // let b = 0;

        // ls.pushInteger(a);//入栈一个整数
        // ls.setGlobal("a");  //将栈顶的数据出栈到lua全局变量区，并且赋给一个变量名"a"

        // ls.pushInteger(b);//入栈一个整数
        // ls.setGlobal("b");  //将栈顶的数据出栈到lua全局变量区，并且赋给一个变量名"b"

        ////////////////////////////////////////////////////////////
        ls.register("setValue", setValue);//注册setValue函数

        let button = '{"type":"button","name":"buttonAlarm","device_id":[1],"variable":[4],"value":[0],"x":120,"y":0}';

        let buttonAlarm = jsonParse(button);

        //console.log(buttonAlarm);

        ls.pushInteger(buttonAlarm);//入栈一个整数
        ls.setGlobal("buttonAlarm");
        
    });
    
}

//luaMain();

function parse(lexer)
{
    let ast = parseBlock(lexer);

    console.log("ast", ast);

    let fd = funcDefExp(0, 0, [], false, ast);//手工定义main函数
    let fi = newFuncInfo(null, fd);//定义最外层fi

    fi.addLocVar("_ENV");//添加_ENV变量

    cgFuncDefExp(fi, fd, 0);//手工调用生成函数虚拟机指令

    for (let i = 0; i < fi.subFuncs[0].insts.length; i++)
    {
        let code = fi.subFuncs[0].insts[i];
        let ii = inst(code)
        
        printOperands(ii);
    }
    
    return fi.subFuncs[0].toProto();//main函数被解析为fi的唯一子函数，直接调用main函数
}

export function initLua()
{
    // let file = lua.readfile("alarmOrNot-onlyif.lua");

    // function ab2str(buf) {
    //     return String.fromCharCode.apply(null, new Uint16Array(buf));
    // }

    // file.then(fileData =>{
        
    // })

    // let str = ab2str(fileData);

    // let lexer = newLexer(str, "alarmOrNot-onlyif.lua");

    //proto_ = parse(lexer);
    //console.log("initLua ok");

    ls = newLuaState();//创建state
    //fileData_ = fileData;

    ls.register("setValue", setValue);//注册setValue函数
    ls.register("print", print);//注册print函数

    ls.register("next", next);//注册next函数
    ls.register("pairs", pairs);//注册pairs函数

    ls.register("error", error);//注册error函数
    ls.register("pcall", pcall);//注册pcall函数

    ls.register("setmetatable", setMetaTable);//注册setMetaTable函数

    //test for button color
    // ls.pushInteger(0);//入栈一个整数
    // ls.setGlobal("buttonState");

    // let color = {
    //     type:'color',
    //     color:{color:'0'}
    // };

    // ls.pushInteger(color);//入栈一个整数
    // ls.setGlobal("color");

    return ls;
}


export function luaParse(codeString)
{
    let lexer = newLexer(codeString, "ignoreName");

    proto_ = parse(lexer);
}
// exports.initLua = initLua;
// exports.luaParse = luaParse;
//lexerTokens();
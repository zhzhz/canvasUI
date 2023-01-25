import {drawCtx} from './render';
import {xml2js} from '#preload';
import {initLua, luaParse, runLua} from '../lib/lua';

//得到控件的全局id号
let idCnt = -1;
export function getID()
{
    return ++idCnt;
}

const upControl:any = [];

//canvas的描述参数

const canvasInfo:any = {left:0, top:0, width:0, height:0};

export function initUpControlArray(width:number, height:number)
{
    canvasInfo.width = width;
    canvasInfo.height = height;

    for (let i = 0; i < width; i++)
    {
        upControl[i] = new Array(height);
    }
}

function max(p1:number, p2:number)
{
    if (p1 >= p2)
    {
        return p1;
    }
    else
    {
        return p2;
    }
}

function getIntersectRect(baseRect:any, rect2:any)
{
    //计算两个矩形相交的矩形
    const rect:any = {left:-1, top:-1, Width:-1, Height:-1};

    //计算两个矩形的right参数
    const baseRectRight:number = baseRect.left + baseRect.width;
    const rect2Right:number = rect2.left + rect2.width;

    const baseRectBottom:number = baseRect.top + baseRect.height;
    const rect2Bottom:number = rect2.top + rect2.height;

    //无接触情况
    if (rect2.left > baseRectRight)
    {
        return rect;
    }

    if (rect2Right < baseRect.left)
    {
        return rect;
    }

    if (rect2Bottom < baseRect.top)
    {
        return rect;
    }

    if (rect2.top > baseRectBottom)
    {
        return rect;
    }

    //有接触情况

    //计算left
    const left:number = max(baseRect.left, rect2.left);

    //计算top
    const top:number = max(baseRect.top, rect2.top);

    let width:number;

    //计算width
    if (rect2Right <= baseRectRight)
    {
        width = rect2Right - left;
    }
    else
    {
        width = baseRectRight - left;
    }

    //计算hright
    let height:number;

    if (rect2Bottom <= baseRectBottom)
    {
        height = rect2Bottom - top;
    }
    else
    {
        height = baseRectBottom - top;
    }

    return {left, top, width, height};
}

export function fillUpControlArray(left:number, top:number, width:number, height:number, controlID:number)
{
    //比较canvas和要画的矩形，得出他们的
    const fillRect:any = {left, top, width, height};
    const rect = getIntersectRect(canvasInfo, fillRect);

    //console.log("fillUpControlArray", rect, controlID);

    //填充该公共矩形
    //需要将该矩形转换为二维数组
    if (rect.left != -1)
    {
        const left = rect.left;
        const top = rect.top;
        const height = rect.height;
        const width = rect.width;

        for (let i = 0; i < height; i++)
        {
            for (let j = 0; j < width; j++)
            {
                upControl[j+left][i+top] = controlID;
            }
        }
    }
    
}

export function getControlID(mouse:any)
{
    //console.log("mouse.x", mouse.x, "mouse.y", mouse.y);
    if (mouse.x > canvasInfo.width - 1)
    {
        mouse.x = canvasInfo.width - 1;
    }

    if (mouse.y > canvasInfo.height - 1)
    {
        mouse.y = canvasInfo.height - 1;
    }

    return upControl[mouse.x][mouse.y];
}

const id2renderTreeArray:any = [];

export function id2renderTree(id:number)
{
    return id2renderTreeArray[id];
}

export function setId2renderTree(id:number, tree:any)
{
    id2renderTreeArray[id] = tree;
}

export function str2obj(str:string)
{
    //以空格分隔每个属性
    const obj:any = {};

    let count = 0;

    for (;;)
    {
        //跳过可能的空格
        while (str[count] == ' ')
        {
            count++; 
        }

        if (count == str.length)
        {
            break;
        }

        //找到属性名
        const strStart = count;

        while(str[count] != ':' && str[count] != ' ')
        {
            count++; 
        }

        const strEnd = count;

        const attrName = str.substring(strStart, strEnd);

        //找到属性值
        //跳过可能的空格
        while (str[count] == ' ' || str[count] == ':')
        {
            count++; 
        }

        const strStart2 = count;

        while (str[count] != ' ' && count != str.length)
        {
            count++; 
        }

        const strEnd2 = count;

        const attrValue = str.substring(strStart2, strEnd2);

        obj[attrName] = attrValue;
        //console.log(attrName, attrValue);

        //跳过可能的空格
        while (str[count] == ' ')
        {
            count++; 
        }

        if (count == str.length)
        {
            break;
        }
    }

    return obj;
}


export function drawLayoutRect(rect:any)
{
    //如果是按钮，则操作fillUpControlArray
    //console.log("drawLayoutRect", rect);
    if (rect.buttonState)
    {
        fillUpControlArray(rect.left, rect.top, rect.width, rect.height, rect.id);
    }

    if (rect.labelState)
    {
        fillUpControlArray(rect.left, rect.top, rect.width, rect.height, rect.id);
    }

    if (drawCtx == null)
    {
        return;
    }

    //drawCtx.fillStyle='#FF0000';
    if (rect.left && rect.top && rect.width && rect.height)
    {
        drawCtx.strokeStyle = '#FF0000';
        drawCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }
}

export function style(state:any, index:string, color:any)
{
    //1.读取BlackStyle.xml文件
    const buttonTemplate = xml2js('BlackStyle.xml');

    //console.log("style", index, buttonTemplate);

    //2.建立lua环境
    const ls = initLua();

    //3.注入按钮状态
    ls.pushInteger(state);//入栈一个整数
    ls.setGlobal('buttonState');

    //4.注入颜色属性
    const Color = {
        type:'color',
        color:color,
    };

    ls.pushInteger(Color);//入栈一个整数
    ls.setGlobal('Color');

    //5.根据index的不同，调用不同的lua脚本语言
    if (index == 'buttonBackground')
    {
        const buttonBackgroundCode = buttonTemplate.elements[0].elements[0]
                                .elements[0].cdata;
        
        luaParse(buttonBackgroundCode);

        //运行函数
        runLua();
    }
    else if (index == 'buttonBorder')
    {
        const buttonBorderCode = buttonTemplate.elements[1].elements[0]
        .elements[0].cdata;

        luaParse(buttonBorderCode);

        //运行函数
        runLua();
    }
    else if (index == 'buttonText')
    {
        const buttonTextCode = buttonTemplate.elements[2].elements[0]
        .elements[0].cdata;

        luaParse(buttonTextCode);

        //运行函数
        runLua();
    }
}

export class DoWork
{
    type:any;
    index:any;
    color:any;

    constructor(type:any, index:any, color:any)
    {
        this.type = type;
        this.index = index;
        this.color = color;
    }
}

export function drawBackground(color:any, rect:any)
{
    //背景色为填充方块
    if (drawCtx)
    {
        drawCtx.fillStyle=color.color;
        drawCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
}

export function drawsolidBoarder(color:any, rect:any)
{
    if (drawCtx)
    {
        drawCtx.strokeStyle = color.color;
        drawCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }
}

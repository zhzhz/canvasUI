//得到控件的全局id号
let idCnt = -1;
export function getID()
{
    return ++idCnt;
}

const upControl = [];

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

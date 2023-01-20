
import {setRootLayout, layout, getLayoutTree} from './layout';

let drawCtx:CanvasRenderingContext2D | null = null;

export function render(root:any, canvas:HTMLCanvasElement|undefined, ctx:CanvasRenderingContext2D | null) {
    console.log('render func');
    console.log(root);

    drawCtx = ctx;

    const window = root.elements[0];

    layoutWindow(window, canvas);

    layoutElements(window, window.elements);

    startRender(getLayoutTree());
}

//搞定布局后，真正绘图的地方
//只考虑window下的元素
function startRender(layoutTree:any)
{
    //console.log('layoutTree',layoutTree);
    const children = layoutTree.children;

    for (let i = 0; i < children.length; i++)
    {
        const child = children[i];

        if (child.draw)
        {
            child.draw(child);
        }
    }
}

function str2obj(str:string)
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

function layoutWindow(window:any, canvas:HTMLCanvasElement|undefined)
{
    const clientSize = window.attributes.ClientSize;
    //console.log("clientSize");

    const clientSizeObj = str2obj(clientSize);
    //console.log(clientSizeObj);
    const clientWidth = clientSizeObj.x;
    const clientHeight = clientSizeObj.y;

    //修改canvas大小
    if (canvas != undefined)
    {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
    }
    

    //更新window数据
    window.width = clientWidth;
    window.height = clientHeight;

    setRootLayout(window);
}

const renderMap = new Map();
renderMap.set('att.ContainerComposition-set', drawContainerComposition);
renderMap.set('Button', drawButton);

function drawRect(rect:any)
{
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

function drawContainerComposition(parent:any, child:any)
{
    //console.log("drawContainerComposition");
    //计算布局框，画出来

    const InternalMargin = str2obj(child.attributes.InternalMargin);

    child.InternalMargin = InternalMargin;

    //console.log(InternalMargin);

    const rect = layout(parent, child);
    rect.draw = drawRect;
}

function drawButton(parent:any, child:any)
{
    //console.log("drawButton");
    //计算按钮位置，画按钮所占的矩形
    //假设一定会提供<att.BoundsComposition-set属性,假设为第一个对象，下面基于这个属性来处理按钮的布局
    
    const AlignmentToParent = child.elements[0].attributes.AlignmentToParent;
    const PreferredMinSize = child.elements[0].attributes.PreferredMinSize;

    const AlignmentToParentParam = str2obj(AlignmentToParent);
    const PreferredMinSizeParam = str2obj(PreferredMinSize);
    
    child.AlignmentToParent = AlignmentToParentParam;
    child.PreferredMinSize = PreferredMinSizeParam;

    const rect = layout(parent, child);
    rect.draw = drawRect;
}


//渲染window中的可视元素
function layoutElements(window:any, elements:Array<any>)
{
    //暂时不支持修改canvas大小
    //1.渲染ContainerComposition
    for (let i = 0; i < elements.length; i++)
    {
        const name = elements[i].name;
        const layoutFunc = renderMap.get(name);

        if (layoutFunc)
        {
            layoutFunc(window, elements[i]);
        }
    }
}


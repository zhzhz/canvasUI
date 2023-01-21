
import {setRootLayout, layout, getLayoutTree} from './layout';

import {xml2js} from '#preload';

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
// function startRender(layoutTree:any)
// {
//     console.log('layoutTree',layoutTree);
//     const children = layoutTree.children;

//     for (let i = 0; i < children.length; i++)
//     {
//         const child = children[i];

//         if (child.draw)
//         {
//             child.draw(child);
//         }
//     }
// }

//递归调用，实现绘图
function startRender(layoutTree:any)
{
    console.log('layoutTree',layoutTree);
    const children = layoutTree.children;

    for (let i = 0; i < children.length; i++)
    {
        const child = children[i];

        if (child.color)
        {
            if (child.draw)
            {
                child.draw(child.color, layoutTree);//画具体控件 
            }
        }
        else
        {
            if (child.draw)
            {
                child.draw(child);//画布局框
            }
        }

        if (child.children)
        {
            //如果还有孩子
            startRender(child);
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
renderMap.set('att.ContainerComposition-set', layoutContainerComposition);
renderMap.set('Button', layoutButton);

function drawLayoutRect(rect:any)
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

function layoutContainerComposition(parent:any, child:any)
{
    //console.log("drawContainerComposition");
    //计算布局框

    const InternalMargin = str2obj(child.attributes.InternalMargin);

    child.InternalMargin = InternalMargin;

    //console.log(InternalMargin);

    const rect = layout(parent, child);
    rect.draw = drawLayoutRect;
}

function layoutButton(parent:any, button:any)
{
    //console.log("drawButton");
    //计算按钮位置，画按钮所占的矩形
    //假设一定会提供<att.BoundsComposition-set属性,假设为第一个对象，下面基于这个属性来处理按钮的布局
    
    const AlignmentToParent = button.elements[0].attributes.AlignmentToParent;
    const PreferredMinSize = button.elements[0].attributes.PreferredMinSize;

    const AlignmentToParentParam = str2obj(AlignmentToParent);
    const PreferredMinSizeParam = str2obj(PreferredMinSize);
    
    button.AlignmentToParent = AlignmentToParentParam;
    button.PreferredMinSize = PreferredMinSizeParam;

    const rect = layout(parent, button);

    //取得默认的按钮模版，来设置按钮的渲染函数
    rect.draw = drawLayoutRect;//画出布局框

    rect.children = [];

    //1.读取ButtonTemplate.xml内容
    const buttonTemplate = xml2js('ButtonTemplate.xml');

    //2.从中取得按钮的样子
    const buttonTemplate_ = buttonTemplate.elements[0].elements[0];

    //2.1取得按钮的背景色
    const buttonSolidBackgroundIndex = buttonTemplate_.elements[0].attributes['ref.Style'];

    //拿着Index去style文件中寻找颜色。
    const buttonSolidBackgroundColor = style(buttonSolidBackgroundIndex);

    if (buttonSolidBackgroundColor)
    {
        const obj = {
            draw:drawBackground,
            color:buttonSolidBackgroundColor,
        };
        
        rect.children.push(obj);
    }

    //2.2取得按钮的边框色
    //首先是取得bounds，这个是用来布局的
    const bounds = buttonTemplate_.elements[1];
    let boundsAttributes = bounds.attributes.AlignmentToParent;

    boundsAttributes = str2obj(boundsAttributes);
    bounds.AlignmentToParent = boundsAttributes;

    //父窗口是按钮，子窗口是bounds
    const boundsRect = layout(button, bounds);

    boundsRect.children = [];

    rect.children.push(boundsRect);

    //然后获得bounds的内部的SolidBorder
    const solidBoarderIndex = bounds.elements[0].attributes['ref.Style'];

    const solidBoarderColor = style(solidBoarderIndex);

    if (solidBoarderColor)
    {
        const obj = {
            draw:drawsolidBoarder,
            color:solidBoarderColor,
        };
        
        boundsRect.children.push(obj);
    }

}

function drawsolidBoarder(color:any, rect:any)
{
    if (drawCtx)
    {
        drawCtx.strokeStyle = color;
        drawCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }
}

function drawBackground(color:any, rect:any)
{
    //背景色为填充方块
    if (drawCtx)
    {
        drawCtx.fillStyle=color;
        drawCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
}

function style(index:string)
{
    if (index == 'buttonBackground')
    {
        return '#3F3F46';
    }

    if (index == 'buttonBorder')
    {
        return '#54545C';
    }

    return undefined;
}


//布局window中的可视元素
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


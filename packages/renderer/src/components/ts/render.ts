
import {setRootLayout, layout, getLayoutTree} from './layout';
import {getID, fillUpControlArray, getControlID, id2renderTree, setId2renderTree} from './global';

import {xml2js} from '#preload';

let drawCtx:CanvasRenderingContext2D | null = null;

const whoClick = (canvas:any) => {
    const mouse = { x: 0, y: 0 }; // 存储鼠标位置信息
  
    if (canvas == undefined)
    {
      return;
    }

    function calcMouse(e:any)
    {
        const x = e.pageX;
        const y = e.pageY;
    
        if (canvas == undefined)
        {
          return;
        }
        
        // 计算鼠标在canvas画布中的相对位置
        mouse.x = x - canvas.offsetLeft;
        mouse.y = y - canvas.offsetTop;
    }
    
    canvas.addEventListener('mousedown', (e:any) => {
        calcMouse(e);
        //console.log('x:',mouse.x,'y',mouse.y);
        handleMouseDown(mouse);
    });

    canvas.addEventListener('mouseup', (e:any) => {
        calcMouse(e);
        handleMouseUp(mouse);
    });
};

function handleMouseUp(mouse:any)
{
    //console.log('x:',mouse.x,'y',mouse.y);
    //如果按钮处于按下状态，将鼠标状态重新置为普通状态
    //查找按下的是哪个控件
    const controlID = getControlID(mouse);
    //console.log(controlID);

    //根据控件id得到控件渲染树节点
    const renderTreeNode = id2renderTree(controlID);

    //console.log(renderTreeNode);
    if (renderTreeNode.mouseup)
    {
        if (renderTreeNode.buttonState.buttonState == ButtonState.Down)
        {
            renderTreeNode.mouseup();
        }
    }
}

function handleMouseDown(mouse:any)
{
    //鼠标按下，更新按钮的显示状态
    //查找按下的是哪个控件
    const controlID = getControlID(mouse);
    //console.log(controlID);

    //根据控件id得到控件渲染树节点
    const renderTreeNode = id2renderTree(controlID);

    //console.log(renderTreeNode);
    if (renderTreeNode.mousedown)
    {
        renderTreeNode.mousedown();
    }
}

export function render(root:any, canvas:HTMLCanvasElement|undefined, ctx:CanvasRenderingContext2D | null) {
    console.log('render func');
    console.log(root);

    drawCtx = ctx;

    const window = root.elements[0];

    layoutWindow(window, canvas);

    layoutElements(window, window.elements);

    whoClick(canvas);

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
    //如果是按钮，则操作fillUpControlArray
    //console.log("drawLayoutRect", rect);
    if (rect.buttonState)
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

enum ButtonState
{
    Init,
    Down,
}

//处理按钮状态改变
function stateChangedHandle(info:any)
{
    //console.log("stateChangedHandle", info);
    //遍历do，依次处理
    for (let i = 0; i < info.do.length; i++)
    {
        const doWork = info.do[i];

        if (doWork.type == 'color')
        {
            //处理color更新
            const color = style(info.buttonState.buttonState, doWork.index);
            //console.log("stateChangedHandle color", color);
            //更新渲染树的color
            doWork.color.color = color;
        }
    }

    //手动调用更新界面函数
    startRender(getLayoutTree());
}

//用于按钮界面更新
// function DoWork(type:String, index:String, color:Object)
// {
//     this.type = type;
//     this.index = index;
//     this.color = color;
// }

class DoWork
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

    ////////////////////////////////////

    //创建按钮状态
    const buttonState = {buttonState:ButtonState.Init};//按钮初始状态

    rect.buttonState = buttonState;//挂载上去

    //分配id给按钮控件
    const id = getID();
    rect.id = id;

    //将id和渲染对象绑定
    setId2renderTree(id, rect);

    //添加状态改变处理对象
    const stateChanged:any = {};

    stateChanged.handle = stateChangedHandle;
    stateChanged.buttonState = buttonState;
    stateChanged.do = [];//按钮状态改变需要处理的工作

    rect.stateChanged = stateChanged;

    //添加鼠标按下事件处理函数
    rect.mousedown = function()
    {
        //console.log("button", id, "mousedown");

        //改变按钮状态
        rect.buttonState.buttonState = ButtonState.Down;

        if (rect.stateChanged)
        {
            const func = rect.stateChanged.handle;

            func(rect.stateChanged);
        }
    };

    rect.mouseup = function()
    {
        //改变按钮状态
        rect.buttonState.buttonState = ButtonState.Init;

        if (rect.stateChanged)
        {
            const func = rect.stateChanged.handle;

            func(rect.stateChanged);
        }
    };
    ////////////////////////////////////



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
    const buttonSolidBackgroundColor = style(rect.buttonState.buttonState, buttonSolidBackgroundIndex);

    const buttonSolidBackgroundColorObj:any = {color:buttonSolidBackgroundColor};

    stateChanged.do.push(new DoWork('color', buttonSolidBackgroundIndex, 
                                    buttonSolidBackgroundColorObj)); 

    if (buttonSolidBackgroundColor)
    {
        const obj = {
            draw:drawBackground,
            color:buttonSolidBackgroundColorObj,
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

    const solidBoarderColor = style(rect.buttonState.buttonState, solidBoarderIndex);

    const solidBoarderColorObj:any = {color:solidBoarderColor};

    stateChanged.do.push(new DoWork('color', solidBoarderIndex, 
                                    solidBoarderColorObj)); 

    if (solidBoarderColor)
    {
        const obj = {
            draw:drawsolidBoarder,
            color:solidBoarderColorObj,
        };
        
        boundsRect.children.push(obj);
    }

    //rect.mousedown();
}

function drawsolidBoarder(color:any, rect:any)
{
    if (drawCtx)
    {
        drawCtx.strokeStyle = color.color;
        drawCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }
}

function drawBackground(color:any, rect:any)
{
    //背景色为填充方块
    if (drawCtx)
    {
        drawCtx.fillStyle=color.color;
        drawCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
}

function style(state:any, index:string)
{
    if (state == ButtonState.Init)
    {
        if (index == 'buttonBackground')
        {
            return '#3F3F46';
        }
    
        if (index == 'buttonBorder')
        {
            return '#54545C';
        }
    }
    else if (state == ButtonState.Down)
    {
        if (index == 'buttonBackground')
        {
            return '#007ACC';
        }
    
        if (index == 'buttonBorder')
        {
            return '#1C97EA';
        }
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


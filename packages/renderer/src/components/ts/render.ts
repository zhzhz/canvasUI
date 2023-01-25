import {setRootLayout, layout, getLayoutTree} from './layout';
import {getControlID, id2renderTree, setId2renderTree, 
    str2obj, drawLayoutRect} from './global';

import {layoutButton, ButtonState} from './button';
import {layoutSolidLabel} from './solidLabel';

import {layoutLabel} from './label';

export let drawCtx:CanvasRenderingContext2D | null = null;
let canvasWidth = 0, canvasHeight = 0;

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
        renderTreeNode.mouseup();
    }
}

function handleMouseDown(mouse:any)
{
    //鼠标按下，更新按钮的显示状态
    //查找按下的是哪个控件
    const controlID = getControlID(mouse);
    console.log(controlID);

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

    layoutElements(window, window.elements, null);

    whoClick(canvas);

    startRender(getLayoutTree());
}

export function startRender(layoutTree:any)
{
    if (drawCtx)
    {
        drawCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        startRenderAfterClear(layoutTree);
    }
}

//递归调用，实现绘图
export function startRenderAfterClear(layoutTree:any)
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
            startRenderAfterClear(child);
        }
    }
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

    canvasWidth = clientWidth;
    canvasHeight = clientHeight;

    setRootLayout(window);
}

const renderMap = new Map();
renderMap.set('att.ContainerComposition-set', layoutContainerComposition);
renderMap.set('Button', layoutButton);
renderMap.set('SolidLabel', layoutSolidLabel);
renderMap.set('Label', layoutLabel);

function layoutContainerComposition(parent:any, child:any, context:any)
{
    //console.log("drawContainerComposition");
    //计算布局框

    const InternalMargin = str2obj(child.attributes.InternalMargin);

    child.InternalMargin = InternalMargin;

    //console.log(InternalMargin);

    const rect = layout(parent, child);
    rect.draw = drawLayoutRect;
}

//布局window中的可视元素
export function layoutElements(window:any, elements:Array<any>, context:any)
{
    //暂时不支持修改canvas大小
    //1.渲染ContainerComposition
    for (let i = 0; i < elements.length; i++)
    {
        const name = elements[i].name;
        const layoutFunc = renderMap.get(name);

        if (layoutFunc)
        {
            layoutFunc(window, elements[i], context);
        }
    }
}


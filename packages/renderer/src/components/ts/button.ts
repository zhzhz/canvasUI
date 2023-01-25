import {getID, str2obj, setId2renderTree, drawLayoutRect, style, DoWork,
    drawBackground, drawsolidBoarder} from './global';

import {layout, getLayoutTree} from './layout';
import {layoutElements, startRender} from './render';
import {xml2js} from '#preload';

export enum ButtonState
{
    Init,
    Down,
}

export function layoutButton(parent:any, button:any, context:any)
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

    //rect.Text = "buttom";
    rect.Text = button.attributes.Text;

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
        if (rect.buttonState.buttonState == ButtonState.Down)
        {
            rect.buttonState.buttonState = ButtonState.Init;
        }

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
    const buttonSolidBackgroundColorObj:any = {color:''};

    style(rect.buttonState.buttonState, buttonSolidBackgroundIndex,
                                    buttonSolidBackgroundColorObj);

    
    stateChanged.do.push(new DoWork('color', buttonSolidBackgroundIndex, 
                                    buttonSolidBackgroundColorObj)); 

    if (buttonSolidBackgroundColorObj.color)
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

    const solidBoarderColorObj:any = {color:''};

    style(rect.buttonState.buttonState, solidBoarderIndex, solidBoarderColorObj);

    
    stateChanged.do.push(new DoWork('color', solidBoarderIndex, 
                                    solidBoarderColorObj)); 

    if (solidBoarderColorObj.color)
    {
        const obj = {
            draw:drawsolidBoarder,
            color:solidBoarderColorObj,
        };
        
        boundsRect.children.push(obj);
    }

    //2.3处理标签
    //首先是取得textBounds，这个是用来布局的
    const textBounds = buttonTemplate_.elements[3];
    let textBoundsAttributes = textBounds.attributes.AlignmentToParent;

    textBoundsAttributes = str2obj(textBoundsAttributes);
    textBounds.AlignmentToParent = textBoundsAttributes;

    //父窗口是按钮，子窗口是textBounds 
    const textBoundsRect = layout(button, textBounds);

    textBoundsRect.draw = drawLayoutRect;//画出布局框

    textBoundsRect.children = [];

    rect.children.push(textBoundsRect);

    //textBounds中是solidLabel控件
    layoutElements(textBounds, textBounds.elements, rect);
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
            style(info.buttonState.buttonState, doWork.index, doWork.color);
        }
    }

    //手动调用更新界面函数
    startRender(getLayoutTree());
}
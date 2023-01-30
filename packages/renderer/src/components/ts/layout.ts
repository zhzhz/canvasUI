import {getID, initUpControlArray, fillUpControlArray, setId2renderTree} from './global';


//在本文件中构建渲染树
const renderTree:any = {width:0, height:0, left:0, top:0, children:[]};

const xml2renderMap = new Map();

const layoutFuncMap = new Map();

layoutFuncMap.set('att.ContainerComposition-set', layoutContainerComposition);
layoutFuncMap.set('Button', layoutButton);
layoutFuncMap.set('Bounds', layoutBounds);
layoutFuncMap.set('SolidLabel', layoutSolidLabel);
layoutFuncMap.set('Label', layoutLabel);

//布局window和InternalMargin
function layoutInternalMargin(parentItem:any, childItem:any)
{
    // const left,top,width,height;

    const parentLeft = parentItem.left, 
    parentTop = parentItem.top, 
    parentWidth = parentItem.width,
    parentHeight = parentItem.height;

    const left = parentLeft + Number(childItem.left);
    const top = parentTop + Number(childItem.top);

    const right = (parentLeft + parentWidth) - Number(childItem.right); 

    const width = right - left;

    const bottom = (parentTop + parentHeight) - Number(childItem.bottom);

    const height = bottom - top;

    //console.log("layoutChildRect", typeof childItem.left);
    return {left, top, width, height};
}

//window和布局按钮
function layoutAlignmentAndPreferred(parentItem:any,
    AlignmentToParent:any, PreferredMinSize:any)
{
    //需要确定按钮的left，top，width，height
    const parentLeft = parentItem.left, 
    parentTop = parentItem.top, 
    parentWidth = parentItem.width,
    parentHeight = parentItem.height;

    const AlignmentLeft = Number(AlignmentToParent.left);
    const AlignmentRight = Number(AlignmentToParent.right);
    const AlignmentTop = Number(AlignmentToParent.top);
    const AlignmentButtom = Number(AlignmentToParent.bottom);

    const PreferredX = Math.ceil(Number(PreferredMinSize.x));
    const PreferredY = Math.ceil(Number(PreferredMinSize.y));

    let left,top,width,height;

    if(AlignmentLeft != -1)
    {
        //距离左边，直接计算出来
        //console.log("layoutAlignmentAndPreferred", parentLeft, AlignmentLeft)
        left = parentLeft + AlignmentLeft;
    }
    else
    {
        //距离左边无法直接计算，需要根据右边计算
    }

    if (AlignmentTop != -1)
    {
        top = parentTop + AlignmentTop; 
    }
    else
    {
        //距离无法直接计算出来，需要根据底边计算
    }

    //计算宽和高
    if (AlignmentRight == -1)
    {
        //直接采用
        width = PreferredX;
    }
    else
    {
        if (AlignmentLeft == -1)
        {
            //假设左边忽略了，则需要根据右边的距离计算left
            const right = (parentLeft + parentWidth) - AlignmentRight;

            left = right - PreferredX;
            width = PreferredX;
        }
        else
        {
            //左右都没忽略，根据右边计算宽度
            const right = (parentLeft + parentWidth) - AlignmentRight;
            width = right - left;
        }
    }

    //console.log("debug", AlignmentButtom, PreferredY)
    if (AlignmentButtom == -1)
    {
        height = PreferredY;
    }
    else
    {
        if (AlignmentTop == -1)
        {
            //忽略了高度，按照底边计算
            const bottom = (parentTop + parentHeight) - AlignmentButtom;

            top = bottom - PreferredY;
            height = PreferredY;
        }
        else
        {
            //上下都没忽略，只需要计算height
            const bottom = (parentTop + parentHeight) - AlignmentButtom;
            
            height = bottom - top;
        }
    }

    //console.log('button',left,top,width,height);
    return {left, top, width, height};
}

function layoutContainerComposition(parentItem:any, childItem:any)
{
    //读取parentItem的大小，根据childItem的InternalMargin，计算子矩形
    //console.log("containerComposition_set", parentItem, childItem);
    const rect = layoutInternalMargin(parentItem, childItem.InternalMargin);
    parentItem.children.push(rect);
    parentItem.containerComposition = rect;

    xml2renderMap.set(childItem, rect);

    return rect;
}

//布局solidLabel
function layoutSolidLabel(parentItem:any, childItem:any)
{
    console.log('layoutSolidLabel', parentItem, childItem);
    //根据childItem的指示布局
    if (childItem.HorizontalAlignment && childItem.VerticalAlignment)
    {
        //按钮中的文本
        const rect = layoutHandVCenter(parentItem, childItem);

        parentItem.children.push(rect);
    
        xml2renderMap.set(childItem, rect);

        return rect;
    }
    else
    {
        //独立的文本
        //由parent的left，top和child的width和height构成
        //const rect = layoutLTWH(parentItem, childItem);
        const parent = xml2renderMap.get(parentItem.parentXml);
        const rect = layoutAlignmentAndPreferred(parent.containerComposition, 
            parentItem.AlignmentToParent, childItem.PreferredMinSize);

        parentItem.children.push(rect);
    
        xml2renderMap.set(childItem, rect);

        return rect;
    }
}

function layoutLTWH(parentItem:any, childItem:any)
{
    return {left:parentItem.left, top:parentItem.top,
    width:Math.ceil(childItem.actualWidth), height:Math.ceil(childItem.actualHeight)};
}

function layoutLeftTop(parentItem:any, AlignmentToParent:any)
{
    // const left = parentItem.left + AlignmentLeft;
    // const top = parentItem.top + AlignmentTop;
    const left = -1;
    const top = -1;
    const width = -1;
    const height = -1;

    return {left, top, width, height};
}

function layoutLabel(parentItem:any, childItem:any)
{
    console.log('layoutLabel', parentItem, childItem);
    //根据childItem的指示布局
    //只考虑居中的情况
    const rect = layoutLeftTop(parentItem.containerComposition, 
        childItem.AlignmentToParent);

    parentItem.children.push(rect);

    xml2renderMap.set(childItem, rect);

    return rect;
}

function layoutHandVCenter(parentItem:any, childItem:any)
{
    //将字布局在parent的水平和垂直中心
    const parentLeft = parentItem.left, 
    parentTop = parentItem.top, 
    parentWidth = parentItem.width,
    parentHeight = parentItem.height;

    const left = Math.ceil(parentLeft + (parentWidth - childItem.actualWidth)/2);
    const top = Math.ceil(parentTop + (parentHeight - childItem.actualHeight)/2);

    return {left, top, width:Math.ceil(childItem.actualWidth), 
        height:Math.ceil(childItem.actualHeight)};
}


//按钮布局在parentItem的containerComposition内
function layoutButton(parentItem:any, childItem:any)
{
    //console.log("layoutButton", childItem);
    const rect = layoutAlignmentAndPreferred(parentItem.containerComposition,
        childItem.AlignmentToParent, childItem.PreferredMinSize);

    parentItem.children.push(rect);

    xml2renderMap.set(childItem, rect);

    return rect;
}

//计算出Bounds的范围
function layoutBounds(parentItem:any, childItem:any)
{
    console.log('layoutBounds', parentItem, childItem);
    const rect = layoutInternalMargin(parentItem, childItem.AlignmentToParent);
    xml2renderMap.set(childItem, rect);
    return rect;
}

export function layout(parentLayoutItem:any, childLayoutItem:any)
{
    //根据父矩形布局
    //返回布局后的新矩形
    const parentItem = xml2renderMap.get(parentLayoutItem);
    //console.log("layout", parentItem);
    if (parentItem)
    {
        const layoutFunc = layoutFuncMap.get(childLayoutItem.name);
        //console.log(layoutFunc)
        if (layoutFunc)
        {
            return layoutFunc(parentItem, childLayoutItem);
        }
    }

    return null;
}

export function setRootLayout(window:any)
{
    //只取绘图相关数据
    renderTree.width = window.width;
    renderTree.height = window.height;
    renderTree.left = 0;
    renderTree.top = 0;

    renderTree.id = getID();

    setId2renderTree(renderTree.id, renderTree);

    initUpControlArray(window.width, window.height);

    fillUpControlArray(renderTree.left, renderTree.top, window.width, window.height, renderTree.id);

    xml2renderMap.set(window, renderTree);
}

export function getLayoutTree()
{
    return renderTree;
}
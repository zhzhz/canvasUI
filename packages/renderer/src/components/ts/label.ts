//标签控件，在界面上显示文字
import {getID, str2obj, setId2renderTree, drawLayoutRect, style, DoWork,
    drawBackground, drawsolidBoarder} from './global';

import {layout, getLayoutTree} from './layout';
import {layoutElements, startRender} from './render';
import {xml2js} from '#preload';

export function layoutLabel(parent:any, label:any, context:any)
{
    //解析得到标签的文字,计算文字的宽和高
    const Text = label.attributes.Text;

    const AlignmentToParent = label.elements[0].attributes.AlignmentToParent;
    
    const AlignmentToParentParam = str2obj(AlignmentToParent);

    label.AlignmentToParent = AlignmentToParentParam;

    const rect = layout(parent, label);

    rect.draw = drawLayoutRect;

    rect.children = [];

    //当前只能获得文本的左上角坐标
    rect.labelState = {};
    //分配id给按钮控件
    const id = getID();
    rect.id = id;

    //将id和渲染对象绑定
    setId2renderTree(id, rect);

    rect.Text = Text;

    //打开solidLabel文件
    const lableTemplate = xml2js('LabelTemplate.xml');
    const lableTemplate_ = lableTemplate.elements[0].elements[0];

    //得到文本的默认颜色
    rect.Color = lableTemplate_.attributes.DefaultTextColor;
    //console.log("DefaultTextColor", rect.Color);

    layoutElements(label, lableTemplate_.elements, rect);//触发layoutSolidLabelForLabel
}
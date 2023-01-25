import {getID, setId2renderTree, drawLayoutRect, style, DoWork} from './global';

import {layout} from './layout';
import {drawCtx} from './render';

function layoutSolidLabelForButton(parent:any, solidLabel:any, context:any)
{
    //提取出xml文件内容，以便layout函数中使用
    const HorizontalAlignment = solidLabel.attributes.HorizontalAlignment;
    const VerticalAlignment = solidLabel.attributes.VerticalAlignment;

    solidLabel.HorizontalAlignment = HorizontalAlignment;
    solidLabel.VerticalAlignment = VerticalAlignment;

    //console.log("layoutSolidLabel3",parent, solidLabel);

    //根据文字计算出文字的宽和高
    if (drawCtx)
    {
        drawCtx.font = '20px Arial';
        const metrics = drawCtx.measureText(context.Text);
        //let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        solidLabel.actualHeight = actualHeight;
        solidLabel.actualWidth= metrics.width;

        const rect = layout(parent, solidLabel);
        rect.Text = context.Text;
        rect.font = drawCtx.font;
        
        //rect.LabelState = {};//为了填充二维UpControlArray
        //根据rect，计算text的左下脚坐标
        rect.draw = drawLayoutRect;//画出布局框
        rect.children = [];

        //分配id给按钮控件
        //const id = getID();
        //rect.id = id;

        //将id和渲染对象绑定
        //setId2renderTree(id, rect);

        //计算文本的颜色并绑定绘图函数
        const solidLabelIndex = solidLabel.attributes['ref.Style'];

        const solidLabelColorObj:any = {color:''};

        style(context.buttonState.buttonState, solidLabelIndex, solidLabelColorObj);

        context.stateChanged.do.push(new DoWork('color', solidLabelIndex, 
                                solidLabelColorObj)); 

        if (solidLabelColorObj.color)
        {
            const obj = {
                draw:(color:any, rect:any) => {
                    const left = rect.left;
                    const bottom = rect.top + rect.height;

                    if (drawCtx)
                    {
                        drawCtx.font = rect.font;
                        drawCtx.fillStyle = color.color;
                        drawCtx.fillText(rect.Text, left, bottom);
                    } 
                },
                color:solidLabelColorObj,
            };
            
            rect.children.push(obj);
        }
    } 
}

function layoutSolidLabelForLabel(parent:any, solidLabel:any, context:any)
{
    //console.log("layoutSolidLabelForLabel",parent, solidLabel, context);

    //得到Text,计算Text的宽和高
    if (drawCtx)
    {
        drawCtx.font = '20px Arial';
        const metrics = drawCtx.measureText(context.Text);
        const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        solidLabel.actualHeight = actualHeight;
        solidLabel.actualWidth= metrics.width;

        const rect = layout(parent, solidLabel);

        //根据solidLabel更新label控件的宽和高
        context.width = rect.width;
        context.height = rect.height;

        rect.Text = context.Text;
        rect.font = drawCtx.font;
        
        //rect.LabelState = {};//为了填充二维UpControlArray
        //根据rect，计算text的左下脚坐标
        rect.draw = drawLayoutRect;//画出布局框
        rect.children = [];

        const solidLabelColorObj:any = {color:context.Color};

        const obj = {
            draw:(color:any, rect:any) => {
                const left = rect.left;
                const bottom = rect.top + rect.height;

                if (drawCtx)
                {
                    //todo:字需要清除一下canvas，不然字会变粗
                    drawCtx.font = rect.font;
                    drawCtx.fillStyle = color.color;
                    drawCtx.fillText(rect.Text, left, bottom);
                } 
            },
            color:solidLabelColorObj,
        };
        
        rect.children.push(obj);
    }  
}

export function layoutSolidLabel(parent:any, solidLabel:any, context:any)
{
    if (context.buttonState)
    {
        layoutSolidLabelForButton(parent, solidLabel, context);
    }
    else if (context.labelState)
    {
        layoutSolidLabelForLabel(parent, solidLabel, context);
    }
}
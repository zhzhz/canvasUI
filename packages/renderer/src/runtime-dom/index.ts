import { createRenderer } from 'vue';
import { Text, Container, Sprite, Texture, Graphics} from 'pixi.js';

class Rect
{
    x;
    y;
    width;
    height;
    color;
    lineWidth;
    text;

    constructor()
    {
        // this.x = x;
        // this.y = y;
        // this.width = width;
        // this.height = height;
        // this.color = color;
    }

    clear()
    {
        this.x = undefined;
        this.y = undefined;
        this.width = undefined;
        this.height = undefined;
        this.color = undefined;
        this.lineWidth = undefined;
        this.text = undefined;
    }
}

const rect = new Rect();
const graphFinish = new WeakMap();

function fillRect(key, value)
{
  switch (key) {
    case 'color':
    rect.color = value;
    break;

    case 'x':
    rect.x = value;
    break;

    case 'y':
    rect.y = value;
    break;

    case 'height':
    rect.height = value;
    break;

    case 'width':
    rect.width = value;
    break;
    
    case 'lineWidth':
    rect.lineWidth = value;
    break;

    case 'text':
    rect.text = value;
    break;
    
    default:
    break;
  }

  // rect.x = values["x"];
  // rect.y = values["y"];
  // rect.width = values["width"];
  // rect.height = values["height"];
}

const renderer = createRenderer({
  createElement(type) {
    let element;
    switch (type) {
      case 'container':
        //console.log("container");
        element = new Container();
        break;
      case 'sprite':
        element = new Sprite();
        break;

      case 'graphics':
        element = new Graphics();
        break;

      case 'text':
        element = new Text('', {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xff1010,
          align: 'center',
      });
        break;
    }
    return element;
  },
  setElementText(node, text) {
    node.addChild(new Text(text));
  },
  createText(text) {
    return new Text(text);
  },

  insert(el, parent) {
    if (el) {
      // if (el.name == "SolidBackground")
      // {
      //   console.log("SolidBackground insert")
      // }
      
      parent.addChild(el);
    }
  },

  parentNode(node) {
    return node.parent;
  },

  nextSibling(node) {
    return null;
  },

  remove(el) {
    if (el.parent) {
      // eslint-disable-next-line no-debugger
      el.parent.removeChild(el);
    }
  },

  createComment(text) {
    // console.log(text);
    return null;
  },

  setText(node, text)
  {
    //node.text = text;
  },

  patchProp(el, key, prevValue, nextValue) {
    //console.log("patchProp", key);

    // if (el.name == 'Button')
    // {
    //   console.log("Button", key, nextValue);
    // }
    //console.log("patchProp", el.name);
    //console.log("SolidText2", key, nextValue);
    if (el.name == 'SolidBackground')
    {
        //console.log("patchProp", key, nextValue);
        //console.log("patchProp", key, nextValue);
        console.log('SolidBackground');
        if (graphFinish.get(el) == undefined ||
        graphFinish.get(el) == false)
        {
          graphFinish.set(el, false);

          fillRect(key, nextValue);

          if (rect.x != undefined && rect.y != undefined
              && rect.height != undefined && rect.width != undefined 
              && rect.color != undefined)
          {
              el.beginFill(rect.color);
              //el.lineStyle(5, 0x00FF00);
              
              el.drawRect(rect.x, rect.y, rect.width, rect.height);
              el.endFill();
  
              //创建标志位，标志这个控件已经创建
              graphFinish.set(el, true);
              rect.clear();
          }

          return;
        }
    }
    else if (el.name == 'SolidBorder')
    {
        //console.log("SolidBorder");
        if (graphFinish.get(el) == undefined ||
        graphFinish.get(el) == false)
        {
            graphFinish.set(el, false);

            fillRect(key, nextValue);
            
            if (rect.x != undefined && rect.y != undefined
                && rect.height != undefined && rect.width != undefined 
                && rect.color != undefined && rect.lineWidth != undefined )
            {
              //console.log('lineWidth2',rect.lineWidth);
                rect.color = 0xffff00;
                el.lineStyle(rect.lineWidth, rect.color);
                el.drawRect(rect.x+1, rect.y, rect.width, rect.height);

                graphFinish.set(el, true);
                
                //保存画图相关信息，重绘时使用
                el._lineWidth_ = rect.lineWidth;
                el._color_ = rect.color;

                el._x_ = rect.x;
                el._y_ = rect.y;
                el._width_ = rect.width;
                el._height_ = rect.height;

                rect.clear();
            }

            return;
        }
        
        if (key == 'width')
        {
          //console.log("width", nextValue)

          el.clear();
          
          el.lineStyle(el._lineWidth_, el._color_);
          el.drawRect(el._x_+1, el._y_, nextValue, el._height_);
          el[key] = nextValue;

          el._width_ = nextValue;
          return;
        }
        else if (key == 'height')
        {
          //console.log("width", nextValue)

          el.clear();
          
          el.lineStyle(el._lineWidth_, el._color_);
          el.drawRect(el._x_+1, el._y_, el._width_, nextValue);
          el[key] = nextValue;

          el._height_ = nextValue;
          return;
        }
    }
    else if (el.name == 'SolidText')
    {
      //收集字体的参数
      //x,y,text,style
      //console.log("SolidText", el);
      //el.text = nextValue;
      if (graphFinish.get(el) == undefined ||
      graphFinish.get(el) == false)
      {
          graphFinish.set(el, false);

          fillRect(key, nextValue);
          
          if (rect.x != undefined && rect.y != undefined
              && rect.color != undefined && rect.text != undefined )
          {
              el.text = rect.text;
              el.style.fill = rect.color;
              el.x = rect.x;
              el.y = rect.y;

              graphFinish.set(el, true);
              rect.clear();
          }

          return;
      }
    }
    
    switch (key) {
      case 'texture':
        // console.log(nextValue);
        el.texture = Texture.from(nextValue);
        break;
      case 'onClick':
        el.on('pointertap', nextValue);
        break;

      default:
        //console.log("patchProp", key, nextValue)
        // if (el.name == 'Button')
        // {
        //   console.log("Button", key, nextValue);
        // }
        el[key] = nextValue;
        // if (el.name == 'SolidText')
        // {
        //   console.log("SolidText1", key, nextValue);
        // }
    }
  },
});

export function createApp(rootComponent) {
  return renderer.createApp(rootComponent);
}

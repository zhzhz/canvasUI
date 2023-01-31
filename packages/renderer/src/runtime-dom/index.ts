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
    }
}

const rect = new Rect();

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
      console.log('lineWidth',value);
    rect.lineWidth = value;
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
        element = new Container();
        break;
      case 'sprite':
        element = new Sprite();
        break;

      case 'graphics':
        element = new Graphics();
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
      parent.addChild(el);
    }
  },
  parentNode(node) {
    return node.parent;
  },
  nextSibling() {},
  remove(el) {
    if (el.parent) {
      // eslint-disable-next-line no-debugger
      el.parent.removeChild(el);
    }
  },

  createComment() {
    // console.log(text);
  },

  patchProp(el, key, prevValue, nextValue) {
    //console.log("patchProp", key);
    if (el.name == 'SolidBackground')
    {
        //console.log("patchProp", key, nextValue);
        //console.log("patchProp", rect.x, rect.y, rect.height, rect.width, rect.color)

        fillRect(key, nextValue);

        if (rect.x != undefined && rect.y != undefined
            && rect.height != undefined && rect.width != undefined 
            && rect.color != undefined)
        {
            el.beginFill(rect.color);
            //el.lineStyle(5, 0x00FF00);
            el.drawRect(rect.x, rect.y, rect.width, rect.height);
            el.endFill();

            rect.clear();
        }

        return;
    }
    else if (el.name == 'SolidBorder')
    {
        //console.log("SolidBorder");
        fillRect(key, nextValue);
        
        if (rect.x != undefined && rect.y != undefined
            && rect.height != undefined && rect.width != undefined 
            && rect.color != undefined && rect.lineWidth != undefined )
        {
          //console.log('lineWidth2',rect.lineWidth);
            el.lineStyle(rect.lineWidth, rect.color);
            el.drawRect(rect.x, rect.y, rect.width, rect.height);

            rect.clear();
        }

        return;
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
        el[key] = nextValue;
    }
  },
});

export function createApp(rootComponent) {
  return renderer.createApp(rootComponent);
}

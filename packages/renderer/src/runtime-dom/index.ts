import { createRenderer } from 'vue';
import { Text, Container, Sprite, Texture } from 'pixi.js';

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
    // console.log(key);
    switch (key) {
      case 'texture':
        // console.log(nextValue);
        el.texture = Texture.from(nextValue);
        break;
      case 'onClick':
        el.on('pointertap', nextValue);
        break;
      default:
        el[key] = nextValue;
    }
  },
});

export function createApp(rootComponent) {
  return renderer.createApp(rootComponent);
}

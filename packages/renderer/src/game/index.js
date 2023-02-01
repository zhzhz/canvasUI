// 创建基础 game 的根容器
import { Application } from 'pixi.js';
import '@pixi/unsafe-eval';

export const game = new Application({
  width: 400,
  height: 400,
});

document.body.append(game.view);

export function getRootContainer() {
  return game.stage;
}
<script lang="ts" setup>
import {ref, onMounted} from 'vue';

import {xml2js} from '#preload';

import {render} from './ts/render';

const canvasRef = ref<HTMLCanvasElement>();
let ctx:CanvasRenderingContext2D | null = null;

const initContext = () => {
  if (canvasRef.value == undefined)
  {
    return;
  }

  ctx = canvasRef.value.getContext('2d');
};

// const draw = () => {

//   if (ctx == null)
//   {
//     return;
//   }
  
//   ctx.fillStyle='#FF0000';
//   ctx.fillRect(0,0,70,75);
// };



onMounted(()=>{
  initContext();
  //draw();
  //whoClick();

  //console.log(xml2js('main.xml'));
  render(xml2js('main.xml'), canvasRef.value, ctx);
  //console.log(xml2js('ButtonTemplate.xml'));
  //console.log(xml2js('BlackStyle.xml'));
});

</script>

<template>
  <canvas
    ref="canvasRef"
    style="border-style: solid; border-width: 1px"
    width="200"
    height="200"
  >
    浏览器不支持canvas
  </canvas>
</template>

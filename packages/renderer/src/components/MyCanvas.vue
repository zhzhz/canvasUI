<script lang="ts" setup>
import {ref, onMounted} from 'vue';

const canvasRef = ref<HTMLCanvasElement>();
let ctx:CanvasRenderingContext2D | null = null;

const initContext = () => {
  if (canvasRef.value == undefined)
  {
    return;
  }

  ctx = canvasRef.value.getContext('2d');
};

const draw = () => {

  if (ctx == null)
  {
    return;
  }
  
  ctx.fillStyle='#FF0000';
  ctx.fillRect(0,0,70,75);
};

onMounted(()=>{
  initContext();
  draw();
});

</script>

<template>
  <canvas
    ref="canvasRef"
    style="width: 100%; border-style: solid; border-width: 1px"
    :width="200"
    :height="200"
  >
    浏览器不支持canvas
  </canvas>
</template>

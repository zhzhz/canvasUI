<template>
  <container name="Button">
    <!-- <sprite :texture="bulletImg"></sprite> -->
    
    <!-- 背景色 -->
    <SolidBackground
      color="0x3F3F46"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
    ></SolidBackground>

    <!-- 边框 -->
    <!-- <SolidBorder :color=0x54545C ></SolidBorder> -->
    <SolidBorder
      color="0xffffff"
      :line-width="1"
      :x="x"
      :y="y"
      :width="width"
      :height="height"
    ></SolidBorder>

    <!-- 按钮文字 -->
  </container>
</template>

<script setup="props,{emit}" lang="ts">
import SolidBackground from './base/solidBackground.vue';
import SolidBorder from './base/solidBorder.vue';

// defineProps({
//     x, y, width, height
// });
const props = defineProps<{
    x:number,
    y:number,
    width:number,
    height:number
}>();

</script>

<style scoped></style>
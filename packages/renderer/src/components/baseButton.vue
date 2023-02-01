<template>
  <container name="Button" :x="x" :y="y">
    <!-- <sprite :texture="bulletImg"></sprite> -->
    
    <!-- 背景色 -->
    <SolidBackground
      color="0x3F3F46"
      :x=0
      :y=0
      :width="width"
      :height="height"
    ></SolidBackground>

    <!-- 边框 -->
    <!-- <SolidBorder :color=0x54545C ></SolidBorder> -->
    <SolidBorder
      color="0xffffff"
      :lineWidth="1"
      :x=0
      :y=0
      :width="width"
      :height="height"
    ></SolidBorder>

    <!-- 按钮文字 -->
    <SolidText
      color="0xF1F1F1"
      :text="text"
      :x="textXAndY.x"
      :y="textXAndY.y" 
    ></SolidText>
  </container>
</template>

<script setup="{emit}" lang="ts">
import SolidBackground from './base/solidBackground.vue';
import SolidBorder from './base/solidBorder.vue';
import SolidText from './base/solidText.vue';
import {ref, onMounted, reactive, computed} from 'vue';

import { Text } from 'pixi.js';

const props = defineProps<{
    x:any,
    y:any,
    width:any,
    height:any,
    text:any,
}>();

const calcXY = (text) =>
{
  let pixiText = new Text(text, {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xff1010,
          align: 'center',
      });

  //得到字的长和宽
  let textWidth = pixiText.width;
  let textHeight = pixiText.height;

  //得到按钮的宽和高
  let buttonWidth = props.width;
  let buttonHeight = props.height;
  //console.log("buttonWidth", buttonWidth, "buttonHeight", buttonHeight);

  let x,y;

  x = (buttonWidth - textWidth)/2;
  y = (buttonHeight - textHeight)/2;

  return {x,y};
}

//根据text计算text的位置textX和textY
let text = props.text;

const textXAndY = computed(() => {
  //console.log("computed");
  return calcXY(text)
});

</script>

<style scoped></style>
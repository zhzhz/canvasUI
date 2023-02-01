<script lang="ts" setup="props,{emit}">
import {ref, onMounted, reactive} from 'vue';

// import {xml2js} from '#preload';

// import {render} from './ts/render';

// import bulletImg from '../assets/bullet.png';

import Button from '../components/baseButton.vue';

import {useStore} from "../core"

// export default {
//   name: "main",
//   components: { Button },
// };
//改变按钮的width
const buttonInfo = useStore();

//console.log("storeInfo", storeInfo)

onMounted(()=>{

  //buttonInfo[2].width = 150;
  //buttonInfo[2].height = 50;

  // buttonInfo[2].x = 200;
});


</script>

<template>
  <container name="AppContainer">
    <!-- <sprite :texture="bulletImg"></sprite> -->
    <Button
      v-for="(button, index) in buttonInfo"
      :key="index"

      :width="button.width"
      :height="button.height"
      :x="button.x"
      :y="button.y"
      :text="button.text"
    ></Button>

  </container>
</template>

<style>
</style>

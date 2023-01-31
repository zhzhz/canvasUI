<script lang="ts" setup>
import {ref, onMounted} from 'vue';

import {xml2js} from '#preload';

import {render} from './ts/render';

import bulletImg from '../assets/bullet.png';

import Button from '../components/baseButton.vue';

// export default {
//   name: "main",
//   components: { Button },
// };

</script>

<template>
  <container name="AppContainer">
    <!-- <sprite :texture="bulletImg"></sprite> -->
    <Button
      :width="100"
      :height="30"
      :x="0"
      :y="0"
    ></Button>
    <Button
      :width="100"
      :height="30"
      :x="0"
      :y="100"
    ></Button>
    <Button
      :width="100"
      :height="30"
      :x="200"
      :y="200"
    ></Button>
  </container>
</template>

<style>
</style>

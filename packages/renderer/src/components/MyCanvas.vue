<script lang="ts" setup>
import {ref, onMounted} from 'vue';

import {xml2js} from '#preload';

import {render} from './ts/render';

import bulletImg from '../assets/bullet.png';

</script>

<template>
  <container name="AppContainer">
    <sprite :texture="bulletImg"></sprite>
  </container>
</template>

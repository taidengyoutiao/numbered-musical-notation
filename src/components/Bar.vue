<template>
  <div class="bar">
    <Note
      v-for="(item, index) in barData"
      :key="`bar-${index}`"
      :note-data="item"
      :class="[mlArr.includes(index + 1) ? 'ml10' : '']"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Note from '@/components/Note.vue'

const props = defineProps({
  barData: {
    type: Array,
    default: () => []
  }
})

const mlArr = computed(() => {
  let sum = 0
  const arr = []
  props.barData.forEach((obj, index) => {
    const tempo = Number(obj?.tempo) || 0
    sum += tempo
    if (sum > 4) {
      sum = tempo
      arr.push(index + 1)
    }
  })
  return arr
})
</script>

<style scoped>
.bar {
  display: inline-block;
  border-right: 1px solid #000;
  padding-right: 10px;
  margin-right: 10px;
  height: 20px;
  margin-bottom: 40px;
}
.ml10 {
  margin-left: 10px;
}
</style>

<template>
  <div class="bar">
    <Note v-for="(item, key) in barData" :key="key" :noteKey="item.key" :noteRange="item.range" :noteTempo="item.tempo" :class="[mlArr.indexOf(Number(key+1)) !== -1 ? 'ml10' : '']"></Note>
  </div>
</template>

<script>
import Note from '@/components/Note'
export default {
  props: {
    barData: {
      type: Array
    }
  },
  computed: {
    mlArr () {
      let sum = 0
      let arr = []
      let count = 0
      for (let obj of this.barData) {
        count++
        sum += obj.tempo
        if (sum > 4) {
          sum = obj.tempo
          arr.push(count)
        }
      }
      return arr
    }
  },
  components: { Note }
}
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

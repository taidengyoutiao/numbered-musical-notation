<template>
  <div class="wrapper">
    <h2 class="title">{{title}}</h2>
    <div>
      <Bar v-for="(item, key) in notes" :key="key" :barData="item"></Bar>
    </div>
  </div>
</template>

<script>
import Bar from '@/components/Bar'
import song from '@/test.js'
export default {
  data () {
    return {
      title: song.title,
      notes: [
        [{key: 1, range: -1, tempo: 2}, {key: 1, range: -2, tempo: 1}, {key: 1, range: 1, tempo: 1}, {key: 2, range: 0, tempo: 2}, {key: 2, range: 2, tempo: 2}, {key: 2, range: 0, tempo: 4}, {key: 2, range: 0, tempo: 4}],
        [{key: 1, range: -1, tempo: 2}, {key: 1, range: -2, tempo: 1}, {key: 1, range: 0, tempo: 1}]
      ],
      tempoMap: {
        q: 4,
        w: 2,
        e: 1
      }
    }
  },
  components: { Bar },
  mounted () {
    let that = this
    let content = song.content
    this.notes = []
    content = content.split(' ')
    for (let bar of content) {
      let barArr = []
      bar = bar.split(',')
      for (let note of bar) {
        let key = 0
        let range = 0
        let tempo = 0
        key = note.replace(/[\^$]*/, '').replace(/[qwe]/, '')
        range = note.replace(/[0-7][qwe]/, '').indexOf('^') !== -1 ? note.replace(/[0-7][qwe]/, '').length : -note.replace(/[0-7][qwe]/, '').length
        tempo = note.replace(/[\^$0-7]*/, '')
        console.log(note, key, range, that.tempoMap[tempo])
        barArr.push({key, range, tempo: that.tempoMap[tempo]})
      }
      this.notes.push(barArr)
    }
  }
}
</script>
<style scoped>
  .wrapper {
    width: 960px;
    background-color: #fff;
    box-shadow: 0px 0px 10px #ccc;
    margin: 0 auto;
    padding: 30px;
  }
  .title {
    text-align: center;
    margin-bottom: 40px;
  }
</style>

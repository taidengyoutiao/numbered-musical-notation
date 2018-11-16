<template>
  <div>
    <div class="wrapper">
      <h2 class="title">{{title}}</h2>
      <div>
        <Bar v-for="(item, key) in notes" :key="key" :barData="item"></Bar>
      </div>
      <div>
        <textarea class="content-inp" v-model="content"></textarea>
      </div>
    </div>
    <div class="info">
      <h2>记谱法：</h2>
      <h3>音高</h3>
      <ul>
        <li>0-7分别代表休止符和音高</li>
        <li>^$ 代表高音低音，支持倍高音和倍低音</li>
        <li>#1 @1 代表升1和降1</li>
      </ul>
      <h3>节奏</h3>
      <ul>
        <li>十六分音符为最小单位</li>
        <li>qwe 分别代表四分音符、八分音符、十六分音符</li>
        <li>qw 代表带附点的四分音符，其他以此类推</li>
        <li>qq qqqq 代表二分音符、全音符</li>
      </ul>
      <h3>其他</h3>
      <ul>
        <li>逗号用来区分音符</li>
        <li>空格用来区分小节</li>
      </ul>
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
      content: '',
      tempoMap: {
        q: 4,
        rot: 'rot',
        w: 2,
        e: 1,
        qw: 6,
        wq: 6,
        we: 3,
        ew: 3
      }
    }
  },
  computed: {
    notes () {
      let that = this
      let content = this.content
      let arr = []
      content = content.replace(/\r|\n/g, ' ')
      content = content.replace(/\s+/g, ' ').trim()
      content = content.split(' ')
      for (let bar of content) {
        let barArr = []
        bar = bar.split(',')
        for (let note of bar) {
          let key = 0
          let range = 0
          let tempo = 0
          key = note.replace(/[\^$]*/, '').replace(/[qwe]{1,4}/, '')
          range = note.replace(/[@#0-7][qwe]/, '').indexOf('^') !== -1 ? note.replace(/[@#0-7][qwe]/, '').length : -note.replace(/[@#0-7][qwe]/, '').length
          tempo = note.replace(/[\^$@#0-7]*/, '')
          console.log(note, key, range, tempo)
          if (tempo.length > 1 && tempo[0] === tempo[1]) {
            for (let i = tempo.length; i > 0; i--) {
              if (i !== tempo.length) {
                debugger
                key = '-'
                range = 0
              }
              barArr.push({key, range, tempo: that.tempoMap[tempo.slice(0, 1)]})
            }
          } else {
            barArr.push({key, range, tempo: that.tempoMap[tempo]})
          }
        }
        arr.push(barArr)
      }
      return arr
    }
  },
  components: { Bar },
  mounted () {
    this.content = song.content
  }
}
</script>

<style scoped>
  .wrapper, .info {
    width: 960px;
    background-color: #fff;
    box-shadow: 0px 0px 10px #ccc;
    margin: 0 auto;
    padding: 30px;
  }
  .info {
    background-color: #e1e1e1;
    color: #333;
  }
  .title {
    text-align: center;
    margin-bottom: 40px;
  }
  .content-inp {
    width: 100%;
    min-height: 100px;
  }
</style>

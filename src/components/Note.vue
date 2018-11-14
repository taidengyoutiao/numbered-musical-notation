<template>
  <div class="note" :style="{width: noteWidth}">
    <sup v-if="String(noteKey).indexOf('@') !== -1">b</sup><sup v-if="String(noteKey).indexOf('#') !== -1">#</sup><span>{{String(noteKey) | noteKeyFilter}}</span>
    <!-- tempo decoration -->
    <template v-if="noteTempo == 1">
      <div class="deco-sixteen1"></div>
      <div class="deco-sixteen2"></div>
    </template>
    <template v-if="noteTempo == 2">
      <div class="deco-eight"></div>
    </template>
    <template v-if="noteTempo == 3">
      <div class="deco-eight"></div>
      <div class="deco-dot">
        <div class="dot"></div>
      </div>
    </template>
    <template v-if="noteTempo == 6">
      <div class="deco-dot">
        <div class="dot"></div>
      </div>
    </template>
    <!-- range decoration -->
    <template v-if="noteRange == 1">
      <div class="deco-high" style="top: 0;">
        <div class="deco-high-dot"></div>
      </div>
    </template>
    <template v-if="noteRange == 2">
      <div class="deco-high" style="top: 0;">
        <div class="deco-high-dot"></div>
      </div>
      <div class="deco-high" style="top: -3px;">
        <div class="deco-high-dot"></div>
      </div>
    </template>
    <template v-if="noteRange == -1">
      <div class="deco-high" style="bottom: -3px;">
        <div class="deco-high-dot"></div>
      </div>
    </template>
    <template v-if="noteRange == -2">
      <div class="deco-high" style="bottom: -3px;">
        <div class="deco-high-dot"></div>
      </div>
      <div class="deco-high" style="bottom: -6px;">
        <div class="deco-high-dot"></div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  // noteKey: 1代表do
  // noteRange: 1代表高音
  // noteTempo: 1代表16分音符, 2代表8分音符, 4代表4分音符
  props: ['noteKey', 'noteRange', 'noteTempo'],
  data () {
    return {
      a: 1
    }
  },
  computed: {
    noteWidth () {
      if (this.noteTempo === 1) {
        return '10px'
      } else if (this.noteTempo === 2 || this.noteTempo === 3) {
        return '20px'
      } else if (this.noteTempo === 4 || this.noteTempo === 6) {
        return '40px'
      } else {
      }
    }
  },
  filters: {
    noteKeyFilter (s) {
      return s.replace(/[@#]/, '')
    }
  }
}
</script>

<style scoped lang="scss">
  .note {
    text-align: center;
    display: inline-block;
    font-size: 14px;
    line-height: 20px;
    position: relative;
    width: 10px;
    height: 20px;
  }
  .deco-sixteen1 {
    position: absolute;
    width: 10px;
    left: 0;
    bottom: 0;
    height: 1px;
    background-color: #000;
  }
  .deco-sixteen2, .deco-eight {
    position: absolute;
    width: 10px;
    left: 0;
    bottom: 2px;
    height: 1px;
    background-color: #000;
  }
  .deco-eight {
    width: 20px;
  }
  .deco-high {
    position: absolute;
    width: 100%;
    height: 2px;
    text-align: center;
    .deco-high-dot {
      background-color: #000;
      margin: 0 auto;
      width: 2px;
      height: 2px;
      border-radius: 50%;
    }
  }
  .deco-dot {
    position: absolute;
    width: 100%;
    height: 20px;
    top: 0;
    left: 0;
    .dot {
      position: absolute;
      right: 0;
      top: 9px;
      background-color: #000;
      width: 2px;
      height: 2px;
      border-radius: 50%;
    }
  }
  sup {
    vertical-align: 0;
  }
</style>

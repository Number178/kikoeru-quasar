<template>
    <div
      v-if="currentLyric !== ''"
      class="lyric-container"
      ref="draggable"
    >
        <div class="fontSizeBar" :class="showSizeBar ? 'showSizeBarStyle' : 'hideSizeBarStyle'">
          <q-slider v-model="fontSize" :min="0.2" :max="10" :step="0" thumb-size="35px" @change="onFontSizeChange"/>
        </div>
        <div id="lyricsBar" class="text-center text-bold ellipsis-2-lines absolute-bottom non-selectable"
          :class="$q.dark.isActive ? 'text-purple-7' : 'text-purple-11'">
          <div class="lyricBackground" :class="$q.dark.isActive ? 'lyricBackgroundDarkMode' : 'lyricBackgroundLightMode'">
            <span id="lyric"
              :style="{'font-size': `${fontSize}rem`}"
              @mousedown="onCursorDown"
              @touchstart="onCursorDown">
              {{currentLyric}}
            </span>
          </div>
        </div>
      </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'LyricsBar',

  computed: {
    ...mapState('AudioPlayer', [
      'currentLyric'
    ]),
  },

  data () {
    return {
      beTouched: false,

      // 鼠标按下时的位置
      startX: 0,
      startY: 0,

      fontSize: 0, // rem
      
      showSizeBar: false,
      laterTimer: 0,
    }
  },

  watch: {
    fontSize(newv, oldv) {
      if (oldv > 0) this.showTempSizeBar()
    }
  },

  methods: {
    showTempSizeBar() {
      // return // debug only
      clearTimeout(this.laterTimer);
      this.showSizeBar = true;
      this.laterTimer = setTimeout(() => {
        this.showSizeBar = false;
      }, 3 * 1000); // 延迟关闭滑块
    },

    /**
     * @param {TouchEvent|MouseEvent} ev
     */
    getTouch(ev) {
      return ev.touches ? ev.touches[0] : ev;
    },

    onCursorDown(ev) {
      this.showTempSizeBar()
      ev.preventDefault()
      this.beTouched = true

      // 移动端使用 ev.touches[0]
      const touch = this.getTouch(ev)
      this.startX = touch.clientX - this.$refs.draggable.offsetLeft
      this.startY = touch.clientY - this.$refs.draggable.offsetTop
    },

    onCursorUp(ev) {
      if (!this.beTouched) return
      ev.preventDefault()
      this.beTouched = false
    },

    onCursorMove(ev) {
      if (!this.beTouched) { return }
      // ev.preventDefault()
      const touch = this.getTouch(ev)

      // 计算 element 新位置坐标
      const eleX = touch.clientX - this.startX
      const eleY = touch.clientY - this.startY

      this.$refs.draggable.style.left = eleX + 'px'
      this.$refs.draggable.style.top = eleY + 'px'
    },

    // 用户松开滑块之后才会触发此方法
    onFontSizeChange(v) {
      console.warn("fontSize change to: ", v)
      localStorage.lyricFontSize = v;
    }
    
  },

  mounted() {
    this.fontSize = parseFloat(localStorage.lyricFontSize || "1.5");
    // addEventListener('mousemove', onCursorMove(this), false)
    // addEventListener('touchmove', onCursorMove(this), false)
    addEventListener('mousemove', this.onCursorMove)
    addEventListener('touchmove', this.onCursorMove)

    addEventListener('mouseup', this.onCursorUp)
    addEventListener('touchend', this.onCursorUp)
    addEventListener('touchcancel', this.onCursorUp)
  },

  beforeDestroy() {
    removeEventListener('mousemove', this.onCursorMove)
    removeEventListener('touchmove', this.onCursorMove)

    removeEventListener('mouseup', this.onCursorUp)
    removeEventListener('touchend', this.onCursorUp)
    removeEventListener('touchcancel', this.onCursorUp)
  }
  
}
</script>

<style lang="scss">
  .lyric-container {
    position: relative;

    /* 水平位置置于中间 */
    left: 50vw;
    transform: translateX(-50%);

    /* 垂直位置置于底部playBar尚未考上一点，这个后面可以手动调整 */
    top: -80px;
    
    display: flex;
    flex-direction: column;
    align-self: center;
  }
  .moveable-line {
    background-color: transparent !important;
  }
  #lyricsBar {
    /* background-color: rgba($grey-4, $alpha: 0.6); */
    position: relative;
    min-width: 1vw;
    max-width: 90vw;
  }
  #lyric {
    text-shadow:1px 1px 2px black;
  }
  .lyricBackground {
    border-radius: 10px;
    padding: 2px 4px;
    transition: 0.5s;
  }
  .lyricBackgroundDarkMode {
    background-color: rgba($grey-7, $alpha: 0.8);
  }
  .lyricBackgroundLightMode {
    background-color: rgba($grey-5, $alpha: 0.7);
  }
  .fontSizeBar {
    width: 300px;
    position: absolute;
    left: 50%;
    bottom: 0;

    transition: 0.5s;
  }

  .showSizeBarStyle {
    opacity: 1;
    transform: translateX(-50%) translateY(100%);
  }
  .hideSizeBarStyle {
    opacity: 0;
    transform: translateX(-50%) translateY(0);
    visibility: hidden;
  }
</style>

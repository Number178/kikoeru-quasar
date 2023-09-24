<template>
    <div
      class="lyric-container"
      ref="draggable"
    >
        <div id="lyricsBar" class="text-center text-bold ellipsis-2-lines text-purple q-mb-md absolute-bottom non-selectable rounded-borders">
            <span id="lyric"
              @mousedown="onCursorDown"
              @touchstart="onCursorDown">
              {{currentLyric}}
            </span>
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
      startY: 0
    }
  },

  methods: {
    /**
     * @param {TouchEvent|MouseEvent} ev
     */
    getTouch(ev) {
      return ev.touches ? ev.touches[0] : ev;
    },

    onCursorDown(ev) {
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
    }
    
  },

  mounted() {
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
    top: -80px; /* */
  }
  .moveable-line {
    background-color: transparent !important;
  }
  #lyricsBar {
    /* background-color: rgba($grey-4, $alpha: 0.6); */
    position: relative;
    min-width: 1vw;
  }
  #lyric {
    text-shadow:1px 1px 2px black;
    font-size: 1.5rem;
  }
</style>

<template>
  <div ref="container" class="container" :style="{'--max-scroll': maxScroll}">
    <div class="scrolling" :style="scrollStyle">
      <div ref="slot" class="one-line-expand">
        <slot name="default"></slot>
        <span v-if="needScroll" class="spacer" :style="{'width': `${spacerWidth}px`}"></span>
        <slot v-if="needScroll" name="default"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { debounce } from 'quasar';


export default {
  name: 'Scrollable',
  props: {
    stop: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  data() {
    return {
      resizeObserver: null,
      maxScroll: '0',
      slotWidth: 0,
      needScroll: false,
      spacerWidth: 80, // px
    }
  },
  computed: {
    container() {
      return this.$refs.container;
    },
    slot() {
      return this.$refs.slot;
    },
    animationDuration() {
      return this.slotWidth / 30;
    },
    scrollStyle() {
      return {
        // 'animation-duration': `${this.slotWidth / 90}s`,
        'animation-duration': `${this.slotWidth / 60}s`,
        'animation-play-state': this.stop ? "paused" : "running",
        '--max-scroll': this.maxScroll,
      };
    }
  },
  mounted() {
    this.onSlotResize(); // 初始立即计算一次

    this.onSlotResize = debounce(this.onSlotResize, 500); // 之后防抖动
    this.resizeObserver = new ResizeObserver(this.onSlotResize);
    this.resizeObserver.observe(this.slot);
    this.resizeObserver.observe(this.container);
  },
  methods: {
    onSlotResize() {
      const containerWidth = this.container.clientWidth;

      let slotWidth = 0; // 单个滚动元素的长度

      if (this.needScroll) { // 正在滚动时，this.slot包含两个滚动元素，需要计算一下
        const slotSpacerSlotWidth = Math.round(this.slot.getBoundingClientRect().width);
        slotWidth = Math.floor((slotSpacerSlotWidth - this.spacerWidth) / 2)
      } else { // 没有滚动时，this.slot就是单个滚动元素的长度
        slotWidth = Math.round(this.slot.getBoundingClientRect().width);
      }

      if (slotWidth > containerWidth) {
        // |<-----slotWidth--------->|
        // [slot1]   [spacer]  [slot2]
        // |<--scrollToNext-->|
        const scrollToNextPhatom = slotWidth + this.spacerWidth;
        this.maxScroll = `-${scrollToNextPhatom}px`
        this.slotWidth = slotWidth * 2 + this.spacerWidth;
        this.needScroll = true;
      } else {
        this.maxScroll = "0";
        this.slotWidth = 0;
        this.needScroll = false;
      }
    }
  }
}
</script>
<style  lang="scss" scoped>
.container {
  overflow: hidden;
}

.one-line-expand {
  position: relative;
  white-space: nowrap;
  display: inline-block;
  // border: 1px solid red;
}

.scrolling {
  animation: scroll linear infinite ;
}

.spacer {
  display: inline-block;
  // border: 1px solid red;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  70% {
    transform: translateX(var(--max-scroll));
  }
  // stall
  100% {
    transform: translateX(var(--max-scroll));
  }
  
}
</style>
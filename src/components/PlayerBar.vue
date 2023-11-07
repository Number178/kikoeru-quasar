<template>
  <q-card
    class="bordered playBar"
    :class="{
      showStyle: showPlayBar,
      hideStyle: !showPlayBar,
      playBarBumpUp: isPanning
    }"
    draggable="false"
  >
    <div
      ref="playBarBox"
      class="row"
      color="primary"
      :class="{}"
    >
      <div class="simple-progress" :class="$q.dark.isActive ? 'simple-progress-dark' : 'simple-progress-light'" :style="progressBarStyle"></div>
      <div
        class="new-progress row justify-end"
        :class="{hideNewProgress: !isPanning}"
        :style="newProgressBarStyle"
      >
        <span class="q-pa-xs" :style="showDeltaTimeStyle" style="transition: all 0.5s;">
          <div class="text-h4">
            {{ showNewCurrentTime }}
          </div>
          <div>
            {{ showDeltaTime }}
          </div>
        </span>
      </div>
      <q-item 
        style="padding: 0px 5px;"
        class="col non-selectable"
        @mousedown.prevent.stop="mouseDown"
        @touchstart.prevent.stop="touchStart" 
        @touchend.prevent.stop="touchEnd" 
        @touchmove.prevent.stop="touchMove" 
        @touchcancel.prevent.stop="touchCancel" 
      >
        <q-item-section avatar>
          <q-img transition="fade" :src="samCoverUrl" style="height: 50px; width: 50px" class="rounded-borders" />
        </q-item-section>
        
        <q-item-section>
          <Scrollable class="full-width" :stop="!hide">
            <span class="audio-name relative-position">{{ currentPlayingFile.title }}</span>
          </Scrollable>
          <Scrollable class="full-width" :stop="!hide">
            <span class="work-name relative-position">{{ currentPlayingFile.workTitle }}</span>
          </Scrollable>
          <!--
          <q-item-label lines="2">{{ currentPlayingFile.title }}</q-item-label>
          <q-item-label caption lines="1">{{ currentPlayingFile.workTitle }}</q-item-label>
          -->
        </q-item-section>
      </q-item>

      <q-btn flat size="lg" :icon="swapSeekButton ? rewindIcon : 'skip_previous'" @click.prevent.stop="swapSeekButton ? rewind(true) : previousTrack()" style="height: 60px; width: 60px" class="col-auto gt-xs"/>
      <q-btn flat size="lg" :icon="playingIcon" @click.prevent.stop="togglePlaying()" style="height: 60px; width: 60px" class="col-auto" />
      <q-btn flat size="lg" :icon="swapSeekButton ? forwardIcon : 'skip_next'" @click.prevent.stop="swapSeekButton ? forward(true) : nextTrack()" style="height: 60px; width: 60px" class="col-auto gt-xs"/>
    </div>
  </q-card >
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'
import { formatSeconds } from '../utils'
import Scrollable from 'components/Scrollable'
const OpState = {
  idle: 0,
  up: 1,
  down: 2,
  horize: 3,
};

export default {
  name: 'PlayerBar',
  components: {
    Scrollable,
  },
  computed: {
    samCoverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      const hash = this.currentPlayingFile.hash
      return hash ? `/api/cover/${hash.split('/')[0]}?type=sam&token=${token}` : ""
    },

    showPlayBar () {
      return this.currentPlayingFile.hash && this.hide;
    },

    playingIcon () {
      return this.playing ? "pause" : "play_arrow"
    },

    progressBarStyle() {
      let percent = (this.currentTime / this.duration) * 100;
      return {
        width: `${percent.toFixed(5)}%`,
      }
    },

    newCurrentTime() {
      return this.deltaTime + this.startCurrentTime;
    },

    showDeltaTime() {
      return `${this.deltaTime >= 0 ? '+': ''}${this.deltaTime.toFixed(1)}s`
    },

    showNewCurrentTime() {
      return formatSeconds(this.newCurrentTime);
    },
     
    showDeltaTimeStyle() {
      // 当拖拽调整时间太小的时候，将deltaTime的显示位置向右侧偏移，避免显示区域过小看不到
      const moveRightPercentThres = 0.4;
      if (this.newCurrentTime / this.duration < moveRightPercentThres) {
        return {
          transform: 'translateX(100%)',
          'text-align': 'left',
        };
      } else {
        return {
          'text-align': 'right',
        }; // do nothing
      }
    },

    // 拖动进度条时候的新进度条
    newProgressBarStyle() {
      const percent = Math.max(0, Math.min(100, (this.startCurrentTime + this.deltaTime) / this.duration * 100));
      // const percent = 80;
      return {
        width: `${percent.toFixed(5)}%`,
      };
    },

    isPanning() {
      // return true;
      return this.state == OpState.horize;
    },

    ...mapState('AudioPlayer', [
      'hide',
      'playing',
      'currentTime',
      'duration',
      'swapSeekButton',
      'rewindSeekTime',
      'forwardSeekTime'
    ]),

    ...mapGetters('AudioPlayer', [
      'currentPlayingFile'
    ]),


    rewindIcon () {
      switch (this.rewindSeekTime) {
        case 5:
          return 'replay_5'
        case 10:
          return 'replay_10'
        case 30:
          return 'replay_30'
        default:
          return 'replay_5'
      }
    },

    forwardIcon () {
      switch (this.forwardSeekTime) {
        case 5:
          return 'forward_5'
        case 10:
          return 'forward_10'
        case 30:
          return 'forward_30'
        default:
          return 'forward_5'
      }
    }
  },

  data() {
    return {
      OpState,
      state: OpState.idle,
      vertTriggerPixels: 10, // 向上触发像素距离
      horizeTriggerPixels: 10, // 左右触发像素距离

      startClientX: 0,
      startClientY: 0,
      startCurrentTime: 0,
      maxDeltaTime: 0,
      minDeltaTime: 0,
      deltaTime: 0,
    };
  },

  methods: {
    ...mapMutations('AudioPlayer', {
      toggleHide: 'TOGGLE_HIDE',
      togglePlaying: 'TOGGLE_PLAYING',
      nextTrack: 'NEXT_TRACK',
      previousTrack: 'PREVIOUS_TRACK',
      // changePlayMode: 'CHANGE_PLAY_MODE',
      // setVolume: 'SET_VOLUME',
      rewind: 'SET_REWIND_SEEK_MODE',
      forward: 'SET_FORWARD_SEEK_MODE',
      setNewCurrentTime: 'SET_NEW_CURRENT_TIME',
    }),

    showAudioPlayer() {
      if (this.hide) this.toggleHide()
    },

    startPanning(x, y) {
      this.startClientX = x;
      this.startClientY = y;
      this.startCurrentTime = this.currentTime;
      this.maxDeltaTime = this.duration - this.startCurrentTime;
      this.minDeltaTime = - this.startCurrentTime;
    },

    panningMove(x, y) {
      const deltaY = y - this.startClientY;
      const deltaX = x - this.startClientX;

      switch(this.state) {
        case OpState.idle: {
          // 注：y坐标越向下越大
          if (deltaY <= -this.vertTriggerPixels) {
            this.state = OpState.up;
            this.showAudioPlayer();
            break;
          } else if (deltaY >= this.vertTriggerPixels) {
            this.state = OpState.down; // do nothing
          } else if (Math.abs(deltaX) >= this.horizeTriggerPixels) {
            this.state = OpState.horize;

            // // 更新start坐标，来弥补前面的这段空白位置区间
            // this.startClientX = x;
            // this.startClientY = y;

            break;
          }
          break;
        }

        case OpState.up:
        case OpState.down:
          break;

        case OpState.horize:
          this.deltaTime = Math.max(this.minDeltaTime, Math.min(this.maxDeltaTime, deltaX / this.$refs.playBarBox.clientWidth * this.duration));
          break;
      }
    },

    panningEnd() {
      if (this.state == OpState.idle) {
        // 触摸结束时，如果并没有被识别成任何方向的扫描，则认为是点击操作，打开audioPlayer
        this.showAudioPlayer();
      } else if (this.state == OpState.horize) {
        this.setNewCurrentTime(this.newCurrentTime);
      }
      // this.deltaTime = 0;
      this.state = OpState.idle;
    },

    mouseDown(event) {
      const {clientX: x, clientY: y} = event;
      // console.log(`mouse donw: (x:${x}, y:${y})`);
      this.startPanning(x, y);

      document.addEventListener('mousemove', this.mouseMove)
      document.addEventListener('mouseup', this.mouseUp)
    },

    mouseMove(event) {
      const {clientX: x, clientY: y} = event;
      // console.log(`mouse move: (x:${x}, y:${y})`);
      this.panningMove(x, y);
    },

    mouseUp(event) {
      this.panningEnd();
      document.removeEventListener('mousemove', this.mouseMove)
      document.removeEventListener('mouseup', this.mouseUp)
    },

    touchStart(event) {
      if (event.changedTouches.length <= 0) return;
      const {clientX: x, clientY: y} = event.changedTouches[0];
      // console.log(`touch start: (x:${x}, y:${y})`);
      this.startPanning(x, y);
    },
    touchEnd(event) {
      // console.log('touch end')
      this.panningEnd();
    },
    touchCancel(event) {
      // console.log('touch cancel')
      // this.deltaTime = 0;
      this.state = OpState.idle;
    },
    touchMove(event) {
      if (event.changedTouches.length <= 0) return;
      const {clientX: x, clientY: y} = event.changedTouches[0];
      // console.log(`touch move: (x:${x}, y:${y})`)
      this.panningMove(x, y);
    },
  }
}
</script>
<style lang="scss" scoped>
.simple-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  /* width: 100%; */
  opacity: 1;
}

.simple-progress-dark {
  background-color: rgba($primary, $alpha: 0.5);
}
.simple-progress-light {
  background-color: rgba($primary, $alpha: 0.3);
}

.new-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  /* width: 100%; */
  background-color: rgba($warning, $alpha: 0.5);
  transition: opacity 0.5s;
}

.hideNewProgress {
  opacity: 0.0;
}

.playBar {
  bottom: 20px;
  margin-left: 50%;
  max-width: 500px;
  transform: translateX(-50%) translateY(0);

  border-radius: 8px;
  /* background: white; */
  box-shadow: black 0px 0px 8px;
  overflow: hidden;
  position: fixed;
  transition: 0.5s;
  color: inherit;
}

// 左右拖拽playBar的时候，将控件顶部突出一些部分展示更多进度条，方便观察拖拽的进度
.playBarBumpUp {
  padding: 4rem 0 0 0;
}

.hideStyle {
  transform: translateX(-50%) translateY(200%);

  // 不同尺寸下，AudioPlayer位于全屏、或者右下角，
  // 参考其位置，调整底部playerBar隐藏时去往的地方，使动画更连贯
  // 宽度 > $breakpoint-sm-min
  @media (min-width: $breakpoint-sm-min) {
    margin-left: 100%;
  }
  // 宽度 < $breakpoint-xs-max (599px)
  @media (max-width: $breakpoint-xs-max) {
    width: 80vw;
  }
}

.showStyle {
  transform: translateX(-50%) translateY(0);
  width: 80vw;
}


.audio-name {
  font-weight: bold;
  white-space: nowrap;
}

.work-name {
  opacity: 0.7;
  white-space: nowrap;
}

</style>

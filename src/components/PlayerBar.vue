<template>
  <q-card class="bordered playBar" :class="{showStyle: showPlayBar, hideStyle: !showPlayBar}">
    <div class="row text-dark">
      <q-item clickable v-ripple @click="toggleHide()" style="padding: 0px 5px;" class="col non-selectable">
        <q-item-section avatar>
          <q-img transition="fade" :src="samCoverUrl" style="height: 50px; width: 50px" class="rounded-borders" />
        </q-item-section>
        
        <q-item-section>
          <q-item-label lines="2">{{ currentPlayingFile.title }}</q-item-label>
          <q-item-label caption lines="1">{{ currentPlayingFile.workTitle }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-btn flat size="lg" color="primary" :icon="swapSeekButton ? rewindIcon : 'skip_previous'" @click="swapSeekButton ? rewind(true) : previousTrack()" style="height: 60px; width: 60px" class="col-auto gt-xs"/>
      <q-btn flat size="lg" color="primary" :icon="playingIcon" @click="togglePlaying()" style="height: 60px; width: 60px" class="col-auto" />
      <q-btn flat size="lg" color="primary" :icon="swapSeekButton ? forwardIcon : 'skip_next'" @click="swapSeekButton ? forward(true) : nextTrack()" style="height: 60px; width: 60px" class="col-auto gt-xs"/>
      <div class="simple-progress" :style="progressBarStyle"></div>
    </div>
  </q-card >
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

export default {
  name: 'PlayerBar',

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

  methods: {
    ...mapMutations('AudioPlayer', {
      toggleHide: 'TOGGLE_HIDE',
      togglePlaying: 'TOGGLE_PLAYING',
      nextTrack: 'NEXT_TRACK',
      previousTrack: 'PREVIOUS_TRACK',
      // changePlayMode: 'CHANGE_PLAY_MODE',
      // setVolume: 'SET_VOLUME',
      rewind: 'SET_REWIND_SEEK_MODE',
      forward: 'SET_FORWARD_SEEK_MODE'
    }),
  }
}
</script>
<style scoped>
.simple-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 2px;
  /* width: 100%; */
  background-color: var(--q-color-positive);
}

.playBar {
  left: 20px;
  right: 20px;
  bottom: 20px;
  border-radius: 8px;
  /* background: white; */
  box-shadow: black 0px 0px 8px;
  overflow: hidden;
  position: fixed;
  transition: transform 0.5s ;
  color: inherit;
}

.hideStyle {
  transform: translateY(200%);
}

.showStyle {
  transform: translateY(0);
}


</style>

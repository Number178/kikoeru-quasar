<template>
  <q-slide-transition>
    <div v-show="currentPlayingFile.hash && hide" class="row">
      <q-item clickable v-ripple @click="toggleHide()" style="padding: 3px;" class="col non-selectable">
        <q-item-section avatar>
          <q-img :src="coverUrl" style="height: 54px; width: 72px" class="rounded-borders" />
        </q-item-section>
        
        <q-item-section>
          <q-item-label lines="1">{{currentPlayingFile.name}}</q-item-label>
          <q-item-label caption lines="1">{{currentPlayingFile.subtitle}}</q-item-label>
        </q-item-section>
      </q-item>

      <q-btn flat size="lg" :icon="playingIcon" @click="togglePlaying()" style="height: 60px; width: 60px" class="col-auto" />
    </div>
  </q-slide-transition>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'PlayerBar',

  computed: {
    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      const hash = this.currentPlayingFile.hash
      return hash ? `/api/cover/${hash.substring(0, hash.indexOf('/'))}?token=${token}` : ""
    },

    hide () {
      return this.$store.state.AudioPlayer.hide
    },

    playingIcon () {
      return this.$store.state.AudioPlayer.playing ? "pause" : "play_arrow"
    },

    ...mapGetters({
      currentPlayingFile: 'AudioPlayer/currentPlayingFile'
    })
  },

  methods: {
    toggleHide () {
      this.$store.commit('AudioPlayer/TOGGLE_HIDE')
    },

    togglePlaying () {
      this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
    }
  }
}
</script>

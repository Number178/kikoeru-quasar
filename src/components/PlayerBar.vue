<template>
  <q-slide-transition>
    <div v-show="currentPlayingHash" class="row items-center q-gutter-sm q-px-sm"> 
      <router-link :to="'/player'" class="col-auto">
        <q-avatar square size="55px">
          <q-img :src="coverUrl" :ratio="4/3"/>
        </q-avatar>
      </router-link>
  
      <span class="col">{{currentPlayingTitle}}</span>

      <q-btn flat round :icon="playingIcon" @click="togglePlaying()" class="col-auto" />
    </div>
  </q-slide-transition>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'PlayerBar',

  computed: {
    coverUrl () {
      const hash = this.currentPlayingHash
      return hash
        ? `/api/cover/${hash.substring(0, hash.indexOf('/'))}`
        : ""
    },

    playingIcon () {
      return this.$store.state.AudioPlayer.playing ? "pause" : "play_arrow"
    },

    progress() {
      return this.$store.state.AudioPlayer.progress
    },

    ...mapGetters({
      currentPlayingHash: 'AudioPlayer/currentPlayingHash',
      currentPlayingTitle: 'AudioPlayer/currentPlayingTitle'
    })
  },

  methods: {
    togglePlaying () {
      this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
    }
  }
}
</script>

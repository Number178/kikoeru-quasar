<template>
  <div v-show="currentlyPlayingHash">
    <div class="row items-center q-gutter-sm q-px-sm">
      <div class="col-auto ">
        <router-link :to="'/player'">
          <q-avatar square size="55px">
            <q-img :src="coverUrl" :ratio="4/3"/>
          </q-avatar>
        </router-link>
      </div>
  
      <div class="col">
        {{currentlyPlayingTitle}}
      </div>

      <div class="col-auto">
        <q-btn
          flat
          round
          :icon="playingIcon"
          @click="togglePlaying()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'PlayerBar',

  computed: {
    coverUrl () {
      const hash = this.currentlyPlayingHash
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
      currentlyPlayingHash: 'AudioPlayer/currentlyPlayingHash',
      currentlyPlayingTitle: 'AudioPlayer/currentlyPlayingTitle'
    })
  },

  methods: {
    togglePlaying () {
      this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
    }
  }
}
</script>

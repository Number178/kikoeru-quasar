<template>
  <Moveable v-bind="moveable" @drag="handleDrag">
    <q-card>
        <div id="lyricsBar" class="text-center text-h6 text-bold ellipsis-2-lines text-purple q-mb-md absolute-bottom">
            <span id="lyric">
              {{currentLyric}}
            </span>
        </div>
    </q-card>
  </Moveable>
</template>

<script>
import Moveable from "vue-moveable";
import { mapState } from 'vuex'

export default {
  name: 'LyricsBar',

  components: {
    Moveable,
  },

  computed: {
    ...mapState('AudioPlayer', [
      'currentLyric'
    ]),
  },

  data () {
    return {
      moveable: {
        draggable: true,
      },
    }
  },

  methods: {
    handleDrag({ target, transform }) {
      target.style.transform = transform;
    },
  },
}
</script>

<style lang="scss">
  .moveable-line {
    background-color: transparent !important;
  }
  #lyricsBar {
    background-color: rgba($grey-4, $alpha: 0.6);
  }
</style>

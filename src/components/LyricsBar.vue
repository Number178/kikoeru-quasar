<template>
  <Moveable v-bind="moveable" @drag="handleDrag">
    <q-card>
        <div id="lyricsBar" class="text-center text-h6 text-bold ellipsis-2-lines text-purple q-mb-md absolute-bottom">
            <span id="lyric">
              <!-- 歌词占位 -->
            </span>
        </div>
    </q-card>
  </Moveable>
</template>

<script>
import Moveable from "vue-moveable";

export default {
  name: 'LyricsBar',

  components: {
    Moveable,
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

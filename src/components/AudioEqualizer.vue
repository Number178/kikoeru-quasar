<template>
  <div class="container">
    <div class="text-h5">均衡器</div>
    <q-toggle
      v-model="isFlipLeftRightChannel"
      color="primary"
      :icon="isFlipLeftRightChannel ? 'sync_alt' : 'headphones'"
      label="左右声道交换"
    />
  </div>
</template>

<script>

import { mapState } from 'vuex'

export default {
  name: 'AudioEqualizer',

  data () {
    return {
      isFlipLeftRightChannel: false,
    }
  },

  watch: {
    isFlipLeftRightChannel(v) {
      this.flipLeftRightChannel(v);
    }
  },

  computed: {
    ...mapState("AudioPlayer", [
      "enableVisualizer",
      "audioAnalyser",
    ])
  },

  methods: {
    flipLeftRightChannel(flip) {
      const {audioSrc, merger, splitter, audioCtx, left, right} = this.audioAnalyser;
      if (flip) {
        // disconnect direct source
        audioSrc.disconnect(audioCtx.destination);

        // analyser flip
        splitter.disconnect();
        splitter.connect(right, 0); // 0 for output of right
        splitter.connect(left, 1); // 1 for output of left

        // audio flip and merge
        splitter.connect(merger, 0, 1);
        splitter.connect(merger, 1, 0);
        merger.connect(audioCtx.destination);

      } else {
        // disconnect flipped source
        merger.disconnect();

        splitter.disconnect(); // break up analyser and merger

        // reconnect analyser
        splitter.connect(left, 0);
        splitter.connect(right, 1);

        // normal source
        audioSrc.connect(audioCtx.destination);
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
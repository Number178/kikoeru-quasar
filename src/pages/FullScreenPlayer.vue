<template>
  <div class="container">
    <q-img contain :src="coverUrl" class="constrain-height"/>
    <canvas class="visualizer" ref="visualizer" width="500" height="500"></canvas>
  </div>
</template>
   
<script>
import { mapState } from 'vuex'

export default {
  name: "FullScreenPlayer",

  data () {
    return {
      counter: 0,
    }
  },

  methods: {
    audioElementInit() {
      // console.log("audio element = ", this.audioElement);
      // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // const analyser = audioCtx.createAnalyser();
      const analyser = this.audioElement;
      if (!analyser) return;

      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArray.fill(255, 0, bufferLength);
      analyser.getByteFrequencyData(dataArray);
      // // Connect the source to be analysed
      // // source.connect(analyser);
      // Get a canvas defined with ID "oscilloscope"

      const canvas = this.$refs.visualizer;
      const canvasCtx = canvas.getContext("2d");
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      // draw an oscilloscope of the current audio source
      canvasCtx.font="80px Arial";

      const updateAnalyser = () => {
        const analyser = this.audioElement;
        analyser.getByteFrequencyData(dataArray);
      }


      let count = 0
      function draw() {
        requestAnimationFrame(draw);
        updateAnalyser();

        count = (count + 1) % 20

        canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.fillStyle = "rgb(128, 128, 128)"
        canvasCtx.fillText(`1testing ${dataArray[0]}`, 40, 40)
        canvasCtx.fillText(`count: ${count}, ${analyser}`, 40, 80)
        const barWidth = (WIDTH / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
        
          canvasCtx.fillStyle = "rgb(140, 20, 252, 0.2)";
          canvasCtx.fillRect(
            x,
            HEIGHT - barHeight / 2,
            barWidth,
            barHeight / 2
          );
        
          x += barWidth + 1;
        }
      }
      draw();
    }
  },

  computed: {
    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return this.visualPlayerCoverUrl
        ? `${this.visualPlayerCoverUrl}?token=${token}`
        : ""
    },
    
    ...mapState('AudioPlayer', [
      'visualPlayerCoverUrl',
      'audioElement'
    ])
  },

  watch: {
    // audioElement() {
    //   this.audioElementInit();
    // }
  },
  mounted() {
    // this.audioElementInit();
  }
}
</script>

<style scoped>

.container {
  position: relative;
}

.constrain-height {
  max-height: calc(100vh - 110px);
}

.visualizer {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  bottom: 0;
}
</style>
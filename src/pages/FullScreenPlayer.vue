<template>
  <div class="container">
    <q-img contain :src="coverUrl" class="constrain-height"/>
    <canvas class="visualizer" ref="visualizer" width="500" height="500"></canvas>
  </div>
</template>
   
<script>
import { mapState } from 'vuex'

// direction: 'left' / 'right'
function fillFrequencyData(canvasWidth, canvasHeight, dataArray, canvasCtx, direction) {
  const len = dataArray.length;

  const maxBarWidthPercent = 0.10;

  // frequency count is allways even
  function mapBarIndexToFrequencyIndex(barIdx) {
    return barIdx % 2 == 0 
      ? (len / 2 - barIdx / 2)
      : (len / 2 + (barIdx - 1) / 2 + 1);
  }

  const barHeight = canvasHeight / len;

  canvasCtx.fillStyle = "rgb(140, 20, 252, 0.4)";
  for (let i = 0; i < len; ++i) {
    const frequencyIdx = mapBarIndexToFrequencyIndex(i);
    let x,y,w,h;
    y = frequencyIdx * barHeight;
    const barWidth = maxBarWidthPercent * canvasWidth * (dataArray[i] / 255);
    if (direction == 'left') {
      x = 0;
      w = barWidth;
      h = barHeight - 2;
    } else if (direction == 'right') {
      x = canvasWidth - barWidth;
      w = barWidth;
      h = barHeight - 2;
    }
    canvasCtx.fillRect(x, y, w, h);
  }
}

export default {
  name: "FullScreenPlayer",

  data () {
    return {
      counter: 0,
      stopper: { stop: false },
    }
  },

  methods: {
    audioElementInit() {
      // console.log("audio element = ", this.audioElement);
      // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // const analyser = audioCtx.createAnalyser();
      const analyser = this.audioAnalyser;
      this.stopper.stop = true;
      const newStopper = { stop: false };
      this.stopper = newStopper;

      if (!analyser) return;

      const setAnalyser = (analyser) => {
        analyser.fftSize = 32;
        analyser.minDecibels = -81;
        analyser.maxDecibels = -11;

        // 平滑参数 [0,1]，数字越大实际变化的越平滑
        if (this.$q.platform.is.ios) {
          analyser.smoothingTimeConstant = 0.8; 
        } else {
          analyser.smoothingTimeConstant = 0.95;
        }
      }
      function getAnalyserArray(analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArray.fill(255, 0, bufferLength);
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
      }

      setAnalyser(analyser.left);
      setAnalyser(analyser.right);

      const leftDataArray = getAnalyserArray(analyser.left);
      const rightDataArray = getAnalyserArray(analyser.right);
      
      // // Connect the source to be analysed
      // // source.connect(analyser);
      // Get a canvas defined with ID "oscilloscope"

      const canvas = this.$refs.visualizer;
      const canvasCtx = canvas.getContext("2d");
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      // draw an oscilloscope of the current audio source
      canvasCtx.font="80px Arial";

      let count = 0
      function draw() {
        if (newStopper.stop) return false;

        requestAnimationFrame(draw);
        analyser.left.getByteFrequencyData(leftDataArray);
        analyser.right.getByteFrequencyData(rightDataArray);

        count = (count + 1) % 20

        canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        fillFrequencyData(WIDTH, HEIGHT, leftDataArray, canvasCtx, 'left');
        fillFrequencyData(WIDTH, HEIGHT, rightDataArray, canvasCtx, 'right');

        // // canvasCtx.fillStyle = "rgb(128, 128, 128)"
        // // canvasCtx.fillText(`1testing ${dataArray[0]}`, 40, 40)
        // // canvasCtx.fillText(`count: ${count}, ${analyser}`, 40, 80)
        // let barWidth = (WIDTH / bufferLength) * 2.5;
        // let barHeight;
        // let x = 0;
        // for (let i = 0; i < bufferLength; i++) {
        //   barHeight = dataArray[i];
        
        //   canvasCtx.fillStyle = "rgb(140, 20, 252, 0.2)";
        //   canvasCtx.fillRect(
        //     x,
        //     HEIGHT - barHeight / 2,
        //     barWidth,
        //     barHeight / 2
        //   );
        
        //   x += barWidth + 1;
        // }
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
      'audioAnalyser'
    ])
  },

  watch: {
    audioAnalyser() {
      this.audioElementInit();
    }
  },
  mounted() {
    this.audioElementInit();
  },
  destroyed() {
    this.stopper.stop = false;
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
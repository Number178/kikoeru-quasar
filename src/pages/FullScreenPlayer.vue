<template>
  <div class="container" ref="container" @dblclick="clickOnContainer">
    <div class="img-blur-background" :style="containerStyle"></div>
    <q-img contain :src="coverUrl" class="constrain-height"/>
    <canvas class="visualizer" ref="visualizer" width="1000" height="1000"></canvas>
    <div class="simple-progress" :style="progressBarStyle"></div>
    <div class="footer">
      <LyricsBar v-if="isInFullScreen" />
    </div>
    <div v-if="isInFullScreen" class="current-playing-info">
      <div class="text-h6 text-weight-bolder">
        {{ title }}
      </div>
    </div>
  </div>
</template>
   
<script>
import { mapState, mapGetters } from 'vuex'
import LyricsBar from 'components/LyricsBar'


class Vec {
  static toVec(number_or_vec) {
    if (number_or_vec instanceof Array) {
      return number_or_vec;
    } else {
      return [number_or_vec, number_or_vec]
    }
  }

  static add(p1, p2) {
    const [x1, y1] = Vec.toVec(p1);
    const [x2, y2] = Vec.toVec(p2);
    return [x1 + x2, y1 + y2];
  }

  static sub(p1, p2) {
    const [x1, y1] = Vec.toVec(p1);
    const [x2, y2] = Vec.toVec(p2);
    return [x1 - x2, y1 - y2];
  }

  static mul(p1, p2) {
    const [x1, y1] = Vec.toVec(p1);
    const [x2, y2] = Vec.toVec(p2);
    return [x1 * x2, y1 * y2];
  }
}

function factorial(x) {
  x = Math.floor(x);
  if (factorial.memo.has(x)) return factorial.memo.get(x);

  let result;
  if (x <= 1) {
    result = 1;
  } else {
    result = x * factorial(x - 1);
  } 
  factorial.memo[x] = result;
  return result;
}
factorial.memo = new Map();

class RandomMotionRoutine {
  // num_sample_point 随机采样点数量
  // interval_mills 动画周期时间
  // contain_square 运动正方形区域边长
  constructor(num_sample_point, interval_mills, contain_square) {
    this.num_sample_point = num_sample_point;
    this.interval_mills = interval_mills;
    this.last_mills = 0;
    this.played_mills = 0;
    this.contain_square = contain_square
    this.points = [];
    for (let i = 0; i < num_sample_point; ++i) {
      this.points.push([
        Math.random(),
        Math.random(),
      ]);
    }
    const firstPoint = this.points[0];
    const secondPoint = this.points[1];
    const diff = Vec.sub(firstPoint, secondPoint);
    const smoothEndPoint = Vec.add(firstPoint, diff);
    this.points.push(smoothEndPoint); // smooth and loop to the start
    this.points.push(firstPoint); // close the curve with first point
  }

  // 多阶贝塞尔曲线计算公式参考：https://www.zhihu.com/question/29565629
  berzierSample(t) {
    // console.log("sample animation progress = ", t);
    let lastPoint = [0, 0];
    const n = this.points.length - 1;
    for (let i = 0; i <= n; ++i) {
      lastPoint = Vec.add(lastPoint, Vec.mul(this.points[i], this.term(i, n, t)));
    }
    return lastPoint;
  }

  term(i, n, t) {
    return factorial(n) / (factorial(i) * factorial(n - i)) * Math.pow(t, i) * Math.pow(1 - t, n-i);
  }

  animate(mills) {
    this.played_mills += mills - this.last_mills;
    if (this.played_mills > this.interval_mills) this.played_mills = 0;
    this.last_mills = mills;

    const progress = this.played_mills / this.interval_mills;
    // const dp = this.sampleAnimation(progress);
    const dp = this.berzierSample(progress);

    return Vec.mul(dp, this.contain_square);
  }

  sampleAnimation(t) {
    let layer = this.points;
    while(layer.length > 1) {
      layer = layer.slice(0, layer.length - 1).map((value, idx) => {
        return Vec.add(Vec.mul(value, t), Vec.mul(1 - t, layer[idx]));
      });
    }
    return layer[0];
  }
}

class HaloManager {
  constructor() {
    //                                        
    //                                        
    //          _________                       
    //         /         \                   
    //        /           \                   
    //       /    ______   \                     
    //      /   /       \   \                  
    //     /   /         \   |                  
    //    |   |     c1    |  |               
    //    |   |           |  |                
    //    \    \         /   /                   
    //     \    \_______/   /                
    //      \              /
    //       \            /                    
    //        \__________/                              
    //                                        
    //                                        

    // center is located in [1.0, 1.0] coordinate
    this.relative_center_inner_list = []; // [[x1, y1], [x2, y2], [x3, y3], ...]

    // radius is scaled acrooding to minimal length of
    // this.center_outter_list = []; // [[x1, y1], [x2, y2], [x3, y3], ...]
    this.inner_radius_list = []; // [r1, r2, r3, ...]
    this.outter_radius_list = []; // [r1, r2, r3, ...]
    this.motion_routine_list = [];
    this.is_data_dirty = true; // 上述三个属性是否发生变化，如果变化，则需要在update函数中重新计算radial gradient

    this.radial_gradient_list = []; // [CanvasGradient1, CanvasGradient2, ...] // created on update method
    this.absolute_center_inner_list = []; // 更新后的canvas上绘制圆形的绝对坐标地址

    this.last_canvas_width = 0;
    this.last_canvas_height = 0;
  }

  // relative_x/y is located in [0.0, 1.0]
  addHalo(relative_x, relative_y, radius, interval_mills) {
    this.relative_center_inner_list.push([relative_x, relative_y]);
    this.absolute_center_inner_list.push([0,0]);
    this.inner_radius_list.push(0);
    this.outter_radius_list.push(radius);
    this.motion_routine_list.push(new RandomMotionRoutine(10, interval_mills, 0.1));
    this.is_data_dirty = true;
  }

  absolutePoint(relative_point) {
    return [relative_point[0] * this.last_canvas_width, relative_point[1] * this.last_canvas_height];
  }

  // raf当中更新光晕运动
  // 目前这里不做任何位置更新
  update(mills_time, canvas_ctx) {
    if (this.last_canvas_height != canvas_ctx.canvas.height) {
      this.last_canvas_height = canvas_ctx.canvas.height;
      this.is_data_dirty = true;
    }
    if (this.last_canvas_width != canvas_ctx.canvas.width) {
      this.last_canvas_width = canvas_ctx.canvas.width;
      this.is_data_dirty = true;
    }

    for (let i = 0; i < this.relative_center_inner_list.length; ++i) {
      const rp = this.relative_center_inner_list[i];
      const dp = this.motion_routine_list[i].animate(mills_time);
      const ap = this.absolutePoint(Vec.add(rp, dp));
      const inner_radius = this.inner_radius_list[i];
      const outter_radius = this.outter_radius_list[i];

      const gradient = canvas_ctx.createRadialGradient(ap[0], ap[1], inner_radius, ap[0], ap[1], outter_radius);
      // Add three color stops

      gradient.addColorStop(0.0, "rgba(255,255,255,0.0)");
      gradient.addColorStop(0.7, "rgba(255,255,255,0.1)");
      gradient.addColorStop(0.9, "rgba(255,255,255,0.2)");
      gradient.addColorStop(1.0, "rgba(255,255,255,0.0)");
      this.radial_gradient_list[i] = gradient;
      this.absolute_center_inner_list[i] = ap;
    }
    this.is_data_dirty = false
  }

  // 在canvas当中绘制
  draw(canvas_ctx) {
    for (let i = 0; i < this.relative_center_inner_list.length; ++i) {
      const ap = this.absolute_center_inner_list[i];
      const inner_radius = this.inner_radius_list[i];
      const outter_radius = this.outter_radius_list[i];
      const gradient = this.radial_gradient_list[i];

      canvas_ctx.fillStyle = gradient;
      canvas_ctx.beginPath();
      canvas_ctx.arc(ap[0], ap[1], outter_radius, 0, 2 * Math.PI, true);
      canvas_ctx.fill();
      // console.log("circle absolute position = ", ap);
    }
  }
}

// dataArray: frequency data from analyser node
// direction: 'left' / 'right'
// halos: list of drawing halo
function fillFrequencyData(dataArray, canvasCtx, direction, halos) {
  const len = dataArray.length;

  const canvasWidth = canvasCtx.canvas.width;
  const canvasHeight = canvasCtx.canvas.height;
  const maxBarWidthPercent = 0.30;
  const offsetBarPerent = 0.20;
  const barCenterX = direction == 'left' 
    ? canvasWidth * offsetBarPerent
    : canvasWidth - canvasWidth * offsetBarPerent;

  // frequency count is allways even
  function mapBarIndexToFrequencyIndex(barIdx) {
    return barIdx % 2 == 0 
      ? (len / 2 - barIdx / 2 - 1)
      : (len / 2 + (barIdx - 1) / 2);
  }

  const barHeight = canvasHeight / len;
  const minimalBarWidth = 4;

  canvasCtx.fillStyle = "rgb(140, 20, 252, 0.4)";
  for (let i = 0; i < len; ++i) {
    const frequencyIdx = mapBarIndexToFrequencyIndex(i);
    let x,y,w,h;
    const barWidth = Math.max(minimalBarWidth, maxBarWidthPercent * canvasWidth * (dataArray[i] / 255));
    x = barCenterX - barWidth * 0.5;
    y = frequencyIdx * barHeight;
    w = barWidth;
    h = barHeight - 2;
    canvasCtx.fillRect(x, y, w, h);
  }
  // canvasCtx.fillStyle = "rgb(140, 20, 252, 0.1)";
  // canvasCtx.fillRect(barCenterX - 1, 0, 2, canvasHeight)
}

export default {
  name: "FullScreenPlayer",

  components: {
    LyricsBar
  },

  data () {
    return {
      workid: this.$route.params.id,
      counter: 0,
      stopper: { stop: false },
      isInFullScreen: false,
      haloManager: null,
    }
  },

  methods: {
    clickOnContainer() {
      if (this.isInFullScreen) {
        document.exitFullscreen();
      } else {
        this.$refs.container.requestFullscreen();
      }
    },

    // triggerred when fullscreen state changed
    onFullscreenChange() {
      this.isInFullScreen = document.fullscreenElement !== null;
    },

    setAnalyser(analyser) {
      analyser.fftSize = 128;
      analyser.minDecibels = -81;
      analyser.maxDecibels = -11;

      // 平滑参数 [0,1]，数字越大实际变化的越平滑
      if (this.$q.platform.is.ios) {
        analyser.smoothingTimeConstant = 0.8; 
      } else if (this.$q.platform.is.android) {
        analyser.smoothingTimeConstant = 0.71; 
      } else {
        analyser.smoothingTimeConstant = 0.82;
      }
      return analyser;
    },

    getAnalyserArray(analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArray.fill(255, 0, bufferLength);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    },

    initHaloManager() {
      this.haloManager = new HaloManager();

      // bottom halos
      const bottomHalos = 8;
      for (let i = 0; i < bottomHalos; ++i) {
        const rx = Math.random();
        const ry = 0.1 * Math.random() + 0.85;
        const random_radius = 10 + 200 * Math.random();
        const mills_interval = 100 * (60 + 60 * Math.random());
        this.haloManager.addHalo(rx, ry, random_radius, mills_interval);
      }

      const middleHalos = 10;
      for (let i = 0; i < bottomHalos; ++i) {
        const rx = Math.random();
        const ry = 0.8 * Math.random();
        const random_radius = 10 + 100 * Math.random();
        const mills_interval = 100 * (40 + 60 * Math.random());
        this.haloManager.addHalo(rx, ry, random_radius, mills_interval);
      }
    },

    audioElementInit() {
      // console.log("audio element = ", this.audioElement);
      // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // const analyser = audioCtx.createAnalyser();
      if (!this.audioAnalyser) return;
      this.initHaloManager();

      const leftDataArray = this.getAnalyserArray(this.setAnalyser(this.audioAnalyser.left));
      const rightDataArray = this.getAnalyserArray(this.setAnalyser(this.audioAnalyser.right));
      
      // // Connect the source to be analysed
      // // source.connect(analyser);
      // Get a canvas defined with ID "oscilloscope"

      const canvas = this.$refs.visualizer;
      const canvasCtx = canvas.getContext("2d");
      // draw an oscilloscope of the current audio source
      canvasCtx.font="80px Arial";

      let count = 0
      const draw = (millsTime) => {
        if (this.stopper.stop) return false;

        // sync canvas inner drawing size with client element size
        if (canvasCtx.canvas.width !== canvasCtx.canvas.clientWidth) {
          canvasCtx.canvas.width = canvasCtx.canvas.clientWidth;
        }
        if (canvasCtx.canvas.height !== canvasCtx.canvas.clientHeight) {
          canvasCtx.canvas.height = canvasCtx.canvas.clientHeight;
        }

        requestAnimationFrame(draw);
        this.audioAnalyser.left.getByteFrequencyData(leftDataArray);
        this.audioAnalyser.right.getByteFrequencyData(rightDataArray);

        count = (count + 1) % 20

        canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
        canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);

        fillFrequencyData(leftDataArray, canvasCtx, 'left');
        fillFrequencyData(rightDataArray, canvasCtx, 'right');
        this.haloManager.update(millsTime, canvasCtx);
        this.haloManager.draw(canvasCtx);
      }
      requestAnimationFrame(draw);
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

    containerStyle() {
      return {
        'background-image': `url("${this.coverUrl}")`,
      }
    },

    progressBarStyle() {
      let percent = (this.currentTime / this.duration) * 100;
      return {
        width: `${percent.toFixed(5)}%`,
      }
    },
    
    ...mapState('AudioPlayer', [
      'visualPlayerCoverUrl',
      'audioAnalyser',
      'currentTime',
      'duration',
      'queue',
      'queueIndex',
      'playWorkId',
    ]),

    ...mapGetters('AudioPlayer', [
      'currentPlayingFile'
    ]),

    title() {
      const org = this.currentPlayingFile.title;
      return org.substring(0, org.lastIndexOf("."));
    }
  },

  watch: {
    audioAnalyser() {
      this.audioElementInit();
    }
  },
  created() {
    // console.log("full screen rounter workid = ", this.workid)
    
    if (this.workid !== undefined && this.playWorkId === 0) {
      // url 有workid，但是当前没有播放对应的作品
      // 则强制跳转到对应的作品详细页面
      this.$router.push(`/work/${this.workid}`);
    }
  },
  mounted() {
    this.audioElementInit();
    this.$refs.container.addEventListener("fullscreenchange", this.onFullscreenChange)
  },
  beforeDestroy() {
    this.stopper.stop = false;
    this.$refs.container.removeEventListener("fullscreenchange", this.onFullscreenChange)
  }
}
</script>

<style scoped>

.container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
}

.img-blur-background {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-position: 50% 50%;
  background-size: cover;
  filter: blur(4px);
}

.constrain-height {
  /* max-height: calc(100vh - 110px); */
  max-height: 100%;
}

.visualizer {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  bottom: 0;
}

.simple-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  /* width: 100%; */
  background-color: var(--q-color-positive);
}

.footer {
  position: absolute;
  width: 100%;
  bottom: 0;
}

.current-playing-info {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  color: white;
  text-shadow: 1px 1px 0px rgb(82, 82, 82);
}

</style>
<template>
  <div class="container" ref="container" @dblclick="clickOnContainer">
    <div class="img-blur-background" :style="containerStyle"></div>
    <q-img contain v-if="!enableDrawVideo"
      :src="coverUrl"
      class="constrain-height"
      img-class="scale-animation image-style"
      :img-style="{'animation-play-state': playing ? 'running' : 'paused'}"
    />
    <canvas class="visualizer" ref="visualizer" width="1000" height="1000"></canvas>
    <div v-if="isInFullScreen" class="simple-progress" :style="progressBarStyle"></div>
    <div class="footer">
      <LyricsBar v-if="isInFullScreen && !enablePIPLyrics" />
    </div>
    <div v-if="isInFullScreen" class="current-playing-info">
      <div class="text-h6 text-weight-bolder non-selectable">
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

class NUBRCurveSample {
  constructor(samplePoints) {
    this.points = samplePoints;
  }
  // 多阶贝塞尔曲线计算公式参考：https://www.zhihu.com/question/29565629
  sample(t) {
    // console.log("sample animation progress = ", t);
    let accu = [0, 0];
    const n = this.points.length - 1;
    for (let i = 0; i <= n; ++i) {
      accu = Vec.add(accu, Vec.mul(this.points[i], this.term(i, n, t)));
    }
    return accu;
  }
  term(i, n, t) {
    return factorial(n) / (factorial(i) * factorial(n - i)) * Math.pow(t, i) * Math.pow(1 - t, n-i);
  }
}

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

    const points = [];
    for (let i = 0; i < num_sample_point; ++i) {
      points.push([
        Math.random(),
        Math.random(),
      ]);
    }
    const firstPoint = points[0];
    const secondPoint = points[1];
    const diff = Vec.sub(firstPoint, secondPoint);
    const smoothEndPoint = Vec.add(firstPoint, diff);
    points.push(smoothEndPoint); // smooth and loop to the start
    points.push(firstPoint); // close the curve with first point
    this.curveSample = new NUBRCurveSample(points);
  }

  animate(mills) {
    this.played_mills += mills - this.last_mills;
    if (this.played_mills > this.interval_mills) this.played_mills = 0;
    this.last_mills = mills;

    const progress = this.played_mills / this.interval_mills;
    // const dp = this.sampleAnimation(progress);
    const dp = this.curveSample.sample(progress);

    return Vec.mul(dp, this.contain_square);
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
  const maxBarWidth = Math.round(maxBarWidthPercent * canvasWidth);
  const offsetBarPerent = 0.20;
  const barCenterX = Math.round(direction == 'left' 
    ? canvasWidth * offsetBarPerent
    : canvasWidth - canvasWidth * offsetBarPerent);

  // frequency count is allways even
  function mapFrequencyIndexToBarIndex(freqIdx) {
    return freqIdx % 2 == 0 
      ? (len / 2 - freqIdx / 2 - 1)
      : (len / 2 + (freqIdx - 1) / 2);
  }

  function mapBarIdxToFrequencyIndex(barIdx) {
    return barIdx < len / 2
      ? len - 2 * barIdx - 1
      : 2 * barIdx - len;
  }

  const barGap = canvasHeight / len;
  const barHeight = barGap / 2;
  const minimalBarWidth = barHeight;
  const isCanvasResized =
    fillFrequencyData.gradient[direction].w != canvasWidth
    || fillFrequencyData.gradient[direction].h != canvasHeight;
  // 渐变对象更新
  if (isCanvasResized) {
    const startX = barCenterX - maxBarWidth * 0.5;
    const endX = startX + maxBarWidth;
    const gradient = canvasCtx.createLinearGradient(
      // x    y, 只关心水平渐变，不关心垂直方向
      startX, 0,
      endX,   0,
    );

    gradient.addColorStop(0.3, "rgba(255,  42, 73, 0.5)");
    gradient.addColorStop(0.5, "rgba(140,  20, 252, 0.6)");
    gradient.addColorStop(0.7, "rgba(255,  42, 73, 0.5)");
    fillFrequencyData.gradient[direction].grad = gradient;
    fillFrequencyData.gradient[direction].w = canvasWidth;
    fillFrequencyData.gradient[direction].h = canvasHeight;
    const curve = fillFrequencyData.gradient[direction].curve;
    curve.points = Array(dataArray.length + 2).fill(0).map(() => [0, 0]);
    curve.points[0] = [barCenterX, 0]
    curve.points[curve.points.length - 1] = [barCenterX, canvasHeight]
  }

  // 绘制矩形
  canvasCtx.fillStyle = fillFrequencyData.gradient[direction].grad;
  canvasCtx.lineJoin = "round";
  canvasCtx.lineWidth = 3;
  canvasCtx.shadowColor = 'rgb(255, 42, 73)';
  canvasCtx.shadowBlur = 10;
  // for (let i = 0; i < len; ++i) {
  //   const barIdx = mapFrequencyIndexToBarIndex(i);
  //   let x,y,w,h;
  //   const barWidth = Math.max(minimalBarWidth, maxBarWidth * (dataArray[i] / 255));
  //   x = barCenterX - barWidth * 0.5;
  //   y = barIdx * barGap;
  //   w = barWidth;
  //   h = barHeight;
  //   canvasCtx.fillRect(x, y, w, h);
  // }

  // 绘制波形图
  let lastY = 0;
  let bumpDir = direction == 'left' ? 1 : -1; // or -1, 1 bump to right, -1 means bump to left
  canvasCtx.strokeStyle = fillFrequencyData.gradient[direction].grad;
  canvasCtx.beginPath();
  canvasCtx.moveTo(barCenterX, lastY);
  // smooth(dataArray);
  for (let i = 0; i < len; ++i) {
    // draw from bar[0] to bar[len]
    const freqIdx = mapBarIdxToFrequencyIndex(i);
    let freq = dataArray[freqIdx];
    const barWidth = Math.floor(maxBarWidth * freq / 255);

    // 绘制并保证和sen
    const deltaY = barWidth * (0.5 * barGap) / maxBarWidth;
    const cpx = barCenterX + bumpDir * barWidth;
    const cpy1 = lastY + deltaY;
    const cyp2 = lastY + barGap - deltaY;
    canvasCtx.bezierCurveTo(cpx, cpy1, cpx, cyp2, barCenterX, lastY + barGap);

    // 每一个波柱用两个bezier绘制，效果不是很好
    // const bumpX = barCenterX + bumpDir * barWidth;
    // const quadY = barGap / 4;
    // canvasCtx.bezierCurveTo(
    //   barCenterX, lastY + quadY,
    //   bumpX, lastY + quadY,
    //   bumpX, lastY + quadY + quadY
    // )
    // canvasCtx.bezierCurveTo(
    //   bumpX, lastY + quadY + quadY + quadY,
    //   barCenterX, lastY + quadY + quadY + quadY,
    //   barCenterX, lastY + barGap,
    // )
    lastY += barGap;
    bumpDir *= -1;
  }
  canvasCtx.moveTo(barCenterX, canvasHeight);
  canvasCtx.stroke();
  canvasCtx.shadowBlur = 0;
}
// 存储可视化条的渐变对象
fillFrequencyData.gradient = {
  'left': {
    w: 0,
    h: 0,
    grad: null,
    curve: new NUBRCurveSample([]),
  },
  'right': {
    w: 0,
    h: 0,
    grad: null,
    curve: new NUBRCurveSample([]),
  },
};

export default {
  name: "FullScreenPlayer",

  components: {
    LyricsBar
  },

  data () {
    return {
      workid: this.$route.params.id,
      counter: 0,
      renderNotifier: { stop: false, pause: false },
      isInFullScreen: false,

      enableDrawFrequency: false,
      enableDrawHalo: false,
      enableDrawVideo: true, 

      haloManager: null,
      videoElement: null,
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
      analyser.fftSize = 256;
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
      for (let i = 0; i < middleHalos; ++i) {
        const rx = Math.random();
        const ry = 0.8 * Math.random();
        const random_radius = 10 + 100 * Math.random();
        const mills_interval = 100 * (40 + 60 * Math.random());
        this.haloManager.addHalo(rx, ry, random_radius, mills_interval);
      }
    },

    audioElementInit() {
      this.initHaloManager();

      // const analyser = audioCtx.createAnalyser();
      this.checkVisualEffect();
      let leftDataArray = null, rightDataArray = null; // for holding frequency data
      
      const canvas = this.$refs.visualizer;
      const canvasCtx = canvas.getContext("2d");
      // draw an oscilloscope of the current audio source
      canvasCtx.font="80px Arial";

      this.renderNotifier.stop = true; // 停止前一个渲染循环
      let newNotifier = {stop: false, pause: !this.playing, drawer: null}; // 创建新的渲染停止器
      const draw = (millsTime) => {
        if (newNotifier.stop) return false;
        requestAnimationFrame(draw);

        // 判断是否要渲染，如果外部暂停，例如音乐暂停 同时 canvas 尺寸没有变化的时候才真正暂停渲染
        // 注意，暂停渲染pause 仍然会保持raf运行，停止渲染stop 才会停止后续所有渲染
        let pauseDraw = newNotifier.pause;
        // sync canvas inner drawing size with client element size
        if (canvasCtx.canvas.width !== canvasCtx.canvas.clientWidth) {
          canvasCtx.canvas.width = canvasCtx.canvas.clientWidth * window.devicePixelRatio;
          pauseDraw = false;
        }
        if (canvasCtx.canvas.height !== canvasCtx.canvas.clientHeight) {
          canvasCtx.canvas.height = canvasCtx.canvas.clientHeight * window.devicePixelRatio;
          pauseDraw = false;
        }

        // video更新后应该至少绘制一次，避免页面上啥也没有
        if (this.enableDrawVideo) {
          pauseDraw = false;
        }
        if (pauseDraw) return false; // 

        canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
        canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);

        // 绘制音频频率
        if (this.enableDrawFrequency) {
          if (!leftDataArray && !rightDataArray) {
            leftDataArray = this.getAnalyserArray(this.setAnalyser(this.audioAnalyser.left));
            rightDataArray = this.getAnalyserArray(this.setAnalyser(this.audioAnalyser.right));
          }
          this.audioAnalyser.left.getByteFrequencyData(leftDataArray);
          this.audioAnalyser.right.getByteFrequencyData(rightDataArray);
          fillFrequencyData(leftDataArray, canvasCtx, 'left');
          fillFrequencyData(rightDataArray, canvasCtx, 'right');
        }

        // 绘制光晕
        if (this.enableDrawHalo) {
          this.haloManager.update(millsTime, canvasCtx);
          this.haloManager.draw(canvasCtx);
        }

        // 绘制视频
        if (this.enableDrawVideo && this.video) {
          this.drawVideoInCanvas(canvas, canvasCtx)
        }
      };
      newNotifier.drawer = draw;
      this.renderNotifier = newNotifier; // 记录这个渲染停止器
      requestAnimationFrame(newNotifier.drawer);
    },

    drawVideoInCanvas(canvas, canvasCtx) {
      const containerRatio = canvas.width / canvas.height;
      const video = this.video;
      const videoRatio = video.videoWidth / video.videoHeight;

      let x,y,newVideoWidth, newVideoHeight
      if (containerRatio > videoRatio) {
        // 横置居中
        newVideoHeight = canvas.height;
        newVideoWidth = videoRatio * newVideoHeight;
        x = 0.5 * (canvas.width - newVideoWidth)
        y = 0;
      } else {
        // 竖置居中
        newVideoWidth = canvas.width;
        newVideoHeight = newVideoWidth / videoRatio;
        x = 0;
        y = 0.5 * (canvas.height - newVideoHeight)
      }
      canvasCtx.drawImage(video, x, y, newVideoWidth, newVideoHeight)
    },

    checkVisualEffect() {
      this.enableDrawVideo = this.enableVideoSource && this.currentPlayingFile.title.toLowerCase().endsWith(".mp4")
      if (this.enableDrawVideo) {
        this.video = document.querySelector("#mediaVideo");
      }

      this.enableDrawFrequency = this.video == null && this.audioAnalyser != null;
      if (this.enableDrawVideo) {
        this.enableDrawFrequency = this.enableDrawHalo = false;
      } else {
        this.enableDrawHalo = true;
      }
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
        'backdrop-filter': `url("${this.coverUrl}") blur(2px)`
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
      'playing',
      'enablePIPLyrics',
      'enableVideoSource'
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
    },
    playing (isPlaying) {
      this.renderNotifier.pause = !isPlaying;
    },
    currentPlayingFile() {
      this.checkVisualEffect()
    },
  },
  created() {
    // console.log("full screen rounter workid = ", this.workid)
    
    if (this.workid === undefined && this.playWorkId !== 0) {
      // url 没有workid，但是当前正在播放对应的作品
      // 给当前网页跳转到包含作品id的当前页面上
      this.$router.push(`/fullScreenPlayer/${this.playWorkId}`);
    } else if (this.workid !== undefined && this.playWorkId === 0) {
      // url 有workid，但是当前没有播放对应的作品
      // 则强制跳转到对应的作品详细页面
      this.$router.push(`/work/${this.workid}`);
    } else if (this.workid === undefined && this.playWorkId === 0) {
      this.$q.notify({
        message: "当前没有播放任何作品，请先播放一个作品然后打开可视化页面",
        color: "negative",
      });
      this.$router.push(`/works`);
    }
  },
  mounted() {
    this.audioElementInit()
    this.$refs.container.addEventListener("fullscreenchange", this.onFullscreenChange)
    this.checkVisualEffect();
  },
  beforeDestroy() {
    this.renderNotifier.stop = true;
    this.$refs.container.removeEventListener("fullscreenchange", this.onFullscreenChange)
    this.video = null;
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
  background-size: contain;
  filter: blur(30px) brightness(0.6);
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

<style>

.scale-animation {
  animation-name: bump-shrink;
  animation-duration: 9s;
  animation-iteration-count: infinite;
  transform-origin: center;
  border-radius: 0px;
  overflow: hidden;
}

@keyframes bump-shrink {
  0% {transform: scale(1.0);}
  50% {transform: scale(1.1);}
  100% {transform: scale(1.0);}
}
</style>
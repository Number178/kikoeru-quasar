<template>
  <div :class="visibility" class="topClass">
    <canvas ref="canvas" width="500" height="60" class="sized"></canvas>
    <video ref="video" class="sized" muted playsinline preload="metadata" controls="controls" style="display: inline;"></video>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex'
import { debounce } from 'quasar';

export default {
  name: 'PIPLyrics',

  computed: {
    video() {
      return this.$refs.video;
    },

    ...mapState('AudioPlayer', [
      'currentLyric',
      'enablePIPLyrics',
      'playing',
    ]),

    ...mapGetters('AudioPlayer', [
      'isQueueEmpty',
    ]),
  },

  data () {
    return {
      ctx: null,
      stopRafObject: { stopped: false },
      visibility: "hide",
      // visibility: "show",
      isFireFox: navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
      isVideoCanPlay: false, // 用以记录video能否播放并进入画中画模式，如果用户操作太快，此时video还没有准备好，需要延迟到video canplay事件发生后才能进入画中画状态
      pixelRatio: window.devicePixelRatio,
    }
  },

  methods: {
    initCanvas() {
      this.ctx = this.$refs.canvas.getContext("2d")
      const canvas = this.$refs.canvas
      // const pixelRatio = 1;
      canvas.width = this.pixelRatio * window.innerWidth
      canvas.height = canvas.width / 500 * 60

      // const ctx = this.ctx
      // let color = 0
      // let startTime = performance.now()
      // const stoper = this.stopRafObject
      // const draw = ()=>{
      //   if (stoper.stopped) return;
      //   const seconds = Math.floor((performance.now() - startTime) / 1000)
      //   // const selectLyric = lyrics[seconds % lyrics.length]
      //   
      //   color = Math.floor((color + 1) * 1.05) % 256
      //   ctx.fillStyle = `rgba(255, ${color}, 0, 1.0)`
      //   ctx.fillRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
      //   // drawLyric(selectLyric)
      //   // ctx.fillStyle = "rgba(0, 0, 0, 0)"
      //   // ctx.fillRect(0, 0, canvas.width, canvas.height)
      //   // ctx.fillStyle = `rgba(255, ${color}, 0, 1.0)`
      //   // ctx.fillRect(0, canvas.height / 4, canvas.width, canvas.height / 2)
      //   requestAnimationFrame(draw)
      // }
      // draw()
    },

    drawLyric(str) {
      // str += " 强制增加歌词长度测试，强制增加歌词长度测试，强制增加歌词长度测试，"
      const fontScale = 1.5
      const cvs = this.$refs.canvas
      const ctx = this.ctx
      const fontsize = fontScale * cvs.width / 30

      const isDarkMode = this.$q.dark.isActive;

      // background
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      ctx.fillStyle = isDarkMode ? 'rgba(50, 50, 50, 1.0)' : "rgba(255, 255, 255, 1.0)"
      ctx.fillRect(0, 0, cvs.width, cvs.height)

      ctx.font = `bold ${fontsize * 0.9
        }px "-apple-system", "BlinkMacSystemFont", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", "Helvetica", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`
      ctx.fillStyle = '#9c27b0'

      // 可绘制参数
      const padWidth = 5
      const padHeight = 0

      const allowedLines = Math.floor((cvs.height - padHeight * 2) / fontsize)
      const allowedWidth = cvs.width - padWidth * 2

      // 首次测量全部字符串
      const allTxt = ctx.measureText(str)
      const neededLines = Math.ceil(allTxt.width / allowedWidth)
      const drawLines = Math.min(neededLines, allowedLines)
      const restLineHeight = cvs.height - drawLines * fontsize
      let readCharIdx = 0 // 将要添加到绘制行的字符序号

      const chars = str.split("")

      // 遍历每一行
      for (let line = 0; line < drawLines && readCharIdx < chars.length; line++) {
        // 填充当前行直到allowedWidth
        let lineStr = ""
        let lineStrMetric = null
        while (readCharIdx < str.length) {
          lineStr += chars[readCharIdx]
          lineStrMetric = ctx.measureText(lineStr)
          if (lineStrMetric.width > allowedWidth) {
            // 当前行已满，准备绘制lineStr
            lineStr = lineStr.substr(0, lineStr.length - 1)
            break;
          } else {
            // 当前行仍然有剩余空间，继续往lineStr添加字符
            readCharIdx++;
          }
        }

        if (line == drawLines - 1 && readCharIdx < chars.length) {
          // 已到达最后一行，然而还有文字没有上屏，将当前行末尾的几个文字变为省略号，忽略后续其他文字
          lineStr = lineStr.substr(0, lineStr.length - 3) + "..."
        }

        lineStrMetric = ctx.measureText(lineStr)

        // 绘制lineStr
        const drawX = padWidth + (cvs.width - lineStrMetric.width) / 2

        const drawY = restLineHeight / 2 + line * fontsize + lineStrMetric.actualBoundingBoxAscent
        ctx.fillText(lineStr, drawX, drawY)

        // ctx.fillRect(0, drawY, canvas.width, 2) // draw base line for reference
      }
    },

    initVideos() {
      const stream = this.$refs.canvas.captureStream()
      this.video.srcObject = stream
      this.video.onleavepictureinpicture = () => {
        if (!this.stopPIPLyric) return // 组件已经被销毁
        this.stopPIPLyric()
        this.setEnablePIPLyrics(false)
        // video.onleavepictureinpicture = ()=> {}
      }
      this.video.onloadedmetadata = () => {
        console.log("pip video ready")
        this.isVideoCanPlay = true;
      }
      this.video.play()
      this.forceVideoStartLoadMetadata()
    },

    forceVideoStartLoadMetadata() {
      // 首先绘制一次，初始化video状态，保证dataloaded，是的后续画中画状态能够立即进入
      let forceDrawCount = 10;
      const draw = () => {
        if (forceDrawCount < 0) {
          if (!this.enablePIPLyrics || !this.playing)this.video.pause() // 停止强制渲染后，根据播放器状态决定video是否暂停
          return;
        }
        forceDrawCount--;
        requestAnimationFrame(draw)
        this.drawLyric("  ") 
      }
      requestAnimationFrame(draw)
    },

    openPIPVideoMode() {
      this.drawLyric(this.currentLyric) // 首先绘制一次
      this.video.play()
      console.log("打开桌面歌词")

      if (
        typeof this.video.requestPictureInPicture === 'function' &&
        document.pictureInPictureEnabled
      ) {
        this.video.requestPictureInPicture().then(() => {
          // 解决歌词video播放、暂停事件无法传递到音频播放状态的问题
          if (!this.playing) this.video.pause()
          // from user
          this.video.onplay = () => {
            this.syncPlayingStateFromPIPVideoToAudio(true);
          };
          this.video.onpause = () => {
            this.syncPlayingStateFromPIPVideoToAudio(false);
          };
        }).catch((err) => {
          console.log("PIP lyric open video failed, msg = ", err.message)
          this.stopPIPLyric()
        })
      } else if (typeof this.video.webkitPresentationMode === 'function') {
        this.video.webkitPresentationMode('picture-in-picture')
      }

      if (this.isFireFox) {
        // 对火狐浏览器，将video强制显示出来，让用户自己设置video进入画中画模式，然后自动隐藏
        this.visibility = "manulSet"
        setTimeout(()=>{
          this.visibility = "hide"
        }, 10000)
      } else {
        // // 20230805 更新，下面这个对SE的处理根本没用，SE一会能有一会不行，相当玄学，
        // // 有的时候多等一下再点OK按钮就能显示出来了，有的时候又不行。算了，不管这个，其他iPhone、ipad、桌面都没有问题
        // // 对于其他浏览器其实无需做额外操作
        // // 但是目前发现iPhoneSE1 15.7.7 的safari奇怪的行为，必须要将video/canvas显示出来一下，然后才能正常进入画中画模式，否则video将无法看到
        // // 这里就强制所有浏览器环境都进行这样一个操作，先show出来，然后立即hide下去
        // this.visibility = "show"
        // console.log("show pip video temp")
        // setTimeout(() => {
        //   this.visibility = "hide"
        //   console.log("hide pip video")
        // }, 2000);
      }

    },

    showUserPrompt() {
      let msg = "请点击‘打开’按钮确认显示桌面歌词，或者点击‘取消’关闭桌面歌词。（请注意，桌面歌词打开后，原先网页内的歌词就会被隐藏掉）"
      let okMsg = "请继续"
      if (this.isFireFox) {
        msg = "检测到FireFox浏览器，此浏览器下必须由用户手动选择开启画中画功能，请在10秒内手动选择左上角出现的video组件并开启画中画功能，10秒后video组件将会隐藏并无法操作。如果错过，您也可以重新关闭、打开桌面歌词功能，来再次操作。"
        // firefox尚不支持这种js触发画中画功能，先将video显示出来，让用户手动选择画中画功能，然后隐藏页面中的video元素
        okMsg = "好的"
      }

      this.$q.dialog({
        title: '桌面歌词',
        message: msg,
        ok: okMsg,
        cancel: "关闭桌面歌词",
        persistent: false
      }).onOk(async () => {
        this.openPIPVideoMode()
      }).onCancel(() => {
        // console.log('>>>> Cancel')
        this.setEnablePIPLyrics(false)
        this.stopPIPLyric()
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    },

    stopPIPLyric() {
      const video = this.$refs.video
      if (!video) return
      if (typeof document.exitPictureInPicture === 'function') {
        document.pictureInPictureElement && document.exitPictureInPicture()
      } else if (typeof video.webkitPresentationMode === 'function') {
        video.webkitSetPresentationMode('inline')
      }
      video.pause()
      // this.setEnablePIPLyrics(false)
      video.onplay = null;
      video.onpause = null;
    },

    ...mapMutations('AudioPlayer', {
      setEnablePIPLyrics: 'SET_ENABLE_PIP_LYRICS',
      togglePlaying: 'TOGGLE_PLAYING',
      playAudio: 'PLAY',
      pauseAudio: 'PAUSE',
    }),

    tryEnterPIPAndShowUserPrompt() {
      if (this.isVideoCanPlay) {
        this.showUserPrompt() 
      } else {
        this.$q.notify({message: "桌面歌词打开失败，请播放音频5秒后再次尝试打开", timeout: 500})
      }
    },

    syncPlayingStateFromAudioToPIPVideo() {
      // 将音频状态 同步到 歌词video上
      if (!this.enablePIPLyrics) return;
      if (this.playing && this.video.paused) this.video.play()
      else if (!this.playing && !this.video.paused) this.video.pause()
    },

    syncPlayingStateFromPIPVideoToAudio(isPIPPlaying) {
      if (isPIPPlaying) this.playAudio()
      else this.pauseAudio()
    }
  },

  watch: {
    enablePIPLyrics(value) {
      if (!value) this.stopPIPLyric()
      else  this.tryEnterPIPAndShowUserPrompt()
    },

    // 监听播放列表，如果有新增，一般是打开的桌面歌词状态的时候，还没有播放作品，
    // 如果这个时候突然播放作品，就需要做检查并进入歌词画中画模式
    isQueueEmpty(value) {
      if (value) this.stopPIPLyric()
      else if (this.enablePIPLyrics) this.tryEnterPIPAndShowUserPrompt()
    },
    currentLyric(newLyric) {
      if (!this.enablePIPLyrics) return
      this.drawLyric(newLyric)
    },
    playing() {
      this.syncPlayingStateFromAudioToPIPVideo()
    },
    "$q.dark.isActive"() {
      // 监听黑夜模式，立即重新绘制
      this.drawLyric(this.currentLyric);
    }
  },

  created() {
    // 防止快速切换导致video/audio相互之间的状态递归
    //  user ===play/pause---> PIP video --- play/pause ---> audio
    //                            ^                           |
    //                            |                           |
    //                            -------------play/pause-----`
    this.syncPlayingStateFromAudioToPIPVideo = debounce(this.syncPlayingStateFromAudioToPIPVideo, 500) // ms
    this.syncPlayingStateFromPIPVideoToAudio = debounce(this.syncPlayingStateFromPIPVideoToAudio, 500) // ms
  },

  mounted() {
    // this.$q.notify({message: "创建桌面歌词组件中，请稍等...", timeout: 500})
    // addEventListener('mousemove', onCursorMove(this), false)
    // addEventListener('touchmove', onCursorMove(this), false)
    this.initCanvas()
    this.initVideos()

    // this.$nextTick(()=> {
    //   this.showUserPrompt()
    // })
    // setTimeout(()=>{
      // this.showUserPrompt()
    // }, 1000)

  },

  beforeDestroy() {
    this.stopRafObject.stopped = true
    this.stopPIPLyric()
  }
}
</script>

<style lang="scss" scoped>
  .sized {
      width: 500px;
      height: 60px;
      border: 1px solid black;
      position: absolute;
  }

  .hide {
      opacity: 0.1;
      position: fixed;
      right: 5px;
      bottom: 5px;
      width: 5px;
      height: 5px;
      overflow: hidden;
  }
  .topClass {
    z-index: 999;
  }
  .show {
      opacity: 1.0;
      position: fixed;
      left: 0;
      top: 0;
  }

  .manulSet {
    opacity: 1.0;
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 50vh;
  }

  .manulSet > canvas {
    display: none;
  }
</style>

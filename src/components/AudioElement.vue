<template> 
  <div>
    <audio
      ref="audio"
      :volume="volume"
      @canplay="onCanplay()"
      @timeupdate="onTimeupdate()"
      @ended="onEnded()"
      @progress="onProgress()"
    >
      <source :src="source" /> 
    </audio>
  </div>
</template>

<script>
export default {
  name: 'AudioElement',

  computed: {
    source () {
      return this.queue.length ? `/api/stream/${this.queue[this.queueIndex].hash}` : ""
    },

    playing () {
      return this.$store.state.AudioPlayer.playing
    },

    queue () {
      return this.$store.state.AudioPlayer.queue
    },

    queueIndex () {
      return this.$store.state.AudioPlayer.queueIndex
    },

    playMode () {
      return this.$store.state.AudioPlayer.playMode
    },

    seek () {
      return this.$store.state.AudioPlayer.seek
    },

    muted () {
      return this.$store.state.AudioPlayer.muted
    },

    volume () {
      return this.$store.state.AudioPlayer.volume
    }
  },

  watch: {
    playing (newFlag, oldFlag) {  
      if (this.$refs.audio.duration) {
        // 缓冲至可播放状态
        if (newFlag) {
          // 播放
          this.$refs.audio.play()
        } else {
          // 暂停
          this.$refs.audio.pause()
        }
      }     
    },

    source (newSrc, oldSrc) {
      if (newSrc) {   
        // 加载新音频/视频文件
        this.$refs.audio.load()
      }
    },

    seek (newSeek, oldSeek) {
      // 屏蔽非法数值
      if (newSeek > 100 || newSeek < 0) {
        return
      }
      
      if (this.$refs.audio.duration) {
        if (newSeek === 100) {
          this.onEnded()
        } else {
          // 跳转到指定位置
          this.$refs.audio.currentTime = newSeek * 0.01 * this.$refs.audio.duration
        }
      }
      
      // 重置seek为初始状态
      this.$store.commit('AudioPlayer/SEEK', -1)
    },

    muted (newFlag, oldFlag) {
      // 切换静音状态
      this.$refs.audio.muted = newFlag
    },

    volume (newVal, oldVal) {
      // 屏蔽非法数值
      if (newVal < 0 || newVal > 1) {
        return
      }
      
      // 调节音量
      this.$refs.audio.volume = newVal
    }
  },

  methods: {
    onCanplay () {
      // 缓冲至可播放状态时触发 (只有缓冲至可播放状态, 才能获取媒体文件的播放时长)
      this.$store.commit('AudioPlayer/SET_DURATION', this.$refs.audio.duration)

      // 播放
      if (this.playing && this.$refs.audio.currentTime !== this.$refs.audio.duration) {
        this.$refs.audio.play()
      } 
    },

    onProgress () {
      // 当浏览器正在下载音频/视频时触发
      const length = this.$refs.audio.buffered.length
      
      // 更新缓冲进度
      if (this.$refs.audio.duration) {
        for (let i=0; i<length; i++) {
          // 寻找包含当前时间点的片段
          if (this.$refs.audio.buffered.start(length-1-i) < this.$refs.audio.currentTime) {
            const buffered = this.$refs.audio.buffered.end(length-1-i) / this.$refs.audio.duration * 100
            this.$store.commit('AudioPlayer/SET_BUFFERED', buffered)
            break
          }
        } 
      }
    },

    onTimeupdate () {
      // 当目前的播放位置已更改时触发
      const progress = this.$refs.audio.currentTime / this.$refs.audio.duration * 100

      // 更新播放进度
      if (progress) {
        this.$store.commit('AudioPlayer/TIME_UPDATE', progress)
      } 
    },

    onEnded () {
      // 当前文件播放结束时触发
      switch (this.playMode.name) {
        case "all repeat":
          // 循环播放
          if (this.queueIndex === this.queue.length - 1) {
            this.$store.commit('AudioPlayer/SET_TRACK', 0)
          } else {
            this.$store.commit('AudioPlayer/NEXT_TRACK')
          }
          break
        case "repeat once":
          // 单曲循环
          this.$refs.audio.currentTime = 0
          this.$store.commit('AudioPlayer/PLAY')
          break
        case "shuffle":
          // 随机播放
          const index = Math.floor(Math.random()*this.queue.length)
          this.$store.commit('AudioPlayer/SET_TRACK', index)
          if (index === this.queueIndex) {
            this.$refs.audio.currentTime = 0
          }
          break
        default:
          // 顺序播放
          if (this.queueIndex === this.queue.length - 1) {
            this.$store.commit('AudioPlayer/PAUSE')
          } else {
            this.$store.commit('AudioPlayer/NEXT_TRACK')
          }
      }
    }
  }
}
</script>

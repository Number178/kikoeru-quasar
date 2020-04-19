<template> 
  <vue-plyr ref="plyr"
    :emit="['canplay', 'timeupdate', 'ended']"
    @canplay="onCanplay()"
    @timeupdate="onTimeupdate()"
    @ended="onEnded()"
  >
    <audio crossorigin="anonymous" >
      <source v-if="source" :src="source" />
    </audio>
  </vue-plyr>
</template>

<script>
export default {
  name: 'AudioElement',

  computed: {
    player () {
      return this.$refs.plyr.player
    },

    source () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return this.queue.length ? `/api/stream/${this.queue[this.queueIndex].hash}?token=${token}` : ""
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
    playing (flag) {  
      if (this.player.duration) {
        // 缓冲至可播放状态
        flag ? this.player.play() : this.player.pause()
      }     
    },

    source (url) {
      if (url) {   
        // 加载新音频/视频文件
        this.player.media.load()
      }
    },

    seek (val) {
      // 屏蔽非法数值
      if (val > 100 || val < 0) {
        return
      }
      
      if (this.player.duration) {
        if (val === 100) {
          this.onEnded()
        } else {
          // 跳转到指定位置
          this.player.currentTime = val * 0.01 * this.player.duration
        }
      }
      
      // 重置seek为初始状态
      this.$store.commit('AudioPlayer/SEEK', -1)
    },

    muted (flag) {
      // 切换静音状态
      this.player.muted = flag
    },

    volume (val) {
      // 屏蔽非法数值
      if (val < 0 || val > 1) {
        return
      }
      
      // 调节音量
      this.player.volume = val
    }
  },

  methods: {
    onCanplay () {
      // 缓冲至可播放状态时触发 (只有缓冲至可播放状态, 才能获取媒体文件的播放时长)
      this.$store.commit('AudioPlayer/SET_DURATION', this.player.duration)

      // 播放
      if (this.playing && this.player.currentTime !== this.player.duration) {
        this.player.play()
      } 
    },

    onTimeupdate () {
      // 当目前的播放位置已更改时触发
      const progress = this.player.currentTime / this.player.duration * 100

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
          this.player.currentTime = 0
          this.$store.commit('AudioPlayer/PLAY')
          break
        case "shuffle":
          // 随机播放
          const index = Math.floor(Math.random()*this.queue.length)
          this.$store.commit('AudioPlayer/SET_TRACK', index)
          if (index === this.queueIndex) {
            this.player.currentTime = 0
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
  },

  mounted () {
    // 初始化音量
    this.$store.commit('AudioPlayer/SET_VOLUME', this.player.volume)
  }
}
</script>

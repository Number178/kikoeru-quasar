<template> 
  <vue-plyr ref="plyr"
    :emit="['canplay', 'timeupdate', 'ended', 'seeked']"
    @canplay="onCanplay()"
    @timeupdate="onTimeupdate()"
    @ended="onEnded()"
    @seeked="onSeeked()"
  >
    <audio crossorigin="anonymous" >
      <source v-if="source" :src="source" />
    </audio>
  </vue-plyr>
</template>

<script>
import Lyric from 'lrc-file-parser'

export default {
  name: 'AudioElement',

  data() {
    return {
      lrcObj: null,
      lrcAvailable: false,
    }
  },

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
      //console.log('flag');
      //console.log(flag);
      this.playLrc(flag);
    },

    source (url) {
      if (url) {   
        // 加载新音频/视频文件
        this.player.media.load();
        this.loadLrcFile();
      }
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
      this.$store.commit('AudioPlayer/SET_CURRENT_TIME', this.player.currentTime)
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
    },

    onSeeked() {
      if (this.lrcAvailable) {
        this.lrcObj.play(this.player.currentTime * 1000);
      }
    },


    playLrc (playStatus) {
      if (this.lrcAvailable) {
        if (playStatus) {
          this.lrcObj.play(this.player.currentTime * 1000);
        } else {
          this.lrcObj.pause();
        }
      }
    },

    loadTestLrc() {
      let encodeLrc = 'W3RpOuacieS9leS4jeWPr10KW2FyOuiuuOW1qV0KW2FsOuiHquWumuS5iV0KW2J5Ol0KW29mZnNldDowXQpbMDA6MDAuMTBd5pyJ5L2V5LiN5Y+vIC0g6K645bWpIChWYWUgWHUpClswMDowMC4yMF3or43vvJrorrjltakKWzAwOjAwLjMwXeabsu+8muiuuOW1qQpbMDA6MDAuNDBd57yW5puy77ya6K645bWpClswMDowMC41MF0KWzAwOjIzLjA3XeWkqeepuuWlveaDs+S4i+mbqApbMDA6MjUuMTNd5oiR5aW95oOz5L2P5L2g6ZqU5aOBClswMDoyNy40MV3lgrvnq5nlnKjkvaDlrrbmpbzkuIsKWzAwOjI5LjQyXeaKrOi1t+WktCDmlbDkuYzkupEKWzAwOjMxLjg2XeWmguaenOWcuuaZr+mHjOWHuueOsOS4gOaetumSoueQtApbMDA6MzQuMTld5oiR5Lya5ZSx5q2M57uZ5L2g5ZCsClswMDozNi41OV3lk6rmgJXlpb3lpJrnm4bmsLTlvoDkuIvmt4sKWzAwOjM5LjY5XQpbMDA6NDEuOTVd5aSP5aSp5b+r6KaB6L+H5Y67ClswMDo0NC4wMF3or7fkvaDlsJHkubDlhrDmt4fmt4sKWzAwOjQ2LjQyXeWkqeWHieWwseWIq+epv+efreijmQpbMDA6NDguNjNd5Yir5YaN6YKj5LmI5reY5rCUClswMDo1MS4wNF3lpoLmnpzmnInml7bkuI3pgqPkuYjlvIDlv4MKWzAwOjUzLjM3XeaIkeaEv+aEj+WwhuagvOa0m+exs+WAn+e7meS9oApbMDA6NTUuNjVd5L2g5YW25a6e5piO55m95oiR5b+D5oSPClswMDo1OS4wMV3kuLrkvaDllLHov5npppbmrYwKWzAxOjAxLjI0XeayoeacieS7gOS5iOmjjuagvApbMDE6MDMuNTVd5a6D5LuF5LuF5Luj6KGo552AClswMTowNS4zNF0KWzAxOjA1Ljk3XeaIkeaDs+e7meS9oOW/q+S5kApbMDE6MDguMzJd5Li65L2g6Kej5Ya75Yaw5rKzClswMToxMC43MV3kuLrkvaDlgZrkuIDlj6rmiZHngavnmoTpo57om74KWzAxOjE0LjIzXeayoeacieS7gOS5iOS6i+aDheaYr+S4jeWAvOW+lwpbMDE6MTcuOTFd5Li65L2g5ZSx6L+Z6aaW5q2MClswMToyMC4yNl3msqHmnInku4DkuYjpo47moLwKWzAxOjIyLjU1XeWug+S7heS7heS7o+ihqOedgApbMDE6MjQuMzRdClswMToyNC45NF3miJHluIzmnJvkvaDlv6vkuZAKWzAxOjI3LjM4XeS4uuS9oOi+l+i9rOWPjeS+pwpbMDE6MjkuNzdd5Li65L2g5pS+5byD5LiW55WM5pyJ5L2V5LiN5Y+vClswMTozMy4xMF3lpI/mnKvnp4vlh4nph4zluKbkuIDngrnmuKnng60KWzAxOjM2Ljg2XeacieaNouWto+eahOminOiJsgpbMDE6MzkuNTNdClswMTo1OC4xMF3lpKnnqbrlpb3mg7PkuIvpm6gKWzAyOjAwLjA1XeaIkeWlveaDs+S9j+S9oOmalOWjgQpbMDI6MDIuMzdd5YK756uZ5Zyo5L2g5a625qW85LiLClswMjowNC41M13miqzotbflpLQg5pWw5LmM5LqRClswMjowNi44N13lpoLmnpzlnLrmma/ph4zlh7rnjrDkuIDmnrbpkqLnkLQKWzAyOjA5LjQzXeaIkeS8muWUseatjOe7meS9oOWQrApbMDI6MTEuNjdd5ZOq5oCV5aW95aSa55uG5rC05b6A5LiL5reLClswMjoxMy45N10KWzAyOjE0LjYzXeW+gOS4i+a3i+W+gOS4i+a3iwpbMDI6MTYuNzhd5aSP5aSp5b+r6KaB6L+H5Y67ClswMjoxOS4wM13or7fkvaDlsJHkubDlhrDmt4fmt4sKWzAyOjIxLjQxXeWkqeWHieWwseWIq+epv+efreijmQpbMDI6MjMuNDVd5Yir5YaN6YKj5LmI5reY5rCUClswMjoyNi4wM13lpoLmnpzmnInml7bkuI3pgqPkuYjlvIDlv4MKWzAyOjI4LjM0XeaIkeaEv+aEj+WwhuagvOa0m+exs+WAn+e7meS9oApbMDI6MzAuNjJd5L2g5YW25a6e5piO55m95oiR5b+D5oSPClswMjozNC4wM13kuLrkvaDllLHov5npppbmrYwKWzAyOjM2LjI4XeayoeacieS7gOS5iOmjjuagvApbMDI6MzguNTZd5a6D5LuF5LuF5Luj6KGo552AClswMjo0MS4wM13miJHmg7Pnu5nkvaDlv6vkuZAKWzAyOjQzLjM1XeS4uuS9oOino+WGu+WGsOayswpbMDI6NDUuNzRd5Li65L2g5YGa5LiA5Y+q5omR54Gr55qE6aOe6Ju+ClswMjo0OS4yNF3msqHmnInku4DkuYjkuovmg4XmmK/kuI3lgLzlvpcKWzAyOjUyLjkyXeS4uuS9oOWUsei/memmluatjApbMDI6NTUuMzBd5rKh5pyJ5LuA5LmI6aOO5qC8ClswMjo1Ny42M13lroPku4Xku4Xku6PooajnnYAKWzAyOjU5Ljk5XeaIkeW4jOacm+S9oOW/q+S5kApbMDM6MDIuMzdd5Li65L2g6L6X6L2s5Y+N5L6nClswMzowNC43MV3kuLrkvaDmlL7lvIPkuJbnlYzmnInkvZXkuI3lj68KWzAzOjA4LjA1XeWkj+acq+eni+WHiemHjOW4puS4gOeCuea4qeeDrQpbMDM6MTEuMzFdClswMzoyMS42N13kuLrkvaDop6PlhrvlhrDmsrMKWzAzOjIzLjkwXeS4uuS9oOWBmuS4gOWPquaJkeeBq+eahOmjnuibvgpbMDM6MjcuMTFd5rKh5pyJ5LuA5LmI5LqL5oOF5piv5LiN5YC85b6XClswMzozMC4zN10KWzAzOjMxLjE0XeS4uuS9oOWUsei/memmluatjApbMDM6MzMuMjVd5rKh5pyJ5LuA5LmI6aOO5qC8ClswMzozNS41OV3lroPku4Xku4Xku6PooajnnYAKWzAzOjM4LjAzXeaIkeW4jOacm+S9oOW/q+S5kApbMDM6NDAuNDRd5Li65L2g6L6X6L2s5Y+N5L6nClswMzo0Mi43N13kuLrkvaDmlL7lvIPkuJbnlYzmnInkvZXkuI3lj68KWzAzOjQ2LjEzXeWkj+acq+eni+WHiemHjOW4puS4gOeCuea4qeeDrQpbMDM6NDkuNzRd5pyJ5o2i5a2j55qE6aKc6Imy'
      let b64DecodeUnicode = function (str) {
        return decodeURIComponent(atob(str).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
      }
      let dom_lyric = document.getElementById('lyric')
      this.lrcObj = new Lyric({
        onPlay: function (line, text) {
          console.log(line, text)
          // console.log(lrc.lines[lrc.curLineNum].time - lrc.offset - dom_audio.currentTime * 1000)
          dom_lyric.innerHTML = text
        },
        onSetLyric: function (lines) {
          //console.log(lines)
        }
      })
      this.lrcObj.setLyric(b64DecodeUnicode(encodeLrc));
    },

    initLrcObj () {
        let dom_lyric = document.getElementById('lyric')
        this.lrcObj = new Lyric({
          onPlay: function (line, text) {
            console.log(line, text)
            dom_lyric.innerHTML = text
          },
          onSetLyric: function (lines) {
            //console.log(lines)
          },
        })
    },

    loadLrcFile () {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      const fileHash = this.queue[this.queueIndex].hash;
      const url = `/api/check-lrc/${fileHash}?token=${token}`;

      this.$axios.get(url)
        .then((response) => {
          if (response.data.result) {
            this.lrcAvailable = true;
            console.log(response.data.result);
            console.log(response.data.message);
            console.log(response.data.hash);

            console.log('读入歌词');
            const lrcUrl = `/api/stream/${response.data.hash}?token=${token}`;
            this.$axios.get(lrcUrl)
              .then(response => {
                console.log('歌词读入成功');
                //console.log(response.data);
                this.lrcObj.setLyric(response.data);
                this.lrcObj.play(this.player.currentTime * 1000);
              });

          } else {
            this.lrcAvailable = false;
            this.lrcObj.setLyric('');
            console.log(response.data.result);
            console.log(response.data.message);
          }
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status !== 401) {
              // this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
              // lrc file does not exist
              console.log('Got here!');
            }
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    showErrNotif (message) {
      this.$q.notify({
        message,
        color: 'negative',
        icon: 'bug_report'
      })
    }
  },

  mounted () {
    // 初始化音量
    this.$store.commit('AudioPlayer/SET_VOLUME', this.player.volume);
    this.initLrcObj();
    if (this.source) {
      this.loadLrcFile();
    }
  }
}
</script>

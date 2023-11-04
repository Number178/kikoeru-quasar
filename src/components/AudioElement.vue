<template>

  <!--在进度条周围监听mouseup、mousedown事件，辅助进度条状态切换-->
  <div class="q-px-md"
      @mousedown.capture="onPanSlider('start')"
      @mouseup.capture="onPanSlider('end')"
  >
    <q-slider v-model="changeCurrentTime"
      @change="onChangeSlider"
      @pan="onPanSlider"
      :min="0" :max="duration" :step="0.01"
      label
      :label-value="formatSeconds(displayCurrentTime)"
      />
    <vue-plyr 
      ref="plyr"
      :hideControls="false"
      class="vue-plyr"
      :emit="['canplay', 'timeupdate', 'ended', 'seeked', 'playing', 'waiting', 'pause']" @canplay="onCanplay()"
      @timeupdate="onTimeupdate()"
      @ended="onEnded()"
      @seeked="onSeeked()"
      @playing="onPlaying()"
      @waiting="onWaiting()"
      @pause="onPause()"
    >
      <!--使用video组件来播放音频和视频文件，同时隐藏原生的vue-plyr组件，这里的组件只会留下一个进度条的功能
      之所以用video，是因为video可以设置mp3等音频文件，也可以播放mp4等视频文件，在播放视频的时候，还能够用该video元素作为canvas绘制来源，
      反之，audio虽然可以播放video的音频，但是将其作为canvas的绘制源，因此倾向于使用video来播放所有媒体元素-->
      <!--注意，这里video设置了一个id，因为需要被其他组件通过document.querySelector方式进行查找引用-->
      <video v-if="enableVideoSource" class="hide-in-global-page-for-pip" id="mediaVideo" crossorigin="anonymous" playsinline controls="controls" style="display: inline;">
        <source v-if="source" :src="source" />
      </video>
      <audio v-else crossorigin="anonymous">
        <source v-if="source" :src="source" />
      </audio>
    </vue-plyr>
  </div>
</template>

<script>
import Lyric from 'lrc-file-parser'
import { mapState, mapGetters, mapMutations } from 'vuex'
import NotifyMixin from '../mixins/Notification.js'
import { AIServerApi, formatSeconds, basename, audioLyricNameMatch } from '../utils'

function convert_srt_vtt_to_lrc(text) {
  let lines = text.split("\n").map(l => l.trim())
  let isVtt = lines[0] == 'WEBVTT';
  if (isVtt) {
    lines = lines.slice(1)
  }

  const timeParseRe = /(\d*):(\d*):(\d*)(\.|,)(\d*)\s*-->\s*[\d:.]*/

  const parsingUnit = []; // [([minute, seconds, millseconds], '文字\n文字'), (), ..., ()]
  let i = 0;
  while(i < lines.length) {

    // 注意 srt 和 vtt 字幕的毫秒区分符号一个是`,'另一个是`.
    // audio.srt be like
    // 1
    // 00:01:22,343 --> 00:03:22,344
    // 字幕，字幕
    // 
    // 2
    // ...

    // audio.vtt be like
    // WEBVTT
    // 
    // 1
    // 00:01:22.343 --> 00:03:22.344
    // 字幕，字幕
    // 
    // 2
    // ...

    if (/^\d*$/.test(lines[i++])) { /* parse 序号 */
      if (timeParseRe.test(lines[i])) { /* parse 时间戳 */
        const [_/* whole string */ , h, m, s, _mill_sep /* ignore */, ms] = timeParseRe.exec(lines[i]).map(x => parseInt(x));
        let texts = [];
        i++;
        while(i < lines.length && lines[i] != "") { /* parse 文字，直到空行 */
          texts.push(lines[i++]);
        }
        parsingUnit.push([
          [h, m, s, ms],
          texts.join(' '),
        ]);
      }
    }
  } // parse srt vtt 完成

  function padding(n, len) {
    n = Math.ceil(n);
    let s = `${n}`;
    let pad = len - s.length;
    if (pad > 0) {
      for (let i = 0; i < pad; ++i) {
        s = "0" + s;
      }
    }
    return s;
  }

  function formatLrcTime([h, m, s, ms]) {
    return padding(h * m, 2) + ":" + padding(m, 2) + ":" + padding(s, 2) + "." + padding(ms, 3);
  }

  const lrcContent = parsingUnit.map(([time, text]) => `[${formatLrcTime(time)}] ${text}`).join("\n");
  return lrcContent;
}

export default {
  name: 'AudioElement',

  mixins: [NotifyMixin],

  data() {
    return {
      lrcContent: "",
      lrcObj: null,
      lrcAvailable: false,

      // 音频播放器进度条实现有些trick，普通的slider不能直接用，
      // 因为time的更新源有两个【audio播放】【用户输入】，
      // 两个更新源回导致进度条跳转出错，需要在【用户输入时】关闭【audio播放】发出的time更新（slider上）
      isChangingCurrentTime: false,
      changeCurrentTime: 0,
    }
  },

  computed: {
    player () {
      return this.$refs.plyr.player
    },

    source () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      // New API
      if (this.currentPlayingFile.mediaStreamUrl) {
        return `${this.currentPlayingFile.mediaStreamUrl}?token=${token}`
      } else if (this.currentPlayingFile.hash) {
        // Fallback to be compatible with old backend
        return `/api/media/stream/${this.currentPlayingFile.hash}?token=${token}`
      } else {
        return ""
      }
    },

    ...mapState('AudioPlayer', [
      'playing',
      'queue',
      'queueIndex',
      'playMode',
      'muted',
      'volume',
      'sleepTime',
      'sleepMode',
      'rewindSeekTime',
      'forwardSeekTime',
      'rewindSeekMode',
      'forwardSeekMode',
      'enableVisualizer',
      'resumeHistroySeconds',
      'playWorkId',
      'visualPlayerCoverUrl',
      'duration',
      'currentTime',
      'newCurrentTime',
      'enableVideoSource',
      'lyricOffsetSeconds',

      'aiServerUrl',
      'remoteAILyricTaskId', 
    ]),

    ...mapGetters('AudioPlayer', [
      'currentPlayingFile',
      'resumeHistroyDone',
    ]),

    displayCurrentTime() {
      if (this.isChangingCurrentTime) return this.changeCurrentTime;
      else return this.currentTime;
    }
  },

  watch: {
    playing (flag) {
      if (this.player.duration) {
        // 缓冲至可播放状态
        flag ? this.player.play() : this.player.pause()
      }
      // this.playLrc(flag);
    },

    // watch source -> media.load() -> canPlay -> player.play()
    source (url) {
      if (url) {
        // 加载新音频/视频文件
        this.player.media.load();
        this.loadLrcFile();
        this.updateMediaSessionMetadata();
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
    },
    rewindSeekMode(rewind) {
      if (rewind) {
        this.player.rewind(this.rewindSeekTime);
        this.SET_REWIND_SEEK_MODE(false);
      }
    },
    forwardSeekMode(forward) {
      if (forward) {
        this.player.forward(this.forwardSeekTime);
        this.SET_FORWARD_SEEK_MODE(false);
      }
    },
    currentTime(v) {
      if (this.isChangingCurrentTime) return;
      else this.changeCurrentTime = this.currentTime;
    },
    newCurrentTime(v) {
      if (v < 0) return;
      this.player.currentTime = v;
      this.SET_NEW_CURRENT_TIME(-1); // 标记时间已经更新到media上了
    },
    lyricOffsetSeconds(v) {
      this.playLrc(true); // 强制更新一下歌词时间
      this.playLrc(this.playing); // 强制更新一下歌词时间
    },
    remoteAILyricTaskId(id) {
      if (id === "") return
      this.loadRemoteAILyricTaskId(id);
    }
  },

  methods: {
    formatSeconds,

    /**
     * 当 外部暂停（线控暂停、软件切换）、用户控制暂停、seek 时会触发本事件
     */
    onPause() {
      // console.log('onPause')
      this.playLrc(false)
      this.PAUSE()
    },
    /**
     * 当播放器真正开始播放时会触发本事件
     */
    onPlaying() {
      // console.log('playing')
      this.playLrc(true)
      this.PLAY()
    },
    /**
     * 当播放器缓冲区空，被迫暂停加载时会触发本事件
     */
    onWaiting() {
      // console.log('waiting')
      this.playLrc(false)
      this.PLAY()
    },
    ...mapMutations('AudioPlayer', [
      'SET_DURATION',
      'SET_CURRENT_TIME',
      'PAUSE',
      'PLAY',
      'SET_TRACK',
      'NEXT_TRACK',
      'PREVIOUS_TRACK',
      'SET_CURRENT_LYRIC',
      'SET_VOLUME',
      'CLEAR_SLEEP_MODE',
      'SET_REWIND_SEEK_MODE',
      'SET_FORWARD_SEEK_MODE',
      'SET_AUDIO_ANALYSER',
      'RESUME_HISTROY_SECONDS_DONE',
      'SET_HAS_LYRIC',
      'SET_NEW_CURRENT_TIME',
      'SET_REMOTE_AI_LYRIC_TASK_ID',
    ]),

    onCanplay () {
      // 缓冲至可播放状态时触发 (只有缓冲至可播放状态, 才能获取媒体文件的播放时长)
      this.SET_DURATION(this.player.duration)

      // 播放
      if (this.playing && this.player.currentTime !== this.player.duration) {
        this.player.play()
      }

      // 当音频文件在网页中加载完毕，可以播放时
      // 检查此前是否有需要恢复的历史进度，如果尚未恢复
      // 则设置currentTime到指定的时间点，然后标记已经恢复历史播放记录
      if (!this.resumeHistroyDone) {
        this.player.currentTime = this.resumeHistroySeconds;
        this.RESUME_HISTROY_SECONDS_DONE()
        this.$q.notify({message: "已恢复播放历史", timeout: 1000})
      }
    },

    onTimeupdate () {
      // 当目前的播放位置已更改时触发
      this.SET_CURRENT_TIME(this.player.currentTime)
      if (this.sleepMode && this.sleepTime) {
        const currentTime = new Date()
        const currentHourStr = currentTime.getHours().toString().padStart(2, '0')
        const currentMinuteStr = currentTime.getMinutes().toString().padStart(2, '0')
        const sleepHourStr = this.sleepTime.match(/\d+/g)[0]
        const sleepMinuteStr = this.sleepTime.match(/\d+/g)[1]
        if (currentHourStr === sleepHourStr && currentMinuteStr === sleepMinuteStr) {
          this.PAUSE()
          this.CLEAR_SLEEP_MODE()
          // Persist sleep mode settings
          this.$q.sessionStorage.set('sleepTime', null)
          this.$q.sessionStorage.set('sleepMode', false)
        }
      }
    },

    onEnded () {
      // 当前文件播放结束时触发
      switch (this.playMode.name) {
        case "all repeat":
          // 循环播放
          if (this.queueIndex === this.queue.length - 1) {
            this.SET_TRACK(0)
          } else {
            this.NEXT_TRACK()
          }
          break
        case "repeat once":
          // 单曲循环
          this.player.currentTime = 0
          this.player.play()
          this.PLAY()
          break
        case "shuffle": {
          // 随机播放
          const index = Math.floor(Math.random()*this.queue.length)
          this.SET_TRACK(index)
          if (index === this.queueIndex) {
            this.player.currentTime = 0
          }
          break
        }
        default:
          // 顺序播放
          if (this.queueIndex === this.queue.length - 1) {
            this.PAUSE()
          } else {
            this.NEXT_TRACK()
          }
      }
    },

    onSeeked() {
      // if (this.lrcAvailable) {
      //   this.lrcObj.play(this.player.currentTime * 1000);
      //   if (!this.playing) {
      //     this.lrcObj.pause();
      //   }
      // }
      this.playLrc(this.playing);
    },


    playLrc (playStatus) {
      if (this.lrcAvailable) {
        if (playStatus) {
          this.lrcObj.play((this.player.currentTime + this.lyricOffsetSeconds) * 1000);
        } else {
          this.lrcObj.pause();
        }
      }
    },

    createLrcObj () {
        this.lrcObj = new Lyric({
          onPlay: (line, text) => {
            this.SET_CURRENT_LYRIC(text);
          },
        })
    },

    async loadLrcFile () {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      const fileHash = this.queue[this.queueIndex].hash;
      const url = `/api/media/check-lrc/${fileHash}?token=${token}`;

      try {
        // 首先向服务器查询是否有歌词
        const check_response = await this.$axios.get(url)
        if (!check_response.data.result) {
          // 服务器没有查到歌词文件

          // 则尝试去ai服务器上查询
          if (this.aiServerUrl) await this.tryLoadRemoteAILyric()
          else this.resetToNoLyricStatus()
          return;
        }

        // 有lrc歌词文件
        this.lrcAvailable = true;
        console.log('读入歌词');
        const lrcUrl = `/api/media/stream/${check_response.data.hash}?token=${token}`;
        const lyricExtension = check_response.data.lyricExtension.toLowerCase();

        // 开始下载具体的lrc内容
        const response = this.$axios.get(lrcUrl)
        console.log('歌词读入成功');
        console.log('srt convert to lrc');
        if (lyricExtension == ".srt" || lyricExtension == ".vtt") {
          response.data = convert_srt_vtt_to_lrc(response.data);
        }
        this.lrcObj.setLyric(response.data);
        this.lrcContent = response.data;
        this.lrcObj.play(this.player.currentTime * 1000);
        if (!this.playing) this.lrcObj.pause() // 加载歌词后，观察当前是否在播放音频，如果没有，则暂停歌词滚动
        this.SET_HAS_LYRIC(true);
      } catch(error) {
        if (error.response) {
          // 请求已发出，但服务器响应的状态码不在 2xx 范围内
          if (error.response.status !== 401) {
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`);
          }
        } else {
          this.showErrNotif(error.message || error);
        }
        this.SET_HAS_LYRIC(false);
      }
    },

    resetToNoLyricStatus() {
      // 无歌词文件
      this.lrcAvailable = false;
      this.lrcObj.setLyric('');
      this.lrcContent = '';
      this.SET_CURRENT_LYRIC('');
      this.SET_HAS_LYRIC(false);
    },

    async loadRemoteAILyricTaskId(aiTaskId) {
      this.SET_REMOTE_AI_LYRIC_TASK_ID(""); // 将全局ai歌词加载flag清空
      const lrcContent = await AIServerApi.downloadTask(this.aiServerUrl, aiTaskId)
      this.lrcAvailable = true;
      this.lrcObj.setLyric(lrcContent);
      this.lrcContent = lrcContent;
      this.lrcObj.play(this.player.currentTime * 1000);
      if (!this.playing) this.lrcObj.pause() // 加载歌词后，观察当前是否在播放音频，如果没有，则暂停歌词滚动
      this.SET_HAS_LYRIC(true);
    },

    async tryLoadRemoteAILyric() {
      const workId = parseInt(this.currentPlayingFile.hash.replace(/\/.*/, "")); // 通过hash获取该文件对应的workId，返回number类型
      const audioFileBasename = basename(this.currentPlayingFile.title);

      let tasks = [];
      try {
        do {
          console.log("搜索ai歌词，第一阶段，严格匹配workId和文件title")
          tasks = await AIServerApi.searchTask(this.aiServerUrl, audioFileBasename, workId);
          tasks = tasks.filter(t => t.status == AIServerApi.TaskStatus.SUCCESS)
          if (tasks.length >= 1) break;

          console.log("搜索ai歌词，第二阶段，查找workId作品内所有歌词")
          tasks = await AIServerApi.searchWorkRelatedTask(this.aiServerUrl, workId);
          tasks = tasks.filter((t) => t.status == AIServerApi.TaskStatus.SUCCESS && audioLyricNameMatch(audioFileBasename, t.fileBasename))
          break;

        /*eslint-disable no-constant-condition*/
        } while(0);

      } catch(e) {
        console.log("查找ai歌词失败: ", e)
      }

      if (tasks.length >= 1) {
        console.log(`  已找到ai歌词记录${tasks.length}个`)
        
        console.log(`  加载第一个歌词记录，id = ${tasks[0].id}`)
        await this.loadRemoteAILyricTaskId(tasks[0].id)
      } else {
        console.warn("没有找到ai歌词")
      }
    },

    updateMediaSessionMetadata() {
      console.log("try update media session")
      try {
        if (this.playWorkId == 0) {
          navigator.mediaSession.metadata = null;
        } else {
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: this.currentPlayingFile.title,
            artist: "",
            album: this.currentPlayingFile.workTitle,
            // artwork: this.visualPlayerCoverUrl,
            artwork: [
              // {
              //   src: this.genCoverUrl(this.playWorkId, "visualPlayerCover"), // 图像太大，safari上有时会出现加载失败的问题
              //   sizes: "600x600", // 随便写的尺寸
              //   type: "image/jpg",
              // },
              {
                src: this.genCoverUrl(this.playWorkId, "main"),
                sizes: "560x560",
                type: "image/jpeg",
              },
              {
                src: this.genCoverUrl(this.playWorkId, "240x240"),
                sizes: "240x240",
                type: "image/jpeg",
              },
              {
                src: this.genCoverUrl(this.playWorkId, "sam"),
                sizes: "100x100",
                type: "image/jpeg",
              },
            ]
          })
        }
      } catch (e) {
        console.warn("set mediasession failed, because: ", e)
      }
    },

    // type: in 'visualPlayerCover', 'main', 'sam', '240x240', # warning '360x360' is almost not exist in dlsite, do not use 360x360
    // 'visualPlayerCover' 默认是 'main'，如果用户有手动设置过可视化封面的话，则使用用户设置过的那个图片
    genCoverUrl(workId, type) {
      const token = this.$q.localStorage.getItem('jwt-token') || ''

      if (type == "visualPlayerCover") {
        return this.visualPlayerCoverUrl
          ? `${this.visualPlayerCoverUrl}?token=${token}`
          : ""
      } else if (workId != 0) {
        return `/api/cover/${workId}?type=${type}&token=${token}`
      } else {
        return ""
      }
    },

    onChangeSlider(v) {
      console.log("player current time is ", this.player.currentTime)
      console.log("slider change value to ", v)
      console.log("global current time is ", this.currentTime)
      this.player.currentTime = v;
    },
     onPanSlider(phase) {
      console.warn(" pan with phase = ", phase)
      if (phase == 'start') {
        this.isChangingCurrentTime = true;
        this.changeCurrentTime = this.currentTime;
      } else {
        // 延时一下，避免音频状态的值立即被更新到slider上
        setTimeout(() => {
          this.isChangingCurrentTime = false;
        }, 100);
      }
     },
  },

  mounted () {
    // 初始化音量
    this.SET_VOLUME(this.player.volume);

    const initAudio = () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = {
        left: audioCtx.createAnalyser(),
        right: audioCtx.createAnalyser(),
      };

      const audioSrc = audioCtx.createMediaElementSource(this.player.media);
      const splitter = audioCtx.createChannelSplitter(2);
      audioSrc.connect(splitter);
      splitter.connect(analyser.left, 0);
      splitter.connect(analyser.right, 1);
      audioSrc.connect(audioCtx.destination)
      this.SET_AUDIO_ANALYSER(analyser)
      document.removeEventListener('click', initAudio);
    }

    if (this.enableVisualizer) {
      document.addEventListener('click', initAudio);
      if (this.$q.platform.is.safari && this.$q.platform.is.mobile) {
        this.$q.notify({
          message: "监测到safari平台上开启了音频可视化功能，注意移动端safari有bug，如果没有声音的话，请关闭音频可视化功能",
          timeout: 5000
        })
      }
    }

    this.createLrcObj();
    if (this.source) {
      this.loadLrcFile();
    }
  },
}
</script>

<style scoped>
.vue-plyr {
  /* visibility: hidden; */
  /*display: none;*/
  width: 1px;
    height: 1px;
    overflow: hidden;
    top: 0px;
    left: 0px;
    position: absolute;
}

</style>

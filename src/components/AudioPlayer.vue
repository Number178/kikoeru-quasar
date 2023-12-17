<template>
  <div>

    <!-- 播放器 -->
    <div>
      <q-card 
        class="fixed-bottom-right box-shadow audio-player" 
        @mousewheel.prevent 
        @touchmove.prevent
        color="primary"
        :class="{showStyle: showAudioPlayer, hideStyle: !showAudioPlayer}"
        :style="{'--cover-url': `url(${coverUrl})`}"
      >
        <!--顶部小横条-->
        <div class="pull-handler" @click="toggleHide" v-touch-swipe.mouse.down="toggleHide"></div>

        <!-- 音声封面 -->
        <div class="row items-center albumart q-mt-lg q-pa-sm relative-position flippable-cover-container non-selectable"
          v-touch-swipe.mouse="onCoverSwipe"
        >
          <q-img
            contain
            class="rounded-borders box-shadow flippable-cover cover-img"
            :class="{
              'flip-on-front': !isFlipCover,
              'flip-on-back': isFlipCover,
            }"
            :img-style="{
              transition: 'opacity 1s, filter 1s',
              filter: isFlipCover ? 'brightness(0.1) grayscale(80%)' : 'brightness(1) grayscale(0%)',
              'backface-visibility': 'hidden',
            }"
            transition="fade"
            :src="coverUrl"
            :ratio="4/3"
            @dblclick.prevent="openWorkDetail()"
          >
          <AudioEqualizer class="equalizer rounded-borders box-shadow flip-on-back"
            :disable="!isFlipCover"
            :style="{
              transition: 'all 1s',
              opacity: isFlipCover ? 1 : 0,
            }"
             />
          </q-img>

        </div>

        <!-- 设置菜单 -->
        <div class="row justify-between q-mr-sm q-my-sm">
          <!-- 顶在前面 -->
            <!-- 曲目列表 -->
            <q-btn 
              flat 
              dense 
              size="md" 
              padding="none sm" 
              icon="queue_music" 
              @click="showCurrentPlayList = !showCurrentPlayList" 
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                切换曲目
              </q-tooltip>
            </q-btn>

            <!--视频画中画-->
            <q-btn 
              v-if="enableVideoSource && isCurrentPlayingFileVideo" 
              dense 
              size="md" 
              padding="none sm" 
              :flat="!enableVideoSourcePIP"
              :outline="enableVideoSourcePIP"
              icon="picture_in_picture_alt" 
              @click="onSetEnableVideoSourcePIP(!enableVideoSourcePIP)" 
            >
            <q-tooltip anchor="top middle" self="bottom middle">
              视频画中画
            </q-tooltip>
            </q-btn>

            <!--画中画歌词-->
            <q-btn 
              v-if="hasLyric || enablePIPLyrics" 
              dense 
              size="md" 
              padding="none sm"
              :flat="!enablePIPLyrics"
              :outline="enablePIPLyrics"
              icon="picture_in_picture" 
              @click="setPIPLyrics" 
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                桌面歌词
              </q-tooltip>
            </q-btn>

            <!--播放顺序切换-->
            <q-btn 
              flat 
              dense 
              size="md" 
              padding="none sm" 
              :icon="playModeIcon" 
              @click="changePlayMode()" 
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                {{ playModeString }}
              </q-tooltip>
            </q-btn>

            <!--大屏幕-->
            <q-btn 
              flat 
              dense 
              size="md" 
              padding="none sm" 
              icon="fullscreen" 
              @click="gotoFullScreenPlayer"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                网页全屏
              </q-tooltip>
            </q-btn>

            <!--equalizer-->
            <q-btn 
              v-if="enableVisualizer"
              flat 
              dense 
              size="md" 
              padding="none sm" 
              icon="equalizer" 
              @click="flipCover"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                音效均衡器
              </q-tooltip>
            </q-btn>

          <!-- 放在尾部 -->
            <q-btn
              flat 
              dense
              size="md"
              padding="none sm"
              icon="more_horiz"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                更多播放设置
              </q-tooltip>
              <q-menu anchor="bottom right" self="top right">
                <q-item clickable v-ripple @click="hideSeekButton = !hideSeekButton">
                  <q-item-section avatar>
                    <q-icon :name="hideSeekButton ? 'done' : ''" />
                  </q-item-section>

                  <q-item-section>
                    隐藏封面按钮
                  </q-item-section>
                </q-item>
                
                <q-item clickable v-ripple @click="toggleSwapSeekButton">
                  <q-item-section avatar>
                    <q-icon :name="swapSeekButton ? 'done' : ''" />
                  </q-item-section>
                  <q-item-section>
                    交换进度按钮与切换按钮
                  </q-item-section>
                </q-item>
                
                <q-item clickable v-ripple @click="openWorkDetail()" v-close-popup>
                  <q-item-section avatar>
                    <!-- placeholder -->
                  </q-item-section>
                  <q-item-section>
                    打开作品详情（或双击封面）
                  </q-item-section>
                </q-item>
                
                <q-item clickable v-ripple @click="toggleEnableVisualizer">
                  <q-item-section avatar>
                    <q-icon :name="enableVisualizer ? 'done' : ''" />
                  </q-item-section>
                  <q-item-section>
                    开启音频可视化（需要刷新页面）
                  </q-item-section>
                </q-item>
                
                <q-item clickable v-ripple @click="onToggleVideoSource">
                  <q-item-section avatar>
                    <q-icon :name="enableVideoSource ? 'done' : ''" />
                  </q-item-section>
                  <q-item-section>
                    视频源绘制功能（需要刷新页面）
                  </q-item-section>
                </q-item>

                <q-item v-if="hasLyric">
                  <q-item-section>
                    <q-input
                      v-if="hasLyric"
                      :value="lyricOffsetSeconds"
                      @input="lyricOffsetChange"
                      type="number"
                      prefix="歌词偏移"
                      suffix="s"
                      style="max-width: 100%;"
                      outlined
                      clearable
                      input-style="text-align: right;"
                    >
                      <template slot="before">
                          <q-btn size="sm" padding="md xs" icon="sync_alt" @click="lyricSyncDialog = true"></q-btn>
                      </template>
                      <template slot="append">
                        <div class="column">
                          <q-btn
                            size="xs"
                            icon="arrow_drop_up"
                            @click="lyricOffsetChange(lyricOffsetSeconds + 0.1)"
                          ></q-btn>
                          <q-btn
                            size="xs"
                            icon="arrow_drop_down"
                            @click="lyricOffsetChange(lyricOffsetSeconds - 0.1)"
                          ></q-btn>
                        </div>
                      </template>
                    </q-input>
                  </q-item-section>
                </q-item>
              </q-menu>
            </q-btn>
        </div>

        <!-- 进度条控件 -->
        <div class="row items-center q-mx-sm q-mb-sm non-selectable">
          <div class="col-auto relative-position">{{ formatSeconds(currentTime) }}</div>
          <AudioElement class="col" />
          <div class="col-auto relative-position">{{ formatSeconds(duration) }}</div>
        </div>

        <!-- Place holder for iOS -->
        <div style="height: 5px" v-if="$q.platform.is.ios" />

        <div class="column text-center non-selectable ">
          <Scrollable class="full-width" :stop="hide" name="audioTitle">
            <span class="audio-name relative-position q-px-md">{{ currentPlayingFile.title }}</span>
          </Scrollable>
          <Scrollable class="full-width" :stop="hide" name="workTitle">
            <span class="work-name relative-position q-px-md">{{ currentPlayingFile.workTitle }}</span>
          </Scrollable>
        </div>

        <!-- Place holder for iOS -->
        <div  style="height: 10px" v-if="$q.platform.is.ios" />

        <!-- 播放按钮控件 -->
        <div class="row justify-around" style="height: 65px">
          <q-btn flat dense class="col-auto" size="lg"   icon="skip_previous" @click="previousTrack()" style="width: 55px" />
          <q-btn flat dense class="col-auto" size="lg"   :icon="rewindIcon" @click="rewind(true)" style="width: 55px" />
          <q-btn flat dense class="col-auto" size="28px" :icon="playingIcon" @click="togglePlaying()" style="width: 65px" />
          <q-btn flat dense class="col-auto" size="lg"   :icon="forwardIcon" @click="forward(true)" style="width: 55px" />
          <q-btn flat dense class="col-auto" size="lg"   icon="skip_next" @click="nextTrack()" style="width: 55px" />
        </div>

        <!-- 音量控件 -->
        <!-- HTML5 volume in iOS is read-only -->
        <div class="row items-center q-mx-lg" style="height: 50px" v-if="!$q.platform.is.ios">
          <q-icon name="volume_down" size="sm" class="col-auto" />
          <q-slider v-model="volume" :min="0" :max="1" :step="0.01" class="col q-mx-md"/>
          <q-icon name="volume_up" size="sm" class="col-auto" />
        </div>
      </q-card>
    </div>

    <!-- 当前播放列表 -->
    <q-dialog v-model="showCurrentPlayList">
      <q-card class="current-play-list">
        <!-- 操作当前播放列表的控制按钮 -->
        <div class="row" style="padding: 5px; height: 45px;">
          <q-btn dense round size="md" icon="edit" color="primary" @click="editCurrentPlayList = !editCurrentPlayList" style="height: 35px; width: 35px;" class="col-auto" />
          <q-btn dense round size="md" icon="save" color="teal" style="height: 35px; width: 35px;" class="col-auto q-mx-sm" />
          <q-space />
          <q-btn dense round size="md" icon="delete_forever" color="red" @click="emptyQueue()" style="height: 35px; width: 35px;" class="col-auto" />
        </div>
        
        <q-separator />

        <!-- 音频文件列表 -->
        <q-list style="max-height: 450px" class="scroll">
          <draggable
            handle=".handle"
            v-model="queueCopy"
            @change="val => onMoved(val.moved)"
          >
            <q-item
              clickable
              v-ripple
              v-for="(track, index) in queueCopy"
              :key="index"
              :active="queueIndex === index"
              active-class="text-white bg-teal"
              class="non-selectable"
              style="padding: 0px 10px;"
              @click="onClickTrack(index)"
            >
              <q-item-section side v-show="editCurrentPlayList">
                <q-icon name="clear" :color="queueIndex === index ? 'white' : 'red'" @click="removeFromQueue(index)" />
              </q-item-section>

              <q-item-section avatar>
                <q-img transition="fade" :src="samCoverUrl(track.hash)" style="height: 38px; width: 38px" class="rounded-borders" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ track.title }}</q-item-label>
                <q-item-label caption lines="1">{{ track.workTitle }}</q-item-label>
              </q-item-section>

              <q-item-section side class="handle" v-show="editCurrentPlayList">
                <q-icon name="reorder" :color="queueIndex === index ? 'white' : 'dark'" />
              </q-item-section>
            </q-item>
          </draggable>
        </q-list>
      </q-card>
    </q-dialog>

    <q-dialog v-model="lyricSyncDialog"  seamless position="top">
      <q-card class="bg-primary text-white">
        <q-card-section>
          <div class="text-h6">歌词同步辅助工具</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          这是一个辅助计算歌词偏移量的工具，当音频和歌词的时间出现不同步的时候，使用此工具来计算修复的歌词偏移量。
          请在正常播放状态下播放音频和歌词，从声音和歌词中找到一个关键点A，对应声音A和歌词A，
          判断先听到声音还是先看到歌词，当其中一个出现时，点击下方对应的按钮，接着在另一个元素出现时再次点击一次按钮。
          这里将会计算两次点击之间的时间差，点击“应用偏移量”即可立即刚才两次点击的时间差作为歌词偏移量。
        </q-card-section>

        <q-card-section v-if="fixState === 'ready'">
          <q-btn @click="startFixLyricSync('lyric')">歌词先出现了</q-btn>
          <q-btn @click="startFixLyricSync('audio')">先听到了声音</q-btn>
        </q-card-section>

        <q-card-section v-if="fixState === 'measure'">
          <q-btn @click="stopFixLyricSync">{{ fixWhoStartFirst == "audio" ? "歌词这个时候出现了" : "这个时候才听到了声音" }}</q-btn>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn @click="lyricSyncDialog = false">关闭</q-btn>
          <q-btn v-if="fixState !== 'ready'" @click="fixState = 'ready'" >重新计量偏移量</q-btn>
          <q-btn v-if="fixState === 'done'" @click="fixApply">应用偏移量 {{ showDeltaSeconds }}</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import AudioElement from 'components/AudioElement'
import Scrollable from 'components/Scrollable'
import AudioEqualizer from 'components/AudioEqualizer'
import { mapState, mapGetters, mapMutations } from 'vuex'
import { formatSeconds } from '../utils'
import { debounce } from 'quasar'

export default {
  name: 'AudioPlayer',

  components: {
    draggable,
    AudioElement,
    Scrollable,
    AudioEqualizer,
  },

  data () {
    return {
      showCurrentPlayList: false,
      editCurrentPlayList: false,
      queueCopy: [],
      hideSeekButton: false,
      isAndroid: navigator.userAgent.toLowerCase().indexOf('android') > -1,
      histroyCheckIntervalId: -1,
      latestUpdatedHistory: null, // 记录最近一次更新的历史记录，防止反复对同一个播放历史进行远程数据更新

      isFlipCover: false, // 是否反转封面显示其他内容

      // 歌词偏移量修复工具
      lyricSyncDialog: false,
      fixState: "ready",  // ready: 准备开始, measure: 计时进行中, done: 计时完成
      fixWhoStartFirst: "", // "audio", "lyric" // 先看到的歌词，还是先听到的声音
      fixStartMills: 0,
      fixStopMills: 0,
    }
  },

  mounted () {
    if (this.$q.localStorage.has('hideSeekButton')) {
      this.hideSeekButton = this.$q.localStorage.getItem('hideSeekButton')
    }
    this.histroyCheckIntervalId = setInterval(() => {
      this.onUpdatePlayingStatus()
    }, 60 * 1000) // 每隔一段时间更新一次播放记录
  },

  beforeDestroy() {
    clearInterval(this.histroyCheckIntervalId)

    // 原本是想要在关闭窗口时，更新最后一次播放历史
    // 但是实际测试下来，关闭窗口时根本没有来得及发送最后一次更新消息，于是放弃这个方案
    // this.onUpdatePlayingStatus()
  },

  watch: {
    queue (val) {
      this.queueCopy = val.concat()
      // 在删除最后一个 track 时关闭当前播放列表
      if (this.queueCopy.length === 0) {
        this.showCurrentPlayList = false
      } else {
        // 播放列表发生变化，且更新后不为空的情况下
        // 更新播放历史
        this.onUpdatePlayingStatus()
      }
    },

    queueIndex() {
      // 当前播放序号发生变化时更新历史
      this.onUpdatePlayingStatus()
    },

    showCurrentPlayList (flag) {
      // 关闭当前播放列表后，重置 editCurrentPlayList 状态为 false
      if (flag === false) {
        this.editCurrentPlayList = false
      }
    },

    hideSeekButton (option) {
      this.$q.localStorage.set('hideSeekButton', option)
    },

    playing() {
      this.onUpdatePlayingStatus()
    },

    // 监听 前进、后退 进度条时间，
    // 当 ***SeekMode 变为false，表明进度条跳转已经完成
    rewindSeekMode(v) {
      if (!v) {
        // 当用户前进后退时，currentTime可能并没有立即从audio元素中反馈到vue状态里，
        // 因此这里需要延迟一小会，等待audio前进后退之后的更新时间抵达vue的currentTime状态，
        // 然后再去更新播放历史
        setTimeout(() => {
          this.onUpdatePlayingStatus()
        }, 100) 
      }
    },
    forwardSeekMode(v) {
      if (!v) {
        // 当用户前进后退时，currentTime可能并没有立即从audio元素中反馈到vue状态里，
        // 因此这里需要延迟一小会，等待audio前进后退之后的更新时间抵达vue的currentTime状态，
        // 然后再去更新播放历史
        setTimeout(() => {
          this.onUpdatePlayingStatus()
        }, 100)
      }
    },
    currentTime() {
      if (!this.playing) {
        // 暂停状态下切换时间，也更新播放历史
        this.onUpdatePlayingStatus()
      }
    },
    enableVisualizer() {
      this.suggestRefreshPage();
    },
    enableVideoSource() {
      this.suggestRefreshPage();
    },
    lyricSyncDialog() {
      this.fixState = 'ready';
    }
  },

  computed: {
    showAudioPlayer () {
      return this.currentPlayingFile.hash && !this.hide;
    },

    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      const hash = this.currentPlayingFile.hash
      return hash ? `/api/cover/${hash.split('/')[0]}?token=${token}` : ""
    },

    workDetailUrl () {
      const hash = this.currentPlayingFile.hash
      return hash ? `/work/${hash.split('/')[0]}` : ""
    },

    volume: {
      get () {
        return this.$store.state.AudioPlayer.volume
      },
      set (val) {
        this.SET_VOLUME(val)
      }
    },

    queue: {
      get () {
        return this.$store.state.AudioPlayer.queue
      },
      set () {}
    },

    playModeIcon () {
      switch (this.playMode.name) {
        case "all repeat":
          return "repeat"
        case "repeat once":
          return "repeat_one"
        case "shuffle":
          return "shuffle"
        default:
          return "playlist_play"
      }
    },

    playModeString () {
      switch (this.playMode.name) {
        case "all repeat":
          return "全部"
        case "repeat once":
          return "单曲循环"
        case "shuffle":
          return "随机"
        default:
          return "列表播放"
      }
    },

    playingIcon () {
      return this.playing ? "pause" : "play_arrow"
    },

    rewindIcon () {
      switch (this.rewindSeekTime) {
        case 5:
          return 'replay_5'
        case 10:
          return 'replay_10'
        case 30:
          return 'replay_30'
        default:
          return 'replay_5'
      }
    },

    forwardIcon () {
      switch (this.forwardSeekTime) {
        case 5:
          return 'forward_5'
        case 10:
          return 'forward_10'
        case 30:
          return 'forward_30'
        default:
          return 'forward_5'
      }
    },

    fixDeltaMills() {
      // 音频先出现的话，需要将offset增加，使得歌词提前出现
      let sign = this.fixWhoStartFirst == 'audio' ? +1 : -1;
      return sign * (this.fixStopMills - this.fixStartMills);
    },
    showDeltaSeconds() {
      const epsilon = 1;
      if (Math.abs(this.fixDeltaMills) < epsilon) return ""
      return `${this.fixDeltaMills > 0 ? '+': ''}${(this.fixDeltaMills/1000).toFixed(2)}s`;
    },

    ...mapState('AudioPlayer', [
      'playing',
      'hide',
      'currentTime',
      'duration',
      'queueIndex',
      'playMode',
      'rewindSeekTime',
      'forwardSeekTime',
      'swapSeekButton',
      'enableVisualizer',
      'enableVideoSource',
      'enableVideoSourcePIP',
      'enablePIPLyrics',
      'playWorkId',
      'rewindSeekMode',
      'forwardSeekMode',
      'hasLyric',
      'lyricOffsetSeconds',
    ]),
    
    ...mapGetters('AudioPlayer', [
      'currentPlayingFile',
      'resumeHistroyDone',
      'isCurrentPlayingFileVideo',
    ])
  },

  methods: {
    formatSeconds,

    startFixLyricSync(whoStartFirst) {
      this.fixState = "measure";
      this.fixWhoStartFirst = whoStartFirst;
      this.fixStartMills = this.fixStopMills = performance.now();
    },

    stopFixLyricSync() {
      this.fixState = "done"; // 计时结束，重制状态
      this.fixStopMills = performance.now();
    },

    fixApply() {
      this.lyricOffsetChange(this.fixDeltaMills / 1000);
      this.lyricSyncDialog = false;
      this.fixState = "ready";
      this.$q.notify({message: `歌词偏移量(${this.fixDeltaMills/1000}s)已应用`, timeout: 500})
    },

    ...mapMutations('AudioPlayer', {
      toggleHide: 'TOGGLE_HIDE',
      togglePlaying: 'TOGGLE_PLAYING',
      nextTrack: 'NEXT_TRACK',
      previousTrack: 'PREVIOUS_TRACK',
      changePlayMode: 'CHANGE_PLAY_MODE',
      setVolume: 'SET_VOLUME',
      rewind: 'SET_REWIND_SEEK_MODE',
      forward: 'SET_FORWARD_SEEK_MODE',
      toggleSwapSeekButton: 'TOGGLE_SWAP_SEEK_BUTTON',
      toggleEnableVisualizer: 'TOGGLE_ENABLE_VISUALIZER',
      toggleEnableVideoSource: 'TOGGLE_ENABLE_VIDEO_SOURCE',
      setEnableVideoSourcePIP: 'SET_ENABLE_VIDEO_SOURCE_PIP',
      setEnablePIPLyrics: 'SET_ENABLE_PIP_LYRICS',
      setLyricOffsetSeconds: 'SET_LYRIC_OFFSET_SECONDS',
    }),
    ...mapMutations('AudioPlayer', [
      'SET_TRACK',
      'SET_QUEUE',
      'REMOVE_FROM_QUEUE',
      'EMPTY_QUEUE',
      'SET_VOLUME',
    ]),

    samCoverUrl (hash) {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return hash ? `/api/cover/${hash.split('/')[0]}?type=sam&token=${token}` : ""
    },

    onClickTrack (index) {
      if (!this.editCurrentPlayList) {
        this.SET_TRACK(index)
        this.showCurrentPlayList = false
      }
    },

    onMoved(moved) {
      let index = null
      if (moved.oldIndex === this.queueIndex) {
        index = moved.newIndex
      } else if (moved.oldIndex < this.queueIndex && moved.newIndex >= this.queueIndex) {
        index = this.queueIndex - 1
      } else if (moved.oldIndex > this.queueIndex && moved.newIndex <= this.queueIndex) {
        index = this.queueIndex + 1
      } else {
        index = this.queueIndex
      }
   
      this.SET_QUEUE({
        queue: this.queueCopy.concat(),
        index: index,
        resetPlaying: false
      })
    },

    removeFromQueue (index) {
      this.REMOVE_FROM_QUEUE(index)
    },

    emptyQueue () {
      this.EMPTY_QUEUE()
    },

    onCoverSwipe(evt) {
      switch(evt.direction) {
        case 'left':
        case 'right':
          this.flipCover();
          break;
        case 'down':
          this.toggleHide();
      }
    },

    openWorkDetail () {
      if (this.workDetailUrl && this.$route.path !== this.workDetailUrl) {
        this.$router.push(this.workDetailUrl)
      }
      if (this.$q.screen.lt.sm) {
          this.toggleHide()
      }
    },

    setPIPLyrics() {
      if (!this.enablePIPLyrics) {
        this.$q.notify({message: "创建桌面歌词组件中，请稍等...", timeout: 500})
      }
      this.setEnablePIPLyrics(!this.enablePIPLyrics)
    },
    
    // return true if two history updated on (onUpdatePlayingStatus) is same
    isSameTwoHistory(ha, hb) {
      // 如果有任意一个是null，则认为两者不一样
      if (!(ha && hb)) return false;
      
      if (ha.work_id != hb.work_id) return false;
      if (ha.state.seconds != hb.state.seconds) return false;
      if (ha.state.index != hb.state.index) return false;
      if (ha.state.queue.length != hb.state.queue.length) return false;
      for (let i = 0; i < ha.state.queue.length; ++i) {
        if (ha.state.queue[i].hash != hb.state.queue[i].hash) return false;
      }
      return true;
    },
    
    onUpdatePlayingStatus() {
      // 当前播放列表为空，禁止记录播放历史
      if (this.queueCopy.length <= 0) return;

      // 尚处于恢复历史记录的阶段，为了避免此时将空状态写入远程服务器覆盖有效状态，跳过本次历史更新
      if (!this.resumeHistroyDone) {
        console.log("尚处于恢复历史记录的状态，跳过本次历史更新")
        return
      }

      const data = {
        "work_id": this.playWorkId,
        "state": {
          queue: this.queueCopy,
          index: this.queueIndex,
          seconds: this.currentTime,
        }
      }

      // 检查最近一次的历史更新记录，如果两次数据不变，则无需更新记录
      if (this.isSameTwoHistory(this.latestUpdatedHistory, data)) {
        console.log("播放状态未变，跳过服务器历史更新")
        return
      }

      this.$axios.put('/api/histroy', data)
        .then((_) => {
          console.log("更新播放状态成功")
          this.latestUpdatedHistory = data;
        })
        .catch((err) => {
          console.error(err.response.data.error)
        })
    },

    // 中转一道这个设置，加一些用户提示
    onToggleVideoSource() {

      // 如果是关闭的话，直接关掉，无需用户提示
      if (this.enableVideoSource) {
        this.toggleEnableVideoSource();
        return;
      }

      // 打开的话，需要提示一些用户信息
      this.$q.dialog({
        title: '注意',
        message: '开启视频源绘制功能会增加性能开销，移动设备上可能会发热严重，请谨慎选择。此外，在iOS safari系统中，safari会强制将页面中正在播放的视频元素设置为画中画模式，无法规避，建议iOS safari环境下关闭此项功能',
        cancel: true,
      }).onOk(() => {
        this.toggleEnableVideoSource()
      }).onCancel(() => {})
    },

    onSetEnableVideoSourcePIP(enable) {
      this.setEnableVideoSourcePIP(enable)

      const video = document.querySelector("#mediaVideo") // 全局id获取对应的video元素，因为safari进入pip模式需要在用户动作回调中执行，实在是没法跨组件做这个，这里hack一下
      const isAlreadyInPIP = document.pictureInPictureElement === video
      if (enable && !isAlreadyInPIP) {
        if (
          typeof video.requestPictureInPicture === 'function' &&
          document.pictureInPictureEnabled
        ) {
          video.requestPictureInPicture().then(() => {
            video.addEventListener('leavepictureinpicture', () => {
              if (this.playing) this.player.play()
              this.setEnableVideoSourcePIP(false)
            })
          }).catch((err) => {
            console.log("PIP in video source failed, msg = ", err.message)
          })
        } else if (typeof video.webkitPresentationMode === 'function') {
          video.webkitPresentationMode('picture-in-picture')
        }
      } else if (isAlreadyInPIP) {
        document.exitPictureInPicture();
      }
    },

    gotoFullScreenPlayer() {
      this.$router.push(`/fullScreenPlayer`)
    },

    // 当发生特定配置改动，需要用户刷新页面时，通过这个通知来提示用户
    suggestRefreshPage() {
      this.$q.notify({
        message: "配置已更改，建议刷新页面",
        actions: [
          { label: "立即刷新",
            handler: () => {
              // this.$router.push(`/fullScreenPlayer/${this.playWorkId}`)
              // this.$router.push(`/fullScreenPlayer`)
              this.$router.go(0);
            }
          }
        ],
      });
    },

    lyricOffsetChange(seconds) {
      if (seconds == null) seconds = 0;
      seconds = Math.round(seconds * 10000) / 10000; // 解决javascript小数点精度问题，比如0.9+0.1变成0.999999这种问题，在这里修复成1.0
      console.log("lyric offset change to ", seconds, typeof seconds)
      this.setLyricOffsetSeconds(seconds)
    },

    flipCover() {
      if (!this.enableVisualizer) return; // 尚未开启音频可视化选项，无法使用音效均衡器
      console.warn("flip cover");
      this.isFlipCover = !this.isFlipCover;
    }
  },

  created() {
    // 历史更新函数防抖动
    this.onUpdatePlayingStatus = debounce(this.onUpdatePlayingStatus, 500);
  }
}
</script>


<style lang="scss" scoped>
.box-shadow {
  box-shadow: black 0px 4px 8px;
}

.audio-player {

  // 宽度 > $breakpoint-sm-min
  @media (min-width: $breakpoint-sm-min) {
    width: 330px;
    margin: 0px 10px 10px 0px;
    border-radius: 8px;
  }

  // 宽度 < $breakpoint-xs-max (599px)
  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  transition: 0.6s;
  overflow: hidden;

  /* flex布局，让封面占据主要空间，其余空间留给其他控件 */
  display: flex;
  flex-direction: column;
}

.audio-player::before {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  content: "";
  background-image: var(--cover-url);
  background-position: 50% 50%;
  background-size: contain;
  background-repeat: repeat;
  filter: blur(30px) brightness(0.7); // blur bigger than 80 will cause safari wrong render result
}

.hideStyle {
  transform: translateY(200%);
}

.showStyle {
  transform: translateY(0);
}

.albumart {

  // 宽度 < $breakpoint-xs-max (599px)
  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }

  /* 播放控件中，封面占据几乎所有剩余空间，将其他控件挤到底部去 */
  flex-grow: 1;
}

.current-play-list {
  max-height: 500px;

  // 宽度 > $breakpoint-xs-max
  @media (min-width: $breakpoint-xs-max) {
    width: 450px;
  }

  // 宽度 < $breakpoint-xs-max (599px)
  @media (max-width: $breakpoint-xs-max) {
    min-width: 280px;
  }
}

.pull-handler {
  height: 6px;
  width: 100px;
  background: rgba(255, 255, 255, 0.3);
  position: absolute;
  border-radius: 4px !important;
  overflow: hidden;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
}

.pull-handler:hover {
  background: rgba(255, 255, 255, 0.5);
}

.audio-name {
  font-weight: bold;
  white-space: nowrap;
}

.work-name {
  opacity: 0.7;
  white-space: nowrap;
}

.equalizer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: transparent;
  transform: rotateY(180deg);
}

.flippable-cover-container {
  perspective: 60rem;
  transition: opacity 1s;
}

.cover-img {
  transition: transform 1s;
}

.hide-cover-img {
  opacity: 0;
}

.show-cover-img {
  opacity: 1;
}

.flip-on-front {
  transform: rotateY(0);
}

.flip-on-back {
  transform: rotateY(180deg);
}

</style>

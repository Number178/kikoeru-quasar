import { LocalStorage } from 'quasar'

export const SWAP_SEEK_BUTTON_KEY = 'swap_seek_button'
export const ENABLE_VISUALIZER_KEY = 'enable_visualizer'
export const ENABLE_PIP_LYRICS = 'enable_pip_lyrics'
export const ENABLE_VIDEO_SOURCE_KEY = 'enable_video_source'
export const AI_SERVER_URL_KEY = 'ai_server_url'

export default function () {
  return {
    hide: false,
    playing: false, // 播放状态 (true/false)
    currentTime: 0, // 单位: 秒
    newCurrentTime: -1, // 单位：秒，<0 的负数表示当前无需更改媒体的currentTime，>=0 表示需要更改媒体的currentTime
    duration: 0,
    source: "",
    queue: [
      // list of tracks. object format:
      /*
        hash: null, // unique identifier for the file
        title: null, // title to show in UI
        workTitle: null // workTitle to show in UI
       */
    ],
    queueIndex: 0, // which track in the queue is currently selected
    playMode: {
      id: 0,
      name: "order"
    }, // 顺序播放("order"), 循环播放("all repeat"), 单曲循环("repeat once") or 随机播放("shuffle")
    muted: false,
    volume: 0, // 音量 (0.0-1.0)
    hasLyric: false,
    currentLyric: '',
    lyricOffsetSeconds: 0,
    sleepTime: null,
    sleepMode: false,
    rewindSeekTime: 5,
    forwardSeekTime: 30,
    rewindSeekMode: false,
    forwardSeekMode: false,
    swapSeekButton: LocalStorage.has(SWAP_SEEK_BUTTON_KEY) && LocalStorage.getItem(SWAP_SEEK_BUTTON_KEY), // 交换进度按钮与切换按钮
    enableVisualizer: LocalStorage.has(ENABLE_VISUALIZER_KEY) && LocalStorage.getItem(ENABLE_VISUALIZER_KEY), // 是否开启音频可视化
    enableVideoSource: LocalStorage.has(ENABLE_VIDEO_SOURCE_KEY) && LocalStorage.getItem(ENABLE_VIDEO_SOURCE_KEY), // 是否开启视频元素作为媒体源，用于在网页中播放视频格式的音频作品
    enableVideoSourcePIP: false, // 让videoSource进入画中画模式，每一次需要单独设置
    visualPlayerCoverUrl: '', // 可视化播放器的封面图
    playWorkId: 0, // 当前播放作品的id

    audioAnalyser: null, // 全局 audio 音频解析对象
    // audioAnalyzerData: null, // 解析音频信息，可视化展示

    // 是否启用画中画歌词（桌面歌词）
    // 注意android chrome不支持画中画，firefox估计也不支持，因此在android设备上禁用这一功能
    enablePIPLyrics: LocalStorage.has(ENABLE_PIP_LYRICS) && LocalStorage.getItem(ENABLE_PIP_LYRICS) && !(navigator.userAgent.toLowerCase().indexOf('android') > -1), 

    // 当从历史记录播放时，这里记录当前queue[queueIndex]应当恢复到的seconds时间，
    // -1表示无需恢复，其他大于等于0的数字需要在onCanplay时间触发并完成时间跳转之后，再次设置为-1
    resumeHistroySeconds: -1,

    aiServerUrl: "",
  }
}

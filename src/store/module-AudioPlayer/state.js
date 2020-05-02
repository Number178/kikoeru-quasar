export default function () {
  return {
    hide: false,
    playing: false, // 播放状态 (true/false)
    currentTime: 0, // 单位: 秒
    duration: 0,
    source: "",
    queue: [
      // list of tracks. object format:
      /*
        name: null, // title to show in UI
        subtitle: null, // subtitle to show in UI
        hash: null, // unique identifier for the file
       */
    ],
    queueIndex: 0, // which track in the queue is currently selected
    playMode: {
      id: 0,
      name: "order"
    }, // 顺序播放("order"), 循环播放("all repeat"), 单曲循环("repeat once") or 随机播放("shuffle")
    muted: false,
    volume: 0, // 音量 (0.0-1.0)
  }
}

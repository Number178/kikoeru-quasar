export default function () {
  return {
    playing: false, // 播放状态 (true/false)
    progress: 0, // 播放进度 (0-100)
    seek: -1, // where to seek to (0-100)
    duration: 0,
    source: "",
    queue: [
      // list of tracks. object format:
      /*
        title: null, // title to show in UI
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

/**
 * 格式化 id，适配 8 位、6 位 id
 * @param {number} id
 * @return {string}
 */
export function formatID(id) {
  if (id >= 1000000) {
    // 大于 7 位数，则补全为 8 位
    id = `0${id}`.slice(-8);
  } else {
    // 否则补全为 6 位
    id = `000000${id}`.slice(-6);
  }

  return id;
}
export function formatSeconds(seconds) {
  let h = Math.floor(seconds / 3600) < 10
    ? '0' + Math.floor(seconds / 3600)
    : Math.floor(seconds / 3600)

  let m = Math.floor((seconds / 60 % 60)) < 10
    ? '0' + Math.floor((seconds / 60 % 60))
    : Math.floor((seconds / 60 % 60))

  let s = Math.floor((seconds % 60)) < 10
    ? '0' + Math.floor((seconds % 60))
    : Math.floor((seconds % 60))

  return h === "00"
    ? m + ":" + s
    : h + ":" + m + ":" + s
}

// 解决字符串到正则当中的问题
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export const AIServerApi = {
  async searchTask(serverUrl, fileName, workId, workTitle) {
    // task 存储的名字（用来搜索）是一个字符串，按照`${workId}#${workTitle}#${fileName}` 的形式存储
    // 根据提供的参数，来尽可能的提供完整的搜索字符串
    // fileName是唯一必须的
    let searchQuery = escapeRegExp(fileName);
    if (workTitle) {
        searchQuery = `${escapeRegExp(workTitle)}.*${searchQuery}`
    }
    if (workId) {
        // workId is just a number, no escape is needed
        searchQuery = `${workId}.*${searchQuery}`
    }

    const url = new URL(`${serverUrl}/task/search`);
    url.searchParams.set("keyword", searchQuery);
    const response = await fetch(url, {
        method: "GET",
    });
    return await response.json();
  },

  // protocol: "http:" or "https:"
  // host:  "10.1.1.1:3324"
  // path: "/download/path/1"
  async addNewTask(serverUrl, downloadPath, workId, workTitle, fileName) {
    const data = {
      url: `${location.protocol}//${location.host}${downloadPath}`,
      name: `${workId}#${workTitle}#${fileName}`,
    };
    const response = await fetch(`${serverUrl}/task/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getTask(serverUrl, id) {
    const url = new URL(`${serverUrl}/task/get/${id}`);
    const response = await fetch(url, { method: "GET" });
    return await response.json();
  },

  async downloadTask(serverUrl, id) {
    const url = new URL(`${serverUrl}/task/download/${id}`);
    const response = await fetch(url, { method: "GET" });
    const json = await response.json();
    return json.lrcContent;
  },

  TaskStatus: {
    NONE: 0 ,// 非法状态
    PENDING: 1 ,// 待执行
    DOWNLOADING: 2 ,// 正在下在音频
    DOWNLOADED: 3 ,// 下载完成
    TRASCRIPTING: 4 ,// 转录中
    SUCCESS: 5 ,// 转录成功
    ERROR: 6 ,// 转录失败
  }
}
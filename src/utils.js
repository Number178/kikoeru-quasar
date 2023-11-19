import axios from "axios";
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

export function basename(string) {
  const extIdx = string.lastIndexOf('.');
  return extIdx >= 0 ? string.substr(0, extIdx) : string;
}

export const AIServerApi = {
  polishTask(task) {
    // task {       {
    //    "status": 5,
    //    "displayName": "1077815#标题名字#文件名字.mp3",
    //    "createdTime": 1698584425.8244648,
    //    "id": 761573718272583583
    // },}
    // 
    // to
    // 
    // {
    //    "status": 5,
    //    "createdTime": 1698584425.8244648,
    //    "id": 761573718272583583
    //    "workId": 1077815,
    //    "workTitle" "标题名字",
    //    "fileName" "文件名字.mp3",
    //    "fileBasename" "文件名字",
    //    "fileExt" ".mp3",
    // },}
    const [workId, workTitle, fileName] = task.displayName.split("<#>")
    const extIdx = fileName.lastIndexOf('.');
    const fileBasename = extIdx >= 0 ? fileName.substr(0, extIdx) : fileName;
    const fileExt = extIdx >= 0 ? fileName.substr(extIdx) : "";
    
    return {
      status: task.status,
      createdTime: task.createdTime,
      id: task.id,
      workId,
      workTitle,
      fileName,
      fileBasename,
      fileExt,
    };
  },
  
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

  async searchWorkRelatedTask(serverUrl, workId) {
    const tasks = await this.searchTask(serverUrl, "", workId, undefined)
    return tasks.map(this.polishTask);
  },

  // protocol: "http:" or "https:"
  // host:  "10.1.1.1:3324"
  // path: "/download/path/1"
  async addNewTask(serverUrl, downloadPath, workId, workTitle, fileName) {
    const data = {
      url: `${location.protocol}//${location.host}${downloadPath}`,
      name: `${workId}<#>${workTitle.replaceAll('#','')}<#>${fileName}`,
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

export const AILyricTaskStatus = {
  NONE: 0, // 非法状态
  PENDING: 1, // 任务待申领
  TRASCRIPTING: 2, // 任务已被申领，并等待执行完成
  SUCCESS: 3, // 翻译成功
  ERROR: 4, // 翻译失败
  COUNT: 5, // 状态总数
}

export const ServerApi = {
  // page start from 1
  // workId: number, a workId like string of "01101111" should convert to number 1101111
  // fileName: string
  // status: number[]
  async searchTask(page, workId, fileName, status) {
    const url = '/api/lyric/translate';
    const params = {
      page,
      work_id: workId || 0,
      file_name: fileName || '',
      status: JSON.stringify(status || []),
    };
    const response = await axios.get(url, { params });
    return response.data;
  },

  async translateAudio(fileHash) {
    const url = `/api/lyric/translate/${fileHash}`;
    const response = await axios.put(url);
    return response.data;
  },

  async deleteTask(id) {
    const url = `/api/lyric/translate/${id}`;
    const response = await axios.delete(url);
    return response.data;
  }, 

  async redoTask(id) {
    const url = `/api/lyric/translate/redo/${id}`;
    const response = await axios.post(url);
    return response.data;
  }
}

export function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// return [similarity in 0.0~1.0, editDistance]
export function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }

  const ed = editDistance(longer, shorter);
  return [(longerLength - ed) / parseFloat(longerLength), ed];
}

export function bidirectionSimilarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  const shorterLength = shorter.length;

  if (longerLength == 0) {
    return 1.0;
  }

  const buf = Array(longerLength).fill(0);
  for (let i = 0; i < shorterLength; ++i) {
    if (longer[i] == shorter[i]) buf[i]++;
    if (longer[longerLength - i - 1] == shorter[shorterLength - i - 1]) buf[longerLength - i]++;
  }

  const samePortion = buf.reduce((acc, x) => acc + (x == 0 ? 0 : 1), 0);
  const value =  samePortion / shorterLength;
  return value;
}

export function audioLyricNameMatch(aname, lname) {
  const oname = basename(aname);
  const dname = lname;

  
  if (oname === dname) return true; // 完全相等
  else if (oname.includes(dname)) return true;

  // 相似性判断，要排除一种情况就是作品文件名称之间极其相似，只有数字序号不同，这个时候相似度极高，需要特殊处理
  const [sim, ed] = similarity(oname, dname);
  if (oname.length == dname.length && ed <= 2) {
    // 如果两个字符串长度一样，编辑距离相差小于2，则认为两者是仅序号不同的文件，将其判定为不匹配的音频和字幕
    return false;
  }

  if (sim > 0.8) return true;
  else if (bidirectionSimilarity(oname, dname) > 0.8) return true;

  return false;
}
import axios from "axios";
/**
 * 格式化 id，适配 8 位、6 位 id，转换成带有RJ前缀的番号
 * 为了兼容BJ等其他形式的作品番号，规定：
 * 1. 保留整数末尾的12位十进制用于番号的数字部分，比如RJ01234567中的1234567，称为id数字
 * 2. 高于12位十进制的部分，存储番号类型，用来指代RJ、BJ或者其他，称为id类型
 * 3. RJ的id类型为0，向前兼容
 * 4. BJ的id类型为1
 * @param {number} id
 * @return {string}
 */
const idSplitter = 1e12
export function getIdType(id) {
  const t = typeof(id);
  switch (t) {
    case "string": return id.substring(0, 2);
    case "number": return Math.floor(id / idSplitter);
    default: throw Error(`get id type failed, ${id} is unsupported type ${t}`)
  }
}
export function getIdDigit(id) {
  const t = typeof(id);
  switch (t) {
    case "string": return id.substring(2);
    case "number": return Math.floor(id % idSplitter);
    default: throw Error(`get id digit failed, ${id} is unsupported type ${t}`)
  }
}
export function formatID(idDigit) {
  if (idDigit >= 1000000) {
    // 大于 7 位数，则补全为 8 位
    return `0${idDigit}`.slice(-8);
  } else {
    // 否则补全为 6 位
    return `000000${idDigit}`.slice(-6);
  }
}
export function idNumberToCode(id) {
  const idDigit = getIdDigit(id);
  const idType = getIdType(id);
  const idPrefix = ["RJ", "BJ"][idType];
  return `${idPrefix}${formatID(idDigit)}`;
}
export function codeToIdNumber(code) {
  if (code.startsWith("RJ")) {
    return parseInt(code.substr(2))
  } else if (code.startsWith("BJ")) {
    return 1 * idSplitter + parseInt(code.substr(2))
  } else {
    throw Error(`unkown code format: ${code}`)
  }
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

export function basenameWithoutExt(string) {
  const extIdx = string.lastIndexOf('.');
  return extIdx >= 0 ? string.substr(0, extIdx) : string;
}

export function extname(string) {
  const extIdx = string.lastIndexOf('.');
  return extIdx >= 0 ? string.substr(extIdx) : "";
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
  // status: number[] of AILyricTaskStatus.***
  // return: {
  //     "pagination": {
  //       "currentPage": 1,
  //       "pageSize": 12,
  //       "totalCount": 2
  //   },
  //   "tasks": [
  //       {
  //           "id": 10,
  //           "work_id": 1004107,
  //           "audio_path": "01_mp3/track02_小穴担当和校外学习约会.mp3",
  //           "status": 3,
  //           "worker_name": "whisper",
  //           "worker_status": "翻译进度: 100%",
  //           "title": "纯情小穴担当After"
  //       },
  //       {
  //           "id": 8,
  //           "work_id": 1004107,
  //           "audio_path": "01_mp3/track00_标题名与广告.mp3",
  //           "status": 3,
  //           "worker_name": "whisper",
  //           "worker_status": "翻译进度: 100%",
  //           "title": "纯情小穴担当After"
  //       }
  //   ]
  // }
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

  polishTask(task) {
    const clone = Object.assign({}, task);

    const fileBasename = task.audio_path.split(/[\\/]/).pop();
    
    clone.fileName = basenameWithoutExt(fileBasename);
    clone.fileExt = extname(fileBasename);
    clone.fileBasename = fileBasename;
    return clone;
  },

  async searchWorkTask(workId, fileName, status) {
    const data = await this.searchTask(-1, workId, fileName || "", []);
    return data.tasks.map(this.polishTask);
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
  },

  async downloadLrc(id) {
    const response = await axios.get(`/api/lyric/translate/lrc`, { params: { id } });
    return response.data.lrcContent;
  },
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
  const oname = basenameWithoutExt(aname);
  const dname = lname;
  
  if (oname === dname) return true; // 完全相等
  else if (oname.includes(dname)) return true;

  // 相似性判断，要排除一种情况就是作品文件名称之间极其相似，只有数字序号不同，这个时候相似度极高，需要特殊处理
  
  // 针对SEなし SEなし 这类文件名进行处理
  if (oname.includes("あり") && oname.replace(/あり/g, "なし") === dname) {
    return true;
  }
  if (oname.includes("なし") && oname.replace(/なし/g, "あり") === dname) {
    return true;
  }

  // 去掉文件名中所有的数字后，检查字符串是否一致，
  // 如果一致，说明两个文件名只有数字不同，不进行任何相似度判断
  // 直接判定为不同的两个文件
  const digitDetector = /\d/g;
  if (digitDetector.test(oname) && digitDetector.test(dname) && oname.replace(digitDetector, "") === dname.replace(digitDetector, "")) {
    return false;
  }

  const [sim, ed] = similarity(oname, dname);
  if (oname.length == dname.length && ed <= 2) {
    // 如果两个字符串长度一样，编辑距离相差小于2，则认为两者是仅序号不同的文件，将其判定为不匹配的音频和字幕
    return false;
  }

  if (sim > 0.8) return true;
  else if (bidirectionSimilarity(oname, dname) > 0.9) return true;

  return false;
}

// 多关键字搜索子条件类型
export const AdvanceSearchCondType = {
  UNKNOWN: 0,
  FUZZY: 1, // 全文模糊搜索，包括标题，
  VA: 2,
  TAG: 3,
  CIRCLE: 4,
}

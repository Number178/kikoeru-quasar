<template>
    <q-dialog v-bind:value="value" v-on:input="$emit('input')">
      <q-card class="ai-center-card">
        <q-card-section>
          <div class="text-h6">AI 歌词中心</div>
        </q-card-section>

        <div class="row justify-between">
          <q-card-actions align="left">
            <q-btn flat label="刷新" color="primary" @click="refreshStatus" />
          </q-card-actions>
          <q-card-actions align="right">
            <q-btn flat label="关闭" color="primary" v-close-popup />
          </q-card-actions>
        </div>

        <q-card-section>
          <q-input v-model="aiServerUrlLocal" label="AI服务器地址" @change="onAiServerUrlChange" />
        </q-card-section>

        <q-card-section >
          <q-list v-if="tasks.length > 0" bordered separator>
            <q-item v-for="task in tasks" clickable v-ripple :key="task.id">
              <q-item-section>
                <q-item-label>{{ showTaskStatus(task) }}</q-item-label>
                <q-item-label>{{ task.fileName }}</q-item-label>
                <q-item-label>RJ{{ formatID(task.workId)  }}</q-item-label>
                <q-item-label>{{ task.workTitle }}</q-item-label>
              </q-item-section>
              <q-btn v-if="task.status == TaskStatus.SUCCESS" @click="applyTaskToLyric(task.id)">选择当前歌词</q-btn>
            </q-item>
          </q-list>
          <div v-else>
            当前作品尚无ai翻译任务，请先在作品页中，选择当前作品 {{ playWorkId }} 右键进行ai翻译
          </div>
        </q-card-section>

      </q-card>
    </q-dialog>
</template> 

<script>
import { mapState, mapMutations } from 'vuex'
import { AIServerApi } from "../utils.js"
import { formatID } from '../utils.js';

const TaskStatus = AIServerApi.TaskStatus;

export default {
  name: 'AILyricCenter',

  // v-model: showAILyricCenter from MainLayout
  props: ['value'],

  data() {
    return {
      aiServerUrlLocal: "",

      // task defination: {
      //    "status": 5,
      //    "resourceUrl": "http://10.6.10.9:30148/api/media/download/1095047/1",
      //    "displayName": "1095047#\u7570\u4e16\u754c\u30d8\u30eb\u30b9\u3078\u3088\u3046\u3053\u305d \u30de\u30be\u5fa1\u7528\u9054 \u610f\u5730\u60aa\u30a8\u30eb\u30d5\u306e\u30aa\u30ca\u30b5\u30dd\u5c02\u9580\u5e97 \u30c9\u30b9\u30b1\u30d9\u30a8\u30eb\u30d5\u306b\u683c\u306e\u9055\u3044\u3092\u898b\u305b\u3064\u3051\u3089\u308c\u308b\u30aa\u30ca\u30cb\u30fc\u30b5\u30dd\u30fc\u30c8#1.\u7570\u4e16\u754c\u30d8\u30eb\u30b9\u3078\u3088\u3046\u3053\u305d(SE\u3042\u308a).WAV",
      //    "createdTime": 1698566933.293261,
      //    "mediaPath": "/Users/number17/Codes/dj_whisper/whisper-finetune-500h/cache/input/207776076030774225.WAV",
      //    "lrcPath": "/Users/number17/Codes/dj_whisper/whisper-finetune-500h/cache/output/207776076030774225.lrc",
      //    "id": 207776076030774225
      // },
      tasks: [],
      TaskStatus,
      formatID,
    }
  },

  computed: {
    ...mapState('AudioPlayer', [
      'playWorkId',
      'aiServerUrl',
    ]),

    isDarkModeOn() {
      return this.$q.dark.isActive;
    }
  },

  watch: {
    aiServerUrl(v) {
    }
  },

  mounted() {
    this.aiServerUrlLocal = this.aiServerUrl;
    this.refreshStatus()
  },

  methods: {
    ...mapMutations('AudioPlayer', [
      'SET_AI_SERVER_URL',
      'SET_REMOTE_AI_LYRIC_TASK_ID',
    ]),

    async refreshStatus() {
      if (this.aiServerUrl === "") return;
      const tasks = await AIServerApi.searchTask(this.aiServerUrl, "", this.playWorkId, undefined);
      console.log("fetch tasks = ", tasks)
      tasks.forEach(task => {
        const [workId, workTitle, fileName] = task.displayName.split("#")
        task.workId = workId;
        task.workTitle = workTitle;
        task.fileName = fileName;
      });
      this.tasks = tasks;
    },

    onAiServerUrlChange(event) {
      this.SET_AI_SERVER_URL(event.target.value)
      console.log('change ai server url: ', event.target.value);
    },

    showTaskStatus(task) {
      switch(task.status) {
        case TaskStatus.NONE:
          return "非法状态";
        case TaskStatus.PENDING:
          return "任务待执行";
        case TaskStatus.DOWNLOADING:
          return "正在下载音频";
        case TaskStatus.DOWNLOADED:
          return "音频下载完成，等待翻译";
        case TaskStatus.TRASCRIPTING:
          return "翻译中";
        case TaskStatus.SUCCESS:
          return "翻译成功";
        case TaskStatus.ERROR:
          return "失败";
      }
    },

    applyTaskToLyric(taskId) {
      this.SET_REMOTE_AI_LYRIC_TASK_ID(taskId);
    }
  }
}
</script>

<style scoped>
.ai-center-card {
  min-width: 70vw;
  min-height: 70vh;
}
</style>
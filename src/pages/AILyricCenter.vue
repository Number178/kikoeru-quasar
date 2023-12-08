<template>
  <div>
    <div class="text-h5 text-weight-regular q-ma-md">
      AI 歌词中心
    </div>
    <div class="row">
      <q-input class="col col-sm-12 q-pa-sm" dense outlined v-model="filterWorkId" label="搜索作品id" type="number">
        <template v-slot:prepend>
          RJ
        </template>
      </q-input>
      <q-input class="col col-sm-12 q-pa-sm" dense outlined v-model="filterFileName" label="搜索文件名">
      </q-input>

      <!-- 字幕筛选 -->
      <q-select
        class="col-auto col-sm-12 q-pa-sm"
        dense
        outlined
        bg-color=""
        style="min-width: 8rem;"
        v-model="statusOption"
        :options="statusOptions"
        :option-label="readableStatus"
        label="状态筛选"
        clearable
        multiple
      />
    </div>

    <!-- 刷新 -->
    <q-btn @click="resetLoadedData" class="full-width" color="primary">刷新</q-btn>
    <!--<q-toggle v-model="autoRefresh" :label="autoRefresh ? '自动刷新' : '关闭自动刷新'" />-->

    <!--任务列表-->
    <div>
      <q-infinite-scroll :disable="stopLoadingPage" :offset="500" @load="onLoad">
        <q-list bordered separator class="q-ma-sm">
            <q-item v-for="task in tasks" :key="task.id">
              <q-chip square size="sm" class="absolute-top-left">
                <q-avatar color="primary">id</q-avatar>
                {{ task.id }}
              </q-chip>
              <q-item-section avatar @click.prevent.stop="copyToClipboard(task.id, `任务id '${task.id}'`)">
                <q-img transition="fade" :src="samCoverUrl(task.work_id)" style="height: 38px; width: 38px" class="rounded-borders" />
                <q-tooltip>点击复制任务id</q-tooltip>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ readableStatus(task.status) }}</q-item-label>
                <q-icon v-if="task.status == AILyricTaskStatus.NONE" name="warning" color="warning" size="2em" />
                <q-icon v-else-if="task.status == AILyricTaskStatus.PENDING" name="pending_actions" color="primary" size="2em" />
                <q-spinner-bars v-else-if="task.status == AILyricTaskStatus.TRASCRIPTING" color="primary" size="2em" />
                <q-icon v-else-if="task.status == AILyricTaskStatus.SUCCESS" name="check_circle" color="positive" size="2em" />
                <q-icon v-else-if="task.status == AILyricTaskStatus.ERROR" name="error" color="negative" size="2em" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ task.audio_path }}</q-item-label>
                <div class="row">
                  <q-chip square text-color="primary" icon="library_music">
                    RJ{{ formatID(task.work_id)  }}
                  </q-chip>
                  <q-chip square color="brown-13" icon="engineering">
                    {{ task.worker_name }}
                  </q-chip>
                </div>
                <q-item-label caption>{{ task.worker_status }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn @click="openWorkDetail(task.work_id)" dense class="full-height">打开作品详情</q-btn>
              </q-item-section>
              <q-item-section side>
                <q-btn @click="deleteTask(task.id)" class="text-negative" dense>删除</q-btn>
                <q-btn v-if="task.status >= AILyricTaskStatus.PENDING" @click="redoTask(task.id)" dense>重试</q-btn>
              </q-item-section>
            </q-item>
          </q-list>
      </q-infinite-scroll>
    </div>
  </div>
</template> 

<script>
import { mapState } from 'vuex'
import { copyToClipboard } from 'quasar';
import { ServerApi, AILyricTaskStatus } from "../utils.js"
import { formatID } from '../utils.js';
import NotifyMixin from '../mixins/Notification.js'

export default {
  name: 'AILyricCenter',

  // v-model: showAILyricCenter from MainLayout
  props: ['value'],

  mixins: [NotifyMixin],

  data() {
    return {
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
      AILyricTaskStatus,
      formatID,

      filterWorkId: "",
      filterFileName: "",

      statusOption: [],
      statusOptions: Array(AILyricTaskStatus.COUNT).fill(0).map((_, i) => i),

      pagination: { currentPage:0, pageSize: 12, totalCount:0 },
      stopLoadingPage: false,

      autoRefresh: false, // 是否自动刷新
      autoRefreshIntervalMills: 5000, // 自动刷新间隔
    }
  },

  watch: {
    statusOption(v) {
      if (v === null) this.statusOption = [];
      this.resetLoadedData();
    },
    filterWorkId() {
      this.resetLoadedData();
    },
    filterFileName() {
      this.resetLoadedData();
    },
    filterStatus() {
      this.resetLoadedData();
    },
  },

  mounted() {
    this.resetLoadedData()
  },

  methods: {
    async resetLoadedData() {
      console.warn("resetLoadedData start, freeze scroller")
      this.stopLoadingPage = true; // freeze scroller first
      this.pagination = { currentPage:0, pageSize: 12, totalCount:0 };
      this.tasks = [];
      // Manually fetch first page content before enable scroller
      // Note: the internal API of the infinite scroller does not work well
      await this.loadFurtherTasks();
      this.stopLoadingPage = false; // unlock scroller
      console.warn("resetLoadedData finished, unfreeze scroller")
    },
    async loadFurtherTasks() {
      let page = null;
      try {
        page = await ServerApi.searchTask(
          this.pagination.currentPage + 1, 
          this.filterWorkId, 
          this.filterFileName, 
          this.statusOption,
        );
      } catch(error) {
        if (error.response) {
          // 请求已发出，但服务器响应的状态码不在 2xx 范围内
          if (error.response.status !== 401) {
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          }
        } else {
          this.showErrNotif(error.message || error)
        }
        this.stopLoadingPage = true;
        return;
      }

      this.pagination = page.pagination;
      this.tasks = page.pagination.currentPage === 1
        ? page.tasks
        : this.tasks.concat(page.tasks);
      if (this.tasks.length >= page.pagination.totalCount) {
        console.warn("all ai task loaded")
        this.stopLoadingPage = true;
      }
    },

    onLoad(_, done) {
      this.loadFurtherTasks().then(() => done())
    },

    readableStatus(status) {
      switch(status) {
        case AILyricTaskStatus.NONE:
          return "非法状态";
        case AILyricTaskStatus.PENDING:
          return "待执行";
        case AILyricTaskStatus.TRASCRIPTING:
          return "翻译中";
        case AILyricTaskStatus.SUCCESS:
          return "成功";
        case AILyricTaskStatus.ERROR:
          return "失败";
      }
    },

    async deleteTask(taskId) {
      this.$q.dialog({
        title: "删除翻译任务",
        message: "确认要删除翻译任务吗，字幕文件也会被一并删除，且无法恢复。",
        ok: "删除",
        cancel: "取消",
        persistent: false
      }).onOk(async () => {
        await ServerApi.deleteTask(taskId);
        this.resetLoadedData();
      });
    },

    async redoTask(taskId) {
      await ServerApi.redoTask(taskId);
      this.resetLoadedData();
    },

    openWorkDetail(work_id) {
      this.$router.push(`/work/${work_id}`)
    },

    samCoverUrl (work_id) {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      return `/api/cover/${work_id}?type=sam&token=${token}`;
    },

    copyToClipboard(content, hint) {
      copyToClipboard(`${content}`).then(() => {
        this.$q.notify({message: `已复制${hint}到剪切板`, timeout: 200});
      })
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
<template>
  <div class="q-ma-md " style="">
    <q-breadcrumbs gutter="xs" v-if="path.length">
      <q-breadcrumbs-el   >
        <q-btn no-caps flat dense size="md" icon="folder" @click="path = []">ROOT</q-btn>
      </q-breadcrumbs-el>
      
      <q-breadcrumbs-el v-for="(folderName, index) in path"  :key="index"  class="cursor-pointer" >
        <q-btn no-caps flat dense size="md" icon="folder" @click="onClickBreadcrumb(index)">{{folderName}}</q-btn>
      </q-breadcrumbs-el>
    </q-breadcrumbs>

    <q-dialog v-model="preview_img" full-width>
      <q-card v-if="preview_img_list.length">
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-h6">{{preview_img_name}}</div>
              <div class="text-subtitle2">{{ preview_img_idx+1 }}/{{ preview_img_list.length }}</div>
            </div>
            <div v-if="playWorkId > 0" class="col-auto">
              <q-btn outline @click="setVisualPlayerCover(preview_img_list[preview_img_idx])">用作可视化封面</q-btn>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-img style="height: calc(100vh - 200pt);" :src="preview_img_url" contain />
        </q-card-section>

        <q-card-actions align="around">
          <q-btn flat label="上一个" color="primary" @click="changePreviewImg(false)" />
          <q-btn flat label="关闭" color="negative" v-close-popup />
          <q-btn flat label="下一个" color="primary" @click="changePreviewImg(true)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-card>
      <q-list separator>
        <q-item
          clickable
          v-ripple
          v-for="item in fatherFolder"
          :key="item.hash"
          :active="item.type === 'audio' && currentPlayingFile.hash === item.hash"
          active-class="text-white bg-teal"
          @click="onClickItem(item)"
          class="non-selectable"
        >
          <q-item-section avatar style="position: relative;">
            <q-icon size="34px" v-if="item.type === 'folder'" color="amber" name="folder" />
            <q-icon size="34px" v-else-if="item.type === 'text'" color="info" name="description" />
            <q-icon size="34px" v-else-if="item.type === 'image'" color="orange" name="photo" />
            <!-- <q-img width="34px" height="34px" v-else-if="item.type === 'image'" :src="imgSrc(item)" contain :ratio="1/1"  name="thumbnail" /> -->
            <q-icon size="34px" v-else-if="item.type === 'other'" color="info" name="description" />
            <q-btn v-else round dense color="primary" :icon="playIcon(item.hash)" @click="onClickPlayButton(item.hash)" />

          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
            <q-item-label v-if="item.children" caption lines="1">{{ `${item.children.length} 项目` }}</q-item-label>

            <!--音频文件时长-->
            <q-item-label
              v-if="item.type === 'audio' && typeof(item.duration) === 'number'"
              caption
              lines="1"
            >
              <q-icon size="0.8rem" name="schedule" class="q-mr-xs"></q-icon>
              {{ formatSeconds(item.duration) }}
            </q-item-label>
          </q-item-section>

          <q-item-section v-if="item.status > AILyricTaskStatus.NONE" avatar>
            <AIStatus :status="item.status"/>
          </q-item-section>

          <!-- 上下文菜单 -->
          <q-menu
            v-if="item.type === 'audio' || item.type === 'text' || item.type === 'image' || item.type === 'other'"
            touch-position
            context-menu
            auto-close
            transition-show="jump-down"
            transition-hide="jump-up"
          >
            <q-list separator>
              <q-item clickable @click="addToQueue(item)" v-if="item.type === 'audio'">
                <q-item-section>添加到播放列表</q-item-section>
              </q-item>

              <q-item clickable @click="playNext(item)" v-if="item.type === 'audio'">
                <q-item-section>下一曲播放</q-item-section>
              </q-item>

              <q-item clickable @click="download(item)">
                <q-item-section>下载文件</q-item-section>
              </q-item>

              <q-item clickable @click="aiTranslateToServer(item)" v-if="item.type === 'audio'">
                <q-item-section>进行AI翻译</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script>
import AIStatus from './AIStatus.vue';
import { mapState, mapGetters } from 'vuex'
import { audioLyricNameMatch, basenameWithoutExt, ServerApi, AILyricTaskStatus } from 'src/utils'
import { debounce } from 'quasar';
import { formatSeconds } from '../utils'
import NotifyMixin from '../mixins/Notification.js'

export default {
  name: 'WorkTree',
  mixins: [NotifyMixin],

  components: {
    AIStatus,
  },

  data() {
    return {
      path: [],
      internalTree: [],
      preview_img: false,
      preview_img_idx: 0,
      preview_img_list: [],
      preview_img_hash: "",
      AILyricTaskStatus,

      sumAITaskStatus: AILyricTaskStatus.NONE,
      
      checkAITaskStatusIntervalId: 0, // 周期性检查ai翻译进度的inteval id
      checkAITaskIntervalSeconds: 10, // 检查间隔
    }
  },

  props: {
    tree: {
      type: Array,
      required: true,
    },
    metadata: {
      type: Object,
      required: true,
    }
  },

  watch: {
    tree (value) {
      this.internalTree = value;
      this.initPath();
      this.updateTreeAITaskStatus();
    },

    sumAITaskStatus(currentStatus) {
      switch(currentStatus) {
        case AILyricTaskStatus.SUCCESS:
        case AILyricTaskStatus.ERROR:
        case AILyricTaskStatus.NONE:
          // 本作品的翻译任务均处于静止状态，无需周期性检查
          this.disableIntervalCheckAITasks();
          break;

        case AILyricTaskStatus.PENDING:
        case AILyricTaskStatus.TRASCRIPTING:
          // 本作品的翻译任务处于运行状态或者排队状态，需要周期性检查
          this.enableIntervalCheckAITasks();
          break;
      }
    }
  },

  computed: {
    fatherFolder () {
      let fatherFolder = this.internalTree.concat()
      this.path.forEach(folderName => {
        fatherFolder = fatherFolder.find(item => item.type === 'folder' && item.title === folderName).children
      })

      return fatherFolder
    },

    queue () {
      const queue = []
      this.fatherFolder.forEach(item => {
        if (item.type === 'audio') {
          queue.push(item)
        }
      })

      return queue
    },

    preview_img_url () {
      const item = this.preview_img_list[this.preview_img_idx];
      return item ? this.originalImgSrc(item) : "";
    },

    preview_img_name () {
      const item = this.preview_img_list[this.preview_img_idx];
      return item ? item.title : "";
    },

    ...mapState('AudioPlayer', [
      'playing',
      'playWorkId',
    ]),

    ...mapGetters('AudioPlayer', [
      'currentPlayingFile'
    ])
  },

  methods: {
    formatSeconds,

    playIcon (hash) {
      return this.playing && this.currentPlayingFile.hash === hash ? "pause" : "play_arrow"            
    },

    initPath () {
      const initialPath = []
      let fatherFolder = this.internalTree.concat()
      while (fatherFolder.length === 1) {
        if (fatherFolder[0].type === 'audio') {
          break
        }
        initialPath.push(fatherFolder[0].title)
        fatherFolder = fatherFolder[0].children
      }
      this.path = initialPath
    },
    
    onClickBreadcrumb (index) {
      this.path = this.path.slice(0, index+1)
    },

    onClickItem (item) {
      if (item.type === 'folder') {
        this.path.push(item.title);
      } else if (item.type === 'image') {
        this.openPreviewImg(item);
      } else if (item.type === 'text' || item.type === 'image') {
        this.openFile(item);
      } else if (item.type === 'other') {
        this.download(item);
      } else if (this.currentPlayingFile.hash !== item.hash) {
        this.$store.commit('AudioPlayer/SET_QUEUE', {
          workId: this.metadata.id,
          queue: this.queue.concat(),
          index: this.queue.findIndex(file => file.hash === item.hash),
          resetPlaying: true
        })
      }
    },

    onClickPlayButton (hash) {
      if (this.currentPlayingFile.hash === hash) {
        this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
      } else {
        this.$store.commit('AudioPlayer/SET_QUEUE', {
          workId: this.metadata.id,
          queue: this.queue.concat(),
          index: this.queue.findIndex(file => file.hash === hash),
          resetPlaying: true
        })
      }
    },

    addToQueue (file) {
      this.$store.commit('AudioPlayer/ADD_TO_QUEUE', file)
    },

    playNext (file) {
      this.$store.commit('AudioPlayer/PLAY_NEXT', file)
    },

    download (file) {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      // Fallback to old API for an old backend 
      const url = file.mediaDownloadUrl ? `${file.mediaDownloadUrl}?token=${token}` : `/api/media/download/${file.hash}?token=${token}`;
      const link = document.createElement('a');
      link.href = url;
      link.target="_blank";
      link.click();
    },

    // 翻译当前所在目录的所有音频文件，注意不是当前作品的所有音频文件
    async translateCwd() {
      // console.log('cwd = ', this.fatherFolder);
      for (const item of this.fatherFolder) {
        if (item.type === 'audio') {
          await this.aiTranslateToServer(item);
        }
      }
    },

    async aiTranslateToServer(file) {
      try {
        await ServerApi.translateAudio(file.hash);
        await this.enableIntervalCheckAITasks();
      } catch(error) {
        if (error.response) {
          // 请求已发出，但服务器响应的状态码不在 2xx 范围内
          if (error.response.status !== 401) {
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`);
          }
        } else {
          this.showErrNotif(error.message || error);
        }
      }
    },

    setVisualPlayerCover (imgFile) {
      if (!imgFile) return;
      const urlWithoutToken = imgFile.mediaDownloadUrl ? `${imgFile.mediaDownloadUrl}` : `/api/media/download/${imgFile.hash}`;
      this.$store.commit('AudioPlayer/SET_VISUAL_PLAYER_COVER_URL', urlWithoutToken);
      this.$q.notify({
        message: "封面设置成功",
        actions: [
          { label: "前往大屏页面",
            handler: () => {
              // this.$router.push(`/fullScreenPlayer/${this.playWorkId}`)
              this.$router.push(`/fullScreenPlayer`)
            }
          }
        ],
      });
    },

    openFile (file) {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      // Fallback to old API for an old backend 
      const url = file.mediaStreamUrl ? `${file.mediaStreamUrl}?token=${token}` : `/api/media/stream/${file.hash}?token=${token}`;
      const link = document.createElement('a');
      link.href = url;
      link.target="_blank";
      link.click();
    },

    imgSrc (imgItem) {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      const url = `/api/media/small-img/${imgItem.hash}?token=${token}`;
      console.log('imgSrc called for ', imgItem.title);
      return url;
    },

    originalImgSrc (file) {
      const token = this.$q.localStorage.getItem('jwt-token') || '';
      // Fallback to old API for an old backend 
      const url = file.mediaStreamUrl ? `${file.mediaStreamUrl}?token=${token}` : `/api/media/stream/${file.hash}?token=${token}`;
      return url
    },

    openPreviewImg(item) {
      const preview_img_list = this.fatherFolder.filter(item => item.type === 'image')
      let preview_img_idx = -1;
      preview_img_list.forEach((i, idx) => {
        if (i.hash === item.hash) {
          preview_img_idx = idx;
        }
      });
      this.preview_img = true;
      this.preview_img_list = preview_img_list;
      this.preview_img_idx = preview_img_idx;
    },

    changePreviewImg(next) {
      if (this.preview_img_list.length <= 1) return;
      const length = this.preview_img_list.length;
      this.preview_img_idx = (length +this.preview_img_idx + (next ? 1 : -1) ) % length;
    },

    async updateTreeAITaskStatus() {
      console.log("检查翻译进度")

      const tasks = await ServerApi.searchWorkTask(this.metadata.id);

      // console.log("tasks = ", tasks)
      const [tree, status] = this.updateAiTranslateStatusToTracks(tasks, this.internalTree);
      this.internalTree = tree;
      this.sumAITaskStatus = status;
    },

    // return updated tree
    // 
    updateAiTranslateStatusToTracks(tasks, tree) {
      // tree:
      // [
      //   {
      //     type: "folder",
      //     children: [
      //       {type: "audio", title: "audio1.mp3"},
      //       {type: "audio", title: "audio2.mp3"},
      //       {type: "audio", title: "audio3.mp3"},
      //     ]
      //   },
      //   {
      //     type: "folder",
      //     children: [
      //       { "type": "image", "title": "image1.jpg" },
      //     ]
      //   },
      //   {type: "audio", title: "audio4.mp3"},
      // ]
      

      function mergeStatus(statusList, isSuccessMoreImportant) {
        if (statusList.length == 0) return AILyricTaskStatus.NONE;
        const includeTranscripting = statusList.includes(AILyricTaskStatus.TRASCRIPTING);
        const includeSuccess = statusList.includes(AILyricTaskStatus.SUCCESS);
        const includeError = statusList.includes(AILyricTaskStatus.ERROR);
        const includePending = statusList.includes(AILyricTaskStatus.PENDING);

        if (includeTranscripting) return AILyricTaskStatus.TRASCRIPTING;
        else if (includePending) return AILyricTaskStatus.PENDING;
        else if (isSuccessMoreImportant) {
          // 对于单个音频文件的多个翻译任务，我们更在意是否有成功的任务
          if (includeSuccess) return AILyricTaskStatus.SUCCESS;
          else if (includeError) return AILyricTaskStatus.ERROR;
        } else {
          // 对于文件夹内多个音频的翻译状态，我们更在意是否有错误
          if (includeError) return AILyricTaskStatus.ERROR;
          else if (includeSuccess) return AILyricTaskStatus.SUCCESS;
        }

        // 兜底
        return AILyricTaskStatus.NONE;
      }

      const sumStatus = [];
      const treeUpdated = tree.map((node, index) => {
        const nodeTitle = basenameWithoutExt(node.title);
        switch(node.type) {
          case "folder": {
            const newNode = Object.assign({}, node);
            const [newChilldren, status] = this.updateAiTranslateStatusToTracks(tasks, node.children);
            sumStatus.push(status);
            newNode.status = status;
            newNode.children = newChilldren;
            return newNode;
          }

          case "audio": {
            const matchedTasks = tasks.filter((t) => audioLyricNameMatch(nodeTitle, t.fileName))
            const status = mergeStatus(matchedTasks.map(t => t.status), true);

            // hack status for debug
            // const status = index + 1;

            const newNode = Object.assign({}, node);
            newNode.tasks = matchedTasks;
            newNode.status = status;
            sumStatus.push(status);
            return newNode;
          }
          
          default:
            return Object.assign({ status: AILyricTaskStatus.NONE, tasks: [] }, node);
        }
      })

      return [treeUpdated, mergeStatus(sumStatus, false)];
    },

    async checkAITaskStatus() {
      const tasks = await ServerApi.searchWorkTask(this.workid);
      const [tree, status] = this.updateAiTranslateStatusToTracks(tasks, this.internalTree);
      this.internalTree = tree;
      this.sumAITaskStatus = status;
    },

    async enableIntervalCheckAITasks() {
      if (this.checkAITaskStatusIntervalId > 0) clearInterval(this.checkAITaskStatusIntervalId)
      console.log("定期检查ai歌词翻译进度")
      
      await this.updateTreeAITaskStatus();
      this.checkAITaskStatusIntervalId = setInterval(
        () => this.updateTreeAITaskStatus(), 
        this.checkAITaskIntervalSeconds * 1000,
      )
    },

    disableIntervalCheckAITasks() {
      console.log("取消定期检查ai歌词翻译进度")
      clearInterval(this.checkAITaskStatusIntervalId)
      this.checkAITaskStatusIntervalId = 0;
    },
  },

  created() {
    this.updateTreeAITaskStatus = debounce(this.updateTreeAITaskStatus, 500); // ai进度检查防抖动2秒
  },
  
  mounted() {
    this.internalTree = this.tree;
    this.updateTreeAITaskStatus();
  },

  beforeDestroy() {
    this.disableIntervalCheckAITasks();
  }
}
</script>

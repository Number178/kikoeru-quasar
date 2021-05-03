<template>
  <div>
    <div class="row q-ma-sm">
      <div class="col-xs-6 col-sm-4 row q-pa-sm">
        <q-btn
          class="col"
          color="teal"
          label="扫描本地音声库"
          :disable="state === 'running' || !(loggedIn || $socket.connected)"
          @click="performScan()"
        />
      </div>

      <div class="col-xs-6 col-sm-4 row q-pa-sm">
        <q-btn
          class="col"
          color="primary"
          label="刷新音声库信息"
          :disable="state === 'running' || !(loggedIn || $socket.connected)"
          @click="performUpdate()"
        />
      </div>

      <div class="col-xs-12 col-sm-4 row q-pa-sm">
        <q-btn
          class="col"
          color="negative"
          label="终止扫描进程"
          :disable="state !== 'running' || !(loggedIn || $socket.connected)"
          @click="killScanProceess()"
        />
      </div>
    </div>

    <q-card v-show="state" class="q-ma-md">
      <q-expansion-item expand-separator>
        <template v-slot:header>
          <q-item-section avatar>
            <q-spinner-gears v-if="state === 'running'" color="primary" size="2em" />
            <q-icon v-else-if="state === 'finished'" name="done" color="positive" size="2em" />
            <q-icon v-else-if="state === 'error'" name="bug_report" color="red" size="2em" />
          </q-item-section>

          <q-item-section>
            <q-item-label v-if="allLogs.length > 1" class="ellipsis">{{allLogs[allLogs.length - 2].message}}</q-item-label>
            <q-item-label v-if="allLogs.length > 0" class="ellipsis">{{allLogs[allLogs.length - 1].message}}</q-item-label>
          </q-item-section>
        </template>
        
        <q-scroll-area style="height: 256px;" class="bg-dark text-white q-pa-md">
          <div v-for="(log, index) in allLogs" :key="index" >
            <span :class="log.level === 'error' ? 'text-red' : ''">➜ {{log.message}}</span>
          </div>
        </q-scroll-area>
      </q-expansion-item>
    </q-card>

    <q-card v-show="(tasks.length > 0) || (failedTasks.length > 0)" class="q-ma-md">
      <q-tabs
        v-model="tab"
        dense
        inline-label
        class="text-grey"
        active-color="white"
        active-bg-color="brown"
        indicator-color="yellow"
        align="justify"
        narrow-indicator
      >
        <q-tab name="tasks" icon="hourglass_full" label="处理中">
          <q-badge v-show="tasks.length > 0" color="primary" floating>{{tasks.length}}</q-badge>
        </q-tab>
        <q-tab name="failedTasks" icon="error_outline" label="处理失败">
          <q-badge v-show="failedTasks.length > 0" color="red" floating>{{failedTasks.length}}</q-badge>
        </q-tab>
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="tasks" class="q-pa-none">
          <q-virtual-scroll
            separator
            style="max-height: 313px;"
            :items="tasks"
            :virtual-scroll-item-size="52"
          >
            <template v-slot="{ item, index }">
              <q-expansion-item expand-separator :key="index">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-spinner-hourglass color="primary" size="2em" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label v-if="item.logs.length > 0" class="ellipsis">{{item.logs[item.logs.length - 1].message}}</q-item-label>
                    <q-item-label caption>{{`RJ${item.rjcode}`}}</q-item-label>
                  </q-item-section>
                </template>
                
                <q-card>
                  <q-card-section class="bg-dark text-white">
                    <div v-for="(log, index) in item.logs" :key="index">
                      <span :class="log.level === 'error' ? 'text-red' : ''">➜ {{log.message}}</span>
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </template>
          </q-virtual-scroll>
        </q-tab-panel>

        <q-tab-panel name="failedTasks" class="q-pa-none">
          <q-virtual-scroll
            separator
            style="max-height: 313px;"
            :items="failedTasks"
            :virtual-scroll-item-size="52"
          >
            <template v-slot="{ item, index }">
              <q-expansion-item
                expand-separator
                :key="index"
                expand-icon-class="text-white"
                header-class="bg-negative"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="bug_report" color="white" size="2em" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-white ellipsis" >
                      {{item.logs[item.logs.length - 1].message}}
                    </q-item-label>

                    <q-item-label caption class="text-white">
                      {{`RJ${item.rjcode}`}}
                    </q-item-label>
                  </q-item-section>
                </template>
                
                <q-card>
                  <q-card-section class="bg-dark text-white">
                    <div v-for="(log, index) in item.logs" :key="index">
                      <span :class="log.level === 'error' ? 'text-red' : ''">➜ {{log.message}}</span>
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
              
            </template>
          </q-virtual-scroll>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>
import NotifyMixin from '../../mixins/Notification.js'

export default {
  name: 'Scanner',

  mixins: [NotifyMixin],

  data () {
    return {
      tab: 'tasks',
      state: null, // ['running', 'finished', 'error']
      loggedIn: false,
      tasks: [], // 正在处理中的并行任务
      failedTasks: [], // 处理失败的任务
      mainLogs: [],
      results: []
    }
  },

  sockets: {
    SCAN_TASKS (payload) {
      this.tasks = payload.tasks
    },
    SCAN_FAILED_TASKS (payload) {
      this.failedTasks = payload.failedTasks
    },
    SCAN_MAIN_LOGS (payload) {
      this.mainLogs = payload.mainLogs
    },
    SCAN_RESULTS (payload) {
      this.results = payload.results
    },
    SCAN_INIT_STATE (payload) {
      this.state = 'running'
      this.tasks = payload.tasks
      this.failedTasks = payload.failedTasks
      this.mainLogs = payload.mainLogs
      this.results = payload.results
    },

    SCAN_FINISHED (payload) {
      this.state = 'finished'
      this.allLogs.push({
        level: 'info',
        message: payload.message
      })
    },
    SCAN_ERROR () {
      this.state = 'error'
    },

    success () {
      this.loggedIn = true
    }
  },

  methods: {
    performScan () {
      this.tasks = []
      this.failedTasks = []
      this.mainLogs = []
      this.results = []
      this.state = 'running'
      this.$socket.emit('PERFORM_SCAN')
    },

    performUpdate () {
      this.tasks = []
      this.failedTasks = []
      this.mainLogs = []
      this.results = []
      this.state = 'running'
      this.$socket.emit('PERFORM_UPDATE')
    },

    killScanProceess () {
      this.$socket.emit('KILL_SCAN_PROCESS')
    },
  },

  computed: {
    allLogs () {
      const resultLogs = this.results.map(res => {
        if (res.result === 'added') {
          return { level: 'info', message: `[RJ${res.rjcode}] 添加成功! Added: ${res.count}` }
        } else if (res.result === 'updated') {
          return { level: 'info', message: `[RJ${res.rjcode}] 更新成功! Updated: ${res.count}` }
        } else {
          return { level: 'error', message: `[RJ${res.rjcode}] 处理失败! Failed: ${res.count}` }
        }
      })
      return this.mainLogs.concat(resultLogs)
    }
  },

  mounted () {
    this.$socket.emit('ON_SCANNER_PAGE')
    this.$socket.on('connect_error', () => {
      this.showErrNotif('连接Socket失败')
    });
  },
}
</script>
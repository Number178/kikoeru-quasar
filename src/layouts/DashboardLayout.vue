<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated class="bg-black">
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
        <q-toolbar-title>仪表盘</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above

      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay

      :width="200"
      :breakpoint="500"
      bordered
      content-class="bg-grey-3"
    >
      <div class="column justify-between fit">
        <q-list padding class="col-auto">
          <q-item clickable v-ripple to="/admin">
            <q-item-section avatar>
              <q-icon name="folder" />
            </q-item-section>

            <q-item-section>
              音声库
            </q-item-section>
          </q-item>

          <q-item active clickable v-ripple to="/admin/advanced">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>

            <q-item-section>
              高级设置
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/admin/scanner">
            <q-item-section avatar>
              <q-icon name="youtube_searched_for" />
            </q-item-section>

            <q-item-section>
              Scaner
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="drafts" />
            </q-item-section>

            <q-item-section>
              Drafts
            </q-item-section>
          </q-item>
        </q-list>

        <q-list padding class="col-auto">
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="inbox" />
            </q-item-section>

            <q-item-section>
              Inbox
            </q-item-section>
          </q-item>

          <q-item active clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>

            <q-item-section>
              高级设置
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
// import io from 'socket.io-client';
export default {
  name: 'DashboardLayout',

  components: {
    
  },

  data () {
    return {
      drawer: false,
      miniState: true,
      socket: null
    }
  },

  created () {
    
  },

  sockets: {// 通过vue实例对象sockets实现组件中的事件监听
    connect: function () {// socket的connect事件
      console.log('socket connected from Page')
    },
    STREAM_STATUS(data) {// 后端按主题名推送的消息数据
        console.log('Page：' + data)
    },
    success: function (data) {
      this.showSuccNotif('成功登录管理后台')
    },
    error (err) {
      this.showWarnNotif(err)
    }
  },

  methods: {
    showSuccNotif (message) {
      this.$q.notify({
        message,
        color: 'positive',
        icon: 'done',
        timeout: 500
      })
    },

    showWarnNotif (message) {
      this.$q.notify({
        message,
        color: 'warning',
        icon: 'warning',
      })
    }
  },

  mounted() {
    console.log('page mounted')
    // this.$socket.emit('message', '233333333333333')
  },

  created () {
    if (!this.$socket.connected) {
      this.$socket.open()
    }
  }
}
</script>

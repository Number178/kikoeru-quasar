<template>
  <q-layout view="hhh LpR fFf">
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
          <q-item 
            clickable
            v-ripple
            exact
            :to="link.path"
            active-class="text-primary text-weight-bold"
            v-for="(link, index) in links"
            :key="index"
            class="col text-subtitle1"
          >
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>

            <q-item-section>
              {{link.title}}
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
export default {
  name: 'DashboardLayout',

  data () {
    return {
      drawer: false,
      miniState: true,
      links: [
        {
          title: '音声库',
          icon: 'folder',
          path: '/admin'
        },
        {
          title: '扫描',
          icon: 'youtube_searched_for',
          path: '/admin/scanner'
        },
        {
          title: '用户管理',
          icon: 'person',
          path: '/admin/usermanage'
        },
        {
          title: '高级设置',
          icon: 'settings',
          path: '/admin/advanced'
        },
        
        {
          title: '回到主页',
          icon: 'home',
          path: '/'
        }
      ]
    }
  },

  sockets: {
    success (payload) {
      this.showSuccNotif(payload.message)
    },
    error (err) {
      this.showWarnNotif(err.message || err)
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

  created () {
    // 从 LocalStorage 中读取 token
    const token = this.$q.localStorage.getItem('jwt-token') || ''
    this.$socket.io.opts.query.auth_token = token
    
    if (!this.$socket.connected) {
      this.$socket.open()
    }
  }
}
</script>

<style lang="scss" scoped>
  a {
    text-decoration:none;
  }
</style>
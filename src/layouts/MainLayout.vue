<template>
  <q-layout view="hHh Lpr lFf" class="bg-grey-3">
    <q-header class="shadow-4">
      <q-toolbar>
        <q-btn flat dense round @click="drawerOpen = !drawerOpen" icon="menu" aria-label="Menu" />

        <q-btn flat size="md" icon="arrow_back_ios"@click="backToMain()" v-if="isNotInMain()"/>

        <q-toolbar-title class="gt-xs">
          <router-link :to="'/'" class="text-white">
            Kikoeru
          </router-link>
        </q-toolbar-title>
        
        <q-input dark dense rounded standout v-model="keyword" debounce="500" input-class="text-right" class="q-mr-sm">
          <template v-slot:append>
            <q-icon v-if="keyword === ''" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="keyword = ''" />
          </template>
        </q-input>

      </q-toolbar>
      
      <AudioPlayer />
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay

      :width="230"
      :breakpoint="500"
      bordered
      content-class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <q-list>
          <q-item 
            clickable
            v-ripple
            exact
            :to="link.path"
            active-class="text-deep-purple text-weight-medium"
            v-for="(link, index) in links"
            :key="index"
            @click="miniState = true"
          >
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-subtitle1">
                {{link.title}}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item 
            clickable
            v-ripple
            exact
            active-class="text-deep-purple text-weight-medium"
            @click="confirm = true"
          >
            <q-item-section avatar>
              <q-icon name="exit_to_app" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-subtitle1">
                登出
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="power_settings_new" color="primary" text-color="white" />
          <span class="q-ml-sm">是否退出登录？（若未开启用户验证，则操作无效）</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="退出" color="primary" @click="logout()" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <!-- <q-page padding> -->
        <router-view class="page-content" />
      <!-- </q-page> -->
        <q-page-scroller position="bottom-right" :scroll-offset="150" :offset="[18, 18]">
          <q-btn fab icon="keyboard_arrow_up" color="accent" />
        </q-page-scroller>
    </q-page-container>

    <q-footer class="q-pa-none">
      <LyricsBar />
      <PlayerBar />
    </q-footer>
  </q-layout>
</template>

<script>
import PlayerBar from 'components/PlayerBar'
import AudioPlayer from 'components/AudioPlayer'
import LyricsBar from 'components/LyricsBar'

export default {
  name: 'MainLayout',

  components: {
    PlayerBar,
    AudioPlayer,
    LyricsBar,
  },

  data () {
    return {
      keyword: '',
      drawerOpen: false,
      miniState: true,
      confirm: false,
      links: [
        {
          title: '媒体库',
          icon: 'widgets',
          path: '/'
        },
        {
          title: '社团',
          icon: 'group',
          path: '/circles'
        },
        {
          title: '标签',
          icon: 'label',
          path: '/tags'
        },
        {
          title: '声优',
          icon: 'mic',
          path: '/vas'
        },
        {
          title: '设定',
          icon: 'tune',
          path: '/admin'
        },
      ]
    }
  },

  watch: {
    keyword () {
      this.$router.push(`/search/${this.keyword}`)
    },
  },

  created () {
    this.initUser();
  },

  methods: {
    initUser () {
      this.$axios.get('/api/me')
        .then((res) => {
          this.$store.commit('User/INIT', res.data.user)
          this.$store.commit('User/SET_AUTH', res.data.auth)
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status === 401) {
              this.showWarnNotif(error.response.data.error)
              // 验证失败，跳转到登录页面
              this.$router.push('/login')
            } else {
              this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
            }
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    showWarnNotif (message) {
      this.$q.notify({
        message,
        color: 'warning',
        icon: 'warning',
      })
    },

    showErrNotif (message) {
      this.$q.notify({
        message,
        color: 'negative',
        icon: 'bug_report'
      })
    },
    
    logout () {
      this.$q.localStorage.set('jwt-token', '')
      this.$router.push('/login')
    },

    backToMain () {
      this.$router.push('/');
    },

    isNotInMain () {
      let path = this.$router.currentRoute.path
      return (path && path !=='/') ? true : false;
    },
  },
}
</script>

<style lang="scss" scoped>
  a {
   text-decoration:none;
  }
</style>

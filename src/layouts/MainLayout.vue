<template>
  <q-layout view="hhh LpR fFf">
    <q-header reveal elevated>
      <q-toolbar>
        <q-toolbar-title >
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

        <q-btn flat dense round @click="rightDrawerOpen = !rightDrawerOpen" icon="menu" aria-label="Menu"/>
      </q-toolbar>
    </q-header>

    <q-drawer overlay elevated v-model="rightDrawerOpen" side="right">
      <NavBar :links="links" />      
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered elevated class="bg-white text-black q-pa-none" >
      <PlayerBar />
    </q-footer>
    
    <AudioElement />
  </q-layout>
</template>

<script>
import NavBar from 'components/NavBar'
import PlayerBar from 'components/PlayerBar'
import AudioElement from 'components/AudioElement'

export default {
  name: 'MainLayout',

  components: {
    NavBar,
    PlayerBar,
    AudioElement
  },

  data () {
    return {
      keyword: '',
      rightDrawerOpen: false,
      links: [
        {
          title: 'Works',
          icon: 'widgets',
          path: '/'
        },
        {
          title: 'Circles',
          icon: 'group',
          path: '/circles'
        },
        {
          title: 'Tags',
          icon: 'label',
          path: '/tags'
        },
        {
          title: 'VAs',
          icon: 'mic',
          path: '/vas'
        }
      ]
    }
  },

  watch: {
    keyword () {
      this.$router.push(`/search/${this.keyword}`)
    }
  },

  beforeRouteUpdate (to, from, next) {
    this.rightDrawerOpen = false

    // 离开搜索页面时清空输入框
    if (to.path.indexOf('search') === -1) {
      this.keyword = ''
    }
    next()
  }
}
</script>

<style lang="scss" scoped>
  a {
   text-decoration:none;
  }
</style>

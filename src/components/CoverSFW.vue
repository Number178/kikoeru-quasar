<template>
  <q-img
    :src="coverUrl"
    :ratio="4/3"
    :img-class="imgClass"
    style="max-width: 560px;"
    transition="fade"
    @mouseover="toggleBlurFlag()"
    @mouseout="toggleBlurFlag()"
  >
    <div class="absolute-top-left transparent" style="padding: 0;">
      <q-chip dense square color="brown" text-color="white" class="q-ma-sm shadow-3">
        {{`RJ${rjcode}`}}
      </q-chip>
    </div>

    <div :v-if="release" class="absolute-bottom-right transparent" style="padding: 0px;">
      <q-chip dense square color="blue-grey" text-color="white" class="q-ma-sm shadow-3">
        {{release}}
      </q-chip>
    </div>

    <div :v-if="lyricList.length > 0" class="absolute-top-right transparent" style="padding: 0px;">
      <q-chip v-for="lyric in lyricList" :key="lyric" dense square color="green-7" text-color="white" class="q-ma-sm shadow-3">
        {{ {ai: "AI歌词", local: "本地歌词"}[lyric] }}
      </q-chip>
    </div>

    <!-- 标签 -->
    <div class="q-pa-none q-ma-sm absolute-bottom-left tags-panel">
      <router-link
        v-for="tag in tags"
        :key='tag.id'
        :to="`/works?tagId=${tag.id}`"
        >
        <q-chip dense square class="shadow-3">
          {{ tag.name }}
        </q-chip>
      </router-link>
    </div>
  </q-img>
</template>

<script>

import { formatID } from 'src/utils'

export default {
  name: 'CoverSFW',

  props: {
    workid: {
      type: Number,
      required: true
    },
    
    nsfw: {
      type: Boolean,
      default: true
    },

    release: {
      required: true
    },

    lyric_status: { // "", "ai", "local", "ai_local"
      type: String,
      require: true,
    },

    tags: {
      type: Array,
      require: false,
      default() {return [];}
    },
  },

  data () {
    return {
      blurFlag: true,
    }
  },

  computed: {
    coverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return this.workid ? `/api/cover/${this.workid}?token=${token}` : ""
    },

    rjcode () {
      // return (`000000${this.workid}`).slice(-6)
      return formatID(this.workid)
    },

    imgClass () {
      if (this.$q.platform.is.mobile) {
        // 在移动设备上图片直接显示
        return ""
      } else {
        if (!this.nsfw) {
          // 在PC上SFW的图片直接显示
          return ""
        } else {
          // 在PC上NSFW的图片鼠标悬停显示
          return this.blurFlag ? "blur-image" : ""
        }
      }
    },

    lyricList() {
      return this.lyric_status 
      ? this.lyric_status.split("_")
      : [];
    }
  },

  methods: {
    toggleBlurFlag () {
      this.blurFlag = !this.blurFlag
    }
  }
}
</script>

<style scoped lang="scss">
.blur-image {
  filter: blur(10px);
}

.tags-panel {
  opacity: calc(var(--hover-work-card) + var(--active-work-card) + var(--sim-hover-work-card));
  transition: opacity 0.2s;
  padding: 0;
  max-width: 70%;
  background: rgba(0,0,0,0.5);
  border-radius: 5px;
  // background: radial-gradient(closest-side at center, rgba(0, 0, 0, 0.8) 0, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0) 100%);
  // background: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0));
}

</style>
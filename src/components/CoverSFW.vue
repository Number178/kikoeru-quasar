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
    }
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
    }
  },

  methods: {
    toggleBlurFlag () {
      this.blurFlag = !this.blurFlag
    }
  }
}
</script>

<style lang="scss">
  .blur-image {
    filter: blur(10px);
  }


</style>
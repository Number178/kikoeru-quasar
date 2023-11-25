<template>
  <q-circular-progress
    show-value
    size="lg"
    :indeterminate="isIndeterminate"
    :thickness="0.2"
    :color="color"
    track-color="grey-8"
    :value="value"
  >
    {{ showMsg }}
  </q-circular-progress>
</template>

<script>
import { AILyricTaskStatus } from "../utils"

export default {
  name: 'AIStatus',

  props: {
    status: {
      type: Number,
      required: true
    },
  },

  computed: {
    color() {
      if (this.status == AILyricTaskStatus.ERROR) return "red-8";
      else return "lime"
    },
    isIndeterminate() {
      return this.status == AILyricTaskStatus.TRASCRIPTING;
    },
    // return a value from 0 to 100
    value() {
      switch(this.status) {
        case AILyricTaskStatus.PENDING: return 10;
        case AILyricTaskStatus.TRASCRIPTING: return 50;
        case AILyricTaskStatus.SUCCESS: return 100;
        case AILyricTaskStatus.ERROR: return 100;
        default: return 0;
      }
    },

    showMsg() {
      switch(this.status) {
        case AILyricTaskStatus.PENDING: return "排队";
        case AILyricTaskStatus.TRASCRIPTING: return "翻译";
        case AILyricTaskStatus.SUCCESS: return "AI";
        case AILyricTaskStatus.ERROR: return "错误";
        default: return "无效状态";
      }
    }

  },

  data() {
    return {
      AILyricTaskStatus,
    }
  },
}
</script>

<style lang="sass" scoped>

</style>
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
import { AIServerApi } from "../utils"
const TaskStatus = AIServerApi.TaskStatus;

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
      if (this.status == TaskStatus.ERROR) return "red-8";
      else return "lime"
    },
    isIndeterminate() {
      return this.status == TaskStatus.DOWNLOADING || this.status == TaskStatus.TRASCRIPTING;
    },
    // return a value from 0 to 100
    value() {
      switch(this.status) {
        case TaskStatus.PENDING: return 10;
        case TaskStatus.DOWNLOADING: return 20;
        case TaskStatus.DOWNLOADED: return 40;
        case TaskStatus.TRASCRIPTING: return 50;
        case TaskStatus.SUCCESS: return 100;
        case TaskStatus.ERROR: return 100;
        default: return 0;
      }
    },

    showMsg() {
      switch(this.status) {
        case TaskStatus.PENDING: return "准备";
        case TaskStatus.DOWNLOADING: return "传输";
        case TaskStatus.DOWNLOADED: return "排队";
        case TaskStatus.TRASCRIPTING: return "翻译";
        case TaskStatus.SUCCESS: return "AI";
        case TaskStatus.ERROR: return "错误";
        default: return "无效状态";
      }
    }

  },

  data() {
    return {
      TaskStatus,
    }
  },
}
</script>

<style lang="sass" scoped>

</style>
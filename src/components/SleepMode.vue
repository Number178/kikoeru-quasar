<template>
    <q-dialog v-bind:value="value" v-on:input="$emit('input')" persistent>
      <q-card>
        <div class="q-pa-sm">
          <q-time
            v-model="time"
            now-btn
            :dark="isDarkModeOn"
          />
        </div>

        <div class="row justify-between">
          <q-card-actions>
            <q-btn flat label="取消定时" color="primary" @click="clearSleepTimer" :disable="!sleepMode" v-close-popup />
          </q-card-actions>

          <q-card-actions align="right">
            <q-btn flat label="取消" color="primary" v-close-popup />
            <q-btn flat label="确定" color="primary" @click="setSleepTimer" v-close-popup />
          </q-card-actions>
        </div>

      </q-card>
    </q-dialog>
</template> 

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  name: 'SleepMode',

  // v-model: showTimer from MainLayout
  props: ['value'],

  data() {
    return {
      // for q-time component only
      time: '00:00'
    }
  },

  computed: {
    ...mapState('AudioPlayer', [
      'sleepTime',
      'sleepMode'
    ]),

    isDarkModeOn() {
      return this.$q.dark.isActive;
    }
  },

  mounted() {
    try {
      if (this.$q.sessionStorage.getItem('sleepMode')) {
        this.SET_SLEEP_TIMER(this.$q.sessionStorage.getItem('sleepTime'));
      }
    } catch {
      console.log('Web Storage API error');
    }
  },

  watch: {
    // v-model: showTimer from MainLayout
    value(visible) {
      if (visible) {
        if (!this.sleepMode) {
          const currentTime = new Date();
          this.time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0');          
        } else {
          this.time = this.sleepTime;
        }
      }
    }
  },

  methods: {
    ...mapMutations('AudioPlayer', [
      'SET_SLEEP_TIMER',
      'CLEAR_SLEEP_MODE'
    ]),

    setSleepTimer() {
      this.SET_SLEEP_TIMER(this.time);
      // Persist sleep timer
      try {
        this.$q.sessionStorage.set('sleepTime', this.time);
        this.$q.sessionStorage.set('sleepMode', true);
      } catch {
        console.log('Web Storage API error');
      }
      this.showSuccNotif(`将于${this.time}停止播放`);
    },

    clearSleepTimer() {
      this.CLEAR_SLEEP_MODE();
      try {
        this.$q.sessionStorage.set('sleepTime', null);
        this.$q.sessionStorage.set('sleepMode', false);
      } catch {
        console.log('Web Storage API error');
      }
      this.showSuccNotif('已关闭睡眠模式');
    },

    showSuccNotif (message) {
      this.$q.notify({
        message,
        color: 'primary',
        icon: 'bedtime',
        timeout: 5000
      })
    },
  }
}
</script>
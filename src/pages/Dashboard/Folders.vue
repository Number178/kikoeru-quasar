<template>
  <div>
    <q-card class="q-ma-md">
      <q-form @submit="onSubmitRootFolder">
        <q-toolbar>
          <q-toolbar-title>添加新文件夹</q-toolbar-title>
        </q-toolbar>

        <div class="q-pa-sm">
          <q-input
            outlined
            dense
            v-model="rootFolder.name"
            required
            lazy-rules
            :rules="[val => !config.rootFolders.find(rootFolder => rootFolder.name === val) || '该别名已存在，文件夹别名不能重复']"
            label="文件夹别名"
          />

          <q-input
            outlined
            dense
            v-model="rootFolder.path"
            required
            lazy-rules
            :rules="[val => !config.rootFolders.find(rootFolder => rootFolder.path === val) || '该路径已存在，文件夹路径不能重复']"
            label="绝对路径"
          />

          <div class="row justify-end">
            <q-btn type="submit" color="primary" label="添加" />
          </div>
        </div>
      </q-form>
    </q-card>

    <q-form @submit="onSubmit">
      <q-card class="q-ma-md" v-show="config.rootFolders.length">
        <q-toolbar>
          <q-toolbar-title>文件夹列表</q-toolbar-title>
        </q-toolbar>

        <q-list>
          <q-item v-for="(rootFolder, index) in config.rootFolders" :key="index">
            <q-item-section avatar>
              <q-icon color="amber" name="folder" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{rootFolder.name}}</q-item-label>
              <q-item-label caption>{{rootFolder.path}}</q-item-label>
            </q-item-section>

            <q-item-section avatar>
              <q-btn flat round color="red" icon="delete" @click="removeFromRootFolders(index)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card class="q-ma-md">
        <q-toolbar>
          <q-toolbar-title>封面文件夹路径</q-toolbar-title>
        </q-toolbar>

        <q-input outlined dense required v-model="config.coverFolderDir" class="q-pa-sm" />
      </q-card>

      <div class="q-ma-lg row justify-end">
        <q-btn :loading="loading" label="保存" type="submit" color="primary" />
      </div>
    </q-form>
  </div>
</template>

<script>
export default {
  name: 'Folders',

  data () {
    return {
      config: {
        rootFolders: []
      },
      rootFolder: {
        name: '',
        path: ''
      },
      loading: false
    }
  },

  methods: {
    requestConfig () {
      this.$axios.get('/api/config')
        .then((response) => {
          this.config = response.data.config
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status === 401) {
              this.showWarnNotif(error.response.data.error)
            } else {
              this.showErrNotif(`${error.response.status} ${error.response.statusText}`)
            }
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    onSubmit () {
      this.loading = true
      this.$axios.put('/api/config', {
        config: this.config
      })
        .then((response) => {
          this.showSuccNotif(response.data.message)
          this.loading = false
        })
    },

    onSubmitRootFolder () {
      this.config.rootFolders.push({
        name: this.rootFolder.name,
        path: this.rootFolder.path
      })
      this.rootFolder.name = ''
      this.rootFolder.path = ''
    },

    removeFromRootFolders (index) {
      this.config.rootFolders.splice(index, 1)
    },

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
    },

    showErrNotif (message) {
      this.$q.notify({
        message,
        color: 'negative',
        icon: 'bug_report'
      })
    }
  },

  created () {
    this.requestConfig()
  }
}
</script>
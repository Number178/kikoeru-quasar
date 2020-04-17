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
            required="required"
            lazy-rules
            :rules="[val => !config.rootFolders.find(rootFolder => rootFolder.name === val) || '该别名已存在，文件夹别名不能重复']"
            label="文件夹别名"
          />

          <q-input
            outlined
            dense
            v-model="rootFolder.path"
            required="required"
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

    <q-form @submit="onSubmit" v-show="config.rootFolders && config.rootFolders.length">
      <q-card class="q-ma-md">
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

      <div class="q-ma-lg row justify-end">
        <q-btn label="保存" type="submit" color="primary" />
      </div>
    </q-form>
  </div>
</template>

<script>
export default {
  name: 'Folders',

  data () {
    return {
      config: {},
      rootFolder: {
        name: '',
        path: ''
      }
    }
  },

  methods: {
    requestConfig () {
      this.$axios.get('/api/config')
        .then((response) => {
          console.log(response)
          this.config = response.data.config
        })
    },

    onSubmit () {
      this.$axios.put('/api/config', {
        headers: { "Content-Type": "application/json;" },
        config: this.config
      })
        .then((response) => {
          console.log(response.data.message)
        })
    },

    onSubmitRootFolder () {
      this.config.rootFolders.push(this.rootFolder)
    },

    removeFromRootFolders (index) {
      this.config.rootFolders.splice(index, 1)
    }
  },

  created () {
    this.requestConfig()
  }
}
</script>
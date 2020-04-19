<template>
  <div>
    <q-card class="q-ma-md">
      <q-form @submit="updateAdminPassword()">
        <q-toolbar>
          <q-toolbar-title>修改管理员密码</q-toolbar-title>
        </q-toolbar>

        <div class="q-pa-sm">
          <q-input outlined dense type="password" label="旧密码"
            v-model="adminOldPassword"
            lazy-rules
            :rules="[ val => val.length >= 5 || '密码长度至少为 5' ]"
          />

          <q-input outlined dense type="password" label="新密码"
            v-model="adminNewPassword"
            lazy-rules
            :rules="[ val => val.length >= 5 || '密码长度至少为 5' ]"
          />

          <q-input outlined dense type="password" label="确认密码"
            v-model="adminConfirmPassword"
            lazy-rules
            :rules="[
              val => val.length >= 5 || '密码长度至少为 5',
              val => val === adminNewPassword || '两次密码输入不一致'
            ]"
          />

          <div class="row justify-end">
            <q-btn :loading="loadingUpdateAdminPassword" type="submit" color="primary" label="修改" />
          </div>
        </div>
      </q-form>
    </q-card>

    <q-card class="q-ma-md">
      <q-form @submit="addNewUser()">
        <q-toolbar>
          <q-toolbar-title>添加新用户</q-toolbar-title>
        </q-toolbar>

        <div class="q-pa-sm">
          <q-select dense outlined label="用户组" v-model="newuser.group" :options="groups" class="q-mb-md" />

          <q-input outlined dense
            v-model="newuser.name" label="用户名"
            required
            lazy-rules
            :rules="[val => !users.find(user => user.name === val) || '该名称已存在，用户名不能重复' ]" 
          />

          <q-input outlined dense label="密码"
            v-model="newuser.password"
            lazy-rules
            :rules="[ val => val.length >= 5 || '密码长度至少为 5' ]"
          />

          <div class="row justify-end">
            <q-btn :loading="loadingAddNewUser" type="submit" color="primary" label="添加" />
          </div>
        </div>
      </q-form>
    </q-card>

    <div class="q-pa-md">
      <q-table
        title="所有用户"
        :data="users"
        :columns="columns"
        row-key="name"
        :selected-rows-label="getSelectedString"
        selection="multiple"
        :selected.sync="selected"
      />

      <div class="q-mt-md">
        {{selected}}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      selected: [],
      columns: [
        { name: 'desc', required: true, label: '用户名', align: 'left', field: 'name', sortable: true },
        { name: 'calories', required: true, label: '用户组', align: 'center', field: 'group', sortable: true },
      ],
      users: [],

      newuser: {
        name: '',
        password: '',
        group: 'user'
      },
      groups: ['user', 'gaust'],
      loadingAddNewUser: false,

      
      adminOldPassword: '',
      adminNewPassword: '',
      adminConfirmPassword: '',
      loadingUpdateAdminPassword: false,
    }
  },

  methods: {
    getSelectedString () {
      return this.selected.length === 0 ? '' : `${this.selected.length} record${this.selected.length > 1 ? 's' : ''} selected of ${this.users.length}`
    },

    addNewUser () {
      this.loadingAddNewUser = true
      this.$axios.post('/api/user', {
        name: this.newuser.name,
        password: this.newuser.password,
        group: this.newuser.group
      })
        .then((response) => {
          this.users.push(this.newuser)
          this.loadingAddNewUser = false
          this.showSuccNotif(response.data.message)
          this.requestUsers()
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status === 401 || error.response.status === 403 || error.response.status === 500) {
              this.showWarnNotif(error.response.data.error)
            } else {
              this.showErrNotif(`${error.response.status} ${error.response.statusText}`)
            }
          } else {
            this.showErrNotif(error.message || error)
          }
        })

    },

    updateAdminPassword () {
      this.loadingUpdateAdminPassword = true
      this.$axios.put('/api/user', {
        name: 'admin',
        oldPassword: this.adminOldPassword,
        newPassword: this.adminNewPassword
      })
        .then((response) => {
          this.loadingUpdateAdminPassword = false
          try {
            // 删除旧 token
            this.$q.localStorage.set('jwt-token', '')
          } catch (err) {
            // 由于Web Storage API错误，
            // 数据未成功保存
            this.showErrNotif(err.message)
          }
          // 跳转到登录页面
          this.$router.push('/login')
          this.showSuccNotif(response.data.message)
        })
        .catch((error) => {
          this.loadingUpdateAdminPassword = false
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status === 401 || error.response.status === 500) {
              this.showWarnNotif(error.response.data.error)
            } else {
              this.showErrNotif(`${error.response.status} ${error.response.statusText}`)
            }
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    requestUsers () {
      this.$axios.get('/api/users')
        .then((response) => {
          this.users = response.data.users
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
    this.requestUsers()
  }
}
</script>
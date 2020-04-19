<template>
  <div class="fit bg-blue-grey-10">
    <q-img class="absolute-top" src="statics/material.png" style="height: 150px">
      <div class="absolute-bottom bg-transparent column items-center">
        <q-avatar v-if="username" size="80px" class="col q-mb-sm">
          <img src="statics/default_avatar.gif">
        </q-avatar>

        <q-icon v-else name="account_circle" size="80px" />

        <div class="col text-weight-bold">
          <router-link to="/login" class="text-white" v-if="!username">登录</router-link>
          <span v-else>{{username}}</span>
        </div>
      </div>
    </q-img>

    <q-list class="absolute-center column items-center text-grey">
      <q-item-label header class="col text-subtitle1">
        BROWSE
      </q-item-label>

      <q-item
        clickable
        v-ripple
        exact
        :to="link.path"
        active-class="text-white text-weight-regular"
        v-for="(link, index) in links"
        :key="index"
        class="col text-h5"
      >
        <q-item-section avatar>
          <q-icon :name="link.icon" />
        </q-item-section>

        <q-item-section>
          {{link.title}}
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
export default {
  name: 'NavBar',

  props: {
    links: {
      type: Array,
      required: true,
    }
  },

  computed: {
    username () {
      return this.$store.state.User.name
    }
  }
}
</script>

<style lang="scss" scoped>
  a {
    text-decoration:none;
  }
</style>

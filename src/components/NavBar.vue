<template>
  <div class="fit row items-center bg-blue-grey-10">
    <div class="col">
      <q-list class="column items-center text-grey">
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
          class="col"
        >
          <q-item-section avatar>
            <q-icon color="primary" :name="link.icon" />
          </q-item-section>

          <q-item-section class="text-h5">
            {{link.title}}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
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
  }
}
</script>

<style lang="scss" scoped>
  a {
    text-decoration:none;
  }
</style>

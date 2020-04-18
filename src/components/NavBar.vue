<template>
  <div class="fit row items-center bg-blue-grey-10">
    <q-list class="col column items-center text-grey">
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
  }
}
</script>

<style lang="scss" scoped>
  a {
    text-decoration:none;
  }
</style>

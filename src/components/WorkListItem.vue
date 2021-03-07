<template>
  <q-item clickable :to="`/work/${metadata.id}`" class="bg-white" style="padding: 5px;">
    <q-item-section avatar style="padding: 0px 5px 0px 0px;">
      <router-link :to="`/work/${metadata.id}`">
        <q-img transition="fade" :src="samCoverUrl" style="height: 60px; width: 60px;" />
      </router-link>
    </q-item-section>

    <q-item-section>
      <q-item-label lines="2" class="text">
        <router-link :to="`/work/${metadata.id}`" class="text-black">
          {{ metadata.title }}
        </router-link>
      </q-item-label>

      <q-item-label>
        <div class="row q-gutter-x-sm q-gutter-y-xs">
          <router-link :to="`/circle/${metadata.circle.id}`" class="col-auto text-grey">
            {{ metadata.circle.name }}
          </router-link>

          <span class="col-auto">/</span>

          <router-link
            v-for="(va, index) in metadata.vas"
            :to="`/va/${va.id}`"
            :key=index
            class="col-auto text-primary"
          >
            {{ va.name }}
          </router-link>
        </div>
      </q-item-label>

      <q-item-label v-if="showLabel && windowWidth > 700">
        <div class="row q-gutter-x-sm q-gutter-y-xs">
          <router-link
            v-for="(tag, index) in metadata.tags"
            :to="`/tag/${tag.id}`"
            :key=index
            class="col-auto text-grey"
          >
            {{ tag.name }}
          </router-link>
        </div>
      </q-item-label>
    </q-item-section>
  </q-item>   
</template>

<script>
// import WorkDetails from 'components/WorkDetails'
// import CoverSFW from 'components/CoverSFW'

export default {
  name: 'WorkListItem',

  props: {
    metadata: {
      type: Object,
      required: true
    },
    showLabel: {
      type: Boolean,
      default: true
    },
  },

  data () {
    return {
      windowWidth: window.innerWidth
    }
  },

  computed: {
    samCoverUrl () {
      // 从 LocalStorage 中读取 token
      const token = this.$q.localStorage.getItem('jwt-token') || ''
      return this.metadata.id ? `/api/cover/${this.metadata.id}?type=sam&token=${token}` : ""
    },
  }
}
</script>

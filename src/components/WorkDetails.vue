<template>
  <div>
    <router-link :to="`/work/${metadata.id}`">
      <CoverSFW :workid="metadata.id" :nsfw="false" />
    </router-link>

    <div class="q-pa-sm">
      <div class="q-px-sm q-py-none">
        <!-- 标题 -->
        <div class="text-h6 text-weight-regular">
          <router-link :to="`/work/${metadata.id}`" class="text-black">
            {{metadata.title}}
          </router-link>
        </div>
        
        <!-- 社团名 -->
        <div class="text-subtitle1 text-weight-regular">
          <router-link :to="`/circle/${metadata.circle.id}`" class="text-grey">
            {{metadata.circle.name}} 
          </router-link>
        </div>
      </div>

      <!-- 标签 -->
      <div class="q-px-none q-py-sm">
        <router-link
          v-for="(tag, index) in metadata.tags"
          :to="`/tag/${tag.id}`"
          :key=index
        >
          <q-chip size="md" class="shadow-4">
            {{tag.name}}
          </q-chip>
        </router-link>
      </div>

      <!-- 声优 -->
      <div class="q-px-none q-pt-sm q-pb-none">
        <router-link
          v-for="(va, index) in metadata.vas"
          :to="`/va/${va.id}`"
          :key=index
        >
          <q-chip square size="md" class="shadow-4" color="teal" text-color="white">
            {{va.name}}
          </q-chip>
        </router-link>
      </div>     
    </div>
  </div>  
</template>

<script>
import CoverSFW from 'components/CoverSFW'

export default {
  name: 'WorkDetails',

  components: {
    CoverSFW
  },

  props: {
    metadata: {
      type: Object,
      required: true
    }
  }
}
</script>

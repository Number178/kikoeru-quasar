<template>
  <div>
    <router-link :to="`/work/${metadata.id}`">
      <CoverSFW :workid="metadata.id" :nsfw="false" :release="metadata.release" />
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

        <!-- 评价&评论 -->
        <div class="row items-center q-gutter-xs">
          <!-- 评价 -->
          <div class="col-auto">
            <q-rating
              :value="metadata.rate_average_2dp || 0"
              size="sm"
              color="amber"
              icon="star_border"
              icon-selected="star"
              icon-half="star_half"
              readonly 
            />

            <!-- 评价分布明细 -->
            <q-tooltip content-class="text-subtitle1">
              <div>平均: {{metadata.rate_average_2dp}}</div>
              <div v-for="(rate, index) in metadata.rate_count_detail" :key=index class="row items-center">
                <div class="col"> {{rate.review_point}}星 </div>

                <!-- 评价占比 -->
                <q-linear-progress
                  :value="rate.ratio/100"
                  color="amber"
                  track-color="white"
                  style="height: 15px; width: 100px"
                  class="col-auto"
                />

                <div class="col q-mx-sm"> ({{rate.count}}) </div>
              </div>            
            </q-tooltip>
          </div>

          <div class="col-auto">
            <span class="text-weight-medium text-body1 text-red">{{metadata.rate_average_2dp}}</span> <span class="text-grey"> ({{metadata.rate_count}})</span>
          </div>

          <!-- 评论数量 -->
          <div class="col-auto q-px-sm">
            <q-icon name="chat" size="xs" /> <span class="text-grey"> ({{metadata.review_count}})</span>
          </div>
		  
		  <!-- DLsite链接 -->
		  <div class="col-auto">
            <q-icon name="launch" size="xs" /><a class="text-blue" :href="`https://www.dlsite.com/home/work/=/product_id/RJ${String(metadata.id).padStart(6,'0')}.html`" target="_blank">DLsite</a>
          </div>
        </div>
      </div>
      
      <!-- 价格&售出数 -->
      <div class="q-pt-sm q-pb-none">
        <span class="q-mx-sm text-weight-medium text-h6 text-red">{{metadata.price}} 日元</span> 售出数: {{metadata.dl_count}}
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

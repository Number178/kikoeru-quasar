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
          <router-link :to="`/works?circleId=${metadata.circle.id}`" class="text-grey">
            {{metadata.circle.name}}
          </router-link>
        </div>

        <!-- 评价&评论 -->
        <div class="row items-center q-gutter-xs">
          <!-- 评价 -->
          <div class="col-auto">
            <q-rating
              v-model="rating"
              @input="setRating"
              name="rating"
              size="sm"
              :color="userMarked ? 'blue' : 'amber'"
              icon="star_border"
              icon-selected="star"
              icon-half="star_half"
            />

            <!-- 评价分布明细 -->
            <q-tooltip v-if=metadata.rate_count_detail content-class="text-subtitle1">
              <div>平均: {{metadata.rate_average_2dp}}</div>
              <div v-for="(rate, index) in sortedRatings" :key=index class="row items-center">
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
            <q-icon name="launch" size="xs" /><a class="text-blue" :href="`https://www.dlsite.com/home/work/=/product_id/RJ${String(metadata.id).padStart(6,'0')}.html`" rel="noreferrer noopener" target="_blank">DLsite</a>
          </div>
        </div>
      </div>

      <!-- 价格&售出数 -->
      <div class="q-pt-sm q-pb-none">
        <span class="q-mx-sm text-weight-medium text-h6 text-red">{{metadata.price}} 日元</span> 售出数: {{metadata.dl_count}}
      </div>

      <!-- 标签 -->
      <div class="q-px-none q-py-sm" v-if="showTags">
        <router-link
          v-for="(tag, index) in metadata.tags"
          :to="`/works?tagId=${tag.id}`"
          :key=index
        >
          <q-chip size="md" class="shadow-4">
            {{tag.name}}
          </q-chip>
        </router-link>
      </div>

      <!-- 声优 -->
      <div class="q-px-none q-pt-sm q-py-sm">
        <router-link
          v-for="(va, index) in metadata.vas"
          :to="`/works?vaId=${va.id}`"
          :key=index
        >
          <q-chip square size="md" class="shadow-4" color="teal" text-color="white">
            {{va.name}}
          </q-chip>
        </router-link>
      </div>

      <q-btn-dropdown
        dense
        class="q-mt-sm shadow-4 q-mx-xs q-pl-sm"
        color="cyan"
        label="标记进度"
      >
        <q-list>
          <q-item clickable @click="setProgress('marked')" class="q-pa-xs">
            <q-item-section avatar>
              <q-avatar icon="headset" v-show="progress === 'marked'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>想听</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable @click="setProgress('listening')" class="q-pa-xs">
            <q-item-section avatar>
              <q-avatar icon="headset" v-show="progress === 'listening'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>在听</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable @click="setProgress('listened')" class="q-pa-xs">
            <q-item-section avatar>
              <q-avatar icon="headset" v-show="progress === 'listened'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>听过</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable @click="setProgress('replay')" class="q-pa-xs">
            <q-item-section avatar>
              <q-avatar icon="headset" v-show="progress === 'replay'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>重听</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable @click="setProgress('postponed')" class="q-pa-xs">
            <q-item-section avatar>
              <q-avatar icon="headset" v-show="progress === 'postponed'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>搁置</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn dense @click="showReviewDialog = true" color="cyan q-mt-sm shadow-4 q-mx-xs q-px-sm" label="写评论" />

      <WriteReview v-if="showReviewDialog" @closed="processReview" :workid="metadata.id" :metadata="metadata"></WriteReview>
    </div>
  </div>
</template>

<script>
import CoverSFW from 'components/CoverSFW'
import WriteReview from './WriteReview'
import NotifyMixin from '../mixins/Notification.js'

export default {
  name: 'WorkDetails',

  mixins: [NotifyMixin],

  components: {
    CoverSFW,
    WriteReview
  },

  props: {
    metadata: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      rating: 0,
      userMarked: false,
      progress: '',
      showReviewDialog: false,
      showTags: true
    }
  },

  computed: {
    sortedRatings: function() {
      function compare(a, b) {
        return (a.review_point > b.review_point) ? -1 : 1;
      }
      return this.metadata.rate_count_detail.slice().sort(compare);
    }
  },

  watch: {
    // 需要用watch因为父component pages/work.vue是先用空值初始化的
    metadata (newMetaData) {
      if (newMetaData.userRating) {
        this.userMarked = true;
        this.rating = newMetaData.userRating;
      } else {
        this.userMarked = false;
        this.rating = newMetaData.rate_average_2dp || 0;
      }
      this.progress = newMetaData.progress;

      // 极个别作品没有标签
      if (newMetaData.tags && newMetaData.tags[0].name === null) {
        this.showTags = false;
      }
    },
  },

  methods: {
    setProgress (newProgress) {
      this.progress = newProgress;
      const submitPayload = {
        'user_name': this.$store.state.User.name, // 用户名不会被后端使用
        'work_id': this.metadata.id,
        'progress': newProgress
      };
      this.submitProgress(submitPayload);
    },

    submitProgress (payload) {
      const params = {
        starOnly: false,
        progressOnly: true
      }
      this.$axios.put('/api/review', payload, {params})
        .then((response) => {
          this.showSuccNotif(response.data.message);
          this.$emit('reset');
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    setRating (newRating) {
      const submitPayload = {
        'user_name': this.$store.state.User.name, // 用户名不会被后端使用
        'work_id': this.metadata.id,
        'rating': newRating
      };
      this.submitRating(submitPayload);
    },

    submitRating (payload) {
      this.$axios.put('/api/review', payload)
        .then((response) => {
          this.showSuccNotif(response.data.message);
          this.$emit('reset');
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    processReview () {
      this.showReviewDialog = false;
    },
  }
}
</script>

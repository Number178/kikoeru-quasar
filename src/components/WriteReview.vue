<template>
  <div>
      <q-dialog v-model="showReviewDialog" @hide="closeDialog">
        <q-card>
          <q-card-section class="q-pb-sm">
            <div class="text-body1">我的评论</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-rating
              v-model="rating"
              size="sm"
              color="blue"
              icon="star_border"
              icon-selected="star"
              icon-half="star_half"
              class="col-auto"
            />
            <q-btn-toggle
              v-model="progress"
              no-caps
              :class="$q.screen.lt.sm ? 'my-custom-toggle q-mx-none q-mt-sm' : 'my-custom-toggle q-mx-md'"
              rounded
              unelevated
              :padding="$q.screen.width < 400 ? 'sm': ''"
              toggle-color="primary"
              color="white"
              text-color="primary"
              :options="[
                {label: '想听', value: 'marked'},
                {label: '在听', value: 'listening'},
                {label: '听过', value: 'listened'},
                {label: '重听', value: 'replay'},
                {label: '搁置', value: 'postponed'}
              ]"
            />
          </q-card-section>

          <q-card-section class="q-pt-none" >
            <div style="min-width: 300px">
              <q-input
                v-model="reviewText"
                filled
                type="textarea"
              />
            </div>
          </q-card-section>
          
          <div class="row justify-between">
            <q-card-actions  class="text-red">
              <q-btn flat label="删除标记" v-close-popup @click="deleteConfirm = true" />
            </q-card-actions>

            <q-card-actions align="right" class="text-primary">
              <q-btn flat label="确定" v-close-popup @click="submitReview()" />
              <q-btn flat label="取消" v-close-popup @click="closeDialog()" />
            </q-card-actions>
          </div>
        </q-card>
      </q-dialog>

      <q-dialog v-model="deleteConfirm" persistent transition-show="scale" transition-hide="scale">
        <q-card class="bg-teal text-white" style="width: 300px">
          <q-card-section>
            <div class="text-h6">确定要删除标记吗</div>
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
              <q-btn flat label="确定" v-close-popup @click="deleteReview()" />
              <q-btn flat label="取消" v-close-popup @click="closeDialog()"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
  </div>
</template>

<script>
import NotifyMixin from '../mixins/Notification.js'

export default {
  name: 'WriteReview',

  mixins: [NotifyMixin],

  props: {
    workid: {
      type: Number,
      required: true
    },
    metadata: {
      type: Object,
      default: null
    }
  },

  data () {
    return {
      showReviewDialog: true,
      deleteConfirm: false,
      rating: 0,
      reviewText: '',
      modified: false,
      progress: '',
    }
  },

  mounted() {
    if (this.metadata.userRating) {
      this.rating = this.metadata.userRating;
    }
      this.progress = this.metadata.progress;
    this.reviewText = this.metadata.review_text;
  },

  methods: {
    closeDialog() {
      // Do not emit anything if the second dialog is shown
      // If the user clicks anywhere outside of the main dialog, emit 'closed'
      if (!this.deleteConfirm) {
        if (this.modified) {
          this.$emit('closed', true);
        } else {
          this.$emit('closed', false);
        }
      }
    },

    reviewPayload () {
      const submitPayload = {
        'user_name': this.$store.state.User.name, // 用户名不会被后端使用
        'work_id': this.workid,
        'rating': this.rating,
        'review_text': this.reviewText,
        'progress': this.progress
      };
      return submitPayload;
    },

    submitReview () {
      const params = {
        starOnly: false
      }
      const payload = this.reviewPayload();
      this.$axios.put('/api/review', payload, {params})
        .then((response) => {
          this.modified =true
          // TODO 修复callback graph
            this.showSuccNotif(response.data.message)
        })
        .then(()=> this.closeDialog())
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },

    deleteReview () {
      const params = {
        'work_id': this.workid
      }
      this.$axios.delete('/api/review', {params})
        .then((response) => {
          this.modified = true
          this.showSuccNotif(response.data.message)
        })
        .then(() => this.closeDialog())
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
          } else {
            this.showErrNotif(error.message || error)
          }
        })
    },
  }

}
</script>

<style lang="sass" scoped>
.my-custom-toggle
  border: 1px solid #027be3
</style>
<template>
  <div>
    <div class="row justify-between q-mt-lg q-ml-md">
      <div class="col text-h5 text-weight-regular">最近播放</div>
      <q-btn flat icon="navigate_next" @click="$router.push('/favourites/histroy')"></q-btn>
    </div>
    <q-virtual-scroll
      class="q-px-sm"
      :class="{'scroll-style-change': !$q.platform.has.touch}"
      :items="works"
      ref="scroll"
      virtual-scroll-horizontal
      @virtual-scroll="onVirtualScroll"
      @wheel.stop.prevent="onMouseWheel"
    >
      <template v-slot="{ item }">
        <div
          class="q-pa-sm"
          style="width: 500px; max-width: 80vw;"
          @click.stop.prevent="resumeThisHistroy(item)"
        >
          <CoverSFW
            class="card q-mx-sm shadow-4"
            :workid="item.id"
            :nsfw="false"
            :release="''"
            :lyric_status="item.lyric_status"
          >
            <template slot="cover">
              <div class="playInfo absolute-bottom">
                <div class="ellipsis-2-lines audioText">
                  {{ getWorkHistoryInfo(item) }}
                </div>
                <div class="ellipsis workText" >
                  {{ item.title }}
                </div>
              </div>
            </template>
          </CoverSFW>
        </div>
      </template>
    </q-virtual-scroll>
  </div>
</template>

<script>

import CoverSFW from './CoverSFW.vue';

export default {
  name: 'RecentWorks',

  components: {
    CoverSFW
},

  data () {
    return {
      currentPage: 0,
      pagination: { currentPage:0, pageSize:12, totalCount:0 },
      works: [],
      stopLoad: false,
      isLoading: false,
    }
  },

  methods: {
    async getHistory() {
      if (this.stopLoad || this.isLoading) return;

      this.isLoading = true;

      const params = {
        page: this.pagination.currentPage + 1,
        sort: 'desc',
      };

      // console.warn('load more page on: ', params.page);
      try {
        const response = await this.$axios.get('/api/histroy', { params });
        this.works = this.works.concat(response.data.works);
        this.pagination = response.data.pagination;
        this.$refs.scroll.refresh();
        // console.log("vscroll = ", this.$refs.scroll);
      } catch(err) {
        console.warn('load recent work failed: ', err);
      }
      this.isLoading = false;

      if (this.works.length >= this.pagination.totalCount) {
        this.stopLoad = true;
      }
    },

    async onVirtualScroll(details) {
      // console.log('virtual on virtual scroll: ', details.from, '->', details.to, ' index = ', details.index);
      const alreadyScrolledCount = details.index + 1;
      const loadMoreThres = 3; // 当剩余显示的数量小于这个数字时，加载更多播放历史
      if (loadMoreThres > (this.works.length - alreadyScrolledCount)) {
        this.getHistory();
      }
    },

    onMouseWheel(e) {
      // console.log('vmouse wheel = ', e);
      this.$refs.scroll.$el.scrollLeft += (e.deltaX || e.deltaY);
    },

    // 返回单个作品播放历史的简单信息
    getWorkHistoryInfo(work) {
      const state = work.state;
      const lastPlayItem = state.queue[state.index]
      return lastPlayItem.title;
    },

    resumeThisHistroy(work) {
      this.$store.commit('AudioPlayer/SET_QUEUE', {
        workId: work.id,
        queue: work.state.queue,
        index: work.state.index,
        resetPlaying: false,
        resumeHistroySeconds: work.state.seconds,
      })
      console.log(`resume seconds = ${work.state.seconds}`)
    }

  },

  mounted() {
    this.getHistory();
  },
}
</script>

<style scoped lang="scss">

.card {
  border-radius: 8px;
  overflow: hidden;
}

.playInfo {
  background: linear-gradient(to top, black, rgba(0, 0, 0, 0.5), transparent);
  width: 100%;
  padding: 0.5rem;
}

.audioText {
  font-weight: bold;
  font-size: larger;
}

.workText {
  font-weight: normal;
  font-size: small;
  color: lightgrey;

}

.scroll-style-change {
  scrollbar-color: gray transparent;
}

.scroll-style-change::-webkit-scrollbar {
  background: transparent;
  height: 0.5rem;
}

.scroll-style-change::-webkit-scrollbar-thumb {
  background: gray;
  min-width: 3rem;
  border-radius: 10px;
}

</style>
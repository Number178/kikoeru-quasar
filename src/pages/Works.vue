<template>
  <div>
    <div class="text-h5 text-weight-regular q-ma-md">
      {{pageTitle}}
      <span v-show="pagination.totalCount">
        ({{pagination.totalCount}})
      </span>
    </div>
    
    <div :class="`row justify-center ${listMode ? 'list' : 'q-mx-md'}`">
      <q-infinite-scroll @load="onLoad" :offset="250" :disable="stopLoad" style="max-width: 1680px;" class="col">
        <div v-show="works.length" class="row justify-between q-mb-md q-mr-sm">
          <!-- 排序选择框 -->
          <q-select
            dense
            rounded
            outlined
            bg-color="white"
            transition-show="scale"
            transition-hide="scale"
            v-model="sortOption"
            :options="options"
            label="排序"
            class="col-auto"
          />

          <!-- 切换显示模式按钮 -->
          <q-btn-toggle
            dense
            spread
            rounded
            v-model="listMode"
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="[
              { icon: 'apps', value: false },
              { icon: 'list', value: true }
            ]"
            style="width: 85px;"
            class="col-auto"
          />

          <q-btn-toggle
            dense
            spread
            rounded
            v-model="showLabel"
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="[
              { icon: 'label', value: true },
              { icon: 'label_off', value: false }
            ]"
            style="width: 85px;"
            class="col-auto"
            v-if="windowWidth > 700 && listMode"
          />

          <q-btn-toggle
            dense
            spread
            rounded
            :disable="windowWidth < 1120"
            v-model="detailMode"
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="[
              { icon: 'zoom_in', value: true },
              { icon: 'zoom_out', value: false },
            ]"
            style="width: 85px;"
            class="col-auto"
            v-if="windowWidth > 700 && !listMode"
          />

        </div>
        
        <q-list v-if="listMode" bordered separator class="shadow-2">
          <WorkListItem v-for="work in works" :key="work.id" :metadata="work" :showLabel="showLabel && windowWidth > 700" />
        </q-list>

        <div v-else class="row q-col-gutter-x-md q-col-gutter-y-lg">
          <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3" :class="{'work-card': detailMode}" v-for="work in works" :key="work.id">
            <WorkCard :metadata="work" class="fit"/> 
          </div> 
        </div>
        
        <div v-show="stopLoad" class="q-mt-lg q-mb-xl text-h6 text-bold text-center">END</div>

        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
  </div>
</template>

<script>
import WorkCard from 'components/WorkCard'
import WorkListItem from 'components/WorkListItem'
import NotifyMixin from '../mixins/Notification.js'

export default {
  name: 'Works',

  mixins: [NotifyMixin],

  components: {
    WorkCard,
    WorkListItem
  },

  props: {
    restrict: {
      type: String
    }
  },

  data () {
    return {
      listMode: false,
      showLabel: true,
      detailMode: false,
      stopLoad: false,
      works: [],
      pageTitle: '',
      page: 1,
      pagination: {},
      windowWidth: window.innerWidth,
      seed: 7, // random sort
      sortOption: {
        label: '按照发售日期新到老的顺序',
        order: 'release',
        sort: 'desc'
      },
      options: [
        {
          label: '按照发售日期新到老的顺序',
          order: 'release',
          sort: 'desc'
        },
        {
          label: '按照我的评价排序',
          order: 'rating',
          sort: 'desc'
        },
        {
          label: '按照发售日期老到新的顺序',
          order: 'release',
          sort: 'asc'
        },
        {
          label: '按照售出数量多到少的顺序',
          order: 'dl_count',
          sort: 'desc'
        },
        {
          label: '按照价格便宜到贵的顺序',
          order: 'price',
          sort: 'asc'
        },
        {
          label: '按照价格贵到便宜的顺序',
          order: 'price',
          sort: 'desc'
        },
        {
          label: '按照评价高到低的顺序',
          order: 'rate_average_2dp',
          sort: 'desc'
        },
        {
          label: '按照评论多到少的顺序',
          order: 'review_count',
          sort: 'desc'
        },
        {
          label: '按照RJ号大到小的顺序',
          order: 'id',
          sort: 'desc'
        },
        {
          label: '按照RJ号小到大的顺序',
          order: 'id',
          sort: 'asc'
        },
        {
          label: '按照全年龄新作优先的顺序',
          order: 'nsfw',
          sort: 'asc'
        },
        {
          label: '随机排序',
          order: 'random',
          sort: 'desc'
        }
      ]
    }
  },

  created () {
    this.refreshPageTitle();
    this.seed = Math.floor(Math.random() * 100);
  },

  mounted() {
    if (localStorage.sortOption) {
      try {
        this.sortOption = JSON.parse(localStorage.sortOption);
      } catch {
        localStorage.removeItem('sortOption');
      }
    }
    if (localStorage.showLabel) {
      this.showLabel = (localStorage.showLabel === 'true');
    }
    if (localStorage.listMode) {
      this.listMode = (localStorage.listMode === 'true');
    }
    if (localStorage.detailMode) {
      this.detailMode = (localStorage.detailMode === 'true');
    }
  },

  computed: {
    url () {
      if (this.$route.params.keyword) {
        return `/api/search/${this.$route.params.keyword}`
      } else if (this.$route.params.id) {
        return `/api/${this.restrict}/${this.$route.params.id}`
      } else {
        return '/api/works'
      }
    }
  },

  watch: {
    url () {
      this.reset()
    },

    sortOption (newSortOptionSetting) {
      localStorage.sortOption = JSON.stringify(newSortOptionSetting);
      this.seed = Math.floor(Math.random() * 100);
      this.reset();
    },

    showLabel (newLabelSetting) {
      localStorage.showLabel = newLabelSetting;
    },

    listMode (newListModeSetting) {
      localStorage.listMode = newListModeSetting;
    },

    detailMode(newModeSetting) {
      localStorage.detailMode = newModeSetting;
    },
  },

  methods: {
    onLoad (index, done) {
      this.requestWorksQueue()
        .then(() => done())
    },

    requestWorksQueue () {
      const params = {
        order: this.sortOption.order,
        sort: this.sortOption.sort,
        page: this.pagination.currentPage + 1 || 1,
        seed: this.seed
      }

      return this.$axios.get(this.url, { params })
        .then((response) => {
          const works = response.data.works
          this.works = (params.page === 1) ? works.concat() : this.works.concat(works)
          this.pagination = response.data.pagination

          if (this.works.length >= this.pagination.totalCount) {
            this.stopLoad = true
          }
        })
        .catch((error) => {
          if (error.response) {
            // 请求已发出，但服务器响应的状态码不在 2xx 范围内
            if (error.response.status !== 401) {
              this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
            }
          } else {
            this.showErrNotif(error.message || error)
          }
          this.stopLoad = true
        })
    },

    refreshPageTitle () {
      if (this.$route.params.id) {
        const url = `/api/get-name/${this.restrict}/${this.$route.params.id}`
        this.$axios.get(url)
          .then((response) => {
            const name = response.data
            let pageTitle

            switch (this.restrict) {
              case 'tag':
                pageTitle = 'Works tagged with '
                break
              case 'va':
                pageTitle = 'Works voiced by '
                break
              case 'circle':
                pageTitle = 'Works by '
                break
            }    
            pageTitle += name || ''

            this.pageTitle = pageTitle
          })
          .catch((error) => {
            if (error.response) {
              // 请求已发出，但服务器响应的状态码不在 2xx 范围内
              if (error.response.status !== 401) {
                this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
              }
            } else {
              this.showErrNotif(error.message || error)
            }
          })
      } else if (this.$route.params.keyword) {
        this.pageTitle = `Search by ${this.$route.params.keyword}`
      } else {
        this.pageTitle = 'All works'
      } 
    },

    reset () {
      this.stopLoad = true
      this.refreshPageTitle()
      this.pagination = {}
      this.requestWorksQueue()
        .then(() => {
          this.stopLoad = false
        })
    },
  }
}
</script>

<style lang="scss" scoped>
  .list {
    // 宽度 >= $breakpoint-sm-min
    @media (min-width: $breakpoint-sm-min) {
      padding: 0px 20px;
    }
  }
  
  .work-card {
    // 宽度 > $breakpoint-xl-min
    @media (min-width: $breakpoint-md-min) {
      width: 560px;
    }
  }
</style>

<template>
  <div>
    <div class="text-h5 text-weight-regular q-ma-md">
      {{pageTitle}}<span v-show="pagination.totalCount"> ({{pagination.totalCount}})</span>
    </div>
    
    <div class="row justify-center q-col-gutter-y-lg q-pb-xl q-pt-none">
      <!-- 排序选择框 -->
      <div class="col-11">
        <q-select
          dense
          rounded
          outlined
          transition-show="scale"
          transition-hide="scale"
          v-model="oderOption"
          :options="options"
          label="排序"
          style="max-width: 250px"
        />
      </div>

      <div class="col-11">
        <q-infinite-scroll @load="onLoad" :offset="250" :disable="stopLoad">
         <div class="row justify-center q-col-gutter-x-md q-col-gutter-y-lg">
            <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-auto" v-for="(work, index) in works" :key="index">
              <WorkCard :workid="work.id" class="work-card" />
            </div>
          </div>

          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </div>
    </div>
  </div>
</template>

<script>
import WorkCard from 'components/WorkCard'

export default {
  name: 'Works',

  components: {
    WorkCard
  },

  props: {
    restrict: {
      type: String
    }
  },

  data () {
    return {
      stopLoad: false,
      works: [],
      pageTitle: '',
      page: 1,
      pagination: {},
      oderOption: {
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
      ]
    }
  },

  created () {
    this.refreshPageTitle()
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

    oderOption () {
      this.reset()
    }
  },

  methods: {
    onLoad (index, done) {
      this.requestWorksQueue()
        .then(() => done())
    },

    requestWorksQueue () {
      const params = {
        order: this.oderOption.order,
        sort: this.oderOption.sort,
        page: this.pagination.currentPage + 1 || 1
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
          if (error.response && error.response.status !== 401) {
            this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
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
            if (error.response && error.response.status !== 401) {
              this.showErrNotif(error.response.data.error || `${error.response.status} ${error.response.statusText}`)
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

    showErrNotif (message) {
      this.$q.notify({
        message,
        color: 'negative',
        icon: 'bug_report'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  .work-card {
    // 宽度 > $breakpoint-xl-min
    @media (min-width: $breakpoint-xl-min) {
      width: 560px;
      height: 100%;
    }
    // 宽度 < $breakpoint-lg-max
    @media (max-width: $breakpoint-lg-max) {
      width: 100%;
      height: 100%;
    }
  }
</style>
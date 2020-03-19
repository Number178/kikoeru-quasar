<template>
  <div>
    <div class="text-h5 text-weight-regular q-ma-md">
      {{pageTitle}}
    </div>

    <div class="row justify-center q-pb-xl q-pt-none">
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
      oldestId: 999999,
      pageTitle: ""
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
      this.stopLoad = true
      this.oldestId = 999999
      
      this.refreshPageTitle()
      this.requestWorksQueue()
        .then((works) => {
          this.works = works.concat()
          this.stopLoad = false
        })
    }
  },

  methods: {
    onLoad (index, done) {
      this.requestWorksQueue()
        .then((works) => {
          if (works.length) {
            this.works = this.works.concat(works)
            done()
          }
        })
    },

    requestWorksQueue () { 
      return this.axios.get(`${this.url}/${this.oldestId}`)
        .then((response) => {
          const works = response.data
          if (!works.length) {
            this.stopLoad = true
          } else {
            this.oldestId = works[works.length-1].id
          }

          return works
        })
        .catch((error) => {
          throw new Error(`Failed to request ${this.url}: ${error}`)
        })
    },

    refreshPageTitle () {
      if (this.$route.params.id) {
        const url = `/api/get-name/${this.restrict}/${this.$route.params.id}`
        this.axios.get(url)
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
            throw new Error(`Failed to request ${url}: ${error}`)
          })
      } else if (this.$route.params.keyword) {
        this.pageTitle = `Search by ${this.$route.params.keyword}`
      } else {
        this.pageTitle = 'All works'
      } 
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
<template>
  <div>
    <!--没有搜索的情况下，显示最近播放作品-->
    <RecentWorks v-if="!isAdvanceSearch && searchMetas.length == 0" />

    <!--
      TODO: 当前版本的quasar的input在iOSsafari中输入中文时有bug，
      拼音也会被更新到data中，看了一下quasar官网的demo是没有这个问题的（版本不明），
      用原生的input组件也没有问题，应该是这个项目里quasar版本太老，有些bug，
      以后升级quasar版本试试能不能解决这个问题
    -->
    <div v-if="isAdvanceSearch" class="q-pa-md q-full-width">
      <q-input
        outlined
        autofocus
        label="关键字搜索"
        :hint="advanceSearchBarHint"
        v-model="editKeyword"
        @keyup.enter="onAddAdvanceSearchKeyword"
      >
        <template v-slot:append>
          <q-btn round dense flat icon="add" @click="onAddAdvanceSearchKeyword"/>
        </template>
      </q-input>
    </div>
    
    <div class="q-mt-lg q-ml-md row items-center">
      <span class="text-h5 text-weight-regular q-pa-xs relative-position">
        {{pageTitle}}
        <q-badge color="secondary" floating>{{pagination.totalCount}}</q-badge>
      </span>
      <div v-if="isAdvanceSearch"><!--高级搜索模式的多关键字展示-->
        <q-badge class="q-ma-xs" v-for="meta,index in advanceSearchKeywords" :key="meta.t+meta.d">
          {{ meta.d }}
          <q-btn
            class="q-ml-sm search-tag-close-btn"
            padding="xs"
            round
            flat 
            size="xs"
            icon="close"
            @click="removeAdvanceSearchKeyword(index)"
          />
        </q-badge>
      </div>
      <div v-else> <!--普通搜索模式的信息展示-->
        <q-badge class="q-ma-xs" v-for="meta, index in searchMetas" :key="meta">{{ index == 0 ? "":"," }} {{ meta }}</q-badge>
      </div>
    </div>

    <div class="row justify-between q-mb-md q-mx-sm">
      <!-- 排序属性 -->
      <q-select
        dense
        rounded
        outlined
        bg-color=""
        transition-show="scale"
        transition-hide="scale"
        v-model="sortCategoryOption"
        :options="sortCategoryOptions"
        :option-label="humanReadableLabel"
        label="排序属性"
        class="col-auto"
      />

      <!-- 年龄分级 -->
      <q-select
        dense
        rounded
        outlined
        bg-color=""
        transition-show="scale"
        transition-hide="scale"
        v-model="nsfwOption"
        :options="nsfwOptions"
        :option-label="humanReadableLabel"
        label="年龄分级"
        class="col-auto"
      />

      <!-- 字幕筛选 -->
      <q-select
        dense
        rounded
        outlined
        bg-color=""
        style="min-width: 8rem;"
        transition-show="scale"
        transition-hide="scale"
        v-model="lyricOption"
        :options="lyricOptions"
        :option-label="humanReadableLabel"
        label="字幕筛选"
        clearable
        multiple
        class="col-auto"
      />

      <!-- 排序顺序 -->
      <q-toggle v-model="sortInDesc" :label="sortInDesc ? '降序' : '升序'" />

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
        v-if="$q.screen.width > 700 && listMode"
      />

      <q-btn-toggle
        dense
        spread
        rounded
        :disable="$q.screen.width < 1120"
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
        v-if="$q.screen.width > 700 && !listMode"
      />

    </div>

    <div :class="`row justify-center ${listMode ? 'list' : 'q-mx-md'}`">
      <q-infinite-scroll @load="onLoad" :offset="250" :disable="stopLoad" class="col">

        <q-list v-if="listMode" bordered separator class="shadow-2">
          <WorkListItem v-for="work in works" :key="work.id" :metadata="work" :showLabel="showLabel && $q.screen.width > 700" />
        </q-list>

        <!--旧式的workCard展示-->
        <div v-if="oldWorkCardUIStyle" class="row q-col-gutter-x-md q-col-gutter-y-lg">
          <div class="col-xs-12 col-sm-6 col-md-4" v-for="work in works" :key="work.id"
            :class="detailMode ? 'col-lg-3 col-xl-2': 'col-lg-2 col-xl-2'"
          >
            <OldWorkCard :metadata="work" :thumbnailMode="!detailMode" class="fit"/>
          </div>
        </div>

        <!--解决android平台hover事件不像safari那样及时响应的问题，需要手动添加触摸响应时间-->
        <div v-else-if="$q.platform.is.android && $q.platform.has.touch" class="row q-col-gutter-x-md q-col-gutter-y-lg">
          <div class="col-xs-12 col-sm-6 col-md-4" v-for="work in works" :key="work.id"
            @touchstart="()=>onWorkCardTouch(work.id)"
            :class="detailMode ? 'col-lg-3 col-xl-2': 'col-lg-2 col-xl-2'"
            :style="{ '--sim-hover-work-card': work.id === touchedWorkId ? '1' : '0'}"
          >
            <WorkCard :metadata="work" :thumbnailMode="!detailMode" class="fit"/>
          </div>
        </div>

        <!--正常的workCard展示-->
        <div v-else class="row q-col-gutter-x-md q-col-gutter-y-lg">
          <div class="col-xs-12 col-sm-6 col-md-4" v-for="work in works" :key="work.id"
            :class="detailMode ? 'col-lg-3 col-xl-2': 'col-lg-2 col-xl-2'"
            style="--sim-hover-work-card: 0"
          >
            <WorkCard :metadata="work" :thumbnailMode="!detailMode" class="fit"/>
          </div>
        </div>

        <div v-show="stopLoad" class="q-mt-lg q-mb-xl text-h6 text-bold text-center">无更多作品</div>

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
import RecentWorks from 'src/components/RecentWorks'
import { mapState } from 'vuex'
import OldWorkCard from 'src/components/OldWorkCard'
import { AdvanceSearchCondType } from '../utils.js'

export default {
  name: 'Works',

  mixins: [NotifyMixin],

  components: {
    WorkCard,
    OldWorkCard,
    WorkListItem,
    RecentWorks,
  },

  data () {
    return {
      listMode: false,
      showLabel: true,
      detailMode: true,
      stopLoad: false,
      works: [],
      pageTitle: '',
      searchMetas: [],
      page: 1,
      pagination: { currentPage:0, pageSize:12, totalCount:0 },
      seed: 7, // random sort

      // 排序种类，例如可以选择按照发售日期来排序结果
      sortCategoryOption: "release",
      sortCategoryOptions: ["release", "rating", "dl_count", "price", "rate_average_2dp", "review_count", "id", "created_at", "random"],

      nsfwOption: "nsfw_0", 
      nsfwOptions: ["nsfw_0", "nsfw_1", "nsfw_2"], // nsfw_0无年龄限制，nsfw_1全年龄，nsfw_2十八禁

      lyricOption: [], // 注意，这个选项可多选，但是clear的时候，quasar可能会将其设置为null，需要特别注意
      lyricOptions: ["lyric_local", "lyric_ai"],

      // 排序顺序，true表示降序，false表示升序
      sortInDesc: true,

      touchedWorkId: 0, // 用来解决android移动端设备没有hover事件导致workCard不能跟随手指显示标签的问题

      /*
        advanceSearchKeywords
        [
          {t: 1, d: "異世界"}, // 模糊匹配，目前只实现这一个
          {t: 2, d: "恋鈴桃歌"}, // 声优匹配，实际搜索字段在前端就要变成id
          {t: 3, d: "环绕音"}, // 标签匹配，实际搜索字段在前端就要变成id
          {t: 3, d: "治愈"}, // 标签匹配，实际搜索字段在前端就要变成id
          {t: 4, d: "Delivery Voice"}, // 社团匹配，实际搜索字段在前端就要变成id
        ]
      */
      editKeyword: "",
      advanceSearchKeywords: [],
      isAdvanceSearch: false,
    }
  },

  created () {
    this.refreshPageTitle();
    this.seed = Math.floor(Math.random() * 100);
  },

  mounted() {
    if (localStorage.sortCategoryOption) {
      this.sortCategoryOption = localStorage.sortCategoryOption;
    }
    if (localStorage.nsfwOption) {
      this.nsfwOption = localStorage.nsfwOption;
    }
    if (localStorage.lyricOption) {
      this.lyricOption = JSON.parse(localStorage.lyricOption);
    }
    if (localStorage.sortInDesc) {
      this.sortInDesc = (localStorage.sortInDesc === 'true');
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
    if (localStorage.advanceSearchKeywords) {
      this.advanceSearchKeywords = JSON.parse(localStorage.advanceSearchKeywords || "[]");
    }

    this.checkAdvanceSearchMode()
  },

  computed: {
    url () {
      const query = this.$route.query
      if (query.circleId) {
        return `/api/circles/${this.$route.query.circleId}/works`
      } else if (query.tagId) {
        return `/api/tags/${this.$route.query.tagId}/works`
      } else if (query.vaId) {
        return `/api/vas/${this.$route.query.vaId}/works`
      } else if (query.keyword || this.isAdvanceSearch) {
        // keyword should pass in as a query param later
        return `/api/search`
      } else {
        return '/api/works'
      }
    },

    advanceSearchBarHint() {
      if (this.editKeyword === "") return "模糊关键字，可搜索作品名、声优名、标签名、社团名"
      else return "按回车或者右侧加号添加"
    },

    ...mapState('AudioPlayer', [
      'oldWorkCardUIStyle',
    ]),
  },

  // keep-alive hooks
  // <keep-alive /> is set in MainLayout
  activated () {
    this.stopLoad = false
  },

  deactivated () {
    this.stopLoad = true
  },

  watch: {
    url () {
      this.reset()
    },

    sortCategoryOption (v) {
      localStorage.sortCategoryOption = v;
      this.reset()
    },

    nsfwOption (v) {
      localStorage.nsfwOption = v;
      this.reset()
    },

    lyricOption (v) {
      if (v === null) v = [];
      localStorage.lyricOption = JSON.stringify(v, null, 0);
      this.reset()
    },

    sortInDesc (v) {
      localStorage.sortInDesc = v;
      this.reset()
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

    advanceSearchKeywords(newValue) {
      localStorage.advanceSearchKeywords = JSON.stringify(newValue, null, 0)
      this.reset()
    },

    '$route.name': {
      handler: function() {
        // 高级搜索模式通过route.name进行判断，因此当这个属性变化的时候，需要及时更新状态，
        // 否则会出现url跳转到聚合搜索页面后，页面没有更新的问题，
        // 因为被vue复用组件了，需要重新检查一遍
        this.checkAdvanceSearchMode()
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
    onLoad (index, done) {
      this.requestWorksQueue()
        .then(() => done())
    },

    requestWorksQueue () {
      const params = {
        page: this.pagination.currentPage + 1 || 1,
        sort: this.sortInDesc ? "desc" : "asc",
        order: this.sortCategoryOption,
        nsfw: parseInt(this.nsfwOption.replace("nsfw_", "")), // 'nsfw_0' => 0, 'nsfw_1' => 1, 'nsfw_2' => 2
        lyric: this.lyricOption === null ? "" : this.lyricOption.map(o => o.replace("lyric_", "")).sort().join("_"), // ["lyric_local", "lyric_ai"] => "ai_local"
        seed: this.seed,
        isAdvance: this.isAdvanceSearch ? 1 : 0
      }

      if (this.isAdvanceSearch) {
        params.keyword = JSON.stringify(this.advanceSearchKeywords, null, 0)
      } else if (this.$route.query.keyword) {
        params.keyword = this.$route.query.keyword
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
      if (this.$route.query.circleId || this.$route.query.tagId || this.$route.query.vaId) {
        let url = '', restrict = ''
        if (this.$route.query.circleId) {
          restrict = 'circles'
          url = `/api/${restrict}/${this.$route.query.circleId}`
        } else if (this.$route.query.tagId) {
          restrict = 'tags'
          url = `/api/${restrict}/${this.$route.query.tagId}`
        } else {
          restrict = 'vas'
          url = `/api/${restrict}/${this.$route.query.vaId}`
        }

        this.$axios.get(url)
          .then((response) => {
            const name = response.data.name
            let pageTitle

            switch (restrict) {
              case 'tags':
                pageTitle = '搜索标签：'
                break
              case 'vas':
                pageTitle = '搜索声优：'
                break
              case 'circles':
                pageTitle = '社团作品：'
                break
            }
            // pageTitle += name || ''
            this.searchMetas = [name]
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
      } else if (this.$route.query.keyword) {
        this.pageTitle = '搜索关键字：';
        this.searchMetas = [this.$route.query.keyword];
      } else if (this.isAdvanceSearch) {
        this.pageTitle = '聚合搜索：'

      } else {
        this.pageTitle = '所有作品'
        this.searchMetas = [];
      }
    },

    reset () {
      this.seed = Math.floor(Math.random() * 100);
      this.stopLoad = true
      this.refreshPageTitle()
      this.pagination = { currentPage:0, pageSize:12, totalCount:0 }
      this.requestWorksQueue()
        .then(() => {
          this.stopLoad = false
        })
    },

    // 将一些标签名称转换成可阅读的文字
    // 例如排序属性中，有release作为标记，release通常用来直接传递给服务器，
    // 通过这个函数可以将release转换成更加可阅读的文字标签“发售日期”
    humanReadableLabel(label) {
      switch(label) {
        case "release": return "发售日期";
        case "rating": return "我的评价";
        case "dl_count": return "售出数量";
        case "price": return "售出价格";
        case "rate_average_2dp": return "听众评分";
        case "review_count": return "评论数量";
        case "id": return "作品番号";
        case "created_at": return "添加时间";
        case "random": return "随机排序";
        case "nsfw_0": return "所有分级";
        case "nsfw_1": return "全年龄";
        case "nsfw_2": return "十八禁";
        case "lyric_local": return "本地歌词";
        case "lyric_ai": return "AI歌词";
        default: return label;
      }
    },

    onWorkCardTouch(id) {
      this.touchedWorkId = id;
      console.log('touch on work id = ', id);
    },

    checkAdvanceSearchMode() {
      this.isAdvanceSearch = this.$route.name == "advance search";
    },

    onAddAdvanceSearchKeyword() {
      const keyword = this.editKeyword.trim()
      if (keyword === "") {
        this.showErrNotif("无法添加空白的关键字");
        return;
      }

      for (let kw of this.advanceSearchKeywords) {
        if (kw.t == AdvanceSearchCondType.FUZZY && kw.d == keyword) {
          this.showErrNotif("关键字重复，添加失败");
          return;
        }
      }


      this.advanceSearchKeywords.push({
        t: AdvanceSearchCondType.FUZZY,
        d: keyword,
      });
      this.editKeyword = "";
      this.reset();
    },

    removeAdvanceSearchKeyword(index) {
      this.advanceSearchKeywords.splice(index, 1);
    }

  },
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
.search-tag-close-btn {
  background: rgba(144, 144, 144, 0.4);
  color: white
}
</style>

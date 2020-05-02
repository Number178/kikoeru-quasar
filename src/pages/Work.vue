<template>
  <div>
    <WorkDetails :metadata="metadata" />
    <!-- <WorkQueue :queue="tracks" :editable="false" /> -->
    <WorkTree :tree="tree" :editable="false" />
  </div>
</template>

<script>
import WorkDetails from 'components/WorkDetails'
// import WorkQueue from 'components/WorkQueue'
import WorkTree from 'components/WorkTree'

export default {
  name: 'Work',

  components: {
    WorkDetails,
    // WorkQueue,
    WorkTree
  },

  data () {
    return {
      workid: this.$route.params.id,
      metadata: {
        id: parseInt(this.$route.params.id),
        circle: {}
      },
      tree: []
    }
  },

  created () {
    this.requestData()
  },

  methods: {
    requestData () {
      this.$axios.get(`/api/work/${this.workid}`)
        .then(response => {
          this.metadata = response.data
        })
        .catch((error) => {
          throw new Error(`Failed to request /api/work/${this.workid}`)
        })

      this.$axios.get(`/api/tracks/${this.workid}`)
        .then(response => {
          this.tree = response.data
        })
        .catch((error) => {
          throw new Error(`Failed to request /api/tracks/${this.workid}`)
        })
    }
  }
}
</script>

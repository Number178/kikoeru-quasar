<template>
  <div>
    <WorkDetails :metadata="metadata" />
    <WorkQueue :queue="tracks" :editable="false" />
  </div>
</template>

<script>
import WorkDetails from 'components/WorkDetails'
import WorkQueue from 'components/WorkQueue'

export default {
  name: 'Work',

  components: {
    WorkDetails,
    WorkQueue,
  },

  data () {
    return {
      workid: this.$route.params.id,
      metadata: {
        id: parseInt(this.$route.params.id),
        circle: {}
      },
      tracks: []
    }
  },

  created () {
    this.requestData()
  },

  methods: {
    requestData () {
      const metadataPromise = this.$axios.get(`/api/work/${this.workid}`)
      const tracksPromise = this.$axios.get(`/api/tracks/${this.workid}`)

      Promise.all([metadataPromise, tracksPromise])
        .then(response => {
          this.metadata = response[0].data
          this.tracks = response[1].data.concat()
        })
        .catch((error) => {
          throw new Error(`Failed to request /api/work/${this.workid} or /api/tracks/${this.workid}`)
        })
    }
  }
}
</script>

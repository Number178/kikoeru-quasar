<template>
  <q-card :dark="false" class="shadow-4">
    <q-card-section class="q-pa-none">
      <WorkDetails :metadata="metadata" />
    </q-card-section>
  </q-card>   
</template>

<script>
import WorkDetails from 'components/WorkDetails'

export default {
  name: 'WorkCard',

  components: {
    WorkDetails
  },

  props: {
    workid: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      metadata: {
        id: this.workid,
        circle: {}
      }
    }
  },

  created () {
    this.requestMetadata(this.workid)
  },

  watch: {
    workid (newWorkid, oldWorkid) {
      this.requestMetadata()
    }
  },

  methods: {
    requestMetadata () {
      if (this.workid) {
        this.$axios.get(`/api/work/${this.workid}`)
          .then((response) => {
            this.metadata = response.data
          })
      } 
    }
  }
}
</script>

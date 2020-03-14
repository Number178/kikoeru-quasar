<template>
  <div>
    <q-list bordered separator class="q-ma-sm">
      <q-item class="shadow-4">
        <!-- 占位 -->
        <q-item-section avatar />

        <q-item-section>
          File Name
        </q-item-section>
     
        <q-item-section avatar v-if="editable">
          <q-icon v-ripple @click="emptyQueue()" name="delete" class="cursor-pointer" />
        </q-item-section>
      </q-item>

      <draggable v-model="queueCopy" handle=".handle" @change="val => onMoved(val.moved)">
        <q-slide-item
          @left="details => onLeft(details, index)"
          v-for="(file, index) in queueCopy"
          :key="index"
          left-color="red"
          class="shadow-4"
        >
          <template v-slot:left v-if="editable">
            <q-icon name="delete" />
          </template>

          <q-item
            :active="itemActive(index)"
            active-class="text-white bg-teal"
          >
            <q-item-section avatar>
              <q-btn round color="primary" :icon="playIcon(index)" @click="onClickPlayButton(index)" class="shadow-4" />
            </q-item-section>

            <q-item-section>
              <div> {{file.title}} </div>
              <div class="text-grey"> {{file.subtitle}} </div>
            </q-item-section>

            <q-item-section avatar class="handle" v-if="editable">
              <q-icon name="reorder" />
            </q-item-section>

            <q-item-section avatar v-if="!editable">
              <q-btn flat icon="more_vert">
                <q-menu auto-close transition-show="jump-down" transition-hide="jump-up">
                  <q-list separator style="min-width: 150px">
                    <q-item clickable @click="addToQueue(queueCopy[index])">
                      <q-item-section>Add to queue</q-item-section>
                    </q-item>

                    <q-item clickable @click="playNext(queueCopy[index])">
                      <q-item-section>Play next</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-slide-item>      
      </draggable>
    </q-list>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import { mapGetters } from 'vuex'

export default {
  name: 'Work',

  data() {
    return {
      dragging: false,
      queueCopy: this.queue.concat()
    }
  },

  components: {
    draggable,
  },

  props: {
    queue: {
      type: Array,
      required: true,
    },
    editable: {
      type: Boolean,
      required: true
    },
  },

  watch: {
    queue (newQueue, oldQueue) {
      this.queueCopy = newQueue.concat()
    }
  },

  computed: {
    playIcon () {
      return function (index) {
        return this.playing && this.ifItemIsSelected(index) ? "pause" : "play_arrow"        
      }      
    },

    itemActive () {
      return function (index) {
        return this.ifItemIsSelected(index)
      }
    },

    playing () {
      return this.$store.state.AudioPlayer.playing
    },
    
    queueIndex () {
      return this.$store.state.AudioPlayer.queueIndex
    },

    ...mapGetters({
      currentlyPlayingHash: 'AudioPlayer/currentlyPlayingHash'
    })
  },

  methods: {
    ifItemIsSelected (index) {
      return this.editable
        ? this.queueIndex === index
        : this.currentlyPlayingHash === this.queueCopy[index].hash
    },

    onClickPlayButton (index) {
      if (this.ifItemIsSelected(index)) {
        this.$store.commit('AudioPlayer/TOGGLE_PLAYING')
      } else {
        this.$store.commit('AudioPlayer/SET_QUEUE', {
          queue: this.queueCopy.concat(),
          index: index,
          resetProgress: true,
          resetPlaying: true
        })
      }
    },
    
    addToQueue (file) {
      this.$store.commit('AudioPlayer/ADD_TO_QUEUE', file)
    },

    removeFromQueue (index) {
      this.$store.commit('AudioPlayer/REMOVE_FROM_QUEUE', index)
    },
    
    onLeft (details, index) {
      details.reset()
      this.removeFromQueue(index)
    },

    playNext (file) {
      this.$store.commit('AudioPlayer/PLAY_NEXT', file)
    },
    
    onMoved(moved) {
      var index
      if (moved.oldIndex === this.queueIndex) {
        index = moved.newIndex
      } else if (moved.oldIndex < this.queueIndex && moved.newIndex >= this.queueIndex) {
        index = this.queueIndex - 1
      } else if (moved.oldIndex > this.queueIndex && moved.newIndex <= this.queueIndex) {
        index = this.queueIndex + 1
      } else {
        index = this.queueIndex
      }
   
      this.$store.commit('AudioPlayer/SET_QUEUE', {
        queue: this.queueCopy.concat(),
        index: index,
        resetProgress: false,
        resetPlaying: false
      })
    },

    emptyQueue () {
      this.$store.commit('AudioPlayer/EMPTY_QUEUE')
      this.$router.push('/')
    },
  }
}
</script>

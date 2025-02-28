<template>
  <input type="checkbox"
         v-model="checked"
         @change="$event => handleChange($event)"
         :disabled="disabled"
  />
</template>

<script>
export default {
  name: 's-table-private-checkbox',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      checked: false,
    }
  },
  watch: {
    value(newVal) {
      this.checked = newVal;
    }
  },
  mounted() {
    this.checked = this.value;
  },
  methods: {
    handleChange(evt) {
      this.$emit('change', evt, this.checked);
    }
  }
}
</script>
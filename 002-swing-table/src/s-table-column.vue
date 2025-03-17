<template>
  <div class="s-table-column">
    <slot v-bind="cellDataTemp"></slot>
  </div>
</template>

<script>
export default {
  name: 's-table-column',
  props: {
    label: String,
    prop: String,
    width: Number,
    // 列类型
    type: {
      // 取值 selection index normal
      type: String,
      default: 'normal',
    },
    // type为selection有效
    selectable: {
      // 需返回值 [true, false, 'none']  none时不显示多选框
      // 函数参数 row, col, rowIndex, colIndex
      type: Function,
      default: () => true,
    },
    // 占的列宽
    colspan: {
      type: Number,
      default: 1,
    },
    // 是否固定列
    fixed: {
      // 取值 [true, 'left', 'right']  true等效left
      type: [Boolean, String],
      default: false
    },
    // 对齐方式
    align: {
      // 取值 ['left', 'center', 'right']
      type: String,
      default: 'left',
    },
    resizeDisable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      cellDataTemp: {
        $index: 0,
        row: {},
        col: {},
      }
    }
  },
  mounted() {
  }
}
</script>

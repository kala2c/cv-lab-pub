<template>
  <div class="swing-table-root table-container"
       :class="{
          'fixed-head': fixedHead,
       }"
  >
    <div class="top-border"></div>
    <div class="table-scroll-container">
      <table class="swing-table">
        <colgroup>
          <col v-for="col in columnList" :key="col._uid" :style="{
            width: col.propsData.width + 'px',
            'min-width': col.propsData.width + 'px',
            'max-width': col.propsData.width + 'px',
          }" />
        </colgroup>
        <s-table-private-thead
          ref="thead"
          @update-column-list="handleUpdateColumnList" :tableDefaultSlot="$slots.default"
        >
          <!-- 将s-table的默认slot传递给表头 即s-table-column信息 -->
          <slot name="default"></slot>
        </s-table-private-thead>
        <tbody class="table-body">
        <tr
            v-for="(row, rowIndex) in data"
            :key="row._id"
            :style="rowStyle(row, rowIndex)"
            :class="mergeClass(rowClass(row, rowIndex), [highlightIndex === rowIndex ? 'highlight': ''])"
            @click.capture="handleRowClick(row, rowIndex)"
        >
          <template v-for="(col, colIndex) in columnList" :key="col._uid">
            <s-table-private-td
                :rowIndex="rowIndex"
                :colIndex="colIndex"
                :row="row"
                :col="col"
                :span-method="spanMethod"
                :render-method="col.$scopeSlots.default"
                :style="cellStyle(row, col.propsData, rowIndex, colIndex)"
                :class="cellClass(row, col.propsData, rowIndex, colIndex)"
                @click="handleCellClick(row, col.propsData, rowIndex, colIndex)"
            />
          </template>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "swing-table",
  props: {
    data: Array,
    // 行或列合并
    spanMethod: Function,
    // 是否固定表头
    fixedHead: {
      type: Boolean,
      default: false,
    },
    // 行样式
    rowStyle: {
      type: [Function],
      default() {
        return function () {
          return '';
        }
      },
    },
    // 行class
    rowClass: {
      type: Function,
      default() {
        return '';
      },
    },
    // 单元格样式
    cellStyle: {
      type: Function,
      default() {
        return function () {
          return '';
        }
      },
    },
    // 单元格class
    cellClass: {
      type: Function,
      default() {
        return '';
      },
    },
    rowHighlight: [Function, Boolean],
    selectedRows: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      columnList: [],
      innerId: 0,
      highlightIndex: '',
      selectedRowsRaw: [],
      allSelected: Vue.observable({ state: 0 })
    }
  },
  computed: {
    tableData() {
      return this.data.map(row => {
        if (!row._id) row._id = this.innerId ++;
        return row;
      });
    },
    // 可以进行选择的行
    tableDataSelectable() {
      return this.tableData.filter(o => o.isSelectable === true);
    },
  },
  watch: {
    selectedRows: {
      handler(newVal) {
        this.selectedRowsRaw = newVal;
        this.syncSelectedData();
      },
      deep: true,
      immediate: true,
    }
  },
  provide() {
    return {
      $getColOffset: this.$getColOffset,
      allSelected: this.allSelected,
      checkSelected: this.checkSelected,
      selectedRows: this.selectedRowsRaw,
      handleAllSelectionChange: this.handleAllSelectionChange,
      handleSelectionChange: this.handleSelectionChange,
    }
  },
  emits: ['row-click', 'cell-click'],
  mounted() {
    this.initResizeCol();
  },
  methods: {
    handleUpdateColumnList(columnList) {
      this.columnList = columnList;
    },
    /**
     * 行点击事件
     * @param row
     * @param rowIndex
     */
    handleRowClick(row, rowIndex) {
      if (this.rowHighlight instanceof Function) {
        const isHighlight = this.rowHighlight(row, rowIndex);
        if (isHighlight) this.highlightIndex = rowIndex;
      } else if (this.rowHighlight === false) {
        this.highlightIndex = -1;
      } else {
        this.highlightIndex = rowIndex;
      }
      this.$emit('row-click', row, rowIndex);
    },
    /**
     * 单元格点击事件
     * @param row
     * @param col
     * @param rowIndex
     * @param colIndex
     */
    handleCellClick(row, col, rowIndex, colIndex) {
      this.$emit('cell-click', row, col, rowIndex, colIndex);
    },
    checkSelected(rowIndex, colIndex) {
      return this.selectedRowsRaw.indexOf(this.data[rowIndex]) > -1;
    },
    handleAllSelectionChange(evt, checked) {
      if (checked) {
        this.selectedRowsRaw = this.tableDataSelectable.slice(0);
      } else {
        this.selectedRowsRaw = [];
      }
      this.syncSelectedData();
    },
    /**
     * 多选框选择事件
     * @param evt
     * @param checked
     * @param rowIndex
     * @param colIndex
     */
    handleSelectionChange(evt, checked, rowIndex, colIndex) {
      const row = this.data[rowIndex];
      const idx = this.selectedRowsRaw.indexOf(row);
      if (checked) {
        if (idx === -1) this.selectedRowsRaw.push(row);
      } else {
        if (idx > -1) this.selectedRowsRaw.splice(idx, 1);
      }
      this.syncSelectedData();
    },
    syncSelectedData() {
      // 全选状态为可选项全部选中且可选项不为空
      this.allSelected.state =
          this.selectedRowsRaw.length === this.tableDataSelectable.length
          && this.selectedRowsRaw.length > 0;
      this.$emit('update:selectedRows', this.selectedRowsRaw);
    },
    getSelectedRows() {
      return this.selectedRowsRaw;
    },
    /**
     * 获取列偏移量
     * @param index 列号
     * @param isRight 是否右侧
     */
    $getColOffset(index, isRight) {
      const colList = this.columnList.slice(0);
      if (isRight) {
        colList.reverse();
        index = colList.length - index - 1;
      }
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += 1; // 边框
        offset += parseInt(colList[i].propsData.width);
      }
      return offset;
    },
    /**
     * 合并class
     * class的类型 object，string，array
     * object和string转为array，最终合并array
     */
    mergeClass(a, b) {
      let tmpA = a || {};
      let tmpB = b || {};
      if (typeof tmpA === 'string') {
        tmpA = tmpA.split(' ').filter(o => !!o);
      }
      if (typeof tmpB === 'string') {
        tmpB = tmpB.split(' ').filter(o => !!o);
      }
      if (typeof tmpA !== 'object') tmpA = {};
      if (typeof tmpB !== 'object') tmpB = {};

      let tmpA1 = [];
      let tmpB1 = [];

      if (tmpA instanceof Array) {
        tmpA1 = tmpA.slice(0);
      } else {
        for (let key in tmpA) {
          tmpA1.push(tmpA[key] ? key : '');
        }
      }

      if (tmpB instanceof Array) {
        tmpB1 = tmpB.slice(0);
      } else {
        for (let key in tmpB) {
          tmpB1.push(tmpB[key] ? key : '');
        }
      }
      return tmpA1.concat(tmpB1);
    },
    /**
     * 初始化拖拽调整列宽
     */
    initResizeCol() {
      let startX, startWidth, selectCol;
      document.addEventListener('mousedown', (e) => {
        const el = e.target;
        if (el.className.indexOf('resizer') > -1) {
          const colUid = el.getAttribute('data-uid');
          const cols = this.columnList.filter(o => o._uid+'' === colUid+'');
          selectCol = cols[0] || null;
          if (!selectCol) return;
          startX = e.pageX;
          if (selectCol.propsData.width) {
            startWidth = parseInt(selectCol.propsData.width);
          } else {
            startWidth = el.parentNode.offsetWidth;
          }
        }
      });
      document.addEventListener('mousemove', (e) => {
        if (!selectCol) return;
        // const el = e.target;
        // if (el.className.indexOf('resizer') > -1) {
          const newWidth = startWidth + (e.pageX - startX);
          selectCol.propsData.width = newWidth;
        // }
      });
      document.addEventListener('mouseup', (e) => {
        startX = 0;
        startWidth = 100;
        selectCol = null;
      });
      setTimeout(() => {
        const tableHead = this.$el.getElementsByClassName('table-head')[0];
        if (tableHead) {
          const resizerList = tableHead.getElementsByClassName('resizer');
          for (let i = 0; i < resizerList.length; i++) {
            resizerList[i].style.height = tableHead.offsetHeight + 'px';
          }
        }
      }, 1000);
    },
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
.swing-table-root {
  // 布局
  &.table-container {
    box-sizing: border-box;
    position: relative;
    height: 100%;
    .table-scroll-container {
      height: 100%;
      overflow: auto;
    }
  }
  // 基础样式
  table.swing-table {
    border-collapse: collapse; /* 合并表格边框 */
    th, td {
      border: 1px solid #ccc; /* 单元格边框 */
      font-size: 12px;
      font-weight: normal;
      vertical-align: middle;
    }
  }
  // 表头样式
  .swing-table .table-head th,
  .swing-table .table-head td {
    text-align: center;
    vertical-align: middle;
    background-color: #EEEEEE;
    border: 1px solid #7A8A99;
    input, label {
      position: relative;
      z-index: 1001;
    }
  }
  // 拖拽
  .swing-table .table-head th {
    position: relative;
  }
  .swing-table .table-head th .resizer {
    position: absolute;
    bottom: 0;
    right: -4px;
    width: 7px;
    height: 100%;
    cursor: ew-resize;
    z-index: 99999;
  }
  // 单元格样式
  .swing-table-cell {
    box-sizing: border-box;
    display: block;
    height: 100%;
    overflow: hidden;
    padding: 2px 5px 1px;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: default;
  }
  // 滚动条样式
  .table-scroll-container {
    &::-webkit-scrollbar {
      width: 15px; /* 垂直滚动条的宽度 */
      height: 15px; /* 水平滚动条的高度 */
    }
    //滚动条的轨道
    &::-webkit-scrollbar-track {
      background: #EEEEEE;
      border: 1px solid #6382BF;
    }
    // 滚动条滑块
    &::-webkit-scrollbar-thumb:horizontal {
      background: url("data:png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAABACAYAAABFqxrgAAAAAXNSR0IArs4c6QAAAMFJREFUeF7t2rsJgDAUBdCX0TKLe1g4gQs4i26mhSCixqSy8VgHhEdy7/GTumFeo34tU59zfVl9xZf3a7lXihhTy8KIMARD2He4nWAIdsKR9o6D4+A4OA5n/skEmSATZIJMuDwUC0bBKBgFo2AUjPf3pdpBO2gH7aAdtIN2ePyeqCJVpIpUkSpSRapIFVn66YgTOIETOIETOIETOIETShPgBE7gBE7gBE7gBE7ghJcJwBIswRIswRIswRIswdKPsbQBPHtNbo5Cy8QAAAAASUVORK5CYII=") no-repeat center center / 8px 8px,  linear-gradient(#DDE8F3, #FFFFFF, #DDE8F3, #BDD2E7);
      border: 1px solid #6382BF;
    }
    &::-webkit-scrollbar-thumb:vertical {
      background: url("data:png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABBCAYAAABhNaJ7AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABvSURBVHhe7dnBDcJAEARBm1QhEidASA7NCGmy6KpP33teJ+35vu7nCHutWQZYswywZhlgzcoP8P8I3XsDAAAAQIDb4JplgDXLAGuWAdas/ABugwAAAAA1TmNrlgHWLAOsWQZYs/IDnJ/r/u4ddBw/GuIPGnp9DYAAAAAASUVORK5CYII=") no-repeat center center / 8px 8px, linear-gradient(to right, #DDE8F3, #FFFFFF, #DDE8F3, #BDD2E7);
      border: 1px solid #6382BF;
    }
    /* 滚动条滑块hover时 */
    /*.&::-webkit-scrollbar-thumb:hover {*/
    /*}*/
  }
  // 表格点击选中高亮
  .swing-table tbody tr.highlight {
    background-color: #B8CFE5;
  }
  //序号列样式
  .swing-table td.index-td {
    background-color: #EEEEEE;
    text-align: center;
    border: 1px solid #7A8A99;
  }
  // 列固定样式
  .swing-table {
    th.fixed-corner,
    td.fixed-corner {
      z-index: 1100;
    }
  }

  /* 首列固定 start  ------------- */
  .fixed-col {
    position: sticky!important;
    z-index: 990;
    background-color: inherit;
  }
  .fixed-col::after {
    content: "";
    position: absolute;
    top: -1px;
    right: -1px;
    width: 100%;
    height: 100%;
    border: 1px solid #7A8A99;
  }
  /* 首列固定 end  ------------- */

  /* 表头固定 start ----------- */
  &.table-container.fixed-head {
    .table-head {
      position: sticky;
      top: 0;
      z-index: 998;
      th, td {
        position: relative;
      }
      th:after, td:after {
        content: "";
        position: absolute;
        top: -1px;
        left: -1px;
        width: 100%;
        height: 100%;
        border: 1px solid #7A8A99;
      }
    }
  }
  /* 表头固定 end ----------- */
}
</style>
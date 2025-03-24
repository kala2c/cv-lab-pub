<script>
export default {
  name: 's-table-private-td',
  render(h) {
    const { type, fixed, prop, align } = this.col.propsData;
    // 子元素
    let child;
    const classList = [];
    const style = {
      textAlign: align || 'left',
    };
    // 固定列判断
    if (fixed) {
      classList.push('fixed-col');
      const isRight = fixed === 'right';
      const offset = this.$getColOffset(this.colIndex, isRight);
      if (isRight) {
        style.right = offset + 'px';
      } else {
        style.left = offset + 'px';
      }
    }
    if (type === 'normal') {
      // 普通列
      const cellData = {
        $index: this.rowIndex,
        row: this.row,
        col: this.col.propsData
      }
      child = this.renderMethod ? this.renderMethod(cellData) : this.row[prop];
    } else if (type === 'selection') {
      // 多选框列
      const selectableFunc = this.col.propsData.selectable;
      let isSelectable = true;
      if (typeof selectableFunc === 'function') {
        isSelectable = selectableFunc(this.row, this.rowIndex);
      }
      this.row.isSelectable = isSelectable;
      if (typeof isSelectable === 'boolean') {
        // 多选框列
        child = h('div', {
          style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }, [h('s-table-private-checkbox', {
          props: {
            disabled: !isSelectable,
            value: this.checkSelected(this.rowIndex, this.colIndex),
            // value: this.selectedRows(this.rowIndex, this.colIndex),
          },
          on: {
            change: (evt, checked) => {
              if (isSelectable) {
                this.handleSelectionChange(evt, checked, this.rowIndex, this.colIndex);
              }
            }
          }
        })]);
      } else {
        // 给定的不显示多选框的值为none
        // 实际非boolean时均不显示多选框
        child = '';
      }
    } else if (type === 'index') {
      // 序号列
      child = this.rowIndex + 1;
      style.textAlign = 'center';
      classList.push('index-td');
    } else {
      child = this.row[prop];
    }
    return this.createCell(child, style, classList);
  },
  props: {
    row: Object,
    col: Object,
    rowIndex: Number,
    colIndex: Number,
    // selection
    selected: {
      type: Boolean,
      default: false,
    },
    // s-table-column的#default插槽
    renderMethod: Function,
    spanMethod: Function,
  },
  inject: ['$getColOffset', 'checkSelected', 'handleSelectionChange'],
  computed: {
    span() {
      if (typeof this.spanMethod !== 'function') {
        return {
          rowspan: 1,
          colspan: 1,
        }
      }
      // 调用自定义方法获取合并信息
      const span = this.spanMethod(this.row, this.col.propsData, this.rowIndex, this.colIndex);
      if (!span) {
        return {
          rowspan: 1,
          colspan: 1,
        }
      }
      if (span instanceof Array) {
        return {
          rowspan: span[0],
          colspan: span[1],
        }
      }
      return span;
    }
  },
  emits: ['selection-change'],
  methods: {
    // 创建单元格元素
    createCell(child, style, classList) {
      const h = this.$createElement;
      if (this.span.rowspan < 1 || this.span.colspan < 1) {
        return null;
      }
      const params = {
        attrs: {
          rowspan: this.span.rowspan,
          colspan: this.span.colspan,
        },
        style,
      }
      if (classList && classList.length > 0) {
        params.class = classList;
      }
      let tipTitle = '';
      const tipTitleFunc = this.col.propsData.tipTitle;
      if (typeof tipTitleFunc === 'function') {
        tipTitle = tipTitleFunc(this.row, this.col.propsData, this.rowIndex, this.colIndex);
      } else if (tipTitleFunc === true) {
        tipTitle = this.row[this.col.propsData.prop];
      }
      const content = h('div', {
        class: 'swing-table-cell',
        style: {
          width: this.col.propsData.width + 'px',
        },
        attrs: {
          title: tipTitle,
        },
      }, [child]);
      return h('td', params, [content]);
    }
  }
}
</script>

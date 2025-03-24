<script>
export default {
  name: 's-table-private-th',
  render(h) {
    const { type, fixed, label } = this.col.propsData;
    // 子元素
    let child;
    const classList = [];
    const style = {};
    if (fixed) {
      classList.push('fixed-col', 'fixed-corner');
      const isRight = fixed === 'right';
      const offset = this.$getColOffset(this.colIndex, isRight);
      if (isRight) {
        style.right = offset + 'px';
      } else {
        style.left = offset + 'px';
      }
    }
    if (type === 'normal') {
      const cellData = {
        col: this.col.propsData,
      }
      child = this.renderMethod ? this.renderMethod(cellData) : label;
    } else if (type === 'selection') {
      child = h('div', {
        style: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }
      }, [h('s-table-private-checkbox', {
        props: {
          // disabled: false,
          value: this.allSelected.state,
        },
        on: {
          change: (evt, checked) => {
            this.handleAllSelectionChange(evt, checked, this.rowIndex, this.colIndex)
          }
        }
      }), this.message]);
    } else if (type === 'index') {
      child = label;
      classList.push('index-td');
    } else {
      child = label;
    }
    const children = [this.createCell(child)];
    if (this.col.isLeaf && !this.col.propsData.resizeDisable) {
      children.push(h('div', {
        class: ['resizer'],
        attrs: {
          'data-uid': this.col._uid,
        },
      }))
    }
    return h('th', {
      attrs: {
        rowspan: this.rowspan,
        colspan: this.colspan,
      },
      style,
      class: classList,
    }, children);
  },
  props: {
    col: Object,
    rowspan: [Number, String],
    colspan: [Number, String],
    rowIndex: Number,
    colIndex: Number,
    // s-table-column的#header插槽
    renderMethod: Function,
  },
  inject: ['$getColOffset', 'allSelected', 'handleAllSelectionChange'],
  methods: {
    createCell(child) {
      return this.$createElement('div', {
        class: 'swing-table-th',
        attrs: {
          // title: this.col.propsData.label || '',
        },
        style: {
          display: 'block',
          width: this.col.propsData.width + 'px',
          boxSizing: 'border-box',
          padding: '2px 5px',
          // textOverflow: 'ellipsis',
          // whiteSpace: 'nowrap',
          cursor: 'default'
        }
      }, [child]);
    }
  }
}
</script>

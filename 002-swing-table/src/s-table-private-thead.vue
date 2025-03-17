<template>
  <thead class="table-head">
  <div style="display: none"><slot></slot></div>
  <tr v-for="(row, rowIndex) in headRows" :key="rowIndex">
    <s-table-private-th
        v-for="(col, colIndex) in row"
        :key="col._uid"
        :col="col"
        :rowIndex="rowIndex"
        :colIndex="colIndex"
        :rowspan="col.rowspan"
        :colspan="col.colspan"
        :renderMethod="col.$scopeSlots.header"
    />
  </tr>
  </thead>
</template>
<script>
export default {
  name: 's-table-private-thead',
  props: {
    tableDefaultSlot: Object,
  },
  data() {
    return {
      // isRender: false,
      headRows: [],
      columnList: [],
      columnSnapshot: '',
    }
  },
  watch: {
    tableDefaultSlot: {
      handler() {
        this.$nextTick(() => {
          this.createTHeadStruct();
        });
      },
      deep: true,
      immediate: true,
    }
  },
  emits: ['update-column-list'],
  methods: {
    createTHeadStruct() {
      // 表头行信息 二维数据 tr > th
      const headRows = [];
      // 数据列 即叶子节点
      const columnList = [];
      // 递归路径缓存 根据路径可以找到当前节点的所有父节点
      const traceCache = {};
      // 表头最大深度
      let maxDepth = 0;
      /**
       * 递归获取表头行信息
       * @param pNode 当前节点
       * @param depth 当前节点深度
       * @param trace 节点路径-存储当前节点的所有父节点
       */
      const recursion = (pNode, depth, trace) => {
        // 只处理s-table-column
        const componentOptions = pNode.componentOptions || {};
        if (!pNode.isRoot && componentOptions.tag !== 's-table-column') return;
        const componentInstance = pNode.componentInstance || {};
        // 记录深度
        maxDepth = Math.max(maxDepth, depth);
        const propsData = componentInstance._props || {};
        // 创建节点数据
        const column = {
          // 节点唯一标识 使用vue的_uid
          _uid: componentInstance._uid,
          // s-table-column的props
          propsData,
          rowspan: 1,
          colspan: propsData.colspan || 1,
          depth,
          nodeDepth: 0,
          leafList: [],
          render: pNode,
          isLeaf: false,
          $scopeSlots: componentInstance.$scopedSlots,
          $slot: componentInstance.$slots,
        };
        // 缓存节点路径
        if (trace !== '') {
          if (traceCache[trace]) {
            traceCache[trace].push(column);
          } else {
            const arr = trace.split('-');
            arr.pop();
            const parentCache = traceCache[arr.join('-')] || [];
            traceCache[trace] = parentCache.slice(0).concat(column);
          }
        }
        // 遍历子节点
        let isLeaf = true;
        componentOptions.children && componentOptions.children.forEach((child, index) => {
          if (child.componentOptions && child.componentOptions.tag === 's-table-column') {
            isLeaf = false; // 存在子节点为s-table-column，则当前节点不是叶子节点
            const newTrace = trace === '' ? index + '' : trace + '-' + index;
            recursion(child, depth + 1, newTrace);
          }
        });
        column.isLeaf = isLeaf;
        // 将当前节点加入到表头行信息中
        if (depth > 0) {
          if (headRows[depth-1]) {
            headRows[depth-1].push(column);
          } else {
            headRows[depth-1] = [column];
          }
        }
        // 如果子节点中没有s-table-column，则当前节点为叶子节点
        if (isLeaf) {
          columnList.push(column);
          traceCache[trace] && traceCache[trace].forEach((node) => {
            // 计算父节点拥有的节点深度
            node.nodeDepth = depth - node.depth;
            // 将叶子节点加入到父节点的leafList中
            if (node.depth < column.depth) {
              node.leafList.push(column);
            }
          });
        }
      }
      // 创建虚拟根节点 用于递归
      const rootNode = {
        isRoot: true,
        componentOptions: {
          children: this.tableDefaultSlot,
          tag: '',
          propsData: {}
        },
        componentInstance: {
          $scopedSlots: null,
          $slot: null
        },
      }
      recursion(rootNode, 0, '');
      // 遍历headRows，计算rowspan和colspan
      headRows.forEach(row => {
        row.forEach(col => {
          // 计算colspan  非叶子节点，colspan等于所拥有的全部叶子节点的colspan之和
          if (col.leafList.length > 0) {
            col.colspan = col.leafList.reduce((acc, leaf) => {
              return parseInt(acc) + parseInt(leaf.colspan);
            }, 0);
          }
          // 计算rowspan 等于 最大深度 - 当前节点深度 + 1 - 子节点深度
          col.rowspan = maxDepth - col.depth + 1 - col.nodeDepth;
        });
      });
      const columnSnapshot = columnList.map(o => o._uid).join();
      if (this.columnSnapshot === columnSnapshot) return;
      this.columnSnapshot = columnSnapshot;
      this.headRows = headRows;
      this.columnList = columnList;
      // 将列信息传递给父组件
      this.$emit('update-column-list', columnList);
    }
  },
}
</script>

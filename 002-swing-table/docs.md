# 使用文档

文档由cursor自动生成

`swing-table` 和 `s-table-column` 是一对Vue表格组件，提供灵活的表格展示功能，包括固定表头、固定列、行选择、单元格合并等特性。

## 组件概述

### swing-table

主表格组件，负责表格的整体渲染和交互控制。提供了固定表头、行高亮、行选择等功能。

### s-table-column

列定义组件，用于声明表格的每一列及其相关属性。支持普通列、选择列、序号列等类型，可以设置固定列、自定义渲染等功能。

## swing-table 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|-------|------|
| data | Array | - | 表格数据 |
| spanMethod | Function | - | 合并单元格的方法 |
| fixedHead | Boolean | false | 是否固定表头 |
| rowStyle | Function | () => '' | 行样式计算函数 |
| rowClass | Function | () => '' | 行类名计算函数 |
| cellStyle | Function | () => '' | 单元格样式计算函数 |
| cellClass | Function | () => '' | 单元格类名计算函数 |
| rowHighlight | Function/Boolean | - | 行高亮控制 |
| selectedRows | Array | [] | 已选择的行（用于多选功能） |

## swing-table 事件

| 事件名称 | 说明 | 参数 |
|---------|------|------|
| row-click | 行点击事件 | (row, rowIndex) |
| cell-click | 单元格点击事件 | (row, col, rowIndex, colIndex) |
| update:selectedRows | 选中行更新事件 | selectedRows |

## s-table-column 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|-------|------|
| label | String | - | 列标题 |
| prop | String | - | 列数据属性名 |
| width | Number | - | 列宽度 |
| type | String | 'normal' | 列类型，可选值: 'normal', 'selection', 'index' |
| selectable | Function | () => true | 行是否可选择（type为selection时有效） |
| colspan | Number | 1 | 列合并数 |
| fixed | Boolean/String | false | 固定列，可选值: true/'left'/'right' |
| align | String | 'left' | 对齐方式，可选值: 'left', 'center', 'right' |

## 基本使用示例

```vue
<template>
  <div style="height: 400px;">
    <swing-table
      :data="tableData"
      :fixed-head="true"
      :row-highlight="true"
      @row-click="handleRowClick"
    >
      <!-- 选择列 -->
      <s-table-column
        type="selection"
        width="50"
        fixed="left"
      />
      
      <!-- 索引列 -->
      <s-table-column
        type="index"
        label="序号"
        width="60"
      />
      
      <!-- 普通数据列 -->
      <s-table-column
        label="姓名"
        prop="name"
        width="120"
      />
      
      <!-- 自定义渲染列 -->
      <s-table-column
        label="年龄"
        prop="age"
        width="100"
        align="right"
      >
        <template v-slot="{ row }">
          {{ row.age }} 岁
        </template>
      </s-table-column>
      
      <!-- 操作列 -->
      <s-table-column
        label="操作"
        width="150"
      >
        <template v-slot="{ row, $index }">
          <button @click.stop="handleEdit(row, $index)">编辑</button>
          <button @click.stop="handleDelete(row, $index)">删除</button>
        </template>
      </s-table-column>
    </swing-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableData: [
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 30 },
        { id: 3, name: '王五', age: 28 }
      ]
    }
  },
  methods: {
    handleRowClick(row, rowIndex) {
      console.log('点击了行:', row, rowIndex);
    },
    handleEdit(row, index) {
      console.log('编辑:', row, index);
    },
    handleDelete(row, index) {
      console.log('删除:', row, index);
    }
  }
}
</script>
```

## 高级功能示例

### 1. 合并单元格

```vue
<template>
  <swing-table :data="tableData" :span-method="spanMethod">
    <!-- 列定义 -->
  </swing-table>
</template>

<script>
export default {
  methods: {
    spanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0) {
        if (rowIndex % 2 === 0) {
          return {
            rowspan: 2,
            colspan: 1
          };
        } else {
          return {
            rowspan: 0,
            colspan: 0
          };
        }
      }
    }
  }
}
</script>
```

### 2. 行选择与处理

```vue
<template>
  <div>
    <swing-table
      :data="tableData"
      :selected-rows.sync="selection"
    >
      <s-table-column
        type="selection"
        width="50"
        :selectable="checkSelectable"
      />
      <!-- 其他列 -->
    </swing-table>
    
    <div>
      <button @click="handleBatchDelete">批量删除</button>
      <p>已选择 {{ selection.length }} 项</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableData: [...],
      selection: []
    }
  },
  methods: {
    checkSelectable(row) {
      // 根据条件决定行是否可选
      return row.status !== 'locked';
    },
    handleBatchDelete() {
      console.log('删除选中项:', this.selection);
    }
  }
}
</script>
```

### 3. 自定义样式

```vue
<template>
  <swing-table
    :data="tableData"
    :row-style="getRowStyle"
    :row-class="getRowClass"
    :cell-style="getCellStyle"
  >
    <!-- 列定义 -->
  </swing-table>
</template>

<script>
export default {
  methods: {
    getRowStyle(row, index) {
      return {
        backgroundColor: index % 2 === 0 ? '#f8f8f8' : '#fff'
      }
    },
    getRowClass(row, index) {
      return row.status === 'warning' ? 'warning-row' : '';
    },
    getCellStyle(row, column, rowIndex, colIndex) {
      if (column.prop === 'age' && row.age > 30) {
        return { color: 'red', fontWeight: 'bold' };
      }
      return {};
    }
  }
}
</script>

<style>
.warning-row {
  color: #ff9900;
}
</style>
```

## 组件特性

### 1. 固定表头

通过设置 `fixedHead` 属性为 `true` 来启用固定表头功能。当表格内容超出容器高度时，表头会固定在顶部，内容区域可滚动。

### 2. 固定列

通过在 `s-table-column` 组件上设置 `fixed` 属性来实现列固定。可选值为 `true`、`'left'` 或 `'right'`，其中 `true` 等同于 `'left'`。

### 3. 行选择

通过添加 `type="selection"` 的列来实现行选择功能。可以使用 `.sync` 修饰符双向绑定选中的行数据。

### 4. 自定义渲染

通过 `s-table-column` 的默认插槽实现单元格的自定义渲染，插槽提供 `{ row, $index }` 作为插槽参数。

### 5. 行高亮

点击行时会自动高亮当前行，可以通过 `rowHighlight` 属性控制高亮行为。

## 注意事项

1. 表格高度需要通过父容器控制，建议设置具体高度值以启用滚动功能
2. 使用固定列时，需要为所有列指定宽度
3. 在使用自定义渲染时，需要通过 v-slot 获取行数据
4. 行选择功能需要使用 .sync 修饰符实现双向绑定

## 样式自定义

组件已提供基础样式，如需自定义，可以覆盖以下类名：

- `.swing-table-root` - 表格根容器
- `.swing-table` - 表格元素
- `.table-head` - 表头
- `.table-body` - 表格主体
- `.swing-table-cell` - 表格单元格
- `.highlight` - 高亮行

## 兼容性说明

该组件基于 Vue 2.6-2.7 开发，适用于在非打包模式下使用，即直接在 HTML 中通过 `<script src="xx/vue.min.js">` 引入 Vue 的场景。

## 性能优化建议

1. 避免频繁更新大量数据
2. 对于大数据量场景，考虑使用虚拟滚动或分页
3. 合理设置列宽，避免频繁的布局重计算

通过合理使用 `swing-table` 和 `s-table-column` 组件，可以构建功能丰富、交互友好的表格界面。

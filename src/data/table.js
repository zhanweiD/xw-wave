import * as d3 from 'd3'
import DataBase from './base'

// 定义操作对象
const targetType = {
  ROW: 'row',
  COLUMN: 'column',
}

// 列表数据处理工具，内部 data 数据依次为行标签、列标签、数值
export default class Table extends DataBase {
  constructor(table, options) {
    super()
    this.data = [[], [], []]
    this.update(table, options)
  }

  /**
   * 获取表格的子集
   * @param {Array<String>} rows 行标签
   * @param {Array<String>} columns 列标签
   * @returns {Table} 新的表格对象
   */
  select(rows, columns) {
    const _rows = Array.isArray(rows) ? rows : [rows]
    const rowsIndex = _rows.map(row => this.data[0].findIndex(value => value === row))
    const _columns = Array.isArray(columns) ? columns : [columns]
    const columnsIndex = _columns.map(column => this.data[1].findIndex(value => value === column))
    const data = [_rows, _columns, []]
    for (let i = 0; i < rowsIndex.length; i++) {
      for (let j = 0; j < columnsIndex.length; j++) {
        data[2].push(this.data[2][columnsIndex[j]][rowsIndex[i]])
      }
    }
    // HACK: 返回一个新的列表对象
    const result = new Table([[], [], []])
    result.data = JSON.parse(JSON.stringify(data))
    return result
  }

  /**
   * 克隆一个列表
   * @returns 克隆后的列表实例
   */
  clone() {
    return this.select(this.data[0], this.data[1])
  }

  /**
   * 更新列表数据
   * @param {Array<Array<Number|String>>} table 
   * @param {Object} options 数据列配置
   */
  update(table) {
    if (!this.isLegalData(table)) {
      this.warn('列表数据结构错误')
    } else {
      this.data = table
    }
    return this
  }

  /**
   * 追加列表的一行
   * @param {Array<Number|String>} data 一些数据项
   * @returns {Table} 添加后的列表数据长度
   */
  push(target = targetType.ROW, ...data) {
    data.forEach(item => {
      if ((target === targetType.ROW && item.length !== this.data[0].length)
        || (target === targetType.COLUMN && item.length !== this.data[1].length)) {
        this.warn('数据长度与当前列表不匹配')
      } else {
        data.forEach(([dimension, ...values]) => {
          if (target === targetType.ROW) {
            this.data[0].push(dimension)
            this.data[2].push([...values])
          } else if (target === targetType.COLUMN) {
            this.data[1].push(dimension)
            this.data[2].forEach(rowArray => rowArray.push(...values))
          } 
        })
      }
    })
    return target === targetType.ROW ? this.data[0].length : this.data[1].length
  }

  /**
   * 删除列表数据
   * @param {String | Array<String>} headers 数据列索引
   * @returns 删除的数据列
   */
  remove(target = targetType.ROW, ...data) {
    const removedList = []
    data.forEach(dimension => {
      if (target === targetType.ROW) {
        const index = this.data[0].findIndex(value => value === dimension)
        index !== -1 && removedList.concat(this.data[2].splice(index, 1))
      } else if (target === targetType.COLUMN) {
        const index = this.data[1].findIndex(value => value === dimension)
        index !== -1 && removedList.concat(this.data[2].map(item => item.splice(index, 1)[0]))
      }
    })
    return removedList
  }

  /**
   * 获取列表数值范围
   * @returns {Array} 返回列表的最小值和最大值
   */
  range() {
    const min = d3.min(this.data[2].map(({row}) => d3.min(row)))
    const max = d3.max(this.data[2].map(({row}) => d3.max(row)))
    return [min, max]
  }
}

import * as d3 from 'd3'

// 定义数据组合方式
const modeType = {
  SUM: 'sum',
  PERCENTAGE: 'percentage',
}

// 定义操作对象
const targetType = {
  ROW: 'row',
  COLUMN: 'column',
}

// 二维表数据处理工具
export default class TableList {
  constructor(tableList, options) {
    this.data = []
    this.update(tableList, options)
  }

  /**
   * 简单的数据结构校验
   * @param {Array<Array<Number|String>>} tableList 
   * @returns {Boolean} 是否为合法的二维表数据结构
   */
  isTableList(tableList) {
    if (!Array.isArray(tableList) || tableList.length === 0) {
      return false
    }
    if (tableList.findIndex(listItem => !Array.isArray(listItem)) !== -1) {
      return false
    }
    return true
  }

  /**
   * 矩阵转置操作，二维表行列互换
   * @param {Array<Array<Number|String>>} tableList 
   * @returns {Array<Array<Number|String>>} 转置后的二维表
   */
  transpose(tableList) {
    if (!this.isTableList(tableList)) {
      this.warn('二维表数据结构错误')
      return false
    } 
    if (tableList.length === 0) {
      this.warn('二维表数据为空')
      return false
    }
    const rowLength = tableList[0].length
    const newTableList = []
    for (let i = 0; i < rowLength; i++) {
      newTableList.push(tableList.map(item => item[i]))
    }
    return newTableList
  }

  /**
   * 二维表是否有某列
   * @param {String} name 
   * @returns 数据列的 index 或 fasle，注意 index 为 0 的情况
   */
  hasColumn(name) {
    const index = this.data.findIndex(({header}) => name === header)
    return index === -1 ? false : index
  }

  /**
   * 获取二维表的一个子集，并定义组合方式
   * @param {String | Array<String>} headers 数据列索引
   * @param {TableList} options 数据列组合配置
   * @returns {TableList}
   */
  select(headers, options = {}) {
    const {mode, target = targetType.ROW} = options
    const _headers = Array.isArray(headers) ? headers : [headers]
    let data = JSON.parse(JSON.stringify(this.data.filter(({header}) => _headers.includes(header))))
    // 列求和的情况
    if (mode === modeType.SUM) {
      if (target === targetType.ROW) {
        data = [data.reduce((prev, cur) => ({
          header: `${prev.header}_${cur.header}`,
          alias: `${prev.alias || ''}_${cur.alias || ''}`,
          list: prev.list.map((value, i) => value + cur.list[i]),
          min: d3.min([prev.min, cur.min]),
          max: d3.min([prev.max, cur.max]),
        }))]
      } else if (target === targetType.COLUMN) {
        data = data.map(item => ({
          ...item,
          list: [d3.sum(item.list)],
        }))
      }
    }
    // 列计算百分比的情况
    if (mode === modeType.PERCENTAGE) {
      if (target === targetType.ROW) {
        const transposedTableList = this.transpose(data.map(({list}) => list))
        const sums = transposedTableList.map(item => d3.sum(item))
        data = data.map(({list, ...others}) => ({
          ...others,
          list: list.map((value, index) => value / sums[index]),
        }))
      } else if (target === targetType.COLUMN) {
        data = data.map(item => {
          const sum = d3.sum(item.list)
          return {
            ...item,
            list: item.list.map(value => value / sum),
          }
        })
      }
    }
    // HACK: 返回一个新的二维表对象
    const result = new TableList([[]])
    result.data = data
    return result
  }

  /**
   * 更新二维表数据
   * @param {Array<Array<Number|String>>} tableList 
   * @param {Object} options 数据列配置
   */
  update(tableList, options = {}) {
    if (!this.isTableList(tableList)) {
      this.warn('二维表数据结构错误')
      return
    }
    // 类内部用对象表示数据
    const updateData = tableList[0].map((header, index) => ({
      ...options[header],
      list: tableList.slice(1).map(row => row[index]),
      header,
    }))
    // 覆盖已有数据或者追加新的数据
    updateData.forEach(item => {
      const columnIndex = this.hasColumn(item.header)
      if (columnIndex !== false) {
        this.data[columnIndex] = item
      } else {
        this.data.push(item)
      }
    })
  }

  /**
   * 追加二维表的一行
   * @param {Array<Number|String>} rows 一些数据行
   * @returns {TableList} 添加后的二维表
   */
  push(...rows) {
    rows.forEach(row => {
      if (row.length !== this.data.length) {
        this.warn('数据长度与当前二维表不匹配')
      } else {
        row.forEach((value, i) => this.data[i].list.push(value))
      }
    })
    return this
  }

  /**
   * 删除二维表数据
   * @param {String | Array<String>} headers 数据列索引
   * @returns 删除的数据列
   */
  remove(headers) {
    const removedList = []
    const _headers = Array.isArray(headers) ? headers : [headers]
    _headers.forEach(header => {
      const columnIndex = this.hasColumn(header)
      if (columnIndex !== false) {
        removedList.concat(this.data.splice(columnIndex, 1)) 
      }
    })
    return removedList
  }

  /**
   * 连接多个 TableList
   * @param {TableList} tableList
   * @returns {TableList} 连接后的二维表 
   */
  concat(...tableLists) {
    tableLists.forEach(tableList => {
      tableList.data.forEach(item => {
        const columnIndex = this.hasColumn(item.header)
        if (columnIndex !== false) {
          this.data[columnIndex] = item
        } else {
          this.data.push(item)
        }
      })
    })
    return this
  }

  /**
   * 获取二维表数值范围
   * @returns {Array} 返回二维表的最小值和最大值
   */
  range() {
    const min = d3.min(this.data.map(({list}) => d3.min(list)))
    const max = d3.max(this.data.map(({list}) => d3.max(list)))
    return [min, max]
  }

  /**
   * 定义报错时的行为，可以被覆盖
   * @param {String} text 报错文字
   */
  warn(text) {
    console.error(text)
  }
}

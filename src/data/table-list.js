import * as d3 from 'd3'
import {cloneDeep} from 'lodash'
import DataBase from './base'

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

// 列表数据处理工具
export default class TableList extends DataBase {
  constructor(tableList, options) {
    super(options)
    this.data = []
    this.update(tableList, options)
  }

  /**
   * 获取列表的一个子集，并定义组合方式
   * @param {String | Array<String>} headers 数据列索引
   * @param {TableList} options 数据列组合配置
   * @returns {TableList} 返回一个新的列表实例
   */
  select(headers, options = {}) {
    const {mode, target = targetType.ROW} = options
    const headerArray = Array.isArray(headers) ? headers : [headers]
    let data = cloneDeep(this.data.filter(({header}) => headerArray.includes(header)))
    // 列求和的情况
    if (mode === modeType.SUM) {
      if (target === targetType.ROW) {
        let lists = data.map(({list}) => list).reduce((prev, cur, i) => {
          const latest = i === 1 ? [prev] : [...prev]
          return latest.concat([latest[i - 1].map((value, j) => d3.sum([value, cur[j]]))])
        })
        lists = data.length === 1 ? [lists] : lists
        data = [{
          header: data.map(({header}) => header).join('-'),
          list: lists.length > 0 ? lists[lists.length - 1] : [],
          min: d3.min(lists.map(list => d3.min(list))),
          max: d3.max(lists.map(list => d3.max(list))),
        }]
      } else if (target === targetType.COLUMN) {
        data = data.map(item => ({...item, list: [d3.sum(item.list)]}))
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
          return {...item, list: item.list.map(value => value / sum)}
        })
      }
    }
    // HACK: 返回一个新的列表对象
    const result = new TableList([[]], this.options)
    result.data = data
    return result
  }

  /**
   * 更新列表数据
   * @param {Array<Array<Number|String>>} tableList 
   * @param {Object} options 数据列配置
   * @returns {TableList} 当前实例
   */
  update(tableList, options = {}) {
    if (!this.isLegalData('list', tableList)) {
      this.log.error('列表数据结构错误', tableList)
    } else {
      // 类内部用对象表示数据
      const updateData = tableList[0].map((header, index) => ({
        ...options[header],
        list: tableList.slice(1).map(row => row[index]),
        header,
      }))
      // 覆盖已有数据或者追加新的数据
      updateData.forEach(item => {
        const index = this.data.findIndex(({header}) => item.header === header)
        if (index !== -1) {
          this.data[index] = item
        } else {
          this.data.push(item)
        }
      })
    }
    return this
  }

  /**
   * 追加列表的一行
   * @param {Array<Number|String>} rows 一些数据行
   * @returns {TableList} 添加后的列表数据长度
   */
  push(...rows) {
    rows.forEach(row => {
      if (row.length !== this.data.length) {
        this.log.error('数据长度与当前列表不匹配', row)
      } else {
        row.forEach((value, i) => this.data[i].list.push(value))
      }
    })
    return this.data.length
  }

  /**
   * 删除列表数据
   * @param {String | Array<String>} headers 数据列索引
   * @returns 删除的数据列
   */
  remove(headers) {
    const removedList = []
    const headerArray = Array.isArray(headers) ? headers : [headers]
    headerArray.forEach(header => {
      const index = this.data.findIndex(item => item.header === header)
      if (index !== -1) {
        removedList.concat(this.data.splice(index, 1)) 
      }
    })
    return removedList
  }

  /**
   * 连接多个 TableList
   * @param {TableList} tableList
   * @returns {TableList} 连接后新的列表示实例
   */
  concat(...tableLists) {
    const newTableList = cloneDeep(this)
    tableLists.forEach(tableList => {
      cloneDeep(tableList).data.forEach(item => {
        const index = newTableList.data.findIndex(({header}) => item.header === header)
        if (index !== -1) {
          newTableList.data[index] = item
        } else {
          newTableList.data.push(item)
        }
      })
    })
    return newTableList
  }

  /**
   * 获取列表数值范围
   * @returns {Array} 返回列表的最小值和最大值
   */
  range() {
    const minValue = d3.min(this.data.map(({list, min}) => d3.min([min, d3.min(list)])))
    const maxValue = d3.max(this.data.map(({list, max}) => d3.max([max, d3.max(list)])))
    return [minValue, maxValue]
  }
}

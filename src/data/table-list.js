import * as d3 from 'd3'
import {cloneDeep} from 'lodash'
import DataBase from './base'

const modeType = {
  SUM: 'sum',
  PERCENTAGE: 'percentage',
}

const targetType = {
  ROW: 'row',
  COLUMN: 'column',
}

export default class TableList extends DataBase {
  constructor(tableList, options) {
    super(options)
    this.data = []
    this.update(tableList, options)
  }

  /**
   * get subset of the tableList without changing previous data
   * @param {String|Array<String>} headers
   * @param {TableList} options
   * @returns {TableList} new tableList
   */
  select(headers, options = {}) {
    const {mode, target = targetType.ROW} = options
    const headerArray = Array.isArray(headers) ? headers : [headers]
    let data = cloneDeep(this.data.filter(({header}) => headerArray.includes(header)))
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
    // HACK: create a new tableList
    const result = new TableList([[]], this.options)
    result.data = data
    return result
  }

  /**
   * update tableList
   * @param {Array<Array<Number|String>>} tableList
   * @param {Object} options
   * @returns {TableList}
   */
  update(tableList, options = {}) {
    if (!this.isLegalData('list', tableList)) {
      this.log.error('TableList: Illegal data', tableList)
    } else {
      // new dataset
      const updateData = tableList[0].map((header, index) => ({
        ...options[header],
        list: tableList.slice(1).map(row => row[index]),
        header,
      }))
      // override
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
   * append rows to the list
   * @param {Array<Number|String>} rows
   * @returns {Number} number of data length
   */
  push(...rows) {
    rows.forEach(row => {
      if (row.length !== this.data.length) {
        this.log.error('TableList: Illegal data', row)
      } else {
        row.forEach((value, i) => this.data[i].list.push(value))
      }
    })
    return this.data.length
  }

  /**
   * remove rows from the list
   * @param {String|Array<String>} headers
   * @returns row that has been deleted
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
   * concat tableLists without changing previous data
   * @param {TableList} tableList
   * @returns {TableList} new tableList
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
   * get data range of current tableList
   * @returns {Array} min and max
   */
  range() {
    const minValue = d3.min(this.data.map(({list, min}) => d3.min([min, d3.min(list)])))
    const maxValue = d3.max(this.data.map(({list, max}) => d3.max([max, d3.max(list)])))
    return [minValue, maxValue]
  }
}

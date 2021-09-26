import * as d3 from 'd3'
import {cloneDeep} from 'lodash'
import DataBase from './base'

const targetType = {
  ROW: 'row',
  COLUMN: 'column',
}

export default class Table extends DataBase {
  constructor(table, options) {
    super(options)
    // rows & columns & values
    this.data = [[], [], []]
    this.update(table, options)
  }

  /**
   * get subset of the table without changing previous data
   * @param {Array<String>} rows
   * @param {Array<String>} columns
   * @returns {Table} new table
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
    // HACK: create a new table
    const result = new Table([[], [], []], this.options)
    result.data = cloneDeep(data)
    return result
  }

  /**
   * update table
   * @param {Array<Array<Number|String>>} table
   * @param {Object} options
   */
  update(table) {
    if (!this.isLegalData('table', table) && this.isLegalData('tableList', table)) {
      table = this.tableListToTable(table)
    }
    if (!this.isLegalData('table', table)) {
      this.log.error('Table: Illegal data', table)
    } else {
      this.data = table
    }
    return this
  }

  /**
   * append items to the list
   * @param {Array<Number|String>} data
   * @returns {Table} number of data length
   */
  push(target = targetType.ROW, ...data) {
    data.forEach(item => {
      if (
        (target === targetType.ROW && item.length !== this.data[0].length)
        || (target === targetType.COLUMN && item.length !== this.data[1].length)
      ) {
        this.log.error('Table: Illegal data')
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
   * remove items from the list
   * @param {String|Array<String>} headers
   * @returns items that have been deleted
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
   * get data range of current table
   * @returns {Array} min and max
   */
  range() {
    const min = d3.min(this.data[2].map(row => d3.min(row)))
    const max = d3.max(this.data[2].map(row => d3.max(row)))
    return [min, max]
  }

  /**
   * calculate the relative size of the value in the list
   * @returns {Array}
   */
  sort() {
    const result = cloneDeep(this.data[2])
    const column = this.data[1].length
    const data = this.data[2].reduce((prev, cur) => [...prev, ...cur], [])
    const order = new Array(data.length).fill().map((v, i) => i)
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        if (data[i] > data[j]) {
          [data[i], data[j]] = [data[j], data[i]];
          [order[i], order[j]] = [order[j], order[i]]
        }
      }
    }
    // order data
    order.forEach((value, i) => (result[Math.floor(value / column)][value % column] = i))
    return result
  }
}

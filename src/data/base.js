import {merge} from 'lodash'
import createLog from '../utils/create-log'

export default class DataBase {
  #storage = {}

  // order affects color fetching
  constructor(initData, options) {
    this.data = initData
    this.options = merge({order: null}, options)
    this.log = createLog('src/data/base')
  }
  
  set(key, value) {
    this.#storage[key] = value
  }

  get(key) {
    return this.#storage[key]
  }

  isTableList = tableList => {
    if (
      !Array.isArray(tableList)
      || tableList.length === 0
      || tableList.findIndex(item => !Array.isArray(item)) !== -1
      || new Set(tableList.map(item => item.length)).size !== 1
    ) {
      return false
    }
    return true
  }

  isTable = table => {
    if (
      !Array.isArray(table)
      || table.length < 3
      || table.findIndex(item => !Array.isArray(item)) !== -1
      || !this.isTableList(table[2])
    ) {
      return false
    }
    return true
  }

  isRelation = nodeTableList => {
    if (!this.isTableList(nodeTableList)) {
      return false
    }
    return true
  }

  tableListToObjects = tableList => {
    try {
      if (!this.isTableList(tableList)) throw new Error()
      return tableList.slice(1).map(item => {
        return Object.fromEntries(tableList[0].map((key, i) => [key, item[i]]))
      })
    } catch (error) {
      this.log.error('DataBase: failed to transform tableList to objects', error)
      return tableList
    }
  }

  tableListToTable = tableList => {
    try {
      if (!this.isTableList(tableList) || tableList[0].length !== 3) throw new Error()
      const rows = Array.from(new Set(tableList.slice(1).map(item => item[0])))
      const columns = Array.from(new Set(tableList.slice(1).map(item => item[1])))
      return [
        rows,
        columns,
        rows.map(row => columns.map(column => {
          const target = tableList.find(item => item[0] === row && item[1] === column)
          return target ? target[2] : 0
        })),
      ]
    } catch (error) {
      this.log.error('DataBase: failed to transform tableList to table', error)
      return tableList
    }
  }

  relationToTable = (nodeTableList, linkTableList) => {
    try {
      if (!this.isTableList(nodeTableList) || !this.isTableList(linkTableList)) throw new Error()
      const idIndex = nodeTableList[0].findIndex(key => key === 'id')
      const nameIndex = nodeTableList[0].findIndex(key => key === 'name')
      const fromIndex = linkTableList[0].findIndex(key => key === 'from')
      const toIndex = linkTableList[0].findIndex(key => key === 'to')
      const valueIndex = linkTableList[0].findIndex(key => key === 'value')
      const nodeIds = Array.from(new Set(nodeTableList.slice(1).map(item => item[idIndex])))
      const nodeNames = nodeIds.map(id => nodeTableList.find(item => item[idIndex] === id)[nameIndex])
      return [
        nodeNames,
        nodeNames,
        nodeIds.map(row => nodeIds.map(column => {
          const target = linkTableList.find(item => item[fromIndex] === row && item[toIndex] === column)
          return target ? target[valueIndex] : 0
        })),
      ]
    } catch (error) {
      this.log.error('DataBase: failed to transform relation to table\n', error)
      return [nodeTableList, linkTableList]
    }
  }

  isLegalData(type, ...data) {
    if (type === 'list') {
      return this.isTableList(...data)
    }
    if (type === 'table') {
      return this.isTable(...data)
    }
    if (type === 'relation') {
      return this.isRelation(...data)
    }
    return false
  }

  /**
   * matrix transpose
   * @param {Array<Array<Number|String>>} tableList
   * @returns {Array<Array<Number|String>>} ??????????????????
   */
  transpose(tableList) {
    if (!this.isLegalData('list', tableList)) {
      this.log.error('DataBase: illegal tableList', tableList)
      return false
    }
    const newTableList = []
    for (let i = 0; i < tableList[0].length; i++) {
      newTableList.push(tableList.map(item => item[i]))
    }
    return newTableList
  }
}

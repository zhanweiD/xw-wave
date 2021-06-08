import {merge} from 'lodash'
import createLog from '../util/create-log'

// 数据处理基类
export default class DataBase {
  #storage = {}

  // 是否为列表数据
  static isTableList = tableList => {
    if (!Array.isArray(tableList) 
      || tableList.length === 0 
      || tableList.findIndex(item => !Array.isArray(item)) !== -1) {
      return false
    }
    return true
  }

  // 是否为表格数据
  static isTable = table => {
    if (!Array.isArray(table) 
      || table.length < 3 
      || table.findIndex(item => !Array.isArray(item)) !== -1
      || !DataBase.isTableList(table[2])) {
      return false
    }
    return true
  }

  // 是否为关系型数据
  static isRelation = (nodeTableList, linkTableList) => {
    if (!DataBase.isTableList(nodeTableList) || !DataBase.isTableList(linkTableList)) {
      return false
    }
    return true
  }

  // 初始化数据，order 定义每组数据的优先级，可以决定颜色的选取顺序
  constructor(options) {
    this.options = merge({order: null}, options)
    this.log = createLog(__filename)
  }

  /**
   * 数据验证函数
   * @returns 是否为合法数据
   */
  isLegalData(type, ...data) {
    if (type === 'list') {
      return DataBase.isTableList(...data)
    } 
    if (type === 'table') {
      return DataBase.isTable(...data)
    } 
    if (type === 'relation') {
      return DataBase.isRelation(...data)
    }
    return false
  }

  /**
   * 矩阵转置操作，列表行列互换
   * @param {Array<Array<Number|String>>} tableList 
   * @returns {Array<Array<Number|String>>} 转置后的列表
   */
  transpose(tableList) {
    if (!this.isLegalData('list', tableList)) {
      this.warn('列表数据结构错误')
      return false
    }
    const newTableList = []
    for (let i = 0; i < tableList[0].length; i++) {
      newTableList.push(tableList.map(item => item[i]))
    }
    return newTableList
  }

  /**
   * 挂载一些额外的数据到实例上
   * @param {String} key 键
   * @param {any} value 值
   */
  set(key, value) {
    this.#storage[key] = value
  }

  /**
   * 获取实例上的额外数据
   * @param {String} key 键
   * @returns 存储的值
   */
  get(key) {
    return this.#storage[key]
  }

  /**
   * 获取当前数据的子集
   * @returns 新的子类
   */
  select() {
    this.warn('数据筛选函数未重写')
    return this.clone()
  }

  /**
   * 更新数据，包括配置信息
   * @returns 当前实例
   */
  update() {
    this.warn('数据更新函数未重写')
    return this
  }

  /**
   * 删除数据，包括配置信息
   * @returns 删除的数据项
   */
  remove() {
    this.warn('数据删除函数未重写')
    return null
  }

  /**
   * 追加列表的一个实例或一行或一列
   * @returns 添加后对应数据的长度
   */
  push() {
    this.warn('数据追加函数未重写')
    return this.data.length
  }

  /**
   * 连接多个数据类
   * @returns 连接后新的类实例
   */
  concat() {
    this.warn('数据类连接函数未重写')
    return this.clone()
  }

  /**
   * 定义报错时的行为，可以被覆盖
   * @param {String} text 报错文字
   */
  warn(text, data) {
    this.log.error(text, data)
  }
}

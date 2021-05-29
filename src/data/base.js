// 数据处理基类
export default class DataBase {
  // 是否为列表数据
  static isTableLilst = tableList => {
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
      || !DataBase.isTableLilst(table[2])) {
      return false
    }
    return true
  }

  // 构造函数，备份数据
  constructor(data, options) {
    this.source = data
    this.options = options
  }

  /**
   * 数据验证函数
   * @returns 是否为合法数据
   */
  isLegalData(type, data) {
    if (type === 'list') {
      return DataBase.isTableLilst(data)
    } if (type === 'table') {
      return DataBase.isTable(data)
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
    console.error(text, data)
  }
}

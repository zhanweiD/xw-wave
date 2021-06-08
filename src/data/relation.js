import DataBase from './base'

// 列表数据处理工具，内部 data 数据依次为行标签、列标签、数值
export default class Relation extends DataBase {
  constructor(nodeTableList, linkTableList, options) {
    super(options)
    this.data = {nodes: [], links: []}
    this.update(nodeTableList, linkTableList, options)
  }

  /**
   * 更新关系型数据
   * @param {Array<Array<Number|String>>} nodeTableList 节点数据
   * @param {Array<Array<Number|String>>} linkTableList 边数据 
   * @param {Object} options 数据列配置
   */
  update(nodeTableList, linkTableList) {
    if (!this.isLegalData('relation', nodeTableList, linkTableList)) {
      this.warn('数据结构错误', {nodeTableList, linkTableList})
    } else {
      // 节点数据
      const nodeNameIndex = nodeTableList[0].findIndex(value => value === 'name')
      const nodeValueIndex = nodeTableList[0].findIndex(value => value === 'value')
      const nodeCategoryIndex = nodeTableList[0].findIndex(value => value === 'category')
      this.data.nodes = nodeTableList.slice(1).map(item => ({
        name: item[nodeNameIndex],
        value: item[nodeValueIndex],
        category: item[nodeCategoryIndex],
      }))
      // 边数据
      const linkFromIndex = linkTableList[0].findIndex(value => value === 'from')
      const linkToIndex = linkTableList[0].findIndex(value => value === 'to')
      const linkValueIndex = linkTableList[0].findIndex(value => value === 'value')
      this.data.links = linkTableList.slice(1).map(item => ({
        from: item[linkFromIndex],
        to: item[linkToIndex],
        value: item[linkValueIndex],
      }))
    }
    return this
  }
}

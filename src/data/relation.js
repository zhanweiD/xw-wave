import * as d3 from 'd3'
import DataBase from './base'
import formatText from '../util/format-text'

// 关系型数据处理工具
export default class Relation extends DataBase {
  constructor(nodeTableList, linkTableList, options) {
    super(options)
    this.data = {nodes: [], links: [], roots: []}
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
      this.log.error('数据结构错误', {nodeTableList, linkTableList})
    } else {
      const findNode = key => nodeTableList[0].findIndex(value => value === key)
      const [nodeIdIndex, nodeNameIndex, nodeValueIndex, nodeCategoryIndex] = [
        findNode('id'), findNode('name'), findNode('value'), findNode('category'),
      ]
      // 节点基础数据
      this.data.nodes = nodeTableList.slice(1).map(item => ({
        id: item[nodeIdIndex] || item[nodeNameIndex],
        name: item[nodeNameIndex],
        value: item[nodeValueIndex],
        category: item[nodeCategoryIndex],
        parents: [],
        children: [],
      }))
      const findLink = key => linkTableList[0].findIndex(value => value === key)
      const [linkFromIndex, linkToIndex, linkValueIndex, linkCategoryIndex] = [
        findLink('from'), findLink('to'), findLink('value'), findNode('category'),
      ]
      // 边的基础数据
      this.data.links = linkTableList.slice(1).map(item => ({
        value: item[linkValueIndex],
        from: item[linkFromIndex],
        to: item[linkToIndex],
        category: item[linkCategoryIndex],
      }))
      // 如果节点自己没有自己定义数据，则从边中找
      if (nodeValueIndex === -1 && linkValueIndex !== -1) {
        this.data.nodes.forEach(node => {
          const froms = this.data.links.filter(({from}) => from === node.id).map(({value}) => value)
          const tos = this.data.links.filter(({to}) => to === node.id).map(({value}) => value)
          node.value = formatText(d3.max([d3.sum(froms), d3.sum(tos)]))
        })
      }
      // 衍生数据
      this.#computeLevel()
    }
    return this
  }

  // 计算节点的前后依赖关系
  #computeLevel = () => {
    const level = {}
    const comeleted = {}
    this.data.nodes.forEach(({id}) => comeleted[id] = false)
    this.data.nodes.forEach(({id}) => level[id] = -1)
    // 寻找当前节点的根节点
    const findRoot = id => {
      const current = this.data.nodes.find(node => node.id === id)
      const prevIds = this.data.links.filter(({to}) => to === id).map(({from}) => from)
      if (prevIds.length === 0) {
        !comeleted[id] && this.data.roots.push(id)
      } else {
        const parents = prevIds.map(prevId => this.data.nodes.find(node => node.id === prevId))
        current.parents.push(...prevIds)
        parents.forEach(parent => parent.children.push(id))
        prevIds.forEach(prevId => !comeleted[prevId] && findRoot(prevId))
      }
      comeleted[id] = true
    }
    // 层级计算函数
    const updateLevel = (id, parents) => {
      const nextIds = this.data.links.filter(({from}) => from === id).map(({to}) => to)
      // 初始化当前根节点
      if (level[id] === -1) {
        parents.push(id)
        level[id] = 0
      }
      // 根据链路更新层级
      nextIds.length && nextIds.forEach(nextId => {
        if (level[nextId] === -1) {
          level[nextId] = level[id] + 1
        } else if (level[nextId] - level[id] !== 1) {
          // 如果子节点和当前节点的层级不是上下级关系，则更新子节点的所有祖先节点
          parents.map(prevId => level[prevId] += level[nextId] - level[id] - 1)
        }
        // 递归计算节点层级
        updateLevel(nextId, parents)
      })
    }
    // 计算层级数据
    this.data.links.forEach(({to}) => findRoot(to))
    this.data.roots.forEach(root => updateLevel(root, []))
    this.data.nodes.map(node => node.level = level[node.id])
    // 清洗多余的 parent 和 children 节点
    const findNode = id => this.data.nodes.find(item => item.id === id)
    this.data.nodes.forEach(({parents, children}, i) => {
      this.data.nodes[i].parents = Array.from(new Set(parents)).map(findNode)
      this.data.nodes[i].children = Array.from(new Set(children)).map(findNode)
    })
  }
}

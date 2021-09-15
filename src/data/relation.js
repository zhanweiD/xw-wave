import * as d3 from 'd3'
import DataBase from './base'
import {formatNumber} from '../utils/format'

export default class Relation extends DataBase {
  constructor(nodeTableList, linkTableList, options) {
    super(options)
    this.data = {nodes: [], links: [], roots: []}
    this.update(nodeTableList, linkTableList, options)
  }

  /**
   * update relation
   * @param {Array<Array<Number|String>>} nodeTableList
   * @param {Array<Array<Number|String>>} linkTableList
   * @param {Object} options
   */
  update(nodeTableList, linkTableList) {
    if (!this.isLegalData('relation', nodeTableList, linkTableList)) {
      this.log.error('Relation: Illegal tableList', {nodeTableList, linkTableList})
    } else {
      const findNode = key => nodeTableList[0].findIndex(value => value === key)
      const [nodeIdIndex, nodeNameIndex, nodeValueIndex, nodeCategoryIndex] = [
        findNode('id'), findNode('name'), findNode('value'), findNode('category'),
      ]
      // nodes data
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
      // links data
      this.data.links = linkTableList.slice(1).map(item => ({
        value: item[linkValueIndex],
        from: item[linkFromIndex],
        to: item[linkToIndex],
        category: item[linkCategoryIndex],
      }))
      // if nodes has no data, then find from links
      if (nodeValueIndex === -1 && linkValueIndex !== -1) {
        this.data.nodes.forEach(node => {
          const froms = this.data.links.filter(({from}) => from === node.id).map(({value}) => value)
          const tos = this.data.links.filter(({to}) => to === node.id).map(({value}) => value)
          node.value = formatNumber(d3.max([d3.sum(froms), d3.sum(tos)]))
        })
      }
      // derived data
      this.#computeLevel()
    }
    return this
  }

  #computeLevel = () => {
    const level = {}
    const comeleted = {}
    this.data.nodes.forEach(({id}) => comeleted[id] = false)
    this.data.nodes.forEach(({id}) => level[id] = -1)
    // fint the root node of the current node
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
    // calculate level of the current node
    const updateLevel = (id, parents) => {
      const nextIds = this.data.links.filter(({from}) => from === id).map(({to}) => to)
      // initialize level
      if (level[id] === -1) {
        parents.push(id)
        level[id] = 0
      }
      // update based on link
      nextIds.length && nextIds.forEach(nextId => {
        if (level[nextId] === -1) {
          level[nextId] = level[id] + 1
        } else if (level[nextId] - level[id] !== 1) {
          // update all ancestor nodes of the child node when different
          parents.map(prevId => level[prevId] += level[nextId] - level[id] - 1)
        }
        // recursive calculation
        updateLevel(nextId, parents)
      })
    }
    this.data.links.forEach(({to}) => findRoot(to))
    this.data.roots.forEach(root => updateLevel(root, []))
    this.data.nodes.map(node => node.level = level[node.id])
    // clean redundant nodes
    const findNode = id => this.data.nodes.find(item => item.id === id)
    this.data.nodes.forEach(({parents, children}, i) => {
      this.data.nodes[i].parents = Array.from(new Set(parents)).map(findNode)
      this.data.nodes[i].children = Array.from(new Set(children)).map(findNode)
    })
  }
}

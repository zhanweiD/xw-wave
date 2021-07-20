/* eslint-disable no-shadow */
import hJSON from 'hanson'
import {merge} from 'lodash'
import {layoutMapping, graphMapping, textMapping, otherMapping, animationMapping} from './mapping'
import DataBase from '../data/base'

const {keys} = Object
const getRealData = (dataSource, mappingValues) => {
  if (!dataSource || !mappingValues) return null
  // 解析数据源格式，取数据
  const dataSet = keys(mappingValues).map(groupId => {
    const {fields, sourceId} = mappingValues[groupId]
    return fields.map(mappingList => mappingList.map(({key}) => {
      const targetIndex = dataSource[sourceId][0].findIndex(header => header === key)
      return dataSource[sourceId].map(item => item[targetIndex])
    }))
  })
  // 拼接数据
  const dataBase = new DataBase()
  const tableLists = dataSet.map(item => dataBase.transpose(item.reduce((prev, cur) => [...prev, ...cur])))
  return tableLists.length === 1 ? tableLists[0] : tableLists
}

// 工具配置到图表配置的映射函数
function translate(schema) {
  const {
    width, // 容器宽
    height, // 容器高
    padding, // 内边距
    container, // 容器必传
    themeColors, // 主题颜色
    baseFontSize, // 文字缩放系数
    coordinate, // 坐标轴类型
    layers, // 图层配置
    isPreview, // 是否预览
    data, // 字符串数据
  } = schema
  // 全局图层数据
  const dataSource = {}
  keys(data).map(key => dataSource[key] = hJSON.parse(data[key]))
  // 处理图层配置
  const layerConfig = layers.map(({type, id, data, axis, children, other, tooltip}) => {
    const options = {id, axis, layout: layoutMapping(type)}
    const scale = {count: 5}
    const style = {}
    const _tooltip = {targets: []}
    const _animation = {}
    let _data = getRealData(dataSource, data)
    // 图层配置映射
    children.forEach(({tabId, option, text, graph, animation}) => {
      // 图形配置面板
      tabId === 'graph' && merge(style, {[option]: graphMapping(graph)})
      // 文字配置面板
      tabId === 'text' && merge(style, {[option]: textMapping(text)})
      // 动画配置面板
      isPreview && merge(_animation, {[option]: animationMapping(animation)})
    })
    // 其他自定义配置
    if (other) {
      const otherResult = otherMapping(type, other)
      _data = _data || otherResult.data
      merge(options, otherResult.options)
      merge(scale, otherResult.scale)
      merge(style, otherResult.style)
    }
    // tooltip 配置
    if (tooltip && tooltip.useTooltip) {
      merge(_tooltip, {...tooltip, targets: children.map(({option}) => option)})
    }
    return {type, data: _data, scale, options, style, tooltip: _tooltip, animation: _animation}
  })
  
  return {
    width,
    height,
    padding,
    container,
    coordinate,
    baseFontSize,
    theme: themeColors,
    layers: layerConfig.reverse(),
    adjust: false,
  }
}

export default (...parameter) => {
  try {
    return translate(...parameter)
  } catch (error) {
    console.error('图表解析失败', error)
    return null
  }
}

/* eslint-disable no-shadow */
import hJSON from 'hanson'
import {merge} from 'lodash'
import {layoutMapping, graphMapping, textMapping, otherMapping, animationMapping} from './mapping'
import {createSankeyData, createEdgeBundleData} from './mock'

const getMockData = type => {
  switch (type) {
    case 'sankey':
      return createSankeyData()
    case 'edgeBundle':
      return createEdgeBundleData()
    default:
      return null
  }
}

const getRealData = (dataSource, mappingValues) => {
  if (!dataSource || !mappingValues) {
    return null
  }
  const indexs = mappingValues.map(({key}) => {
    const index = dataSource[0].findIndex(item => item === key)
    if (index === -1) {
      console.error('数据解析错误，映射的字段不存在', {dataSource, mappingValues})
    }
    return index
  })
  return dataSource.map(item => indexs.map(index => item[index]))
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

  // 处理图层数据
  const dataSource = hJSON.parse(data)
  const layerConfig = layers.map(({type, id, data, axis, children, other, tooltip}) => {
    // 图层的初始化配置
    const options = {id, axis, layout: layoutMapping(type)}
    // 比例尺配置
    const scale = {count: 5}
    // 图层的样式配置
    const style = {}
    // tooltip 配置
    const _tooltip = {targets: []}
    // 动画配置
    const _animation = {}
    // 没有数据临时用随机数据
    let _data = getMockData(type) || getRealData(dataSource, data)
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

export default translate

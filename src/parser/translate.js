import {merge} from 'lodash'
import {layoutMapping, graphMapping, textMapping, otherMapping, animationMapping} from './mapping'

const getMockData = type => {
  if (type === 'text') {
    return '图表标题'
  }
  if (type === 'auxiliary') {
    return [400, 2000]
  }
  return {
    type: 'tableList',
    mode: 'normal', 
    row: 6,
    column: 3,
    mu: 500,
    sigma: 200,
    decimalPlace: 1,
  }
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
  } = schema

  // 处理图层数据
  const layerConfig = layers.map(({type, id, data, axis, children, other, tooltip}) => {
    // 图层的初始化配置
    const options = {id, axis, layout: layoutMapping(type)}
    // 比例尺配置
    const scale = {}
    // 图层的样式配置
    const style = {}
    // tooltip 配置
    const _tooltip = {targets: []}
    // 动画配置
    const _animation = {}
    // 没有数据临时用随机数据
    data = getMockData(type)
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
      merge(options, otherResult.options)
      merge(scale, otherResult.scale)
      merge(style, otherResult.style)
    }
    // tooltip 配置
    if (tooltip && tooltip.useTooltip) {
      merge(_tooltip, {...tooltip, targets: children.map(({option}) => option)})
    }
    return {type, data, scale, options, style, tooltip: _tooltip, animation: _animation}
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

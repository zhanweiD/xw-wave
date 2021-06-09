import getStandardLayout from '../layout/standard'

// 工具配置到图表配置的映射函数
function translate(schema) {
  const {
    container, // 容器必传
    themeColors, // 主题
    padding, // 主绘图区域的内边距
    baseFontSize, // 文字缩放系数
    coordinate, // 坐标轴类型
    layers, // 图层配置
  } = schema

  // 处理图层数据
  const layerSchema = layers.map(({type, id, data, children}) => {
    // 工具的布局是简化过的
    const layout = type === 'text' ? 'title' : type === 'legend' ? 'legend' : 'main'
    // 图层的初始化配置
    const options = {id, layout}
    // 图层的样式配置
    const style = {}
    children.forEach(({tabId, option, text, graph}) => {
      style[option] = tabId === 'text' ? text : tabId === 'graph' ? graph : {}
    })
    // 没有数据临时用随机数据
    if (!data && type !== 'text') {
      data = {
        type: 'tableList',
        mode: 'normal', 
        row: 6,
        column: 3,
        mu: 500,
        sigma: 200,
        decimalNumber: 1,
      }
    }
    // 符合解析器的配置结构
    return {type, data, options, style}
  })
  
  return {
    container,
    theme: themeColors,
    adjust: 'auto',
    padding,
    baseFontSize,
    layout: getStandardLayout,
    coordinate,
    layers: layerSchema,
  }
}

export default translate

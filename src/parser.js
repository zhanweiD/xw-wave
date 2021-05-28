import Wave from './wave'
import DataBase from './data/base'
import TableList from './data/table-list'
import Table from './data/table'

// 图层是否依赖其他图层
const dependentLayers = ['auxiliary', 'axis', 'legend']
const isDependentLayer = layerType => dependentLayers.find(type => type === layerType)
// 根据配置创建一个图层
const createLayer = (wave, config) => {
  const {type, options, data, scale, style, animation, tooltip, event} = config
  const layer = wave.createLayer(type, {...options, layout: wave.layout[options.layout]})
  // 数据结构判断
  let dataObject = data
  if (DataBase.isTable(data)) {
    dataObject = new Table(dataObject)
  } else if (DataBase.isTableLilst(data)) {
    dataObject = new TableList(dataObject)
    // 某些图表需要控制列数
    if (type === 'rect' && options.mode === 'interval') {
      dataObject = dataObject.select(dataObject.data.map(({header}) => header).slice(0, 3))
    } else if (type === 'rect' && options.mode === 'waterfall') {
      dataObject = dataObject.select(dataObject.data.map(({header}) => header).slice(0, 2))
      // 瀑布图需要手动添加最后一列数据（待优化到图层内部）
      dataObject.push(['总和', dataObject.select(data[0][1], {mode: 'sum', target: 'column'}).range()[1]])
    } else if (type === 'arc' && options.mode !== 'stack') {
      dataObject = dataObject.select(dataObject.data.map(({header}) => header).slice(0, 2))
    } else if (type === 'radar' && options.mode === 'default') {
      dataObject = dataObject.select(dataObject.data.map(({header}) => header).slice(0, 2))
    }
  }
  // 特殊图层需要其他图层的比例尺
  const customScale = isDependentLayer(type) && (() => {
    const dependLayer = wave.layer.find(({id}) => id === options.bind).instance
    if (type === 'axis') {
      // 坐标轴根据不同的图层进行优化显示
      dataObject = {className: dependLayer.constructor.name}
    } else if (type === 'legend') {
      // 图例需要的数据很特殊，是一个图层的实例，以便控制数据过滤
      dataObject = dependLayer
    }
    return dependLayer.scale
  })()
  // 设置图层的数据，第二个参数为比例尺，第三个参数为比例尺配置
  dataObject && layer.setData(dataObject, customScale, scale)
  // 设置图层的样式
  style && layer.setStyle(style)
  // 设置图层的事件
  event && Object.keys(event).forEach(eventName => layer.event.on(eventName, event[eventName]))
  // 设置图层的动画，由于渲染是异步的，动画需要在渲染之后才能配置
  setTimeout(() => animation && layer.setAnimation(animation)(), 0)
  // 设置图层的 Tooltip，由于渲染是异步的，tooltip 事件需要在渲染之后才能绑定 dom
  setTimeout(() => tooltip && layer.setTooltip(tooltip), 0)
}

// 根据配置创建一个新的图表
function createWave(schema) {
  const {container, adjust, width, height, padding, theme, layout, brush, layers} = schema
  const wave = new Wave({container, adjust, width, height, padding, theme, layout})
  // 辅助层比较特殊，需要依赖其他图层的数据或者比例尺
  const dependentLayer = layers.filter(({type}) => isDependentLayer(type))
  const normalLayer = layers.filter(({type}) => !isDependentLayer(type))
  // 先创建前置图层
  try {
    normalLayer.map(layer => createLayer(wave, layer))
    dependentLayer.map(layer => createLayer(wave, layer))
    // 根据 schema 配置的顺序进行绘制
    layers.map(({options}) => wave.layer.find(({id}) => id === options.id).instance.draw())
    // 绘制完成后添加笔刷
    brush && wave.createBrush({...brush, layout: wave.layout[brush.layout]})
  } catch (e) {
    console.error('图层配置解析错误，初始化失败', e)
  }
  return wave
}

// 根据配置更新原有的图表，通常情况下改动只有一个
function updateWave(wave, schema) {
  console.log(wave, schema)
}

export default {
  createWave,
  updateWave,
}

import Wave from './wave'
import DataBase from './data/base'
import TableList from './data/table-list'
import Table from './data/table'

// 图层是否依赖其他图层
const isDependentLayer = layerType => ['auxiliary', 'axis'].find(type => type === layerType)
// 根据配置创建一个图层
const createLayer = (wave, config) => {
  const {type, options, data, style, animation, tooltip, event} = config
  const layer = wave.createLayer(type, {...options, layout: wave.layout[options.layout]})
  // 特殊图层需要其他图层的比例尺
  const scale = isDependentLayer(type) && (() => {
    let result = null
    const scales = wave.layer.find(({id}) => id === options.bind).instance.scale
    if (type === 'auxiliary') {
      result = options.direction === 'horizontal' ? scales.scaleY : scales.scaleX
    } else if (type === 'axis') {
      style.type === 'axisX' && (result = scales.scaleX)
      style.type === 'axisY' && (result = scales.scaleY)
      style.type === 'angle' && (result = scales.scaleAngle)
      style.type === 'radius' && (result = scales.scaleRadius)
    }
    return result
  })()
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
    }
  }
  // 待删除
  type === 'axis' && layer.setScale(scale)
  type === 'axis' && layer.setLayout(wave.layout[options.layout])
  // 设置图层的数据
  dataObject && layer.setData(dataObject, scale)
  // 设置图层的样式
  layer.setStyle(style)
  // 绘制图层
  layer.draw()
  // 设置图层的动画，由于渲染是异步的，动画需要在渲染之后才能配置
  setTimeout(() => {
    animation && layer.setAnimation(animation)
    animation && Object.keys(layer.animation).forEach(elType => {
      layer.animation[elType] && layer.animation[elType].play()
    })
  }, 0)
  // 设置图层的 Tooltip
  tooltip && layer.setTooltip(tooltip)
  // 设置图层的事件
  event && Object.keys(event).forEach(eventName => {
    layer.event.on(eventName, event[eventName])
  })
}

// 根据配置创建一个新的图表
function createWave(schema) {
  const {container, adjust, width, height, padding, theme, layout, layers} = schema
  const wave = new Wave({container, adjust, width, height, padding, theme, layout})

  // 辅助层比较特殊，需要依赖其他图层的数据或者比例尺
  const dependentLayer = layers.filter(({type}) => isDependentLayer(type))
  const normalLayer = layers.filter(({type}) => !isDependentLayer(type))
  // 先创建前置图层
  try {
    normalLayer.map(layer => createLayer(wave, layer))
    dependentLayer.map(layer => createLayer(wave, layer)) 
  } catch (e) {
    console.error('图层配置解析错误', e)
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

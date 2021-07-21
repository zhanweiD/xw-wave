import {isArray} from 'lodash'
import Wave from '../wave'
import DataBase from '../data/base'
import TableList from '../data/table-list'
import Table from '../data/table'
import Random from '../data/random'
import Relation from '../data/relation'

// 图层是否依赖其他图层
const dependentLayers = ['legend']
const isDependentLayer = layerType => dependentLayers.find(type => type === layerType)
const isNormalLayer = layerType => !dependentLayers.find(type => type === layerType) && layerType !== 'axis'
const isAxisLayer = layerType => layerType === 'axis'

// 根据配置创建一个图层
const createLayer = (wave, config) => {
  const {type, options, data, scale, style, animation, tooltip, event} = config
  const layer = wave.createLayer(type, {...options, layout: wave.layout[options.layout]})
  // 数据结构判断
  let dataSet = data
  if (isArray(data) && data.length === 2 && DataBase.isRelation(data[0], data[1])) {
    dataSet = new Relation(data[0], data[1])
  } else if (DataBase.isTable(data) || data?.type === 'table') {
    dataSet = new Table(DataBase.isTable(data) ? data : Random.table(data))
  } else if (DataBase.isTableList(data) || data?.type === 'tableList') {
    dataSet = new TableList(DataBase.isTableList(data) ? data : Random.tableList(data))
    // 列表到表格的转换
    if (type === 'matrix' || type === 'chord') {
      dataSet = new Table(DataBase.tableListToTable(DataBase.isTableList(data) ? data : Random.tableList(data)))
    }
  }
  // 特殊图层需要其他图层的比例尺
  let customScale
  // 图例需要的数据很特殊，是一个图层的实例，以便控制数据过滤
  if (type === 'legend') {
    dataSet = wave.layer.filter(({instance}) => instance.data instanceof TableList).map(({instance}) => instance)
  } else if (isDependentLayer(type)) {
    customScale = wave.layer.find(item => item.type === 'axis').instance.scale
  }
  // 设置图层的数据，第二个参数为比例尺，第三个参数为比例尺配置
  layer.setData(dataSet, {...customScale, nice: scale})
  // 设置图层的样式
  style && layer.setStyle(style)
  // 设置图层的事件
  event && Object.keys(event).forEach(eventName => layer.event.on(eventName, event[eventName]))
  // 设置图层的动画，由于渲染是异步的，动画需要在渲染之后才能配置
  // setTimeout(() => animation && layer.setAnimation(animation)(), 0)
  // 设置图层的 Tooltip，由于渲染是异步的，tooltip 事件需要在渲染之后才能绑定 dom
  setTimeout(() => tooltip && layer.setTooltip(tooltip), 0)
  return layer
}

// 根据配置创建一个新的图表
function createWave(schema, existedWave) {
  try {
    const {container, adjust, width, height, padding, theme, coordinate, define, layout, brush, layers} = schema
    const wave = existedWave || new Wave({container, define, adjust, width, height, padding, coordinate, theme, layout})
    // 有些层比较特殊，需要依赖其他图层的数据或者比例尺
    const normalLayerConfigs = layers.filter(({type}) => isNormalLayer(type))
    const axisLayerConfig = layers.find(({type}) => isAxisLayer(type))
    const dependentLayerConfigs = layers.filter(({type}) => isDependentLayer(type))
    const normalLayers = normalLayerConfigs.map(layer => createLayer(wave, layer))
    const axisLayer = axisLayerConfig && createLayer(wave, axisLayerConfig)
    // 坐标轴层会对现有图层进行比例尺融合
    axisLayer && wave.bindCoordinate(axisLayer, normalLayers)
    // 最后绘制依赖其他图层的图层
    dependentLayerConfigs.map(layer => createLayer(wave, layer))
    // 根据 schema 配置的顺序进行绘制，绘制之后添加添加笔刷，然后是动画和 tooltip
    layers.map(({options}) => wave.layer.find(({id}) => id === options.id).instance.draw())
    brush && wave.createBrush({...brush, layout: wave.layout[brush.layout]})
    return wave
  } catch (error) {
    console.error('初始化失败', error)
    return null
  }
}

export default createWave

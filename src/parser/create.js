import {isArray} from 'lodash'
import Wave from '../wave'
import DataBase from '../data/base'
import TableList from '../data/table-list'
import Table from '../data/table'
import Random from '../data/random'
import Relation from '../data/relation'

// 图层是否依赖其他图层
const isAxisLayer = layerType => layerType === 'axis'
const isLegendLayer = layerType => layerType === 'legend'
const isNormalLayer = layerType => !isAxisLayer(layerType) && !isLegendLayer(layerType)

// 根据配置创建一个图层
const createLayer = (wave, config) => {
  const {type, options, data, scale, style, animation, event} = config
  const layer = wave.createLayer(type, {...options, layout: wave.layout[options.layout]})
  // 数据结构判断
  let dataSet = data
  if (type === 'legend') {
    dataSet = wave.layer.filter(({instance}) => instance.data instanceof TableList).map(({instance}) => instance)
  } else if (isArray(data) && data.length === 2 && DataBase.isRelation(data[0], data[1])) {
    dataSet = new Relation(data[0], data[1])
  } else if (DataBase.isTable(data) || data?.type === 'table') {
    dataSet = new Table(DataBase.isTable(data) ? data : Random.table(data))
  } else if (DataBase.isTableList(data) || data?.type === 'tableList') {
    if (type === 'matrix' || type === 'chord') {
      dataSet = new Table(DataBase.isTableList(data) ? DataBase.tableListToTable(data) : Random.tableList(data))
    } else {
      dataSet = new TableList(DataBase.isTableList(data) ? data : Random.tableList(data))
    }
  } 
  // 设置图层的数据，第二个参数为比例尺配置
  layer.setData(dataSet, {nice: scale})
  // 设置图层的样式
  style && layer.setStyle(style)
  // 设置图层的事件
  event && Object.keys(event).forEach(eventName => layer.event.on(eventName, event[eventName]))
  // 设置图层的动画（异步函数）
  layer.setAnimation(animation)
  return layer
}

// 根据配置创建一个新的图表
function createWave(schema, existedWave) {
  const {brush, layers, ...initialConfig} = schema
  const wave = existedWave || new Wave(initialConfig)
  // 有些层比较特殊，需要依赖其他图层的数据或者比例尺
  const normalLayerConfigs = layers.filter(({type}) => isNormalLayer(type))
  const axisLayerConfig = layers.find(({type}) => isAxisLayer(type))
  const legendLayerConfig = layers.find(({type}) => isLegendLayer(type))
  // 图层实例
  const normalLayers = normalLayerConfigs.map(layer => createLayer(wave, layer))
  const axisLayer = axisLayerConfig && createLayer(wave, axisLayerConfig)
  // 坐标轴层会对现有图层进行比例尺融合
  axisLayerConfig && wave.bindCoordinate(axisLayer, normalLayers)
  // 最后绘制依赖其他图层的图例图层
  legendLayerConfig && createLayer(wave, legendLayerConfig)
  // 根据 schema 配置的顺序进行绘制
  layers.map(({options}) => wave.layer.find(({id}) => id === options.id).instance.draw())
  // 绘制之后添加添加笔刷，然后是动画和 tooltip
  brush && wave.createBrush({...brush, layout: wave.layout[brush.layout]})
  // 默认开启动画，后面改成由 wave 统一管理
  setTimeout(() => wave.layer.map(({instance}) => instance.playAnimation()))
  return wave
}

export default (...parameter) => {
  try {
    return createWave(...parameter)
  } catch (error) {
    console.error('图表初始化失败\n', error)
    return null
  }
}

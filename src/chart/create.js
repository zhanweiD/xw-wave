import {isArray} from 'lodash'
import Wave from './wave'
import DataBase from '../data/base'
import TableList from '../data/table-list'
import Table from '../data/table'
import Random from '../data/random'
import Relation from '../data/relation'
import createLog from '../utils/create-log'

const isAxisLayer = layerType => layerType === 'axis'
const isLegendLayer = layerType => layerType === 'legend'
// normal means independent
const isNormalLayer = layerType => !isAxisLayer(layerType) && !isLegendLayer(layerType)
const dataBase = new DataBase()
const log = createLog('src/wave/create')

const createLayer = (wave, config) => {
  const {type, options, data, scale, style, animation, event} = config
  const layer = wave.createLayer(type, {...options, layout: wave.layout[options.layout]})
  // data structure judgement
  let dataSet = data
  if (type === 'legend') {
    dataSet = wave.layer.map(({instance}) => instance)
  } else if (dataBase.isTable(data) || data?.type === 'table') {
    dataSet = new Table(dataBase.isTable(data) ? data : Random.table(data))
  } else if (isArray(data) && data.length === 2 && dataBase.isRelation(data[0], data[1])) {
    if (type === 'chord') {
      dataSet = new Table(dataBase.relationToTable(data[0], data[1]))
    } else {
      dataSet = new Relation(data[0], data[1])
    }
  } else if (dataBase.isTableList(data) || data?.type === 'tableList') {
    if (type === 'matrix') {
      dataSet = new Table(dataBase.tableListToTable(data))
    } else {
      dataSet = new TableList(dataBase.isTableList(data) ? data : Random.tableList(data))
    }
  } 
  layer.setData(dataSet, {nice: scale})
  layer.setStyle(style)
  layer.setAnimation(animation)
  event && Object.keys(event).forEach(eventName => {
    layer.event.on(eventName, event[eventName])
  })
  return layer
}

// create a wave by schema
const createWave = (schema, existedWave) => {
  const {brush, layers, ...initialConfig} = schema
  const wave = existedWave || new Wave(initialConfig)
  // some special layers require data or scales from other layers
  const normalLayerConfigs = layers.filter(({type}) => isNormalLayer(type))
  const axisLayerConfig = layers.find(({type}) => isAxisLayer(type))
  const legendLayerConfig = layers.find(({type}) => isLegendLayer(type))
  // layer instance
  const normalLayers = normalLayerConfigs.map(layer => createLayer(wave, layer))
  const axisLayer = axisLayerConfig && createLayer(wave, axisLayerConfig)
  // axis layer control all scales
  axisLayerConfig && wave.bindCoordinate(axisLayer, normalLayers)
  // legend layer is the last one
  legendLayerConfig && createLayer(wave, legendLayerConfig)
  // draw in order with schema
  layers.map(({options}) => wave.layer.find(({id}) => id === options.id).instance.draw())
  // create brush after draw
  brush && wave.createBrush({...brush, layout: wave.layout[brush.layout]})
  // TODO: throw and give control to users
  setTimeout(() => wave.layer.map(({instance}) => instance.playAnimation()))
  return wave
}

export default (...parameter) => {
  try {
    return createWave(...parameter)
  } catch (error) {
    log.error('createWave: Wave initialization failed', error)
    return null
  }
}

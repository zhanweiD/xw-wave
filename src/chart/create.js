import Chart from './chart'
import DataBase from '../data/base'
import TableList from '../data/table-list'
import Table from '../data/table'
import Random from '../data/random'
import Relation from '../data/relation'
import createLog from '../utils/create-log'
import conversionData from '../utils/conversion'
import sanKeyData from '../utils/sankey'
import chordData from '../utils/chordData'

const isAxisLayer = layerType => layerType === 'axis'
const isLegendLayer = layerType => layerType === 'legend'
// normal means independent
const isNormalLayer = layerType => !isAxisLayer(layerType) && !isLegendLayer(layerType)
const dataBase = new DataBase()
const log = createLog('src/chart/create')

const createLayer = (chart, config) => {
  const {type, options, data, scale, style, animation, event} = config
  const layer = chart.createLayer(type, {...options, layout: chart.layout[options.layout]})
  let dataSet = data
  if (type === 'legend') {
    dataSet = chart.layers.map(({instance}) => instance)
  } else if (dataBase.isTable(data) || data?.type === 'table') {
    dataSet = new Table(dataBase.isTable(data) ? data : Random.table(data))
  } else if (type !== 'indicator' && (dataBase.isTableList(data) || data?.type === 'tableList')) {
    if (type === 'matrix') {
      dataSet = new Table(dataBase.tableListToTable(data))
    } else if (['edgeBundle', 'pack', 'tree', 'treemap', 'tabMenu'].indexOf(type) !== -1) {
      const source = conversionData(data)
      dataSet = new Relation(source[0], source[1])
    } else if (type === 'sankey') {
      const source = sanKeyData(data)
      dataSet = new Relation(source[0], source[1])
    } else if (type === 'chord') {
      dataSet = new Table(chordData(data))
    } else {
      dataSet = new TableList(dataBase.isTableList(data) ? data : Random.tableList(data))
    }
  } else {
    dataSet = new DataBase(data)
  }
  layer.setData(dataSet, {nice: scale})
  layer.setStyle(style)
  layer.setAnimation(animation)
  if (event) {
    Object.keys(event).forEach(eventName => layer.event.on(eventName, event[eventName]))
  }
  return layer
}

// create a chart by schema
const createChart = (schema, existedChart) => {
  if (!schema) {
    log.error('createChart: Invalid schema')
    return null
  }
  const {brush, layers = [], callback, ...initialConfig} = schema
  const chart = existedChart || new Chart(initialConfig)
  // some special layers require data or scales from other layers
  const normalLayerConfigs = layers.filter(({type}) => isNormalLayer(type))
  const axisLayerConfig = layers.find(({type}) => isAxisLayer(type))
  const legendLayerConfig = layers.find(({type}) => isLegendLayer(type))
  // layer instance
  normalLayerConfigs.map(layer => createLayer(chart, layer))
  axisLayerConfig && createLayer(chart, axisLayerConfig)
  // axis layer control all scales
  axisLayerConfig && chart.bindCoordinate()
  // legend layer is the last one
  legendLayerConfig && createLayer(chart, legendLayerConfig)
  // draw in order with schema
  layers.map(({options}) => chart.layers.find(({id}) => id === options.id).instance.draw())
  // create brush after draw
  brush && chart.createBrush({...brush, layout: chart.layout[brush.layout]})
  // TODO: throw and give control to users
  setTimeout(() => chart.layers.map(({instance}) => instance.playAnimation()))
  // callback after create
  callback && callback(chart)
  return chart
}

export default (...parameter) => {
  try {
    return createChart(...parameter)
  } catch (error) {
    log.error('createChart: Chart initialization failed', error)
    return null
  }
}

import * as d3 from 'd3'
import chroma from 'chroma-js'
import {fabric} from 'fabric'
import createUuid from '../utils/uuid'
import createLog from '../utils/create-log'
import createEvent from '../utils/create-event'
import createDefs, {makeGradientCreator} from '../utils/define'
import Layer, {layerMapping} from '../layer'
import {coordinateType} from '../layer/axis'
import Tooltip from './tooltip'
import Layout from '../layout'

const stateType = {
  INITILIZE: 'initilize',
  DESTROY: 'destroy',
  READY: 'ready',
  WARN: 'warn',
}

const brushType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

export default class Wave {
  #state = null

  #container = null

  #padding = null

  #layout = null

  #engine = null

  #root = null

  #defs = null

  #tooltip = null

  #layers = []

  get state() {
    return this.#state
  }

  get layout() {
    return this.#layout
  }

  get layers() {
    return this.#layers
  }

  constructor({
    container,
    width = 100,
    height = 100,
    padding = [0, 0, 0, 0],
    adjust = true,
    theme = [],
    define = {},
    tooltip = {},
    engine = 'svg',
    layout = Layout.standard(false),
  }) {
    // initialize some attr
    this.#state = stateType.INITILIZE
    this.#container = d3.select(container)
    this.#engine = engine

    // initialize the wave width and height
    if (adjust) {
      const rect = this.#container.nodes()[0].getBoundingClientRect()
      this.containerWidth = rect.width
      this.containerHeight = rect.height
    } else {
      this.containerWidth = width
      this.containerHeight = height
    }

    // initialize the main padding
    if (padding.length === 1) {
      this.#padding = [padding[0], padding[0], padding[0], padding[0]]
    } else if (padding.length === 2) {
      this.#padding = [padding[0], padding[1], padding[0], padding[1]]
    } else if (padding.length === 3) {
      this.#padding = [padding[0], padding[1], padding[2], padding[1]]
    } else {
      this.#padding = padding
    }

    // initialize the dom & root
    this.#container.html('')
    if (engine === 'svg') {
      this.#root = this.#container
        .append('svg')
        .attr('width', this.containerWidth)
        .attr('height', this.containerHeight)
        .style('position', 'absolute')
      this.#defs = this.#root.append('defs')
    } else if (engine === 'canvas') {
      const canvas = this.#container
        .append('canvas')
        .attr('width', this.containerWidth)
        .attr('height', this.containerHeight)
        .style('position', 'absolute')
      fabric.Object.prototype.objectCaching = false
      this.#defs = []
      this.#root = new fabric.Canvas(canvas.nodes()[0], {selection: false, hoverCursor: 'pointer'})
      this.#root.defs = this.#defs
    }

    // initialize the layout
    this.#layout = layout({
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      padding: this.#padding,
    })

    // initialize other attr
    this.theme = theme
    this.log = createLog('src/wave/wave')
    this.event = createEvent('src/wave/wave')
    this.#tooltip = new Tooltip(this.#container, tooltip)
    createDefs({schema: define, container: this.#defs})
  }

  /**
   * basic color function that used by layer
   * @param {Number} count color number that we want
   * @param {Array} customColors custom colors will override theme colors
   */
  getColor(count, customColors) {
    let colors = this.theme
    // custom theme
    if (Array.isArray(customColors)) {
      colors = customColors
    } else if (customColors) {
      return new Array(count).fill(customColors)
    }
    // how to get colors with color array
    if (colors.length > 2 && !customColors) {
      colors.length > 2 && count <= 3 && (colors = colors.slice(2, 7))
      colors.length > 2 && count === 4 && (colors = colors.slice(2))
    }
    return chroma.scale(colors).mode('lch').colors(count)
  }

  /**
   * create a layer
   * @param {String} type
   * @param {Object} options
   * @returns {LayerBase}
   */
  createLayer(type, options = {}) {
    // context from wave
    const context = {
      root: this.#root,
      engine: this.#engine,
      tooltip: this.#tooltip,
      container: this.#container,
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      createGradient: makeGradientCreator(this.#defs, this.#engine),
      bindCoordinate: this.bindCoordinate.bind(this),
      getColor: this.getColor.bind(this),
    }
    // generate a layer by layer type
    const layer = new layerMapping[type](options, context)
    const layerId = options.id || createUuid()
    // wave will save the layer for easy management
    this.#state = stateType.READY
    this.#layers.push({type, id: layerId, instance: layer})
    // register destroy event
    layer.event.on('destroy', () => {
      const index = this.#layers.findIndex(({id}) => id === layerId)
      this.#layers.splice(index, 1)
    })
    return layer
  }

  /**
   * update the layer
   * @param {String} id
   * @param {Object} schema layer config
   */
  updateLayer(id, {data, scale, style, animation}) {
    const layer = this.#layers.find(item => item.id === id)?.instance
    if (layer) {
      layer.setAnimation(animation)
      layer.setData(data, scale)
      layer.setStyle(style)
      layer.draw()
    } else {
      this.log.warn('Failed to update the layer: Invalid ID', {id})
    }
  }

  /**
   * bind coordinate after layer's setData done
   * @param {AxisLayer} axisLayer
   * @param {LayerBase} layers
   */
  bindCoordinate({redraw = false}) {
    const isAxisLayer = instance => instance instanceof Layer.Axis
    const isBaseMapLayer = instance => instance instanceof Layer.BaseMap
    const axisLayer = this.#layers.find(({instance}) => isAxisLayer(instance))?.instance
    const {type} = axisLayer.options
    const layers = this.#layers
      .filter(({instance}) => instance.scale && !isAxisLayer(instance))
      .map(({instance}) => instance)
    // merge scales
    layers.forEach(layer => {
      const {scale, options} = layer
      const {axis} = options
      const scales = {}
      if (type.search(coordinateType.CARTESIAN) !== -1) {
        scales.scaleX = scale.scaleX
        if (axis === 'minor') {
          scales.scaleYR = scale.scaleY
        } else {
          scales.scaleY = scale.scaleY
        }
      }
      if (type.search(coordinateType.POLAR) !== -1) {
        scales.scaleAngle = scale.scaleAngle
        scales.scaleRadius = scale.scaleRadius
      }
      if (type.search(coordinateType.GEOGRAPHIC) !== -1 && isBaseMapLayer(layer)) {
        scales.scaleX = scale.scaleX
        scales.scaleY = scale.scaleY
      }
      axisLayer.setData(null, scales)
      axisLayer.setStyle()
    })
    // axis will merge all scales and give them to every layer
    layers.forEach(layer => {
      const scales = {...layer.scale, ...axisLayer.scale}
      // projection to normal scale
      if (type.search(coordinateType.GEOGRAPHIC) !== -1) {
        const scaleX = x => scales.scaleX(x) - layer.options.layout.left
        const scaleY = y => scales.scaleY(y) - layer.options.layout.top
        layer.setData(null, {...scales, scaleX, scaleY})
        layer.setStyle()
        // attention that draw baseMap layer will stuck in infinite loop
        redraw && !isBaseMapLayer(layer) && layer.draw()
      } else {
        const scaleY = layer.options.axis === 'minor' ? scales.scaleYR : scales.scaleY
        layer.setData(null, {...scales, scaleY})
        layer.setStyle()
        redraw && layer.draw()
      }
    })
  }

  /**
   * create brush based on layer
   * @param {Object} options
   */
  createBrush(options = {}) {
    if (this.#engine === 'svg') {
      const {type, layout, targets} = options
      const {width, height, left, top} = layout
      const isHorizontal = type === brushType.HORIZONTAL
      const layers = this.#layers.filter(({id}) => targets.find(item => item === id))
      const prevRange = new Array(layers.length).fill(null)
      // brush will change range of scale
      const brushed = event => layers.forEach(({instance}, i) => {
        const {selection} = event
        const total = isHorizontal ? width : height
        const scale = isHorizontal ? instance.scale.scaleX : instance.scale.scaleY
        // initialize
        if (prevRange[i] === null) {
          prevRange[i] = scale.range()
        }
        const zoomFactor = total / (selection[1] - selection[0] || 1)
        const nextRange = [prevRange[i][0], prevRange[i][0] + (prevRange[i][1] - prevRange[i][0]) * zoomFactor]
        const offset = ((selection[0] - (isHorizontal ? left : top)) / total) * (nextRange[1] - nextRange[0])
        scale.range(nextRange.map(value => value - offset))
        // mark scale with brush so that layer base can merge scales correctly
        scale.brushed = true
        instance.setData(null, {[isHorizontal ? 'scaleX' : 'scaleY']: scale})
        instance.setStyle()
        instance.draw()
      })
      // create brush instance
      const [brushX1, brushX2, brushY1, brushY2] = [left, left + width, top, top + height]
      const brush = isHorizontal ? d3.brushX() : d3.brushY()
      brush.on('brush', brushed).extent([
        [brushX1, brushY1],
        [brushX2, brushY2],
      ])
      // initialize brush area
      const brushDOM = this.#root.append('g').attr('class', 'wave-brush').call(brush)
      brushDOM.call(brush.move, isHorizontal ? [brushX1, brushX2] : [brushY1, brushY2])
    }
  }

  destroy() {
    this.#state = stateType.DESTROY
    while (this.#layers.length !== 0) {
      this.#layers[0].instance.destroy()
    }
  }
}

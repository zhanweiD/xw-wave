import * as d3 from 'd3'
import {fabric} from 'fabric'
import createUuid from '../utils/uuid'
import createLog from '../utils/create-log'
import createEvent from '../utils/create-event'
import createDefs, {makeGradientCreator} from '../utils/define'
import Layer, {layerMapping} from '../layer'
import Tooltip from './tooltip'
import Layout from '../layout'
import {COORDINATE, DIRECTION, STATE} from '../utils/constants'

export default class Chart {
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
    adjust = true,
    engine = 'svg',
    padding = [0, 0, 0, 0],
    theme = d3.schemeCategory10,
    layout = Layout.standard(false),
    define = {},
    tooltip = {},
  }) {
    // initialize state
    this.#engine = engine
    this.#state = STATE.INITILIZE
    this.#container = d3.select(container)

    // initialize the chart width and height
    if (adjust) {
      this.containerWidth = +this.#container.style('width').match(/^\d*/)[0]
      this.containerHeight = +this.#container.style('height').match(/^\d*/)[0]
    } else {
      this.containerWidth = width
      this.containerHeight = height
    }

    // initialize the svg & canvas
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
      this.#defs = []
      this.#root = new fabric.Canvas(canvas.nodes()[0], {selection: false, hoverCursor: 'pointer'})
      this.#root.defs = this.#defs
      fabric.Object.prototype.objectCaching = false
    }

    // initialize other attr
    this.theme = theme
    this.log = createLog('src/chart')
    this.event = createEvent('src/chart')
    this.#tooltip = new Tooltip(this.#container, tooltip)
    this.setPadding(padding, layout)

    // custom svg dom
    createDefs({schema: define, engine, container: this.#defs})
  }

  /**
   * set layout for chart
   * @param {Array<Number>} padding
   * @param {Function} layout layout creator
   */
  setPadding(padding, layout = Layout.standard(false)) {
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
    // initialize the layout
    this.#layout = layout({
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      padding: this.#padding,
    })
  }

  /**
   * create a layer
   * @param {String} type
   * @param {Object} options layer options
   * @returns {LayerBase}
   */
  createLayer(type, options = {}) {
    if (!layerMapping[type]) {
      this.log.error(`Wrong layer type: '${type}'`)
      return null
    }
    // context from chart
    const context = {
      root: this.#root,
      engine: this.#engine,
      tooltip: this.#tooltip,
      container: this.#container,
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      createGradient: makeGradientCreator(this.#defs, this.#engine),
      bindCoordinate: this.bindCoordinate.bind(this),
      theme: this.theme,
    }
    // generate a layer by layer type
    const layer = new layerMapping[type](options, context)
    const layerId = options.id || createUuid()
    // chart will save the layer for easy management
    this.#state = STATE.READY
    this.#layers.push({type, id: layerId, instance: layer})
    return layer
  }

  getLayer(id) {
    const layer = this.#layers.find(item => item.id === id)
    !layer && this.log.warn('getLayer: Invalid ID', {id})
    return layer.instance
  }

  updateLayer({id, data, scale, style, animation}) {
    const layer = this.getLayer(id)
    layer && layer.update({data, scale, style, animation})
  }

  setVisiable({id, visible}) {
    const layer = this.getLayer(id)
    layer && layer.setVisiable(visible)
  }

  bindCoordinate(redraw = false, triggerLayer) {
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
      if (type.search(COORDINATE.CARTESIAN) !== -1) {
        scales.scaleX = scale.scaleX
        if (axis === 'minor') {
          scales.scaleYR = scale.scaleY
        } else {
          scales.scaleY = scale.scaleY
        }
      }
      if (type.search(COORDINATE.POLAR) !== -1) {
        scales.scaleAngle = scale.scaleAngle
        scales.scaleRadius = scale.scaleRadius
      }
      if (type.search(COORDINATE.GEOGRAPHIC) !== -1 && isBaseMapLayer(layer)) {
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
      if (type.search(COORDINATE.GEOGRAPHIC) !== -1) {
        const scaleX = x => scales.scaleX(x) - layer.options.layout.left
        const scaleY = y => scales.scaleY(y) - layer.options.layout.top
        layer.setData(null, {...scales, scaleX, scaleY})
      } else {
        const scaleY = layer.options.axis === 'minor' ? scales.scaleYR : scales.scaleY
        layer.setData(null, {...scales, scaleY})
      }
      layer.setStyle()
      redraw && layer !== triggerLayer && layer.draw()
    })
  }

  createBrush({type, layout, targets}) {
    if (this.#engine !== 'svg') {
      this.log.warn('The brush only supports svg')
      return
    }
    const {width, height, left, top} = layout
    const isHorizontal = type === DIRECTION.HORIZONTAL
    const layers = this.#layers.filter(({id}) => targets.find(item => item === id))
    const prevRange = new Array(layers.length).fill(null)
    // brush will change range of scale
    const brushed = event => {
      layers.forEach(({instance}, i) => {
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
    }
    // create brush instance
    const [brushX1, brushX2, brushY1, brushY2] = [left, left + width, top, top + height]
    const brush = isHorizontal ? d3.brushX() : d3.brushY()
    brush.on('brush', brushed).extent([
      [brushX1, brushY1],
      [brushX2, brushY2],
    ])
    // initialize brush area
    const brushDOM = this.#root.append('g').attr('class', 'chart-brush').call(brush)
    brushDOM.call(brush.move, isHorizontal ? [brushX1, brushX2] : [brushY1, brushY2])
  }

  destroy() {
    this.#state = STATE.DESTROY
    while (this.#layers.length) {
      this.#layers.shift().instance.destroy()
    }
  }
}

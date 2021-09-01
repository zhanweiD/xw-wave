import * as d3 from 'd3'
import chroma from 'chroma-js'
import {fabric} from 'fabric'
import createUuid from '../util/uuid'
import createLog from '../util/create-log'
import catchError from '../util/catch-error'
import createEvent from '../util/create-event'
import createDefs, {makeGradientCreator} from '../util/define'
import {layerMapping} from '../layer'
import Tooltip from './tooltip'
import Layout from '../layout'

const stateType = {
  INITILIZE: 'initilize',
  DESTROY: 'destroy',
  READY: 'ready',
  WARN: 'warn',
}

const engineType = {
  SVG: 'svg',
  CANVAS: 'canvas',
}

const brushType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

const coordinateType = {
  CARTESIAN_BAND_LINEAR: 'cartesian-band-linear',
  CARTESIAN_LINEAR_LINEAR: 'cartesian-linear-linear',
  POLAR_BAND_LINEAR: 'polar-band-linear',
  CARTESIAN_POLAR: 'cartesian-polar',
  GEOGRAPHIC: 'geographic',
}

// 图表类主要用于管理图层
export default class Wave {
  #state = null

  #container = null

  #padding = null

  #layout = null

  #engine = null

  #root = null

  #defs = null

  #tooltip = null

  #layer = []

  get state() {
    return this.#state
  }

  get layout() {
    return this.#layout
  }

  get layer() {
    return this.#layer
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
    baseFontSize = 1,
    engine = engineType.CANVAS,
    layout = Layout.standard(false),
    coordinate = coordinateType.CARTESIAN_BAND_LINEAR,
  }) {
    // initialize some attr
    this.#state = stateType.INITILIZE
    this.#container = d3.select(container)
    this.#engine = engine

    // initialize the wave width and height
    if (adjust) {
      const rect = this.#container._groups[0][0].getBoundingClientRect()
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
    if (engine === engineType.SVG) {
      this.#root = this.#container
        .append('svg')
        .attr('width', this.containerWidth)
        .attr('height', this.containerHeight)
        .style('position', 'absolute')
      this.#defs = this.#root.append('defs')
    } else if (engine === engineType.CANVAS) {
      const canvas = this.#container
        .append('canvas')
        .attr('width', this.containerWidth)
        .attr('height', this.containerHeight)
        .style('position', 'absolute')
      const canvasRoot = new fabric.StaticCanvas(canvas._groups[0][0])
      this.#root = new fabric.Group()
      this.#defs = []
      canvasRoot.add(this.#root)
      canvasRoot.defs = this.#defs
    }
    
    // initialize the layout
    this.#layout = layout({
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      padding: this.#padding,
    })

    // initialize other attr
    this.theme = theme
    this.coordinate = coordinate
    this.baseFontSize = baseFontSize
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
      baseFontSize: this.baseFontSize,
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      createGradient: makeGradientCreator(this.#defs, this.#engine),
      getColor: this.getColor.bind(this),
    }
    // generate a layer by layer type
    const layer = new layerMapping[type](options, context)
    const layerId = options.id || createUuid()
    // wave will save the layer for easy management 
    this.#state = stateType.READY
    this.#layer.push({type, id: layerId, instance: layer})
    // catch layer's life cycle
    catchError(layer, error => {
      this.#state = stateType.WARN
      this.log.error('Wave: Layer life cycle call exception', error)
    })
    // register destroy event
    layer.event.on('destroy', () => {
      const index = this.#layer.findIndex(({id}) => id === layerId)
      this.#layer.splice(index, 1)
    })
    return layer
  }

  /**
   * bind coordinate after layer's setData done
   * @param {AxisLayer} axisLayer
   * @param {LayerBase} layers
   */
  bindCoordinate(axisLayer, layers) {
    layers = layers.filter(layer => layer.scale)
    layers.forEach(({scale, options}) => {
      const result = {}
      const {axis} = options
      // cartesian coordinate system
      if (this.coordinate.search('cartesian') !== -1) {
        result.scaleX = scale.scaleX
        axis === 'main' && (result.scaleY = scale.scaleY)
        axis === 'minor' && (result.scaleYR = scale.scaleY)
      }
      // polar coordinate system
      if (this.coordinate.search('polar') !== -1) {
        result.scaleAngle = scale.scaleAngle
        result.scaleRadius = scale.scaleRadius
      }
      // geography coordinate system
      if (this.coordinate.search('geographic') !== -1) {
        result.scalePosition = scale.scalePosition
      }
      axisLayer.setData(null, result)
      axisLayer.setStyle()
    })
    // axis will merge all scales and give them to every layer
    layers.forEach(layer => {
      const scales = {...layer.scale, ...axisLayer.scale}
      // projection to normal scale
      if (this.coordinate.search('geographic') !== -1) {
        const scaleX = x => scales.scalePosition([x, 0])[0] - layer.options.layout.left
        const scaleY = y => scales.scalePosition([0, y])[1] - layer.options.layout.top
        layer.setData(null, {...scales, scaleX, scaleY})
      } else {
        const scaleY = layer.options.axis === 'minor' ? scales.scaleYR : scales.scaleY
        layer.setData(null, {...scales, scaleY})
      }
      layer.setStyle()
    })
  }

  /**
   * create brush based on layer
   * @param {Object} options
   */
  createBrush(options = {}) {
    if (this.#engine === engineType.SVG) {
      const {type, layout, targets} = options
      const {width, height, left, top} = layout
      const isHorizontal = type === brushType.HORIZONTAL
      const layers = this.#layer.filter(({id}) => targets.find(item => item === id))
      const prevRange = new Array(layers.length).fill(null)
      // brush will change range of scale
      const brushed = event => layers.forEach(({instance}, i) => {
        const {selection} = event
        const total = isHorizontal ? width : height
        const scale = isHorizontal ? instance.scale.scaleX : instance.scale.scaleY
        if (prevRange[i] === null) prevRange[i] = scale.range()
        const zoomFactor = total / ((selection[1] - selection[0]) || 1)
        const nextRange = [prevRange[i][0], prevRange[i][0] + (prevRange[i][1] - prevRange[i][0]) * zoomFactor]
        const offset = ((selection[0] - (isHorizontal ? left : top)) / total) * (nextRange[1] - nextRange[0])
        scale.range(nextRange.map(value => value - offset))
        scale.brushed = true
        instance.setData(null, {[isHorizontal ? 'scaleX' : 'scaleY']: scale})
        instance.setStyle()
        instance.draw()
      })
      // create brush instance
      const [brushX1, brushX2, brushY1, brushY2] = [left, left + width, top, top + height]
      const brush = (isHorizontal ? d3.brushX() : d3.brushY())
      brush.extent([[brushX1, brushY1], [brushX2, brushY2]]).on('brush', brushed)
      // initialize brush area
      const brushDOM = this.#root.append('g').attr('class', 'wave-brush').call(brush)
      brushDOM.call(brush.move, isHorizontal ? [brushX1, brushX2] : [brushY1, brushY2])
    }
  }

  // redraw all layers
  draw(recalculate = false) {
    this.#layer.forEach(({instance}) => {
      recalculate && instance.setData()
      recalculate && instance.setStyle()
      instance.draw()
    })
  }

  // destroy all layers
  destroy() {
    this.#state = stateType.DESTROY
    while (this.#layer.length !== 0) {
      this.#layer[0].instance.destroy()
    }
  }
}

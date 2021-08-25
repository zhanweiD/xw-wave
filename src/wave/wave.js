import * as d3 from 'd3'
import chroma from 'chroma-js'
import * as PIXI from 'pixi.js'
import createUuid from '../util/uuid'
import createLog from '../util/create-log'
import catchError from '../util/catch-error'
import createEvent from '../util/create-event'
import createDefs, {makeGradientCreator} from '../util/define'
import {layerMapping} from '../layer'
import Tooltip from './tooltip'
import Layout from '../layout'

// 图表状态
const stateType = {
  INITILIZE: 'initilize', // 初始化
  DESTROY: 'destroy', // 已销毁
  READY: 'ready', // 就绪
  WARN: 'warn', // 发生错误
}

// 笔刷模式
const brushType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

// 坐标轴组合类型
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

  #svg = null

  #canvas = null

  #engine = 'svg' // canvas

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
    padding = [40, 40, 40, 40],
    adjust = true,
    define = {},
    tooltip = {},
    theme = ['white', 'black'],
    baseFontSize = 1,
    layout = Layout.standard(false),
    coordinate = coordinateType.CARTESIAN_BAND_LINEAR,
  }) {
    // 初始化状态和容器
    this.#state = stateType.INITILIZE
    this.#container = d3.select(container)

    // 确定图表宽高
    if (adjust) {
      const rect = this.#container._groups[0][0].getBoundingClientRect()
      this.containerWidth = rect.width
      this.containerHeight = rect.height
    } else {
      this.containerWidth = width
      this.containerHeight = height
    }

    // 确定主绘图区域的内边距
    if (padding.length === 1) {
      this.#padding = [padding[0], padding[0], padding[0], padding[0]]
    } else if (padding.length === 2) {
      this.#padding = [padding[0], padding[1], padding[0], padding[1]]
    } else if (padding.length === 3) {
      this.#padding = [padding[0], padding[1], padding[2], padding[1]]
    } else {
      this.#padding = padding
    }

    // 初始化 dom 结构
    this.#container.html('')
    // canvas
    const app = new PIXI.Application({
      width: this.containerWidth, 
      height: this.containerHeight,
      backgroundAlpha: 0,
      antialias: true,
    })
    app.view.style.position = 'absolute'
    container.appendChild(app.view)
    this.#canvas = app.stage
    // svg
    this.#svg = this.#container
      .append('svg')
      .attr('width', this.containerWidth)
      .attr('height', this.containerHeight)
      .style('position', 'absolute')
    this.#defs = this.#svg.append('defs')
    this.#tooltip = new Tooltip(this.#container, tooltip)

    // 初始化布局信息
    this.#layout = layout({
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      padding: this.#padding,
    })

    // 初始化其他属性
    this.theme = theme
    this.coordinate = coordinate
    this.baseFontSize = baseFontSize
    this.log = createLog('src/wave/wave')
    this.event = createEvent('src/wave/wave')
    createDefs({schema: define, container: this.#defs})
  }

  /**
   * 根据主题获取颜色
   * @param {Number} count 数量
   * @param {Array} customColors 自定义颜色覆盖主题色
   */
  getColor(count, customColors) {
    let colors = this.theme
    // 自定义渐变色
    if (Array.isArray(customColors)) {
      colors = customColors
    } else if (customColors) {
      return new Array(count).fill(customColors)
    }
    // 主题色的取色逻辑
    if (colors.length > 2 && !customColors) {
      colors.length > 2 && count <= 3 && (colors = colors.slice(2, 7))
      colors.length > 2 && count === 4 && (colors = colors.slice(2))
    }
    return chroma.scale(colors).mode('lch').colors(count)
  }

  /**
   * 创建一个图层
   * @param {String} type 图层类型
   * @param {Object} options 图层配置参数
   * @returns {LayerBase}
   */
  createLayer(type, options = {}) {
    // 暴露给图层的上下文环境
    const context = {
      svg: this.#svg,
      canvas: this.#canvas,
      tooltip: this.#tooltip,
      baseFontSize: this.baseFontSize,
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      createGradient: makeGradientCreator(this.#defs),
      getColor: this.getColor.bind(this),
      warn: this.warn.bind(this),
    }
    // 根据类型创建图层
    const layer = new layerMapping[type](options, context)
    const layerId = options.id || createUuid()
    // 新增对应的图层
    this.#state = stateType.READY
    this.#layer.push({type, id: layerId, instance: layer})
    // 对图层的生命周期进行错误捕获
    catchError(layer, error => this.warn('图层生命周期调用失败', error))
    // 注册销毁事件
    layer.event.on('destroy', () => {
      const index = this.#layer.findIndex(({id}) => id === layerId)
      this.#layer.splice(index, 1)
    })
    return layer
  }

  /**
   * 绑定坐标系，在图层数据处理之后执行
   * @param {AxisLayer} axisLayer 坐标轴图层
   * @param {LayerBase} layers 需要绑定坐标轴的图层
   */
  bindCoordinate(axisLayer, layers) {
    layers = layers.filter(layer => layer.scale)
    layers.forEach(({scale, options}) => {
      const result = {}
      const {axis} = options
      // 直角坐标系
      if (this.coordinate.search('cartesian') !== -1) {
        result.scaleX = scale.scaleX
        axis === 'main' && (result.scaleY = scale.scaleY)
        axis === 'minor' && (result.scaleYR = scale.scaleY)
      }
      // 极坐标系
      if (this.coordinate.search('polar') !== -1) {
        result.scaleAngle = scale.scaleAngle
        result.scaleRadius = scale.scaleRadius
      }
      // 地理坐标
      if (this.coordinate.search('geographic') !== -1) {
        result.scalePosition = scale.scalePosition
      }
      axisLayer.setData(null, result)
      axisLayer.setStyle()
    })
    // 将坐标轴融合处理后的比例尺传递给每个图层
    layers.forEach(layer => {
      const scales = {...layer.scale, ...axisLayer.scale}
      // projection 投影到普通的比例尺
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
   * 基于某个图层创建笔刷
   * @param {Object} options 配置描述对象
   * @returns 笔刷实例
   */
  createBrush(options = {}) {
    const {type, layout, targets} = options
    const {width, height, left, top} = layout
    const isHorizontal = type === brushType.HORIZONTAL
    const layers = this.#layer.filter(({id}) => targets.find(item => item === id))
    const prevRange = new Array(layers.length).fill(null)
    // 笔刷影响图层的比例尺
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
    // 创建笔刷实例
    const [brushX1, brushX2, brushY1, brushY2] = [left, left + width, top, top + height]
    const brush = (isHorizontal ? d3.brushX() : d3.brushY())
    brush.extent([[brushX1, brushY1], [brushX2, brushY2]]).on('brush', brushed)
    // 确定笔刷区域
    const brushDOM = this.#svg.append('g').attr('class', 'wave-brush').call(brush)
    brushDOM.call(brush.move, isHorizontal ? [brushX1, brushX2] : [brushY1, brushY2])
    return brush
  }

  /**
   * 图表报错生命周期
   * @param {String} text 报错信息
   * @param {any} data 关联数据
   */
  warn(text, data) {
    this.#state = stateType.WARN
    this.log.error(text, data)
  }

  /**
   * 重绘制所有图层
   * @param {Boolean} recalculate 是否重新计算数据
   */
  draw(recalculate = false) {
    recalculate && this.#layer.forEach(({instance}) => instance.setData())
    recalculate && this.#layer.forEach(({instance}) => instance.setStyle())
    this.#layer.forEach(layer => layer.instance.draw())
  }

  destroy() {
    this.#state = stateType.DESTROY
    while (this.#layer.length !== 0) {
      this.#layer[0].instance.destroy()
    }
  }
}

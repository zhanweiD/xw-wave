import * as d3 from 'd3'
import chroma from 'chroma-js'
import createEvent from '../util/create-event'
import createLog from '../util/create-log'
import standardLayout from '../layout/standard'
import createUuid from '../util/uuid'
import createDefs from './define'
import Tooltip from './tooltip'
import {layerMapping} from '../layer'

// 图表状态
const stateType = {
  INITILIZE: 'initilize', // 初始化
  READY: 'ready', // 就绪
  WARN: 'warn', // 发生错误
  DESTROY: 'destroy', // 已销毁
}

// 笔刷模式
const brushType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

// 坐标轴组合类型
const coordinateType = {
  CARTESIAN_BAND_LINEAR: 'cartesian-band-linear',
  CARTESIAN_BAND_LINEAR_LINEAR: 'cartesian-band-linear-linear',
  CARTESIAN_LINEAR_LINEAR: 'cartesian-linear-linear',
  POLAR_BAND_LINEAR: 'polar-band-linear',
}

// 图表类主要用于管理图层
export default class Wave {
  #state = null

  #container = null

  #containerHeight = null

  #containerWidth = null

  #padding = null

  #layout = null

  #root = null

  #defs = null

  #schedule = null

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
    layout = standardLayout,
    coordinate = coordinateType.CARTESIAN_BAND_LINEAR,
  }) {
    // 初始化状态和容器
    this.#state = stateType.INITILIZE
    this.#container = d3.select(container)

    // 确定图表宽高
    if (adjust) {
      const rect = this.#container._groups[0][0].getBoundingClientRect()
      this.#containerWidth = rect.width
      this.#containerHeight = rect.height
    } else {
      this.#containerWidth = width
      this.#containerHeight = height
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
    this.#root = this.#container
      .append('svg')
      .attr('width', this.#containerWidth)
      .attr('height', this.#containerHeight)
    this.#defs = this.#root.append('defs')
    this.#tooltip = new Tooltip(this.#container, tooltip)

    // 初始化布局信息
    this.#layout = ((typeof layout === 'function' && layout) || standardLayout)({
      containerWidth: this.#containerWidth,
      containerHeight: this.#containerHeight,
      padding: this.#padding,
    })

    // 初始化其他属性
    this.theme = theme
    this.coordinate = coordinate
    this.baseFontSize = baseFontSize
    this.event = createEvent(__filename)
    this.log = createLog(__filename)
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
   * 给图层注册生命周期函数事件
   * @param {LayerBase} layer 目标图层
   */
  registerLifeCircle(layer) {
    const lifeCircles = ['setData', 'setStyle', 'draw', 'destory']
    lifeCircles.forEach(name => {
      const fn = layer[name]
      layer[name] = (...parameter) => {
        try {
          fn.call(layer, ...parameter)
          layer.event.fire(name, {...parameter})
        } catch (error) {
          this.warn('图层生命周期调用失败', error)
        }
      }
    })
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
      root: this.#root,
      containerWidth: this.#containerWidth,
      containerHeight: this.#containerHeight,
      baseFontSize: this.baseFontSize,
      tooltip: this.#tooltip,
      defs: this.#defs,
      getColor: this.getColor.bind(this),
      warn: this.warn.bind(this),
    }
    // 根据类型创建图层
    const layer = new layerMapping[type](options, context)
    const layerId = options.id || createUuid()
    // 新增对应的图层
    this.registerLifeCircle(layer)
    this.#layer.push({type, id: layerId, instance: layer})
    this.#state = stateType.READY
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
      // 直角坐标
      if (this.coordinate.search('cartesian') !== -1) {
        result.scaleX = scale.scaleX
        if (axis === 'main') {
          result.scaleY = scale.scaleY
        } else if (axis === 'minor') {
          result.scaleYR = scale.scaleY
        }
      }
      // 极坐标
      if (this.coordinate.search('polar') !== -1) {
        result.scaleAngle = scale.scaleAngle
        result.scaleRadius = scale.scaleRadius
      }
      axisLayer.setData(null, result)
      axisLayer.setStyle()
    })
    // 比例尺传递
    layers.forEach(layer => {
      const {axis} = layer.options
      const scales = {...layer.scale, ...axisLayer.scale}
      layer.setData(null, {...scales, scaleY: axis === 'minor' ? scales.scaleYR : scales.scaleY})
      layer.setStyle()
    })
  }

  // 基于某个图层创建笔刷
  createBrush(options = {}) {
    const {type, layout, targets} = options
    const isHorizontal = type === brushType.HORIZONTAL
    const {width, height, left, top} = layout
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
    const brushDOM = this.#root.append('g').attr('class', 'wave-brush').call(brush)
    brushDOM.call(brush.move, isHorizontal ? [brushX1, brushX2] : [brushY1, brushY2])
  }

  /**
   * 图表许多函数有前后依赖的调用关系，提供一个函数方便统一管理
   * @param {String} type 函数类型
   * @param {Function} action 动作函数
   * @param {Boolean} fire 是否触发
   */
  schedule(type, action, fire = false) {
    const types = {
      sync: ['data', 'style', 'draw'],
      async: ['event', 'tooltip', 'animation', 'brush'],
    }
    // 初始化图层生命周期集合
    if (!this.#schedule) {
      this.#schedule = {}
      types.sync.forEach(name => this.#schedule[name] === [])
      types.async.forEach(name => this.#schedule[name] === [])
    }
    // 添加一个新的动作
    if (this.#schedule[type]) {
      this.#schedule[type].push(action)
    }
    // 触发注册的动作并删除
    if (fire) {
      types.sync.forEach(name => this.#schedule[name].forEach(fn => fn()))
      types.async.forEach(name => this.#schedule[name].forEach(fn => setTimeout(fn, 0)))
      this.#schedule = null
    }
  }

  // 重绘制所有图层
  draw(redraw = false) {
    redraw && this.#layer.forEach(layer => layer.instance.setData())
    redraw && this.#layer.forEach(layer => layer.instance.setStyle())
    this.#layer.forEach(layer => layer.instance.draw())
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

  // 销毁所有图层
  destroy() {
    while (this.#layer.length !== 0) this.#layer[0].instance.destroy()
    this.#state = stateType.DESTROY
  }
}

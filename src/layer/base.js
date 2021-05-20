import {isEqual, merge} from 'lodash'
import drawArc from '../basic/arc'
import drawCircle from '../basic/circle'
import drawCurve from '../basic/curve'
import drawLine from '../basic/line'
import drawPolygon from '../basic/polygon'
import drawRect from '../basic/rect'
import drawText from '../basic/text'
import drawArea from '../basic/area'
import createEvent from '../util/create-event'
import AnimationQueue from '../animation/animation'
import Tooltip, {globalTooltip} from './tooltip'
import formatText from '../util/format-text'
import getTextWidth from '../util/text-width'

// 文字基于坐标的方向
const positionType = {
  DEFAULT: 'default',
  CENTER: 'center',
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
}

// 基础元素绘制函数映射
const basicMapping = {
  arc: drawArc,
  circle: drawCircle,
  curve: drawCurve,
  line: drawLine,
  polygon: drawPolygon,
  rect: drawRect,
  text: drawText,
  area: drawArea,
}

// 基础元素支持哪些动画（某些动画并非覆盖所有元素）
const animationMapping = {
  arc: ['zoom', 'scan', 'fade'],
  circle: ['zoom', 'scan', 'fade'],
  curve: ['zoom', 'scan', 'fade'],
  line: ['zoom', 'scan', 'fade'],
  polygon: ['zoom', 'scan', 'fade'],
  rect: ['zoom', 'scan', 'fade'],
  text: ['zoom', 'scan', 'fade'],
  area: ['zoom', 'scan', 'fade'],
}

const elTypes = ['arc', 'circle', 'curve', 'line', 'polygon', 'rect', 'text', 'area']
const commonEvents = ['click', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'mousedown', 'dblclick']
const tooltipEvents = ['click', 'mouseover', 'mouseout', 'mousemove', 'blur']

// 图层 Base，目前是一个函数架子，未来会引入更多公共方法
export default class LayerBase {
  #backupData = {}

  #backupEvent = {}

  constructor(layerOptions, waveOptions) {
    this.options = {...layerOptions, ...waveOptions}
    this.animation = {}
    this.tooltip = null
    this.className = null
    this.#createEvent()
    this.warn = this.options.warn
    this.event = createEvent(__filename)
    elTypes.forEach(name => this.#backupData[name] = [])
  }

  // 数据处理
  setData() { this.warn('此图层的 setData 函数未重写') }

  // 样式处理
  setStyle() { this.warn('此图层的 setStyle 函数未重写') }

  // 返回统一处理后的样式
  createStyle(defaultStyle, currentStyle, incomingStyle) {
    const {baseFontSize} = this.options
    const layerStyle = merge({}, defaultStyle, currentStyle, incomingStyle)
    // 统一缩放字号
    Object.keys(layerStyle).forEach(key => {
      if (key.search(/text/i) !== -1 && layerStyle[key].fontSize) {
        layerStyle[key].fontSize *= baseFontSize
      }
    })
    return layerStyle
  }

  // 返回统一处理后的标签数据
  createText({x, y, value, fontSize = 12, format = null, position = positionType.DEFAULT, offset = 0}) {
    let [positionX, positionY] = [x, y]
    const formattedText = format ? formatText(value, format) : value
    const textWidth = getTextWidth(formattedText, fontSize)
    if (position === positionType.CENTER) {
      positionX -= textWidth / 2
      positionY += fontSize / 2
    } else if (position === positionType.LEFT) {
      positionX -= textWidth + offset
      positionY += fontSize / 2
    } else if (position === positionType.RIGHT) {
      positionX += offset
      positionY += fontSize / 2
    } else if (position === positionType.TOP) {
      positionX -= textWidth / 2
      positionY -= offset
    } else if (position === positionType.BOTTOM) {
      positionX -= textWidth / 2
      positionY += fontSize + offset
    }
    return {x: positionX, y: positionY, value: formattedText}
  }

  // 初始化基础事件
  #createEvent = () => {
    // tooltip 事件，必须先 show 然后 move
    this.#backupEvent = {
      common: {},
      tooltip: {
        click: (event, data) => globalTooltip
          .update(event, {data, backup: this.#backupData}).show().move(event, {enableAnimation: true}),
        blur: () => globalTooltip.hide(),
        mouseover: (event, data) => this.tooltip
          .update(event, {data, backup: this.#backupData}).show().move(event),
        mouseout: () => this.tooltip.hide(),
        mousemove: event => this.tooltip.move(event),
      },
    }
    // 基础鼠标事件
    commonEvents.forEach(eventType => {
      this.#backupEvent.common[eventType] = {}
      const events = this.#backupEvent.common[eventType]
      elTypes.forEach(elType => {
        events[elType] = (event, data) => this.event.fire(`${eventType}-${elType}`, {event, data})
      })
    })
  }

  // 配置事件，考虑到渲染延迟，推迟到下个事件循环执行
  #setEvent = elType => {
    setTimeout(() => {
      const els = this.options.root.selectAll(`.${this.className} .wave-basic-${elType}`).style('cursor', 'pointer')
      commonEvents.forEach(eventType => els.on(`${eventType}.common`, this.#backupEvent.common[eventType][elType]))
    }, 0)
  }

  // 配置 tooltip
  setTooltip(options) {
    // 初始化 tooltip 实例
    this.tooltip = this.tooltip || new Tooltip(this.options.container)
    // 绑定事件，考虑到渲染延迟，推迟到下个事件循环执行
    const {mode, targets} = options
    this.tooltip.options.mode = mode
    targets.forEach(elType => setTimeout(() => {
      const els = this.options.root.selectAll(`.${this.className} .wave-basic-${elType}`)
      tooltipEvents.forEach(eventType => els.on(`${eventType}.tooltip`, this.#backupEvent.tooltip[eventType]))
    }, 0))
  }

  // 配置动画
  setAnimation(options) {
    const container = this.options.root.selectAll(`.${this.className}`)
    // 配置动画前先销毁之前的动画，释放资源
    elTypes.forEach(name => {
      this.animation[name] && this.animation[name].destroy()
      this.animation[name] = null
    })
    // 为每种元素支持的每种动画配置
    elTypes.forEach(name => {
      // 没有数据，不需要配置动画
      if (this.#backupData[name].length === 0 || !options[name]) {
        this.animation[name] = null
        return
      }
      const animationQueue = new AnimationQueue({loop: false})
      const enterAnimationQueue = new AnimationQueue({loop: false})
      const loopAnimationQueue = new AnimationQueue({loop: true})
      const {enterAnimation, loopAnimation} = options[name]
      const supportAnimations = animationMapping[name]
      // 配置入场动画
      if (enterAnimation && supportAnimations.findIndex(key => key === enterAnimation.type) !== -1) {
        enterAnimationQueue.push(enterAnimation.type, {...enterAnimation, targets: `.wave-basic-${name}`}, container)
      }
      // 配置轮播动画
      if (loopAnimation && supportAnimations.findIndex(key => key === loopAnimation.type) !== -1) {
        loopAnimationQueue.push(loopAnimation.type, {...loopAnimation, targets: `.wave-basic-${name}`}, container)
      }
      // 连接入场动画和轮播动画
      this.animation[name] = animationQueue.push('queue', enterAnimationQueue).push('queue', loopAnimationQueue)
      // 动画事件注册
      this.animation[name].event.on('start', data => this.event.fire(`${name}-animation-start`, data))
      this.animation[name].event.on('process', data => this.event.fire(`${name}-animation-process`, data))
      this.animation[name].event.on('end', data => this.event.fire(`${name}-animation-end`, data))
    })
    return () => elTypes.forEach(type => this.animation[type] && this.animation[type].play())
  }

  // 销毁图层
  destroy() {
    // 动画资源销毁
    elTypes.forEach(name => this.animation[name]?.destroy())
    // tooltip 实例销毁
    this.tooltip && this.tooltip.destroy()
    // dom 元素销毁
    this.options.root.selectAll(`.${this.className}`).remove()
    // 通知 wave 删除这个图层实例
    this.event.fire('destroy')
  }

  // 控制整个图表的显示隐藏
  setVisible(isVisiable) {
    this.options.root.selectAll(`.${this.className}`).style('display', isVisiable ? 'block' : 'none')
  }

  /**
   * 统一的 draw 函数
   * @param {String} type 元素类型
   * @param {Array<Object>} data 图层元素数据
   */
  drawBasic(type, data) {
    // 顶层图层容器准备
    let root = this.options.root.selectAll(`.${this.className}`)
    if (root._groups[0].length === 0) {
      root = this.options.root.append('g').attr('class', this.className)
    }
    // 元素容器准备，没有则追加
    const containerClassName = `${this.className}-${type}`
    let container = root.selectAll(`.${containerClassName}`)
    if (container._groups[0].length === 0) {
      container = root.append('g').attr('class', containerClassName)
    }
    // 分组容器准备，删除上一次渲染多余的组
    for (let i = 0; i < Math.max(this.#backupData[type].length, data.length); i++) {
      const groupClassName = `${containerClassName}-${i}`
      const els = container.selectAll(`.${groupClassName}`)
      if (i < data.length && els._groups[0].length === 0) {
        container.append('g').attr('class', groupClassName)
      } else if (i >= data.length) {
        els.remove()
      }
    }
    // 根据对应列表数据绘制最终的元素
    for (let i = 0; i < data.length; i++) {
      this.#backupData[type].length = data.length
      if (!isEqual(this.#backupData[type][i], data[i])) {
        const groupClassName = `${containerClassName}-${i}`
        const elContainer = container.selectAll(`.${groupClassName}`)
        const options = {...data[i], className: `wave-basic-${type}`, container: elContainer}
        // 首次渲染不启用数据更新动画
        options.enableUpdateAnimation = this.#backupData[type][i] ? data[i].enableUpdateAnimation : false
        // 调用基础元素绘制函数进行绘制
        !options.hide && basicMapping[type](options)
        // 备份数据以便支持其他功能
        this.#backupData[type][i] = data[i]
      }
    }
    // 新的元素需要重新注册事件
    this.#setEvent(type)
  }
}

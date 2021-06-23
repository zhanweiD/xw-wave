import {isArray, isEqual, merge} from 'lodash'
import createEvent from '../util/create-event'
import AnimationQueue from '../animation/queue'
import formatText from '../util/format-text'
import getTextWidth from '../util/text-width'
import TableList from '../data/table-list'
import * as basicMapping from '../basic'
import Tooltip from './tooltip'

// 文字基于坐标的方向
export const positionType = {
  CENTER: 'center',
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
  LEFTTOP: 'left-top',
  LEFTBOTTOM: 'left-bottom',
  RIGHTTOP: 'right-top',
  RIGHTBOTTOM: 'right-bottom',
}

// 其他常量
export const elTypes = Object.keys(basicMapping)
export const scaleTypes = ['scaleX', 'scaleY', 'scaleYR', 'scaleAngle', 'scaleRadius', 'scaleColor']
export const commonEvents = ['click', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'mousedown', 'dblclick']
export const tooltipEvents = ['click', 'mouseover', 'mouseout', 'mousemove', 'blur']

// 集成图层的一些公共方法
export default class LayerBase {
  #backupData = {}

  #backupEvent = {}

  constructor(layerOptions, waveOptions) {
    this.options = merge(layerOptions, waveOptions)
    this.animation = {}
    this.root = null
    this.tooltip = null
    this.className = null
    this.mainColor = null
    this.#createEvent()
    this.warn = (text, data) => this.options.warn(text, data)
    this.event = createEvent(__filename)
    elTypes.forEach(name => this.#backupData[name] = [])
  }

  /**
   * 颜色增强函数
   * @param {Number} count 数量
   * @param {Array} customColors 自定义颜色覆盖主题色
   * @param {Boolean} isMainColor 覆盖自定义颜色的默认值
   * @returns 正确的颜色
   */
  getColor(count, customColors, isMainColor = false) {
    const data = this.data?.data
    const order = this.data?.options?.order
    const {getColor} = this.options
    // 备份图层主色
    if (customColors !== undefined && isMainColor) {
      this.mainColor = customColors
    }
    // 判断列表内有无颜色相关的属性，目前图例有用到
    if (order && this.data instanceof TableList) {
      const colorMapping = {}
      const colors = getColor(Math.max(...Object.values(order)) + 1, customColors || this.mainColor)
      Object.keys(order).forEach(key => colorMapping[key] = colors[order[key]])
      const finalColors = data.slice(1).map(({header}) => colorMapping[header])
      return data.length === 2 ? new Array(data[0].list.length).fill(finalColors) : finalColors
    }
    return this.options.getColor(count, customColors || this.mainColor)
  }

  /**
   * 返回统一处理后的比例尺
   * @param {Object} defaultScale 默认比例尺，由数据计算而来
   * @param {Object} currentScale 当前比例尺
   * @param {Object} incomingStyle 传入比例尺
   * @returns 
   */
  createScale(defaultScale, currentScale, incomingStyle) {
    const nice = merge(defaultScale?.nice, currentScale?.nice, incomingStyle?.nice)
    const scale = {nice}
    // 比例尺的命名是固定不变的
    scaleTypes.forEach(type => {
      // 由于目前的比例尺策略是由坐标轴统一控制，所以图层数据计算的比例尺优先级最低
      scale[type] = incomingStyle[type] || defaultScale[type] || currentScale[type]
      // 笔刷更改了当前比例尺的值域，这个值域需要继承
      if (currentScale[type]?.brushed) {
        scale[type].range(currentScale[type].range())
        scale[type].brushed = currentScale[type].brushed
      }
    })
    return scale
  }

  /**
   * 返回统一处理后的样式
   * @param {Object} defaultStyle 默认样式
   * @param {Object} currentStyle 当前样式
   * @param {Object} incomingStyle 传入样式
   * @returns 新的样式
   */
  createStyle(defaultStyle, currentStyle, incomingStyle) {
    const {baseFontSize} = this.options
    const style = merge({}, defaultStyle, currentStyle, incomingStyle)
    const keys = Object.keys(style)
    // 统一缩放字号
    keys.forEach(key => {
      if (key.search(/text/i) !== -1 && style[key].fontSize) {
        style[key].fontSize *= baseFontSize
      }
    })
    return style
  }

  /**
   * 返回统一处理后的标签数据
   * @param {Object} 计算文字需要的一些值
   * @returns 文字数据，包含坐标和值
   */
  createText({x, y, value, style, position = positionType.RIGHTTOP, offset = 0, textAnchor = 'start'}) {
    let [positionX, positionY] = [x, y]
    const {fontSize = 12, writingMode, format = null} = style
    const formattedText = format ? formatText(value, format) : value
    const textWidth = getTextWidth(formattedText, fontSize)
    const autoOffset = isArray(offset) ? 0 : offset
    if (position === positionType.CENTER) {
      positionX -= textWidth / 2
      positionY += fontSize / 2
    } else if (position === positionType.LEFT) {
      positionX -= textWidth + autoOffset
      positionY += fontSize / 2
    } else if (position === positionType.RIGHT) {
      positionX += autoOffset
      positionY += fontSize / 2
    } else if (position === positionType.TOP) {
      positionX -= textWidth / 2
      positionY -= autoOffset
    } else if (position === positionType.BOTTOM) {
      positionX -= textWidth / 2
      positionY += fontSize + autoOffset
    } else if (position === positionType.LEFTTOP) {
      positionX -= textWidth
    } else if (position === positionType.LEFTBOTTOM) {
      positionX -= textWidth
      positionY += fontSize
    } else if (position === positionType.RIGHTBOTTOM) {
      positionY += fontSize
    }
    // 根据文字书写方向重定向位置，仍然有字体高度问题
    if (writingMode === 'vertical') {
      positionX += textWidth / 2
      positionY += textAnchor === 'end' ? fontSize : -fontSize
    }
    // 偏移控制
    if (isArray(offset)) {
      positionX += offset[0]
      positionY += offset[1]
    }
    return {x: positionX, y: positionY, textAnchor, value: formattedText, transformOrigin: `${x} ${y}`}
  }

  // 初始化基础事件
  #createEvent = () => {
    this.#backupEvent = {
      common: {},
      tooltip: {
        // 点击组合事件
        click: (event, data) => {
          this.tooltip.update(event, {data, backup: this.#backupData})
          this.tooltip.show()
          this.tooltip.move(event, {enableAnimation: true})
        },
        blur: () => this.tooltip.hide(),
        // 悬浮组合事件
        mouseover: (event, data) => {
          this.tooltip.update(event, {data, backup: this.#backupData})
          this.tooltip.show()
          this.tooltip.move(event, {enableAnimation: false})
        },
        mousemove: event => this.tooltip.move(event),
        mouseout: () => this.tooltip.hide(),
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

  // 元素渲染后进行配置
  setEvent = elType => {
    setTimeout(() => {
      const els = this.root.selectAll(`.wave-basic-${elType}`).style('cursor', 'pointer')
      commonEvents.forEach(eventType => els.on(`${eventType}.common`, this.#backupEvent.common[eventType][elType]))
    }, 0)
  }

  // 元素渲染后进行配置
  setTooltip(options) {
    // 初始化实例对象
    if (!options.rebind && !this.tooltip) {
      this.tooltip = new Tooltip(this.options.container, options)
    }
    // 为元素绑定事件
    this.tooltip && this.tooltip.options.targets.forEach(elType => setTimeout(() => {
      const els = this.root.selectAll(`.wave-basic-${elType}`)
      tooltipEvents.forEach(eventType => els.on(`${eventType}.tooltip`, this.#backupEvent.tooltip[eventType]))
    }, 0))
  }

  // 销毁图层
  destroy() {
    // 动画资源销毁
    elTypes.forEach(name => this.animation[name]?.destroy())
    // tooltip 实例销毁
    this.tooltip && this.tooltip.destroy()
    // dom 元素销毁
    this.root.remove()
    // 通知 wave 删除这个图层实例
    this.event.fire('destroy')
  }

  /**
   * 控制整个图层的显示和隐藏
   * @param {Boolean} isVisiable 隐藏参数
   * @param {String} elType 元素类型可缺省
   */
  setVisible(isVisiable, elType) {
    const targets = elTypes.find(elType) ? this.root.selectAll(`.${this.className}-${elType}`) : this.root
    targets.style('display', isVisiable ? 'block' : 'none')
  }

  /**
   * 配置动画
   * @param {*} options 以元素类型为 key 的动画描述对象
   * @returns 启动全部动画队列的函数
   */
  setAnimation(options) {
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
      const enterQueue = new AnimationQueue({loop: false})
      const loopQueue = new AnimationQueue({loop: true})
      const {enterAnimation, loopAnimation} = options[name]
      const targets = `.wave-basic-${name}`
      // 配置入场动画和轮播动画并连接
      enterAnimation && enterQueue.push(enterAnimation.type, {...enterAnimation, targets}, this.root)
      loopAnimation && loopQueue.push(loopAnimation.type, {...loopAnimation, targets}, this.root)
      this.animation[name] = animationQueue.push('queue', enterQueue).push('queue', loopQueue)
      // 动画事件注册
      this.animation[name].event.on('start', data => this.event.fire(`${name}-animation-start`, data))
      this.animation[name].event.on('process', data => this.event.fire(`${name}-animation-process`, data))
      this.animation[name].event.on('end', data => this.event.fire(`${name}-animation-end`, data))
    })
    return () => elTypes.forEach(type => this.animation[type] && this.animation[type].play())
  }

  /**
   * 统一的 draw 函数
   * @param {String} type 元素类型
   * @param {Array<Object>} data 图层元素数据
   */
  drawBasic(type, data) {
    // 图层容器准备
    this.root = this.root || this.options.root.append('g').attr('class', this.className)
    // 元素容器准备，没有则追加
    const containerClassName = `${this.className}-${type}`
    let container = this.root.selectAll(`.${containerClassName}`)
    if (container.size() === 0) {
      container = this.root.append('g').attr('class', `${this.className}-${type}`)
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
    this.setEvent(type)
    this.setTooltip({rebind: true})
  }
}

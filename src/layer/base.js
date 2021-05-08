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

// 图层 Base，目前是一个函数架子，未来会引入更多公共方法
export default class LayerBase {
  constructor(layerOptions, waveOptions) {
    this.options = {...layerOptions, ...waveOptions}
    this.backup = {}
    this.animation = {}
    this.tooltip = null
    this.className = null
    this.event = createEvent(__filename)
    Object.keys(basicMapping).forEach(name => this.backup[name] = [])
  }

  // 数据处理
  setData() {
    console.warn('此图层的 setData 函数未重写')
  }

  // 样式处理
  setStyle() {
    console.warn('此图层的 setStyle 函数未重写')
  }

  // tooltip 展示
  setTooltip(options) {
    // 初始化 tooltip 实例
    this.tooltip = this.tooltip || new Tooltip(this.options.container)
    // 绑定事件
    Object.keys(options).forEach(elementType => {
      const els = this.options.root.selectAll(`.${this.className} ${elementType}`)
      els.on('click', (event, data) => globalTooltip.update([data]).move(event, {enableMoveAnimation: true}).show())
      els.on('blur', () => globalTooltip.hide())
      els.on('mouseover', (event, data) => this.tooltip.update([data]).move(event).show())
      els.on('mouseout', () => this.tooltip.hide())
      els.on('mousemove', event => this.tooltip.move(event))
    })
  }

  // 配置动画
  setAnimation(options) {
    const container = this.options.root.selectAll(`.${this.className}`)
    // 配置动画前先销毁之前的动画，释放资源
    Object.keys(this.animation).forEach(name => {
      this.animation[name] && this.animation[name].destroy()
      this.animation[name] = null
    })
    // 为每种元素支持的每种动画配置
    Object.keys(this.backup).forEach(name => {
      // 没有数据，不需要配置动画
      if (this.backup[name].length === 0 || !options[name]) {
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
        enterAnimationQueue.push(enterAnimation.type, {...enterAnimation, targets: name}, container)
      }
      // 配置轮播动画
      if (loopAnimation && supportAnimations.findIndex(key => key === loopAnimation.type) !== -1) {
        loopAnimationQueue.push(loopAnimation.type, {...loopAnimation, targets: name}, container)
      }
      // 连接入场动画和轮播动画
      this.animation[name] = animationQueue.push('queue', enterAnimationQueue).push('queue', loopAnimationQueue)
      // 动画事件注册
      this.animation[name].event.on('start', data => this.event.fire(`${name}-animationStart`, data))
      this.animation[name].event.on('process', data => this.event.fire(`${name}-animationProcess`, data))
      this.animation[name].event.on('end', data => this.event.fire(`${name}-animationEnd`, data))
    })
    return this.animation
  }

  // 事件配置
  #setEvent = elementType => {
    const container = this.options.root.selectAll(`.${this.className}`)
    const listener = eventType => (event, data) => this.event.fire(`${elementType}-${eventType}`, {event, data})
    // 添加监听事件
    container.selectAll(elementType)
      .style('cursor', 'pointer')
      .on('click', listener('click'))
      .on('mouseover', listener('mouseover'))
      .on('mouseout', listener('mouseout'))
      .on('mousemove', listener('mousemove'))
      .on('mousedown', listener('mousedown'))
      .on('mouseup', listener('mouseup'))
      .on('dblclick', listener('dblclick'))
  }

  // 销毁图层
  destroy() {
    // 动画资源销毁
    Object.keys(this.animation).forEach(name => this.animation[name].destroy())
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
    for (let i = 0; i < Infinity; i++) {
      const groupClassName = `${containerClassName}-${i}`
      const els = container.selectAll(`.${groupClassName}`)
      if (i < data.length && els._groups[0].length === 0) {
        container.append('g').attr('class', groupClassName)
      } else if (i >= data.length && els._groups[0].length !== 0) {
        els.remove()
      } else if (i >= data.length) break
    }
    // 根据对应二维表数据绘制最终的元素
    for (let i = 0; i < data.length; i++) {
      this.backup[type].length = data.length
      if (JSON.stringify(this.backup[type][i]) !== JSON.stringify(data[i])) {
        const groupClassName = `${containerClassName}-${i}`
        const elClassName = `${groupClassName}-el`
        const elContainer = container.selectAll(`.${groupClassName}`)
        const options = {...data[i], className: elClassName, container: elContainer}
        // 首次渲染不启用数据更新动画
        options.enableUpdateAnimation = this.backup[type][i] ? data[i].enableUpdateAnimation : false
        // 调用基础元素绘制函数进行绘制
        basicMapping[type](options)
        // 备份数据以便支持其他功能
        this.backup[type][i] = data[i]
      }
    }
    // 新的元素需要重新注册事件
    this.#setEvent(type)
  }
}

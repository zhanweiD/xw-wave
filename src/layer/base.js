import drawArc from '../basic/arc'
import drawCircle from '../basic/circle'
import drawCurve from '../basic/curve'
import drawLine from '../basic/line'
import drawPolygon from '../basic/polygon'
import drawRect from '../basic/rect'
import drawText from '../basic/text'
import drawArea from '../basic/area'

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

// 图层 Base，目前是一个函数架子，未来会引入更多公共方法
export default class LayerBase {
  constructor(layerOptions, waveOptions) {
    this.options = {...layerOptions, ...waveOptions}
    this.className = null
    this.backup = {}
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

  // 图层绘制
  draw() {
    console.warn('此图层的 draw 函数未重写')
  }

  // tooltip 展示
  tooltip() {
    console.warn('此图层的 tooltip 函数未重写')
  }

  // 配置动画
  animation() {
    console.warn('此图层的 animation 函数未重写')
  }

  // 事件配置
  event() {
    console.warn('此图层的 event 函数未重写')
  }

  // 销毁图层
  destroy() {
    this.options.root.selectAll(`.${this.className}`).remove()
    console.warn('此图层的 destroy 函数未重写')
  }

  // 控制整个图表的显示隐藏
  setVisible(isVisiable) {
    this._root.selectAll(`.${this.className}`).attr('opacity', isVisiable ? 1 : 0)
  }

  /**
   * 统一的 draw 函数
   * @param {String} type 元素类型
   * @param {Array<Object>} data 图层元素数据
   */
  drawBasic(type, data) {
    // 顶层图层容器准备
    let layerRoot = this.options.root.selectAll(`.${this.className}`)
    if (layerRoot._groups[0].length === 0) {
      layerRoot = this.options.root.append('g').attr('class', this.className)
    }
    // 元素容器准备，没有则追加
    const containerClassName = `${this.className}-${type}`
    let container = layerRoot.selectAll(`.${containerClassName}`)
    if (container._groups[0].length === 0) {
      container = layerRoot.append('g').attr('class', containerClassName)
    }
    // 分组容器准备，删除上一次渲染多余的组
    for (let i = 0; i < Infinity; i++) {
      const groupClassName = `${containerClassName}-${i}`
      const els = container.selectAll(`.${groupClassName}`)
      if (i < data.length && els._groups[0].length === 0) {
        container.append('g').attr('class', groupClassName)
      } else if (i >= data.length && els._groups[0].length !== 0) {
        els.remove()
      } else if (i >= data.length) {
        break
      }
    }
    // 根据对应二维表数据绘制最终的元素
    for (let i = 0; i < data.length; i++) {
      this.backup[type].length = data.length
      if (JSON.stringify(this.backup[type][i]) !== JSON.stringify(data[i])) {
        const groupClassName = `${containerClassName}-${i}`
        const elContainer = container.selectAll(`.${groupClassName}`)
        const elClassName = `${groupClassName}-el`
        this.backup[type][i] = data[i]
        basicMapping[type]({...data[i], className: elClassName, container: elContainer})
      }
    }
  }
}

import LayerBase from './base'
import Scale from '../data/scale'
import TableList from '../data/table-list'
import needRedraw from '../util/need-redraw'
import getTextWidth from '../util/text-wdith'
import drawText from '../basic/text'
import drawArc from '../basic/arc'

// 映射的图表类型
const waveType = {
  PIE: 'pie', // 饼图
  NIGHTINGALEROSE: 'nightingaleRose', // 夜莺玫瑰图
}

// 元素组合方式
const modeType = {
  // 不组合
  DEFAULT: 'default',
  // 组内组合
  STACK: 'stack',
}

// 标签是显示在矩形外部还是矩形内部
const labelPositionType = {
  INNER: 'inner',
  OUTER: 'outer',
}

const defaultStyle = {
  labelPosition: labelPositionType.INNER,
  arc: {},
  text: {},
}

// 圆弧图层
export default class RectLayer extends LayerBase {
  #container = null

  #layout = null

  #data = new TableList([[]])
  
  #scale = null

  #style = null

  #arcData = []

  #textData = []
  
  #backup = []

  get layout() {
    return this.#layout
  }

  get data() {
    return this.#data
  }

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  // 初始化默认值
  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    const {type = waveType.PIE, mode = modeType.GROUP} = this.options
    this.className = `wave-${mode}-${type}`
    this.#container = this.options.root.append('g').attr('class', this.className)
    this.#style = defaultStyle
  }
  
  // 显式传入布局
  setLayout(layout) {
    this.#layout = layout
  }
  
  /**
   * 传入二维表类，第一列数据要求为纬度数据列
   * @param {TableList} tableList 二维表
   */
  setData(tableList) {
    this.#data = tableList || this.#data
    const {width, height} = this.#layout
    const {mode = modeType.DEFAULT, type = waveType.PIE} = this.options
    const headers = this.#data.data.map(({header}) => header)
    const labels = this.#data.select(headers[0])
    const maxRadius = Math.min(width, height) / 2
    // 饼图的比例尺
    if (type === waveType.PIE) {
      const percentages = this.#data.select(headers[1], {mode: 'percentage', target: 'column'})
      this.#scale = {
        scaleAngle: new Scale({
          type: 'angle',
          domain: labels.concat(percentages),
          range: [0, 360],
          nice: {paddingInner: 0},
        }),
        scaleRadius: new Scale({
          type: 'quantize',
          domain: [-Infinity, Infinity],
          range: [maxRadius],
        }),
      }
    }
    // 夜莺玫瑰图的比例尺
    if (type === waveType.NIGHTINGALEROSE) {
      const percentages = this.#data.select(headers[1])
      percentages.data[0].list = percentages.data[0].list.map(() => 1 / percentages.data[0].list.length)
      this.#scale = {
        scaleAngle: new Scale({
          type: 'angle',
          domain: labels.concat(percentages),
          range: [0, 360],
          nice: {paddingInner: 0},
        }),
        scaleRadius: new Scale({
          type: 'linear',
          domain: mode === modeType.STACK
            ? [0, this.#data.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
            : [0, this.#data.select(headers.slice(1)).range()[1]],
          range: [0, maxRadius],
          nice: false,
        }),
      }
    }
  }

  // 获取标签坐标
  #getLabelData = ({value, x, y, innerRadius, outerRadius, startAngle, endAngle, fontSize}) => {
    // 计算圆弧中心点，svg 是从 90 度开始顺时针画的，需要匹配 Math 的计算逻辑
    const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, (innerRadius + outerRadius) / 2]
    const [centerX, centerY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
    // 基于中心点计算文字坐标
    const [positionX, positionY] = [centerX - getTextWidth(value, fontSize) / 2, centerY]
    return {x: positionX, y: positionY, value}
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = {...this.#style, ...style}
    const {getColor, type = waveType.PIE, mode = modeType.DEFAULT} = this.options
    const {left, top, width, height} = this.#layout
    const {scaleAngle, scaleRadius} = this.#scale
    const {innerRadius = 0, fontSize = 12, labelPosition = labelPositionType.INNER} = this.#style
    const tableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const circleCenter = {x: left + width / 2, y: top + height / 2}
    // 根据内半径重制半径比例尺值域
    if (type === waveType.NIGHTINGALEROSE) {
      scaleRadius.range([innerRadius, scaleRadius.range()[1]])
    }
    // 圆弧基础数据
    this.#arcData = tableList.map(([dimension, ...values]) => {
      return values.map(value => ({
        value,
        innerRadius,
        outerRadius: scaleRadius(value),
        ...circleCenter,
        ...scaleAngle(dimension),
      }))
    })
    // 堆叠的夜莺玫瑰图
    if (mode === modeType.STACK) {
      this.#arcData = this.#arcData.map(groupData => {
        return groupData.reduce((prev, cur, index) => {
          return [...prev, {
            ...cur, 
            innerRadius: prev[index].outerRadius,
            outerRadius: prev[index].outerRadius + cur.outerRadius - innerRadius,
          }]
        }, [{outerRadius: innerRadius}]).slice(1)
      })
    }
    // 颜色跟随主题
    if (this.#arcData[0]?.length > 1) {
      const colors = getColor(this.#arcData[0].length)
      this.#arcData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
    } else if (this.#arcData[0]?.length === 1) {
      const colors = getColor(this.#arcData.length)
      this.#arcData.forEach((groupData, i) => (groupData[0].color = colors[i]))
    }
    // 标签文字数据
    this.#textData = this.#arcData.map(groupData => {
      return groupData.map(data => ({
        ...this.#getLabelData({...data, labelPosition, fontSize}),
      }))
    })
  }

  // 绘制
  draw() {
    // 容器准备，删除上一次渲染多余的组
    ['arc', 'text'].forEach(type => {
      for (let i = 0; i < Infinity; i++) {
        const groupClassName = `${this.className}-${type}-${i}`
        const els = this.#container.selectAll(`.${groupClassName}`)
        if (i < this.#arcData.length && els._groups[0].length === 0) {
          this.#container.append('g').attr('class', groupClassName)
        } else if (i >= this.#arcData.length && els._groups[0].length !== 0) {
          els.remove()
        } else if (i >= this.#arcData.length) {
          break
        }
      }
    })
    // 圆弧
    for (let i = 0; i < this.#arcData.length; i++) {
      const arcBackup = {
        container: this.#container.selectAll(`.${this.className}-arc-${i}`),
        className: `${this.className}-arc-${i}-el`,
        data: this.#arcData[i].map(({startAngle, endAngle, innerRadius, outerRadius}) => [
          startAngle, endAngle, innerRadius, outerRadius,
        ]),
        position: this.#arcData[i].map(({x, y}) => [x, y]),
        fill: this.#arcData[i].map(({color}) => color),
        ...this.#style.arc,
      }
      // 判断是否进行重新绘制
      if (this.#backup.length <= i || needRedraw(this.#backup[i].arc, arcBackup)) {
        this.#backup[i] = {}
        this.#backup[i].arc = arcBackup
        drawArc(arcBackup)
      }
    }
    // 文本
    for (let i = 0; i < this.#textData.length; i++) {
      const textBackup = {
        container: this.#container.selectAll(`.${this.className}-text-${i}`),
        className: `${this.className}-text-${i}-el`,
        data: this.#textData[i].map(({value}) => value),
        position: this.#textData[i].map(({x, y}) => [x, y]),
        ...this.#style.text,
      }
      // 判断是否进行重新绘制
      if (this.#backup.length <= i || needRedraw(this.#backup[i].text, textBackup)) {
        this.#backup[i] = {}
        this.#backup[i].text = textBackup
        drawText(textBackup)
      }
    }
  }
}

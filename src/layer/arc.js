import LayerBase from './base'
import Scale from '../data/scale'
import TableList from '../data/table-list'
import getTextWidth from '../util/text-wdith'

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

// 默认样式
const defaultStyle = {
  labelPosition: labelPositionType.INNER,
  arc: {},
  text: {},
}

// 圆弧图层
export default class RectLayer extends LayerBase {
  #data = new TableList([[]])
  
  #scale = null

  #style = defaultStyle

  #arcData = []

  #textData = []

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
  }
  
  /**
   * 传入二维表类，第一列数据要求为纬度数据列
   * @param {TableList} tableList 二维表
   */
  setData(tableList) {
    this.#data = tableList || this.#data
    const {mode = modeType.DEFAULT, type = waveType.PIE, layout} = this.options
    const {width, height} = layout
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
    const {getColor, type = waveType.PIE, mode = modeType.DEFAULT, layout} = this.options
    const {left, top, width, height} = layout
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

  draw() {
    const arcData = this.#arcData.map(groupData => {
      const data = groupData.map(({startAngle, endAngle, innerRadius, outerRadius}) => [
        startAngle, endAngle, innerRadius, outerRadius,
      ])
      const position = groupData.map(({x, y}) => [x, y])
      const fill = groupData.map(({color}) => color)
      return {data, position, fill, ...this.#style.arc}
    })
    const textData = this.#textData.map(groupData => {
      const data = groupData.map(({value}) => value)
      const position = groupData.map(({x, y}) => [x, y])
      return {data, position, ...this.#style.text}
    })
    this.drawBasic('arc', arcData)
    this.drawBasic('text', textData)
  }
}

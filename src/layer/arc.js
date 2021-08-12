import LayerBase from './base'
import Scale from '../data/scale'

// 映射的图表类型
const waveType = {
  PIE: 'pie', // 饼
  NIGHTINGALEROSE: 'nightingaleRose', // 南丁格尔玫瑰
}

// 元素组合方式
const modeType = {
  DEFAULT: 'default', // 覆盖
  STACK: 'stack', // 堆叠
}

// 数值标签位置
const labelPositionType = {
  INNER: 'inner',
  OUTER: 'outer',
}

// 默认选项
const defaultOptions = {
  type: waveType.PIE,
  mode: modeType.DEFAULT,
}

// 默认样式
const defaultStyle = {
  innerRadius: 0,
  labelOffset: 5,
  labelPosition: labelPositionType.INNER,
  arc: {},
  text: {},
}

export default class ArcLayer extends LayerBase {
  #data = null
  
  #scale = {}

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
    super({...defaultOptions, ...layerOptions}, waveOptions, ['arc', 'text'])
    const {type, mode} = this.options
    this.className = `wave-${mode}-${type}`
    this.tooltipTargets = ['arc']
  }
  
  // 非堆叠夜莺玫瑰图固定列数为2列
  #filterData = data => {
    const {type, mode} = this.options
    if (type === waveType.PIE || mode === modeType.DEFAULT) {
      return data.select(data.data.map(({header}) => header).slice(0, 2))
    }
    return data
  }

  /**
   * 传入列表类，第一列数据要求为维度数据列
   * @param {TableList} tableList 列表
   */
  setData(tableList, scales) {
    this.#data = (tableList && this.#filterData(tableList)) || this.#data
    const {type, mode, layout} = this.options
    const {width, height} = layout
    const headers = this.#data.data.map(({header}) => header)
    const labels = this.#data.select(headers[0])
    const maxRadius = Math.min(width, height) / 2
    this.#scale.scaleAngle = null
    // 饼图的比例尺
    if (type === waveType.PIE) {
      const percentages = this.#data.select(headers[1], {mode: 'percentage', target: 'column'})
      this.#scale = this.createScale({
        scaleAngle: new Scale({
          type: 'angle',
          domain: labels.concat(percentages),
          range: [0, 360],
        }),
        scaleRadius: new Scale({
          type: 'quantize',
          domain: [-Infinity, Infinity],
          range: [maxRadius],
        }),
      }, this.#scale, scales)
    }
    // 夜莺玫瑰图的比例尺
    if (type === waveType.NIGHTINGALEROSE) {
      const percentages = this.#data.select(headers[1])
      percentages.data[0].list = percentages.data[0].list.map(() => 1 / percentages.data[0].list.length)
      this.#scale = this.createScale({
        scaleAngle: new Scale({
          type: 'angle',
          domain: labels.concat(percentages),
          range: [0, 360],
        }),
        scaleRadius: new Scale({
          type: 'linear',
          domain: mode === modeType.STACK
            ? [0, this.#data.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
            : [0, this.#data.select(headers.slice(1)).range()[1]],
          range: [0, maxRadius],
        }),
      }, this.#scale, scales)
    }
  }

  // 获取标签坐标
  #getLabelData = ({value, x, y, innerRadius, outerRadius, startAngle, endAngle}) => {
    const {text, labelPosition, labelOffset} = this.#style
    // 计算圆弧中心点，svg 是从 90 度开始顺时针画的，需要匹配 Math 的计算逻辑
    if (labelPosition === labelPositionType.INNER) {
      const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, (innerRadius + outerRadius) / 2]
      const [centerX, centerY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
      return this.createText({x: centerX, y: centerY, value, style: text, position: 'center'})
    } 
    // 计算文字相对坐标
    if (labelPosition === labelPositionType.OUTER) {
      const [angle, r] = [((startAngle + endAngle) / 360) * Math.PI, outerRadius + labelOffset]
      const [relativeX, relativeY] = [x + Math.sin(angle) * r, y - Math.cos(angle) * r]
      const position = Math.abs(angle % (2 * Math.PI)) < Math.PI ? 'right' : 'left'
      return this.createText({x: relativeX, y: relativeY, value, style: text, position})
    }
    return null
  }

  // 覆盖默认图层样式
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {type, mode, layout} = this.options
    const {left, top, width, height} = layout
    const {scaleAngle, scaleRadius} = this.#scale
    const {innerRadius, arc} = this.#style
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const arcCenter = {x: left + width / 2, y: top + height / 2}
    // 根据内半径重制半径比例尺值域
    if (type === waveType.NIGHTINGALEROSE) {
      scaleRadius.range([innerRadius, scaleRadius.range()[1]])
    }
    // 圆弧基础数据
    this.#arcData = pureTableList.map(([dimension, ...values]) => values.map((value, i) => ({
      value,
      dimension,
      category: headers[i + 1],
      innerRadius,
      outerRadius: scaleRadius(value),
      ...scaleAngle(dimension),
      ...arcCenter,
    })))
    // 堆叠的夜莺玫瑰图
    if (mode === modeType.STACK) {
      this.#arcData.forEach(groupData => groupData.forEach((item, i) => {
        if (i !== 0) {
          item.innerRadius = groupData[i - 1].outerRadius
          item.outerRadius = item.innerRadius + item.outerRadius - innerRadius
        }
      }))
    }
    // 颜色跟随主题
    if (this.#arcData[0]?.length > 1) {
      const colors = this.getColor(this.#arcData[0].length, arc.fill)
      this.#arcData.forEach(groupData => groupData.forEach((item, i) => item.color = colors[i]))
      this.#data.set('legendData', {
        list: this.#data.data.slice(1).map(({header}, i) => ({label: header, color: colors[i]})),
        filter: 'column',
        shape: 'rect',
      })
    } else if (this.#arcData[0]?.length === 1) {
      const colors = this.getColor(this.#arcData.length, arc.fill)
      this.#arcData.forEach((groupData, i) => (groupData[0].color = colors[i]))
      this.#data.set('legendData', {
        list: pureTableList.map((item, i) => ({label: item[0], color: colors[i]})),
        filter: 'row',
        shape: 'rect',
      })
    }
    // 标签文字数据
    this.#textData = this.#arcData.map(groupData => {
      return groupData.map(data => this.#getLabelData({...data}))
    })
  }

  draw() {
    const arcData = this.#arcData.map(groupData => {
      const data = groupData.map(({startAngle, endAngle, innerRadius, outerRadius}) => [
        startAngle, endAngle, innerRadius, outerRadius,
      ])
      const source = groupData.map(({dimension, category, value}) => ({dimension, category, value}))
      const position = groupData.map(({x, y}) => [x, y])
      const fill = groupData.map(({color}) => color)
      return {data, position, source, ...this.#style.arc, fill}
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

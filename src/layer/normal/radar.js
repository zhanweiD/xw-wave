import LayerBase from '../base'
import Scale from '../../data/scale'
import {MODE} from '../../utils/constants'

const defaultOptions = {
  mode: MODE.DEFAULT,
}

const defaultStyle = {
  circleSize: 6,
  circle: {},
  polygon: {
    strokeWidth: 2,
    fillOpacity: 0.4,
  },
  text: {
    hide: true,
  },
}

export default class RadarLayer extends LayerBase {
  #data = null

  #scale = {}

  #style = defaultStyle

  #polygonData = []

  #textData = []

  #circleData = []

  get data() {
    return this.#data
  }

  get scale() {
    return this.#scale
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super({...defaultOptions, ...layerOptions}, waveOptions, ['polygon', 'circle', 'text'])
    const {mode} = this.options
    this.className = `wave-${mode}-radar`
    this.tooltipTargets = ['circle']
  }

  setData(tableList, scales) {
    this.#data = this.createData('tableList', this.#data, tableList)
    const {mode, layout} = this.options
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    const headers = this.#data.data.map(({header}) => header)
    const labels = this.#data.data[0].list
    const {width, height, left, top} = layout
    const polygonCenter = {x: left + width / 2, y: top + height / 2}
    const maxRadius = Math.min(width, height) / 2
    // initialize scales
    this.#scale = this.createScale(
      {
        scaleAngle: new Scale({
          type: 'band',
          domain: labels,
          range: [0, 360],
        }),
        scaleRadius: new Scale({
          type: 'linear',
          domain:
            mode === MODE.STACK
              ? [0, this.#data.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
              : [0, this.#data.select(headers.slice(1)).range()[1]],
          range: [0, maxRadius],
        }),
      },
      this.#scale,
      scales
    )
    // calculate the points of the polygon
    const {scaleAngle, scaleRadius} = this.#scale
    this.#polygonData = pureTableList.map(([dimension, ...values]) => {
      return values.map((value, i) => {
        const [angle, r] = [(scaleAngle(dimension) / 180) * Math.PI, scaleRadius(value)]
        const [x, y] = [polygonCenter.x + Math.sin(angle) * r, polygonCenter.y - Math.cos(angle) * r]
        return {value, dimension, category: headers[i + 1], x, y, angle, r, center: polygonCenter}
      })
    })
    // stacked radar transformation
    if (mode === MODE.STACK) {
      this.#polygonData.forEach(group => {
        group.forEach((item, i) => {
          if (i !== 0) {
            item.x = group[i - 1].x + item.x - polygonCenter.x
            item.y = group[i - 1].y + item.y - polygonCenter.y
          }
        })
      })
    }
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {circleSize, polygon} = this.#style
    // get colors
    const colorMatrix = this.getColorMatrix(1, this.#polygonData[0].length, polygon.fill)
    this.#polygonData.forEach(group => {
      group.forEach((item, i) => {
        item.fill = colorMatrix.get(0, i)
        item.stroke = colorMatrix.get(0, i)
      })
    })
    // polygon point data
    this.#circleData = this.#polygonData.map(group => {
      return group.map(({x, y, ...others}) => ({
        ...others,
        r: circleSize / 2,
        cx: x,
        cy: y,
      }))
    })
    // label data
    this.#textData = this.#polygonData.map(group => {
      return group.map(({value, x, y, angle}) => {
        const isRight = Math.abs(angle % (2 * Math.PI)) < Math.PI
        return this.createText({value, x, y, style: this.#style.text, position: isRight ? 'right' : 'left'})
      })
    })
    // legend data of radar layer
    this.#data.set('legendData', {
      colorMatrix,
      filter: 'column',
      list: this.#data.data.slice(1).map(({header}, i) => ({
        label: header,
        shape: 'broken-line',
        color: colorMatrix.get(0, i),
      })),
    })
  }

  draw() {
    const polygonData = this.#polygonData[0]
      .map(({fill, stroke, center}, index) => ({
        position: [center.x, center.y],
        data: [this.#polygonData.map(item => [item[index].x, item[index].y])],
        ...this.#style.polygon,
        fill,
        stroke,
      }))
      .reverse()
    const circleData = this.#circleData.map(group => ({
      data: group.map(({r}) => [r, r]),
      position: group.map(({cx, cy}) => [cx, cy]),
      source: group.map(({dimension, category, value}) => ({dimension, category, value})),
      ...this.#style.circle,
      fill: group.map(item => item.fill),
    }))
    const textData = this.#textData.map(group => ({
      data: group.map(({value}) => value),
      position: group.map(({x, y}) => [x, y]),
      ...this.#style.text,
    }))
    this.drawBasic('polygon', polygonData)
    this.drawBasic('circle', circleData)
    this.drawBasic('text', textData)
  }
}

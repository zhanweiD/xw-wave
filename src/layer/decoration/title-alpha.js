/* eslint-disable camelcase */
import {range} from 'd3'
import chroma from 'chroma-js'
import LayerBase from '../base'

// 默认样式
const defaultStyle = {
  mainColor: 'rgb(0,119,255)',
  minorColor: 'rgb(200,200,200)',
  lineGap: 5,
  topLine: {
    strokeWidth: 2,
  },
  middleLine: {
    strokeWidth: 2,
  },
  bottomLine: {
    strokeWidth: 2,
  },
  centerArea: {},
  lightParallelogram: {},
  darkParallelograms: {},
}

export default class TitleAlpha extends LayerBase {
  #data = {
    topLines: [],
    middleLines: [],
    bottomLines: [],
    centerArea: {},
    lightParallelograms: [],
    darkParallelograms: [],
  }

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions, ['polygon', 'area', 'curve'])
    this.className = 'wave-title-alpha'
  }

  setData() {
    this.log.warn('TitleAlpha: There is no data can be set')
  }

  /**
   * symmetric mapping according to the midline
   * @param {Array<Array<Number>>} data left points
   * @returns {Array<Array<Number>>} right points
   */
  #symmetricMapping = leftPoints => {
    const {left, width} = this.options.layout
    const middleX = left + width / 2
    return leftPoints.map(([x, y]) => [x + (middleX - x) * 2, y])
  }

  /**
   * create a parallelogram with auto degree
   * the parallelogram does not exceed the area
   * @param {Number} width 
   * @param {Number} height 
   * @param {Number} angle
   * @returns {Array<Number} polygon points
   */
  #createParallelogram = (left, top, width, height, angle = 45) => [
    [left, top],
    [left + width, top],
    [left + width + Math.sin(angle) * height, top + height],
    [left + Math.sin(angle) * height, top + height],
  ]

  // override default layer style
  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, width, height} = layout
    const {lineGap, mainColor, minorColor} = this.#style
    const sqrt3 = Math.sqrt(3)
    // left area
    const [al_left, al_right, al_top, al_bottom] = [left, left + width * 0.4, top + height * 0.2, top + height * 0.8]
    const [al_width, al_height] = [al_right - al_left, al_bottom - al_top]
    // center area
    const [ac_left, ac_right, ac_top, ac_bottom] = [left + width * 0.4, left + width * 0.6, top, top + height]
    const [ac_width, ac_height] = [ac_right - ac_left, ac_bottom - ac_top]
    // left top line
    const leftTopLinePoints = [
      [al_right - lineGap, al_top + al_height / 3 - lineGap / sqrt3],
      [al_right - (al_height / 3) * 2 * sqrt3 - lineGap / sqrt3, al_bottom - lineGap],
      [al_left, al_bottom - lineGap],
    ]
    // left middle line
    const leftMiddleLinePoints = [
      [al_right - (al_height / 3) * sqrt3, al_top],
      [al_right, al_top + al_height / 3],
      [al_right - (al_height / 3) * 2 * sqrt3, al_bottom],
      [al_left, al_bottom],
    ]
    // left bottom line
    const leftBottomLinePoints = [
      [al_right + ac_width / 3, al_top + al_height / 3 + (lineGap / sqrt3) * 2],
      [al_right, al_top + al_height / 3 + (lineGap / sqrt3) * 2],
      [al_right - (al_height / 3) * 2 * sqrt3 + lineGap / sqrt3, al_bottom + lineGap],
      [al_left + al_width / 2, al_bottom + lineGap],
    ]
    // right lines
    const rightTopLinePoints = this.#symmetricMapping(leftTopLinePoints)
    const rightMiddleLinePoints = this.#symmetricMapping(leftMiddleLinePoints)
    const rightBottomLinePoints = this.#symmetricMapping(leftBottomLinePoints)
    // group lines
    this.#data.topLines = [
      {
        points: leftTopLinePoints,
        stroke: createGradient({
          type: 'linear', 
          direction: 'horizontal', 
          colors: range(0, 1 + Math.E ** -8, 0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.5 ? 0.5 : alpha)),
        }),
      }, 
      {
        points: rightTopLinePoints,
        stroke: createGradient({
          type: 'linear', 
          direction: 'horizontal', 
          colors: range(1 + Math.E ** -8, 0, -0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.5 ? 0.5 : alpha)),
        }),
      },
    ]
    this.#data.middleLines = [
      {
        points: leftMiddleLinePoints,
        stroke: createGradient({
          type: 'linear', 
          direction: 'horizontal', 
          colors: range(0, 1 + Math.E ** -8, 0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.5 ? 1 : alpha)),
        }),
      }, 
      {
        points: rightMiddleLinePoints,
        stroke: createGradient({
          type: 'linear', 
          direction: 'horizontal', 
          colors: range(1 + Math.E ** -8, 0, -0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.5 ? 1 : alpha)),
        }),
      },
    ]
    this.#data.bottomLines = [
      {
        points: leftBottomLinePoints,
        stroke: createGradient({
          type: 'linear', 
          direction: 'horizontal', 
          colors: range(0, 1 + Math.E ** -8, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
        }),
      }, 
      {
        points: rightBottomLinePoints,
        stroke: createGradient({
          type: 'linear', 
          direction: 'horizontal', 
          colors: range(0, 1 + Math.E ** -8, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
        }),
      },
    ]
    // left light parallelograms
    const leftLightParallelograms = [
      this.#createParallelogram(al_left + al_width * 0.65, al_top, al_width / 15, al_height),
      this.#createParallelogram(al_left + al_width * 0.75, al_top, al_width / 20, al_height),
    ]
    // left dark parallelograms
    const leftDarkParallelograms = [
      this.#createParallelogram(al_left + al_width * 0.2, al_top, al_width / 15, al_height),
      this.#createParallelogram(al_left + al_width * 0.2 + al_width / 16, al_top, al_width / 15, al_height),
      this.#createParallelogram(al_left + al_width * 0.6, al_top, al_width / 10, al_height),
      this.#createParallelogram(al_left + al_width * 0.6 + al_width / 11, al_top, al_width / 10, al_height),
    ]
    // right parallelograms
    const rightLightParallelograms = leftLightParallelograms.map(value => this.#symmetricMapping(value))
    const rightDarkParallelograms = leftDarkParallelograms.map(value => this.#symmetricMapping(value))
    // group parallelograms
    leftLightParallelograms.concat(rightLightParallelograms).forEach(points => {
      this.#data.lightParallelograms.push({points, fill: chroma(mainColor).alpha(0.3)})
    })
    leftDarkParallelograms.concat(rightDarkParallelograms).forEach(points => {
      this.#data.darkParallelograms.push({points, fill: chroma(mainColor).alpha(0.15)})
    })
    // middle area
    this.#data.centerArea = {
      points: [
        [ac_left + ac_width * 0, ac_top + ac_height / 2, ac_top + ac_height / 2],
        [ac_left + ac_width * 0.2, ac_top + ac_height / 2, ac_top + ac_height],
        [ac_left + ac_width * 0.8, ac_top + ac_height / 2, ac_top + ac_height],
        [ac_left + ac_width * 1, ac_top + ac_height / 2, ac_top + ac_height / 2],
      ],
      fill: createGradient({
        type: 'linear', 
        direction: 'vertical', 
        colors: ['rgba(0,0,0,0)', mainColor],
      }),
    }
  }

  draw() {
    const curveData = []
    const polygonData = []
    // centerArea
    const areaData = [{
      position: [this.#data.centerArea.points],
      fill: this.#data.centerArea.fill,
      curve: 'curveBumpX',
      ...this.#style.centerArea,
    }]
    // top lines
    curveData.push({
      position: this.#data.topLines.map(item => item.points),
      stroke: this.#data.topLines.map(item => item.stroke),
      ...this.#style.topLine,
    })
    // middle lines
    curveData.push({
      position: this.#data.middleLines.map(item => item.points),
      stroke: this.#data.middleLines.map(item => item.stroke),
      ...this.#style.topLine,
    })
    // bottomLines
    curveData.push({
      position: this.#data.bottomLines.map(item => item.points),
      stroke: this.#data.bottomLines.map(item => item.stroke),
      ...this.#style.bottomLine,
    })
    // light parallelograms
    polygonData.push({
      data: this.#data.lightParallelograms.map(item => item.points),
      fill: this.#data.lightParallelograms.map(item => item.fill),
      ...this.#style.lightParallelogram,
    })
    // dark parallelograms
    polygonData.push({
      data: this.#data.darkParallelograms.map(item => item.points),
      fill: this.#data.darkParallelograms.map(item => item.fill),
      ...this.#style.darkParallelograms,
    })
    this.drawBasic('polygon', polygonData)
    this.drawBasic('area', areaData)
    this.drawBasic('curve', curveData)
  }
}

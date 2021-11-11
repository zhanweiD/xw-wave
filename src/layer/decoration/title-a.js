import chroma from 'chroma-js'
import {fabric} from 'fabric'
import {easeQuadIn, easeQuadOut, easePolyIn} from 'd3'
import {createParallelogram} from '../../utils/shape'
import {range} from '../../utils/common'
import LayerBase from '../base'

const defaultStyle = {
  mainColor: 'rgb(0,119,255)',
  minorColor: 'rgb(200,200,200)',
  lineGap: 4,
  topLine: {
    strokeWidth: 2,
  },
  middleLine: {
    strokeWidth: 2,
  },
  bottomLine: {
    strokeWidth: 2,
  },
  centerLine: {
    strokeWidth: 2,
  },
  centerArea: {},
  lightParallelogram: {},
  darkParallelograms: {},
}

export default class TitleALayer extends LayerBase {
  #data = {
    topLines: [],
    middleLines: [],
    bottomLines: [],
    centerArea: {},
    centerLine: {},
    centerStreamer: [],
    lightParallelograms: [],
    darkParallelograms: [],
  }

  #animationTimer = {
    side: null,
    center: null,
  }

  #streamerLength = {
    side: 0,
    center: 0,
  }

  #style = defaultStyle

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions, ['polygon', 'area', 'curve', 'sideStreamer', 'centerStreamer'])
    this.className = 'chart-title-a'
    this.event.on('destroy', () => {
      clearTimeout(this.#animationTimer.side)
      clearTimeout(this.#animationTimer.center)
    })
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

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {createGradient, layout} = this.options
    const {left, top, width, height} = layout
    const {lineGap, mainColor, minorColor} = this.#style
    const sqrt3 = Math.sqrt(3)
    // left area
    const [alLeft, alRight, alTop, alBottom] = [left, left + width * 0.4, top + height * 0.2, top + height * 0.8]
    const [alWidth, alHeight] = [alRight - alLeft, alBottom - alTop]
    // center area
    const [acLeft, acRight, acTop, acBottom] = [left + width * 0.4, left + width * 0.6, top, top + height * 0.9]
    const [acWidth, acHeight] = [acRight - acLeft, acBottom - acTop]
    // left top line
    const leftTopLinePoints = [
      [alRight - lineGap, alTop + alHeight / 3 - lineGap / sqrt3],
      [alRight - (alHeight / 3) * 2 * sqrt3 - lineGap / sqrt3, alBottom - lineGap],
      [alLeft, alBottom - lineGap],
    ]
    // left middle line
    const leftMiddleLinePoints = [
      [alRight - (alHeight / 3) * sqrt3, alTop],
      [alRight, alTop + alHeight / 3],
      [alRight - (alHeight / 3) * 2 * sqrt3, alBottom],
      [alLeft, alBottom],
    ]
    // left bottom line
    const leftBottomLinePoints = [
      [alRight + acWidth / 3, alTop + alHeight / 3 + (lineGap / sqrt3) * 2],
      [alRight, alTop + alHeight / 3 + (lineGap / sqrt3) * 2],
      [alRight - (alHeight / 3) * 2 * sqrt3 + lineGap / sqrt3, alBottom + lineGap],
      [alLeft + alWidth / 2, alBottom + lineGap],
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
          colors: range(0, 1, 0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 0.5 : alpha)),
        }),
      },
      {
        points: rightTopLinePoints,
        stroke: createGradient({
          type: 'linear',
          direction: 'horizontal',
          colors: range(1, 0, -0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 0.5 : alpha)),
        }),
      },
    ]
    this.#data.middleLines = [
      {
        points: leftMiddleLinePoints,
        stroke: createGradient({
          type: 'linear',
          direction: 'horizontal',
          colors: range(0, 1, 0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 1 : alpha)),
        }),
      },
      {
        points: rightMiddleLinePoints,
        stroke: createGradient({
          type: 'linear',
          direction: 'horizontal',
          colors: range(1, 0, -0.1).map(alpha => chroma(mainColor).alpha(alpha > 0.1 ? 1 : alpha)),
        }),
      },
    ]
    this.#data.bottomLines = [
      {
        points: leftBottomLinePoints,
        stroke: createGradient({
          type: 'linear',
          direction: 'horizontal',
          colors: range(0, 1, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
        }),
      },
      {
        points: rightBottomLinePoints,
        stroke: createGradient({
          type: 'linear',
          direction: 'horizontal',
          colors: range(0, 1, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
        }),
      },
    ]
    // left light parallelograms
    const leftLightParallelograms = [
      createParallelogram(alLeft + alWidth * 0.65, alTop, alWidth / 15, alHeight),
      createParallelogram(alLeft + alWidth * 0.75, alTop, alWidth / 20, alHeight),
    ]
    // left dark parallelograms
    const leftDarkParallelograms = [
      createParallelogram(alLeft + alWidth * 0.2, alTop, alWidth / 15, alHeight),
      createParallelogram(alLeft + alWidth * 0.2 + alWidth / 16, alTop, alWidth / 15, alHeight),
      createParallelogram(alLeft + alWidth * 0.6, alTop, alWidth / 10, alHeight),
      createParallelogram(alLeft + alWidth * 0.6 + alWidth / 11, alTop, alWidth / 10, alHeight),
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
    // center area
    const coords = {x1: 0.5, x2: 0.5, y1: 1, y2: 1, r: 0, r2: 0.4}
    this.#data.centerArea = {
      points: [
        [acLeft + acWidth * 0, acTop + acHeight, acTop + acHeight],
        [acLeft + acWidth * 0.5, acTop + acHeight, acTop],
        [acLeft + acWidth * 1, acTop + acHeight, acTop + acHeight],
      ],
      fill: createGradient({
        type: 'radial',
        colors: [mainColor, chroma(mainColor).alpha(0)],
        ...coords,
      }),
    }
    // center line
    this.#data.centerLine = {
      points: [
        [acLeft, acTop + acHeight],
        [acLeft + acWidth / 2, acTop + acHeight - this.#style.centerLine.strokeWidth / 2],
        [acLeft + acWidth, acTop + acHeight],
      ],
      stroke: createGradient({
        type: 'linear',
        direction: 'horizontal',
        colors: range(0, 1, 0.1).map(alpha => chroma(minorColor).alpha((0.5 - Math.abs(alpha - 0.5)) * 2)),
      }),
    }
    // center streamer line
    this.#data.centerStreamer = [
      {
        points: [
          [acLeft + acWidth / 2, acTop + acHeight - this.#style.centerLine.strokeWidth / 2],
          [acLeft, acTop + acHeight],
        ],
      },
      {
        points: [
          [acLeft + acWidth / 2, acTop + acHeight - this.#style.centerLine.strokeWidth / 2],
          [acLeft + acWidth, acTop + acHeight],
        ],
      },
    ]
    // streamer length
    this.#streamerLength.center = acWidth / 2
    leftMiddleLinePoints.reduce((prev, cur) => {
      this.#streamerLength.side += Math.sqrt((prev[0] - cur[0]) ** 2 + (prev[1] - cur[1]) ** 2)
      return cur
    })
  }

  draw() {
    const curveData = []
    const polygonData = []
    // center area
    const areaData = {
      data: [this.#data.centerArea.points],
      fill: this.#data.centerArea.fill,
      curve: 'curveMonotoneX',
      ...this.#style.centerArea,
    }
    // center line
    curveData.push({
      data: [this.#data.centerLine.points],
      stroke: this.#data.centerLine.stroke,
      curve: 'curveMonotoneX',
      ...this.#style.centerLine,
    })
    // center streamer line
    const centerStreamerData = {
      data: this.#data.centerStreamer.map(({points}) => points),
      stroke: null,
      ...this.#style.centerLine,
    }
    // side top lines
    curveData.push({
      data: this.#data.topLines.map(item => item.points),
      stroke: this.#data.topLines.map(item => item.stroke),
      ...this.#style.topLine,
    })
    // side middle lines
    const middleLineData = {
      data: this.#data.middleLines.map(item => item.points),
      stroke: this.#data.middleLines.map(item => item.stroke),
      ...this.#style.middleLine,
    }
    curveData.push(middleLineData)
    // side bottom lines
    curveData.push({
      data: this.#data.bottomLines.map(item => item.points),
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
    this.drawBasic('area', [areaData])
    this.drawBasic('curve', curveData)
    this.drawBasic('curve', [middleLineData], 'sideStreamer')
    this.drawBasic('curve', [centerStreamerData], 'centerStreamer')
  }

  // only for canvas
  playAnimation() {
    if (this.options.engine !== 'canvas') {
      this.log.warn('TitleA: animation is only available with canvas')
      return
    }
    // clear last animation
    clearTimeout(this.#animationTimer.side)
    clearTimeout(this.#animationTimer.center)
    // start play
    const {mainColor} = this.#style
    this.#playStreamerAnimation({
      duration: 3000,
      delay: 1000,
      color: chroma(mainColor).mix('#fff').brighten(),
      targets: this.root.getObjects().filter(obj => obj.className === 'chart-basic-sideStreamer'),
      setTimer: timer => (this.#animationTimer.side = timer),
      headEase: easeQuadOut,
      tailEase: easeQuadIn,
      distance: this.#streamerLength.side,
    })
    this.#playStreamerAnimation({
      duration: 1000,
      endDelay: 3000,
      color: chroma(mainColor).mix('#fff').brighten(),
      targets: this.root.getObjects().filter(obj => obj.className === 'chart-basic-centerStreamer'),
      setTimer: timer => (this.#animationTimer.center = timer),
      headEase: easePolyIn.exponent(2),
      tailEase: easePolyIn.exponent(3.5),
      distance: this.#streamerLength.center,
    })
  }

  #playStreamerAnimation = ({
    delay = 0,
    endDelay = 0,
    duration = 1000,
    color,
    targets,
    distance,
    setTimer,
    headEase,
    tailEase,
  }) => {
    let time = 0
    const timeStep = 1000 / 30
    const {createGradient} = this.options
    // initilaize gradient
    const strokeLeft = createGradient({
      type: 'linear',
      direction: 'horizontal',
      colors: [chroma(color).alpha(1), chroma(color).alpha(0)],
    })
    const strokeRight = createGradient({
      type: 'linear',
      direction: 'horizontal',
      colors: [chroma(color).alpha(0), chroma(color).alpha(1)],
    })
    const animate = () => {
      time = (time + timeStep) % duration
      const headOffset = headEase(time / duration)
      const tailOffset = tailEase(time / duration)
      const strokeDashArray = [
        0,
        distance * tailOffset,
        distance * (headOffset - tailOffset),
        distance * (1 - headOffset),
      ]
      // change gradient
      strokeLeft.coords.x1 = 1 - headOffset
      strokeLeft.coords.x2 = 1 - tailOffset + (tailOffset < 0.2 ? 0.2 - tailOffset : 0)
      strokeRight.coords.x1 = tailOffset
      strokeRight.coords.x2 = headOffset
      // i === 0 => left, i === 1 => right
      targets.forEach((target, i) => {
        target.stroke = i === 0 ? strokeLeft : strokeRight
        target.shadow = new fabric.Shadow({color: this.#style.mainColor, blur: 5, affectStroke: 5})
        target.strokeDashArray = strokeDashArray
      })
      // render and start next loop
      this.root.renderAll()
      const isNextTimeCycle = Math.abs(time) < 10 ** -8 || Math.abs(time - duration) < 10 ** -8
      setTimer(setTimeout(animate, isNextTimeCycle ? endDelay + delay : timeStep))
    }
    setTimer(setTimeout(animate, delay))
  }
}

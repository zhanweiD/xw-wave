// 此处我要写一个样例动画
import * as d3 from 'd3'
import AnimationBase from './base'
import {createUuid} from '../../util'

export default class Track extends AnimationBase {
  // Q: 实例这个动画的时候是否马上开始执行，现有逻辑start之后开始执行
  constructor({target, style, option, root}) {
    super()
    // 每个动画拥有自己是否开启动画的状态管理字段
    this.isAnimation = false
    // 将入参作为构造参数
    this.target = target
    this.style = style || {}
    this.option = option || {}
    this.root = root
    this.uuid = `track-${createUuid()}`
  }

  // 开始动画
  play() {
    this.isAnimation = true
    if (!this.root) {
      return
    }
    // 配置项
    // styly相关
    const {
      trackColor = 'black', // 轨迹颜色
      trackWidth = 2, // 轨迹宽度
      trackLength = 100, // 轨迹长度
      trackLightColor = 'white', // 发光颜色
      trackLightWidth = 7, // 发光宽度
    } = this.style
    // option相关
    const {
      isTrackLight = false, // 是否发光
      trackLoopTime = 2000, // 一次轨迹动画持续时间
      trackloopDelay = 2000, // 单次动画延时
    } = this.option

    // 轨迹容器
    const trackBox = this.root.append('g')
    // defs 蒙层
    const defs = trackBox.append('defs')
    const {uuid} = this
    this.target.map((x, i) => {
      const mask = defs.append('mask')
        .attr('id', `mask-${uuid}${i}`)
        .selectAll('m-circle')
        .data([1])
        .enter()
        .append('circle')
        .attr('class', 'm-circle')
        .attr('id', (d, ii) => `m-circle${i}`)
        .attr('r', trackLength)
        .attr('fill', 'url(#grad)')
    })

    const radialGradient = defs.append('radialGradient')
      .attr('id', 'grad')
      .attr('cx', 0.5)
      .attr('cy', 0.5)
      .attr('r', 0.5)
    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fff').attr('stop-opacity', 0)
    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#fff').attr('stop-opacity', 1)

    // 外发光阴影
    const filterBox = trackBox.selectAll('.filter')
      .data([1])
      .enter()
      .append('filter')
      .attr('id', 'blurMe')
      .attr('width', '1200%')
      .attr('height', '1400%')
      .attr('x', -2)
      .attr('y', -5)

    filterBox.append('feGaussianBlur')
      .attr('in', 'offOut')
      .attr('stdDeviation', 4)
      .attr('result', 'blurOut')

    const trackData = this.target.map(d => {
      const lastIndex = d.search(/[lhvcsqta]/i)
      const startPoint = d.slice(1, lastIndex).split(',')
      startPoint[0] = `M${d.split(',')[0].split('M')[1] - trackLength}`
      return startPoint.toString() + d.replace('M', 'L')
    })
    // 轮播动画
    const loop1 = () => {
      if (!this.isAnimation) {
        return
      }
      let startTime
      // console.log('正在轮播没被清除', this.isAnimation, uuid)
      trackBox.selectAll('.path').remove()
      trackBox.selectAll('.path')
        .data(trackData)
        .enter()
        .append('path')
        .attr('d', d => d)
        .attr('stroke', trackColor)
        .attr('fill', 'none')
        .attr('stroke-width', trackWidth)
        .attr('stroke-dasharray', '0% 100%')
        .attr('class', 'path')
        .attr('id', (d, i) => `path${i}`)
        .attr('mask', (d, i) => `url(#mask-${uuid}${i})`)
        .transition()
        .duration(trackLoopTime)
        .delay(trackloopDelay)
        .ease(d3.easeLinear)
        .attrTween('stroke-dasharray', (d, ii, elm) => {
          // 此处计算逻辑应该分离，后面优化
          const length = elm[ii].getTotalLength()
          const trackScale = d3.interpolateString(`0, ${length}`, `${length}, ${length}`)
          // 计算track出现的时间
          startTime = trackLength / length
          // console.log(d, ii)
          return t => {
            // console.log(t)
            const p = elm[ii].getPointAtLength(t * length)
            trackBox.select(`#m-circle${ii}`).attr('cx', p.x).attr('cy', p.y)
            if (t < startTime) {
              return `0, ${trackLength}, ${trackScale(t).split(',')[0]}, ${length}`
            }
            return `0, ${trackScale(t).split(',')[0]}, ${trackLength}, ${trackScale(t).split(',')[1]}`
          }
        })
        .on('end', (d, i, elm) => {
          if (i === elm.length - 1) {
            // trackBox.selectAll('.path').remove()
            loop1()
          }
        })
      if (isTrackLight) {
        trackBox.selectAll('#myPx').remove()
        trackBox.selectAll('#myPx')
          .data(trackData)
          .enter()
          .append('path')
          .attr('id', 'myPx')
          .attr('stroke', trackLightColor)
          .attr('stroke-width', trackLightWidth)
          .attr('stroke-dasharray', '0% 100%')
          .style('opacity', 1)
          .attr('fill', '#55fdfe00')
          .attr('mask', (d, i) => `url(#mask-${uuid}${i})`)
          .attr('d', d => d)
          .attr('filter', 'url(#blurMe)')
          .transition()
          .duration(trackLoopTime)
          .delay(trackloopDelay)
          .ease(d3.easeLinear)
          .attrTween('stroke-dasharray', (d, ii, elm) => {
            const length = elm[ii].getTotalLength()
            const trackScale = d3.interpolateString(`0, ${length}`, `${length}, ${length}`)
            return t => {
              if (t < startTime) {
                return `0, ${trackLength}, ${trackScale(t).split(',')[0]}, ${length}`
              }
              return `0, ${trackScale(t).split(',')[0]}, ${trackLength}, ${trackScale(t).split(',')[1]}`
            }
          })
      }
    }
    loop1()
  }

  // 动画删除的时候
  destory() {
    // console.log('执行清除', this.isAnimation, this.uuid)
    this.isAnimation = false
  }
}

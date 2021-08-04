import {isNumber} from 'lodash'
import * as d3 from 'd3'

const defaultNice = {
  count: 0, // 优化的刻度数量
  zero: false, // 定义域是否包含 0
  paddingInner: 0, // band 比例尺间距占比
  fixedPaddingInner: null, // band 比例尺固定间距
  fixedBandWidth: null, // band 比例尺固定带宽
  fixedBoundary: 'start', // band 比例尺吸附边界
}

// 基于 d3 做一些比例尺的定制，方便图表操作
export default function Scale({type, domain, range, nice = defaultNice}) {
  let scale
  // 离散到连续
  if (type === 'band') {
    scale = d3.scaleBand().domain(domain).range(range)
    // band 比例尺支持调整比例和固定值
    if (isNumber(nice.fixedBandWidth) && isNumber(nice.fixedPaddingInner)) {
      const {fixedBandWidth, fixedPaddingInner, fixedBoundary} = nice
      const totalRange = fixedBandWidth * domain.length + fixedPaddingInner * (domain.length - 1)
      const offset = (totalRange - Math.abs(range[1] - range[0])) * (range[1] > range[0] ? 1 : -1)
      const [fixedStart, fixedEnd] = [fixedBoundary === 'start', fixedBoundary === 'end']
      // 无自适应，调整修改值域
      scale.range([fixedEnd ? range[0] - offset : range[0], fixedStart ? range[1] + offset : range[1]])
      scale.paddingInner(fixedPaddingInner / (fixedPaddingInner + fixedBandWidth))
    } else if (isNumber(nice.fixedBandWidth)) {
      // 只固定带宽，间距自适应
      scale.paddingInner(1 - (nice.fixedBandWidth * domain.length) / Math.abs(range[1] - range[0]))
    } else if (isNumber(nice.fixedPaddingInner)) {
      // 只固定间距，带宽自适应
      scale.paddingInner((nice.fixedPaddingInner * (domain.length - 1)) / Math.abs(range[1] - range[0]))
    } else if (nice) {
      // 间距和带宽都根据比例自适应
      scale.paddingInner(isNumber(nice.paddingInner) ? nice.paddingInner : defaultNice.paddingInner)
    }
  }
  // 离散到连续，bind 的变体，bandwidth 为 0
  if (type === 'point') {
    scale = d3.scalePoint().domain(domain).range(range)
  }
  // 离散到离散
  if (type === 'ordinal') {
    scale = d3.scaleOrdinal().domain(domain).range(range)
  }
  // 连续到离散
  if (type === 'quantize') {
    scale = d3.scaleQuantize().domain(domain).range(range)
    nice.zero && extendZero(scale)
    nice.count && niceScale(scale, nice.count)
  }
  // 连续到连续
  if (type === 'linear') {
    scale = d3.scaleLinear().domain(domain).range(range)
    nice.zero && extendZero(scale)
    nice.count && niceScale(scale, nice.count)
  }
  // 为圆弧定制的比例尺，domain 是一个列表（第一列纬度第二列百分比数值），range 是连续区间（0-360）
  if (type === 'angle') {
    const totalLength = range[1] - range[0]
    const padding = (totalLength * nice.paddingInner) / domain.data[0].list.length
    const availableLength = totalLength * (1 - nice.paddingInner)
    const mappingArray = domain.data[1].list.reduce((prev, cur, index) => {
      const startAngle = prev[index].endAngle + padding
      const endAngle = startAngle + availableLength * cur
      return [...prev, {startAngle, endAngle}]
    }, [{endAngle: -padding}]).slice(1)
    scale = d3.scaleOrdinal().domain(domain.data[0].list).range(mappingArray)
  }
  scale.type = type
  scale.nice = nice && {...defaultNice, ...nice}
  return scale
}

/**
 * 拓展比例尺以包括零边界
 * @param {Scale} scale
 * @returns 包含 0 的比例尺
 */
export const extendZero = scale => {
  let [start, end] = scale.domain()
  if (start < end) {
    if (start > 0) {
      start = 0
    } else if (end < 0) {
      end = 0
    }
  } else {
    if (start < 0) {
      start = 0
    } else if (end > 0) {
      end = 0
    }
  }
  scale.domain([start, end])
}

/**
 * d3 的 nice 通常不是图表想要的，自定义 nice 函数
 * @param {Scale} scale 比例尺
 * @param {Number} tickCount 刻度线数量
 */
export const niceScale = (scale, tickCount) => {
  // 数据同质判断
  let [start, end] = scale.domain()
  if (start === end) {
    if (start === 0) {
      end += tickCount
    } else {
      start -= tickCount
      end += tickCount  
    }
  }
  // 数据大小判断
  let reverse = false
  if (start >= end) {
    [start, end] = [end, start]
    reverse = true
  }
  // 生成合适的刻度范围
  if (tickCount > 0) {
    const distance = end - start
    const level = 10 ** Math.floor(Math.log10(Math.abs(distance / tickCount)))
    // 图表上方留白约束比例，当空白过多时考虑增加减小步长拉伸图表
    const spaceThreshold = 0
    // 保证图表不会溢出的 step，但有时候空白空间过大
    let step = Math.ceil(distance / (tickCount) / level) * level
    const newStart = Math.floor(start / step) * step
    let newEnd = newStart + tickCount * step
    // 溢出或者冗余时对 step 进行修正
    if (newEnd > end) {
      const isOverflow = () => end + (level / 2) * tickCount >= newEnd
      const isExceedThreshold = () => (newEnd - end) / (newEnd - newStart) > spaceThreshold
      while (!isOverflow() && isExceedThreshold()) {
        step -= level / 2
        newEnd = newStart + tickCount * step
      }
    } else {
      while (newEnd < end) {
        step += level / 2
        newEnd = newStart + tickCount * step
      }
    }
    // 优化定义域
    scale.domain(reverse ? [newEnd, newStart] : [newStart, newEnd])
  }
}

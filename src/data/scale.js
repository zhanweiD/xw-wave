import * as d3 from 'd3'

// 基于 d3 做一些比例尺的定制，方便图表操作
export default function Scale({type, domain, range, nice = {count: 5, zero: false}}) {
  let scale = {}
  // 离散到离散
  if (type === 'ordinal') {
    scale = d3.scaleOrdinal().domain(domain).range(range)
  }
  // 离散到连续
  if (type === 'bind') {
    scale = d3.scaleBand().domain(domain).range(range).paddingInner(1 - 0.618)
  }
  // 连续到离散
  if (type === 'quantize') {
    scale = d3.scaleQuantize().domain(domain).range(range)
    nice.zero && extendZero(scale)
    niceScale(scale, nice.count)
  }
  // 连续到连续
  if (type === 'linear') {
    scale = d3.scaleLinear().domain(domain).range(range)
    nice.zero && extendZero(scale)
    niceScale(scale, nice.count)
  }
  scale.type = type
  scale.nice = nice
  return scale
}

/**
 * 拓展比例尺以包括零边界
 * @param {Scale} scale
 * @returns 包含 0 的比例尺
 */
const extendZero = scale => {
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
  return scale
}

/**
 * d3 的 nice 通常不是图表想要的，自定义 nice 函数
 * @param {Scale} scale 比例尺
 * @param {Number} tickCount 刻度线数量
 * @returns 优化后的比例尺
 */
const niceScale = (scale, tickCount) => {
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
    const level = judgeLevel(distance / tickCount)
    // 图表上方留白约束比例，当空白过多时考虑增加减小步长拉伸图表
    const spaceThreshold = 0.3
    // 保证图表不会溢出的 step，但有时候空白空间过大
    let step = Math.ceil(distance / (tickCount) / level) * level
    const newStart = Math.floor(start / step) * step
    let newEnd = newStart + tickCount * step
    // 对 step 进行修正
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
    scale.domain(reverse ? [newEnd, newStart] : [newStart, newEnd])
  }
  return scale
}

/**
 * 判断一个实数的数量级基数
 * @param {Number} number 
 * @returns 数量级基数，如 456 的数量级基数为 100
 */
const judgeLevel = number => {
  const absoluteLevel = 10 ** Math.round(Math.log10(Math.abs(number)))
  return number > 0 ? absoluteLevel : -absoluteLevel
}

import * as d3 from 'd3'

// 绘制一组丝带边
export default function drawRibbon({
  type = 'chord',
  fill = 'rgba(255,255,255,1)',
  stroke = 'rgba(255,255,255,0)',
  strokeWidth = 1,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  enableUpdateAnimation = true,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  data = [], // 边出入角和内外半径数据
  position = [], // 圆心位置
  source = [], // 原始数据
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((item, i) => ({
    className,
    opacity,
    fillOpacity,
    strokeOpacity,
    fill: Array.isArray(fill) ? fill[i] : fill,
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    strokeWidth,
    d: getPath(type, item),
    transform: type === 'chord' ? `translate(${position[i][0]}px, ${position[i][1]}px)` : null,
    source: source.length > i ? source[i] : null,
  }))

  return container.selectAll(`.${className}`)
    .data(configuredData.map(item => mapping(item)))
    .join('path')
    .attr('class', d => d.className)
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('d', d => d.d)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
    .attr('fill-opacity', d => d.fillOpacity)
    .attr('stroke-opacity', d => d.strokeOpacity)
    .style('transform', d => d.transform)
    .style('outline', 'none')
}

const getPath = (type, data) => {
  if (type === 'chord') {
    const [sourceStartAngle, sourceEndAngle, sourceRadius, targetStartAngle, targetEndAngle, targetRadius] = data
    const sourceRibbon = {startAngle: sourceStartAngle, endAngle: sourceEndAngle, radius: sourceRadius}
    const targetRibbon = {startAngle: targetStartAngle, endAngle: targetEndAngle, radius: targetRadius}
    return d3.ribbon()({source: sourceRibbon, target: targetRibbon})
  } 
  if (type === 'sankey-horizontal') {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = data
    return [
      `M ${x1},${y1}`,
      `C ${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`,
      `L ${x3},${y3}`,
      `C ${(x3 + x4) / 2},${y3} ${(x3 + x4) / 2},${y4} ${x4},${y4} Z`,
    ].join(' ')
  }
  if (type === 'sankey-vertical') {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = data
    return [
      `M ${x1},${y1}`,
      `C ${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`,
      `L ${x3},${y3}`,
      `C ${x3},${(y3 + y4) / 2} ${x4},${(y3 + y4) / 2} ${x4},${y4} Z`,
    ].join(' ')
  }
  return null
}

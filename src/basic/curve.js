import * as d3 from 'd3'

// v4基础函数——画path
export default function drawCurve({
  stroke = 'rgba(255,255,255,0)',
  strokeWidth = 1,
  opacity = 1,
  enableUpdateAnimation = true,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  position = [], // 位置 [[[x,y], ...], ...]
  container,
  className,
}) {
  // 曲线工厂
  const lineGenerator = d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveMonotoneX)
  const configuredData = position.map((data, i) => ({
    fill: 'none',
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    strokeWidth,
    class: className,
    opacity,
    d: lineGenerator(data),
    source: source.length > i ? source[i] : null,
  }))

  container.selectAll(`.${className}`)
    .data(configuredData)
    .join('path')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('class', d => d.class)
    .attr('d', d => d.d)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
}

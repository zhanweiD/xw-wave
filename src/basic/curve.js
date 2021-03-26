import * as d3 from 'd3'

// v4基础函数——画path
// 此文件可以完全取代path
export default function drawCurve({
  color = 'rgba(255,255,255,1)',
  width = 5,
  opacity = 1,
  enableUpdateAnimation = true,
  updateAnimationDuration = 10000,
  updateAnimationDelay = 0,
  position = [], // 位置 [[[x,y], ...], ...]
  container,
  className,
}) {
  // 曲线工厂
  const lineGenerator = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis)

  const configuredData = position.map(data => ({
    stroke: color,
    strokeWidth: width,
    class: className,
    d: lineGenerator(data),
    fill: 'none',
    opacity,
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

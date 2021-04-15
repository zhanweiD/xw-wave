import * as d3 from 'd3'

export default function drawArea({
  stroke = [],
  fill = [],
  strokeWidth = 1,
  opacity = 1,
  enableUpdateAnimation = true,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  position = [], // 位置 [[[x,y0,y1], ...], ...]
  container,
  className,
  curve = false,
}) {
  // 面积生成器
  const areaGenerator = d3.area()
    .x(d => d[0])
    .y0(d => d[1])
    .y1(d => d[2])
  if (curve) {
    areaGenerator.curve(d3.curveMonotoneX)
  }

  const configuredData = position.map((data, i) => ({
    stroke: stroke[i],
    strokeWidth,
    class: className,
    d: areaGenerator(data),
    fill: fill[i],
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

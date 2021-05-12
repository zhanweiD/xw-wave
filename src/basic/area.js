import * as d3 from 'd3'

export default function drawArea({
  fill = 'rgba(255,255,255,1)',
  stroke = 'rgba(255,255,255,0)',
  strokeWidth = 1,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  enableUpdateAnimation = true,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  position = [], // 位置 [[[x,y0,y1], ...], ...]
  container,
  className,
  curve = false,
}) {
  // 面积生成器
  const areaGenerator = d3.area().x(d => d[0]).y0(d => d[1]).y1(d => d[2])
  curve && areaGenerator.curve(d3.curveMonotoneX)
  
  const configuredData = position.map((data, i) => ({
    className,
    opacity,
    fillOpacity,
    strokeOpacity,
    fill: Array.isArray(fill) ? fill[i] : fill,
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    strokeWidth,
    d: areaGenerator(data),
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
    .attr('class', d => d.className)
    .attr('d', d => d.d)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
    .attr('fill-opacity', d => d.fillOpacity)
    .attr('stroke-opacity', d => d.strokeOpacity)
}

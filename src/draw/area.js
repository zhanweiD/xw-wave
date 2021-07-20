import * as d3 from 'd3'

// 绘制一组面积
export default function drawArea({
  fill = 'rgba(255,255,255,1)',
  stroke = 'rgba(255,255,255,0)',
  strokeWidth = 1,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  curve = false,
  enableUpdateAnimation = true,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  position = [], // 位置 [[[x,y0,y1], ...], ...]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const areaGenerator = d3.area().x(d => d[0]).y0(d => d[1]).y1(d => d[2])
  curve && areaGenerator.curve(d3[curve])
  const configuredData = position.map((data, i) => ({
    className,
    opacity,
    fillOpacity,
    strokeOpacity,
    strokeWidth,
    fill: Array.isArray(fill) ? fill[i] : fill,
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    mask: Array.isArray(mask) ? mask[i] : mask,
    filter: Array.isArray(filter) ? filter[i] : filter,
    d: areaGenerator(data),
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
    .attr('mask', d => d.mask)
    .attr('filter', d => d.filter)
    .style('pointer-events', 'none')
}

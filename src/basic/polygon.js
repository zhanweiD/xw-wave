// 绘制一组多边形
export default function drawPolygon({
  fill = 'rgba(255,255,255,1)', // 颜色
  stroke = 'rgba(255,255,255,0)', // 描边
  strokeWidth = 0, // 描边粗细
  opacity = 1, // 不透明度
  fillOpacity = 0,
  strokeOpacity = 1,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  data = [], // 多边形二维坐标点
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((points, i) => {
    return {
      className,
      points: points.reduce((prev, cur) => `${prev} ${cur[0]},${cur[1]}`, ''),
      fill: Array.isArray(fill) ? fill[i] : fill,
      stroke: Array.isArray(stroke) ? stroke[i] : stroke,
      strokeWidth,
      opacity,
      fillOpacity,
      strokeOpacity,
      source: source.length > i ? source[i] : null,
    }
  })

  const polygons = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('polygon')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('class', d => d.className)
    .attr('points', d => d.points)
    .attr('fill', d => d.fill)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('opacity', d => d.opacity)
    .attr('fill-opacity', d => d.fillOpacity)
    .attr('stroke-opacity', d => d.strokeOpacity)
    
  return polygons
}

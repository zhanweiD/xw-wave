// 绘制一组圆形（含椭圆）
export default function drawCircle({
  fill = 'rgba(255,255,255,1)', // 颜色
  stroke = 'rgba(255,255,255,0)', // 描边
  strokeWidth = 0, // 描边粗细
  opacity = 1, // 不透明度
  fillOpacity = 1,
  strokeOpacity = 1,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  data = [], // 半径数据，[[rx, ry], ...]
  position = [], // 直角坐标系坐标数据
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((size, i) => ({
    className,
    cx: position[i][0],
    cy: position[i][1],
    rx: size[0],
    ry: size[1],
    fill: Array.isArray(fill) ? fill[i] : fill,
    stroke: Array.isArray(stroke) ? stroke[i] : stroke,
    mask: Array.isArray(mask) ? mask[i] : mask,
    filter: Array.isArray(filter) ? filter[i] : filter,
    opacity,
    fillOpacity,
    strokeOpacity,
    strokeWidth,
    source: source.length > i ? source[i] : null,
    transformOrigin: `${position[i][0]} ${position[i][1]}`,
  }))

  return container.selectAll(`.${className}`)
    .data(configuredData.map(item => mapping(item)))
    .join('ellipse')
    .attr('class', d => d.className)
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('cx', d => d.cx)
    .attr('cy', d => d.cy)
    .attr('rx', d => d.rx)
    .attr('ry', d => d.ry)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
    .attr('fill-opacity', d => d.fillOpacity)
    .attr('stroke-opacity', d => d.strokeOpacity)
    .attr('transform-origin', d => d.transformOrigin)
    .attr('mask', d => d.mask)
    .attr('filter', d => d.filter)
}

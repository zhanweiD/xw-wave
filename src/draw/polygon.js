import {isArray} from 'lodash'
import {fabric} from 'fabric'
import chroma from 'chroma-js'

// 绘制一组多边形
export default function drawPolygon({
  engine = 'svg',
  fill = '#fff', // 颜色
  stroke = '#fff', // 描边
  strokeWidth = 0, // 描边粗细
  opacity = 1, // 不透明度
  fillOpacity = 0,
  strokeOpacity = 1,
  transformOrigin = null, // 影响动画和旋转
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  data = [], // 多边形二维坐标点
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((points, i) => ({
    className,
    pointArray: points.map(([x, y]) => ({x, y})),
    pointString: points.reduce((prev, cur) => `${prev} ${cur[0]},${cur[1]}`, ''),
    fill: isArray(fill) ? fill[i] : fill,
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    source: source.length > i ? source[i] : null,
    transformOrigin: transformOrigin && `${transformOrigin[0]}px ${transformOrigin[1]}px`,
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('polygon')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('points', d => d.pointString)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => d.transformOrigin)
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const rect = new fabric.Polygon(config.pointArray, {
        className: config.className,
        fill: chroma(config.fill || '#000').alpha(config.fillOpacity),
        stroke: chroma(config.stroke || '#000').alpha(config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
      })
      // 覆盖或追加
      if (container.getObjects().length <= i) {
        container.addWithUpdate(rect)
      } else {
        container.item(i).set(rect)
      }
    })
  }
}

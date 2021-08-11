import * as d3 from 'd3'
import uuid from './uuid'

// 定义线性渐变
const createLinearGradients = ({container, schema}) => {
  schema && schema.forEach(({id, x1, x2, y1, y2, stops}) => {
    const linearGradient = container.append('linearGradient')
      .attr('id', id)
      .attr('x1', x1 || '0%')
      .attr('y1', y1 || '0%')
      .attr('x2', x2 || '0%')
      .attr('y2', y2 || '0%')
    stops.forEach(({offset, opacity, color}) => {
      linearGradient.append('stop')
        .attr('offset', offset || '100%')
        .style('stop-color', color || 'rgb(128,128,128)')
        .style('stop-opacity', opacity || 1)
    })
  })
}

// 定义放射性渐变
const createRadialGradients = ({container, schema}) => {
  schema && schema.forEach(({id, r, cx, cy, fx, fy, stops}) => {
    const radialGradient = container.append('radialGradient')
      .attr('id', id)
      .attr('r', r)
      .attr('fx', fx || '0%')
      .attr('fy', fy || '0%')
      .attr('cx', cx || '100%')
      .attr('cy', cy || '100%')
    stops.forEach(({offset, opacity, color}) => {
      radialGradient.append('stop')
        .attr('offset', offset || '100%')
        .style('stop-color', color || 'rgb(128,128,128)')
        .style('stop-opacity', opacity || 1)
    })
  })
}

// 定义渐变遮罩
const createMasks = ({container, schema}) => {
  schema && schema.forEach(item => {
    const {id, type, fill} = item
    const mask = container.append('mask').attr('id', id)
    if (type === 'rect') {
      const {x, y, width, height} = item
      mask.append('rect')
        .attr('x', x || '0%')
        .attr('y', y || '0%')
        .attr('width', width || '100%')
        .attr('height', height || '100%')
        .attr('fill', fill)
    } else if (type === 'circle') {
      const {cx, cy, rx, ry} = item
      mask.append('ellipse')
        .attr('cx', cx || '50%')
        .attr('cy', cy || '50%')
        .attr('rx', rx || '50%')
        .attr('ry', ry || '50%')
        .attr('fill', fill)
    } else if (type === 'arc') {
      const {innerRadius, outerRadius, startAngle, endAngle} = item
      const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
      // 可见区域
      mask.append('path')
        .attr('fill', 'rgb(255,255,255)')
        .attr('d', arc({startAngle: 0, endAngle: Math.PI * 2}))
      // 遮挡区域
      mask.append('path')
        .attr('fill', 'rgb(0,0,0)')
        .attr('d', arc({startAngle, endAngle}))
    }
  })
}

// 预定义函数
const createDefs = ({container, schema}) => {
  createLinearGradients({container, schema: schema?.linearGradient})
  createRadialGradients({container, schema: schema?.radialGradient})
  createMasks({container, schema: schema?.mask})
}

/**
 * 定义渐变色的快捷方式
 * @param {Object} options 描述对象
 * @returns {String} 渐变色引用地址
 */
const makeGradientCreator = container => ({type, direction, colors}) => {
  const id = uuid()
  createDefs({
    container,
    schema: {
      linearGradient: type === 'linear' && [{
        id,
        x2: direction === 'horizontal' ? '100%' : '0%',
        y2: direction === 'vertical' ? '100%' : '0%',
        stops: colors.map((color, i) => ({
          offset: `${(i * 100) / (colors.length - 1)}%`,
          color,
        })),
      }],
      radialGradient: type === 'radial' && [{
        id,
        stops: colors.map((color, i) => ({
          offset: `${(i * 100) / (color.length - 1)}%`,
          color,
        })),
      }],
    },
  })
  return `url(#${id})`
}

export default createDefs
export {makeGradientCreator}

import * as d3 from 'd3'

// 定义线性渐变
const createLinearGradients = ({schema, container}) => {
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
const createRadialGradients = ({schema, container}) => {
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
const createRectMasks = ({schema, container}) => {
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
const createDefs = ({schema, container}) => {
  createLinearGradients({schema: schema?.linearGradient, container})
  createRadialGradients({schema: schema?.radialGradient, container})
  createRectMasks({schema: schema?.mask, container})
}

export default createDefs

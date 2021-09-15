import * as d3 from 'd3'
import {fabric} from 'fabric'
import {mergeAlpha} from './common'
import uuid from './uuid'

/**
 * create linear gradients
 * @param {Object} options
 */
const createLinearGradients = ({container, schema, engine}) => {
  schema.forEach(({id, x1 = 0, x2 = 0, y1 = 0, y2 = 0, stops}) => {
    if (engine === 'svg') {
      const linearGradient = container.append('linearGradient')
        .attr('id', id)
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
      stops.forEach(({offset = 1, opacity = 1, color = '#fff'}) => {
        linearGradient.append('stop')
          .attr('offset', offset)
          .style('stop-color', color)
          .style('stop-opacity', opacity)
      })
    } else if (engine === 'canvas') {
      container.push(new fabric.Gradient({
        gradientId: id,
        type: 'linear',
        gradientUnits: 'percentage', // or 'pixels'
        coords: {x1, y1, x2, y2},
        colorStops: stops.map(({offset = 1, opacity = 1, color = '#fff'}) => ({
          offset,
          color: mergeAlpha(color, opacity),
        })),
      }))
    }
  })
}

/**
 * create radial gradients
 * @param {Object} options
 */
const createRadialGradients = ({container, schema, engine}) => {
  schema.forEach(({id, r = 0, r2 = 0, x1 = 1, x2 = 1, y1 = 0, y2 = 0, stops}) => {
    if (engine === 'svg') {
      const radialGradient = container.append('radialGradient')
        .attr('id', id)
        .attr('r', Math.max(r, r2))
        .attr('cx', x1)
        .attr('cy', y1)
        .attr('fx', x2)
        .attr('fy', y2)
      stops.forEach(({offset = 1, opacity = 1, color = '#fff'}) => {
        radialGradient.append('stop')
          .attr('offset', offset)
          .style('stop-color', color)
          .style('stop-opacity', opacity)
      })
    } else if (engine === 'canvas') {
      container.push(new fabric.Gradient({
        gradientId: id,
        type: 'radial',
        gradientUnits: 'percentage', // or 'pixels'
        coords: {x1, y1, x2, y2, r1: r, r2},
        colorStops: stops.map(({offset = 1, opacity = 1, color = '#fff'}) => ({
          offset,
          color: mergeAlpha(color, opacity),
        })),
      }))
    }
  })
}

/**
 * create masks
 * @param {Object} options
 */
const createMasks = ({container, schema, engine}) => {
  engine === 'svg' && schema.forEach(item => {
    const {id, type, fill} = item
    const mask = container.append('mask').attr('id', id)
    if (type === 'rect') {
      const {x = 0, y = 0, width = '100%', height = '100%'} = item
      mask.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('fill', fill)
        .attr('width', width)
        .attr('height', height)
    } else if (type === 'circle') {
      const {cx = 0.5, cy = 0.5, rx = 0.5, ry = 0.5} = item
      mask.append('ellipse')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('rx', rx)
        .attr('ry', ry)
        .attr('fill', fill)
    } else if (type === 'arc') {
      const {innerRadius, outerRadius, startAngle, endAngle} = item
      const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
      // visible area
      mask.append('path')
        .attr('fill', 'rgb(255,255,255)')
        .attr('d', arc({startAngle: 0, endAngle: Math.PI * 2}))
      // invisible area
      mask.append('path')
        .attr('fill', 'rgb(0,0,0)')
        .attr('d', arc({startAngle, endAngle}))
    }
  })
}

/**
 * unified entrance
 * @param {*} options
 */
const createDefs = ({container, schema, engine}) => {
  const {linearGradient, radialGradient, mask} = schema
  linearGradient && createLinearGradients({container, schema: linearGradient, engine})
  radialGradient && createRadialGradients({container, schema: radialGradient, engine})
  mask && createMasks({container, schema: mask, engine})
}

/**
 * syntactic sugar to create gradients
 * @param {*} container 
 * @param {String} engine 
 * @returns {String|fabric.Gradient}
 */
export const makeGradientCreator = (container, engine) => ({type, direction, colors, ...other}) => {
  const id = uuid()
  createDefs({
    container,
    engine,
    schema: {
      linearGradient: type === 'linear' && [{
        id,
        x2: direction === 'horizontal' ? 1 : 0,
        y2: direction === 'vertical' ? 1 : 0,
        ...other,
        stops: colors.map((color, i) => ({
          offset: i / (colors.length - 1),
          color,
        })),
      }],
      radialGradient: type === 'radial' && [{
        id,
        r2: 1,
        ...other,
        stops: colors.map((color, i) => ({
          offset: i / (colors.length - 1),
          color,
        })),
      }],
    },
  })
  return engine === 'svg' ? `url(#${id})` : container.find(def => def.gradientId === id)
}

export default createDefs

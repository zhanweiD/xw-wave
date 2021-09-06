/**
 * Node handler for svg(d3) and canvas(fabric)
 */

import {select} from 'd3'
import {fabric} from 'fabric'
import createLog from './create-log'

const engineType = {
  SVG: 'svg',
  CANVAS: 'canvas',
}

export default class Seletor {
  constructor(engine) {
    this.engine = engine
    this.log = createLog('src/util/selector')
    if (engine !== engineType.SVG && engine !== engineType.CANVAS) {
      this.log.error('Selector: Wrong engine type')
    }
  }

  setVisible(target, visible) {
    if (this.engine === engineType.SVG) {
      target.attr('display', visible ? 'block' : 'none')
    }
    if (this.engine === engineType.CANVAS) {
      target.visible = visible 
    }
  }

  getFirstChildByClassName(target, className) {
    if (this.engine === engineType.SVG) {
      const result = target.selectAll(`.${className}`)
      return result.size() > 0 ? select(result._groups[0][0]) : null
    }
    if (this.engine === engineType.CANVAS) {
      const result = target.getObjects().filter(child => child.className === className)
      return result.length > 0 ? result[0] : null
    }
    return []
  }

  createSubContainer(target, className) {
    if (this.engine === engineType.SVG) {
      return target.append('g').attr('class', className)
    }
    if (this.engine === engineType.CANVAS) {
      const group = new fabric.Group([], {subTargetCheck: true, hoverCursor: 'pointer'})
      group.className = className
      target.addWithUpdate(group)
      return group
    }
    return null
  }

  remove(target) {
    if (this.engine === engineType.SVG) {
      return target.remove()
    }
    if (this.engine === engineType.CANVAS) {
      return target.group.remove(target)
    }
    return null
  }
}

/**
 * Node handler for svg(d3) and canvas(fabric)
 */

import {select} from 'd3'
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
    return target
  }

  createSubContainer(target, className) {
    if (this.engine === engineType.SVG) {
      return target.append('g').attr('class', className)
    }
    return target
  }

  remove(target) {
    if (this.engine === engineType.SVG) {
      return target.remove()
    }
    return target
  }
}

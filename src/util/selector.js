import {select} from 'd3'
import {fabric} from 'fabric'

const engineType = {
  SVG: 'svg',
  CANVAS: 'canvas',
}

// svg(d3)和canvas(pixi)有不同的元素处理方式
export default class Seletor {
  constructor(engine) {
    this.engine = engine
  }

  setVisible(target, visible) {
    if (this.engine === engineType.SVG) {
      target.attr('display', visible ? 'block' : 'none')
    }
    if (this.engine === engineType.CANVAS) {
      target.visible = visible 
    }
  }

  setClassName(target, className) {
    if (this.engine === engineType.SVG) {
      target.attr('class', className)
    }
    if (this.engine === engineType.CANVAS) {
      target.className = className
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

  createSubContainer(target) {
    if (this.engine === engineType.SVG) {
      return target.append('g')
    }
    if (this.engine === engineType.CANVAS) {
      const group = new fabric.Group([])
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

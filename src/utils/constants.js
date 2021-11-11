// common set
export const SCALE_TYPE = ['scaleX', 'scaleY', 'scaleXT', 'scaleYR', 'scaleAngle', 'scaleRadius']
export const LIFE_CYCLE = ['setData', 'setStyle', 'draw', 'destroy', 'drawBasic', 'playAnimation']
export const COMMON_EVENTS = ['click', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'mousedown']
export const TOOLTIP_EVENTS = ['mouseover', 'mouseout', 'mousemove']

// common constants
export const MODE = {
  GROUP: 'group',
  STACK: 'stack',
  INTERVAL: 'interval',
  WATERFALL: 'waterfall',
  DEFAULT: 'default', // cover
  PERCENTAGE: 'percentage',
}

export const STATE = {
  INITILIZE: 'initilize',
  DESTROY: 'destroy',
  READY: 'ready',
  WARN: 'warn',
}

export const SHAPE = {
  RECT: 'rect',
  CIRCLE: 'circle',
  BROKEN_LINE: 'broken-line',
  DOTTED_LINE: 'dotted-line',
  STAR: 'star',
}

export const ALIGNMENT = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
}

export const DIRECTION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

export const POSITION = {
  // normal
  CENTER: 'center',
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
  // corner
  LEFTTOP: 'left-top',
  LEFTBOTTOM: 'left-bottom',
  RIGHTTOP: 'right-top',
  RIGHTBOTTOM: 'right-bottom',
  // aside
  SIDE: 'side',
  INNER: 'inner',
  OUTER: 'outer',
  TOPINNER: 'top-inner',
  TOPOUTER: 'top-outer',
  RIGHTINNER: 'right-inner',
  RIGHTOUTER: 'right-outer',
  BOTTOMINNER: 'bottom-inner',
  BOTTOMOUTER: 'bottom-outer',
  LEFTINNER: 'left-inner',
  LEFTOUTER: 'left-outer',
}

export const COORDINATE = {
  GEOGRAPHIC: 'geographic',
  CARTESIAN: 'cartesian',
  POLAR: 'polar',
}

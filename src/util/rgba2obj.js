import hex2obj from './hex2rgb'
import isDef from './is-def'
import isNumeric from './is-numeric'

// rgb字符串转换为rgb序列对象
export default (rgb, opacityMax) => {
  const color = hex2obj(rgb).replace(/rgba\(/i, '').replace(/rgb\(/i, '').replace(')', '').split(',')
  const inspectColor = hex2obj(rgb).search(/rgb/i) === 0 && color.length > 2
    ? color.map(item => (isNumeric(item) ? Number(item) : 0)) : [0, 0, 0, opacityMax]
  return {
    r: inspectColor[0],
    g: inspectColor[1],
    b: inspectColor[2],
    a: isDef(inspectColor[3]) ? inspectColor[3] * opacityMax : opacityMax,
  }
}

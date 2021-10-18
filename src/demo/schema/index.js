import bar from './bar'
import basic from './basic'
import column from './column'
import line from './line'
import map from './map'
import matrix from './matrix'
import pie from './pie'
import radar from './radar'
import scatter from './scatter'

export default {
  column: {
    text: '柱状图',
    code: basic.replace('{REPLACED_LAYERS}', column),
  },
  bar: {
    text: '条形图',
    code: basic.replace('{REPLACED_LAYERS}', bar),
  },
  line: {
    text: '折线图',
    code: basic.replace('{REPLACED_LAYERS}', line),
  },
  pie: {
    text: '饼图',
    code: basic.replace('{REPLACED_LAYERS}', pie),
  },
  radar: {
    text: '雷达图',
    code: basic.replace('{REPLACED_LAYERS}', radar),
  },
  scatter: {
    text: '气泡图',
    code: basic.replace('{REPLACED_LAYERS}', scatter),
  },
  matrix: {
    text: '矩阵图',
    code: basic.replace('{REPLACED_LAYERS}', matrix),
  },
  map: {
    text: '二维地图',
    code: basic.replace('{REPLACED_LAYERS}', map),
  },
  custom: {
    text: '自定义',
    code: basic.replace('{REPLACED_LAYERS}', '[]'),
  },
}

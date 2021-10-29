import line from './normal/line'
import base from './base'
import rect from './normal/rect'
import pie from './normal/pie'
import radar from './normal/radar'
import scatter from './normal/scatter'
import matrix from './normal/matrix'
import digitalFlop from './form-control/digital-flop'
import tabMenu from './form-control/tab-menu'
import timeline from './form-control/timeline'
import map from './geography/map'

const createCode = layerSchema => base.replace('{REPLACED_LAYERS}', layerSchema)

export default {
  name: 'root',
  children: [
    {
      name: '折线图',
      children: [
        {
          name: '分组折线',
          code: createCode(line({mode: 'default', hasArea: false, curve: 'curveLinear'})),
        },
        {
          name: '堆叠折线',
          code: createCode(line({mode: 'stack', hasArea: false, curve: 'curveLinear'})),
        },
        {
          name: '分组面积',
          code: createCode(line({mode: 'default', hasArea: true, curve: 'curveMonotoneX'})),
        },
        {
          name: '堆叠面积',
          code: createCode(line({mode: 'stack', hasArea: true, curve: 'curveMonotoneX'})),
        },
        {
          name: '阶梯折线',
          code: createCode(line({mode: 'default', hasArea: false, curve: 'curveStep'})),
        },
      ],
    },
    {
      name: '柱状图',
      children: [
        {
          name: '分组柱状',
          code: createCode(rect({type: 'column', mode: 'group'})),
        },
        {
          name: '堆叠柱状',
          code: createCode(rect({type: 'column', mode: 'stack'})),
        },
        {
          name: '区间柱状',
          code: createCode(rect({type: 'column', mode: 'interval'})),
        },
        {
          name: '瀑布柱状',
          code: createCode(rect({type: 'column', mode: 'waterfall'})),
        },
        {
          name: '百分比柱状',
          code: createCode(rect({type: 'column', mode: 'percentage'})),
        },
      ],
    },
    {
      name: '条形图',
      children: [
        {
          name: '分组条形',
          code: createCode(rect({type: 'bar', mode: 'group'})),
        },
        {
          name: '堆叠条形',
          code: createCode(rect({type: 'bar', mode: 'stack'})),
        },
        {
          name: '区间条形',
          code: createCode(rect({type: 'bar', mode: 'interval'})),
        },
        {
          name: '瀑布条形',
          code: createCode(rect({type: 'bar', mode: 'waterfall'})),
        },
        {
          name: '百分比条形',
          code: createCode(rect({type: 'bar', mode: 'percentage'})),
        },
      ],
    },
    {
      name: '饼图',
      children: [
        {
          name: '基础饼图',
          code: createCode(pie({type: 'pie', mode: 'default', innerRadius: 0})),
        },
        {
          name: '基础环图',
          code: createCode(pie({type: 'pie', mode: 'default', innerRadius: 30})),
        },
        {
          name: '南丁格尔玫瑰',
          code: createCode(pie({type: 'nightingaleRose', mode: 'default', innerRadius: 30})),
        },
        {
          name: '堆叠南丁格尔玫瑰',
          code: createCode(pie({type: 'nightingaleRose', mode: 'stack', innerRadius: 30})),
        },
      ],
    },
    {
      name: '雷达图',
      children: [
        {
          name: '分组雷达',
          code: createCode(radar({mode: 'default'})),
        },
        {
          name: '堆叠雷达',
          code: createCode(radar({mode: 'stack'})),
        },
      ],
    },
    {
      name: '散点图',
      children: [
        {
          name: '基础散点',
          code: createCode(scatter({pointSize: [10, 10]})),
        },
        {
          name: '气泡',
          code: createCode(scatter({pointSize: [10, 30]})),
        },
      ],
    },
    {
      name: '矩阵图',
      children: [
        {
          name: '方形矩阵',
          code: createCode(matrix({shape: 'rect'})),
        },
        {
          name: '圆形矩阵',
          code: createCode(matrix({shape: 'circle'})),
        },
      ],
    },
    {
      name: '表单控件',
      children: [
        {
          name: '切换菜单',
          code: createCode(tabMenu()),
        },
        {
          name: '时间轴',
          code: createCode(timeline()),
        },
      ],
    },
    {
      name: '翻牌器',
      children: [
        {
          name: '翻牌器1',
          code: createCode(digitalFlop({mode: 'vertical'})),
        },
        {
          name: '翻牌器2',
          code: createCode(digitalFlop({mode: 'flop'})),
        },
      ],
    },
    {
      name: '二维地图',
      children: [
        {
          name: '基础地图',
          code: createCode(map()),
        },
      ],
    },
  ],
}

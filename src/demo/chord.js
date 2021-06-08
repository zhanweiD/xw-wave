import {getStandardLayoutWithBrush} from '../layout/standard'

// 柱状图配置数据生成
const createSchema = (container, theme, layout) => {
  const schema = {
    // 容器
    container,
    // 颜色主题
    theme,
    // 图表适应容器的方式
    adjust: 'auto',
    // 容器宽，自适应为 auto 时无效
    width: 100,
    // 容器高，自适应为 auto 时无效
    height: 100,
    // 主绘图图层的内边距
    padding: [60, 40, 40, 40],
    // 这个 layout 应该是一个生成函数
    layout,
    // 声明坐标系
    coordinate: 'cartesian-bind-linear',

    // 图层数据，下标顺序代表绘制顺序
    layers: [
    // 标题文字图层
      {
        type: 'text',
        options: {
          id: 'title',
          layout: 'title',
        },
        data: '弦图',
        style: {
          text: {
            fontSize: 16,
          },
        },
      },
      {
        type: 'edgeBundle',
        options: {
          id: 'edgeBundle',
          layout: 'main',
        },
        data: [nodes, links],
        style: {
          text: {
            fontSize: 12,
          },
          line: {
            curve: 'curveBasis',
          },
        },
        tooltip: {
          mode: 'single',
          targets: ['circle'],
        },
      },
    ],
  }
  return schema
}

export default {
  chord: (container, theme) => createSchema(container, theme, getStandardLayoutWithBrush),
}

export const nodes = [
  [
    'name',
    'value',
    'category',
  ],
  [
    '清华',
    15,
    '大学',
  ],
  [
    '浙大',
    25,
    '大学',
  ],
  [
    '复旦',
    53,
    '大学',
  ],
  [
    '交大',
    45,
    '大学',
  ],
  [
    '北大',
    45,
    '大学',
  ],
  [
    '慈溪中学',
    48,
    '宁波高中',
  ],
  [
    '镇海中学',
    82,
    '宁波高中',
  ],
  [
    '富阳中学',
    67,
    '杭州高中',
  ],
  [
    '杭州二中',
    23,
    '杭州高中',
  ],
  [
    '余姚中学',
    98,
    '上海高中',
  ],
  [
    '曹杨二中',
    1,
    '上海高中',
  ],
  [
    '复旦附中',
    34,
    '上海高中',
  ],
  [
    '华师大二附中',
    41,
    '上海高中',
  ],
  [
    '交大附中',
    43,
    '上海高中',
  ],
  [
    '交附嘉定',
    71,
    '上海高中',
  ],
  [
    '上海中学',
    34,
    '上海高中',
  ],
  [
    '松江二中',
    99,
    '上海高中',
  ],
  [
    '敬业中学',
    86,
    '上海高中',
  ],
  [
    '上外附中',
    40,
    '上海高中',
  ],
  [
    '上外浦外',
    88,
    '上海高中',
  ],
  [
    '吴淞中学',
    19,
    '上海高中',
  ],
  [
    '向明中学',
    40,
    '上海高中',
  ],
]

export const links = [
  [
    'from',
    'to',
  ],
  [
    '慈溪中学',
    '清华',
  ],
  [
    '慈溪中学',
    '浙大',
  ],
  [
    '慈溪中学',
    '复旦',
  ],
  [
    '慈溪中学',
    '交大',
  ],
  [
    '富阳中学',
    '清华',
  ],
  [
    '富阳中学',
    '浙大',
  ],
  [
    '富阳中学',
    '复旦',
  ],
  [
    '富阳中学',
    '交大',
  ],
  [
    '杭州二中',
    '清华',
  ],
  [
    '杭州二中',
    '浙大',
  ],
  [
    '杭州二中',
    '复旦',
  ],
  [
    '杭州二中',
    '交大',
  ],
  [
    '镇海中学',
    '清华',
  ],
  [
    '镇海中学',
    '浙大',
  ],
  [
    '镇海中学',
    '复旦',
  ],
  [
    '镇海中学',
    '交大',
  ],
  [
    '余姚中学',
    '清华',
  ],
  [
    '曹杨二中',
    '北大',
  ],
  [
    '曹杨二中',
    '复旦',
  ],
  [
    '曹杨二中',
    '交大',
  ],
  [
    '复旦附中',
    '北大',
  ],
  [
    '复旦附中',
    '清华',
  ],
  [
    '复旦附中',
    '复旦',
  ],
  [
    '复旦附中',
    '交大',
  ],
  [
    '复旦附中',
    '浙大',
  ],
  [
    '华师大二附中',
    '北大',
  ],
  [
    '华师大二附中',
    '清华',
  ],
  [
    '华师大二附中',
    '复旦',
  ],
  [
    '华师大二附中',
    '交大',
  ],
  [
    '交大附中',
    '北大',
  ],
  [
    '交大附中',
    '清华',
  ],
  [
    '交大附中',
    '复旦',
  ],
  [
    '交大附中',
    '交大',
  ],
  [
    '交附嘉定',
    '清华',
  ],
  [
    '交附嘉定',
    '复旦',
  ],
  [
    '交附嘉定',
    '交大',
  ],
  [
    '交附嘉定',
    '浙大',
  ],
  [
    '上海中学',
    '北大',
  ],
  [
    '上海中学',
    '清华',
  ],
  [
    '上海中学',
    '复旦',
  ],
  [
    '上海中学',
    '交大',
  ],
  [
    '松江二中',
    '清华',
  ],
  [
    '松江二中',
    '复旦',
  ],
  [
    '松江二中',
    '交大',
  ],
  [
    '敬业中学',
    '北大',
  ],
  [
    '敬业中学',
    '浙大',
  ],
  [
    '上外附中',
    '清华',
  ],
  [
    '上外附中',
    '交大',
  ],
  [
    '上外附中',
    '浙大',
  ],
  [
    '上外浦外',
    '北大',
  ],
  [
    '上外浦外',
    '清华',
  ],
  [
    '上外浦外',
    '复旦',
  ],
  [
    '上外浦外',
    '交大',
  ],
  [
    '吴淞中学',
    '清华',
  ],
  [
    '吴淞中学',
    '复旦',
  ],
  [
    '吴淞中学',
    '交大',
  ],
  [
    '吴淞中学',
    '浙大',
  ],
  [
    '向明中学',
    '北大',
  ],
  [
    '向明中学',
    '复旦',
  ],
  [
    '向明中学',
    '交大',
  ],
  [
    '向明中学',
    '浙大',
  ],
]

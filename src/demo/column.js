import Layout from '../layout'

const titleMapping = {
  group: '分组图',
  stack: '堆叠图',
  interval: '区间图',
  waterfall: '瀑布图',
}

// 柱状图配置数据生成
const createSchema = (container, theme, layout, type, mode, hasLine) => {
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
    // 提示
    tooltip: {
      mode: 'group',
    },
    // 先考虑只有一个笔刷，多笔刷感觉很少会用到
    // brush: {
    //   layout: 'brush',
    //   type: type === 'column' ? 'horizontal' : 'vertical',
    //   // 哪些图层支持笔刷
    //   targets: ['rect', 'axis'],
    // },
    // 图层数据，下标顺序代表绘制顺序
    layers: [
      // 标题文字图层
      {
        type: 'text',
        options: {
          id: 'title',
          layout: 'title',
        },
        data: titleMapping[mode],
        style: {
          text: {
            fontSize: 16,
          },
        },
      },
      // 图例图层
      {
        type: 'legend',
        options: {
          id: 'legend',
          layout: 'legend',
        },
        style: {
          align: 'end',
          verticalAlign: 'start',
          direction: 'horizontal', 
          pointSize: 8,
          gap: [5, 10],
          text: {
            fontSize: 12,
          },
        },
      },
      // 辅助线图层
      {
        type: 'auxiliary',
        options: {
          id: 'auxiliary',
          layout: 'main',
          type: type === 'bar' ? 'vertical' : 'horizontal',
          bind: 'axis',
        },
        data: [
          ['标签', '数值'],
          ['最大值', 300],
          ['最小值', 600],
        ],
        style: {
          labelPosition: type === 'bar' ? 'top' : 'right',
          line: {
            stroke: 'yellow',
            strokeWidth: 2,
            dasharray: '10 5',
          },
          text: {
            fill: 'yellow',
            fontSize: 8,
          },
        },
      },
      // 直角坐标组合
      {
        type: 'axis',
        options: {
          id: 'axis',
          layout: 'main',
          type: 'cartesian',
        },
        scale: {
          count: 5,
          zero: mode !== 'interval',
          paddingInner: 0.382,
          // fixedPaddingInner: 10,
          // fixedBandWidth: 30,
          // fixedBoundary: 'start',
        },
      },
      // 矩形图层
      {
        type: 'rect',
        options: {
          id: 'rect',
          layout: 'main',
          // 声明使用主轴还是副轴，不声明则表示不画坐标轴
          axis: 'main', // minor
          type,
          mode,
        },
        data: {
          type: 'tableList',
          mode: 'normal', 
          row: 6,
          column: 3,
          mu: 500,
          sigma: 200,
          decimalPlace: 1,
        },
        style: {
          labelPosition: type === 'bar' 
            ? ['left-outer', mode === 'stack' || mode === 'waterfall' ? 'center' : 'right-outer'] 
            : ['bottom-outer', mode === 'stack' || mode === 'waterfall' ? 'center' : 'top-outer'],
          rect: {
            fill: ['red', 'green'],
            enableUpdateAnimation: true,
            mapping: elData => {
              if (elData.source.value > 900) {
                elData.fill = 'gray'
              }
              return elData
            },
          },
          bgRect: {
            fill: 'gray',
            fillOpacity: 0.3,
          },
          text: {
            fontSize: 10,
            enableUpdateAnimation: true,
            format: ['number', {decimalPlace: 0, isThousandth: mode === 'waterfall'}],
          },
        },
        animation: {
          rect: {
            enterAnimation: {
              type: 'zoom',
              delay: 0,
              duration: 2000,
              mode: 'enlarge',
              direction: 'both',
            },
            loopAnimation: {
              type: 'scan',
              delay: 2000,
              duration: 3000,
              color: 'rgba(255,255,255,1)',
              direction: type === 'bar' ? 'right' : 'top',
            },
          },
          text: {
            enterAnimation: {
              type: 'fade',
              delay: 2000,
              duration: 1000,
              mode: 'fadeIn',
            },
          },
        },
        event: {
          'click-rect': d => console.log(d),
        },
      },
    ],
  }
  hasLine && schema.layers.push({
    type: 'line',
    options: {
      id: 'line',
      layout: 'main',
      axis: mode === 'stack' ? 'minor' : 'main',
      mode,
    },
    data: {
      type: 'tableList',
      mode: 'normal', 
      row: 6,
      column: 3,
      mu: 1000,
      sigma: 300,
      decimalPlace: 1,
    },
    style: {
      labelPosition: 'top',
      line: {
        strokeWidth: 2,
      },
      area: {
        opacity: 0.2,
      },
      text: {
        fontSize: 10,
        enableUpdateAnimation: true,
      },
      point: {
        enableUpdateAnimation: true,
      },
    },
    animation: {
      curve: {
        enterAnimation: {
          type: 'erase',
          delay: 0,
          duration: 2000,
        },
        loopAnimation: {
          type: 'scan',
          delay: 2000,
          duration: 3000,
          color: 'rgba(255,255,255,0.9)',
          direction: 'right',
          scope: 'stroke',
        },
      },
      text: {
        enterAnimation: {
          type: 'fade',
          delay: 2000,
          duration: 1000,
          mode: 'fadeIn',
        },
      },
    },
    event: {
      'click-circle': d => console.log(d),
    },
  })
  return schema
}

export default {
  groupColumn: (container, theme) => createSchema(container, theme, Layout.standard(true), 'column', 'group', false),
  stackColumn: (container, theme) => createSchema(container, theme, Layout.standard(true), 'column', 'stack', false),
  intervalColumn: (container, theme) => createSchema(container, theme, Layout.standard(true), 'column', 'interval', false),
  waterfallColumn: (container, theme) => createSchema(container, theme, Layout.standard(true), 'column', 'waterfall', false),
  groupBar: (container, theme) => createSchema(container, theme, Layout.standard(true), 'bar', 'group', false),
  stackBar: (container, theme) => createSchema(container, theme, Layout.standard(true), 'bar', 'stack', false),
  intervalBar: (container, theme) => createSchema(container, theme, Layout.standard(true), 'bar', 'interval', false),
  waterfallBar: (container, theme) => createSchema(container, theme, Layout.standard(true), 'bar', 'waterfall', false),
  groupLineColumn: (container, theme) => createSchema(container, theme, Layout.standard(true), 'column', 'group', true),
  stackLineColumn: (container, theme) => createSchema(container, theme, Layout.standard(true), 'column', 'stack', true),
}

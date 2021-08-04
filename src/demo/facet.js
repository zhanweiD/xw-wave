import Layout from '../layout'
import {createGaugeData} from './mock'

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
    padding: [60, 20, 20, 80],
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
        data: '分面图',
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
          align: 'start',
          verticalAlign: 'middle',
          direction: 'vertical', 
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
          layout: 'facet0',
          type: 'horizontal',
        },
        data: [
          ['标签', '数值'],
          ['最大值', 300],
          ['最小值', 600],
        ],
        style: {
          labelPosition: 'right',
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
      // 矩形图层
      {
        type: 'rect',
        options: {
          id: 'rect',
          layout: 'facet0',
          // 声明使用主轴还是副轴，不声明则表示不画坐标轴
          axis: 'main', // minor
          mode: 'group',
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
        scale: {
          zero: true,
          // fixedBandWidth: 30,
          // fixedBoundary: 'start',
        },
        style: {
          labelPosition: ['bottom-outer', 'top-outer'],
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
            // loopAnimation: {
            //   type: 'scan',
            //   delay: 2000,
            //   duration: 3000,
            //   color: 'rgba(255,255,255,0.5)',
            //   direction: type === 'bar' ? 'right' : 'top',
            // },
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
      // 弧形图层
      {
        type: 'arc',
        options: {
          id: 'arc',
          layout: 'facet2',
        },
        scale: {
          count: 5,
          // fixedPaddingInner: 10,
          // fixedBandWidth: 30,
          fixedBoundary: 'start',
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
          labelPosition: 'outer',
          innerRadius: 20,
          text: {
            enableUpdateAnimation: true,
            fontSize: 8,
          },
        },
        animation: {
          arc: {
            enterAnimation: {
              type: 'zoom',
              delay: 0,
              duration: 2000,
              mode: 'enlarge',
              direction: 'both',
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
          'click-arc': d => console.log(d),
        },
      },
      // 折线图层
      {
        type: 'line',
        options: {
          id: 'line',
          layout: 'facet1',
          fallback: 'zero',
        },
        scale: {
          count: 5,
          // fixedPaddingInner: 10,
          // fixedBandWidth: 30,
          fixedBoundary: 'start',
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
          labelPosition: 'top',
          curve: {
            strokeWidth: 2,
          },
          area: {
            opacity: 0.8,
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
          area: {
            enterAnimation: {
              type: 'erase',
              delay: 0,
              duration: 2000,
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
      },
      // 仪表盘层
      {
        type: 'gauge',
        options: {
          id: 'gauge',
          layout: 'facet3',
        },
        data: createGaugeData('gauge'),
        style: {
          tickSize: 10,
          valueText: {
            fontSize: 15,
          },
        },
      },
    ],
  }
  return schema
}

export default {
  facet1: (container, theme) => createSchema(container, theme, Layout.facet(2, 2)),
}

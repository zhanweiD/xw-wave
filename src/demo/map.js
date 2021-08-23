import Layout from '../layout'
import {chinaGeoJSON} from './mock'

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
    padding: [30, 0, 0, 0],
    // 这个 layout 应该是一个生成函数
    layout,
    // 声明坐标系
    coordinate: 'geographic',
    // 图层数据，下标顺序代表绘制顺序
    layers: [
      // 标题文字图层
      {
        type: 'text',
        options: {
          id: 'title',
          layout: 'title',
        },
        data: '二维地图',
        style: {
          text: {
            fontSize: 16,
          },
        },
      },
      // 多图层联动必须引入坐标轴层，单个使用则不需要
      {
        type: 'axis',
        options: {
          id: 'axis',
          layout: 'main',
          type: 'geographic',
        },
        style: {
        },
      },
      // 地图底图
      {
        type: 'baseMap',
        options: {
          id: 'baseMap',
          layout: 'main',
        },
        data: chinaGeoJSON,
        style: {
          block: {
            fill: 'skyblue',
          },
        },
      },
      // 飞线抛物线
      {
        type: 'odLine',
        options: {
          id: 'odLine',
          layout: 'main',
        },
        data: [
          ['fromX', 'fromY', 'toX', 'toY'],
          [120, 30, 90, 45],
        ],
        style: {
          odLine: {
            stroke: 'yellow',
          },
        },
      },
      // 注意散点数据为经纬度
      {
        type: 'scatter',
        options: {
          id: 'scatter',
          layout: 'main',
          axis: 'main',
        },
        data: [
          ['category', 'x', 'y'],
          ['沈阳', 123.429092, 41.796768],
          ['杭州', 120.15358, 30.287458],
          ['北京', 116.405289, 39.904987],
          ['上海', 121.472641, 31.231707],
        ],
        style: {
          circleSize: [10, 10],
          text: {
            hide: true,
            fontSize: 10,
          },
        },
        animation: {
          circle: {
            enter: {
              type: 'zoom',
              delay: 0,
              duration: 2000,
              mode: 'enlarge',
              direction: 'both',
            },
          },
          text: {
            enter: {
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
    ],
  }
  return schema
}

export default {
  baseMap: (container, theme) => createSchema(container, theme, Layout.standard(false)),
}

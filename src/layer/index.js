import Text from './text'
import Axis from './axis'
import Rect from './rect'
import Legend from './legend'
import Arc from './arc'
import Line from './line'
import Radar from './radar'
import Auxiliary from './auxiliary'
import Scatter from './scatter'
import Matrix from './matrix'
import Gauge from './gauge'
import EdgeBundle from './edge-bundle'
import Chord from './chord'
import Sankey from './sankey'
import Tree from './tree'

export const layerMapping = {
  arc: Arc, // 圆弧
  auxiliary: Auxiliary, // 辅助线
  axis: Axis, // 坐标轴
  chord: Chord, // 和弦图
  edgeBundle: EdgeBundle, // 边缘捆图
  gauge: Gauge, // 仪表盘
  legend: Legend, // 图例
  line: Line, // 折线
  matrix: Matrix, // 矩阵
  radar: Radar, // 雷达
  rect: Rect, // 矩形
  sankey: Sankey, // 桑基
  scatter: Scatter, // 散点
  text: Text, // 文本
  tree: Tree, // 树形图
}

export default {
  Arc, // 圆弧
  Auxiliary, // 辅助线
  Axis, // 坐标轴
  Chord, // 和弦图
  EdgeBundle, // 边缘捆图
  Gauge, // 仪表盘
  Legend, // 图例
  Line, // 折线
  Matrix, // 矩阵
  Radar, // 雷达
  Rect, // 矩形
  Sankey, // 桑基
  Scatter, // 散点
  Text, // 文本
  Tree, // 树形图
}

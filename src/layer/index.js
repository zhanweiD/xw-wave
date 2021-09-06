// 通用图层
import Axis from './axis'
import Legend from './legend'
// 基础图层
import Text from './normal/text'
import Rect from './normal/rect'
import Arc from './normal/arc'
import Line from './normal/line'
import Radar from './normal/radar'
import Auxiliary from './normal/auxiliary'
import Scatter from './normal/scatter'
import Matrix from './normal/matrix'
import Gauge from './normal/gauge'
// 关系图层
import EdgeBundle from './relation/edge-bundle'
import Chord from './relation/chord'
import Sankey from './relation/sankey'
import Tree from './relation/tree'
import Treemap from './relation/treemap'
import Pack from './relation/pack'
// 地理图层
import BaseMap from './geography/base-map'
import ODLine from './geography/od-line'
// 装饰图层
import TitleA from './decoration/title-a'
import TitleB from './decoration/title-b'
import TitleC from './decoration/title-c'
import TitleD from './decoration/title-d'
import TitleE from './decoration/title-e'

export const layerMapping = {
  arc: Arc, // 圆弧
  auxiliary: Auxiliary, // 辅助线
  axis: Axis, // 坐标轴
  baseMap: BaseMap, // 地图底图
  chord: Chord, // 和弦图
  edgeBundle: EdgeBundle, // 边缘捆图
  gauge: Gauge, // 仪表盘
  legend: Legend, // 图例
  line: Line, // 折线
  matrix: Matrix, // 矩阵
  odLine: ODLine, // 抛物线
  pack: Pack, // 打包图
  radar: Radar, // 雷达
  rect: Rect, // 矩形
  sankey: Sankey, // 桑基
  scatter: Scatter, // 散点
  text: Text, // 文本
  tree: Tree, // 树形图
  treemap: Treemap, // 矩形树图
  titleA: TitleA, // 标题装饰
  titleB: TitleB, // 标题装饰
  titleC: TitleC, // 标题装饰
  titleD: TitleD, // 标题装饰
  titleE: TitleE, // 标题装饰
}

export default {
  Arc, // 圆弧
  Auxiliary, // 辅助线
  Axis, // 坐标轴
  BaseMap, // 地图底图
  Chord, // 和弦图
  EdgeBundle, // 边缘捆图
  Gauge, // 仪表盘
  Legend, // 图例
  Line, // 折线
  Matrix, // 矩阵
  ODLine, // 抛物线
  Pack, // 打包图
  Radar, // 雷达
  Rect, // 矩形
  Sankey, // 桑基
  Scatter, // 散点
  Text, // 文本
  Tree, // 树形图
  Treemap, // 矩形树图
  TitleA, // 标题装饰
  TitleB, // 标题装饰
  TitleC, // 标题装饰
  TitleD, // 标题装饰
  TitleE, // 标题装饰
}

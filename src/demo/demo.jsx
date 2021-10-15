import {Children, useRef, useEffect, useState} from 'react'
import {range} from 'd3'
import c from 'classnames'
import ThemeConfig from './theme'
import columnSchema from './column'
import pieSchema from './pie'
import radarSchema from './radar'
import scatterSchema from './scatter'
import matrixSchema from './matrix'
import gaugeSchema from './gauge'
import indicatorSchema from './indicator'
import tabSchema from './tab'
import lineSchema from './line'
import chordSchema from './chord'
import sankeySchema from './sankey'
import treeSchema from './tree'
import columnFacetSchema from './facet'
import treemapSchema from './treemap'
import packSchema from './pack'
import mapSchema from './map'
import decoSchema from './decoration'
import {createWave} from '../chart'
import s from './demo.module.css'

const themeMapping = {
  fairyLand: '梦幻岛',
  emeraldGreen: '冷翡翠',
  duskUniverse: '黄昏宇宙',
  glaze: '琉璃盏',
  exquisite: '玲珑伞',
}

const chartMapping = {
  column: '柱状图',
  bar: '条形图',
  line: '折线图',
  pie: '饼图',
  radar: '雷达图',
  scatter: '点图',
  matrix: '矩阵图',
  gauge: '仪表盘',
  relation: '关系图',
  facet: '分面图',
  map: '地图',
  decoration: '装饰',
}

export default function Example() {
  const [chart, setChart] = useState('gauge')
  const [theme, setTheme] = useState('duskUniverse')
  const [fallbackWaves, setFallbackWaves] = useState([])
  const containerStyle = {background: ThemeConfig[theme].background}
  const refs = range(1, 100, 1).map(() => useRef(null))

  useEffect(() => {
    // 释放资源
    fallbackWaves.forEach(wave => wave && wave.destroy())
    const waves = []
    const themeColors = ThemeConfig[theme].colors
    // 柱状图
    waves.push(chart === 'column' && createWave(columnSchema.groupColumn(refs[1].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.stackColumn(refs[2].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.intervalColumn(refs[3].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.waterfallColumn(refs[4].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.groupLineColumn(refs[5].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.stackLineColumn(refs[6].current, themeColors)))
    waves.push(chart === 'column' && createWave(columnSchema.percentageColumn(refs[7].current, themeColors)))
    // 条形图
    waves.push(chart === 'bar' && createWave(columnSchema.groupBar(refs[1].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.stackBar(refs[2].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.intervalBar(refs[3].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.waterfallBar(refs[4].current, themeColors)))
    waves.push(chart === 'bar' && createWave(columnSchema.percentageBar(refs[5].current, themeColors)))
    // 饼图类
    waves.push(chart === 'pie' && createWave(pieSchema.pie(refs[1].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.donut(refs[2].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.nightingaleRose(refs[3].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.donutNightingaleRose(refs[4].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.stackNightingaleRose(refs[5].current, themeColors)))
    waves.push(chart === 'pie' && createWave(pieSchema.stackDonutNightingaleRose(refs[6].current, themeColors)))
    // 雷达图类
    waves.push(chart === 'radar' && createWave(radarSchema.radar(refs[1].current, themeColors)))
    waves.push(chart === 'radar' && createWave(radarSchema.stackRadar(refs[2].current, themeColors)))
    // 点图类
    waves.push(chart === 'scatter' && createWave(scatterSchema.scatter(refs[1].current, themeColors)))
    waves.push(chart === 'scatter' && createWave(scatterSchema.bubble(refs[2].current, themeColors)))
    // 热力图类
    waves.push(chart === 'matrix' && createWave(matrixSchema.rectHeatmap(refs[1].current, themeColors)))
    waves.push(chart === 'matrix' && createWave(matrixSchema.circleHeatmap(refs[2].current, themeColors)))
    // 仪表盘
    waves.push(chart === 'gauge' && createWave(gaugeSchema.gauge(refs[1].current, themeColors)))
    waves.push(chart === 'gauge' && createWave(gaugeSchema.indicator(refs[2].current, themeColors)))
    waves.push(chart === 'gauge' && createWave(indicatorSchema.indicator(refs[3].current, themeColors)))
    waves.push(chart === 'gauge' && createWave(tabSchema.tabButton(refs[4].current, themeColors)))
    // 折线类
    waves.push(chart === 'line' && createWave(lineSchema.line(refs[1].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.stackLine(refs[2].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.area(refs[3].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.stackArea(refs[4].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.step(refs[5].current, themeColors)))
    waves.push(chart === 'line' && createWave(lineSchema.stepArea(refs[6].current, themeColors)))
    // 关系图类
    waves.push(chart === 'relation' && createWave(chordSchema.edgeBundle(refs[1].current, themeColors)))
    waves.push(chart === 'relation' && createWave(chordSchema.chord(refs[2].current, themeColors)))
    waves.push(chart === 'relation' && createWave(sankeySchema.sankey(refs[3].current, themeColors)))
    waves.push(chart === 'relation' && createWave(treemapSchema.treemap(refs[4].current, themeColors)))
    waves.push(chart === 'relation' && createWave(packSchema.pack(refs[5].current, themeColors)))
    waves.push(chart === 'relation' && createWave(treeSchema.horizontalTree(refs[6].current, themeColors)))
    waves.push(chart === 'relation' && createWave(treeSchema.verticalTree(refs[7].current, themeColors)))
    // 分面图
    waves.push(chart === 'facet' && createWave(columnFacetSchema.facet1(refs[1].current, themeColors)))
    // 地图
    waves.push(chart === 'map' && createWave(mapSchema.baseMap(refs[1].current, themeColors)))
    // 装饰
    waves.push(chart === 'decoration' && createWave(decoSchema.titleA(refs[1].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.titleBAvtive(refs[2].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.titleBInactive(refs[3].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.titleC(refs[4].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.titleD1(refs[5].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.titleD2(refs[6].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.titleE(refs[7].current, themeColors)))
    waves.push(chart === 'decoration' && createWave(decoSchema.borderA(refs[8].current, themeColors)))
    // 重新设置数据
    setFallbackWaves(waves)
  }, [theme, chart])

  return (
    <div className={c('fbv fb1', s.container)} style={containerStyle}>
      <div className="fbh">
        <div className={s.activeText}>主题</div>
        {Object.keys(themeMapping).map(name => Children.toArray(
          <div
            className={c('hand', s.text, name === theme ? s.activeText : s.inactiveText)}
            onClick={() => setTheme(name)}
          >
            {themeMapping[name]}
          </div>
        ))}
      </div>
      <div className="fbh">
        <div className={s.activeText}>图表</div>
        {Object.keys(chartMapping).map(name => Children.toArray(
          <div
            className={c('hand', s.text, name === chart ? s.activeText : s.inactiveText)}
            onClick={() => setChart(name)}
          >
            {chartMapping[name]}
          </div>
        ))}
      </div>
      <div className="fbh">
        <div className="fbh fb1 fbw">
          {chart === 'column' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[6]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[7]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[6]} />}
          {chart === 'radar' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'radar' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'scatter' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'scatter' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'matrix' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'matrix' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[6]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[6]} />}
          {chart === 'relation' && <div className={s.wave} ref={refs[7]} />}
          {chart === 'facet' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'map' && <div className={s.wave} ref={refs[1]} />}
          {chart === 'decoration' && <div className={s.decoTitleWave} ref={refs[1]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[2]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[3]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[4]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[5]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[6]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[7]} />}
          {chart === 'decoration' && <div className={s.decoSubtitleWave} ref={refs[8]} />}
        </div>
      </div>
    </div>
  )
}

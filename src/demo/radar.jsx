import {useEffect, useRef} from 'react'
import Wave from '../wave'
import TableList from '../data/table-list'
import Scale from '../data/scale'
import s from './demo.module.css'

const titleMapping = {
  group: '分组图',
  stack: '堆叠图',
}

let groupedColumnWave
let stackedColumnWave

export default function Column({data = [[]], type = 'column', theme}) {
  const groupedColumnRef = useRef(null)
  const stackedColumnRef = useRef(null)
 
  useEffect(() => {
    groupedColumnWave = new Wave({container: groupedColumnRef.current, theme})
    stackedColumnWave = new Wave({container: stackedColumnRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: groupedColumnWave, mode: 'group', data, type})
    updateWave({wave: stackedColumnWave, mode: 'stack', data, type})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbw">
      <div className={s.wave} ref={groupedColumnRef} />
      <div className={s.wave} ref={stackedColumnRef} />
    </div>
  )
}

// 分组柱状图
const updateWave = ({wave, data, type, mode}) => {
  const tableList = new TableList(data)

  const {width, height} = wave.layout.main
  const headers = tableList.data.map(({header}) => header)
  const labels = tableList.data[0].list
  const maxRadius = Math.min(width, height) / 2

  // 数值轴图层
  const asixAngle = wave.layer[0]?.instance || wave.createLayer('axis')
  asixAngle.setLayout(wave.layout.main)
  asixAngle.setStyle({
    type: 'angle', // 此处对应角坐标
    tickLine: {
      opacity: 0.3,
      strokeWidth: 1,
      stroke: 'white',
      fill: 'none',
    },
  })
  asixAngle.setScale(new Scale({
    type: 'band',
    domain: labels,
    range: [0, 360],
    nice: {paddingInner: 0},
  }))
  asixAngle.draw()
  
  // 标签轴图层
  const asixRadius = wave.layer[1]?.instance || wave.createLayer('axis')
  asixRadius.setLayout(wave.layout.main)
  asixRadius.setStyle({
    type: 'radius', // 此处对应半径坐标
    tickLine: {
      opacity: 0.3,
      strokeWidth: 1,
      stroke: 'white',
      fill: 'none',
    },
  })
  asixRadius.setScale(new Scale({
    type: 'linear',
    domain: mode === 'stack'
      ? [0, tableList.select(headers.slice(1), {mode: 'sum', target: 'row'}).range()[1]]
      : [0, tableList.select(headers.slice(1)).range()[1]],
    range: [0, maxRadius],
    nice: false,
  }))
  asixRadius.draw()

  // 标题图层
  const titleLayer = wave.layer[2]?.instance || wave.createLayer('text', {layout: wave.layout.title})
  titleLayer.setData(titleMapping[mode])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 雷达图层
  const radarLayer = wave.layer[3]?.instance || wave.createLayer('radar', {mode, type, layout: wave.layout.main})
  radarLayer.setData(tableList.select(data[0].slice(0)))
  radarLayer.setStyle({
    circle: {
      enableUpdateAnimation: true,
    },
    polygon: {
      enableUpdateAnimation: true,
      opacity: 0.5,
    },
    text: {
      fontSize: 10,
      enableUpdateAnimation: true,
    },
  })
  radarLayer.draw()

  // 图例图层
  const legend = wave.layer[4]?.instance || wave.createLayer('legend', {layout: wave.layout.legend})
  legend.setData(tableList.data.map(({header}) => header).slice(1))
  legend.setStyle({
    align: 'end',
    verticalAlign: 'start',
    direction: 'horizontal', 
    pointSize: 8,
    gap: [5, 10],
    text: {
      fontSize: 12,
      textShadow: '',
    },
  })
  legend.draw()
}

import {useEffect, useRef} from 'react'
import Wave from '../wave'
import TableList from '../data/table-list'
import s from './demo.module.css'

const titleMapping = {
  pie: ['饼图', '环图'],
  nightingaleRose: ['蓝丁格尔玫瑰图', '环形蓝丁格尔玫瑰图'],
}

let pieWave
let donutWave
let nightingaleRoseWave
let donutNightingaleRoseWave
let stackNightingaleRoseWave
let stackDonutNightingaleRoseWave
let drawCount = 0

export default function Column({data = [[]], theme}) {
  const pieRef = useRef(null)
  const donutRef = useRef(null)
  const nightingaleRoseRef = useRef(null)
  const donutNightingaleRoseRef = useRef(null)
  const stackNightingaleRoseRef = useRef(null)
  const stackDonutNightingaleRoseRef = useRef(null)
 
  useEffect(() => {
    pieWave = new Wave({container: pieRef.current, theme})
    donutWave = new Wave({container: donutRef.current, theme})
    nightingaleRoseWave = new Wave({container: nightingaleRoseRef.current, theme})
    donutNightingaleRoseWave = new Wave({container: donutNightingaleRoseRef.current, theme})
    stackNightingaleRoseWave = new Wave({container: stackNightingaleRoseRef.current, theme})
    stackDonutNightingaleRoseWave = new Wave({container: stackDonutNightingaleRoseRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: pieWave, mode: 'default', data, type: 'pie', donut: false})
    updateWave({wave: donutWave, mode: 'default', data, type: 'pie', donut: true})
    updateWave({wave: nightingaleRoseWave, mode: 'default', data, type: 'nightingaleRose', donut: false})
    updateWave({wave: donutNightingaleRoseWave, mode: 'default', data, type: 'nightingaleRose', donut: true})
    updateWave({wave: stackNightingaleRoseWave, mode: 'stack', data, type: 'nightingaleRose', donut: false})
    updateWave({wave: stackDonutNightingaleRoseWave, mode: 'stack', data, type: 'nightingaleRose', donut: true})
  }, [data, theme])
  
  return (
    <div className="fbh fb1 fbw">
      <div className={s.wave} ref={pieRef} />
      <div className={s.wave} ref={donutRef} />
      <div className={s.wave} ref={nightingaleRoseRef} />
      <div className={s.wave} ref={donutNightingaleRoseRef} />
      <div className={s.wave} ref={stackNightingaleRoseRef} />
      <div className={s.wave} ref={stackDonutNightingaleRoseRef} />
    </div>
  )
}

// 分组柱状图
const updateWave = ({wave, data, type, mode, donut}) => {
  const tableList = new TableList(data)

  // 标题图层
  const titleIndex = wave.layer.findIndex(item => item.id === 'titleLayer')
  // titleIndex !== -1 && wave.layer[titleIndex].instance.destroy()
  const titleLayer = titleIndex !== -1 ? wave.layer[titleIndex].instance : wave.createLayer('text', {id: 'titleLayer', layout: wave.layout.title})
  titleLayer.setData(`${mode === 'stack' ? '堆叠' : ''}${donut ? titleMapping[type][1] : titleMapping[type][0]}`)
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 圆弧图层
  const arcIndex = wave.layer.findIndex(item => item.id === 'arcLayer')
  const arcLayer = arcIndex !== -1 ? wave.layer[arcIndex].instance : wave.createLayer('arc', {id: 'arcLayer', mode, type, layout: wave.layout.main})
  const {width, height} = wave.layout.main
  const arcData = tableList.select(data[0].slice(0, mode === 'default' ? 2 : Infinity))
  arcLayer.setData(arcData)
  arcLayer.setStyle({
    innerRadius: donut ? Math.min(width, height) / 10 : 0,
    arc: {
      enableUpdateAnimation: true,
    },
    text: {
      enableUpdateAnimation: true,
      fontSize: 8,
    },
  })
  arcLayer.draw()

  // 删除动画，数据更新动画结束后在更新动画（因为扫光会基于原来的元素克隆新元素）
  Object.keys(arcLayer.animation).forEach(name => arcLayer.animation[name]?.destroy())
  setTimeout(() => {
    const aniamtions = arcLayer.setAnimation({
      arc: {
        enterAnimation: {
          type: 'zoom',
          delay: 0,
          duration: 2000,
          mode: 'enlarge',
          direction: 'both',
        },
        loopAnimation: {
          type: 'scan',
          delay: 1000,
          duration: 3000,
          color: 'rgba(255,255,255,0.5)',
          direction: 'outer',
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
    })
    // 出场动画仅仅触发一次
    if (drawCount < 6) {
      aniamtions.arc.play()
      // aniamtions.text.play()
      drawCount++
    } else {
      aniamtions.arc.animationQueue[2].instance.play()
      aniamtions.text.animationQueue[2].instance.play()
    }
  }, drawCount < 6 ? 0 : 2000)

  arcLayer.setTooltip({arc: null})
  arcLayer.event.off('click-arc')
  arcLayer.event.on('click-arc', d => console.log(d))

  // 图例图层
  const legendIndex = wave.layer.findIndex(item => item.id === 'legendLayer')
  // legendIndex !== -1 && wave.layer[legendIndex].instance.destroy()
  const legend = legendIndex !== -1 ? wave.layer[legendIndex].instance : wave.createLayer('legend', {id: 'legendLayer', layout: wave.layout.legend})
  legend.setData(mode === 'default' ? data.slice(1).map(array => array[0]) : data[0].slice(1))
  legend.setStyle({
    align: 'end',
    verticalAlign: 'start',
    direction: 'vertical', 
    pointSize: 8,
    gap: [5, 0],
    text: {
      fontSize: 12,
      textShadow: '',
    },
  })
  legend.draw()
}

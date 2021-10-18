import {useEffect, useRef} from 'react'
import {select} from 'd3-selection'
import createWave from '../../chart/create'
import Layout from '../../layout'
import s from './chart.module.css'
import download from '../../utils/download'

const svgTitle = '<?xml version="1.0" standalone="no"?>'

const Chart = ({title, schema}) => {
  const waveRef = useRef(null)

  // 下载图表文件
  const downloadSvg = () => {
    if (waveRef.current) {
      download(`${svgTitle}${select(waveRef.current).selectAll('svg').nodes()[0].outerHTML}`, 'wave.svg')
    }
  }

  useEffect(() => {
    try {
      if (schema) {
        // environment
        const container = waveRef.current
        const layout = Layout.standard()
        // eslint-disable-next-line no-eval
        const schemaCreator = eval(schema)
        const waveSchema = schemaCreator()
        // inject
        if (!waveSchema.container) {
          waveSchema.container = container
        }
        if (!waveSchema.layout) {
          waveSchema.layout = layout
        }
        schema && createWave(waveSchema)
      }
    } catch (e) {
      console.error(e)
    }
  }, [schema])

  return (
    <div className={s.waveContainer}>
      <div className={s.title}>
        <div>{title} </div>
        <div className={s.download} onClick={downloadSvg}>
          DOWNLOAD
        </div>
      </div>
      <div ref={waveRef} className={s.wave} />
    </div>
  )
}

export default Chart

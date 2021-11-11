import {useEffect, useRef, useState} from 'react'
import {select} from 'd3-selection'
import createChart from '../../chart/create'
import Layout from '../../layout'
import s from './chart.module.css'
import download from '../../utils/download'

const svgTitle = '<?xml version="1.0" standalone="no"?>'

const Chart = ({title, schema}) => {
  const chartRef = useRef(null)
  const [chart, setChart] = useState(null)

  // 下载图表文件
  const downloadSvg = () => {
    if (chartRef.current) {
      download(`${svgTitle}${select(chartRef.current).selectAll('svg').nodes()[0].outerHTML}`, 'chart.svg')
    }
  }

  useEffect(() => {
    try {
      if (schema) {
        // environment
        const container = chartRef.current
        const layout = Layout.standard()
        // eslint-disable-next-line no-eval
        const schemaCreator = eval(schema)
        const chartSchema = schemaCreator()
        // inject
        if (!chartSchema.container) {
          chartSchema.container = container
        }
        if (!chartSchema.layout) {
          chartSchema.layout = layout
        }
        chart && chart.destroy()
        schema && setChart(createChart(chartSchema))
      }
    } catch (e) {
      console.error(e)
    }
  }, [schema])

  return (
    <div className={s.chartContainer}>
      <div className={s.title}>
        <div>{title} </div>
        <div className={s.download} onClick={downloadSvg}>
          DOWNLOAD
        </div>
      </div>
      <div ref={chartRef} className={s.chart} />
    </div>
  )
}

export default Chart

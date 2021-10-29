import React, {useState} from 'react'
import SideBar from './side-bar'
import Editor from './editor'
import Chart from './chart'
import s from './demo.module.css'
import schema from './schema'

let backup = schema.children[0].children[0].code

export default function Demo() {
  const [oldSchema, setOldSchema] = useState(backup)
  const [newSchema, setNewSchema] = useState(backup)

  return (
    <div className={s.container}>
      <SideBar
        onSelect={({code}) => {
          setOldSchema(code)
          setNewSchema(code)
        }}
      />
      <div className={s.mainSection}>
        <div className={s.editorSection}>
          <Editor
            schema={newSchema}
            onChange={value => {
              setOldSchema(backup)
              setNewSchema(value)
              backup = value
            }}
          />
        </div>
        <div className={s.waveSection}>
          <Chart title="PREVIOUS" schema={oldSchema} />
          <Chart title="CURRENT" schema={newSchema} />
        </div>
      </div>
    </div>
  )
}

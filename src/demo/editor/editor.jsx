/* eslint-disable no-bitwise */
/* eslint-disable import/extensions */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/editor/contrib/find/findController.js'
import React, {useEffect, useRef, useState} from 'react'
import s from './editor.module.css'
import download from '../../utils/download'

export default function Editor({schema, onChange}) {
  const editorRef = useRef(null)
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    editor && schema && editor.setValue(schema)
  }, [schema])

  useEffect(() => {
    const instance = monaco.editor.create(editorRef.current, {
      fontSize: 16,
      value: schema || '"hello world !"',
      language: 'javascript',
    })
    instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      onChange(instance.getValue())
    })
    instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D, () => {
      download(instance.getValue(), 'schema.txt')
    })
    setEditor(instance)
  }, [])

  return <div className={s.editor} ref={editorRef} />
}

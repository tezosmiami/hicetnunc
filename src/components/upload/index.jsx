import React, { useState } from 'react'
import { getLanguage } from '../../constants'
import { getMimeType } from '../../utils/sanitise'
import { Buffer } from 'buffer'
import styles from './styles.module.scss'


export const Upload = ({
  label,
  allowedTypes,
  allowedTypesLabel,
  onChange = () => null,
}) => {
  const language = getLanguage()
  const [title, setTitle] = useState(label)

  const onFileChange = async (e) => {
    const { files } = e.target
    const file = files[0]

    setTitle(file.name)
    const mimeType = file.type !== '' ? file.type : await getMimeType(file)
    const buffer = Buffer.from(await file.arrayBuffer())

    // set reader for preview
    const reader = new FileReader()
    reader.addEventListener('load', (e) => {
      onChange({ title, mimeType, file, buffer, reader: e.target.result })
    })
    reader.readAsDataURL(file)
  }

  const props = {
    type: 'file',
    name: 'file',
  }

  if (allowedTypes) {
    props['accept'] = allowedTypes.join(',')
  }

  return (
    <div className={styles.container}>
      <label>
        {title}
        <input {...props} onChange={onFileChange} />
      </label>
      <div className={styles.allowed}>
        {language.mint.supports}:&nbsp;{allowedTypesLabel}
      </div>
    </div>
  )
}

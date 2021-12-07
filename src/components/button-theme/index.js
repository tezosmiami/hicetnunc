import React, { useContext } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import styles from './styles.module.scss'

export const ButtonTheme = () => {
  const context = useContext(HicetnuncContext)
  return (
    <div
      className={styles.container}
      onClick={() =>
        context.setTheme(context.theme === 'blue' ? 'green' : context.theme === 'green' ? 'pink' : context.theme === 'pink' ? 'blue' : 'blue')
      }
    />
  )
}

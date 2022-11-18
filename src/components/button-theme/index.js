import React, { useContext } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import styles from './styles.module.scss'

export const ButtonTheme = () => {
  const context = useContext(HicetnuncContext)

  return (
    <div
      className={styles.container}
      onClick={() =>{
        
        context.setTheme(context.theme === 'blue' ? 'green' : 
                         context.theme === 'green' ? 'orange' : 
                         context.theme === 'orange' ? 'charcol' :
                         context.theme === 'charcol' ? 'black' :
                         context.theme === 'black' ? 'pink' : 
                         context.theme === 'pink' ? 'white' :
                         context.theme === 'white' ? 'blue' :
                         context.theme, true )
      }}
    />
  )
}

import React, { useState } from 'react'
import { Button, Primary } from '../button'
import { getItem, setItem } from '../../utils/storage'


export const NeonSwitch = () => {
    const [neon, setNeon] = useState(getItem('neonstyle'))
    
    const switchNeon = () => {
      if (neon === false) {
        setItem('neonstyle', true)
        document.documentElement.style.setProperty(
          '--text-shadow', '0 0 9px #fff, 0 0 9px var(--text-color)')
        document.documentElement.style.setProperty(
          '--box-shadow', '0 0 6px #fff, 0 0 6px var(--text-color)')
        document.documentElement.style.setProperty('--drop-shadow', '0 0 3px #fff')
        setNeon(true) 
      } else {
          setItem('neonstyle', false) 
          document.documentElement.style.setProperty('--text-shadow', 'none')
          document.documentElement.style.setProperty('--box-shadow', 'none')
          document.documentElement.style.setProperty('--drop-shadow', 'none')
          setNeon(false)
      }
      window.dispatchEvent(new Event("neon"))
    } 

  return (
    <Button onClick={switchNeon}>
      <Primary>
        {neon === true ? <svg style={{borderRadius:'30px'}} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 3l18 18"></path><path d="M16 12a4 4 0 0 0 -4 -4m-2.834 1.177a4 4 0 0 0 5.66 5.654"></path><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"></path></svg>
        : <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"></path></svg>
        }
      </Primary>
    </Button>
  ) 
}
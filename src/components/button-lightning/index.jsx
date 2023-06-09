import React, { useEffect, useState } from 'react'
import { getItem, setItem } from '../../utils/storage'
import { Button, Primary, Purchase } from '../button'
import  { useLightningContext } from '../../context/LightningContext'
import { Input } from '../input'
import styles from './styles.module.scss'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const LightningButton = ({ setTooltip, recepient }) => {
    const [modal, setModal] = useState(false)
    const [amount, setAmount] = useState(21)
    const [lightning, setLightning] = useState(null)
    const { fetchLightning, has_lightning, zap_lightning } = useLightningContext()
    
    useEffect(() => {
        const fetchRecepient = async() =>{
            getItem('defaultsats') ? setAmount(getItem('defaultsats')) : setItem('defaultsats', 21)
            setLightning(await fetchLightning(recepient))
        }
        recepient && fetchRecepient()
        return () => {
            setLightning(null)
        } 
    }, [recepient])

    const reset = () => {
        setModal(false)   
        setTooltip && setTooltip(true)
    }

    const zap_submit = async(amount) => {
        setAmount(amount)
        setItem('defaultsats', amount)
        await zap_lightning(lightning, amount)
    }

    const onKeyPress = async(e) => {
        console.log(e.key)
        if (e.key === 'Enter') {
          e.preventDefault()
          await zap_submit(e.target.value);
        }
      } 

    const zap_action = () => {
        if (modal) {reset(); return}
        if (isMobile || has_lightning()) {
          setModal(true)
        } else {
            window.open('https://getalby.com')
            setModal(true)
        }
        setTooltip && setTooltip(false)
    } 

    return (
        <>
            {lightning && <div className={styles.zap}>
                {!modal && <Button onClick={zap_action}>
                    <Primary>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"></path></svg>
                    </Primary>
                </Button>}

                {modal && 
                <div onBlur={reset} style={{display: 'flex', flexDirection: 'row'}}>
                    <Input
                        type="number"
                        min={1}
                        max={999999}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyPress={onKeyPress}
                        placeholder={`sats to gift`}
                        label="sats to gift"
                        value={amount}
                        autoFocus
                    />
                    <Button onMouseDown={async () => await zap_submit(amount)}>
                    <Purchase>zap</Purchase>
                    {/* <Purchase><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"></path></svg></Purchase> */}
                    </Button>
                </div>
                }
            </div>
            }
        </>
    )
}
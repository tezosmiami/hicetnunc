import React, { useContext, useEffect, useState, useRef } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { fetchGraphQL } from '../../data/hicdex'
import { useHistory } from 'react-router'
import { Button, Primary } from '../../components/button'
import { walletPreview } from '../../utils/string'
import { Purchase } from '../../components/button'
import { Textarea } from '../../components/input'
import { useNostrEvents, dateToUnix } from "nostr-react"
import { nip19, nip04 } from "nostr-tools"
import { useNostrContext } from '../../context/NostrContext'
import { getItem } from '../../utils/storage'
import styles from './styles.module.scss'

export const Messages = () => {
    const [message, setMessage] = useState([])
    const [active, setActive] = useState(false)
    const {sent, received, keys, sendMessage} = useNostrContext()
    // const now = useRefk(new Date()); 
    const { pub, priv } = getItem('nostr').keys

    const onSubmit = e => {
        e.preventDefault()
        sendMessage(message, 'npub190rqwj0nud4uhvmaeg7cgn0gypu0s09j87vqjluhfhju0req2khsskh9w7')
        // setConversation((c) => [...c, message])
        setMessage('')
        e.target.reset()
    }

    const onKeyPress = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          try {
          sendMessage(e.target.value, 'npub190rqwj0nud4uhvmaeg7cgn0gypu0s09j87vqjluhfhju0req2khsskh9w7')
          setMessage('')
          e.target.value=''
          }catch (e) { console.log(e) }
        }
      }

    const groupBy = (arr) => {
        return arr.reduce((acc, cur) => {
            let property = cur.pubkey === pub ? 'tags' : 'pubkey'
            acc[property === 'tags' ? cur[property][0][1] : cur[property]] = [...acc[property === 'tags' ? cur[property][0][1] : cur[property]] || [], cur];
            return acc;
        }, {});
    }

    // const wait = async(event, senderDecode) => {
    //     console.log(active)
    //     if (active) {
    //         setTimeout(() => {
    //             wait(event,senderDecode) 
    //         }, 100)
    //     } else {
    //        setActive(true)
    //         return await window.nostr.nip04.decrypt(senderDecode, event.content)
    //     }
    //   }
      
    // const decryptMessage = async (event) => {
    //     let senderDecode = event.pubkey === pub 
    //     ? event.tags[0][1] : event.pubkey
    //     if (priv) {
    //         return await nip04.decrypt(priv, senderDecode, event.content)
    //     } else {
    //       let decoded = await wait(event, senderDecode)
    //       console.log('d', decoded)
    //       setActive(false)
    //       return decoded
    //     }
    // }

    // useEffect(() => {
    //     const decodeSent = async () =>{ 
    //         const event = sent[sent.length-1]
    //         if (event) {
    //             event.decoded = await decryptMessage(event)
    //             sent[sent.length-1] = event
    //         }
    //     }
    //     decodeSent()
    // }, [sent])

    // useEffect(() => {
    //     const decodeReceived = async () =>{ 
    //         const event = received[received.length-1]
    //         if (event) {
    //             event.decoded = await decryptMessage(event)
    //             received[received.length-1] = event
    //             active = false
    //         }
    //     }
    //     decodeReceived()
    // }, [received])

    const messages = [...sent, ...received].reverse()
    console.log(messages)
    console.log(Object.entries(groupBy(messages)))

return (
    <>
    <div style={{top: '81px', position: 'relative', zIndex: '111'}}>

     { Object.entries(groupBy(messages)).map((m) => 
          <div key={m[0]} style={{paddingTop: '21px'}}>{walletPreview(m[0])}: {m[1][m[1].length-1].decoded} </div>)
    }
      </div>
        <div className={styles.footer}>
        <form onSubmit={onSubmit}> 
        <Textarea
            type='text'
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
            placeholder='message'
            onKeyPress={onKeyPress}
            max={270}
            label='message'
            value={message}
        />
        <Button type='submit' fit>
            <svg 
                width="55px"
                height="55px"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                            boxShadow: 'none',
                            fill: 'var(--text-color)',
                            stroke: 'var(--background-color)',
                            }}
                >
                <path d="M22 12L3 20l3.563-8L3 4l19 8zM6.5 12H22"  />
            </svg>
        </Button>
        </form>
    </div>
    </>
    )
}    
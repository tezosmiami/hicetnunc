import React, { useContext, useEffect, useState, useRef } from 'react'
import { Button, Primary } from '../../components/button'
import { walletPreview } from '../../utils/string'
import { Textarea } from '../../components/input'
// import { useNostrEvents, dateToUnix } from "nostr-react"
import { nip19, nip04 } from "nostr-tools"
import { useNostrContext } from '../../context/NostrContext'
import { NostrDecrypt } from '../../components/nostr-decrypt'
import { getItem } from '../../utils/storage'
import styles from './styles.module.scss'
import PQueue from 'p-queue';

class PromiseQueue {
    queue = Promise.resolve(true)
  
    add(operation) {
      return new Promise((resolve, reject) => {
        this.queue = this.queue
          .then(operation)
          .then(resolve)
          .catch(reject)
      })
    }
  }

export const Messages = () => {
    const [message, setMessage] = useState([])
    // const [active, setActive] = useState(false)
    const [decrypted, setDecrypted] = useState([])
    const {sent, received, sendMessage} = useNostrContext()
    // const now = useRef(new Date()); 
    const { pub, priv }= getItem('nostr') ? getItem('nostr')?.keys : {priv:'',pub:''}
    // const pub = getItem('nostr')?.keys.pub
    const scrollTarget = useRef(null)
    const queueRef = useRef(new PromiseQueue());

    const onSubmit = e => {
        e.preventDefault()
        sendMessage(message, 'npub190rqwj0nud4uhvmaeg7cgn0gypu0s09j87vqjluhfhju0req2khsskh9w7')
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
      
    const decryptMessage = async (event) => {
        let senderDecode = event.pubkey === pub 
        ? event.tags[0][1] : event.pubkey
        if (priv) {
            return await nip04.decrypt(priv, senderDecode, event.content)
        } else {
        //   let decoded = await window.nostr.nip04.decrypt(senderDecode, event.content)
        let decoded
            try{
                decoded = await queueRef.current.add(async () => { 
                    return await window.nostr.nip04.decrypt(senderDecode, event.content)})
            } catch (e) {console.log(e)}

        // await queue.add(async() => await window.nostr.nip04.decrypt(senderDecode, event.content))

          return decoded
        }
    }

    useEffect(() => {
        if (scrollTarget.current) {
          scrollTarget.current.scrollIntoView(false, {behavior: 'smooth'});
        }
      }, [sent, received]);

    useEffect(() => {
        const decodeSent = async () =>{ 
            const event = sent[sent.length-1]
            if (event) {
                // event.decoded = await decryptMessage(event)
                event.decoded = await decryptMessage(event)
                // event.decoded = await queue.add(decoded)
                sent[sent.length-1] = event
                setDecrypted((d) => [...d, event])
            }
        }
        decodeSent()
    }, [sent])

    useEffect(() => {
        const decodeReceived = async () =>{ 
            const event = received[received.length-1]
            if (event) {
                console.log('de1', event)
                event.decoded = await decryptMessage(event)
                console.log(event.decoded)
                received[received.length-1] = event
                setDecrypted((d) => [...d, event])
                // active = false
            }
        }
        decodeReceived()
    }, [received])

    
    const messages = [...sent, ...received].reverse()
    console.log(messages)
    // console.log(messages)
    // console.log(Object.entries(groupBy(messages)))
    // console.log('sent', sent)
    // console.log('re',received)
    // console.log(messages[0])
console.log('de',decrypted)
console.log('sent', sent)
console.log(Object.entries(groupBy(messages)))
return (
    <>
    <div style={{top: '81px', position: 'relative', zIndex: '111', overflowY: 'visible'}}>
        <div style={{width: '98%'}}>
        { Object.entries(groupBy(messages)).map((m,i) => 
            // <NostrDecrypt key={i} m={m[1][0]} />)
            <div  key={m[0]} className={styles.message}>{walletPreview(m[0])}: {m[1][m[1].length-1].decoded} </div>)
            }
        </div>
        {/* <div className={styles.footer}>
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
        </div> */}
    </div>
    </>
    )
}    
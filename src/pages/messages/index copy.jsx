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
    const [message, setMessage] = useState()
    const [conversation, setConversation] = useState([])
    const nostr = useNostrContext()
    const now = useRef(new Date()); 
    const pub = getItem('nostr').keys.pub
    let c = []
    const onSubmit = e => {
        e.preventDefault()
        nostr.sendMessage(message, 'npub190rqwj0nud4uhvmaeg7cgn0gypu0s09j87vqjluhfhju0req2khsskh9w7')
        setConversation((c) => [...c, message])
        setMessage('')
        e.target.reset()
    }

    const onKeyPress = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          try {
          nostr.sendMessage(e.target.value, 'npub190rqwj0nud4uhvmaeg7cgn0gypu0s09j87vqjluhfhju0req2khsskh9w7')
          setConversation((c) => [...c, e.target.value])
          setMessage('')
          e.target.value=''
          }catch (e) { console.log(e) }
        }
      }
    
    const decryptMessage = async (id, sender, message) => {
        if (nostr.keys?.priv) {
            let plaintext =  await nip04.decrypt(nostr.keys.priv, sender, message)
            console.log('message', plaintext)
            sender = nip19.npubEncode(sender)
            setConversation((c) => [...c, {id, sender, message: plaintext}])
        }
        else return await nip04.decrypt(sender, message)
    }

useEffect(() => {
    let event = nostr.sent[nostr.sent.length - 1]
    console.log(event?.id, event?.content, conversation)
    if (event && !conversation.find(c => c.id === event.id)) {
        decryptMessage(event.id, event.pubkey === pub 
        ? event.tags[0][1] : event.pubkey, event.content)
    }
}, [nostr.sent])

useEffect(() => {
    let event = nostr.received[nostr.received.length - 1]
    if (event && !conversation.find(c => c.id === event.id)){
        decryptMessage(event.id, event.pubkey === pub 
        ? event.tags[0][1] : event.pubkey, event.content)
    }
}, [nostr.received])

console.log(conversation)

return (
    <>
    <div>
     {/* {conversation.map(async (e,i) => (
        <p key={i}>{walletPreview(nip19.npubEncode(e.sender))}: {e.message}</p>
      ))} */}
      {/* {sent.map(async (event) => (
        <p key={event.id}>{walletPreview(nip19.npubEncode(event.pubkey))}: {event.message}</p>
      ))} */}
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
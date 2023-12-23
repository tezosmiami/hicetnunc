import React, { useState, useEffect, useContext } from 'react'
import { Button } from '../button'
import { useNostrContext } from '../../context/NostrContext'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import {nip19 } from 'nostr-tools'


export const MessageButton = ({tezos, subjkt}) => {
    const [event, setEvent] = useState(null)
    const [verified, setVerified] = useState(false)
    const { ndk } = useNostrContext()
    const { verify } = useContext(HicetnuncContext)

     useEffect(() => {
        const getNIP78 = async() => {
             let e = await ndk?.fetchEvents(
                {
                    kinds: [30078],
                    // authors: [pub],
                    tags: [['d', 'magicCity']],
                })

            e = Array.from(e).sort((a,b) => b.created_at - a.created_at).find(e => e.tags.find(t => t.some(f => f === tezos)))

            if (e) {
                const signed = e.content
                const pk = e.tags[1][1]
                const npub = nip19.npubEncode(e.pubkey)
                const message = `\n\nLink Tezos:\n${pk}\n\nto Nostr:\n${npub}`
                setEvent(e)
                setVerified(await verify(pk, message, signed))
            }
        }
        ndk && tezos && !event && getNIP78()
     }, [ndk, tezos])    
     
   
    if (event && verified) return (
        <>
            <div>
                <Button to={`/messages/${event.pubkey}`}>
                    {/* <Primary> */}
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" strokeWidth="0" fill="currentColor"></path><path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" strokeWidth="0" fill="currentColor"></path></svg>
                    {/* </Primary> */}
                </Button>
            </div>
        </>
    )
}
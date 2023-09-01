import React, { useState, useEffect } from 'react'
import { walletPreview } from '../../utils/string'
import { nip04 } from 'nostr-tools'
import { getItem } from '../../utils/storage'

export const NostrDecrypt = ( {m} ) => {
    const { pub, priv } = getItem('nostr').keys
    const [decoded, setDecoded] = useState(null)
    let senderDecode = m.pubkey === pub 
    ? m.tags[0][1] : m.pubkey
    
    useEffect(() => {
      const decode = async() => {
            if (priv) {
                setDecoded(await nip04.decrypt(priv, senderDecode, m.content))
            } else {
                window.nostr && setDecoded(await window.nostr.nip04.decrypt(senderDecode, m.content))
            }
        }   
        decode() 
    }, [priv])


return (
          <div style={{paddingTop: '21px'}}>{walletPreview(senderDecode)}: {decoded} </div>
    )
}    
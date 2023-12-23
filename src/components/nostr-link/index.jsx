import React, { useContext, useEffect } from 'react'
import { Button, Purchase} from '../button'
import { useNostrContext } from '../../context/NostrContext'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { NDKEvent } from "@nostr-dev-kit/ndk"

export const NostrLink = ({ pubkey }) => {
    const { nostrAcc, ndk } = useNostrContext()
    const { acc, signMsg, subjktInfo} = useContext(HicetnuncContext)
    const message = `\n\nLink Tezos:\n${acc?.address}\n\nto Nostr:\n${nostrAcc?.npub}`

    const linkNostr = async() => {

            const signed = await signMsg(message)
            const e = new NDKEvent(ndk);
            e.kind = 30078;
            e.content = signed
            e.tags = [['d', 'magicCity'], ['tezos', acc.address], ['subjkt', subjktInfo.name]]
            signed && ndk.publish(e)
      } 
   
    return (
        <>
            {acc && nostrAcc
             && (!nostrAcc.tezos || nostrAcc.pubkey !== pubkey)
             && <Button onClick={async () => await linkNostr()}><Purchase>Link Nostr</Purchase></Button>}
        </>
    )
}
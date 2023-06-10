import { useEffect, useState, createContext, useContext, useRef} from "react"
import { getEventHash, getSignature } from "nostr-tools"
import { getItem, setItem, removeItem } from "../utils/storage"
import { NostrProvider } from "nostr-react"
import { useNostr, dateToUnix } from "nostr-react"

const NostrContext = createContext();

const relayUrls = [
    "wss://relay.magiccity.live"
  ];

  export const useNostrContext = () => {
    const nostr = useContext(NostrContext);
    if (!nostr) {
      throw new Error(
        `!mesh`
      );
    }
    return nostr;
  };
  

const NostrContextProvider = ({ children }) => {
    const [keys, setKeys] = useState(null)
    const [nostrSync, setNostrSync] = useState(false)
    const [nostrKeys, setNostrKeys] = useState(false)
    const { publish } = useNostr();
    const nip07 = 'nostr' in window

    useEffect(() => {
        setNostrSync(getItem('nostrSync'))
        const keys = getItem('nostr')?.keys
        if (keys) {
            setKeys(keys)
            setNostrKeys(true)
        }
    }, [])

    const onPost = async () => {    
        console.log('magicCity')
        let message= 'hicetnunc'
        let pub
        if (!keys && nip07) {
            try{
                pub = await window.nostr.getPublicKey()
                if (pub) {
                    setItem('nostr', {keys: {pub: pub}})
                    setItem('nostrSync', true)
                    setKeys({pub: pub})
                    setNostrSync(true)
                } 
            } catch (e) { return }
        }

        const event = {
        content: message,
        kind: 1,
        tags: [],
        created_at: dateToUnix(),
        pubkey: pub ? pub : keys.pub,
        };

        event.id = getEventHash(event);
        event.sig = (!pub && !nostrSync) ? getSignature(event, keys.priv) 
            : await window.nostr.signEvent(event)  
        publish(event);
    }

    const wrapped = {nostrKeys, nostrSync, nip07, onPost}

    return (
        <NostrContext.Provider value={wrapped}>
            <NostrProvider relayUrls={nostrKeys ? relayUrls : []} debug={true}>
               {children}
            </NostrProvider>   
        </NostrContext.Provider> 
      );
  };
  
  export default NostrContextProvider;
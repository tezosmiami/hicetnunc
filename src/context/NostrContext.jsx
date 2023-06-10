import { useEffect, useState, createContext, useContext, useRef} from "react"
import { getEventHash, getSignature } from "nostr-tools"
import { getItem, setItem, removeItem } from "../utils/storage"
import { NostrProvider } from "nostr-react"
import { useNostr, dateToUnix } from "nostr-react"

const NostrContext = createContext();

const relayUrls = [
    "wss://relay.magiccity.live"
  ];



const NostrContextProvider = ({ children }) => {
    const [keys, setKeys] = useState({})
    const [nostrSync, setNostrSync] = useState(null) 
    const { publish } = useNostr();
    const nip07 = 'nostr' in window

    useEffect(() => {
        setNostrSync(getItem('nostSync'))
        setKeys(getItem(nostr)?.keys)
    }, [])
    
    const onPost = async () => {
        
        message= 'hicetnunc' 

        const event = {
        content: message,
        kind: 1,
        tags: [],
        created_at: dateToUnix(),
        pubkey: keys.pub,
        };
    
        event.id = getEventHash(event);
        event.sig = GetSignature(event, key.priv);    
        publish(event);
    }

    const wrapped = {}
    return (
        <NostrContext.Provider value={wrapped}>
            <NostrProvider relayUrls={relayUrls} debug={true}>
               {children}
            </NostrProvider>   
        </NostrContext.Provider> 
      );
  };
  
  export default NostrContextProvider;
import { useEffect, useState, createContext, useContext } from "react"
import { getEventHash, getSignature } from "nostr-tools"
import { getItem, setItem } from "../utils/storage"
import { useNostr, dateToUnix } from "nostr-react"

const NostrContext = createContext();

// const relayUrls = [
//     "wss://relay.magiccity.live",
//   ];

  export const useNostrContext = () => {
    const nostr = useContext(NostrContext);
    if (!nostr) {
      throw new Error(
        `!mesh`
      );
    }
    return nostr;
  };

//   const nostrUrl = async (file) => {
//     console.log('here')
//     const formData = new FormData();
//     formData.append('fileToUpload', file);
//     try { 
//         const response = await fetch('https://nostr.build/api/upload/iris.php', {
//         method: 'POST',
//         body: formData,
//       })
//         const url = await response.json();
//           console.log( url);
//      } catch (e) { 
//         console.log(e)
//         return null
//         };
//     }


const NostrContextProvider = ({ children }) => {
    const [keys, setKeys] = useState(null)
    const [nostrSync, setNostrSync] = useState(false)
    const [nostrKeys, setNostrKeys] = useState(false)
    const nip07 = 'nostr' in window
    const { publish } = useNostr()

    useEffect(() => {
        setNostrSync(getItem('nostrSync'))
        const keys = getItem('nostr')?.keys
        if (keys) {
            setKeys(keys)
            setNostrKeys(true)
        }
    }, [])

    const objktPost = async ({ objkt }) => {    
        console.log('magicCity')
        const { id, creator, title, description, artifact_uri } = objkt
        const message = 'https://nostr.build/i/1a8540071abd4614733e30b25de8a9ae8cf9a0832108a1cc0fecc646c78c8dc0.jpg'
    //     const response = await fetch('https://ipfs.io/ipfs/' + artifact_uri.split('//')[1])
    //     const data = await response.blob()
    //     console.log('d',data)
    //    console.log(data?.type.split('/')[1])
    //     let file = new File([data], `.${data.type.split('/')[1]}`)
    //     const post = await nostrUrl(file)
    //     console.log(post)
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
        event.id = getEventHash(event)
        event.sig = (!pub && !nostrSync) ? getSignature(event, keys.priv) 
            : await window.nostr.signEvent(event)
        publish(event)
    }

    const wrapped = {nostrKeys, nostrSync, nip07, objktPost}

    return (
        <NostrContext.Provider value={wrapped}>
            {/* <NostrProvider relayUrls={nostrKeys ? relayUrls : []} debug={true}> */}
               {children}
            {/* </NostrProvider>    */}
        </NostrContext.Provider> 
      );
  };
  
  export default NostrContextProvider;
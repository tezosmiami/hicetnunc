import { useEffect, useState, createContext, useContext } from "react"
import NDK, { NDKPrivateKeySigner, NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk"
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie"
import { HicetnuncContext } from './HicetnuncContext'
import { getItem } from "../utils/storage"
import { walletPreview } from '../utils/string'  
import _ from 'lodash'

const NostrContext = createContext();

const relays = [
    'wss://relay.magiccity.live',
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social'
  ];


  export const useNostrContext = () => {
    const nostr = useContext(NostrContext);
    if (!nostr) {
      throw new Error(
        `!nostr`
      );
    }
    return nostr;
  };

  
const NostrContextProvider = ({ children }) => {
    // const [keys, setKeys] = useState(null)
    const { acc, verify, subjktInfo } = useContext(HicetnuncContext)
    // const { pub }= getItem('nostr') ? getItem('nostr')?.keys : {priv: null, pub: null}
    const [pub, setPub] = useState(getItem('nostr') ? getItem('nostr')?.keys.pub : null)
    const [nostrSync, setNostrSync] = useState(false)
    const [nostrKeys, setNostrKeys] = useState(false)
    const [events, setEvents] = useState([])
    const [messages, setMessages] = useState(new Map())
    const [loading, setLoading] = useState(true)
    const [counter, setCounter] = useState(0)
    const [quantity, setQuantity] = useState(0)
    const [subs, setSubs] = useState(null)
    const [ndk, setNdk] = useState(null)
    const [nostrAcc, setNostrAcc] = useState(null)  

    // const nip07 = 'nostr' in window

    const sent = { 
        kinds: [4],
        authors:  [pub],
    }

    const received = {  
        kinds: [4],
        "#p": [pub],               
    }

    useEffect(() => {
        const init = async() => {
            setLoading(true)
                setNostrKeys(true)
                const keys = getItem('nostr')?.keys || null
                const signer =  keys.priv ? new NDKPrivateKeySigner(keys.priv) : new NDKNip07Signer()
                setNdk(new NDK({
                    explicitRelayUrls: relays,
                    cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'nostr' }),
                    signer: signer,
                    // autoConnectUserRelays: false
                }))
        }
        setNostrSync(getItem('nostrSync'))
        pub && init()
        if (!pub) {
            setMessages(new Map())
            setNdk(null)
            setNostrAcc(null)
            setCounter(0)
            setQuantity(0)
            setLoading(false)
        }
    }, [pub])

    useEffect(() => {
        window.addEventListener('storage', () => {
          const n = getItem('nostr')
          setPub(n?.keys.pub || null)
        })
      }, []);
    
    useEffect(() => {
       (counter > 0 && counter === quantity)  && setLoading(false)
    }, [counter, quantity])

    useEffect(() => {
        const finish = async () => {
            await ndk.connect()
            let profile = await getProfile(pub)  
            profile.alias = subjktInfo.name || acc.address
            setNostrAcc(profile)
        }   
        !nostrAcc && ndk  && acc && finish()
        nostrAcc && getEvents() && subEvents()
    }, [ndk,acc, nostrAcc])


    // const decryptEvents = async (events) => {
    //     const e = await events.map(async (e)=>{return await {...e, decoded:  await parseEvent(e)}})
    //     return (e)
    // }

    const decryptMsg = async (msg, pub) => {
        const sender = await ndk.getUser({ hexpubkey: pub })
        const decoded = await ndk.signer.decrypt(sender, msg)
      return decoded  
    }

    const groupBy = (arr) => {
        return arr.reduce((acc, cur) => {
            let property = cur.pubkey === pub ? 'tags' : 'pubkey'
            acc[property === 'tags' ? cur[property][0][1] : cur[property]] = [...acc[property === 'tags' ? cur[property][0][1] : cur[property]] || [], cur];
            return acc;
        }, {});
    }   

    const getProfile = async (pubkey, alias) => {
        if (pubkey === pub && nostrAcc?.alias) return !alias ? nostrAcc : nostrAcc.alias
        let who = await ndk.getUser({hexpubkey: pubkey})
       
        const nip78s =  await ndk.fetchEvents(
            {
                kinds: [30078],
                authors: [pubkey],
                tags: [["d", "magicCity.live"]],
            },
            undefined,
            {relays: [{ url: 'wss://relay.magiccity.live'}], ndk })
            await who.fetchProfile()
        const e = Array.from(nip78s).sort((a,b) => b.created_at - a.created_at).find(e => e.tags.find(t => t.some(f => f === acc?.address)))

        if (e) {
            const signed = e.content
            const pk = e.tags[1][1]
            const message = `\n\nLink Tezos:\n${pk}\n\nto Nostr:\n${who.npub}`
            const verified = await verify(pk, message, signed)

            if (verified) {
                who.tezos = pk
                who.subjkt = e.tags[2][1]
            }
        }
        who.alias = who.subjkt || walletPreview(who.tezos)
        || (who.profile.displayName && `${who.profile.displayName}-nostr`)
        || (who.profile.name && `${who.profile.name}-nostr`)
        || walletPreview(pubkey) || ''
        return !alias ? who : who.alias
    }  

    const parseEvent = async (event) => {
        const isLocal = pub === event.pubkey
        const withWhom = isLocal ? event.tags[0][1] : event.pubkey
        const value = messages.get(withWhom)

        const alias = value ? value.alias : await getProfile(withWhom, true) 
        const old = value ? value.messages : []
        const m = {who: isLocal ? nostrAcc.alias : alias, what: event.content, when: event.created_at, decoded: false, id: event.id}
        const newMsgs =  messages.set(withWhom, {messages: [...old, m], alias})
        setCounter(counter => counter+1)
        setMessages(new Map(newMsgs))
    }

    const handleEvent = async (event) => {
        let e = event
        // event.decoded = await decryptMsg(event.content, event.pubkey !== pub ? event.pubkey : event.tags[0][1]) || null
        // check for double on self
        const msgs = e.pubkey === pub && e.tags[0][1] == pub ? messages.get(pub)?.messages : []
        const isDup = msgs[msgs.length - 1]?.id === e.id || false
        if (!isDup) {
            setQuantity(q => q+1)
            parseEvent(event)   
        }
    }

    const getEvents = async () => {
        const s = await ndk.fetchEvents(sent)
        const r = await ndk.fetchEvents(received)
        const t = _.uniqWith([...s,...r], (a, b) => a.id === b.id)
        setQuantity(t.length || 0)
        let grouped = groupBy(t)
        await Promise.all(Object.entries(grouped).map(async(k) =>{await parseEvent(k[1][0]); grouped[k[0]].shift()} ))   
        grouped = Object.values(grouped).flat(1)
        grouped.map(async(g)=> {
            await parseEvent(g)
        })
      }
      //check subs
      const subEvents = async () => {
        const subSent = await ndk.subscribe({...sent, since: Math.floor(Date.now()/1000)}, { closeOnEose: false })
        const subRec = await ndk.subscribe({...received,since: Math.floor(Date.now()/1000)}, { closeOnEose: false })
        subSent.on("event", (event) => { handleEvent(event) })
        subRec.on("event", (event) => { handleEvent(event) })
        // setSubs([subSent, subRec])
      }

      const sendMessage = async(recepient, message) => {

        const who = ndk.getUser({hexpubkey: recepient})
        const encrypted = await ndk.signer.encrypt(who, message) 
        const event = new NDKEvent(ndk);
        event.kind = 4;
        event.tags = [['p', recepient]]
        event.content = encrypted;
         await ndk.publish(event)
      }

       const sendEvent = async(kind, tags) => {
        const event = new NDKEvent(ndk);
        event.kind = kind;
        event.tags = tags
        ndk.publish(event)
      }

    const wrapped = {nostrAcc, ndk, pub, nostrKeys, nostrSync, messages, loading, counter, quantity, setPub, setMessages, decryptMsg, sendMessage, sendEvent }
  
    return (
        <NostrContext.Provider value={wrapped}>
               {children}
        </NostrContext.Provider> 
      );
  };
  
  export default NostrContextProvider;
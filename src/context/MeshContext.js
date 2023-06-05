import { useEffect, useState, createContext, useContext, useRef} from "react";
import { fetchGraphQL, getNameForAddress } from '../data/hicdex'
import { getItem, setItem } from '../utils/storage'
import { HicetnuncContext } from './HicetnuncContext'
import { Peer } from "peerjs"

const axios= require('axios')
const MeshContext = createContext();

export const useMeshContext = () => {
    const mesh = useContext(MeshContext);
    if (!mesh) {
      throw new Error(
        `!mesh`
      );
    }
    return mesh;
  };
  
const MeshContextProvider = ({ children }) => {
    const [mesh, setMesh] = useState('')
    const [meshed, setMeshed] = useState(getItem('syncmesh') || false)
    const [alias, setAlias] = useState()
    const [media, setMedia] = useState([])
    const [dimension, setDimension] = useState('hicetnunc')
    const [lobby, setLobby] = useState([])
    const [session, setSession] = useState([])
    const [sessionTz, setSessionTz] = useState(null)
    const [online, setOnline] = useState([])
    const [calls, setCalls] = useState([])
    const [tabFocus, setTabFocus] = useState(true);
    const { acc } = useContext(HicetnuncContext)
    const peer = useRef(null);
    
    const onDimension = (id, _dimension) => {
          setOnline(online => online.map(o=> o.id === id ?
          {...o, dimension: _dimension}
          : o))
        }
      
    const onClose = (conn) => {
        setOnline(online => online.filter(i => i.id !== conn.peer))
        console.log('closed connection with', conn.peer)
      }
    
    const onStream = ({s,a,t}) => {
        setMedia(media => a !== alias ? [...media, {stream: s,alias: a, type: t}]
            : [{stream: s,alias: a, type: t}, ...media])
      }

    const onIncoming = () => {
        online.filter(i=>i.alias !== alias).map((o) => {
                o.conn.off('data')
                o.conn.on('data', async (data) => {
                    if (data.type === 'new') {setOnline(online => !online.find(o => o.id === data.id) 
                        ? [{
                            alias: data.alias,
                            address: data.address,
                            id: o.conn.peer,
                            dimension: data.dimension,
                            conn:o.conn},
                             ...online
                        ]
                        : online)
                    }
                    if (data.type === 'dimension') {setOnline(online => online.map(o=> o.id === data.id ? {...o, dimension: data.dimension} : o))} 
                    if (data.invite || data.message) {
                        data.dimension === 'lobby' && setLobby((messages) => [...messages, data])
                        const favicon = document.getElementById("favicon")
                        favicon.href = '/message.ico'
                    }
                    if (data.session && data.alias === dimension) {
                        setSession(data.session)
                        setSessionTz(data.address)
                    }
                })
            })

        peer.current.off('connection')
        peer.current.on("connection", (conn) => {
            conn.on('open', () => {
            console.log('connected with', conn.peer)
            conn.metadata.alias === dimension && setSessionTz(conn.metadata.address)
            conn.send({
                type: 'new',
                alias: alias,
                address: acc.address,
                dimension: dimension,
                id: peer.current.id,
                lobby: lobby, 
                session: (alias === dimension && conn.metadata.dimension === alias)
                    ? session : null })
            !online.find(o => o.id === conn.peer)
                && setOnline(online => [{
                    alias: conn.metadata.alias,
                    address: conn.metadata.address,
                    id: conn.peer,
                    dimension: conn.metadata.dimension,
                    conn: conn}, ...online ])

            conn.on('data', async (data) => {
                if (data.type === 'new') {
                    setOnline(online => !online.find(o => o.id === data.id)
                    ? [{
                        alias: data.alias, 
                        address: data.address,
                        id: conn.peer, 
                        dimension: data.dimension, 
                        conn:conn},
                         ...online
                    ]
                    : online)
                    data.lobby && setLobby(data.lobby)
                    }
                if (data.type === 'dimension') onDimension(data.id, data.dimension)
                    if (alias === dimension && dimension === data.dimension && session.length >= 0)
                     conn.send({
                        type: 'session',
                        alias: alias,
                        address: acc.address,
                        id: peer.current.id,
                        dimension: dimension,
                        session: session})

                if (data.session && data.alias === dimension) {
                    setSession(data.session)
                    setSessionTz(data.address)
                }
                if (data.invite || data.message) {
                    data.dimension === 'lobby' && setLobby((messages) => [...messages, data])
                    const favicon = document.getElementById("favicon")
                    favicon.href = '/message.ico'
                }
            })
            conn.on('error', (e) => {
                console.log('error: ', e)
            })
            conn.on('close', () => {
                console.log('closing')
                onClose(conn)
            })
            conn.peerConnection.oniceconnectionstatechange = () => {
                if (conn.peerConnection.iceConnectionState === 'disconnected') {
                    console.log('closing')
                onClose(conn)
                }
            }
            }) 
        })
    }

    useEffect(() => {
    const updateAlias = async () => {
        acc && fetchGraphQL(getNameForAddress, 'GetNameForAddress', {
            address: acc.address,
            }).then(({ data, errors }) => {
            if (data) {
                const holder = data.hic_et_nunc_holder[0]?.name || acc.address
                setAlias(holder)
            }
            if (errors) {
                console.error(errors)
            }
            })
        }
    updateAlias()
    }, [acc])

    useEffect(() => {
        online.map(o => {
            o.conn && o.conn.send({
                type: 'dimension',
                alias: alias,
                address: acc.address,
                dimension: dimension,
                id: peer.current.id,
                lobby: lobby,
                session: (alias === dimension && o.conn.metadata.dimension === alias)
                    ? session : null
            })
        })
        setOnline(online => online.map(o=> (o.id === peer.current.id) ? {...o, dimension: dimension}
          : o
         ))
        if (dimension === 'hicetnunc' || dimension === 'lobby') {
            media?.forEach(m => m.stream.getTracks()[0].stop())  
            setMedia([])
            calls.map(c => c.close())
             setCalls([])
           }
        if (dimension === 'hicetnunc' && peer.current) onIncoming()         
    }, [dimension])


    useEffect(() => {
        const onFocus = () => {
          const favicon = document.getElementById("favicon")
          favicon.href = '/favicon.ico'
          setTabFocus(true);
        };
    
        const onBlur = () => {
          setTabFocus(false);
        };
    
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
    
        return () => {
          window.removeEventListener('focus', onFocus)
          window.removeEventListener('blur', onBlur)  
        };
      }, []);
 
    useEffect(() => {
        const syncMesh = async () => {
        if (alias && meshed) {
            !getItem('syncmesh') && setItem('syncmesh', true)
            peer.current = new Peer(
            {
                host: 'hen-chat.herokuapp.com',
                secure: true,
                debug: 0,
                path: "/hicetnunc",
                config: {'iceServers': [
                {
                    urls: "stun:openrelay.metered.ca:80",
                },
                {
                    urls: "turn:openrelay.metered.ca:80",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
                {
                    urls: "turn:openrelay.metered.ca:443",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
                {
                    urls: "turn:openrelay.metered.ca:443?transport=tcp",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
                ]} 
            })
            peer.current.on('open', (id) =>{
                console.log('id: ', id)
                setOnline([{alias: alias, id: id, dimension: dimension}])
            })
            onIncoming()
            setTimeout(async () => {
                let peers = await axios.get(process.env.REACT_APP_MESH_SIGNAL).then(res => res.data)
                peers && peers.map((p) => {
                    setTimeout(() => {
                        var conn = peer.current.connect(p, {
                            metadata: { 'alias': alias, 'address': acc.address, 'dimension': dimension }
                        })
                        conn && conn.on('open',  () => {
                            conn.on('data', async (data) => {
                            if (data.type === 'new') {
                                setOnline(online => !online.find(o => o.id === data.id) ?
                                [{alias:data.alias, id: conn.peer, dimension: data.dimension, conn:conn}, ...online]
                                : online)
                                data.lobby && setLobby(data.lobby)
                                data.session && setSessionTz(data.address)
                            } 

                            if (data.type === 'dimension') {setOnline(online => online.map(o=> o.id === data.id ?
                                {...o, dimension: data.dimension}
                                : o))} 

                            if (data.session && data.alias === dimension) {
                                setSession(data.session)
                                setSessionTz(data.address)
                            }

                            if (data.invite || data.message) {
                                const favicon = document.getElementById("favicon")
                                favicon.href = '/message.ico'
                                }
                            })
                            conn.on('error', (e) => {
                            console.log('error: ', e)
                            })
                            conn.on('close', () => {
                            onClose(conn)
                            console.log('closing')
                            })
                            conn.peerConnection.oniceconnectionstatechange = () => {
                            if(conn.peerConnection.iceConnectionState === 'disconnected') {
                                onClose(conn)
                                console.log('closing')
                            }
                        }
                    }, 1000)
                    })
                })
            }, 1000); 

            return () => {
                console.log("cleaning up...");
                peer.current.destroy();
                }
            }  
        }
        syncMesh()
    }, [alias,meshed]);

    const wrapped = {...mesh, peer, alias, meshed, setMeshed, media, setMedia, dimension, setDimension, lobby, setLobby, session, setSession, sessionTz, setSessionTz, online, setOnline, calls, setCalls, onIncoming, onClose, onStream, onDimension}

    return (
      <MeshContext.Provider value={wrapped}>
             {children}
      </MeshContext.Provider>
    
    );
};

export default MeshContextProvider;
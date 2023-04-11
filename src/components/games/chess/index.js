import React, { useState, useEffect } from "react"
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import styles from './styles.module.scss'
import { getItem } from '../../../utils/storage'
import { useMeshContext } from '../../../context/MeshContext'

const sf = new Worker('/stockfish/stockfish.js'); 

export const Ch3ss = ({pvp, setPvp, move, setMove, side, setSide, playing, setPlaying, invites}) => {
    const [chess, setChess] = useState(new Chess())
    const [level, setLevel] = useState(9)
    const [turn, setTurn] = useState('white')
    const [neon, setNeon] = useState(getItem('neonstyle'))
    const [loading, setLoading] = useState(true)
    const { dimension, setDimension, peer,  alias, meshed, online  } = useMeshContext();

    useEffect(() => {
        setLoading(false)
        return () =>  {
        // sf.terminate()
        setDimension('hicetnunc')
        }
    }, [])

    useEffect(()=> {
        pvp && setChess(new Chess)
        !pvp && turn === 'black' && ai(chess.fen())
    },[pvp])



    useEffect(() => {
        if (!pvp) {
            sf.onmessage = function(event) {
                let message = event.data ? event.data : event;
                const bestMove = message.match(/^bestmove\s([a-h][1-8])([a-h][1-8])/)
                if (bestMove) {
                    bestMove.shift()
                    setMove(bestMove)
                }
            }
            turn === (side === 'black' ? 'white' : 'black') && ai(chess.fen())
        }
    }, [turn, pvp])

     useEffect(() => {
            if (turn !== side && move?.length > 1) {
            chess.move({
                    from: move[0],
                    to: move[1],
                    promotion: "q",
                });   
            setMove('')
            setTurn(side === 'black' ? 'black' : 'white')
            }
    }, [move])
   

    useEffect(() => {
        window.addEventListener("neon", () => setNeon(getItem('neonstyle')))
        return () => {
            window.removeEventListener("neon", () => setNeon(getItem('neonstyle')))
        }
    }, [])

    const onDrop = async (source, target) => { 
        const localMove = chess.move({
            from: source,
            to: target,
            promotion: "q", 
        });
        if (localMove === null) return false
        pvp && pvp.conn.send({
            type: 'move',
            alias: alias,
            move: [source, target],
            dimension: dimension,
            id: peer.current.id,
        })
        setTurn(side === 'black' ? 'white' : 'black')
        return true;
    }
    
    const ai = (fen) => {
        sf.postMessage(`position fen ${fen}`)
        sf.postMessage(`go depth ${level}`)
    }
    
    const reset = () => {
        if (pvp) {
            setSide('black' ? 'white' : 'black')
            
            pvp.conn.send({
                action: 'again',
                alias: alias,
                dimension: dimension,
                id: peer.current.id,
            })
        } else  setChess(new Chess())    
        setTurn('white')
    }
    const leave = () => {
        pvp?.conn.send({
            action: 'forfit',
            alias: alias,
            dimension: dimension,
            id: peer.current.id
        })
        setPlaying(p => p.filter(f=> f !== alias))
        online.forEach(o => o.dimension === 'chess'
            && o.alias !== alias 
            && o.conn?.send({ action: 'playing',
                              alias: alias,
                              id: peer.current.id,
                              dimension: dimension,
                            })
                )  
        setTurn('white')
        setSide('white')
        setPvp(null)
        setChess(new Chess())
        
    }

    // const undo  = () => {
    //     chess.undo()
    //     setTurn(chess.turn() === 'b' ? 'black' : 'white')
    // }

    return (
        <>
         {/* <div style={{whiteSpace: 'pre-wrap',}}> {chess.ascii()}</div></> */}
            <div className={neon ? styles.board : `${styles.board} ${styles.border}`}>
                <Chessboard
                    id="hicetnunc"
                    position={chess.fen()}
                    onPieceDrop={onDrop}
                    customDarkSquareStyle={{ backgroundColor: "var(--text-color)" }}
                    customLightSquareStyle={{ backgroundColor: "var(--background-color)" }}
                    customBoardStyle={{
                        boxShadow: '0 0 2px var(--text-color)',
                    }}
                    boardOrientation={side}
                />
                    <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                        {(!meshed || !pvp) && !loading
                         && <button className={styles.button} onClick={reset}>reset</button>}
                        {/* <button className={styles.chessbutton} onClick={undo} >Undo</button> */}
                        {meshed && pvp && <button className={styles.button} onClick={leave}>leave</button>}
                        {meshed && pvp && chess.isGameOver()
                         && <button className={styles.button} onClick={reset}>again?</button>}
                    </div>
            </div>
        </>
    )
}
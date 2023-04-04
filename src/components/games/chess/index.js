import React, { useState, useEffect } from "react"
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import styles from './styles.module.scss'
import { getItem } from '../../../utils/storage'


const sf = new Worker('/stockfish/stockfish.js'); 

export const Ch3ss = () => {
    const [chess, setChess] = useState(new Chess())
    const [level, setLevel] = useState(9)
    const [black, setBlack] = useState()
    const [white, setWhite] = useState()
    const [turn, setTurn] = useState('white')
    const [neon, setNeon] = useState(getItem('neonstyle'))

    const onDrop = async (source, target) => { 
        const move = chess.move({
            from: source,
            to: target,
            promotion: "q", 
        });
        if (move === null) return false
        setTurn('black')
        return true;
    }
    
    useEffect(() => {
        return () =>  {
        sf.terminate()}
    }, [])

    useEffect(() => {
        sf.onmessage = function(event) {
            let message = event.data ? event.data : event;
            const move = message.match(/^bestmove\s([a-h][1-8])([a-h][1-8])/)
            if (move) {
                setBlack(move)
            }
        }
        turn === 'black' && ai(chess.fen())
    }, [turn])

     useEffect(() => {
        if (turn === 'black' && black?.length > 1) {
         chess.move({
                from: black[1],
                to: black[2],
                promotion: "q", // always promote to a queen for example simplicity
            });
        setBlack('')
        setTurn('white')
        }
    }, [black])

    useEffect(() => {
        const update = (e) => {
            setNeon(getItem('neonstyle'))
        }
        window.addEventListener("neon", update);
        return () => {
            window.removeEventListener("neon", update);
        };
    }, [])
    
    
    const ai = (fen) => {
        sf.postMessage(`position fen ${fen}`)
        sf.postMessage(`go depth ${level}`)
    }
    
    const reset = () => {
        setChess(new Chess())
        setTurn()
    }

    // const undo  = () => {
    //     chess.undo()
    //     console.log(chess)
    //     setTurn(chess.turn() === 'b' ? 'black' : 'white')
    // }

    return (
        // <div style={{whiteSpace: 'pre-wrap',}}> {chess.ascii()}</div></>
        <>
        <div className={neon ? styles.board : `${styles.board} ${styles.border}`}>
            <Chessboard
                id="hicetnunc"
                position={chess.fen()}
                onPieceDrop={onDrop}
                customDarkSquareStyle={{ backgroundColor: "var(--text-color)" }}
                customLightSquareStyle={{ backgroundColor: "var(--background-color)" }}
                customBoardStyle={{
                    boxShadow: '0 0 1px var(--text-color)',
                  }}
            />
            <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                <button className={styles.button} onClick={reset}>reset</button>
            {/* <button className={styles.chessbutton} onClick={undo} >Undo</button> */}
            </div>
        </div>
        </>
    )
}
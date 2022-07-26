import React, { useContext, useState, useEffect} from 'react'
import { Container, Padding } from '../../../components/layout'
import { Primary } from '../../../components/button'
import { HicetnuncContext } from '../../../context/HicetnuncContext'
import { walletPreview } from '../../../utils/string'
import styles from '../styles.module.scss'

const queryTransfers = `
    query transfers($id: String!) {
    events(where: {token: {platform: {_eq: "HEN"}}, token_id: {_eq: $id}, type: {_eq: "FA2_TRANSFER"}, from_address: {_ilike: "tz%"}, to_address: {_ilike: "tz%"}}, order_by: {opid: desc}) {
    type
    timestamp
    amount
    from_address
    to_address
  }
}
`
const querySubjkt = `
query subjkt($from_address: String!, $to_address: String!) {
  from: hic_et_nunc_holder(where: {address: {_eq: $from_address}}) {
    name
  }

  to: hic_et_nunc_holder(where: {address: {_eq: $to_address}}) {
    name
  }
}
`

async function fetchGraphQL(operationsDoc, operationName, variables) {
    const result = await fetch(
      operationName == 'transfers' ? process.env.REACT_APP_TEZTOK_API
       : process.env.REACT_APP_GRAPHQL_API,
      {
        method: "POST",
        body: JSON.stringify({
          query: operationsDoc,
          variables: variables,
          operationName: operationName
        })
      }
    );
    return await result.json()
    }
async function fetchTransfers(id) {
        const { errors, data } = await fetchGraphQL(queryTransfers, 'transfers', { id: id })  
        if (errors) {
          console.error(errors)
        }
        return data

      }
async function fetchSubjkt(from_address, to_address) {
    const { errors, data } = await fetchGraphQL(querySubjkt, 'subjkt', { from_address: from_address, to_address: to_address })    
        if (errors) {
          console.error(errors)
        }
        return data

      }     

export const History = (token_info) => {
    const [history, setHistory] = useState([])

    useEffect(() => {
        const getTransfers = async() => {
        let data = await fetchTransfers(`${token_info.id}`)  
        let transfers = await Promise.all(data.events.map(async e => {
          let subjkt = await fetchSubjkt(e.from_address, e.to_address)
          e.from_subjkt = subjkt.from[0]?.name
          e.to_subjkt = subjkt.to[0]?.name
          return e
        }))
        let trades = token_info.trades.map(e => {
            e.trade = true
            return e
        })
        let swaps = token_info.swaps.map(e => {
            e.trade = false
            return e
        })
        setHistory([...trades, ...swaps, ...transfers].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)).reverse())
      }
        token_info && getTransfers()
        }, [])

    
    return (
        <div>
            <Container>
                <Padding>
                    {
                        history.map(e => {
                            if (e.trade) {
                                return (
                                    <div className={styles.history}>
                                        trade {e.timestamp} { encodeURI(e.seller.name) ? <span><a href={`/tz/${encodeURI(e.seller.address)}`}> <Primary>&nbsp;{encodeURI(e.seller.name)}</Primary></a></span> : <span><a href={`/tz/${e.seller.address}`}><Primary>&nbsp;{walletPreview(e.seller.address)}</Primary></a></span>}&nbsp;{e.amount} ed. {parseFloat(e.swap.price / 1000000)} tez{e.buyer.name ? <span><a href={`/${encodeURI(e.buyer.name)}`}><Primary>&nbsp;{encodeURI(e.buyer.name)}</Primary></a></span> : <span><a href={`/tz/${e.buyer.address}`}><Primary>&nbsp;{walletPreview(e.buyer.address)}</Primary></a></span>}
                                    </div>
                                )
                            }
                            if (e.to_address == 'tz1burnburnburnburnburnburnburjAYjjX') {
                                return(
                                    <div className={styles.history}>
                                    burn {e.timestamp} { encodeURI(e.from_subjkt) ? <span><a href={`/tz/${encodeURI(e.from_address)}`}> <Primary>&nbsp;{encodeURI(e.from_subjkt)}</Primary></a></span> : <span><a href={`/tz/${e.from_address}`}><Primary>&nbsp;{walletPreview(e.from_address)}</Primary></a></span>}&nbsp;{e.amount} ed.
                                    </div>
                                )
                            }
                            if (e.type) {
                                return(
                                    <div className={styles.history}>
                                    transfer {e.timestamp} { encodeURI(e.from_subjkt) ? <span><a href={`/tz/${encodeURI(e.from_address)}`}> <Primary>&nbsp;{encodeURI(e.from_subjkt)}</Primary></a></span> : <span><a href={`/tz/${e.from_address}`}><Primary>&nbsp;{walletPreview(e.from_address)}</Primary></a></span>}&nbsp;{e.amount} ed.{e.to_subjkt ? <span><a href={`/${encodeURI(e.to_subjkt)}`}><Primary>&nbsp;{encodeURI(e.to_subjkt)}</Primary></a></span> : <span><a href={`/tz/${e.to_address}`}><Primary>&nbsp;{walletPreview(e.to_address)}</Primary></a></span>}
                                    </div>
                                )
                            }
                             else {
                                return (
                                    <div className={styles.history}>
                                        swap {e.timestamp} {e.creator.name ? <span><a href={`/tz/${e.creator.address}`}><Primary>&nbsp;{encodeURI(e.creator.name)}&nbsp;</Primary></a></span> : <span><a href={`/tz/${e.creator.address}`}><Primary>&nbsp;{walletPreview(e.creator.address)}</Primary></a></span>} {e.amount} ed. {parseFloat(e.price / 1000000)} tez
                                    </div>
                                )
                            }
                        })
                    }
                    minted {token_info.timestamp} {token_info.supply} ed. {token_info.royalties / 10}% royalties
                </Padding>
            </Container>
        </div>
    )
}
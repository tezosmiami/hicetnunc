
import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'

const getBidou = `
query bidouById ($id: String!) {
  tokens(where: {fa2_address: {_eq: "KT1MxDwChiDwd6WBVs24g1NjERUoK622ZEFp"}, token_id: {_eq: $id}}) {
    eightbid_creator_name
    eightbid_rgb
    token_id
  }
}
`

const getBidouCount = `
query bidouCount {
  tokens_aggregate(where: {fa2_address: {_eq: "KT1MxDwChiDwd6WBVs24g1NjERUoK622ZEFp"}}) {
    aggregate {
      count
    }
  }
}
`

export async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    import.meta.env.VITE_TEZTOK_API,
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


export async function fetchBidouCount() {
  const { errors, data } = await fetchGraphQL(getBidouCount, 'bidouCount', null)
  
  if (errors) {
    console.error(errors)
  }
  return data.tokens_aggregate.aggregate.count
}

export async function fetchRandomBidou(id) {
  
  const { errors, data } = await fetchGraphQL(getBidou, 'bidouById', { id: id })

  if (errors) {
    console.error(errors)
  }

  return data.tokens[0]
}


export const Bidou = () => {
 
  const [bidouRGB,setBidouRGB] = useState([])
  const [bidou, setBidou] = useState()

  function sliceChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

useEffect(() => {
  const fetchData = async() => {
    let total = await fetchBidouCount();
    let random = Math.floor(Math.random() * total);
    let bidou = await fetchRandomBidou(`${random}`)
    setBidou(bidou)
    setBidouRGB(sliceChunks(bidou.eightbid_rgb,6));
  }
  fetchData()
}, [])

  return (
    <div className={styles.canvas}>
       <a href={`https://www.8bidou.com/listing/?id=${bidou?.token_id}`} target="blank"  rel="noopener noreferrer">
           <div className={styles.row}>
             {bidouRGB.map((c,i) => {
               return (
                 <div
                    key={`${c}-${i}`}
                    style={{backgroundColor: `#${c}`, width: '.5em', height: '.5em', margin: '0' }}
                 />
              )})}
           </div>
       </a>
    </div>
  )
}

export default Bidou;
    
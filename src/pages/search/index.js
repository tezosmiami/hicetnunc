import React, { Component } from 'react'
import { Page, Container, Padding } from '../../components/layout'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { getWalletAllowList } from '../../constants'
import { Friends } from '../friends'
import { Button, Primary } from '../../components/button'
import { Input } from '../../components/input'
import { FeedItem } from '../../components/feed-item'
import { getItem, setItem } from '../../utils/storage'
import { ObjktPost } from '../../components/objkt-post'
import { NeonSwitch } from '../../components/neon-switch'
import InfiniteScroll from 'react-infinite-scroll-component'
import './style.css'

const axios = require('axios')
const _ = require('lodash')

// const isFloat = (n) => Number(n) === n && n % 1 !== 0


async function fetchFeed(lastId, offset) {
  const { errors, data } = await fetchGraphQL(`
query LatestFeed {
  hic_et_nunc_token(order_by: {id: desc}, limit: 21,  offset: ${offset}, where: {id: {_lt: ${lastId}}, supply: {_neq: "0"}, artifact_uri: {_neq: ""}}) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    royalties
    thumbnail_uri
    timestamp
    title
    description
    token_signatures {
      holder_id
    }
    supply
    swaps(where: {contract_version: {_eq: "2"}})   {
      is_valid
      id
      price
      status
      contract_version
    }
    token_holders(where: {quantity: {_gt: "0"}}) {
      holder_id
      quantity
    }
    creator {
      is_split
      address
      name
      metadata_file
      shares {
        shareholder {
          holder_type
          holder_id
        }
      }
    }
  }
}`, "LatestFeed", {});
  if (errors) {
    console.error(errors);
  }
  const result = data.hic_et_nunc_token
  return result
}

// const query_creations = `
// query creatorGallery($address: String!) {
//   hic_et_nunc_token(where: {creator: {address: {_eq: $address}}, supply: {_gt: 0}}, order_by: {id: desc}, limit : 21, offset : $offset ) {
//     id
//     artifact_uri
//     display_uri
//     thumbnail_uri
//     timestamp
//     mime
//     title
//     description
//     supply
//     token_tags {
//       tag {
//         tag
//       }
//     }
//   }
// }
// `

// const query_tag = `
// query ObjktsByTag {
//   hic_et_nunc_token(where: {supply : {_neq: "0"}, token_tags: {tag: {tag: {_eq: $tag}}}, id: {_lt: $lastId}}, limit : 21, order_by: {id: desc}) {
//     id
//     artifact_uri
//     display_uri
//     mime
//     token_tags {
//       tag {
//         tag
//       }
//     }
//     creator {
//       address
//       name
//     }
//   }
// }`

// async function fetchID(id) {
//   const { errors, data } = await fetchGraphQL(`
//   query objktId {
//     hic_et_nunc_token(where : { id : { _eq : $id }}) {
//       id
//       artifact_uri
//       display_uri
//       mime
//       creator {
//         address
//         name
//       }
//     }
//   }
//   `, 'objktId', {
//     id: id
//   })

//   try {
//     return data.hic_et_nunc_token
//   } catch (e) {
//     return undefined
//   }
// }

async function fetchObjkts(ids) {
  const { errors, data } = await fetchGraphQL(`
    query Objkts($ids: [bigint!] = "") {
      hic_et_nunc_token(where: {id: {_in: $ids}, supply : {_neq: "0"}}) {
        artifact_uri
        display_uri
        creator_id
        id
        mime
        royalties
        thumbnail_uri
        timestamp
        title
        description
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}})   {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            shareholder {
              holder_type
              holder_id
            }
          }
        }
      }
    }
`, "Objkts", { "ids": ids });
  if (errors) {
    console.log(errors)
  }
  return data
}

async function getLastId() {
  const { errors, data } = await fetchGraphQL(`
    query LastId {
      hic_et_nunc_token(limit: 1, order_by: {id: desc}) {
        id
      }
    }`, "LastId");
    if (errors) {
      console.log(errors)
    }
  return data.hic_et_nunc_token[0].id
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function fetchGLB(offset) {
  const { errors, data } = await fetchGraphQL(`
  query GLBObjkts {
    hic_et_nunc_token(where : { mime : {_in : ["model/gltf-binary"] }, supply : {_neq: "0"}}, limit : 21, offset : ${offset}, order_by: {id: desc}) {
      id
      artifact_uri
      display_uri
      mime
      creator_id
      creator {
        address
        name
      }
    }
  }
  `, 'GLBObjkts', {}
  )
  if (errors) {
    console.log(errors)
  }
  try {
    return data.hic_et_nunc_token
  } catch (e) {
    return undefined
  }
}

async function fetchInteractive(offset) {
  const { errors, data } = await fetchGraphQL(`
    query InteractiveObjkts {
      hic_et_nunc_token(where: { mime: {_in : [ "application/x-directory", "image/svg+xml" ]}, supply : {_neq: "0"}}, limit : 30, offset : ${offset}, order_by: {id: desc}) {
        id
        artifact_uri
        display_uri
        mime
        creator_id
        creator {
          name
          address
        }
      }
    }
  `, 'InteractiveObjkts', {})
  if (errors) {
    console.log(errors)
  }
  try {
    return data.hic_et_nunc_token
  } catch (e) {
    return undefined
  }
}

async function fetchGifs(offset) {
  const { errors, data } = await fetchGraphQL(`
    query Gifs ($offset: Int = 0) {
      hic_et_nunc_token(where: { mime: {_in : [ "image/gif" ]}, supply : { _neq: "0"}}, order_by: {id: desc}, limit: 21, offset: ${offset}) {
        id
        artifact_uri
        display_uri
        mime
        creator_id
        creator {
          name
          address
        }
      }
    }
  `, 'Gifs', {})
  if (errors) {
    console.log(errors)
  }
  try {
    return data.hic_et_nunc_token
  } catch (e) {
    return undefined
  }
}

async function fetchMusic(offset) {
  const { errors, data } = await fetchGraphQL(`
  query AudioObjkts {
    hic_et_nunc_token(where: {mime: {_in: ["audio/ogg", "audio/wav", "audio/mpeg"]}, supply : {_neq: "0"}}, limit : 21, offset : ${offset}, order_by: {id: desc}) {
      artifact_uri
      display_uri
      creator_id
      id
      mime
      royalties
      thumbnail_uri
      timestamp
      title
      description
      token_signatures {
        holder_id
      }
      supply
      swaps(where: {contract_version: {_eq: "2"}})   {
        is_valid
        id
        price
        status
        contract_version
      }
      token_holders(where: {quantity: {_gt: "0"}}) {
        holder_id
        quantity
      }
      creator {
        is_split
        address
        name
        metadata_file
        shares {
          shareholder {
            holder_type
            holder_id
          }
        }
      }
    }
  }
  `, 'AudioObjkts', {}
  )
  if (errors) {
    console.log(errors)
  }
  try {
    return data.hic_et_nunc_token
  } catch (e) {
    return undefined
  }
}

// async function fetchTitle(title, offset) {
//   const { errors, data } = await fetchGraphQL(`
//   query queryTitles {
//     hic_et_nunc_token(where: {title: {_like: "%${title}%"}}) {
//       id
//       artifact_uri
//       display_uri
//       mime
//       creator {
//         address
//         name
//       }
//     }
//   }
//   `, 'queryTitles', {})

//   try {
//     return data.hic_et_nunc_token
//   } catch (e) {
//     return undefined
//   }
// }

// async function fetchCreations(addr, offset) {
//   const { errors, data } = await fetchGraphQL(`
// query creatorGallery {
//   hic_et_nunc_token(where: {creator: {address: {_eq: ${addr}}}, supply: {_gt: 0}}, order_by: {id: desc}, limit : 21, offset : ${offset} ) {
//     id
//     artifact_uri
//     display_uri
//     thumbnail_uri
//     timestamp
//     mime
//     title
//     description
//     supply
//     token_tags {
//       tag {
//         tag
//       }
//     }
//   }
// }
// `,
//     'creatorGallery',
//     {}
//   )
//   if (errors) {
//     console.error(errors)
//   }
//   const result = data.hic_et_nunc_token
//   return result
// }

// async function fetchDescription(description, offset) {
//   const { errors, data } = await fetchGraphQL(`
//   query queryDescriptions {
//     hic_et_nunc_token(where: {description: {_like: "%${description}%"}}) {
//       id
//       artifact_uri
//       display_uri
//       mime
//       creator {
//         address
//         name
//       }
//     }
//   }
//   `, 'queryDescriptions', {})

//   try {
//     return data.hic_et_nunc_token
//   } catch (e) {
//     return undefined
//   }
// }

async function fetchRandomObjkts(lastId) {
  const firstId = 196
  const uniqueIds = new Set()
  while (uniqueIds.size < 21) {
    uniqueIds.add(rnd(firstId, lastId))
  }
  let objkts = await fetchObjkts(Array.from(uniqueIds));
  return objkts.hic_et_nunc_token
}

async function fetchSwaps(offset) {
  const { errors, data } = await fetchGraphQL(`
  query querySwaps {
    hic_et_nunc_swap(where: {contract_version: {_eq: "2"}, token: {supply: {_neq: "0"}}}, order_by: {id: desc}, limit: 21,  offset : ${offset}) {
      id
      royalties
      creator_id
      token {
        id
        title
        mime
        metadata
        artifact_uri
        display_uri
        description
        royalties
        is_signed
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}}) {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            shareholder {
              holder_type
              holder_id
            }
          }
        }
      }
    } 
  }
  `, 'querySwaps', {})
  if (errors) {
    console.log(errors)
  }
  try {
    return data.hic_et_nunc_swap
  } catch (e) {
    return undefined
  }
}

async function fetchDay(day, offset) {
  const { errors, data } = await fetchGraphQL(`query dayTrades {
    hic_et_nunc_trade(where: {timestamp: {_gte: "${day}"}}, order_by: {swap: {price: desc}}, limit : 21, offset : ${offset}) {
      timestamp
      swap {
        price
      }
      token {
        artifact_uri
        display_uri
        id
        mime
        title
        description
        royalties
        supply
        is_signed
        token_signatures {
          holder_id
        }
        supply
        swaps(where: {contract_version: {_eq: "2"}}) {
          is_valid
          id
          price
          status
          contract_version
        }
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        creator {
          is_split
          address
          name
          metadata_file
          shares {
            shareholder {
              holder_type
            }
          }
        }
      }
    }
  }
`, 'dayTrades', {})

  if (errors) {
    console.log(errors)
  }

  let result = []

  try {
    result = data.hic_et_nunc_trade
  } catch (e) { }

  return result

}

async function fetchSales(offset) {
  const { errors, data } = await fetchGraphQL(`
  query sales {
    hic_et_nunc_trade(order_by: {timestamp: desc}, limit : 21, offset : ${offset}, where: {swap: {price: {_gte: "500000"}}}) {
      timestamp
      token {
        artifact_uri
        display_uri
        id
        mime
        title
        description
        is_signed
        supply
        royalties
        token_holders(where: {quantity: {_gt: "0"}}) {
          holder_id
          quantity
        }
        swaps {
          price
          status
          is_valid
          contract_version
        }
        creator_id
        creator {
          name
          address
          metadata_file
          shares {
            shareholder {
              holder_type
              holder_id
            }
          }
        }
        token_signatures {
          holder_id
        }
      }
    }
  }`, 'sales', {})
  if (errors) {
    console.log(errors)
  }
  let result = []
  try {
    result = data.hic_et_nunc_trade
  } catch (e) { }

  return result

}

async function fetchSubjkts(subjkt) {
  const { errors, data } = await fetchGraphQL(`
  query subjktsQuery {
    hic_et_nunc_holder(where: {name: {_ilike: "%${subjkt}%"}}, order_by: {hdao_balance: desc}) {
      address
      name
      hdao_balance
      metadata
    }
  }
  `, 'subjktsQuery', {})
  if (errors) {
    console.error(errors)
  }

  let result = []

  try {
    result = data.hic_et_nunc_holder
  } catch (e) { }

  return result
}

export async function fetchTag(tag, offset) {
  const { errors, data } = await fetchGraphQL(
    `query ObjktsByTag {
  hic_et_nunc_token(where: {supply: {_neq: "0"}, token_tags: {tag: {tag: {_in: ${tag}}}}}, offset: ${offset}, limit: 21, order_by: {id: desc}) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    royalties
    thumbnail_uri
    timestamp
    title
    description
    token_signatures {
      holder_id
    }
    supply
    swaps(where: {contract_version: {_eq: "2"}})   {
      is_valid
      id
      price
      status
      contract_version
    }
    token_holders(where: {quantity: {_gt: "0"}}) {
      holder_id
      quantity
    }
    creator {
      is_split
      address
      name
      metadata_file
      shares {
        shareholder {
          holder_type
          holder_id
        }
      }
    }
  }
}
`, "ObjktsByTag", {});
  if (errors) {
    console.error(errors);
  }
  const result = data?.hic_et_nunc_token
  return result
}

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    process.env.REACT_APP_GRAPHQL_API,
    {
      method: "POST",
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  );
  return await result.json();
}

const query_hdao = `query hDAOFeed($offset: Int = 0) {
  hic_et_nunc_token(order_by: {hdao_balance: desc}, limit: 21, where: {supply: {_neq: "0"}, hdao_balance: {_gt: 100}}, offset: $offset) {
    artifact_uri
    display_uri
    creator_id
    id
    mime
    royalties
    thumbnail_uri
    timestamp
    title
    description
    token_signatures {
      holder_id
    }
    supply
    swaps(where: {contract_version: {_eq: "2"}})   {
      is_valid
      id
      price
      status
      contract_version
    }
    token_holders(where: {quantity: {_gt: "0"}}) {
      holder_id
      quantity
    }
    creator {
      is_split
      address
      name
      metadata_file
      shares {
        shareholder {
          holder_type
          holder_id
        }
      }
    }
  }
}
`

async function fetchHdao(offset) {
  const { errors, data } = await fetchGraphQL(query_hdao, "hDAOFeed", { "offset": offset })
  if (errors) {
    console.error(errors);
  }
  const result = data.hic_et_nunc_token
  return result
};


const getRestrictedAddresses = async () =>
  await axios
    .get(
      process.env.REACT_APP_BLOCKLIST_WALLET
    )
    .then((res) => res.data.filter( (a) => !getWalletAllowList().includes(a)))

export class Search extends Component {
  static contextType = HicetnuncContext
  
  state = {
    subjkt: [],
    items: [],
    feed: [],
    feedstyle: getItem('feedstyle') || 'post',
    neonstyle: getItem('neonstyle') || null,
    search: '',
    select: '',
    prev: '',
    reset: false,
    flag: false,
    lastId: undefined,
    tags: [
      { id: 0, value: 'new OBJKTs' },
      { id: 1, value: 'recent sales'},
      { id: 2, value: 'h=n swaps' },
      { id: 3, value: 'friends' }, 
      { id: 4, value: 'music' },
      { id: 5, value: 'photography' }, 
      { id: 6, value: 'random' },
      { id: 7, value: '🗑️' },
      // { id: 7, value: 'gif' },
      // { id: 6, value: 'html/svg' }, // algorithimc?
      // { id: 4, value: 'glb' },
      { id: 8, value: '1D' },
      { id: 9, value: '1W' },
      { id: 10, value: '1M' },
      // { id: 10, value: 'ATH' },
      { id: 11, value: '○ hDAO' },
      { id: 12, value: 'Miami' },
      
   
      
      
    ],
    mouse: false,
    hasMore: true,
    offset: 0
  }

  componentWillMount = async () => {
    window.addEventListener('neon', () => this.setState({neonstyle: getItem('neonstyle')}))
    // let arr = await getRestrictedAddresses()
    // this.setState({ select: 'new OBJKTs' })
    // let res1 = await fetchTag(( 'teztrash'), 9999999)
    // let res2 = await fetchTag(( 'tezflowers'), 9999999)
    // let resTotal = res1.concat(res2).sort((a,b) => b.id - a.id)
    // resTotal = resTotal.filter(e => !arr.includes(e.creator_id))

    // let swaps = await fetchSwaps((this.state.offset))
    // swaps.forEach(e => { e.creator = e.token.creator; e.id = e.token.id});
    // swaps = swaps.filter(e => !arr.includes(e.creator.address))
    // this.setState({ feed: _.uniqBy([...this.state.feed, ...swaps], 'id') })

    // this.setState({ feed: [...this.state.feed, ...(swaps)] }) 
    // this.setState({ select: 'recent sales' })
    // let tokens = await fetchSales(this.state.offset)
    // tokens = tokens.map(e => e.token)
    // let tokens = await fetchFeed(this.state.offset)
    // tokens = tokens.map(e => e.token)
    // tokens = tokens.filter(e => !arr.includes(e.creator_id))
    // this.setState({ feed: _.uniqBy(_.uniqBy([...this.state.feed, ...tokens], 'id'), 'creator_id') })
    this.update(getItem('mainfeed') ||  'new OBJKTs', true)
  }

  componentWillUnmount = () => {
    window.removeEventListener('neon', () => this.setState({neonstyle: getItem('neonstyle')}))
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })

    //if (this.state.search.length >= 1) this.search()
  }

  update = async (e, reset) => {
    let arr = await getRestrictedAddresses()

    this.setState({ select: e })
    setItem('mainfeed', e)

    if (reset) {
      this.state.flag=false
      this.state.feed = []
      this.state.offset = 0
      this.state.lastId = await getLastId()
    }

    if (e === '1D') {

      let list = await fetchDay(new Date((new Date()).getTime() - 60 * 60 * 24 * 1000).toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = list.filter(e => !arr.includes(e.creator.address))
      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list
      })
    }

    if (e === '1W') {
      let list = await fetchDay(new Date((new Date()).getTime() - 60 * 60 * 24 * 7 * 1000).toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = list.filter(e => !arr.includes(e.creator.address))

      list = _.uniqBy(list, 'id')

      this.setState({
        feed: list
      })
    }


    if (e === '1M') {
      let list = await fetchDay(new Date((new Date()).getTime() - 60 * 60 * 24 * 30 * 1000).toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = list.filter(e => !arr.includes(e.creator.address))
      list = _.uniqBy(list, 'id')
      this.setState({
        feed: list
      })
    }

    if (e === 'ATH') {
      let list = await fetchDay(new Date('2021-05-01').toISOString(), this.state.offset)
      list = list.map(e => e.token)
      list = [...this.state.feed, ...(list)]
      list = _.uniqBy(list, 'id')
      this.setState({
        feed: list
      })
    }

    if (e === 'num') {
      let res = await fetchFeed(Number(this.state.search) + 1 - this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({
        feed: [...this.state.feed, ...(res)]
      })
    }

    if (e === '○ hDAO') {
      let res = await fetchHdao(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy(_.uniqBy([...this.state.feed, ...(res)], 'id'), 'creator_id'), hdao: true })
    }

    if (e === 'music') {
      let res = await fetchMusic(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'video') {

    }

    if (e === 'glb') {
      let res = await fetchGLB(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'html/svg') {
      let res = await fetchInteractive(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'random') {
      let res = await fetchRandomObjkts(this.state.lastId)
      console.log(res)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: [...this.state.feed, ...(res)] })
    }

    if (e === 'gif') {
      let res = await fetchGifs(this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'illustration') {
      //console.log(await fetchTag('illustration'))
    }

    // if (e === 'Event') {
    //   let res = await fetchTag('teztrash', 999999)
    //   res = res.filter(e => !arr.includes(e.creator_id))
    //   this.setState({ feed: ([...this.state.feed, ...(res)]) })
    // }

    if (e === 'photography') {
      let res = await fetchTag('photography', this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }

  
    if (e === 'tag') {
      let res = await fetchTag(this.state.search, this.state.feed[this.state.feed.length - 1].id)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
    }

    if (e === 'recent sales') {
      let tokens = await fetchSales(this.state.offset)
      tokens = tokens.map(e => e.token)
      tokens = tokens.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: _.uniqBy(_.uniqBy([...this.state.feed, ...tokens], 'id'), 'creator_id') })
    }

    if (e === 'h=n swaps') {
      let tokens = await fetchSwaps(this.state.offset)
      tokens.forEach(e => { e.creator = e.token.creator; e.id = e.token.id});
      tokens = tokens.filter(e => !arr.includes(e.creator.address))
      this.setState({ feed: _.uniqBy([...this.state.feed, ...tokens], 'id') })
      // this.setState({ feed: _.uniqBy([...this.state.feed, ...tokens], 'id')})
    }

    if (e === 'Miami') {
      let res = await fetchTag('miami', this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }


    if (e === '🗑️') {
      let res = await fetchTag(`trashart`, this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      this.setState({ feed: ([...this.state.feed, ...(res)]) })
    }
    
    if (e === 'friends') {
      this.setState({ select: 'friends' }) 
    }

    if (this.state.select === 'new OBJKTs') {
      let res = await fetchFeed(this.state.lastId, this.state.offset)
      res = res.filter(e => !arr.includes(e.creator_id))
      // this.setState({ feed: _.uniqBy([...this.state.feed, ...(res)], 'creator_id') })
      this.setState({ feed: [...this.state.feed, ...(res)] })
      
    }

    // new listings

    this.setState({ reset: false })

  }

  // latest = async () => {
  //   let result = []
  //   if (this.state.flag) {
  //     result = await fetchFeed(Math.min.apply(Math, this.state.feed.map(e => e.id)), this.state.offset)
  //   } else {
  //     result = await fetchFeed(999999, this.state.offset)
  //   }
  //   let restricted = await getRestrictedAddresses()
  //   result = _.uniqBy([...this.state.feed, ...result], 'creator_id')
  //   result = result.filter(e => !restricted.includes(e.creator_id))
  //   this.setState({ feed: [...result], flag: true })
  // }

  search = async (e) => {
    this.setState({ items: [], feed: [], search: e })
    this.setState({ subjkt: await fetchSubjkts(this.state.search) })

    if (!isNaN(this.state.search)) {
      this.setState({ feed: await fetchFeed(Number(this.state.search) + 1), select: 'num' })
    } else {
      this.setState({ feed: (await fetchTag(this.state.search.toLowerCase(), 9999999)), select: 'tag' })
    }
  }

  hoverState = (bool) => this.setState({ mouse: bool })

  select = (id) => this.setState({ select: [...this.state.select, id] })

  loadMore = () => {
    this.setState({ offset: this.state.offset + 21 })
    this.update(this.state.select, false)
  }

  handleKey = (e) => {
    if (e.key === 'Enter') this.search(this.state.search)
  }
  
  switchStyle = () => {
      if (this.state.feedstyle === 'original') {
        setItem('feedstyle', 'post')
        this.setState({ feedstyle: 'post' })    
      } else {
        setItem('feedstyle', 'original') 
        this.setState({ feedstyle: 'original' })
      }
    }

  render() {
    return (
      <Page>
        <Container>
          <Padding>
              <div style={{display: 'flex', flexDirection: 'row'}}>
                <Input
                  type="text"
                  name="search"
                  onChange={this.handleChange}
                  label="search ↵"
                  placeholder="search ↵"
                  onKeyPress={this.handleKey}
                />
                <div style={{ display: 'flex', flexDirection: 'row', marginRight: '18px'}}>
                  <NeonSwitch /> &nbsp;
                  <Button onClick={this.switchStyle}>
                      <Primary>
                        {this.state.feedstyle === 'post' ? <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 24 24" height="27px" width="27px" xmlns="http://www.w3.org/2000/svg"><path d="M3 21V3H5V21H3Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M7 3H17V21H7V3ZM9 5V19H15V5H9Z" fill="currentColor"></path><path d="M19 3V21H21V3H19Z" fill="currentColor"></path></svg>
                          : <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 24 24" height="27px" width="27px" xmlns="http://www.w3.org/2000/svg"><path d="M12.552 8C11.9997 8 11.552 8.44772 11.552 9C11.552 9.55228 11.9997 10 12.552 10H16.552C17.1043 10 17.552 9.55228 17.552 9C17.552 8.44772 17.1043 8 16.552 8H12.552Z" fill="currentColor" fillOpacity="0.5"></path><path d="M12.552 17C11.9997 17 11.552 17.4477 11.552 18C11.552 18.5523 11.9997 19 12.552 19H16.552C17.1043 19 17.552 18.5523 17.552 18C17.552 17.4477 17.1043 17 16.552 17H12.552Z" fill="currentColor" fillOpacity="0.5"></path><path d="M12.552 5C11.9997 5 11.552 5.44772 11.552 6C11.552 6.55228 11.9997 7 12.552 7H20.552C21.1043 7 21.552 6.55228 21.552 6C21.552 5.44772 21.1043 5 20.552 5H12.552Z" fill="currentColor" fillOpacity="0.8"></path><path d="M12.552 14C11.9997 14 11.552 14.4477 11.552 15C11.552 15.5523 11.9997 16 12.552 16H20.552C21.1043 16 21.552 15.5523 21.552 15C21.552 14.4477 21.1043 14 20.552 14H12.552Z" fill="currentColor" fillOpacity="0.8"></path><path d="M3.448 4.00208C2.89571 4.00208 2.448 4.44979 2.448 5.00208V10.0021C2.448 10.5544 2.89571 11.0021 3.448 11.0021H8.448C9.00028 11.0021 9.448 10.5544 9.448 10.0021V5.00208C9.448 4.44979 9.00028 4.00208 8.448 4.00208H3.448Z" fill="currentColor"></path><path d="M3.448 12.9979C2.89571 12.9979 2.448 13.4456 2.448 13.9979V18.9979C2.448 19.5502 2.89571 19.9979 3.448 19.9979H8.448C9.00028 19.9979 9.448 19.5502 9.448 18.9979V13.9979C9.448 13.4456 9.00028 12.9979 8.448 12.9979H3.448Z" fill="currentColor"></path></svg>
                        }
                      </Primary>
                  </Button>
                </div>
              </div>
     
            {
              <div style={{ marginTop: '15px' }}>
                {this.state.tags.map((e,i) => <div key={i} className='tag' href='#'
                   style= {{boxShadow: e.value === this.state.select && 'var(--box-shadow)', 
                    textDecoration: e.value === this.state.select && (this.state.neonstyle === false || this.state.neonstyle === null) ? 'underline' : ''}} onClick={() => {
                  this.update(e.value, true)
                }}>{e.value}</div>)}
              </div>
            }
            {
              (this.state.subjkt.length > 0) && (this.state.search !== "") ?
                <div style={{ maxHeight: '200px', overflow: 'scroll' }}>
                  {
                    this.state.subjkt.map((e,i) => <div key={i} style={{ marginTop: '10px' }}><a href={`/${e.name}`}>{e.name}</a> {e.metadata.description}</div>)
                  }
                </div>
                :
                undefined
            }
          </Padding>
        </Container>
        {this.state.select === 'friends' ?
          <Friends feedstyle={this.state.feedstyle} wallet={this.context.acc.address} />
          :
        <Container xlarge>
          {this.state.feed.length > 0 ?
              <InfiniteScroll
                dataLength={this.state.feed.length}
                next={this.loadMore}
                hasMore={this.state.hasMore}
                loader={undefined}
                endMessage={undefined}
              >
                <Container>
                  <Padding>
                    {this.state.feed.map((item, index) => (
                       this.state.feedstyle === 'post' ? <ObjktPost key={`${item.id}-${index}`} {...item} />
                        : <FeedItem key={`${item.id}-${index}`} {...item} />
                       ))}
                  </Padding>
                </Container>
              </InfiniteScroll>
              :
              undefined
            }
        </Container>
        }
      </Page>
    )
  }
}

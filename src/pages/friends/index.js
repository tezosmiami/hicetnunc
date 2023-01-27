import React, { Component } from 'react'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import { Page, Container, Padding } from '../../components/layout'
import { Button, Primary } from '../../components/button'
import { Loading } from '../../components/loading'
import { FeedItem } from '../../components/feed-item'
import { ObjktPost } from '../../components/objkt-post'
import { getItem, setItem } from '../../utils/storage'
import InfiniteScroll from 'react-infinite-scroll-component'

async function fetchGraphQL(operationsDoc, operationName, variables) {
  let result = await fetch(process.env.REACT_APP_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
  })
  return await result.json()
}

const query_frenCreations = `
query frensGallery($wallets: [String!], $lastId: bigint!) {
  hic_et_nunc_token(where: {creator_id: {_in: $wallets}, id: {_lt: $lastId}, supply: {_gt: 0}, artifact_uri: {_neq: ""}}, order_by: {id: desc}, limit: 20) {
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
`;

const query_frens = `
query collectorGallery($address: String!) {
  hic_et_nunc_token_holder(where: {holder_id: {_eq: $address}, token: {creator_id: {_neq: $address}}}, order_by: {token_id: desc}) {
    token {
      creator_id
    }
  }
}
`;

async function fetchAllFrensAddresses(myWalletAddr) {
  const { errors, data } = await fetchGraphQL(query_frens, "collectorGallery", { "address": myWalletAddr });
  if (errors) console.error(errors);

  let frensAddresses = []
  for (let holding of data.hic_et_nunc_token_holder) {
    frensAddresses.push(holding.token.creator_id)
  }
  // uniq address
  frensAddresses = [...new Set(frensAddresses)]
  return frensAddresses
}

export class Friends extends Component {
  static contextType = HicetnuncContext

  state = {
    wallet: '',
    lastId: 99999999,
    render: false,
    loading: true,
    feedstyle: this.props.feedstyle || getItem('feedstyle') || 'original',
    frens: [],
    creations: [],
  }

  fetchFeed = async () => {
    const { errors, data } = await fetchGraphQL(query_frenCreations, "frensGallery", {
      "wallets": this.state.frens,
      "lastId": this.state.lastId,
    });

    if (errors) console.error(errors);
    const result = data.hic_et_nunc_token

    let lastId = Math.min.apply(Math, result.map(e => e.id))
    this.setState({ lastId: lastId })
    return result
  }

  loadMore = async () => {
    let result = await this.fetchFeed()
    this.setState({
      creations: this.state.creations.concat(result),
    })
  }



  componentWillMount = async () => {
    const id = window.location.pathname.split('/')[1]
    if (id === 'friends') {
      const wallet = window.location.pathname.split('/')[2]
      this.setState({ wallet: wallet })
      this.onReady()
    } 
    else if (this.props.wallet) {
      this.setState({ wallet: this.props.wallet })
      this.onReady()
    } else this.props.history.push('/')
  }

  // called if there's no redirect
  onReady = async () => {
    this.context.setPath(window.location.pathname)
    let myWalletAddr = this.props.wallet || '' 
    if (window.location.pathname.split('/')[1] === 'friends') {
      myWalletAddr = window.location.pathname.split('/')[2]
    }
  
    const getLatestByFrens = async () => {
      try {
        const frensAddresses = await fetchAllFrensAddresses(myWalletAddr );
        this.setState({ frens: frensAddresses })
        return this.fetchFeed()
      } catch (error) {
        console.log(error)
      }
    }
    const frenCreations = await getLatestByFrens()
    this.setState({
      creations: frenCreations,
      loading: false,
     })
    }

    switchStyle = () => {
      if (this.state.feedstyle === 'original') {
        setItem('feedstyle', 'post')
        this.setState({ feedstyle: 'post' })    
      }
      else {
        setItem('feedstyle', 'original') 
        this.setState({ feedstyle: 'original' })
      }
  }

  render() {
    return (
      <Page title={this.state.alias} feed={this.props.wallet ? true : false} >
           {!this.props.wallet && <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginRight: '18px'}}>
            <Button onClick={this.switchStyle}>
              <Primary>
                {this.state.feedstyle === 'post' ? <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 24 24" height="27px" width="27px" xmlns="http://www.w3.org/2000/svg"><path d="M3 21V3H5V21H3Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M7 3H17V21H7V3ZM9 5V19H15V5H9Z" fill="currentColor"></path><path d="M19 3V21H21V3H19Z" fill="currentColor"></path></svg>
                  : <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 24 24" height="27px" width="27px" xmlns="http://www.w3.org/2000/svg"><path d="M12.552 8C11.9997 8 11.552 8.44772 11.552 9C11.552 9.55228 11.9997 10 12.552 10H16.552C17.1043 10 17.552 9.55228 17.552 9C17.552 8.44772 17.1043 8 16.552 8H12.552Z" fill="currentColor" fillOpacity="0.5"></path><path d="M12.552 17C11.9997 17 11.552 17.4477 11.552 18C11.552 18.5523 11.9997 19 12.552 19H16.552C17.1043 19 17.552 18.5523 17.552 18C17.552 17.4477 17.1043 17 16.552 17H12.552Z" fill="currentColor" fillOpacity="0.5"></path><path d="M12.552 5C11.9997 5 11.552 5.44772 11.552 6C11.552 6.55228 11.9997 7 12.552 7H20.552C21.1043 7 21.552 6.55228 21.552 6C21.552 5.44772 21.1043 5 20.552 5H12.552Z" fill="currentColor" fillOpacity="0.8"></path><path d="M12.552 14C11.9997 14 11.552 14.4477 11.552 15C11.552 15.5523 11.9997 16 12.552 16H20.552C21.1043 16 21.552 15.5523 21.552 15C21.552 14.4477 21.1043 14 20.552 14H12.552Z" fill="currentColor" fillOpacity="0.8"></path><path d="M3.448 4.00208C2.89571 4.00208 2.448 4.44979 2.448 5.00208V10.0021C2.448 10.5544 2.89571 11.0021 3.448 11.0021H8.448C9.00028 11.0021 9.448 10.5544 9.448 10.0021V5.00208C9.448 4.44979 9.00028 4.00208 8.448 4.00208H3.448Z" fill="currentColor"></path><path d="M3.448 12.9979C2.89571 12.9979 2.448 13.4456 2.448 13.9979V18.9979C2.448 19.5502 2.89571 19.9979 3.448 19.9979H8.448C9.00028 19.9979 9.448 19.5502 9.448 18.9979V13.9979C9.448 13.4456 9.00028 12.9979 8.448 12.9979H3.448Z" fill="currentColor"></path></svg>
                }
              </Primary>
            </Button>
          </div>}
        {this.state.loading && (
          <Container>
            <Padding>
              <Loading />
            </Padding>
          </Container>
        )}
        {!this.state.loading && (
          <>
            {this.state.creations == 0 && (
              <Container>
                <Padding>
                  <p style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    No OBJKTs have been collected by this wallet address
                  </p>
                  {JSON.stringify(this.state.creations)}
                </Padding>
              </Container>
            )}
          </>
        )}
        {!this.state.loading && this.state.creations && (
          <Container xlarge>
            <InfiniteScroll
              dataLength={this.state.creations.length}
              next={this.loadMore}
              hasMore={true}
              loader={undefined}
              endMessage={
                <p>
                  mint mint mint{' '}
                  <span role="img" aria-labelledby={'Sparkles emoji'}>
                    ✨
                  </span>
                </p>
              }
            >
              <Container>
                <Padding>
                  {this.state.creations.map((item, index) => (
                    this.props.feedstyle === 'original' || this.state.feedstyle === 'original' ?
                     <FeedItem key={`${item.id}-${index}`} {...item} creator_id={item.creator.address} /> 
                     : <ObjktPost key={`${item.id}-${index}`} {...item} />
                  ))}
                </Padding>
              </Container>
            </InfiniteScroll>
          </Container>
        )}
      </Page>
    )
  }
}
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { getWalletAllowList } from '../../constants'
import { useParams } from 'react-router'
import { Button } from '../../components/button'
import { ResponsiveMasonry } from '../../components/responsive-masonry'
import { renderMediaType } from '../../components/media-types'
import { Page, Container } from '../../components/layout'
import { PATH } from '../../constants'
import styles from './styles.module.scss'
import axios from 'axios'

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    import.meta.env.VITE_GRAPHQL_API,
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

async function fetchTag(tag, offset) {
  const { errors, data } = await fetchGraphQL(`query ObjktsByTag($tag: String = "3d", $lastId: bigint = 99999999) {
    token(where: {token_tags: {tag: {tag: {_eq: ${tag}}}}, id: {_lt: $lastId}, supply: {_gt: "0"}}, order_by: {id: desc}, limit : 35, offset : ${offset}) {
      id
      artifact_uri
      display_uri
      creator_id
      mime
      creator {
        address
        name
      }
    }
  }`,
    'ObjktsByTag',
    {}
  )
  if (errors) {
    console.error(errors)
  }
  try {
    return data.token
  } catch (e) {
    return undefined
  }
}

const getRestrictedAddresses = async () =>
  await axios
    .get(
      'https://raw.githubusercontent.com/hicetnunc2000/hicetnunc-reports/main/filters/w.json'
    )
    .then((res) => res.data.filter( (a) => !getWalletAllowList().includes(a)))

export const Tags = () => {
  const { id } = useParams()
  const [feed, setFeed] = useState([])
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [restricted, setRestricted] = useState([])
  const [offset, setOffset] = useState(0)

  const loadMore = async () => {
    setOffset(offset + 35)
    let arr = await fetchTag(id, offset + 35)
    setFeed([...feed, ...arr].filter(e => !restricted.includes(e.creator_id)))
    setCount(count + 15)
  }

  useEffect(() => {
    const getTag = async () => {
      let arr = await fetchTag(id, offset)
      let res = await getRestrictedAddresses()
      setRestricted(res)
      // console.log(arr)
      setFeed(arr.filter(e => !res.includes(e.creator_id)))
    }
    getTag()
  }, [])
// console.log(feed)
  return (
    <Page title={`Tag ${id}`}>
      <div className="tag-view">
        <InfiniteScroll
          dataLength={feed.length}
          next={loadMore}
          hasMore={hasMore}
          loader={undefined}
        >
          <div className={styles.container}>
            <Container xlarge>
              <ResponsiveMasonry>
                {feed.map((nft, index) => {
                  return (
                    <Button
                      key={`${nft.id}-${index}`}
                      to={`${PATH.OBJKT}/${nft.id}`}
                    >
                      <div className={styles.container}>
                        {renderMediaType({
                          mimeType: nft.mime,
                          artifactUri: nft.artifact_uri,
                          displayUri: nft.display_uri,
                          displayView: true
                        })}
                      </div>
                    </Button>
                  )
                })}
              </ResponsiveMasonry>
            </Container>
          </div>
        </InfiniteScroll>
        {/*         <BottomBanner>
                v2 migration: All OBJKTs listed on market before June 28th must be relisted on market due smart contract migration. managed assets > v1 swaps > batch cancel > relist.
        </BottomBanner> */}
      </div>
    </Page>
  )
}

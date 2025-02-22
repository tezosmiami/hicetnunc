import { useEffect, useState } from 'react'
import { Button, Primary } from '../../components/button'
import { Page, Container, Padding } from '../../components/layout'
// import { GetOBJKT } from '../../data/api'
import { renderMediaType } from '../../components/media-types'
import { PATH } from '../../constants'
import { ResponsiveMasonry } from '../../components/responsive-masonry'
// import { BottomBanner } from '../../components/bottom-banner'
import styles from './styles.module.scss'
import _ from 'lodash'

async function fetchObjkts(ids) {
  const { errors, data } = await fetchGraphQL(`
    query Objkts($_in: [bigint!] = "") {
      token(where: { id: {_in: $_in}}) {
        artifact_uri
        display_uri
        creator_id
        id
        mime
        thumbnail_uri
        timestamp
        title
        hdao_balance
      }
    }`, "Objkts", { "_in" : ids })
    if (errors) {
      console.log(errors)
    }
  return data.token
}

async function fetchGraphQL(operationsDoc, operationName, variables) {
  let result = await fetch(import.meta.env.VITE_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
  })
  return await result.json()
}

// const sortByThumbnailTokenId = (a, b) => {
//   const ia = parseInt(a.thumbnail)
//   const ib = parseInt(b.thumbnail)
//   return ia < ib ? 1 : -1
// }

export const Galleries = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    // loads gallery to check endpoint file
    fetch('/galleries/galleries.json')
      .then((e) => e.json())
      .then(async (galleries) => {
        //console.log(galleries)
         let res = await fetchObjkts(galleries.map(e => e.id))

         let merged = _.merge(_.keyBy(galleries, 'id'), _.merge(_.keyBy(res, 'id')))

         let values = _.values(merged)

         setData(values.reverse())

      })

    return () => {
      document.body.style = {}
    }
  }, [])

  return (
    <Page title="Galleries">
      <Container xlarge>
        <Padding>
          <ResponsiveMasonry>
            {data.map((e) => {
              // const { token_info } = e
              //console.log(e)
              return (
                <Button key={e.uid} to={`${PATH.GALLERY}/${e.uid}`}>
                  <div className={styles.item}>
                    {renderMediaType({
                      mimeType: e.mime,
                      artifactUri: e.artifact_uri,
                      displayUri: e.display_uri,
                      creator: "",
                      objkt: e.id,
                      interactive: false,
                      displayView: true
                    })}
                    <Button>
                      <Primary>
                        <div className={styles.number}>{e.name}</div>
                      </Primary>
                    </Button>
                  </div>
                </Button>
              )
            })}
          </ResponsiveMasonry>
        </Padding>
      </Container>
      {/*       <BottomBanner>
        Collecting has been temporarily disabled. Follow <a href="https://twitter.com/hicetnunc2000" target="_blank">@hicetnunc2000</a> or <a href="https://discord.gg/jKNy6PynPK" target="_blank">join the discord</a> for updates.
      </BottomBanner> */}
    </Page>
  )
}

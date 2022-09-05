export const getUserMetaQuery = `query UserMeta($address: String = "") {
  holder(where: { address: { _eq: $address } }) {
      name
      metadata
  }
}`

export const getAvailableCollabAddresses = `query GetCollabContracts($address: String!) {
splitcontract(where: {administrator: {_eq: $address}}) {
  contract {
    address
    shares {
      shareholder(where: {holder_type: {_eq: "core_participant"}}) {
        holder {
          name
          address
        }
      }
    }
  }
}
}`

export const getCollabCreationsByAddress = `query GetCollabCreations($address: String!) {
token(where: {creator: {is_split: {_eq: true}, address: {_eq: $address}}, supply: {_gt: "0"}}, order_by: {id: desc}) {
  id
  artifact_uri
  display_uri
  thumbnail_uri
  timestamp
  mime
  title
  description
  supply
  token_tags {
    tag {
      tag
    }
  }
}

splitcontract(where: {contract_id: {_eq: $address}}) {
  administrator
  shareholder {
    holder {
      address
      name
    }
    holder_type
  }
  contract {
    name
    description
    address
  }
}
}`

export const getCollabCreationsBySubjkt = `query GetCollabCreations($subjkt: String!) {
  token(where: {creator: {is_split: {_eq: true}, name: {_eq: $subjkt}}, supply: {_gt: "0"}}, order_by: {id: desc}) {
    id
    artifact_uri
    display_uri
    thumbnail_uri
    timestamp
    mime
    title
    description
    supply
    token_tags {
      tag {
        tag
      }
    }
  }

  splitcontract(where: {contract: {name: {_eq: $subjkt}}}) {
    administrator
    shareholder {
      holder {
        address
        name
      }
      holder_type
    }
    contract {
      name
      description
      address
    }
  }
}`

export const getUserMetadataFile = `
query subjktsQuery($subjkt: String!) {
  holder(where: { name: {_eq: $subjkt}}) {
    metadata_file
  }
}
`

export const getCollabTokensForAddress = `query GetCollabTokens($address: String!) {
shareholder(where: {holder_id: {_eq: $address}, holder_type: {_eq: "core_participant"}}) {
  split_contract {
    contract {
      address
      name
      tokens(where: {supply: {_gt: "0"}}) {
        id
        is_signed
        artifact_uri
        display_uri
        thumbnail_uri
        timestamp
        mime
        title
        description
        supply
        royalties
        creator {
          address
        }
      }
    }
  }
}
}`

export const getManagedCollabs = `query GetManagedCollabs($address: String!) {
splitcontract(where: {administrator: {_eq: $address}}) {
  id
  contract {
    address
    description
    name
  }
  administrator
    shareholder {
      shares
      holder {
        name
        address
      }
    holder_type
  }
}
}`

export const getCollabsForAddress = `query GetCollabs($address: String!) {
splitcontract(where: {_or: [{administrator: {_eq: $address}}, {shareholder: {holder_id: {_eq: $address}}}]}) {
  id
  contract {
    address
    description
    name
  }
  administrator
  shareholder {
    shares
    holder {
      name
      address
    }
    holder_type
  }
}
}`

export const getNameForAddress = `query GetNameForAddress($address: String!) {
holder(where: {address: {_eq: $address}}) {
  name
}
}`

export async function fetchUserMetadataFile(subjkt) {
  const { errors, data } = await fetchGraphQL(getUserMetadataFile, 'subjktsQuery', { subjkt })

  if (errors) {
    console.error(errors)
  }

  return data.holder
}

export async function fetchGraphQL(operationsDoc, operationName, variables) {
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

  // console.log(JSON.stringify({
  //   query: operationsDoc,
  //   variables: variables,
  //   operationName: operationName
  // }))

  return await result.json()
}



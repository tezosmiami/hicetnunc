import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { HicetnuncContext } from '../context/HicetnuncContext'
import { Page, Container, Padding } from '../components/layout'
import { LoadingContainer } from '../components/loading'
import { Button, Primary } from '../components/button'

export default class Sync extends Component {
  constructor(props) {
    super(props)

    this.state = {
      addr: '',
    }
  }

  static contextType = HicetnuncContext

  componentDidMount = async () => {
    if (this.context.acc == null) {
      await this.context.syncTaquito()
      await this.context.setAccount()
    } else {
      await this.context.setAccount()
    }
  }
// here sync issues
  render() {
    return this.context.acc ? (
      <Redirect to={`/tz/${this.context.acc.address}`} />
    ) : (
      <Page title="">
        <Container>
          <Padding>
            <p>requesting permissions</p>
            <Button onClick={this.componentDidMount}>
              <Primary>try again?</Primary>
            </Button>
            <LoadingContainer />
          </Padding>
        </Container>
      </Page>
    )
  }
}

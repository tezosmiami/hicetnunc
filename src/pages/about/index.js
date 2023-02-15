import React, { Component } from 'react'
import { Page, Container, Padding } from '../../components/layout'
import { Button, Primary } from '../../components/button'
import { HicetnuncContext } from '../../context/HicetnuncContext'
// import { BottomBanner } from '../../components/bottom-banner'
import { getLanguage } from '../../constants'
import styles from './styles.module.scss'

export class About extends Component {
  static contextType = HicetnuncContext

  language = getLanguage()

  state = {
    reveal: false,
  }

  reveal = () => {
    this.setState({
      reveal: !this.state.reveal,
    })
  }

  render() {
    return (
      <Page title="about" large>
        <Container>
          <Padding>
            <strong>hic et nunc - magic city</strong>
          </Padding>
        </Container>

        <Container>
          <Padding>
            <p>{this.language.about.paragraphs[0]}</p>
          </Padding>
        </Container>

        <Container>
          <Padding>
            <p>{this.language.about.paragraphs[1]}</p>
          </Padding>
        </Container>

        <Container>
          <Padding>
            <p>{this.language.about.paragraphs[2]}</p>
          </Padding>
        </Container>

        <Container>
          <Padding>
            <p>{this.language.about.paragraphs[3]}</p>
          </Padding>
        </Container>

         <Container>
          <Padding>
            <p>{this.language.about.paragraphs[4]}</p>
          </Padding>
        </Container>

        <Container>
          <Padding>
            <div className={styles.buttons}>
              <p>original hicetnunc </p>&nbsp;
              <Button href="https://discord.gg/ZBxbrUD6PF">
                <Primary>
                  <strong>discord</strong>
                </Primary>
              </Button>
              ,&nbsp;
              <Button href="https://hicetnunc2000.medium.com">
                <Primary>
                  <strong>medium</strong>
                </Primary>
              </Button>
              ,&nbsp;
              <Button href="https://reddit.com/r/hicetnunc">
                <Primary>
                  <strong>reddit</strong>
                </Primary>
              </Button>
              ,&nbsp;
              <Button href="https://t.me/hicetnunc2000">
                <Primary>
                  <strong>telegram</strong>
                </Primary>
              </Button>
              ,&nbsp;
              <Button href="https://community.hicetnunc.xyz">
                <Primary>
                  <strong>forum</strong>
                </Primary>
              </Button>
              ,&nbsp;
              <Button href="https://github.com/hicetnunc2000/hicetnunc/wiki/Tools-made-by-the-community">
              <Primary>
                <strong>tools</strong>
              </Primary>
              </Button>
              &nbsp;and&nbsp;
              <Button href="https://github.com/hicetnunc2000/hicetnunc/wiki">
                  <Primary>
                    <strong>wiki</strong>
                  </Primary>
              </Button>
            </div>
          </Padding>
        </Container>
        
        <Container>
          <Padding>
            <div className={styles.buttons}>
              <p>contact magicCity on</p>
              &nbsp;
              <Button href="https://twitter.com/tezosmiami">
                <Primary>
                  <strong>twitter</strong>
                </Primary>
              </Button>
              <p>,</p>&nbsp;
               <Button href="https://discord.gg/ZBxbrUD6PF">
                <Primary>
                  <strong>discord</strong>
                </Primary>
              </Button>
              &nbsp;<p> or</p>&nbsp;
              <Button href="mailto:tezosmiami@gmail.com">
                <Primary>
                  <strong>email</strong>
                </Primary>
              </Button>
            </div>
          </Padding>
        </Container>

        {/* <Container>
          <Padding>
            <Button href="https://github.com/hicetnunc2000/hicetnunc/wiki/Tools-made-by-the-community">
              <Primary>
                <strong>Community tools</strong>
              </Primary>
            </Button>
            {false && (
              <Button href="https://projects.stroep.nl/hicetnunc">
                <Primary>
                  <strong>example tool2</strong>
                </Primary>
              </Button>
            )}
          </Padding>
        </Container> */}

        <Container>
          <Padding>
            <div className={styles.buttons}>
              <p>source on </p>&nbsp;
              <Button href="https://github.com/tezosmiami/hicetnunc">
                <Primary>
                  <strong>github</strong>
                </Primary>
              </Button>
            </div>
          </Padding>
        </Container>
{/*         <BottomBanner>
        Collecting has been temporarily disabled. Follow <a href="https://twitter.com/hicetnunc2000" target="_blank">@hicetnunc2000</a> or <a href="https://discord.gg/jKNy6PynPK" target="_blank">join the discord</a> for updates.
        </BottomBanner> */}
      </Page>
    )
  }
}

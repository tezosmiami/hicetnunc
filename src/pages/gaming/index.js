import { Page } from '../../components/layout'
import { Ch3ss } from '../../components/games/chess'
import { NeonSwitch } from '../../components/neon-switch'
import { Container } from '../../components/layout'
import styles from './styles.module.scss'

export const Gaming = () => {
    return(
        <Page>
            <Container>
                <div className={styles.neon}>
                    <NeonSwitch />  
                </div>
                <Ch3ss />
            </Container>
           
        </Page>
    )
}



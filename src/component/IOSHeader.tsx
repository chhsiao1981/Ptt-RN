import React from 'react'
import { Platform, View } from 'react-native'
import Empty from './Empty'
import styles from './IOSHeader.style'

export default () => {
    if (Platform.OS !== 'ios') {
        return (<Empty />)
    }

    return (<View style={styles.header} />)
}

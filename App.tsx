import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import PopularBoards from "./src/view/PopularBoards"
import LoginMain from "./src/view/LoginMain"
import Home from "./src/view/Home"
import Articles from "./src/view/Articles"
import { Route, Router } from './react-router'
import { setI18nConfig, RNLocalize } from "./src/i18n"
import styles from './App.style'

type Props = any

export default (_: Props) => {
    let handleLocalizationChange = () => {
        setI18nConfig()
    }

    useEffect(() => {
        setI18nConfig()
        RNLocalize.addEventListener('change', handleLocalizationChange)

        return () => {
            RNLocalize.removeEventListener('change', handleLocalizationChange)
        }
    }, [])

    return (
        <Router>
            <View style={styles.container}>
                <Route exact path="/" component={LoginMain} />
                <Route exact path="/home" component={Home} />
                <Route exact path="/boards/popular" component={PopularBoards} />
                <Route exact path="/board/:bid/articles" component={Articles} />
            </View>
        </Router>
    )
}

import ArticleList from "../component/ArticleList"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, View, Text } from "react-native"
import { useParams } from 'react-router-dom'
import Icon from "react-native-vector-icons/MaterialIcons"
import styles from './Articles.style'

import * as DoArticles from '../reducers/articles'
import { Articles } from '../reducers/articles'

import { useReducer, getRootState, getRoot } from "react-reducer-utils"

import Empty from '../component/Empty'

import IOSHeader from '../component/IOSHeader'

type Props = {
    history: any
    match: any
}

export default (props: Props) => {
    const [stateArticles, doArticles] = useReducer(DoArticles)
    const [displayArticles, setDisplayArticles] = useState([])
    const [nextStartIdx, setNextStartIdx] = useState('')

    //init
    // @ts-ignore
    let { bid } = useParams()
    useEffect(() => {
        doArticles.init(doArticles, bid)
    }, [])


    //get me
    let me_q = getRoot<Articles>(stateArticles)
    let isLoading = me_q?.state.isLoading
    let allArticles = me_q?.state.allArticles || []
    useEffect(() => {
        if (!allArticles || !allArticles.length) {
            return
        }
        // @ts-ignore
        setDisplayArticles(allArticles)
    }, [allArticles])

    if (!me_q) {
        return <Empty />
    }
    let me = me_q
    const { state, id: myID } = me
    let bottomArticles = state.bottomArticles || []

    // event-handlers
    let goBack = () => {
        props.history.goBack()
    }

    let onScrollDown = (...params: any[]) => {
        console.log('onScrollDown: params:', params)
        let articles = state.articles || []
        let startIdx = articles.length ? articles[articles.length - 1].idx : ''
        doArticles.getArticles(myID, bid, '', startIdx, true, true)
    }

    // render
    return (
        <View style={[styles.container]}>
            <IOSHeader />
            <View style={styles.header} onPress={goBack}>
                <Icon style={[styles.backIcon]} name={'arrow-back-ios'}
                    size={30} onPress={goBack} />
                <Text style={[styles.boardName]} onPress={goBack}>{bid}</Text>
                {isLoading ? <ActivityIndicator size="large" style={[styles.loadingCircle]} /> : null}
            </View>
            <ArticleList
                articles={bottomArticles} scrollDown={() => {}} />
            <ArticleList
                articles={displayArticles}
                scrollDown={onScrollDown} />
        </View>
    )
}

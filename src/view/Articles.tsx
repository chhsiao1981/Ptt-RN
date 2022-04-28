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
    let theArticles = me_q?.state.articles || []
    useEffect(() => {
        if (!theArticles || !theArticles.length) {
            return
        }
        // @ts-ignore
        setDisplayArticles(theArticles)
    }, [theArticles])

    if (!me_q) {
        return <Empty />
    }
    let me = me_q
    const { state, id: myID } = me
    let bottomArticles = state.bottomArticles || []

    // event-handlers
    let goBack = () => {
        console.log('goBack: history:', props.history)
        props.history.goBack()
    }

    let onScrollUp = (...params: any[]) => {
        console.log('onScrollUp: params:', params)
        let articles = state.articles || []
        let startIdx = articles.length ? articles[0].idx : ''
        doArticles.getArticles(myID, bid, '', startIdx, true, true)
    }

    let onScrollDown = (...params: any[]) => {
        console.log('onScrollDown: params:', params)
        let articles = state.articles || []
        let startIdx = articles.length ? articles[articles.length - 1].idx : ''
        console.log('onScrollDown: to getArticles: myID:', myID, 'bid:', bid, 'startIdx:', startIdx)
        doArticles.getArticles(myID, bid, '', startIdx, false, true)
    }

    // render
    return (
        <View style={[styles.container]}>
            <IOSHeader />
            <View style={styles.header} onTouchEnd={goBack}>
                <Icon style={[styles.backIcon]} name={'arrow-back-ios'}
                    size={30} />
                <Text style={[styles.boardName]}>{bid}</Text>
                {isLoading ? <ActivityIndicator size="large" style={[styles.loadingCircle]} /> : null}
            </View>
            <ArticleList
                articles={bottomArticles} scrollDown={() => {}} scrollUp={() => {}} id='bottom' />
            <ArticleList
                articles={displayArticles}
                scrollUp={onScrollUp}
                scrollDown={onScrollDown} id='articles' />
        </View>
    )
}

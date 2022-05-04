import ArticleList from "../component/ArticleList"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, View, Text, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
import { useParams } from 'react-router-dom'
import Icon from "react-native-vector-icons/MaterialIcons"
import styles from './Articles.style'

import * as DoArticles from '../reducers/articles'
import { Articles } from '../reducers/articles'

import { useReducer, getRoot } from "react-reducer-utils"

import Empty from '../component/Empty'

import IOSHeader from '../component/IOSHeader'
import { NativeScreen } from "react-native-screens"

type Props = {
    history: any
    match: any
}

export default (props: Props) => {
    const [stateArticles, doArticles] = useReducer(DoArticles)
    const [isAtTop, setIsAtTop] = useState(true)
    //init
    // @ts-ignore
    let { bid } = useParams()
    useEffect(() => {
        doArticles.init(doArticles, bid)
    }, [])


    //get me
    let root_q = getRoot<Articles>(stateArticles)
    if (!root_q) {
        return <Empty />
    }
    let root = root_q

    const { state: me, id: myID } = root
    let articles = me.articles || []
    let isLoading = me.isLoading
    let bottomArticles = me.bottomArticles || []

    // event-handlers
    let goBack = () => {
        console.log('goBack: history:', props.history)
        doArticles.clean()
        props.history.goBack()
    }

    let onScrollUp = async (...params: any[]) => {
        console.log('onScrollUp: params:', params)
        let articles = me.articles || []
        let startIdx = articles.length ? articles[0].idx : ''
        doArticles.getArticles(myID, bid, '', startIdx, true, true)
    }

    let onScrollDown = async (...params: any[]) => {
        console.log('onScrollDown: params:', params)
        let articles = me.articles || []
        let startIdx = articles.length ? articles[articles.length - 1].idx : ''
        doArticles.getArticles(myID, bid, '', startIdx, false, true)
    }

    let onScroll = async (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset } = e.nativeEvent
        console.log('onScroll: e:', e.nativeEvent, 'contentOffset:', contentOffset)
        if (contentOffset.y <= 40) {
            if (!isAtTop) {
                console.log('onScroll: to setIsAtTop as true')
                setIsAtTop(true)
            }
        } else {
            if (isAtTop) {
                console.log('onScroll: to setIsAtTop as false')
                setIsAtTop(false)
            }
        }

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
                {!isAtTop ? <Icon style={[styles.backIcon]} name='arrow-circle-up' size={30} /> : null}

            </View>
            <View style={styles.articlelist}>
                <ArticleList
                    articles={articles}
                    onStartReached={onScrollUp}
                    onEndReached={onScrollDown} accessibilityLabel='articles' onStartReachedThreshold={300} onEndReachedThreshold={300} onScroll={onScroll}
                />
            </View>
            <View>
                <ArticleList
                    articles={bottomArticles} accessibilityLabel='bottom' isHighlight={true} />
            </View>
        </View>
    )
}

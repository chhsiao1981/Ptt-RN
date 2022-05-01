import ArticleList from "../component/ArticleList"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, View, Text, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
import { useParams } from 'react-router-dom'
import Icon from "react-native-vector-icons/MaterialIcons"
import styles from './Articles.style'

import articles, * as DoArticles from '../reducers/articles'
import { Articles } from '../reducers/articles'

import { useReducer, getRootState, getRoot } from "react-reducer-utils"

import Empty from '../component/Empty'

import IOSHeader from '../component/IOSHeader'
import { ArticleSummary } from "../model/article"
import { ITEM_HEIGHT } from "../component/constants"
import { NativeScreen } from "react-native-screens"

type Props = {
    history: any
    match: any
}

export default (props: Props) => {
    const [stateArticles, doArticles] = useReducer(DoArticles)
    let initDisplayBottomArticles: ArticleSummary[] = []
    const [displayBottomArticles, _setDisplayBottomArticles] = useState(initDisplayBottomArticles)
    let initDisplayArticles: ArticleSummary[] = []
    const [displayArticles, _setDisplayArticles] = useState(initDisplayArticles)
    const [nextStartIdx, setNextStartIdx] = useState('')

    //init
    // @ts-ignore
    let { bid } = useParams()
    useEffect(() => {
        doArticles.init(doArticles, bid)
    }, [])


    //get me
    let setDisplayArticles = (articles: ArticleSummary[]) => {
        let offsetHeight = 0
        articles.map((each, idx) => {
            each.height = ITEM_HEIGHT
            each.offsetHeight = offsetHeight
            offsetHeight += each.height
        })

        console.log('to _setDisplayArticles: articles:', articles.length)
        _setDisplayArticles(articles)
    }

    let setDisplayBottomArticles = (articles: ArticleSummary[]) => {
        let offsetHeight = 0
        articles.map((each, idx) => {
            each.height = ITEM_HEIGHT
            each.offsetHeight = offsetHeight
            offsetHeight += each.height
        })
        console.log('to _setDisplayBottomArticles: articles:', articles.length)
        _setDisplayBottomArticles(articles)
    }

    let me_q = getRoot<Articles>(stateArticles)
    let isLoading = me_q?.state.isLoading
    let theArticles = me_q?.state.articles || []
    let bottomArticles = me_q?.state.bottomArticles || []
    useEffect(() => {
        if (!theArticles || !theArticles.length) {
            return
        }
        // @ts-ignore
        setDisplayArticles(theArticles)
    }, [theArticles])


    useEffect(() => {
        if (!bottomArticles || !bottomArticles.length) {
            return
        }
        // @ts-ignore
        _setDisplayBottomArticles(bottomArticles)
    }, [bottomArticles])

    if (!me_q) {
        return <Empty />
    }
    let me = me_q
    const { state, id: myID } = me

    // event-handlers
    let goBack = () => {
        console.log('goBack: history:', props.history)
        doArticles.clean()
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

    let onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>, idx: number) => {
        const { contentOffset, contentSize } = e.nativeEvent

        let articles = state.articles || []
        console.log('Articles.onScroll: contentOffset:', contentOffset, 'contentSize:', contentSize, 'idx:', idx, 'item:', articles[idx].title)
        doArticles.setDisplayIdx(myID, idx)
    }

    let onRefresh = (...params: any[]) => {
        console.log('Articles.onRefresh: params:', params)
    }


    // render
    let isRefreshing = state.isLoading || false

    console.log('to render: displayArticles:', displayArticles.length, 'displayBottomArticles:', displayBottomArticles.length, 'idxToScroll:', state.idxToScroll, 'isRefreshing:', isRefreshing)
    return (
        <View style={[styles.container]}>
            <IOSHeader />
            <View style={styles.header} onTouchEnd={goBack}>
                <Icon style={[styles.backIcon]} name={'arrow-back-ios'}
                    size={30} />
                <Text style={[styles.boardName]}>{bid}</Text>
                {isLoading ? <ActivityIndicator size="large" style={[styles.loadingCircle]} /> : null}
            </View>
            <View style={styles.articlelist}>
                <ArticleList
                    articles={displayArticles}
                    scrollUp={onScrollUp}
                    scrollDown={onScrollDown} accessibilityLabel='articles' initIdxToScroll={state.idxToScroll} initToEnd={true} scrollUpThreshold={10} scrollDownThreshold={10} scroll={onScroll}
                    isRefreshing={isRefreshing}
                    onRefresh={onRefresh}
                />
            </View>
            <View>
                <ArticleList
                    articles={displayBottomArticles} scrollDown={() => {}} scrollUp={() => {}} accessibilityLabel='bottom' initToEnd={false} isHighlight={true} isRefreshing={false} />
            </View>
        </View>
    )
}

import React from "react"
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { ArticleSummary } from "../model/article"
import ArticleListItem from "./ArticleListItem"
import styles from './ArticleList.style'

import FlatList from './FlatList'

type Props = {
    articles: ArticleSummary[]
    scrollDownThreshold?: number
    scrollDown: () => any
    scrollUpThreshold?: number
    scrollUp: () => any
    scroll?: (e: NativeSyntheticEvent<NativeScrollEvent>, idx: number) => void
    initToEnd: boolean
    initIdxToScroll?: number
    isHighlight?: boolean
    accessibilityLabel?: string
    isRefreshing: boolean
    onRefresh?: () => any
}

export default (props: Props) => {
    return (
        <View style={styles.page}>
            <FlatList<ArticleSummary>
                data={props.articles}
                renderItem={(each) => (<ArticleListItem key={each.index} article={each.item} isHighlight={props.isHighlight} />)}
                onBeginIdxReached={props.scrollUp}
                onBeginIdxReachedThreshold={props.scrollUpThreshold}
                onEndIdxReached={props.scrollDown}
                onEndIdxReachedThreshold={props.scrollDownThreshold}
                onTheScroll={props.scroll}
                initIdxToScroll={props.initIdxToScroll}
                initToEnd={props.initToEnd}
                initialNumToRender={10}
                accessibilityLabel={props.accessibilityLabel}

                refreshing={props.isRefreshing}
                onRefresh={props.onRefresh}
            />
        </View>
    )
}

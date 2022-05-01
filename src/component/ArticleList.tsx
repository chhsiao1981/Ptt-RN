import React from "react"
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { ArticleSummary } from "../model/article"
import ArticleListItem from "./ArticleListItem"
import styles from './ArticleList.style'

import FlatList, { ItemLayout } from './FlatList'
import { ITEM_HEIGHT } from "./constants"

type Props = {
    articles: ArticleSummary[]
    scrollDownThreshold?: number
    scrollDown?: () => any
    scrollUpThreshold?: number
    scrollUp?: () => any
    scroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
    initialScrollIndex?: number
    isHighlight?: boolean
    accessibilityLabel?: string
    isWithPrepend?: boolean
}

export default (props: Props) => {
    // @ts-ignore
    let getItemLayout = (_?: ArticleSummary[] | null, index: number): ItemLayout => {
        return {
            length: ITEM_HEIGHT,
            offset: index * ITEM_HEIGHT,
            index: index,
        }
    }

    return (
        <View style={styles.page}>
            <FlatList<ArticleSummary>
                data={props.articles}
                renderItem={(each) => (<ArticleListItem key={each.index} article={each.item} isHighlight={props.isHighlight} />)}
                onBeginReached={props.scrollUp}
                onBeginReachedThreshold={props.scrollUpThreshold}
                onEndReached={props.scrollDown}
                onEndReachedThreshold={props.scrollDownThreshold}
                onScroll={props.scroll}
                initialNumToRender={30}
                accessibilityLabel={props.accessibilityLabel}
                getItemLayout={getItemLayout}
                initToEnd={true}
                isWithPrepend={props.isWithPrepend}
            />
        </View>
    )
}

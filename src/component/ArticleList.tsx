import React from "react"
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ArticleSummary } from "../model/article"
import ArticleListItem from "./ArticleListItem"

import { FlatList } from 'react-native-bidirectional-infinite-scroll'
import { ITEM_HEIGHT } from "./constants"

type Props = {
    articles: ArticleSummary[]
    onEndReachedThreshold?: number
    onEndReached?: () => Promise<void>
    onStartReachedThreshold?: number
    onStartReached?: () => Promise<void>
    onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
    isHighlight?: boolean
    accessibilityLabel?: string
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

    let emptyFn = async () => {
    }

    let onStartReached = props.onStartReached || emptyFn
    let onEndReached = props.onEndReached || emptyFn

    return (
        <FlatList<ArticleSummary>
            data={props.articles}
            renderItem={(each) => (<ArticleListItem key={each.index} article={each.item} isHighlight={props.isHighlight} />)}
            onStartReached={onStartReached}
            onStartReachedThreshold={props.onStartReachedThreshold}
            onEndReached={onEndReached}
            onEndReachedThreshold={props.onEndReachedThreshold}
            onScroll={props.onScroll}
            accessibilityLabel={props.accessibilityLabel}
            getItemLayout={getItemLayout}
        />
    )
}

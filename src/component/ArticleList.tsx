import React, { useEffect, useRef, useState } from "react"
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ArticleSummary } from "../model/article"
import ArticleListItem from "./ArticleListItem"

import { FlatList } from 'react-native-bidirectional-infinite-scroll'
import { ITEM_HEIGHT } from "./constants"
import articles from "../reducers/articles"
import Empty from "./Empty"

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
    let ref = useRef()
    const [theLayout, setTheLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [theContentSize, setTheContentSize] = useState({ width: 0, height: 0 })

    // @ts-ignore
    let getItemLayout = (_?: ArticleSummary[] | null, index: number): ItemLayout => {
        return {
            length: ITEM_HEIGHT,
            offset: index * ITEM_HEIGHT,
            index: index,
        }
    }

    let onLayout = (e: LayoutChangeEvent) => {
        const { layout } = e.nativeEvent
        setTheLayout({ x: layout.x, y: layout.y, width: layout.width, height: layout.height })
    }

    let onContentSizeChange = (width: number, height: number) => {
        setTheContentSize({ width: width, height: height })
    }

    let emptyFn = async () => {
    }
    let onStartReached = props.onStartReached || emptyFn
    let onEndReached = props.onEndReached || emptyFn

    if (!props.articles.length) {
        return <Empty />
    }

    return (
        <FlatList<ArticleSummary>
            ref={ref}
            data={props.articles}
            renderItem={(each) => (<ArticleListItem key={each.index} article={each.item} isHighlight={props.isHighlight} />)}
            onStartReached={onStartReached}
            onStartReachedThreshold={props.onStartReachedThreshold}
            onEndReached={onEndReached}
            onEndReachedThreshold={props.onEndReachedThreshold}
            onScroll={props.onScroll}
            accessibilityLabel={props.accessibilityLabel}
            getItemLayout={getItemLayout}
            onLayout={onLayout}
            initialScrollIndex={props.articles.length - 1}
            onContentSizeChange={onContentSizeChange}
            maintainVisibleContentPosition={true}
            windowSize={21}
        />
    )
}

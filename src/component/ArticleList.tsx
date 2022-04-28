import React, { useEffect, useState, useRef } from "react"
import { View, Dimensions } from 'react-native'
import { ArticleSummary } from "../model/article"
import ArticleListItem from "./ArticleListItem"
import styles from './ArticleList.style'
import articles from "../reducers/articles"

import FlatList from '../component/FlatList'

type Props = {
    articles: ArticleSummary[]
    scrollDown: () => any
    scrollUp: () => any
    isInit: boolean
    id: string
}

const ITEM_HEIGHT = 50 + 16

export default (props: Props) => {
    return (
        <View style={styles.page}>
            <FlatList<ArticleSummary>
                ref={ref}
                data={props.articles}
                renderItem={(each) => (<ArticleListItem key={each.index} article={each.item} />)}
                itemHeight={ITEM_HEIGHT}
                onBeginReached={props.scrollUp}
                onEndReached={props.scrollDown}
            />
        </View>
    )
}

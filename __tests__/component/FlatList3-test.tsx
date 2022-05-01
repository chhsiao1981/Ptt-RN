import React, { useEffect, useState, useRef, Context } from "react"

import { Text, View, SafeAreaView, ViewabilityConfig } from 'react-native'
import { FlatListProps, NativeSyntheticEvent, NativeScrollEvent, ListRenderItemInfo, LayoutChangeEvent } from "react-native"
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { cleanup } from '@testing-library/react-native'
import { ArticleSummary } from '../../src/model/article'
import FlatList, { ItemLayout } from '../../src/component/FlatList'
import { Articles } from "../../src/reducers/articles"
import { ITEM_HEIGHT } from "../../src/component/constants"

describe('flatlist-3', () => {
    afterEach(cleanup)

    let data: ArticleSummary[] = [...Array(50).keys()]
        .map((each, idx) => ({
            height: 50,
            offsetHeight: 0,
            bid: 'the_bid',
            aid: `the_aid_${idx + 50}`,
            deleted: false,
            create_time: 1234567890 + idx + 50,
            modified: 1234567890 + idx + 50,
            recommend: 0,
            n_comments: 0,
            owner: '',
            title: `title - ${idx + 50} `,
            money: 0,
            class: '',
            mode: 0,
            url: '',
            read: true,
            idx: `${idx + 50} `,
            rank: 0,
            subject_type: 0,
        }))

    let renderItem = (each: ListRenderItemInfo<ArticleSummary>) => {
        return (<Text style={{ height: each.item.height }} accessibilityRole={'text'}>{each.item.title}</Text>)
    }

    it('should render correctly', () => {
        const ret = render(<FlatList data={data} renderItem={renderItem} />)
    })

    let viewabilityConfig: ViewabilityConfig = {
        itemVisiblePercentThreshold: 0.1,
        minimumViewTime: 0,
        waitForInteraction: false,
    }

    // @ts-ignore
    let getItemLayout = (_?: ArticleSummary[] | null, index: number): ItemLayout => {
        return {
            length: ITEM_HEIGHT,
            offset: index * ITEM_HEIGHT,
            index: index,
        }
    }

    it('should on scroll', async () => {
        const ret = render(<FlatList data={data} renderItem={renderItem} accessibilityLabel={'flatlist'} getItemLayout={getItemLayout} />)

        const flatlist = ret.getByA11yLabel('flatlist')
        let eventData = {
            nativeEvent: {
                layout: {
                    x: 10,
                    y: 10,
                    width: 310,
                    height: 699,
                }
            }
        }
        const texts = ret.getAllByA11yRole('text')
        fireEvent(flatlist, 'contentSizeChange', 310, data[data.length - 1].offsetHeight + data[data.length - 1].height)
        fireEvent(flatlist, 'layout', eventData)
        texts.map((each) => fireEvent(each, 'layout', eventData))

        ret.debug()
    })

})

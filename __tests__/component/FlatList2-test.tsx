import React from 'react'
import { ListRenderItemInfo, Text, View, SafeAreaView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { cleanup } from '@testing-library/react-native'
import { DisplayItem } from '../../src/model/displayitem'
import { ArticleSummary } from '../../src/model/article'
import FlatList from '../../src/component/FlatList'
import ArticleListItem from '../../src/component/ArticleListItem'
import { NativeScreen } from 'react-native-screens'

describe('flatlist', () => {
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
            title: `title-${idx + 50}`,
            money: 0,
            class: '',
            mode: 0,
            url: '',
            read: true,
            idx: `${idx + 50}`,
            rank: 0,
            subject_type: 0,
        }))

    let data2: ArticleSummary[] = [...Array(100).keys()]
        .map((each, idx) => ({
            height: 50,
            offsetHeight: 0,
            bid: 'the_bid',
            aid: `the_aid_${idx}`,
            deleted: false,
            create_time: 1234567890 + idx,
            modified: 1234567890 + idx,
            recommend: 0,
            n_comments: 0,
            owner: '',
            title: `title-${idx}`,
            money: 0,
            class: '',
            mode: 0,
            url: '',
            read: true,
            idx: `${idx}`,
            rank: 0,
            subject_type: 0,
        }))

    let offsetHeight = 0
    data.map((each) => {
        each.offsetHeight = offsetHeight
        offsetHeight += each.height
    })

    let offsetHeight2 = 0
    data2.map((each) => {
        each.offsetHeight = offsetHeight2
        offsetHeight2 += each.height
    })

    let renderItem = (each: ListRenderItemInfo<ArticleSummary>) => {
        return (<Text style={{ height: each.item.height }} accessibilityLabel={`text-${each.index}`} accessibilityRole={'text'}>{each.item.title}</Text>)
    }

    let onBeginIdxReached = jest.fn()

    let onEndIdxReached = jest.fn()

    it('with initIdxToScroll === 91', async () => {
        let onEndReached = (...params: any[]) => {
            console.log('FlastList2-test.onEndReached: params:', params)
        }

        let onLayout = (...params: any[]) => {
            console.log('FlastList2-test: onLayout: params:', params)
        }

        const ret = render(
            <FlatList<ArticleSummary>
                data={data2}
                renderItem={renderItem}
                initToEnd={true}
                onEndReached={onEndReached}
                accessibilityLabel={'flat-list'}
                onLayout={onLayout}
                initialScrollIndex={40}
            />
        )
        let theFlatList = ret.getByA11yLabel('flat-list')
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
        fireEvent(theFlatList, 'layout', eventData)

        await waitFor(() => expect(ret.getByA11yLabel('text-91')).toHaveLength, { timeout: 3000 })

        //ret.debug()
        /*
        let eventData = {
            nativeEvent: {
                contentOffset: {
                    x: 150,
                    y: 5002,
                },
                contentSize: {
                    x: 10,
                    y: 10,
                    width: 300,
                    height: data2.length * 50,
                },
                layoutMeasurement: {
                    width: 310,
                    height: 699,
                },
            }
        }
        fireEvent.scroll(theFlatList, eventData)
        */

        //ret.debug()
        //expect(onEndReached).toHaveBeenCalled()
    })
})
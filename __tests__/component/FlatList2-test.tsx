import React, { useEffect, useState, useRef, Context } from "react"

import { Text, View, SafeAreaView, FlatList, ViewabilityConfig } from 'react-native'
import { FlatListProps, NativeSyntheticEvent, NativeScrollEvent, ListRenderItemInfo, LayoutChangeEvent } from "react-native"
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { cleanup } from '@testing-library/react-native'
import { ArticleSummary } from '../../src/model/article'
import ArticleListItem from '../../src/component/ArticleListItem'
import { Articles } from "../../src/reducers/articles"
import { ITEM_HEIGHT } from "../../src/component/constants"

describe('flatlist-2', () => {
    afterEach(cleanup)

    type ItemLayout = {
        length: number
        offset: number
        index: number
    }

    type ScrollToIndexFailedParams = {
        index: number
        highestMeasuredFrameIndex: number
        averageItemLength: number
    }

    let MyFlatList = (props: FlatListProps<ArticleSummary>) => {
        const [theLayout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
        let ref = useRef()
        useEffect(() => {
            if (!ref || !ref.current) {
                return
            }

            if (!props.data || !props.data.length) {
                return
            }
            if (!theLayout.height) {
                return
            }

            console.log('flatlist-3: to scrollToIndex')
            // @ts-ignore
            ref.current.scrollToIndex({ index: 30, animated: false })

        }, [ref, props.data, theLayout])

        // @ts-ignore
        let getItemLayout = (data?: ArticleSummary[] | null, idx: number): ItemLayout => {
            //console.log('getItemLayout: start: idx:', idx)
            if (props.getItemLayout) {
                return props.getItemLayout(data, idx)
            }

            let theData = data || []
            let theIdx = idx
            let theHeight = 0
            let theOffset = theHeight * theIdx

            if (theIdx >= 0 && theIdx < theData.length) {
                let theItem = theData[theIdx]
                theHeight = theItem.height ? theItem.height : theHeight
                theOffset = theItem.offsetHeight ? theItem.offsetHeight : theOffset
            }

            console.log('getItemLayout: idx:', idx, 'length:', theHeight, 'offset:', theOffset, 'index:', theIdx)
            return {
                length: theHeight,
                offset: theOffset,
                index: theIdx,
            }
        }


        let onLayout = (e: LayoutChangeEvent) => {
            const { layout } = e.nativeEvent
            console.log(`onLayout(${props.accessibilityLabel}): layout: `, layout)
            setLayout({ x: layout.x, y: layout.y, width: layout.width, height: layout.height })

            if (props.onLayout) {
                props.onLayout(e)
            }
            console.log(`onLayout(${props.accessibilityLabel}): done`)
        }

        let onScrollToIndexFailed = (err: ScrollToIndexFailedParams) => {
            console.log(`onScrollToIndexFailed(${props.accessibilityLabel}): err: `, err)
            /*
            setTimeout(() => {
                if (!props.data || !props.data.length) {
                    return
                }
                if (!ref || !ref.current) {
                    return
                }

                let data = props.data
                if (data.length <= err.index) {
                    return
                }
                // @ts-ignore
                ref.current.scrollToIndex({ index: err.index, animated: false })
            }, 100)
            */
        }

        let theProps = Object.assign({}, props)
        theProps.onLayout = onLayout
        theProps.getItemLayout = getItemLayout
        theProps.onScrollToIndexFailed = onScrollToIndexFailed

        return (
            <View>
                <FlatList ref={ref} {...theProps} />
            </View>
        )
    }

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

    let offsetHeight = 0
    data.map((each) => {
        each.offsetHeight = offsetHeight
        offsetHeight += each.height
    })

    let renderItem = (each: ListRenderItemInfo<ArticleSummary>) => {
        return (<Text style={{ height: each.item.height }} accessibilityRole={'text'}>{each.item.title}</Text>)
    }

    it('should render correctly', () => {
        const ret = render(<MyFlatList data={data} renderItem={renderItem} />)
    })

    let onScroll = jest.fn((...params: any[]) => {
        console.log('onScroll: start: params:', params)
    })

    let onLayout = jest.fn((...params: any[]) => {
        console.log('onLayout: start: params:', params)
    })

    const onViewableItemsChanged = (params: any) => {
        console.log('onViewableItemsChanged: params:', params)
    }

    const onContentSizeChanged = (width: number, height: number) => {
        console.log('onContentSizeChanged: width:', width, 'height:', height)
    }

    let viewabilityConfig: ViewabilityConfig = {
        itemVisiblePercentThreshold: 0.1,
        minimumViewTime: 0,
        waitForInteraction: false,
    }

    it('should on scroll', async () => {
        const ret = render(<MyFlatList data={data} renderItem={renderItem} onScroll={onScroll} onLayout={onLayout} accessibilityLabel={'flatlist'} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} onContentSizeChange={onContentSizeChanged} />)

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

        await waitFor(() => expect(ret.getAllByText('title - 80')).toHaveLength, { timeout: 2000 })

        ret.debug()
    })

})

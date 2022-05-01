import React, { useEffect, useState, useRef, Context } from "react"

import { FlatList, ListRenderItem, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, FlatListProps, View } from "react-native"
import { NativeScreen } from "react-native-screens"

import { DisplayItem } from "../model/displayitem"

export interface Prop<T extends DisplayItem> extends FlatListProps<T> {
    onBeginIdxReached?: (idx: ContentIndex) => void
    onBeginIdxReachedThreshold?: number
    onEndIdxReached?: (idx: ContentIndex) => void
    onEndIdxReachedThreshold?: number
    onTheScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>, idx: ContentIndex) => void
    initIdxToScroll?: number
    initIdxOffsetToScroll?: number
    initToEnd?: boolean
    accessibilityLabel?: string
}

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

export type ContentIndex = {
    index: number
    offset: number
}

type ContentSize = {
    width: number
    height: number
}

const INVALID_IDX = -1

type FlatListState = number
const FLATLIST_STATE_NONE: FlatListState = 0
const FLATLIST_STATE_BEGIN: FlatListState = 1
const FLATLIST_STATE_END: FlatListState = 2
const FLATLIST_STATE_OTHER: FlatListState = 3
const FlatListStateStr = (state: FlatListState): string => {
    switch (state) {
        case FLATLIST_STATE_NONE:
            return "NONE"
        case FLATLIST_STATE_BEGIN:
            return "BEGIN"
        case FLATLIST_STATE_END:
            return "END"
        case FLATLIST_STATE_OTHER:
            return "OTHER"
    }

    return '[invalid]'
}

const onViewableItemsChanged = (params: any) => {
    console.log('FlatList.onViewableItemsChanged: params:', params)
}

// FlatList
// An improved FlatList:
//
// 1. able to set onBeginIdxReached and onEndIdxReached
// 2. require items extends DisplayItem, including height and offsetHeight
// 4. able to go to the specified idx.
export default <T extends DisplayItem>(props: Prop<T>): JSX.Element => {
    const ref = useRef()
    const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [contentOffset, setContentOffset] = useState({ x: 0, y: 0 })
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 })
    const [contentIdx, setContentIdx] = useState({ index: -1, offset: -1 })
    const [onScrollState, setOnScrollState] = useState(FLATLIST_STATE_NONE)

    // able to init with specific idx
    //
    // assume:
    // 1.
    useEffect(() => {
        if (!ref || !ref.current) {
            return
        }
        if (!layout.height) {
            return
        }
        if (!props.data || !props.data.length) {
            return
        }
        let data = props.data

        if (typeof props.initIdxToScroll !== 'undefined' && props.initIdxToScroll >= 0 && props.initIdxToScroll < data.length) {
            if (props.initIdxToScroll === contentIdx.index) {
                console.log(`FlatList: (${props.accessibilityLabel || ''}) initIdxToScroll === theIdx: initIdxToScroll:`, props.initIdxToScroll, 'contentIdx:', contentIdx)
                return
            }

            let item = data[props.initIdxToScroll]
            console.log(`FlatList: (${props.accessibilityLabel || ''}) initIdxToScroll: `, props.initIdxToScroll, 'data:', data.length, 'offset:', item.offsetHeight, 'ref:', ref.current)
            // @ts-ignore
            //ref.current.scrollToOffset({ offset: item.offsetHeight, animated: false })

            ref.current.scrollToIndex({ index: props.initIdxToScroll, animated: false })

            return
        }

        if (!props.initToEnd) {
            return
        }

        let item = data[data.length - 1]
        // @ts-ignore
        console.log(`FlatList (${props.accessibilityLabel}): to initToEnd: data.length:`, data.length, 'offset:', item.offsetHeight, 'ref:', ref.current.scrollToEnd)
        if (typeof item.offsetHeight === 'undefined' || item.offsetHeight === null) {
            return
        }
        // @ts-ignore
        ref.current.scrollToEnd({ animated: false })
        setOnScrollState(FLATLIST_STATE_END)
    }, [ref, props.data, layout, props.initIdxToScroll])

    // able to scroll-up
    let onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        console.log(`FlatList.onScroll (${props.accessibilityLabel}): start`)
        const { contentOffset, contentSize } = e.nativeEvent

        let y = contentOffset.y
        if (y < 0) {
            y = 0
        } else if (y >= contentSize.height) {
            y = contentSize.height
        }

        // @ts-ignore
        let data = props.data || []
        if (!data.length) {
            return
        }
        //check contentSize aligned
        let lastData = data[data.length - 1]
        if (!(contentSize.height === lastData.offsetHeight + lastData.height)) {
            console.log(`FlatList.onScroll (${props.accessibilityLabel}): contentSize !== data: contentSize:`, contentSize.height, 'data:', lastData.offsetHeight, lastData.height, lastData.offsetHeight + lastData.height)
            return
        }

        //
        let theIdx: ContentIndex = data.reduce((r, each, i) => {
            if (each.offsetHeight <= y && each.offsetHeight + each.height >= y) {
                return { index: i, offset: y - each.offsetHeight }
            } else {
                return r
            }
        }, { index: -1, offset: -1 })

        console.log(`FlatList.onScroll (${props.accessibilityLabel}): y:`, y, 'theIdx:', theIdx, 'data:', data.map((each) => each.offsetHeight), 'contentSize:', contentSize, 'theState:', FlatListStateStr(onScrollState))
        setContentOffset({ x: contentOffset.x, y: contentOffset.y })
        setContentIdx(theIdx)

        // no data yet
        if (!props.data || !props.data.length) {
            return
        }

        //reached begin-data
        let origState = onScrollState
        let isBeginReached = theIdx.index <= (props.onBeginIdxReachedThreshold || 0)
        if (onScrollState !== FLATLIST_STATE_BEGIN && isBeginReached) {
            console.log(`FlatList.onScroll (${props.accessibilityLabel}): to set begin: origState:`, origState)
            setOnScrollState(FLATLIST_STATE_BEGIN)
            if (origState !== FLATLIST_STATE_NONE && props.onBeginIdxReached) {
                props.onBeginIdxReached(theIdx)
            }
        }

        let isEndReached = theIdx.index >= (data.length - 1 - (props.onEndIdxReachedThreshold || 0))
        if (onScrollState !== FLATLIST_STATE_END && isEndReached) {
            console.log(`FlatList.onScroll (${props.accessibilityLabel}): to set end: origState:`, origState)
            setOnScrollState(FLATLIST_STATE_END)
            if (origState !== FLATLIST_STATE_NONE && props.onEndIdxReached) {
                props.onEndIdxReached(theIdx)
            }
        }

        if (!isBeginReached && !isEndReached && onScrollState !== FLATLIST_STATE_OTHER) {
            console.log(`FlatList.onScroll (${props.accessibilityLabel}): to set other`)
            setOnScrollState(FLATLIST_STATE_OTHER)
        }

        if (props.onTheScroll) {
            props.onTheScroll(e, theIdx)
        }
    }

    let onScrollToIndexFailed = (err: ScrollToIndexFailedParams) => {
        console.log(`FlatList.onScrollToIndexFailed (${props.accessibilityLabel}): err:`, err)
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
    }

    let onLayout = (e: LayoutChangeEvent) => {
        const { layout } = e.nativeEvent
        console.log(`onLayout(${props.accessibilityLabel}): layout: `, layout)
        setLayout({ x: layout.x, y: layout.y, width: layout.width, height: layout.height })

        if (props.onLayout) {
            props.onLayout(e)
        }
        console.log('onLayout: done')
    }

    let onContentSizeChanged = (width: number, height: number) => {
        setContentSize({ width, height })
    }

    // @ts-ignore
    let getItemLayout = (data?: T[] | null, idx: number): ItemLayout => {
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

        // console.log('getItemLayout: idx:', idx, 'length:', theHeight, 'offset:', theOffset, 'index:', theIdx)

        return {
            length: theHeight,
            offset: theOffset,
            index: theIdx,
        }
    }

    let theProps = Object.assign({}, props)
    theProps.onScroll = onScroll
    theProps.onLayout = onLayout
    theProps.getItemLayout = getItemLayout

    let viewabilityConfig = {
        waitForInteraction: true,
        // At least one of the viewAreaCoveragePercentThreshold or itemVisiblePercentThreshold is required.
        viewAreaCoveragePercentThreshold: 95,
        //itemVisiblePercentThreshold: 75,
    }


    console.log(`FlatList (${props.accessibilityLabel}): to render: refreshing:`, props.refreshing, 'onRefresh:', props.onRefresh)
    return (
        <FlatList<T>
            ref={ref}
            accessibilityLabel={props.accessibilityLabel}
            data={props.data}
            renderItem={props.renderItem}
            onScroll={onScroll}
            onScrollToIndexFailed={onScrollToIndexFailed}

            getItemLayout={getItemLayout}
            onLayout={onLayout}

            onViewableItemsChanged={onViewableItemsChanged}

            initialScrollIndex={props.initialScrollIndex}
            initialNumToRender={props.initialNumToRender}

            refreshing={props.refreshing}
            onRefresh={props.onRefresh}

            onEndReached={props.onEndReached}
            onEndReachedThreshold={props.onEndReachedThreshold}

            viewabilityConfig={viewabilityConfig}
        />
    )
}

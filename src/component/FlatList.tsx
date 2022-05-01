import { emptyStatement, toSequenceExpression } from "@babel/types"
import React, { useEffect, useState, useRef, Context } from "react"
import invariant from 'invariant'

import { FlatList, ListRenderItem, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, FlatListProps, View, ViewBase } from "react-native"
import darkColors from "react-native-elements/dist/config/colorsDark"
import { NativeScreen, screensEnabled } from "react-native-screens"

import { DisplayItem } from "../model/displayitem"
import Empty from "./Empty"
import { setData } from "react-reducer-utils"

export interface Prop<T> extends FlatListProps<T> {
    onBeginReached?: ((info: { distanceFromBegin: number }) => void) | null | undefined
    onBeginReachedThreshold?: number | null | undefined

    /*
     * whether initialized with scroll-to-end
     * This is one-time setting, updated data wont scroll to end, unless data is reset (data is undefined, null, or length with 0).
     */
    initToEnd?: boolean

    /*
     * is the new data includes the prepended data
     * assuming that the original data is included in the new data.
     * no need to change isWithPrepend (isWithPrepend can still be true) if the data is not changed.
     */
    isWithPrepend?: boolean
}

export type ItemLayout = {
    length: number
    offset: number
    index: number
}

type DataOffset = {
    offset: number
    height: number
}

type ScrollToIndexParams = {
    animated?: boolean | null | undefined
    index: number
    viewOffset?: number | undefined
    viewPosition?: number | undefined
}

export type ScrollToIndexFailedParams = {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
}

type ContentIndex = {
    index: number
    offset: number
    dataLength: number
}

type ContentSize = {
    width: number
    height: number
}

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

// FlatList
// An improved FlatList:
//
// 1. able to set onBeginIdxReached and onEndIdxReached
// 2. require items extends DisplayItem, including height and offsetHeight
// 4. able to go to the specified idx.
export default function <T>(props: Prop<T>): JSX.Element {
    const ref = useRef()
    const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 })
    const [scrollContentOffset, setScrollContentOffset] = useState({ x: 0, y: 0 })
    const [scrollContentIdx, setScrollContentIdx] = useState({ index: 0, offset: 0, dataLength: 0 })
    const [onScrollState, setOnScrollState] = useState(FLATLIST_STATE_NONE)
    const [initScrollIndex, setInitScrollIndex] = useState(0)
    let emptyDataOffset: readonly DataOffset[] = []
    const [dataOffsets, setDataOffsets] = useState(emptyDataOffset)
    const [isInitedToEnd, setIsInitedToEnd] = useState(false)
    const [onScrollDataLength, setOnScrollDataLength] = useState(0)
    const [isContentSizeTooSmall, setIsContentSizeTooSmall] = useState(false)

    // must be with getItemLayout
    invariant(
        props.getItemLayout,
        'getItemLayout should be defined',
    )
    if (!props.getItemLayout) {
        return <Empty />
    }
    let getItemLayout = props.getItemLayout

    // able to init with specific idx
    //
    // assume:
    // 1.
    useEffect(() => {
        if (!ref || !ref.current) {
            console.log(`FlatList (${props.accessibilityLabel}): no ref`)
            return
        }
        if (!layout.height) {
            console.log(`FlatList (${props.accessibilityLabel}): no height`)
            return
        }
        if (!props.data || !props.data.length) {
            // reset data
            console.log(`FlatList (${props.accessibilityLabel}): no data: to reset`)
            if (scrollContentIdx.index !== 0 || scrollContentIdx.dataLength !== 0) {
                setScrollContentIdx({ index: 0, offset: 0, dataLength: 0 })
            }
            if (onScrollState !== FLATLIST_STATE_NONE) {
                setOnScrollState(FLATLIST_STATE_NONE)
            }
            if (initScrollIndex !== 0) {
                setInitScrollIndex(0)
            }
            if (dataOffsets.length) {
                setDataOffsets(emptyDataOffset)
            }
            if (isInitedToEnd) {
                setIsInitedToEnd(false)
            }
            return
        }
        let data = props.data

        // @ts-ignore
        let lastLayout = getItemLayout(data, data.length - 1)

        if (contentSize.height < lastLayout.offset + lastLayout.length) {
            console.log(`FlatList (${props.accessibilityLabel}): contentsize too small: contentSize:`, contentSize.height, 'data:', lastLayout.offset, lastLayout.length)
            setIsContentSizeTooSmall(true)
            return
        }
        setIsContentSizeTooSmall(false)

        // set data-offset.
        console.log(`FlatList.useEffect (${props.accessibilityLabel}): to check dataOffsets: dataOffsets:`, dataOffsets.length, 'data:', props.data.length)
        let origDataOffsetLength = dataOffsets.length
        if (origDataOffsetLength !== props.data.length) {
            let newDataOffsets = props.data.map((each, idx): DataOffset => {
                // @ts-ignore
                let eachLayout = getItemLayout(data, idx)
                return { offset: eachLayout.offset, height: eachLayout.length }
            })
            console.log(`FlatList (${props.accessibilityLabel}): to set dataOffsets`)
            setDataOffsets(newDataOffsets)
        }

        // reset on-scroll-state
        setOnScrollState(FLATLIST_STATE_NONE)

        // specified initScrollIndex
        if (typeof props.initialScrollIndex !== 'undefined' && props.initialScrollIndex !== null && props.initialScrollIndex !== initScrollIndex) {

            console.log(`FlatList (${props.accessibilityLabel}) (with initialScrollIndex): start: props.initializedScrollIndex:`, props.initialScrollIndex, 'data:', data.length)

            setInitScrollIndex(props.initialScrollIndex)

            // assuming continued from previous data
            let toScrollToIndex: ScrollToIndexParams = { index: props.initialScrollIndex, viewOffset: -scrollContentIdx.offset, animated: false }

            console.log(`FlatList (${props.accessibilityLabel}) (with initialScrollIndex): to scroll-to-index:`, toScrollToIndex)
            // @ts-ignore
            ref.current.scrollToIndex(toScrollToIndex)
            return
        }

        // continued from previous data
        if (props.isWithPrepend && props.data.length !== origDataOffsetLength) {
            let diffIndex = props.data.length - origDataOffsetLength
            let toScrollToIndex: ScrollToIndexParams = { index: scrollContentIdx.index + diffIndex, viewOffset: -scrollContentIdx.offset, animated: false }

            console.log(`FlatList (${props.accessibilityLabel}) (isWithPrepend): to scroll-to-index:`, toScrollToIndex, 'scrollContentIdx:', scrollContentIdx.index, 'diffIndex:', diffIndex)
            // @ts-ignore
            ref.current.scrollToIndex(toScrollToIndex)
            return
        }

        if (props.initToEnd && !isInitedToEnd) {
            setIsInitedToEnd(true)

            let toScrollToIndex: ScrollToIndexParams = { index: props.data.length - 1, viewOffset: 0, animated: false }

            console.log(`FlatList (${props.accessibilityLabel}) (init-to-end): to scroll-to-index:`, toScrollToIndex)
            // @ts-ignore
            ref.current.scrollToIndex(toScrollToIndex)
        }

        // set default scroll-content-idx
        if (scrollContentIdx.dataLength === 0 && !props.initialScrollIndex) {
            let toScrollContentIdx = { index: 0, offset: 0, dataLength: props.data.length }
            console.log(`FlatList (${props.accessibilityLabel}) (isWithPrepend): to set scroll-content-idx:`, toScrollContentIdx)
            setScrollContentIdx(toScrollContentIdx)
        }
    }, [ref, props.data, layout, contentSize, props.initialScrollIndex])

    // customized on-scroll.
    // setting contentOffset, scroll-content-idx
    let onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        console.log(`FlatList.onScroll (${props.accessibilityLabel}): start`)
        const { contentOffset, contentSize } = e.nativeEvent

        if (!dataOffsets.length) {
            if (onScrollDataLength) {
                setOnScrollDataLength(0)
            }
            return
        }

        let y = contentOffset.y
        let origOnScrollDataLength = onScrollDataLength
        if (origOnScrollDataLength < dataOffsets.length && props.isWithPrepend) {
            let diffLength = dataOffsets.length - onScrollDataLength
            y += dataOffsets[diffLength].offset
        }
        setOnScrollDataLength(dataOffsets.length)

        console.log(`FlatList.onScroll (${props.accessibilityLabel}): to check y: y:`, y, 'contentOffset.y:', contentOffset.y, 'contentSize.height:', contentSize.height)
        if (y < 0) {
            y = 0
        } else if (y >= contentSize.height) {
            y = dataOffsets[dataOffsets.length - 1].offset + dataOffsets[dataOffsets.length - 1].height * 0.99
        }

        //
        let contentIdx: ContentIndex = dataOffsets.reduce((r, each, i) => {
            if (each.offset <= y && each.offset + each.height > y) {
                r.index = i
                r.offset = y - each.offset
                return r
            } else {
                return r
            }
        }, { index: 0, offset: 0, dataLength: dataOffsets.length })
        setScrollContentIdx(contentIdx)
        setScrollContentOffset({ x: contentOffset.x, y: contentOffset.y })

        if (isContentSizeTooSmall) {
            console.log(`FlatList.onScroll (${props.accessibilityLabel}): contentSize too small`)
            return
        }

        console.log(`FlatList.onScroll(${props.accessibilityLabel}): to check reach: y: `, y, 'contentIdx:', contentIdx, 'contentOffset:', contentOffset, 'data:', dataOffsets.map((each) => each.offset), 'contentSize:', contentSize, 'theState:', FlatListStateStr(onScrollState))
        //reached begin-data
        let origState = onScrollState
        let onBeginReachedThreshold = props.onBeginReachedThreshold ? (props.onBeginReachedThreshold * layout.height) : 2
        let isBeginReached = y <= onBeginReachedThreshold
        console.log(`FlatList.onScroll(${props.accessibilityLabel}): to check begin: origState: `, FlatListStateStr(origState), 'y:', y, 'onBeginReachedThreshold:', onBeginReachedThreshold, 'isBeginReached:', isBeginReached)
        if (origState !== FLATLIST_STATE_BEGIN && isBeginReached) {
            console.log(`FlatList.onScroll(${props.accessibilityLabel}): to set begin: origState: `, FlatListStateStr(origState))

            setOnScrollState(FLATLIST_STATE_BEGIN)
            if (origState !== FLATLIST_STATE_NONE && props.onBeginReached) {
                console.log(`FlatList.onScroll(${props.accessibilityLabel}): to onBeginReached`)
                props.onBeginReached({ distanceFromBegin: y })
            }
        }

        // reached end-data
        let onEndReachedThreshold = props.onEndReachedThreshold ? (props.onEndReachedThreshold * layout.height) : 2
        let distanceFromEnd = contentSize.height - y
        let isEndReached = distanceFromEnd <= onEndReachedThreshold
        console.log(`FlatList.onScroll(${props.accessibilityLabel}): to check end: origState: `, FlatListStateStr(origState), 'distanceFromEnd:', distanceFromEnd, 'onEndReachedThreshold:', onEndReachedThreshold, 'isEndReached:', isEndReached)

        if (origState !== FLATLIST_STATE_END && isEndReached) {
            console.log(`FlatList.onScroll(${props.accessibilityLabel}): to set end: origState: `, FlatListStateStr(origState))

            setOnScrollState(FLATLIST_STATE_END)
            if (origState !== FLATLIST_STATE_NONE && props.onEndReached) {
                props.onEndReached({ distanceFromEnd })
            }
        }

        // no beginReached and no endReached: set state as other
        if (!isBeginReached && !isEndReached && onScrollState !== FLATLIST_STATE_OTHER) {
            console.log(`FlatList.onScroll(${props.accessibilityLabel}): to set other`)
            setOnScrollState(FLATLIST_STATE_OTHER)
        }

        if (props.onScroll) {
            props.onScroll(e)
        }
    }

    // onScrollToIndexFailed
    let onScrollToIndexFailed = (err: ScrollToIndexFailedParams) => {
        console.log(`FlatList.onScrollToIndexFailed(${props.accessibilityLabel}): err: `, err)
        setTimeout(() => {
            if (!ref || !ref.current) {
                return
            }

            // data possibly already changed
            if (!props.data || !props.data.length || err.index >= props.data.length) {
                return
            }

            // try to scroll again
            // @ts-ignore
            ref.current.scrollToIndex({ index: err.index, animated: false })
        }, 100)

        if (props.onScrollToIndexFailed) {
            props.onScrollToIndexFailed(err)
        }
    }

    // setLayout
    let onLayout = (e: LayoutChangeEvent) => {
        const { layout } = e.nativeEvent
        console.log(`onLayout(${props.accessibilityLabel}): layout: `, layout)
        setLayout({ x: layout.x, y: layout.y, width: layout.width, height: layout.height })

        if (props.onLayout) {
            props.onLayout(e)
        }
        console.log('onLayout: done')
    }

    // setContentSize
    let onContentSizeChanged = (width: number, height: number) => {
        console.log(`onContentSize(${props.accessibilityLabel}): width: ${width} height: ${height}`)
        setContentSize({ width, height })
        if (props.onContentSizeChange) {
            props.onContentSizeChange(width, height)
        }
    }

    let theProps = Object.assign({}, props)
    theProps.onScroll = onScroll
    theProps.onLayout = onLayout
    theProps.onContentSizeChange = onContentSizeChanged
    theProps.onEndReached = null
    theProps.onEndReachedThreshold = null
    theProps.initialScrollIndex = null
    theProps.onScrollToIndexFailed = onScrollToIndexFailed

    let viewabilityConfig = Object.assign({}, { waitForInteraction: true }, props.viewabilityConfig)
    if (!viewabilityConfig.viewAreaCoveragePercentThreshold && !viewabilityConfig.itemVisiblePercentThreshold) {
        viewabilityConfig.itemVisiblePercentThreshold = 95
    }

    return (
        <FlatList<T>
            ref={ref}
            viewabilityConfig={viewabilityConfig}
            {...theProps}
        />
    )
}

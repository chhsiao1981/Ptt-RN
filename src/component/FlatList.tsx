import React, { useEffect, useState, useRef } from "react"

import { FlatList, ListRenderItem, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from "react-native"

import { DisplayItem } from "../model/displayitem"

export type Prop<T extends DisplayItem> = {
    data: readonly T[]
    renderItem: ListRenderItem<T>
    itemHeight: number
    initScrollToIdx?: number
    onBeginReached?: (idx: number) => void
    onBeginReachedThreshold?: number
    onEndReached?: (idx: number) => void
    onEndReachedThreshold?: number
    styles?: any
}

type ItemLayout = {
    length: number
    offset: number
    index: number
}

const INVALID_IDX = -1

// FlatList
// An improved FlatList:
//
// 1. able to set onBeginReached
// 2. require items extends DisplayItem, including height and offsetHeight
// 4. able to go to the specified idx.
export default function <T extends DisplayItem>(props: Prop<T>): JSX.Element {
    const ref = useRef()
    const [idxToScroll, setIdxToScroll] = useState(INVALID_IDX)
    const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [contentOffset, setContentOffset] = useState({ x: 0, y: 0, theIdx: 0 })

    useEffect(() => {
        if (typeof props.initScrollToIdx === 'undefined') {
            return
        }
        if (props.initScrollToIdx < 0) {
            return
        }
        setIdxToScroll(props.initScrollToIdx)
    }, [props.initScrollToIdx])

    // able to init with specific idx
    useEffect(() => {
        if (!ref) {
            return
        }
        if (!ref.current) {
            return
        }
        if (idxToScroll < 0) {
            return
        }
        if (idxToScroll >= props.data.length) {
            return
        }
        let item = props.data[idxToScroll]
        // @ts-ignore
        ref.current.scrollToOffset(item.offsetHeight)
        setIdxToScroll(INVALID_IDX)
    }, [ref, idxToScroll, props.data])

    // able to scroll-up
    let onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset } = e.nativeEvent

        let y = contentOffset.y
        if (y < 0) {
            y = 0
        } else if (y >= layout.height) {
            y = layout.height
        }

        // @ts-ignore
        let theIdx = data.reduce((r, each, i) => {
            if (each.offsetHeight <= y && each.offsetHeight + each.height >= y) {
                return i
            } else {
                return r
            }
        }, -1)
        setContentOffset({ x: contentOffset.x, y: contentOffset.y, theIdx })

        // no data yet
        if (!props.data.length) {
            return
        }

        //reached begin-data
        let onBeginReachedThreshold = props.onBeginReachedThreshold || 0
        if (contentOffset.y < onBeginReachedThreshold && props.onBeginReached) {
            props.onBeginReached(theIdx)
        }
    }

    // scroll-down
    let onEndReached = (_: { distanceFromEnd: number }) => {
        if (props.onEndReached) {
            props.onEndReached(contentOffset.theIdx)
        }
    }

    let onLayout = (e: LayoutChangeEvent) => {
        const { layout } = e.nativeEvent
        setLayout({ x: layout.x, y: layout.y, width: layout.width, height: layout.height })
    }

    let getItemLayout = <T extends DisplayItem>(data?: T[] | null, idx?: number): ItemLayout => {
        let theData = data || []
        let theIdx = idx || -1
        let theHeight = props.itemHeight || 0
        let theOffset = theHeight * theIdx

        if (theIdx >= 0 && theIdx < theData.length) {
            let theItem = theData[theIdx]
            theHeight = theItem.height ? theItem.height : theHeight
            theOffset = theItem.offsetHeight ? theItem.offsetHeight : theOffset
        }

        return {
            length: theHeight,
            offset: theOffset,
            index: theIdx,
        }
    }

    return (
        <FlatList<T>
            ref={ref /* @ts-ignore */}
            data={props.data}
            renderItem={props.renderItem}
            onScroll={onScroll}
            getItemLayout={getItemLayout}
            onLayout={onLayout}
            onEndReached={onEndReached}
            onEndReachedThreshold={props.onEndReachedThreshold}
        />
    )
}

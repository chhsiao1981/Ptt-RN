import React, { useEffect, useState } from "react"
import { ActivityIndicator, Platform, View } from "react-native"
import BoardList from "../component/BoardList"
import styles from './PopularBoards.style'
import { SearchBar } from 'react-native-elements'
import { $t } from "../i18n"

import * as DoPopularBoards from '../reducers/popularBoards'

import { PopularBoards } from "../reducers/popularBoards"

import { useReducer, getRootState } from 'react-reducer-utils'

import Empty from '../component/Empty'
import IOSHeader from "../component/IOSHeader"

type Props = {
    history: any
}

export default (props: Props) => {
    const [search, setSearch] = useState('')
    const [statePopularBoards, doPopularBoards] = useReducer(DoPopularBoards)

    useEffect(() => {
        doPopularBoards.init(doPopularBoards)
    }, [])

    console.log('Platform.OS:', Platform.OS)

    //get me
    let me_q = getRootState<PopularBoards>(statePopularBoards)
    let isLoading = me_q?.isLoading
    useEffect(() => {
    }, [isLoading])

    if (!me_q) {
        return <Empty />
    }
    let me = me_q

    // render
    return (
        <View style={[styles.container]}>
            <IOSHeader />
            <SearchBar
                style={styles.searchBar}
                placeholder={$t('board.searchBoard')}
                // @ts-ignore
                onChangeText={search => setSearch(search)}
                value={search}
            />
            <BoardList boards={me.boards || []} history={props.history} search={search} />
            {isLoading && <ActivityIndicator size="large" style={{ backgroundColor: '#000' }} />}
        </View>
    )
}

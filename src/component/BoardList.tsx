import React, { useEffect, useState } from "react"
import { FlatList, View } from "react-native"
import { BoardSummary } from "../model/board"
import BoardListItem from "./BoardListItem"
import styles from './BoardList.style'

type Props = {
    boards: BoardSummary[]
    search: string
    history: any
}

// TODO: Handle infinite pulling paging

export default (props: Props) => {
    const [displayBoards, setDisplayBoards] = useState(props.boards)

    useEffect(() => {
        setDisplayBoards(
            props.boards.filter((board) => board.brdname.toLowerCase().indexOf(props.search.toLowerCase()) >= 0)
        )
    }, [props.boards, props.search])

    return (
        <View style={styles.page}>
            <FlatList<BoardSummary> data={displayBoards}
                renderItem={(each) => <BoardListItem idx={each.index} board={each.item} />} />
        </View>
    )
}

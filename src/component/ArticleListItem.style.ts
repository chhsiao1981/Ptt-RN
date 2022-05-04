import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    listItem: {
        flex: 1,
        marginVertical: 8,
        marginHorizontal: 14,
        height: 70,
    },
    text: {
        color: 'white'
    },
    highlight: {
        color: 'yellow'
    },
    primaryText: {
        flex: 1,
        fontSize: 18
    },
    secondaryText: {
        fontSize: 16,
        color: '#AAA',
        marginRight: 10
    },
    title: {
        color: '#AAA',
        fontSize: 10
    },
    firstRow: {
        flexDirection: 'row',
        textAlignVertical: 'center'
    },
    secondRow: {
        flexDirection: 'row',
    },
    blankRow: {
        flexDirection: 'row',
        height: 20,
    },
    thirdRow: {
        flexDirection: 'row',
    },
    icon: {
        color: 'white',
        marginRight: 3,
        textAlignVertical: 'center'
    }
})

export default styles

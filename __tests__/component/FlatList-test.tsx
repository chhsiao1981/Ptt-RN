import React from 'react'
import { ListRenderItemInfo, Text, View, SafeAreaView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { cleanup } from '@testing-library/react-native'
import { ArticleSummary } from '../../src/model/article'
import FlatList from '../../src/component/FlatList'
import ArticleListItem from '../../src/component/ArticleListItem'

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
        return (<Text style={{ height: each.item.height }} accessibilityRole={'text'}>{each.item.title}</Text>)
    }

    let onBeginIdxReached = jest.fn()

    let onEndIdxReached = jest.fn()

    it('with default initialScrollIndex', () => {
        const ret = render(
            <FlatList<ArticleSummary>
                data={data}
                renderItem={renderItem}
                accessibilityLabel={'flat-list'}
            />
        )

        let flatlist = ret.container
        let theFlatList = ret.getByA11yLabel('flat-list')
        let texts1 = ret.getAllByRole('text')
        expect(texts1).toHaveLength(10)
        let textFirst = texts1[0]
        expect(textFirst.children).toStrictEqual(['title-50'])
        let textLast = texts1[texts1.length - 1]
        expect(textLast.children).toStrictEqual(['title-59'])
    })

    it('with initialScrollIndex === 0', () => {
        const ret = render(
            <FlatList<ArticleSummary>
                data={data}
                renderItem={renderItem}
                initialScrollIndex={0}
                accessibilityLabel={'flat-list'}
            />
        )

        let flatlist = ret.container
        let theFlatList = ret.getByA11yLabel('flat-list')
        let texts1 = ret.getAllByRole('text')
        expect(texts1).toHaveLength(10)
        let textFirst = texts1[0]
        expect(textFirst.children).toStrictEqual(['title-50'])
        let textLast = texts1[texts1.length - 1]
        expect(textLast.children).toStrictEqual(['title-59'])
    })

    it('with initialScrollIndex === 30', () => {
        const ret = render(
            <FlatList<ArticleSummary>
                data={data}
                renderItem={renderItem}
                initialScrollIndex={30}
                accessibilityLabel={'flat-list'}
            />
        )

        let flatlist = ret.container
        let theFlatList = ret.getByA11yLabel('flat-list')
        let texts1 = ret.getAllByRole('text')
        expect(texts1).toHaveLength(10)
        let textFirst = texts1[0]
        expect(textFirst.children).toStrictEqual(['title-80'])
        let textLast = texts1[texts1.length - 1]
        expect(textLast.children).toStrictEqual(['title-89'])
    })

    it('with initialScrollIndex === 40', () => {
        const ret = render(
            <FlatList<ArticleSummary>
                data={data}
                renderItem={renderItem}
                initialScrollIndex={40}
                accessibilityLabel={'flat-list'}
            />
        )

        let flatlist = ret.container
        let theFlatList = ret.getByA11yLabel('flat-list')
        let texts1 = ret.getAllByRole('text')
        expect(texts1).toHaveLength(11)
        let textFirst = texts1[0]
        expect(textFirst.children).toStrictEqual(['title-89'])
        let textLast = texts1[texts1.length - 1]
        expect(textLast.children).toStrictEqual(['title-99'])
    })

})

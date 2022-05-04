import { init as _init, setData as _setData, createReducer, genUUID, getState } from 'react-reducer-utils'
import { $t } from '../i18n'

import articleApi from '../api/articleApi'

import { N_ARTICLES, REFRESH_N_ARTICLES } from './constants'
import { ArticleSummary } from '../model/article'
import { mergeList } from './utils'

import { DispatchedAction, State, Thunk, Dispatch, GetClassState } from 'react-reducer-utils'
import { Err, TheDate } from './utils'

const myClass = 'PttRN/ArticlesOfBoard'

export interface Articles extends State, Err, TheDate {
    articles?: ArticleSummary[]
    bottomArticles?: ArticleSummary[]
    allArticles?: ArticleSummary[]

    isLoading?: boolean
    isNotFirst?: boolean

    isPreEnd?: boolean
    isNextEnd?: boolean
    lastSearchTitle?: string
    lastPre?: string
    lastNext?: string

    preIdx?: string | null
    nextIdx?: string | null

    idxToScroll?: number
    displayIdx?: number

    isWithPrepend?: boolean
}

// init
export const init = (doMe: DispatchedAction<Articles>, bid: string, parentID?: string, doParent?: DispatchedAction<Articles>): Thunk<Articles> => {
    let myID = genUUID()
    let theDate = new Date()
    return (dispatch: Dispatch<Articles>, _: GetClassState<Articles>) => {
        dispatch(_init({ myID, myClass, doMe, parentID, doParent, state: { theDate } }))
        dispatch(getBottomArticles(myID, bid))
        dispatch(getArticles(myID, bid, '', '', true, false))
    }
}

const getBottomArticles = (myID: string, bid: string): Thunk<Articles> => {
    return (dispatch: Dispatch<Articles>, getClassState: GetClassState<Articles>) => (async () => {
        const [data_q, status, errmsg] = await articleApi.loadBottomArticles(bid)
        if (status !== 200) {
            dispatch(_setData(myID, errmsg))
            return
        }
        if (!data_q) {
            return
        }
        let data = data_q

        //console.log('getBottomArticles: after articleApi: bid:', bid, 'data:', data, 'status:', status, 'errmsg:', errmsg)

        let bottomArticles = data.list || []
        bottomArticles.map((each: ArticleSummary) => each.numIdx = -1)
        bottomArticles.map((each: ArticleSummary) => each.url = `/board/${bid}/article/${each.aid}`)

        let state = getClassState()
        let me_q = getState(state, myID)
        if (!me_q) {
            return
        }
        let me = me_q
        let articles = me.articles || []
        let isNextEnd = me.isNextEnd || false
        let lastSearchTitle = me.lastSearchTitle || ''

        let allArticles = (isNextEnd && !lastSearchTitle) ? articles.concat(bottomArticles) : articles

        //console.log('getBottomArticles: bottomArticles:', bottomArticles)

        let toUpdate: Articles = { bottomArticles, allArticles }
        // If regular article list is already loaded, add list length to scroll position

        dispatch(_setData(myID, toUpdate))
    })()
}

export const getArticles = (myID: string, bid: string, search: string, startIdx: string, desc: boolean, isExclude: boolean): Thunk<Articles> => {
    return (dispatch: Dispatch<Articles>, getClassState: GetClassState<Articles>) => (async () => {
        //check busy
        let state = getClassState()
        let me_q = getState(state, myID)
        if (!me_q) {
            return
        }
        let me = me_q
        let displayIdx = me.displayIdx || -1
        let myArticles = me.articles || []

        // check busy
        if (me.isLoading) {
            console.log('getArticles: isLoading:', me.isLoading)
            return
        }

        // check search title
        let lastSearchTitle = me.lastSearchTitle || ''
        let lastPre = me.lastPre || ''
        let lastNext = me.lastNext || ''
        let isPreEnd = me.isPreEnd || false
        let isNextEnd = me.isNextEnd || false
        let isNotFirst = me.isNotFirst || false
        if (search !== lastSearchTitle) {
            myArticles = []
            lastPre = ''
            lastNext = ''
            isPreEnd = false
            isNextEnd = false
            isNotFirst = false
        }

        // check end
        if (desc) {
            if (isPreEnd) {
                console.log('getArticles: isPreEnd:', me.isPreEnd)
                return
            }
        } else {
            if (isNextEnd) {
                console.log('getArticles: isNextEnd:', me.isNextEnd)
                return
            }
        }

        // check repeated
        if (desc) {
            if (isNotFirst && lastPre === startIdx) {
                console.log('getArticles: lastPre === startIdx:', me.lastPre, startIdx)
                return
            }
        } else {
            if (isNotFirst && lastNext === startIdx) {
                console.log('getArticles: lastNext === startIdx:', me.lastNext, startIdx)
                return
            }
        }

        let loadingUpdate: Articles = {
            isLoading: true,
        }
        if (displayIdx >= 0) {
            loadingUpdate.idxToScroll = displayIdx
        }
        dispatch(_setData(myID, loadingUpdate))
        let nArticles = me.articles?.length ? REFRESH_N_ARTICLES : N_ARTICLES
        const [data_q, status, errmsg] = await articleApi.loadArticles(bid, startIdx, nArticles, desc)
        if (status !== 200) {
            dispatch(_setData(myID, { err: $t(`errmsg.${errmsg}`), idxToScroll: displayIdx }))
            return
        }
        if (!data_q) {
            return
        }
        let data = data_q

        //console.log('getArticles: after articleApi: data:', data)

        state = getClassState()
        me_q = getState(state, myID)
        if (!me_q) {
            return
        }
        me = me_q
        let bottomArticles = me.bottomArticles || []

        // setup each article
        let articles = data.list || []
        articles.map((each: ArticleSummary) => each.url = `/board/${bid}/article/${each.aid}`)
        articles.map((each: ArticleSummary) => each.id = each.aid)

        let startNumIdx = 1

        // merge articles
        let newArticles = mergeList(myArticles, articles, desc, startNumIdx, isExclude)

        let idxToScroll = me.displayIdx || 0
        if (desc) {
            idxToScroll += articles.length
            if (idxToScroll >= newArticles.length) {
                idxToScroll = newArticles.length - 1
            }
            if (idxToScroll < 0) {
                idxToScroll = 0
            }
        }

        console.log('getArticles: displayIdx:', me.displayIdx, 'articles:', articles.length, 'idxToScroll:', idxToScroll, 'newArticles:', newArticles.length, 'desc:', desc)


        // to update
        let toUpdate: Articles = {
            lastSearchTitle: search,
            articles: newArticles,
            isLoading: false,

            lastPre: lastPre,
            lastNext: lastNext,
            isPreEnd: isPreEnd,
            isNextEnd: isNextEnd,
            isNotFirst: true,

            idxToScroll: idxToScroll,

            isWithPrepend: false
        }

        if (!desc) {
            toUpdate.nextIdx = data.next_idx
            toUpdate.lastNext = startIdx
            if (!data.next_idx) {
                toUpdate.isNextEnd = true
                isNextEnd = true
            }
            if (!startIdx) {
                console.log('getBottomArticles (!desc): no startIdx: isPreEnd')
                toUpdate.isPreEnd = true
                isPreEnd = true
            }
        } else {
            toUpdate.preIdx = data.next_idx
            toUpdate.lastPre = startIdx
            toUpdate.isLoading = false
            if (!data.next_idx) {
                console.log('getBottomArticles (desc): no next_idx: isPreEnd')
                toUpdate.isPreEnd = true
                isPreEnd = true
            }
            if (!startIdx) {
                toUpdate.isNextEnd = true
                isNextEnd = true
            }
            if (myArticles.length) {
                toUpdate.isWithPrepend = true
            }
        }

        let allArticles = (isNextEnd && !search) ? newArticles.concat(bottomArticles) : newArticles
        toUpdate.allArticles = allArticles

        dispatch(_setData(myID, toUpdate))
    })()
}

export const clean = (myID: string) => {
    return (dispatch: Dispatch<Articles>, _: GetClassState<Articles>) => {
        let toUpdate: Articles = {
            articles: [],
            bottomArticles: [],
            allArticles: [],

            isLoading: false,
            isNotFirst: false,

            isPreEnd: false,
            isNextEnd: false,
            lastSearchTitle: '',
            lastPre: '',
            lastNext: '',

            preIdx: '',
            nextIdx: '',

            idxToScroll: 0,
            displayIdx: -1,
        }

        dispatch(_setData(myID, toUpdate))
    }
}

export const setDisplayIdx = (myID: string, idx: number) => {
    return (dispatch: Dispatch<Articles>, _: GetClassState<Articles>) => {
        dispatch(_setData(myID, { displayIdx: idx }))
    }
}

export default createReducer()
